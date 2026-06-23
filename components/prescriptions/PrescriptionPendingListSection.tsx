'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import { apiClient, type PrescriptionDto } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status: PrescriptionDto['status']): string {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'Pendiente de aprobación';
    case 'CHANGES_REQUESTED':
      return 'Pendiente de corrección';
    case 'ISSUED':
      return 'Emitida';
    case 'REJECTED':
      return 'Rechazada';
    default:
      return status;
  }
}

export default function PrescriptionPendingListSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<PrescriptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.listPendingPrescriptions();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar las recetas pendientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isDoctorViewer =
    user?.role === 'DOCTOR' || user?.isDoctor === true;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
          <ClipboardList className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Recetas pendientes
          </h2>
          <p className="text-sm text-gray-500">
            {isDoctorViewer
              ? 'Solicitudes que requieren tu revisión y firma'
              : 'Seguimiento de recetas enviadas a aprobación médica'}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            <p className="text-sm text-gray-500">Cargando...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center px-4">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <p className="mt-3 font-medium text-gray-700">
              No hay recetas pendientes
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((rx) => (
              <li key={rx.id}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/dashboard/prescriptions/pending/${rx.id}`)
                  }
                  className="w-full px-5 py-4 text-left transition hover:bg-indigo-50/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {rx.patient
                          ? `${rx.patient.lastName}, ${rx.patient.firstName}`
                          : 'Paciente'}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {rx.diagnosisDescriptionEs ?? rx.diagnosis}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Médico:{' '}
                        {rx.doctor
                          ? `Dr. ${rx.doctor.lastName}, ${rx.doctor.firstName}`
                          : '—'}
                        {' · '}
                        Creada {formatDateTime(rx.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        rx.status === 'CHANGES_REQUESTED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-violet-100 text-violet-800'
                      }`}
                    >
                      {statusLabel(rx.status)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
