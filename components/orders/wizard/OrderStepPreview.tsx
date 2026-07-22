'use client';

import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  ClipboardList,
  Stethoscope,
  User,
} from 'lucide-react';
import type { ClinicTeamMemberDto } from '@/lib/api';
import type { DiagnosisSelection } from '@/components/prescriptions/DiagnosisAutocomplete';
import type { LocalOrderRequestItem } from '@/components/orders/OrderRequestStep';
import type { OrderSummaryCheck } from '@/components/orders/wizard/OrderSummarySidebar';
import {
  calcAge,
  CATEGORY_LABELS,
  genderLabel,
  orderTypeSummary,
  type OrderPatientDetail,
} from '@/components/orders/wizard/helpers';

type OrderStepPreviewProps = {
  clinicName?: string;
  selectedDoctor: ClinicTeamMemberDto | null;
  selectedPatient: OrderPatientDetail | null;
  primaryInsuranceName: string | null;
  affiliateNumber: string | null;
  requestItems: LocalOrderRequestItem[];
  selectedDiagnosis: DiagnosisSelection | null;
  dateDisplay: string;
  checks: OrderSummaryCheck[];
  canEmit: boolean;
};

export default function OrderStepPreview({
  clinicName,
  selectedDoctor,
  selectedPatient,
  primaryInsuranceName,
  affiliateNumber,
  requestItems,
  selectedDiagnosis,
  dateDisplay,
  checks,
  canEmit,
}: OrderStepPreviewProps) {
  const pending = checks.filter((c) => !c.complete);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {!canEmit && pending.length > 0 && (
        <div
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Completá los campos pendientes antes de emitir</p>
            <ul className="mt-2 list-inside list-disc text-amber-800">
              {pending.map((c) => (
                <li key={c.id}>{c.label}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
        <div className="border-b border-gray-100 bg-gradient-to-r from-teal-50/80 to-white px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Revisión final
              </p>
              <h3 className="mt-2 text-2xl font-bold text-gray-900">
                {clinicName ?? 'Centro médico'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Tipo: {orderTypeSummary(requestItems)}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <Building2 className="h-7 w-7" aria-hidden />
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1fr_240px]">
          <div className="space-y-5">
            <PreviewSection icon={User} title="Profesional">
              {selectedDoctor ? (
                <>
                  Dr/a. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  {selectedDoctor.licenseNumber && <> · Mat. {selectedDoctor.licenseNumber}</>}
                  {selectedDoctor.specialty && <> · {selectedDoctor.specialty}</>}
                </>
              ) : (
                '—'
              )}
            </PreviewSection>

            <PreviewSection icon={User} title="Paciente">
              {selectedPatient ? (
                <>
                  {selectedPatient.firstName} {selectedPatient.lastName}
                  {selectedPatient.dni && <> · DNI {selectedPatient.dni}</>}
                  {calcAge(selectedPatient.birthDate) && <> · {calcAge(selectedPatient.birthDate)}</>}
                  {genderLabel(selectedPatient.gender) && <> · {genderLabel(selectedPatient.gender)}</>}
                  <br />
                  {primaryInsuranceName ?? 'Particular'}
                  {affiliateNumber && <> · Afiliado {affiliateNumber}</>}
                </>
              ) : (
                '—'
              )}
            </PreviewSection>

            <PreviewSection icon={ClipboardList} title="Solicitudes">
              {requestItems.length === 0 ? (
                '—'
              ) : (
                <ul className="mt-1 space-y-2">
                  {requestItems.map((item) => (
                    <li
                      key={item.key}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                    >
                      <span className="text-xs font-medium text-teal-700">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                      <p className="mt-0.5 font-medium text-gray-900">{item.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </PreviewSection>

            <PreviewSection icon={Stethoscope} title="Diagnóstico">
              {selectedDiagnosis
                ? `${selectedDiagnosis.diagnosisCode} — ${selectedDiagnosis.diagnosisDescriptionEs}`
                : '—'}
            </PreviewSection>

            <PreviewSection icon={Calendar} title="Fecha">
              {dateDisplay || '—'}
            </PreviewSection>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Checklist
            </p>
            <ul className="mt-3 space-y-2.5">
              {checks.map((check) => (
                <li key={check.id} className="flex items-start gap-2 text-sm">
                  {check.complete ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                  )}
                  <span className={check.complete ? 'text-gray-900' : 'text-gray-600'}>
                    {check.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {title}
      </h4>
      <div className="mt-2 text-sm text-gray-900">{children}</div>
    </section>
  );
}
