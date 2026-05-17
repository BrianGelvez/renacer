"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  apiClient,
  type RecetarioHealthCenter,
} from "../lib/api";

interface UseRecetarioHealthCentersResult {
  data: RecetarioHealthCenter[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook básico para validar la integración con Recetario.com.ar.
 *
 * Sólo lista las instituciones asociadas al token configurado en backend.
 * Más adelante se ampliará con sub-recursos (médicos, recetas, etc.).
 */
export function useRecetarioHealthCenters(): UseRecetarioHealthCentersResult {
  const [data, setData] = useState<RecetarioHealthCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await apiClient.getRecetarioHealthCenters();
      setData(items);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

function extractMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const responseMessage = (err.response?.data as { message?: string } | undefined)?.message;
    return (
      responseMessage ??
      err.message ??
      "No se pudo conectar con Recetario."
    );
  }
  if (err instanceof Error) return err.message;
  return "Error desconocido al consultar Recetario.";
}
