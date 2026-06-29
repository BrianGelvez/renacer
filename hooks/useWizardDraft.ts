'use client';

import { useCallback, useEffect, useRef } from 'react';

const DRAFT_PREFIX = 'ensigna-wizard-draft:';

/**
 * Autoguardado local de borradores de wizard (localStorage).
 * No modifica lógica de negocio ni envía datos al servidor.
 */
export function useWizardDraft<T>(key: string, data: T, enabled = true) {
  const storageKey = `${DRAFT_PREFIX}${key}`;
  const isFirstMount = useRef(true);

  const loadDraft = useCallback((): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        /* quota exceeded — ignore */
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [data, enabled, storageKey]);

  return { loadDraft, clearDraft };
}
