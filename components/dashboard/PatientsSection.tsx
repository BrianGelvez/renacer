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
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import CreatePatientModal from './CreatePatientModal';

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

  const canFilterMyAppointments =
    user?.role === 'DOCTOR' || user?.isDoctor === true;

  const [myAppointmentsOnly, setMyAppointmentsOnly] = useState(false);

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
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-500/20"
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
                    ? 'bg-indigo-600 text-white'
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
        </div>

        {error && (
          <div className="mx-4 sm:mx-5 mt-4 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="min-h-[280px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
              <p className="text-sm text-gray-500">Cargando pacientes...</p>
            </div>
          ) : !data?.items?.length ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium">
                {debouncedQuery ? 'No hay resultados para tu búsqueda' : 'Aún no hay pacientes'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {debouncedQuery ? 'Probá con otro término.' : 'Creá el primero desde "Nuevo paciente".'}
              </p>
            </div>
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
                        <p className="mt-1 text-xs font-medium text-indigo-700">
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
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/dashboard/patients/${patient.id}?edit=1`)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50"
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
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-700 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
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
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-teal-700 border border-teal-200 bg-teal-50 hover:bg-teal-100"
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
