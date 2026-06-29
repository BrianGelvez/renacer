'use client';

import type { ReactNode } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';

type AlertVariant = 'success' | 'warning' | 'error' | 'info';

const VARIANT_CLASS: Record<AlertVariant, string> = {
  success: 'ensigna-alert-success',
  warning: 'ensigna-alert-warning',
  error: 'ensigna-alert-error',
  info: 'ensigna-alert-info',
};

const VARIANT_ICON: Record<AlertVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />,
  warning: <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />,
  error: <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />,
  info: <Info className="h-5 w-5 shrink-0" aria-hidden />,
};

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export default function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${VARIANT_CLASS[variant]} ${className}`}
    >
      {VARIANT_ICON[variant]}
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg p-1 opacity-70 transition hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          aria-label="Cerrar mensaje"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
