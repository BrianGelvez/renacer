'use client';

import { useRef } from 'react';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  User,
  X,
} from 'lucide-react';
import type { ClinicTeamMemberDto } from '@/lib/api';
import CreatePatientModal from '@/components/dashboard/CreatePatientModal';
import {
  calcAge,
  genderLabel,
  type OrderPatientDetail,
  type PatientListItem,
} from '@/components/orders/wizard/helpers';

type OrderStepPatientProps = {
  doctorsLoading: boolean;
  activeDoctors: ClinicTeamMemberDto[];
  selectedDoctor: ClinicTeamMemberDto | null;
  doctorId: string;
  showDoctorPicker: boolean;
  onToggleDoctorPicker: () => void;
  onDoctorChange: (id: string) => void;
  clinicName?: string;
  patientLoading: boolean;
  selectedPatient: OrderPatientDetail | null;
  lockPatient: boolean;
  onClearPatient: () => void;
  patientTerm: string;
  onPatientTermChange: (value: string) => void;
  patientOpen: boolean;
  onPatientOpenChange: (open: boolean) => void;
  patientSearchLoading: boolean;
  patientHits: PatientListItem[];
  onSelectPatient: (hit: PatientListItem) => void;
  createPatientOpen: boolean;
  onCreatePatientOpenChange: (open: boolean) => void;
  onCreatePatientSuccess: (patientId: string) => void;
  primaryInsuranceName: string | null;
  affiliateNumber: string | null;
  stepError: string | null;
};

function RecetarioBadge({ doctor }: { doctor: ClinicTeamMemberDto }) {
  if (doctor.recetarioActive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        Recetario activo
      </span>
    );
  }
  if (doctor.recetarioUserId) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        Recetario inactivo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
      Sin vincular Recetario
    </span>
  );
}

export default function OrderStepPatient({
  doctorsLoading,
  activeDoctors,
  selectedDoctor,
  doctorId,
  showDoctorPicker,
  onToggleDoctorPicker,
  onDoctorChange,
  clinicName,
  patientLoading,
  selectedPatient,
  lockPatient,
  onClearPatient,
  patientTerm,
  onPatientTermChange,
  patientOpen,
  onPatientOpenChange,
  patientSearchLoading,
  patientHits,
  onSelectPatient,
  createPatientOpen,
  onCreatePatientOpenChange,
  onCreatePatientSuccess,
  primaryInsuranceName,
  affiliateNumber,
  stepError,
}: OrderStepPatientProps) {
  const patientBoxRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Profesional responsable
        </p>
        {doctorsLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Cargando equipo médico…
          </div>
        ) : activeDoctors.length === 0 ? (
          <p className="mt-4 text-sm text-amber-700">No hay médicos activos en la clínica.</p>
        ) : selectedDoctor ? (
          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-lg font-bold text-teal-800">
              {selectedDoctor.firstName?.[0]}
              {selectedDoctor.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-gray-900">
                Dr/a. {selectedDoctor.firstName} {selectedDoctor.lastName}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedDoctor.specialty && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs text-gray-600 shadow-sm">
                    <Stethoscope className="h-3.5 w-3.5" aria-hidden />
                    {selectedDoctor.specialty}
                  </span>
                )}
                {selectedDoctor.licenseNumber && (
                  <span className="rounded-lg bg-white px-2.5 py-1 text-xs text-gray-600 shadow-sm">
                    Mat. {selectedDoctor.licenseNumber}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <RecetarioBadge doctor={selectedDoctor} />
                {clinicName && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Building2 className="h-3.5 w-3.5" aria-hidden />
                    {clinicName}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">Seleccioná el profesional responsable.</p>
        )}
        {activeDoctors.length > 1 && (
          <button
            type="button"
            onClick={onToggleDoctorPicker}
            className="mt-4 inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cambiar profesional
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showDoctorPicker ? 'rotate-180' : ''}`}
            />
          </button>
        )}
        {showDoctorPicker && activeDoctors.length > 1 && (
          <select
            value={doctorId}
            onChange={(e) => onDoctorChange(e.target.value)}
            className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            aria-label="Seleccionar profesional"
          >
            <option value="">Seleccionar profesional…</option>
            {activeDoctors.map((d) => (
              <option key={d.userId} value={d.userId}>
                Dr/a. {d.firstName} {d.lastName}
                {d.specialty ? ` — ${d.specialty}` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Paciente</h3>
          <p className="mt-1 text-sm text-gray-500">
            Buscá por nombre, DNI o teléfono. Seleccioná para ver el perfil clínico.
          </p>
        </div>

        {patientLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : selectedPatient ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5 shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-lg font-bold text-teal-700 shadow-sm">
                  {selectedPatient.firstName?.[0]}
                  {selectedPatient.lastName?.[0]}
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-900">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    {selectedPatient.dni && (
                      <span className="rounded-lg bg-white px-2.5 py-1 text-gray-600 shadow-sm">
                        DNI {selectedPatient.dni}
                      </span>
                    )}
                    {calcAge(selectedPatient.birthDate) && (
                      <span className="rounded-lg bg-white px-2.5 py-1 text-gray-600 shadow-sm">
                        {calcAge(selectedPatient.birthDate)}
                      </span>
                    )}
                    {genderLabel(selectedPatient.gender) && (
                      <span className="rounded-lg bg-white px-2.5 py-1 text-gray-600 shadow-sm">
                        {genderLabel(selectedPatient.gender)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {!lockPatient && (
                <button
                  type="button"
                  onClick={onClearPatient}
                  className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 hover:text-gray-800"
                  aria-label="Cambiar paciente"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoTile
                label="Obra social"
                value={primaryInsuranceName ?? 'Particular'}
                sub={affiliateNumber ? `N° ${affiliateNumber}` : undefined}
              />
              {selectedPatient.notes && (
                <InfoTile label="Notas clínicas" value={selectedPatient.notes} />
              )}
            </div>
          </div>
        ) : (
          <div ref={patientBoxRef} className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="search"
              value={patientTerm}
              onChange={(e) => {
                onPatientTermChange(e.target.value);
                onPatientOpenChange(true);
              }}
              onFocus={() => onPatientOpenChange(true)}
              placeholder="Buscar por nombre, DNI o teléfono…"
              aria-label="Buscar paciente"
              aria-expanded={patientOpen}
              aria-controls="order-patient-search-results"
              className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 text-base shadow-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
            {patientSearchLoading && (
              <Loader2
                className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-teal-600"
                aria-hidden
              />
            )}
            {patientOpen && patientTerm.trim() && (
              <div
                id="order-patient-search-results"
                role="listbox"
                className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
              >
                {patientHits.length === 0 && !patientSearchLoading && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-gray-500">No se encontraron pacientes</p>
                    <button
                      type="button"
                      onClick={() => onCreatePatientOpenChange(true)}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      Crear paciente
                    </button>
                  </div>
                )}
                <ul className="max-h-72 overflow-y-auto">
                  {patientHits.map((p) => (
                    <li key={p.id} role="option">
                      <button
                        type="button"
                        onClick={() => onSelectPatient(p)}
                        className="flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-teal-50/60"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-sm font-semibold text-teal-800">
                          {p.firstName?.[0]}
                          {p.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {[p.dni && `DNI ${p.dni}`, calcAge(p.birthDate), p.phone]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                {patientHits.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onCreatePatientOpenChange(true)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      Crear paciente nuevo
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {stepError && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 lg:col-span-2"
          role="alert"
        >
          {stepError}
        </p>
      )}

      <CreatePatientModal
        open={createPatientOpen}
        onClose={() => onCreatePatientOpenChange(false)}
        onSuccess={onCreatePatientSuccess}
        navigateAfterCreate={false}
      />
    </div>
  );
}

function InfoTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
