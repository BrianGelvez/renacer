'use client';

import { Calendar, ClipboardList } from 'lucide-react';

type OrderStepConfigProps = {
  dateDisplay: string;
  onDateDisplayChange: (value: string) => void;
  stepError: string | null;
};

export default function OrderStepConfig({
  dateDisplay,
  onDateDisplayChange,
  stepError,
}: OrderStepConfigProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Configuración de la orden</h3>
        <p className="mt-1 text-sm text-gray-500">
          Opciones administrativas separadas del contenido clínico.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ConfigCard
          icon={Calendar}
          title="Fecha de emisión"
          description="Fecha que figurará en la orden médica."
        >
          <input
            type="text"
            inputMode="numeric"
            value={dateDisplay}
            onChange={(e) => onDateDisplayChange(e.target.value)}
            placeholder="dd/MM/aaaa"
            aria-label="Fecha de emisión"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
        </ConfigCard>

        <ConfigCard
          icon={ClipboardList}
          title="Recetario"
          description="La orden se emitirá vía Recetario al confirmar."
        >
          <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-900">
            Emisión electrónica habilitada para esta clínica.
          </p>
        </ConfigCard>
      </div>

      {stepError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {stepError}
        </p>
      )}
    </div>
  );
}

function ConfigCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Calendar;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
