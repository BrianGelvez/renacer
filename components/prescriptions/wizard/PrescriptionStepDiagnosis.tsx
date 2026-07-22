'use client';

import { History, X } from 'lucide-react';
import DiagnosisAutocomplete, {
  type DiagnosisSelection,
} from '@/components/prescriptions/DiagnosisAutocomplete';

type PrescriptionStepDiagnosisProps = {
  selectedDiagnosis: DiagnosisSelection | null;
  onDiagnosisChange: (value: DiagnosisSelection | null) => void;
  clinicalNotes: string;
  onClinicalNotesChange: (value: string) => void;
  recentDiagnoses: DiagnosisSelection[];
  stepError: string | null;
};

export default function PrescriptionStepDiagnosis({
  selectedDiagnosis,
  onDiagnosisChange,
  clinicalNotes,
  onClinicalNotesChange,
  recentDiagnoses,
  stepError,
}: PrescriptionStepDiagnosisProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Diagnóstico CIE-10</h3>
        <p className="mt-1 text-sm text-gray-500">
          Buscá por código o descripción. Podés reutilizar diagnósticos recientes.
        </p>
      </div>

      {recentDiagnoses.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <History className="h-3.5 w-3.5" aria-hidden />
            Diagnósticos recientes
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentDiagnoses.map((dx) => (
              <button
                key={dx.diagnosisCode}
                type="button"
                onClick={() => onDiagnosisChange(dx)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-left text-sm hover:border-ensigna-primary"
              >
                <span className="font-mono font-semibold text-ensigna-primary">
                  {dx.diagnosisCode}
                </span>
                <span className="ml-2 text-gray-700">{dx.diagnosisDescriptionEs}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <label className="block text-sm font-medium text-gray-700">
          Diagnóstico principal <span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <DiagnosisAutocomplete
            value={selectedDiagnosis}
            onChange={onDiagnosisChange}
            required
            placeholder="Buscar por código o descripción (mín. 3 caracteres)…"
          />
        </div>
        {selectedDiagnosis && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
            <span className="font-mono font-semibold">{selectedDiagnosis.diagnosisCode}</span>
            <span>—</span>
            <span>{selectedDiagnosis.diagnosisDescriptionEs}</span>
            <button
              type="button"
              onClick={() => onDiagnosisChange(null)}
              className="ml-auto rounded-lg p-1 hover:bg-emerald-100"
              aria-label="Quitar diagnóstico"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <label className="block text-sm font-medium text-gray-700">
          Observaciones clínicas
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Solo uso interno. No se envía a Recetario.
        </p>
        <textarea
          value={clinicalNotes}
          onChange={(e) => onClinicalNotesChange(e.target.value)}
          rows={4}
          placeholder="Notas clínicas opcionales…"
          className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-ensigna-primary focus:ring-2 focus:ring-[var(--color-focus-ring)]"
        />
      </div>

      {stepError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {stepError}
        </p>
      )}
    </div>
  );
}
