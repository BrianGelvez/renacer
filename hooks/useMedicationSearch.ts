'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { apiClient, type RecetarioMedicationDto } from '@/lib/api';

export const MEDICATION_SEARCH_MIN_LENGTH = 3;
const DEBOUNCE_MS = 500;

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export interface UseMedicationSearchResult {
  medications: RecetarioMedicationDto[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  /** true cuando el término todavía no alcanza el mínimo de caracteres. */
  isTermTooShort: boolean;
  /** Término efectivamente buscado (post-debounce). */
  debouncedTerm: string;
}

/**
 * Búsqueda remota de medicamentos Recetario con debounce de 500ms.
 *
 * React Query cancela automáticamente el request anterior (vía AbortSignal)
 * cuando cambia la queryKey, y cachea resultados por término (staleTime
 * alineado con el TTL de 10 min del backend).
 */
export function useMedicationSearch(term: string): UseMedicationSearchResult {
  const trimmed = term.trim();
  const debouncedTerm = useDebouncedValue(trimmed, DEBOUNCE_MS);
  const enabled = debouncedTerm.length >= MEDICATION_SEARCH_MIN_LENGTH;

  const query = useQuery({
    queryKey: ['recetario-medications', debouncedTerm.toLowerCase()],
    queryFn: ({ signal }) =>
      apiClient.searchRecetarioMedications(debouncedTerm, signal),
    enabled,
  });

  return {
    medications: query.data ?? [],
    isLoading: enabled && (query.isPending || query.isFetching),
    isError: query.isError,
    errorMessage: query.isError ? extractMessage(query.error) : null,
    isTermTooShort:
      trimmed.length > 0 && trimmed.length < MEDICATION_SEARCH_MIN_LENGTH,
    debouncedTerm,
  };
}

function extractMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const responseMessage = (
      err.response?.data as { message?: string } | undefined
    )?.message;
    return (
      responseMessage ?? err.message ?? 'No se pudieron buscar medicamentos.'
    );
  }
  if (err instanceof Error) return err.message;
  return 'Error desconocido al buscar medicamentos.';
}
