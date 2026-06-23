'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  ExternalLink,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { apiClient, type MedicalOrderDto } from '@/lib/api';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusLabel(status: MedicalOrderDto['status']): string {
  switch (status) {
    case 'DRAFT':
      return 'Borrador';
    case 'PENDING_APPROVAL':
      return 'Pendiente de aprobación';
    case 'APPROVED':
      return 'Aprobada';
    case 'EMITTED':
    case 'ISSUED':
      return 'Emitida';
    case 'FAILED':
      return 'Fallida';
    case 'REJECTED':
      return 'Rechazada';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status;
  }
}

function statusClass(status: MedicalOrderDto['status']): string {
  switch (status) {
    case 'ISSUED':
    case 'EMITTED':
      return 'bg-emerald-100 text-emerald-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'PENDING':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function OrdersListSection() {
  const router = useRouter();
  const [items, setItems] = useState<MedicalOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.listMedicalOrders({ page, limit });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const updated = await apiClient.retryMedicalOrder(id);
      if (updated.status === 'ISSUED') {
        router.push(`/dashboard/orders/${id}`);
      } else {
        await load();
      }
    } catch {
      await load();
    } finally {
      setRetryingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Órdenes médicas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Estudios, interconsultas, certificados y órdenes emitidas en Recetario.
          </p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Crear orden
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-500">
            <ClipboardList className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3">No hay órdenes médicas emitidas.</p>
            <Link
              href="/dashboard/orders/new"
              className="mt-4 inline-block text-teal-600 hover:underline"
            >
              Crear primera orden
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Diagnóstico</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Recetario ID</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      {row.patient
                        ? `${row.patient.lastName}, ${row.patient.firstName}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.doctor
                        ? `Dr. ${row.doctor.lastName}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate" title={row.diagnosisDescription}>
                      {row.diagnosisDescription}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(row.status)}`}>
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.recetarioOrderId ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.pdfUrl && (
                          <a
                            href={row.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-600 hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            PDF
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/orders/${row.id}`)}
                          className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Detalle
                        </button>
                        {row.status === 'FAILED' && (
                          <button
                            type="button"
                            disabled={retryingId === row.id}
                            onClick={() => void handleRetry(row.id)}
                            className="inline-flex items-center gap-1 text-amber-700 hover:underline disabled:opacity-50"
                          >
                            {retryingId === row.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Reemitir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
