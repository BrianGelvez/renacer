'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowUpDown,
  Download,
  Eye,
  FilePlus2,
  FileText,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';
import {
  apiClient,
  type ClinicTeamMemberDto,
  type MedicalDocumentListItemDto,
  type MedicalDocumentsStatsDto,
  type MedicalDocumentStatus,
  type MedicalDocumentType,
} from '@/lib/api';
import MobileDataCard from '@/components/ui/MobileDataCard';

const DEBOUNCE_MS = 350;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusBadgeClass(status: MedicalDocumentStatus): string {
  switch (status) {
    case 'ISSUED':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'CANCELLED':
      return 'bg-red-50 text-red-800 border-red-200';
    case 'EXPIRED':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function MetricCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-gray-100" />
      ) : (
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-4 animate-pulse">
          <div className="h-4 w-20 rounded bg-gray-100" />
          <div className="h-4 flex-1 rounded bg-gray-100" />
          <div className="h-4 w-24 rounded bg-gray-100" />
          <div className="h-4 w-16 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

type MedicalDocumentsSectionProps = {
  /** Filtrar por paciente (detalle de paciente). */
  patientId?: string;
  /** Filtrar por médico (perfil / equipo). */
  initialDoctorUserId?: string;
  compact?: boolean;
};

export default function MedicalDocumentsSection({
  patientId,
  initialDoctorUserId,
  compact = false,
}: MedicalDocumentsSectionProps) {
  const router = useRouter();
  const [stats, setStats] = useState<MedicalDocumentsStatsDto | null>(null);
  const [items, setItems] = useState<MedicalDocumentListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, DEBOUNCE_MS);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [doctorUserId, setDoctorUserId] = useState(initialDoctorUserId ?? '');
  const [documentType, setDocumentType] = useState<MedicalDocumentType | ''>('');
  const [status, setStatus] = useState<MedicalDocumentStatus | ''>('');
  const [sortBy, setSortBy] = useState('issuedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [doctors, setDoctors] = useState<ClinicTeamMemberDto[]>([]);

  useEffect(() => {
    if (!compact) {
      apiClient
        .getTeamMembers()
        .then((team) =>
          setDoctors(
            (Array.isArray(team) ? team : []).filter(
              (m) => m.isDoctor && m.isActive,
            ),
          ),
        )
        .catch(() => setDoctors([]));
    }
  }, [compact]);

  const fetchStats = useCallback(async () => {
    if (compact) return;
    setStatsLoading(true);
    try {
      const data = await apiClient.getMedicalDocumentsStats();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [compact]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.listMedicalDocuments({
        page,
        limit: compact ? 5 : 20,
        q: debouncedQ || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        doctorUserId: doctorUserId || undefined,
        patientId: patientId || undefined,
        documentType: documentType || undefined,
        status: status || undefined,
        sortBy,
        sortOrder,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al cargar documentos.',
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    debouncedQ,
    dateFrom,
    dateTo,
    doctorUserId,
    patientId,
    documentType,
    status,
    sortBy,
    sortOrder,
    compact,
  ]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, dateFrom, dateTo, doctorUserId, documentType, status, patientId]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const handleSync = async (force = false) => {
    setSyncing(true);
    setError(null);
    try {
      await apiClient.syncMedicalDocuments(force);
      await Promise.all([fetchStats(), fetchList()]);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'No se pudo sincronizar con Recetario.',
      );
    } finally {
      setSyncing(false);
    }
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const handleDownload = async (doc: MedicalDocumentListItemDto) => {
    if (doc.pdfUrl) {
      window.open(doc.pdfUrl, '_blank', 'noopener,noreferrer');
      try {
        await apiClient.downloadMedicalDocument(doc.id);
      } catch {
        /* audit best-effort */
      }
      return;
    }
    try {
      const meta = await apiClient.downloadMedicalDocument(doc.id);
      if (meta.pdfUrl) window.open(meta.pdfUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setError('No hay PDF disponible para este documento.');
    }
  };

  const title = compact ? 'Documentos médicos' : 'Recetas y documentos';

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {!compact && (
            <p className="text-sm text-gray-500 mt-0.5">
              Centro de gestión de documentos emitidos vía Recetario
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleSync(true)}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
          {!compact && (
            <Link
              href="/dashboard/prescriptions/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              <FilePlus2 className="w-4 h-4" />
              Nueva receta
            </Link>
          )}
        </div>
      </div>

      {!compact && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricCard label="Total emitidos" value={stats?.total ?? 0} loading={statsLoading} />
          <MetricCard label="Recetas" value={stats?.prescriptions ?? 0} loading={statsLoading} />
          <MetricCard label="Órdenes de estudio" value={stats?.studyOrders ?? 0} loading={statsLoading} />
          <MetricCard label="Anulados" value={stats?.cancelled ?? 0} loading={statsLoading} />
          <MetricCard label="Hoy" value={stats?.issuedToday ?? 0} loading={statsLoading} />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar paciente, médico, DNI, documento, obra social…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {!compact && (
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                aria-label="Desde"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                aria-label="Hasta"
              />
              <select
                value={doctorUserId}
                onChange={(e) => setDoctorUserId(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Todos los médicos</option>
                {doctors.map((d) => (
                  <option key={d.userId} value={d.userId}>
                    Dr/a. {d.firstName} {d.lastName}
                  </option>
                ))}
              </select>
              <select
                value={documentType}
                onChange={(e) =>
                  setDocumentType(e.target.value as MedicalDocumentType | '')
                }
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Todos los tipos</option>
                <option value="PRESCRIPTION">Receta</option>
                <option value="STUDY_ORDER">Orden de estudio</option>
                <option value="PRACTICE_ORDER">Práctica</option>
                <option value="OTHER">Otro</option>
              </select>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as MedicalDocumentStatus | '')
                }
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="ISSUED">Emitido</option>
                <option value="CANCELLED">Anulado</option>
                <option value="EXPIRED">Vencido</option>
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <TableSkeleton />
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700">Sin documentos</p>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              {debouncedQ || dateFrom || dateTo
                ? 'No hay resultados con los filtros actuales.'
                : 'Sincronizá con Recetario o emití una receta para ver documentos aquí.'}
            </p>
            <button
              type="button"
              onClick={() => void handleSync(true)}
              className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
            >
              <RefreshCw className="w-4 h-4" />
              Sincronizar ahora
            </button>
          </div>
        ) : (
          <>
          <div className="space-y-3 p-4 md:hidden">
            {items.map((doc) => (
              <MobileDataCard
                key={doc.id}
                title={doc.patientName}
                subtitle={formatDate(doc.issuedAt)}
                badge={
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(doc.status)}`}>
                    {doc.statusLabel}
                  </span>
                }
                fields={[
                  { label: 'DNI', value: doc.patientDni ?? '—' },
                  { label: 'Médico', value: doc.doctorName || '—' },
                  { label: 'Tipo', value: doc.documentTypeLabel },
                  { label: 'Obra social', value: doc.healthInsurance ?? '—' },
                  { label: 'Nº doc.', value: doc.documentNumber ?? '—' },
                ]}
                actions={
                  <>
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/prescriptions/${doc.id}`)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white touch-target"
                    >
                      <Eye className="h-4 w-4" /> Ver
                    </button>
                    {doc.pdfUrl && (
                      <a
                        href={doc.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ensigna-secondary inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                      >
                        <FileText className="h-4 w-4" /> PDF
                      </a>
                    )}
                    {doc.patientId && (
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/patients/${doc.patientId}`)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm touch-target"
                      >
                        <User className="h-4 w-4" /> Paciente
                      </button>
                    )}
                  </>
                }
              />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => toggleSort('issuedAt')} className="inline-flex items-center gap-1 hover:text-gray-800">
                      Fecha <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">DNI</th>
                  <th className="px-4 py-3">Médico</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Obra social</th>
                  <th className="px-4 py-3">Nº documento</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {formatDate(doc.issuedAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {doc.patientName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{doc.patientDni ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{doc.doctorName || '—'}</td>
                    <td className="px-4 py-3">{doc.documentTypeLabel}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass(doc.status)}`}
                      >
                        {doc.statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">
                      {doc.healthInsurance ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {doc.documentNumber ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId((id) => (id === doc.id ? null : doc.id))
                        }
                        className="p-2 rounded-lg hover:bg-gray-100"
                        aria-label="Acciones"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenuId === doc.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                            aria-hidden
                          />
                          <div className="absolute right-4 top-full z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg text-left">
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => {
                                setOpenMenuId(null);
                                router.push(`/dashboard/prescriptions/${doc.id}`);
                              }}
                            >
                              <Eye className="w-4 h-4" /> Ver detalle
                            </button>
                            {doc.pdfUrl && (
                              <>
                                <a
                                  href={doc.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <FileText className="w-4 h-4" /> Reimprimir PDF
                                </a>
                                <button
                                  type="button"
                                  className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    void handleDownload(doc);
                                  }}
                                >
                                  <Download className="w-4 h-4" /> Descargar PDF
                                </button>
                              </>
                            )}
                            {doc.patientId && (
                              <button
                                type="button"
                                className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  router.push(`/dashboard/patients/${doc.patientId}`);
                                }}
                              >
                                <User className="w-4 h-4" /> Ver paciente
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>
              {items.length} de {total} documento{total !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="touch-target px-4 py-2.5 rounded-lg border border-gray-200 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="touch-target px-4 py-2.5 rounded-lg border border-gray-200 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {compact && total > 5 && (
        <Link
          href="/dashboard/prescriptions"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Ver todos los documentos ({total})
        </Link>
      )}
    </div>
  );
}
