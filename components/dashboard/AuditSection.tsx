'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Eye,
  Download,
  Plus,
  Pencil,
  Trash2,
  User,
  Calendar,
  Globe,
} from 'lucide-react';
import { apiClient, type AuditLogItem } from '@/lib/api';
import MobileDataCard from '@/components/ui/MobileDataCard';

// ─── Constants ──────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Modificación',
  DELETE: 'Eliminación',
  VIEW: 'Visualización',
  DOWNLOAD: 'Descarga',
};

const ACTION_COLORS: Record<
  string,
  { bg: string; text: string; icon: typeof Eye }
> = {
  CREATE: {
    bg: 'bg-emerald-100 text-emerald-700',
    text: 'text-emerald-700',
    icon: Plus,
  },
  UPDATE: {
    bg: 'bg-blue-100 text-blue-700',
    text: 'text-blue-700',
    icon: Pencil,
  },
  DELETE: {
    bg: 'bg-red-100 text-red-700',
    text: 'text-red-700',
    icon: Trash2,
  },
  VIEW: {
    bg: 'bg-ensigna-accent text-ensigna-primary-dark',
    text: 'text-ensigna-primary-dark',
    icon: Eye,
  },
  DOWNLOAD: {
    bg: 'bg-amber-100 text-amber-700',
    text: 'text-amber-700',
    icon: Download,
  },
};

const ENTITY_LABELS: Record<string, string> = {
  MedicalRecord: 'Historia clínica',
  MedicalRecordFile: 'Archivo médico',
  Patient: 'Paciente',
  Payment: 'Pago',
  Appointment: 'Turno',
  ClinicUser: 'Miembro del equipo',
  Clinic: 'Clínica',
};

const ENTITIES = Object.keys(ENTITY_LABELS);
const ACTIONS = Object.keys(ACTION_LABELS);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function JsonDisplay({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return <span className="text-gray-400 text-xs italic">—</span>;
  return (
    <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-x-auto max-h-48 text-gray-700 border border-gray-100 font-mono">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: AuditLogItem['action'] }) {
  const cfg = ACTION_COLORS[action] ?? ACTION_COLORS.VIEW;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg}`}
    >
      <Icon className="w-3 h-3" />
      {ACTION_LABELS[action] ?? action}
    </span>
  );
}

function EntityBadge({ entity }: { entity: string }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      {ENTITY_LABELS[entity] ?? entity}
    </span>
  );
}

// ─── Expandable row ───────────────────────────────────────────────────────────

function AuditRow({ log }: { log: AuditLogItem }) {
  const [expanded, setExpanded] = useState(false);

  const userName = log.user
    ? `${log.user.name} ${log.user.lastName}`
    : 'Sistema';

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 whitespace-nowrap">
          <ActionBadge action={log.action} />
        </td>
        <td className="px-4 py-3">
          <EntityBadge entity={log.entity} />
          {log.entityId && (
            <p className="text-[10px] text-gray-400 mt-0.5 font-mono truncate max-w-[120px]">
              {log.entityId}
            </p>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-ensigna-accent flex items-center justify-center text-ensigna-primary text-xs font-bold flex-shrink-0">
              {userName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate max-w-[140px]">
                {userName}
              </p>
              {log.user?.email && (
                <p className="text-xs text-gray-400 truncate max-w-[140px]">
                  {log.user.email}
                </p>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            {formatDate(log.createdAt)}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-400">
          {log.ipAddress ?? '—'}
        </td>
        <td className="px-4 py-3 text-right">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400 inline" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400 inline" />
          )}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-gray-50/80 border-b border-gray-100">
          <td colSpan={6} className="px-4 py-4">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* Old values */}
                {(log.action === 'UPDATE' || log.action === 'DELETE') && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Valores anteriores
                    </p>
                    <JsonDisplay data={log.oldValues} />
                  </div>
                )}

                {/* New values */}
                {(log.action === 'CREATE' || log.action === 'UPDATE') && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Valores nuevos
                    </p>
                    <JsonDisplay data={log.newValues} />
                  </div>
                )}

                {/* Metadata */}
                {log.metadata && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Metadata
                    </p>
                    <JsonDisplay data={log.metadata} />
                  </div>
                )}

                {/* User agent */}
                {log.userAgent && (
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Agente
                    </p>
                    <p className="text-xs text-gray-500 break-all font-mono">
                      {log.userAgent}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AuditSection() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const LIMIT = 20;

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.getAuditLogs({
          entity: filterEntity || undefined,
          action: filterAction || undefined,
          from: filterFrom || undefined,
          to: filterTo || undefined,
          page: p,
          limit: LIMIT,
        });
        setLogs(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      } catch {
        setError('No se pudieron cargar los registros de auditoría.');
      } finally {
        setLoading(false);
      }
    },
    [filterEntity, filterAction, filterFrom, filterTo],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  const applyFilters = () => {
    setFiltersOpen(false);
    void load(1);
  };

  const clearFilters = () => {
    setFilterEntity('');
    setFilterAction('');
    setFilterFrom('');
    setFilterTo('');
    setFiltersOpen(false);
  };

  const hasActiveFilters =
    filterEntity || filterAction || filterFrom || filterTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-ensigna-accent">
            <ShieldCheck className="w-6 h-6 text-ensigna-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--ensigna-text)]">
              Auditoría
            </h1>
            <p className="text-sm text-[var(--ensigna-text-secondary)]">
              Trazabilidad de eventos críticos — {total.toLocaleString('es-AR')} registros
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              hasActiveFilters
                ? 'bg-ensigna-accent border-ensigna-primary text-ensigna-primary'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 w-5 h-5 rounded-full bg-ensigna-primary text-white text-[10px] font-bold flex items-center justify-center">
                {[filterEntity, filterAction, filterFrom, filterTo].filter(Boolean).length}
              </span>
            )}
          </button>
          <button
            onClick={() => void load(page)}
            disabled={loading}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Entity */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Entidad
                </label>
                <select
                  value={filterEntity}
                  onChange={(e) => setFilterEntity(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ensigna-primary/20 focus:border-ensigna-primary transition-all"
                >
                  <option value="">Todas</option>
                  {ENTITIES.map((e) => (
                    <option key={e} value={e}>
                      {ENTITY_LABELS[e]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Acción
                </label>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ensigna-primary/20 focus:border-ensigna-primary transition-all"
                >
                  <option value="">Todas</option>
                  {ACTIONS.map((a) => (
                    <option key={a} value={a}>
                      {ACTION_LABELS[a]}
                    </option>
                  ))}
                </select>
              </div>

              {/* From */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Desde
                </label>
                <input
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ensigna-primary/20 focus:border-ensigna-primary transition-all"
                />
              </div>

              {/* To */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Hasta
                </label>
                <input
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ensigna-primary/20 focus:border-ensigna-primary transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 rounded-xl bg-ensigna-primary text-white text-sm font-medium hover:bg-ensigna-primary/90 transition-colors"
              >
                Aplicar filtros
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {error && (
          <div className="p-6 text-center text-red-500 text-sm">{error}</div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-ensigna-primary animate-spin" />
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
            <div className="p-4 rounded-2xl bg-gray-50">
              <ShieldCheck className="w-10 h-10 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-700">Sin registros</p>
            <p className="text-sm text-gray-400">
              No se encontraron eventos de auditoría con los filtros actuales.
            </p>
          </div>
        )}

        {!loading && !error && logs.length > 0 && (
          <>
          <div className="space-y-3 p-4 md:hidden">
            {logs.map((log) => {
              const userName = log.user
                ? `${log.user.name} ${log.user.lastName}`
                : 'Sistema';
              return (
                <MobileDataCard
                  key={log.id}
                  title={ACTION_LABELS[log.action] ?? log.action}
                  subtitle={formatDate(log.createdAt)}
                  badge={<EntityBadge entity={log.entity} />}
                  fields={[
                    { label: 'Usuario', value: userName },
                    { label: 'Entidad ID', value: log.entityId ?? '—' },
                    { label: 'IP', value: log.ipAddress ?? '—' },
                  ]}
                />
              );
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Entidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Usuario
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Fecha
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" /> IP
                    </span>
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <AuditRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40">
            <p className="text-xs text-gray-500">
              Página {page} de {totalPages} —{' '}
              {total.toLocaleString('es-AR')} registros
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void load(page - 1)}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page numbers (show max 5) */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const startPage = Math.max(
                  1,
                  Math.min(page - 2, totalPages - 4),
                );
                const p = startPage + i;
                return (
                  <button
                    key={p}
                    onClick={() => void load(p)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      p === page
                        ? 'bg-ensigna-primary text-white'
                        : 'border border-gray-200 text-gray-500 hover:bg-white'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => void load(page + 1)}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
