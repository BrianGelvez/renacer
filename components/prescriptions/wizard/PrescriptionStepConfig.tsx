'use client';

import { Calendar, FileText, RefreshCw, Shield } from 'lucide-react';

type PrescriptionStepConfigProps = {
  dateDisplay: string;
  onDateDisplayChange: (value: string) => void;
  hiv: boolean;
  onHivChange: (value: boolean) => void;
  recurringEnabled: boolean;
  onRecurringEnabledChange: (value: boolean) => void;
  recurringDays: 30 | 60 | 90;
  onRecurringDaysChange: (value: 30 | 60 | 90) => void;
  recurringQuantity: number;
  onRecurringQuantityChange: (value: number) => void;
  stepError: string | null;
};

export default function PrescriptionStepConfig({
  dateDisplay,
  onDateDisplayChange,
  hiv,
  onHivChange,
  recurringEnabled,
  onRecurringEnabledChange,
  recurringDays,
  onRecurringDaysChange,
  recurringQuantity,
  onRecurringQuantityChange,
  stepError,
}: PrescriptionStepConfigProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Configuración de la receta</h3>
        <p className="mt-1 text-sm text-gray-500">
          Fecha, validez y opciones especiales agrupadas en tarjetas claras.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-ensigna-primary" aria-hidden />
            <h4 className="font-semibold text-gray-900">Fecha de emisión</h4>
          </div>
          <label className="block text-sm font-medium text-gray-700">
            Fecha de la receta
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={dateDisplay}
            onChange={(e) => onDateDisplayChange(e.target.value)}
            placeholder="dd/MM/aaaa"
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-ensigna-primary focus:ring-2 focus:ring-[var(--color-focus-ring)]"
          />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-ensigna-primary" aria-hidden />
            <h4 className="font-semibold text-gray-900">Opciones especiales</h4>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <span className="text-sm font-medium text-gray-900">Paciente VIH</span>
              <p className="text-xs text-gray-500">Mapea hiv=true en Recetario</p>
            </div>
            <input
              type="checkbox"
              role="switch"
              checked={hiv}
              onChange={(e) => onHivChange(e.target.checked)}
              className="h-5 w-9 accent-ensigna-primary"
              aria-label="Paciente VIH"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-ensigna-primary" aria-hidden />
            <h4 className="font-semibold text-gray-900">Recetas recurrentes</h4>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <span className="text-sm font-medium text-gray-900">
                Emitir recetas recurrentes
              </span>
              <p className="text-xs text-gray-500">
                Programá emisiones periódicas automáticas
              </p>
            </div>
            <input
              type="checkbox"
              role="switch"
              checked={recurringEnabled}
              onChange={(e) => onRecurringEnabledChange(e.target.checked)}
              className="h-5 w-9 accent-ensigna-primary"
              aria-label="Recetas recurrentes"
            />
          </label>

          {recurringEnabled && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Frecuencia
                </label>
                <select
                  value={recurringDays}
                  onChange={(e) =>
                    onRecurringDaysChange(
                      Number.parseInt(e.target.value, 10) as 30 | 60 | 90,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                >
                  <option value={30}>30 días</option>
                  <option value={60}>60 días</option>
                  <option value={90}>90 días</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cantidad
                </label>
                <select
                  value={recurringQuantity}
                  onChange={(e) =>
                    onRecurringQuantityChange(Number.parseInt(e.target.value, 10))
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 text-gray-400" aria-hidden />
            <p className="text-sm text-gray-600">
              La firma digital y el logo de la clínica se aplican automáticamente al emitir
              la receta según la configuración de Recetario vinculada.
            </p>
          </div>
        </section>
      </div>

      {stepError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {stepError}
        </p>
      )}
    </div>
  );
}
