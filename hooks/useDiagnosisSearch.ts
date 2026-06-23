'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { apiClient, type DiagnosisSearchResult } from '@/lib/api';

export const DIAGNOSIS_SEARCH_MIN_LENGTH = 3;
const DEBOUNCE_MS = 300;

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export interface UseDiagnosisSearchResult {
  diagnoses: DiagnosisSearchResult[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  isTermTooShort: boolean;
  debouncedTerm: string;
}

/**
 * Búsqueda ICD-10 con debounce de 300ms.
 * El backend retorna [] si q < 3 caracteres o si el proveedor NIH falla.
 */
export function useDiagnosisSearch(term: string): UseDiagnosisSearchResult {
  const trimmed = term.trim();
  const debouncedTerm = useDebouncedValue(trimmed, DEBOUNCE_MS);
  const enabled = debouncedTerm.length >= DIAGNOSIS_SEARCH_MIN_LENGTH;

  const query = useQuery({
    queryKey: ['icd10-search', debouncedTerm.toLowerCase()],
    queryFn: ({ signal }) => apiClient.searchIcd10(debouncedTerm, signal),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  });

  return {
    diagnoses: query.data ?? [],
    isLoading: enabled && (query.isPending || query.isFetching),
    isError: query.isError,
    errorMessage: query.isError ? extractMessage(query.error) : null,
    isTermTooShort:
      trimmed.length > 0 && trimmed.length < DIAGNOSIS_SEARCH_MIN_LENGTH,
    debouncedTerm,
  };
}

function extractMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const responseMessage = (
      err.response?.data as { message?: string } | undefined
    )?.message;
    return (
      responseMessage ?? err.message ?? 'No se pudieron buscar diagnósticos.'
    );
  }
  if (err instanceof Error) return err.message;
  return 'Error desconocido al buscar diagnósticos.';
}
