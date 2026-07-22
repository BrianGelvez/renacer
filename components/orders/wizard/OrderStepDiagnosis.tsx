'use client';

import { Clock, Stethoscope } from 'lucide-react';
import DiagnosisAutocomplete, {
  type DiagnosisSelection,
} from '@/components/prescriptions/DiagnosisAutocomplete';

type OrderStepDiagnosisProps = {
  selectedDiagnosis: DiagnosisSelection | null;
  onDiagnosisChange: (value: DiagnosisSelection | null) => void;
  recentDiagnoses: DiagnosisSelection[];
  stepError: string | null;
};

export default function OrderStepDiagnosis({
  selectedDiagnosis,
  onDiagnosisChange,
  recentDiagnoses,
  stepError,
}: OrderStepDiagnosisProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Diagnóstico CIE-10</h3>
        <p className="mt-1 text-sm text-gray-500">
          Indicá el diagnóstico que justifica las solicitudes. Obligatorio para emitir la orden.
        </p>
      </div>

      {recentDiagnoses.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Diagnósticos recientes
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentDiagnoses.map((dx) => (
              <button
                key={`${dx.diagnosisCode}-${dx.diagnosisDescriptionEs}`}
                type="button"
                onClick={() => onDiagnosisChange(dx)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                  selectedDiagnosis?.diagnosisCode === dx.diagnosisCode
                    ? 'border-teal-600 bg-teal-50 text-teal-900'
                    : 'border-gray-200 bg-white hover:border-teal-200 hover:bg-teal-50/50'
                }`}
              >
                <span className="font-mono text-xs text-gray-500">{dx.diagnosisCode}</span>
                <span className="mt-0.5 block font-medium">{dx.diagnosisDescriptionEs}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
          <Stethoscope className="h-4 w-4 text-teal-600" aria-hidden />
          Buscar diagnóstico
        </label>
        <DiagnosisAutocomplete value={selectedDiagnosis} onChange={onDiagnosisChange} />
        {selectedDiagnosis && (
          <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-sm text-teal-900">
            <span className="font-mono font-semibold">{selectedDiagnosis.diagnosisCode}</span>
            <span className="mx-2 text-teal-400">—</span>
            {selectedDiagnosis.diagnosisDescriptionEs}
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
