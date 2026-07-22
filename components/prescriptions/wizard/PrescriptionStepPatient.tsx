'use client';

import { useRef } from 'react';
import {
  ChevronDown,
  Loader2,
  Plus,
  Search,
  Stethoscope,
  User,
  X,
} from 'lucide-react';
import type { ClinicTeamMemberDto } from '@/lib/api';
import {
  calcAge,
  type PatientDetail,
  type PatientListItem,
} from '@/components/prescriptions/wizard/helpers';

type PrescriptionStepPatientProps = {
  doctorsLoading: boolean;
  activeDoctors: ClinicTeamMemberDto[];
  selectedDoctor: ClinicTeamMemberDto | null;
  doctorId: string;
  showDoctorPicker: boolean;
  onToggleDoctorPicker: () => void;
  onDoctorChange: (id: string) => void;
  patientLoading: boolean;
  selectedPatient: PatientDetail | null;
  lockPatient: boolean;
  onClearPatient: () => void;
  patientTerm: string;
  onPatientTermChange: (value: string) => void;
  patientOpen: boolean;
  onPatientOpenChange: (open: boolean) => void;
  patientSearchLoading: boolean;
  patientHits: PatientListItem[];
  onSelectPatient: (hit: PatientListItem) => void;
  onCreatePatient: () => void;
  primaryInsuranceName: string | null;
  stepError: string | null;
};

export default function PrescriptionStepPatient({
  doctorsLoading,
  activeDoctors,
  selectedDoctor,
  doctorId,
  showDoctorPicker,
  onToggleDoctorPicker,
  onDoctorChange,
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
  onCreatePatient,
  primaryInsuranceName,
  stepError,
}: PrescriptionStepPatientProps) {
  const patientBoxRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Profesional responsable
            </p>
            {doctorsLoading ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Cargando equipo médico…
              </div>
            ) : activeDoctors.length === 0 ? (
              <p className="mt-3 text-sm text-amber-700">
                No hay médicos activos en la clínica.
              </p>
            ) : selectedDoctor ? (
              <div className="mt-3">
                <p className="text-lg font-semibold text-gray-900">
                  Dr/a. {selectedDoctor.firstName} {selectedDoctor.lastName}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  {selectedDoctor.specialty && (
                    <span className="inline-flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5" aria-hidden />
                      {selectedDoctor.specialty}
                    </span>
                  )}
                  {selectedDoctor.licenseNumber && (
                    <span>Mat. {selectedDoctor.licenseNumber}</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                Seleccioná el profesional responsable.
              </p>
            )}
          </div>
          {activeDoctors.length > 1 && (
            <button
              type="button"
              onClick={onToggleDoctorPicker}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cambiar profesional
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showDoctorPicker ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
        {showDoctorPicker && activeDoctors.length > 1 && (
          <select
            value={doctorId}
            onChange={(e) => onDoctorChange(e.target.value)}
            className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-ensigna-primary focus:ring-2 focus:ring-[var(--color-focus-ring)]"
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
          <h3 className="text-lg font-semibold text-gray-900">Buscar paciente</h3>
          <p className="mt-1 text-sm text-gray-500">
            Nombre, apellido, DNI o teléfono. Este es el paso principal del flujo.
          </p>
        </div>

        {patientLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-ensigna-primary" />
          </div>
        ) : selectedPatient ? (
          <div className="rounded-2xl border border-ensigna-primary/20 bg-ensigna-accent-soft/40 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                  <User className="h-6 w-6 text-ensigna-primary" aria-hidden />
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-900">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                    {selectedPatient.dni && (
                      <span className="rounded-lg bg-white px-2.5 py-1">
                        DNI {selectedPatient.dni}
                      </span>
                    )}
                    {calcAge(selectedPatient.birthDate) && (
                      <span className="rounded-lg bg-white px-2.5 py-1">
                        {calcAge(selectedPatient.birthDate)}
                      </span>
                    )}
                    <span className="rounded-lg bg-white px-2.5 py-1">
                      {primaryInsuranceName ?? 'Particular'}
                    </span>
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
              aria-controls="patient-search-results"
              className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 text-base shadow-sm focus:border-ensigna-primary focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            />
            {patientSearchLoading && (
              <Loader2
                className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-ensigna-primary"
                aria-hidden
              />
            )}
            {patientOpen && patientTerm.trim() && (
              <div
                id="patient-search-results"
                role="listbox"
                className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
              >
                {patientHits.length === 0 && !patientSearchLoading && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-gray-500">No se encontraron pacientes</p>
                    <button
                      type="button"
                      onClick={onCreatePatient}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl gradient-brand px-4 py-2.5 text-sm font-semibold text-white"
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
                        className="flex w-full items-start justify-between gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-ensigna-accent-soft/50"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
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
                      onClick={onCreatePatient}
                      className="inline-flex items-center gap-2 text-sm font-medium text-ensigna-primary hover:text-ensigna-primary-dark"
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
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {stepError}
        </p>
      )}
    </div>
  );
}
