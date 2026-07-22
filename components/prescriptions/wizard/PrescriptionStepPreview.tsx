'use client';

import { Building2, Calendar, Pill, Stethoscope, User } from 'lucide-react';
import type { ClinicTeamMemberDto } from '@/lib/api';
import type { DiagnosisSelection } from '@/components/prescriptions/DiagnosisAutocomplete';
import type { MedicineLine, PatientDetail } from '@/components/prescriptions/wizard/helpers';

type PrescriptionStepPreviewProps = {
  clinicName?: string;
  clinicLogoUrl?: string | null;
  selectedDoctor: ClinicTeamMemberDto | null;
  selectedPatient: PatientDetail | null;
  primaryInsuranceName: string | null;
  selectedDiagnosis: DiagnosisSelection | null;
  clinicalNotes: string;
  filledMedicines: MedicineLine[];
  dateDisplay: string;
  hiv: boolean;
  recurringEnabled: boolean;
  recurringDays: number;
  recurringQuantity: number;
};

export default function PrescriptionStepPreview({
  clinicName,
  clinicLogoUrl,
  selectedDoctor,
  selectedPatient,
  primaryInsuranceName,
  selectedDiagnosis,
  clinicalNotes,
  filledMedicines,
  dateDisplay,
  hiv,
  recurringEnabled,
  recurringDays,
  recurringQuantity,
}: PrescriptionStepPreviewProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
        <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Vista previa de receta electrónica
              </p>
              <h3 className="mt-2 text-2xl font-bold text-gray-900">
                {clinicName ?? 'Centro médico'}
              </h3>
            </div>
            {clinicLogoUrl ? (
              <img
                src={clinicLogoUrl}
                alt=""
                className="h-14 w-14 rounded-xl border border-gray-100 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ensigna-accent-soft text-ensigna-primary">
                <Building2 className="h-7 w-7" aria-hidden />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 sm:px-8">
          <PreviewSection icon={User} title="Profesional">
            {selectedDoctor ? (
              <>
                Dr/a. {selectedDoctor.firstName} {selectedDoctor.lastName}
                {selectedDoctor.licenseNumber && (
                  <> · Mat. {selectedDoctor.licenseNumber}</>
                )}
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
                <br />
                Cobertura: {primaryInsuranceName ?? 'Particular'}
              </>
            ) : (
              '—'
            )}
          </PreviewSection>

          <PreviewSection icon={Stethoscope} title="Diagnóstico">
            {selectedDiagnosis ? (
              <>
                <span className="font-mono">{selectedDiagnosis.diagnosisCode}</span> —{' '}
                {selectedDiagnosis.diagnosisDescriptionEs}
                {clinicalNotes.trim() && (
                  <p className="mt-2 text-sm italic text-gray-500">
                    Obs. interna: {clinicalNotes.trim()}
                  </p>
                )}
              </>
            ) : (
              '—'
            )}
          </PreviewSection>

          <PreviewSection icon={Pill} title="Medicamentos">
            <ul className="space-y-3">
              {filledMedicines.map((m) => (
                <li
                  key={m.key}
                  className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3"
                >
                  <p className="font-semibold text-gray-900">{m.selection!.brand}</p>
                  <p className="text-sm text-gray-600">{m.selection!.drug}</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {m.posology} · Cantidad: {m.quantity}
                  </p>
                </li>
              ))}
            </ul>
          </PreviewSection>

          <PreviewSection icon={Calendar} title="Configuración">
            Fecha: {dateDisplay}
            {hiv && <> · Paciente VIH</>}
            {recurringEnabled && (
              <>
                <br />
                Recurrentes: cada {recurringDays} días × {recurringQuantity}
              </>
            )}
          </PreviewSection>
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 text-center text-xs text-gray-500 sm:px-8">
          Documento generado vía Recetario.com.ar · Revisá los datos antes de emitir
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
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-ensigna-primary" aria-hidden />
        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </h4>
      </div>
      <div className="text-sm leading-relaxed text-gray-900">{children}</div>
    </section>
  );
}
