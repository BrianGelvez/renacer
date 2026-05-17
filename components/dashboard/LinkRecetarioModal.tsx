"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Loader2,
  X,
  Link2,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Lock,
  RefreshCcw,
} from "lucide-react";
import {
  apiClient,
  type AvailableRecetarioHealthCenter,
} from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onLinked: () => Promise<void> | void;
  /** ID actualmente vinculado (si existe). Para resaltar la opción activa. */
  currentLinkedId: number | null;
}

/**
 * Modal de vinculación de la clínica local con una institución de
 * Recetario.com.ar. Lista las instituciones que el token administrador
 * tiene asignadas y permite elegir una para vincularla.
 *
 * No hace requests directos a Recetario: todo pasa por el backend.
 */
export default function LinkRecetarioModal({
  open,
  onClose,
  onLinked,
  currentLinkedId,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<AvailableRecetarioHealthCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkingId, setLinkingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.listAvailableRecetarioHealthCenters();
      setItems(data);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (healthCenterId: number) => {
    setLinkingId(healthCenterId);
    setError(null);
    try {
      await apiClient.linkRecetario(healthCenterId);
      await onLinked();
      onClose();
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setLinkingId(null);
    }
  };

  if (!mounted || !open) return null;

  const node = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-ensigna-accent-soft p-2 text-ensigna-accent">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Vincular con Recetario.com.ar
              </h2>
              <p className="text-sm text-gray-500">
                Elegí la institución registrada en Recetario que corresponde a
                esta clínica. Al vincular se sincronizan los datos automáticamente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando instituciones desde Recetario…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Building2 className="h-10 w-10 text-gray-300" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  No hay instituciones disponibles
                </p>
                <p className="text-xs text-gray-500">
                  El token configurado en backend no tiene instituciones
                  asociadas en Recetario.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RefreshCcw className="h-3.5 w-3.5" /> Reintentar
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((hc) => {
                const isCurrent = hc.id === currentLinkedId;
                const blockedByOther = !!hc.linkedToOtherClinic;
                const disabled = blockedByOther || linkingId !== null;
                return (
                  <li
                    key={hc.id}
                    className={`group rounded-xl border p-4 transition-colors ${
                      isCurrent
                        ? "border-emerald-200 bg-emerald-50/50"
                        : blockedByOther
                          ? "border-gray-200 bg-gray-50"
                          : "border-gray-200 bg-white hover:border-ensigna-accent/40 hover:bg-ensigna-accent-soft/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-medium text-gray-900">
                            {hc.name}
                          </h3>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                            id: {hc.id}
                          </span>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Vinculada actualmente
                            </span>
                          )}
                          {blockedByOther && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              <Lock className="h-3 w-3" />
                              En otra clínica
                            </span>
                          )}
                        </div>
                        <dl className="mt-1 grid grid-cols-1 gap-x-4 gap-y-0.5 text-xs text-gray-500 sm:grid-cols-2">
                          {hc.address && <dd>📍 {hc.address}</dd>}
                          {hc.phone && <dd>📞 {hc.phone}</dd>}
                          {hc.email && <dd className="truncate">✉ {hc.email}</dd>}
                          {hc.linkedToOtherClinic && (
                            <dd className="text-amber-700">
                              vinculada a “{hc.linkedToOtherClinic.name}”
                            </dd>
                          )}
                        </dl>
                      </div>

                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => void handleLink(hc.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          isCurrent
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : disabled
                              ? "cursor-not-allowed bg-gray-100 text-gray-400"
                              : "bg-ensigna-primary text-white hover:bg-ensigna-primary-dark"
                        }`}
                      >
                        {linkingId === hc.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Vinculando…
                          </>
                        ) : isCurrent ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Re-vincular
                          </>
                        ) : (
                          <>
                            <Link2 className="h-3.5 w-3.5" />
                            Vincular
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

function extractMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string } | undefined)?.message ??
      err.message ??
      "No se pudo cargar la lista de instituciones."
    );
  }
  if (err instanceof Error) return err.message;
  return "Error desconocido al consultar Recetario.";
}
