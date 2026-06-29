'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import type { AlertProps } from './Alert';

type ToastVariant = NonNullable<AlertProps['variant']>;

export interface ToastInput {
  id?: string;
  variant?: ToastVariant;
  title?: string;
  message: string;
  durationMs?: number;
}

interface ToastItem extends Required<Pick<ToastInput, 'message'>> {
  id: string;
  variant: ToastVariant;
  title?: string;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_CLASS: Record<ToastVariant, string> = {
  success: 'ensigna-alert-success border shadow-lg',
  warning: 'ensigna-alert-warning border shadow-lg',
  error: 'ensigna-alert-error border shadow-lg',
  info: 'ensigna-alert-info border shadow-lg',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = input.id ?? crypto.randomUUID();
      const item: ToastItem = {
        id,
        variant: input.variant ?? 'info',
        title: input.title,
        message: input.message,
      };
      setToasts((prev) => [...prev.slice(-4), item]);
      window.setTimeout(
        () => dismiss(id),
        input.durationMs ?? 4500,
      );
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message, title) => toast({ variant: 'success', message, title }),
      error: (message, title) => toast({ variant: 'error', message, title, durationMs: 6000 }),
      warning: (message, title) => toast({ variant: 'warning', message, title }),
      info: (message, title) => toast({ variant: 'info', message, title }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto animate-in slide-in-from-bottom-2 rounded-xl px-4 py-3 text-sm ${TOAST_CLASS[t.variant]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {t.title && <p className="font-semibold">{t.title}</p>}
                <p className={t.title ? 'mt-0.5' : ''}>{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="rounded p-1 opacity-70 hover:opacity-100"
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return ctx;
}
