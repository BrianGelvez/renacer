"use client";

import { useState } from "react";
import {
  Building2,
  RefreshCcw,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  useRecetarioHealthCenters,
} from "@/hooks/useRecetarioHealthCenters";
import type {
  RecetarioHealthCenter,
} from "@/lib/api";

/**
 * Pantalla simple de validación de la integración Recetario.com.ar.
 * Solo lectura: lista las instituciones asociadas al token configurado
 * en backend y muestra los datos crudos.
 */
export default function RecetarioIntegrationSection() {
  const { data, loading, error, refetch } = useRecetarioHealthCenters();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-ensigna-accent-soft p-2 text-ensigna-accent">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Integración Recetario.com.ar
            </h1>
            <p className="text-sm text-gray-500">
              Conexión con la plataforma de recetas electrónicas legales.
              Validación de instituciones asociadas al token configurado.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refrescar
        </button>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">No se pudo conectar con Recetario</p>
            <p className="text-red-600/80">{error}</p>
          </div>
        </div>
      )}

      {loading && !data.length && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 text-sm text-gray-500">
          Conectando con la API de Recetario…
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 text-sm text-gray-500">
          El token configurado no tiene instituciones asociadas.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {data.map((hc) => (
          <HealthCenterCard key={hc.id} healthCenter={hc} />
        ))}
      </div>
    </div>
  );
}

function HealthCenterCard({
  healthCenter,
}: {
  healthCenter: RecetarioHealthCenter;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-start gap-4 border-b border-gray-100 p-5">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ensigna-accent to-ensigna-accent/70 text-white">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-gray-900">
            {healthCenter.name}
          </h2>
          <p className="text-xs text-gray-500">
            ID Recetario: {healthCenter.id} · PDF v{healthCenter.pdfVersion ?? "—"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Conectado
        </span>
      </div>

      <dl className="grid gap-3 p-5 text-sm">
        <Row icon={<MapPin className="h-4 w-4" />} label="Dirección">
          {healthCenter.address ?? "—"}
        </Row>
        <Row icon={<Phone className="h-4 w-4" />} label="Teléfono">
          {healthCenter.phone ?? "—"}
        </Row>
        <Row icon={<Mail className="h-4 w-4" />} label="Email">
          {healthCenter.email ?? "—"}
        </Row>
        <Row icon={<ImageIcon className="h-4 w-4" />} label="Logo recetas">
          {healthCenter.prescriptionLogoUrl ? (
            <a
              href={healthCenter.prescriptionLogoUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all text-ensigna-accent underline-offset-2 hover:underline"
            >
              Ver imagen
            </a>
          ) : (
            "—"
          )}
        </Row>
        <Row icon={<FileText className="h-4 w-4" />} label="Footer recetario">
          <span className="line-clamp-2 text-gray-600">
            {healthCenter.footer ?? "—"}
          </span>
        </Row>
        <Row
          icon={
            healthCenter.independentDoctors ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )
          }
          label="Médicos independientes"
        >
          {healthCenter.independentDoctors ? "Sí" : "No"}
        </Row>
      </dl>

      {healthCenter.users.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50/60 p-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Usuarios vinculados ({healthCenter.users.length})
          </h3>
          <ul className="space-y-1 text-sm text-gray-700">
            {healthCenter.users.slice(0, 6).map((u, idx) => (
              <li
                key={u.id ?? `${u.email ?? "user"}-${idx}`}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate">
                  {[u.firstName, u.lastName].filter(Boolean).join(" ") ||
                    u.email ||
                    "Sin nombre"}
                </span>
                {u.role && (
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                    {u.role}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div className="flex-1">
        <dt className="text-xs uppercase tracking-wider text-gray-400">
          {label}
        </dt>
        <dd className="text-gray-800">{children}</dd>
      </div>
    </div>
  );
}
