"use client";

import { CheckCircle2, AlertTriangle, Clock3, Link2Off } from "lucide-react";
import type { RecetarioSyncStatus } from "@/contexts/AuthContext";

interface Props {
  status: RecetarioSyncStatus | null | undefined;
  syncedAt: string | null | undefined;
  lastError: string | null | undefined;
  healthCenterId: number | null | undefined;
}

/**
 * Badge visual del estado de sincronización con Recetario.com.ar.
 * Muestra estado, última sincronización y, si aplica, último error.
 *
 * Pensado para ser reusado en cualquier vista (clínica, integraciones,
 * dashboards de admin). No hace requests por sí mismo: solo refleja los
 * campos persistidos en la entidad local.
 */
export default function RecetarioSyncBadge({
  status,
  syncedAt,
  lastError,
  healthCenterId,
}: Props) {
  if (!healthCenterId) {
    return (
      <Wrapper className="bg-gray-50 text-gray-600 border-gray-200">
        <Link2Off className="h-3.5 w-3.5" />
        <span className="font-medium">Sin vincular a Recetario</span>
      </Wrapper>
    );
  }

  if (status === "SYNCED") {
    return (
      <Wrapper className="bg-emerald-50 text-emerald-700 border-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="font-medium">Sincronizado con Recetario</span>
        {syncedAt && (
          <span className="text-emerald-600/80">· {formatDate(syncedAt)}</span>
        )}
      </Wrapper>
    );
  }

  if (status === "FAILED") {
    return (
      <Wrapper className="bg-red-50 text-red-700 border-red-200" title={lastError ?? undefined}>
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="font-medium">Error de sincronización</span>
        {lastError && (
          <span className="max-w-[260px] truncate text-red-600/80">
            · {lastError}
          </span>
        )}
      </Wrapper>
    );
  }

  if (status === "PENDING") {
    return (
      <Wrapper className="bg-amber-50 text-amber-700 border-amber-200">
        <Clock3 className="h-3.5 w-3.5 animate-spin-slow" />
        <span className="font-medium">Sincronizando con Recetario…</span>
      </Wrapper>
    );
  }

  return (
    <Wrapper className="bg-gray-50 text-gray-600 border-gray-200">
      <Clock3 className="h-3.5 w-3.5" />
      <span className="font-medium">Pendiente de sincronizar</span>
    </Wrapper>
  );
}

function Wrapper({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${className ?? ""}`}
      title={title}
    >
      {children}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
