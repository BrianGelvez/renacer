'use client';

import {
  Check,
  ClipboardCheck,
  ClipboardList,
  Settings,
  Stethoscope,
  User,
} from 'lucide-react';

const ICONS = {
  1: User,
  2: ClipboardList,
  3: Stethoscope,
  4: Settings,
  5: ClipboardCheck,
} as const;

export type OrderWizardStepDef = {
  id: number;
  title: string;
  subtitle: string;
};

type OrderWizardStepperProps = {
  steps: readonly OrderWizardStepDef[];
  currentStep: number;
  onStepClick?: (step: number) => void;
};

export default function OrderWizardStepper({
  steps,
  currentStep,
  onStepClick,
}: OrderWizardStepperProps) {
  const progress = Math.round((currentStep / steps.length) * 100);

  return (
    <section
      aria-label="Progreso de la orden médica"
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Nueva orden médica
          </p>
          <h2 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            {steps[currentStep - 1]?.title}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {steps[currentStep - 1]?.subtitle}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-teal-700">{progress}%</p>
          <p className="text-xs text-gray-500">
            Paso {currentStep} de {steps.length}
          </p>
        </div>
      </div>

      <div
        className="mb-5 h-2 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label={`Progreso ${progress} por ciento`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <nav aria-label="Pasos" className="-mx-1 overflow-x-auto pb-1">
        <ol className="flex min-w-max gap-2 px-1">
          {steps.map((s) => {
            const done = s.id < currentStep;
            const active = s.id === currentStep;
            const Icon = ICONS[s.id as keyof typeof ICONS] ?? User;
            const clickable = done && onStepClick;

            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onStepClick?.(s.id)}
                  aria-current={active ? 'step' : undefined}
                  className={`flex min-w-[108px] flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-all sm:min-w-[132px] ${
                    active
                      ? 'border-teal-600 bg-teal-50 shadow-sm'
                      : done
                        ? 'border-emerald-200 bg-emerald-50/80 hover:bg-emerald-50'
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                  } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span
                    className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-teal-600 text-white'
                        : done
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" aria-hidden /> : s.id}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                    {s.title}
                  </span>
                  <span className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                    {done ? 'Completado' : active ? 'En curso' : 'Pendiente'}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </section>
  );
}
