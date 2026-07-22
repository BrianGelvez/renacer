'use client';

import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Loader2,
  Save,
  X,
} from 'lucide-react';
import WizardStickyFooter from '@/components/ui/WizardStickyFooter';

type PrescriptionWizardFooterProps = {
  step: number;
  totalSteps: number;
  submitting: boolean;
  canEmit: boolean;
  emitLabel: string;
  savedLabel: string | null;
  onBack: () => void;
  onNext: () => void;
  onEmit: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
};

export default function PrescriptionWizardFooter({
  step,
  totalSteps,
  submitting,
  canEmit,
  emitLabel,
  savedLabel,
  onBack,
  onNext,
  onEmit,
  onSaveDraft,
  onCancel,
}: PrescriptionWizardFooterProps) {
  const isLast = step >= totalSteps;

  return (
    <WizardStickyFooter className="border-t border-gray-200 bg-white/95 lg:rounded-2xl lg:border lg:shadow-sm">
      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-4">
        <div className="hidden min-h-[20px] text-xs text-gray-500 lg:block ml-2">
          {savedLabel ?? 'Los cambios se guardan automáticamente en borrador local'}
        </div>

        <div className="grid w-full grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:justify-end lg:w-auto">
          {step > 1 && (
            <button
              type="button"
              onClick={onBack}
              disabled={submitting}
              className="btn-ensigna-secondary inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium lg:flex-none lg:px-5"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Atrás
            </button>
          )}

          <button
            type="button"
            onClick={onSaveDraft}
            disabled={submitting}
            className="hidden min-h-[48px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 lg:inline-flex"
          >
            <Save className="h-4 w-4" aria-hidden />
            Guardar borrador
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="hidden min-h-[48px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 lg:inline-flex"
          >
            <X className="h-4 w-4" aria-hidden />
            Cancelar
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={onNext}
              disabled={submitting}
              className={`inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-lg bg-gradient-to-br from-ensigna-primary-dark to-ensigna-primary-light shadow-md lg:flex-none ${step > 1 ? '' : 'col-span-2'}`}
            >
              Continuar
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={onEmit}
              disabled={submitting || !canEmit}
              className={`inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-ensigna-primary/20 disabled:cursor-not-allowed disabled:opacity-50 lg:flex-none ${step > 1 ? '' : 'col-span-2'}`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Emitiendo…
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" aria-hidden />
                  {emitLabel}
                </>
              )}
            </button>
          )}
        </div>

        {savedLabel && (
          <p className="text-center text-xs text-gray-500 lg:hidden">{savedLabel}</p>
        )}
      </div>
    </WizardStickyFooter>
  );
}
