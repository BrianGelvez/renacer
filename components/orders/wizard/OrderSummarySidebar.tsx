'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronUp,
  ClipboardList,
  Stethoscope,
  User,
} from 'lucide-react';
import type { ClinicTeamMemberDto } from '@/lib/api';
import type { DiagnosisSelection } from '@/components/prescriptions/DiagnosisAutocomplete';
import type { LocalOrderRequestItem } from '@/components/orders/OrderRequestStep';
import {
  calcAge,
  CATEGORY_LABELS,
  genderLabel,
  type OrderPatientDetail,
} from '@/components/orders/wizard/helpers';

export type OrderSummaryCheck = {
  id: string;
  label: string;
  complete: boolean;
  warning?: string | null;
};

type OrderSummarySidebarProps = {
  currentStep: number;
  totalSteps: number;
  selectedDoctor: ClinicTeamMemberDto | null;
  selectedPatient: OrderPatientDetail | null;
  primaryInsuranceName: string | null;
  affiliateNumber: string | null;
  requestItems: LocalOrderRequestItem[];
  selectedDiagnosis: DiagnosisSelection | null;
  dateDisplay: string;
  dateValid: boolean;
  checks: OrderSummaryCheck[];
  pendingCount: number;
};

function SummaryBody({
  currentStep,
  totalSteps,
  selectedDoctor,
  selectedPatient,
  primaryInsuranceName,
  affiliateNumber,
  requestItems,
  selectedDiagnosis,
  dateDisplay,
  dateValid,
  checks,
  pendingCount,
}: OrderSummarySidebarProps) {
  const progress = Math.round((currentStep / totalSteps) * 100);
  const completedChecks = checks.filter((c) => c.complete).length;

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Resumen inteligente</h2>
          <p className="mt-0.5 text-xs text-teal-700">
            Paso {currentStep}/{totalSteps} · {completedChecks}/{checks.length} listos
          </p>
        </div>
        <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-800">
          {progress}%
        </span>
      </div>

      <div
        className="mb-5 h-2 overflow-hidden rounded-full bg-white/80"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-teal-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {pendingCount > 0 && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {pendingCount} validación{pendingCount === 1 ? '' : 'es'} pendiente
            {pendingCount === 1 ? '' : 's'} para emitir
          </span>
        </div>
      )}

      <dl className="space-y-4">
        <SummaryBlock
          icon={User}
          label="Médico"
          complete={!!selectedDoctor}
          value={
            selectedDoctor
              ? `Dr/a. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`
              : null
          }
          detail={
            selectedDoctor
              ? [
                  selectedDoctor.specialty,
                  selectedDoctor.licenseNumber && `Mat. ${selectedDoctor.licenseNumber}`,
                  selectedDoctor.recetarioActive
                    ? 'Recetario activo'
                    : selectedDoctor.recetarioUserId
                      ? 'Recetario inactivo'
                      : 'Sin vincular Recetario',
                ]
                  .filter(Boolean)
                  .join(' · ')
              : null
          }
        />

        <SummaryBlock
          icon={User}
          label="Paciente"
          complete={!!selectedPatient}
          value={
            selectedPatient
              ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
              : null
          }
          detail={
            selectedPatient
              ? [
                  selectedPatient.dni && `DNI ${selectedPatient.dni}`,
                  calcAge(selectedPatient.birthDate),
                  genderLabel(selectedPatient.gender),
                ]
                  .filter(Boolean)
                  .join(' · ')
              : null
          }
        />

        {(primaryInsuranceName || affiliateNumber) && (
          <SummaryBlock
            icon={Stethoscope}
            label="Obra social"
            complete={!!primaryInsuranceName}
            value={primaryInsuranceName ?? 'Particular'}
            detail={affiliateNumber ? `Afiliado ${affiliateNumber}` : null}
          />
        )}

        <SummaryBlock
          icon={ClipboardList}
          label="Solicitudes"
          complete={requestItems.length > 0}
          value={
            requestItems.length > 0
              ? `${requestItems.length} solicitud${requestItems.length === 1 ? '' : 'es'}`
              : null
          }
          detail={
            requestItems.length > 0
              ? requestItems
                  .slice(0, 3)
                  .map((i) => i.description)
                  .join(' · ')
              : null
          }
        />

        <SummaryBlock
          icon={Stethoscope}
          label="Diagnóstico"
          complete={!!selectedDiagnosis?.diagnosisCode}
          value={
            selectedDiagnosis
              ? `${selectedDiagnosis.diagnosisCode} — ${selectedDiagnosis.diagnosisDescriptionEs}`
              : null
          }
        />

        <SummaryBlock
          icon={ClipboardList}
          label="Fecha"
          complete={dateValid}
          value={dateValid ? dateDisplay : null}
        />
      </dl>

      <div className="mt-6 border-t border-teal-100 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Checklist
        </p>
        <ul className="space-y-2">
          {checks.map((check) => (
            <li key={check.id} className="flex items-start gap-2 text-sm">
              {check.complete ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              ) : (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-300" />
              )}
              <span className={check.complete ? 'text-gray-900' : 'text-gray-500'}>
                {check.label}
                {check.warning && !check.complete && (
                  <span className="mt-0.5 block text-xs text-amber-700">{check.warning}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function SummaryBlock({
  icon: Icon,
  label,
  value,
  detail,
  complete,
}: {
  icon: typeof User;
  label: string;
  value: string | null;
  detail?: string | null;
  complete?: boolean;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {complete ? (
          <Check className="h-3.5 w-3.5 text-teal-700" aria-hidden />
        ) : (
          <Icon className="h-3.5 w-3.5 opacity-60" aria-hidden />
        )}
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm ${value ? 'font-medium text-gray-900' : 'italic text-gray-400'}`}
      >
        {value || 'Pendiente'}
      </dd>
      {detail && <dd className="mt-0.5 line-clamp-2 text-xs text-gray-500">{detail}</dd>}
    </div>
  );
}

export default function OrderSummarySidebar(props: OrderSummarySidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const completedChecks = props.checks.filter((c) => c.complete).length;

  return (
    <>
      <div className="fixed inset-x-0 bottom-[72px] z-30 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="mx-3 flex w-[calc(100%-1.5rem)] items-center justify-between rounded-2xl border border-teal-200 bg-teal-50/95 px-4 py-3 text-left shadow-lg backdrop-blur-sm"
          aria-expanded={mobileOpen}
        >
          <span>
            <span className="block text-sm font-semibold text-gray-900">Resumen</span>
            <span className="text-xs text-teal-800">
              {completedChecks}/{props.checks.length} completos
              {props.pendingCount > 0 ? ` · ${props.pendingCount} pendiente` : ''}
            </span>
          </span>
          <ChevronUp
            className={`h-5 w-5 text-gray-500 transition-transform ${mobileOpen ? '' : 'rotate-180'}`}
          />
        </button>
        {mobileOpen && (
          <div className="mx-3 mt-2 max-h-[50vh] overflow-y-auto rounded-2xl border border-teal-100 bg-teal-50/95 p-4 shadow-xl backdrop-blur-sm">
            <SummaryBody {...props} />
          </div>
        )}
      </div>

      <aside
        className="sticky top-24 hidden h-fit rounded-2xl border border-teal-100 bg-teal-50/60 p-5 lg:block"
        aria-label="Resumen de la orden"
      >
        <SummaryBody {...props} />
      </aside>
    </>
  );
}
