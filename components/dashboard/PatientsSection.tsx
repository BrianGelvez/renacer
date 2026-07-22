'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  UserPlus,
  Mail,
  Phone,
  FileText,
  Calendar,
  Eye,
  Pencil,
  FilePlus2,
  ClipboardList,
  MessageCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import CreatePatientModal from './CreatePatientModal';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';

const DEBOUNCE_MS = 300;

export interface PatientListItem {
  id: string;
  firstName: string;
  lastName: string;
  medicalRecordNumber?: number | null;
  dni?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt: string;
  isActive?: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

type ActiveFilter = 'active' | 'inactive' | 'all';
type PatientColumn = 'hc' | 'dni' | 'phone' | 'email' | 'createdAt';

const PATIENTS_TABLE_PREFS_KEY = 'renacer.patients.tablePrefs.v1';

function PatientsSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[220px] flex-1 space-y-2">
              <div className="ensigna-skeleton h-4 w-48" />
              <div className="ensigna-skeleton h-3 w-32" />
            </div>
            <div className="ensigna-skeleton h-8 w-24" />
            <div className="ensigna-skeleton h-8 w-28" />
            <div className="ensigna-skeleton h-8 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PatientsSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    items: PatientListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sortByMedicalRecord, setSortByMedicalRecord] = useState<
    'none' | 'asc' | 'desc'
  >('none');
  const [visibleColumns, setVisibleColumns] = useState<Record<PatientColumn, boolean>>({
    hc: true,
    dni: true,
    phone: true,
    email: true,
    createdAt: true,
  });

  const canCreate = user?.role === 'OWNER' || user?.role === 'ADMIN';
  const canPrescribe =
    user?.role === 'OWNER' ||
    user?.role === 'ADMIN' ||
    user?.role === 'DOCTOR';
  const canCreateOrder =
    user?.role === 'OWNER' ||
    user?.role === 'ADMIN' ||
    user?.role === 'DOCTOR' ||
    user?.role === 'SECRETARY';
  const canSchedule =
    user?.role === 'OWNER' ||
    user?.role === 'ADMIN' ||
    user?.role === 'DOCTOR' ||
    user?.role === 'SECRETARY';
  const canStartConversation =
    user?.role === 'OWNER' || user?.role === 'ADMIN' || user?.role === 'SECRETARY';

  const canFilterMyAppointments =
    user?.role === 'DOCTOR' || user?.isDoctor === true;

  const [myAppointmentsOnly, setMyAppointmentsOnly] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PATIENTS_TABLE_PREFS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        activeFilter?: ActiveFilter;
        myAppointmentsOnly?: boolean;
        sortByMedicalRecord?: 'none' | 'asc' | 'desc';
        visibleColumns?: Partial<Record<PatientColumn, boolean>>;
      };
      if (saved.activeFilter) setActiveFilter(saved.activeFilter);
      if (typeof saved.myAppointmentsOnly === 'boolean') {
        setMyAppointmentsOnly(saved.myAppointmentsOnly);
      }
      if (saved.sortByMedicalRecord) setSortByMedicalRecord(saved.sortByMedicalRecord);
      if (saved.visibleColumns) {
        setVisibleColumns((current) => ({ ...current, ...saved.visibleColumns }));
      }
    } catch {
      /* preferencias corruptas: se ignoran */
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      PATIENTS_TABLE_PREFS_KEY,
      JSON.stringify({ activeFilter, myAppointmentsOnly, sortByMedicalRecord, visibleColumns }),
    );
  }, [activeFilter, myAppointmentsOnly, sortByMedicalRecord, visibleColumns]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, activeFilter, myAppointmentsOnly]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await apiClient.getPatients({
          page,
          limit: 20,
          q: debouncedQuery || undefined,
          activeFilter,
          ...(myAppointmentsOnly ? { myAppointmentsOnly: true } : {}),
        });
        if (cancelled) return;
        setData(res);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              'Error al cargar pacientes.',
          );
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page, debouncedQuery, activeFilter, myAppointmentsOnly]);

  const handleRowClick = (id: string) => {
    router.push(`/dashboard/patients/${id}`);
  };

  const handleCreated = () => {
    setModalOpen(false);
    setPage(1);
    setData(null);
    setLoading(true);
    apiClient
      .getPatients({ page: 1, limit: 20 })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  const sortedItems = useMemo(() => {
    const items = data?.items ?? [];
    if (sortByMedicalRecord === 'none') return items;
    const copy = [...items];
    copy.sort((a, b) => {
      const aValue = a.medicalRecordNumber ?? Number.MAX_SAFE_INTEGER;
      const bValue = b.medicalRecordNumber ?? Number.MAX_SAFE_INTEGER;
      return sortByMedicalRecord === 'asc' ? aValue - bValue : bValue - aValue;
    });
    return copy;
  }, [data?.items, sortByMedicalRecord]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-ensigna-primary-light to-pink-800 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-gray-900">Pacientes</h2>
            <p className="text-sm text-gray-500">
              Base de pacientes de la clínica
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ensigna-primary text-white text-sm font-medium hover:bg-ensigna-primary-dark active:bg-pink-800 shadow-lg shadow-indigo-500/20"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo paciente
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['active', 'inactive', 'all'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-ensigna-primary-dark text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter === 'active' ? 'Activos' : filter === 'inactive' ? 'Inactivos' : 'Todos'}
              </button>
            ))}
            {canFilterMyAppointments && (
              <button
                type="button"
                onClick={() => setMyAppointmentsOnly((v) => !v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  myAppointmentsOnly
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Con turno conmigo
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, DNI, email o N° HC..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Orden N° HC:</span>
            <button
              type="button"
              onClick={() =>
                setSortByMedicalRecord((current) =>
                  current === 'none'
                    ? 'asc'
                    : current === 'asc'
                      ? 'desc'
                      : 'none',
                )
              }
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {sortByMedicalRecord === 'none'
                ? 'Sin ordenar'
                : sortByMedicalRecord === 'asc'
                  ? 'Ascendente'
                  : 'Descendente'}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Columnas:</span>
            {(
              [
                ['hc', 'HC'],
                ['dni', 'DNI'],
                ['phone', 'Telefono'],
                ['email', 'Email'],
                ['createdAt', 'Alta'],
              ] as Array<[PatientColumn, string]>
            ).map(([column, label]) => (
              <button
                key={column}
                type="button"
                onClick={() =>
                  setVisibleColumns((current) => ({
                    ...current,
                    [column]: !current[column],
                  }))
                }
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  visibleColumns[column]
                    ? 'text-ensigna-primary-dark hover:bg-ensigna-primary-light hover:text-white'
                    : 'bg-ensigna-primary-dark text-white hover:bg-ensigna-primary-light'
                }`}
                aria-pressed={visibleColumns[column]}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-4 sm:mx-5 mt-4 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="min-h-[280px]">
          {loading ? (
            <div className="p-6">
              <SkeletonTable rows={8} cols={5} />
            </div>
          ) : !data?.items?.length ? (
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title={debouncedQuery ? 'No hay resultados para tu búsqueda' : 'Aún no hay pacientes'}
              description={
                debouncedQuery
                  ? 'Probá con DNI, apellido o un término más corto.'
                  : 'Registrá el primer paciente para comenzar a emitir recetas, órdenes y turnos.'
              }
              actionLabel={debouncedQuery ? undefined : 'Nuevo paciente'}
              onAction={debouncedQuery ? undefined : () => setModalOpen(true)}
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedItems.map((patient) => {
                const inactive = patient.isActive === false;
                return (
                  <div
                    key={patient.id}
                    className={`px-4 sm:px-5 py-4 flex flex-wrap items-center gap-3 sm:gap-4 ${
                      inactive ? 'opacity-75 bg-gray-50/50' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleRowClick(patient.id)}
                      className="flex-1 min-w-0 text-left hover:opacity-90"
                    >
                      <p className={`font-medium truncate ${inactive ? 'text-gray-600' : 'text-gray-900'}`}>
                        {patient.lastName}, {patient.firstName}
                      </p>
                      {patient.medicalRecordNumber != null && (
                        <p className="mt-1 text-xs font-medium text-ensigna-primary-dark">
                          N° HC {patient.medicalRecordNumber}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                        {patient.dni && (
                          <span className="inline-flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            DNI {patient.dni}
                          </span>
                        )}
                        {patient.phone && (
                          <span className="inline-flex items-center gap-1 truncate">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            {patient.phone}
                          </span>
                        )}
                        {patient.email && (
                          <span className="inline-flex items-center gap-1 truncate">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            {patient.email}
                          </span>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {inactive && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                          Inactivo
                        </span>
                      )}
                      <span className="text-xs text-gray-400 hidden lg:inline">
                        <Calendar className="w-3.5 h-3.5 inline mr-0.5" />
                        {formatDate(patient.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRowClick(patient.id)}
                        className="touch-row inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/dashboard/patients/${patient.id}?edit=1`)
                        }
                        className="touch-row inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      {canPrescribe && patient.isActive !== false && (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/prescriptions/new?patientId=${patient.id}`,
                            )
                          }
                          className="touch-row inline-flex items-center gap-2 rounded-xl border border-indigo-200  px-4 py-3 text-sm font-medium text-ensigna-primary-dark hover:bg-ensigna-primary-light hover:text-white"
                        >
                          <FilePlus2 className="w-3.5 h-3.5" />
                          Crear receta
                        </button>
                      )}
                      {canCreateOrder && patient.isActive !== false && (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/orders/new?patientId=${patient.id}`,
                            )
                          }
                          className="touch-row inline-flex items-center gap-2 rounded-xl border border-indigo-200  px-4 py-3 text-sm font-medium text-ensigna-primary-dark hover:bg-ensigna-primary-light hover:text-white"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          Crear orden
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="px-4 sm:px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>
              {data.items.length} de {data.total} paciente{data.total !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <CreatePatientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleCreated}
      />
    </motion.div>
  );
}
