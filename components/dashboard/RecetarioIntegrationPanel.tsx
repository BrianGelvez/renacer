"use client";

import { useState } from "react";
import axios from "axios";
import {
  Link2,
  Link2Off,
  RefreshCcw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth, type RecetarioSyncStatus } from "@/contexts/AuthContext";
import RecetarioSyncBadge from "./RecetarioSyncBadge";
import LinkRecetarioModal from "./LinkRecetarioModal";

/**
 * Panel de control de la integración Recetario.com.ar dentro de la
 * sección "Mi clínica":
 *  - badge de estado de sync
 *  - botón "Vincular" cuando no hay vinculación
 *  - botones "Sincronizar ahora" y "Desvincular" cuando hay vinculación
 */
export default function RecetarioIntegrationPanel() {
  const { clinic, loadUserData } = useAuth();
  const [linkOpen, setLinkOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linked = !!clinic?.recetarioHealthCenterId;
  const status: RecetarioSyncStatus | null = clinic?.recetarioSyncStatus ?? null;

  const handleSyncNow = async () => {
    setSyncing(true);
    setError(null);
    try {
      await apiClient.triggerRecetarioSync();
      await loadUserData();
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setSyncing(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("¿Desvincular la clínica de Recetario? Dejará de sincronizarse.")) {
      return;
    }
    setUnlinking(true);
    setError(null);
    try {
      await apiClient.unlinkRecetario();
      await loadUserData();
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Link2 className="h-4 w-4 text-ensigna-accent" />
            Recetario.com.ar
          </h4>
          <p className="mt-0.5 text-sm text-gray-500">
            Sincronizá los datos de tu clínica con la plataforma de recetas
            electrónicas legales. Al editar tu clínica, los cambios se replican
            automáticamente.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <RecetarioSyncBadge
              status={status}
              syncedAt={clinic?.recetarioSyncedAt ?? null}
              lastError={clinic?.recetarioLastError ?? null}
              healthCenterId={clinic?.recetarioHealthCenterId ?? null}
            />
            {linked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                health-center id: {clinic?.recetarioHealthCenterId}
              </span>
            )}
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {!linked ? (
            <button
              type="button"
              onClick={() => setLinkOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-ensigna-primary px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-ensigna-primary-dark"
            >
              <Link2 className="h-4 w-4" />
              Vincular con Recetario
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={syncing}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                {status === "FAILED" ? "Reintentar sync" : "Sincronizar ahora"}
              </button>
              <button
                type="button"
                onClick={() => setLinkOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Link2 className="h-4 w-4" />
                Cambiar institución
              </button>
              <button
                type="button"
                onClick={() => void handleUnlink()}
                disabled={unlinking}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {unlinking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2Off className="h-4 w-4" />
                )}
                Desvincular
              </button>
            </>
          )}
        </div>
      </div>

      <LinkRecetarioModal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        onLinked={loadUserData}
        currentLinkedId={clinic?.recetarioHealthCenterId ?? null}
      />
    </div>
  );
}

function extractMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string } | undefined)?.message ??
      err.message ??
      "Error al ejecutar la acción."
    );
  }
  if (err instanceof Error) return err.message;
  return "Error desconocido.";
}
