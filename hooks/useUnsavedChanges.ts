'use client';

import { useEffect } from 'react';

/**
 * Muestra confirmación del navegador si el usuario intenta abandonar con cambios sin guardar.
 */
export function useUnsavedChangesGuard(active: boolean, message?: string) {
  useEffect(() => {
    if (!active) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message ?? '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active, message]);
}
