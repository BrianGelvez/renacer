'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { apiClient, type MedicalOrderDto } from '@/lib/api';

type Props = {
  orderId: string;
};

function JsonBlock({ data }: { data: unknown }) {
  if (data == null) return <p className="text-sm text-gray-500">—</p>;
  return (
    <pre className="max-h-64 overflow-auto rounded-xl bg-gray-900 p-4 text-xs text-gray-100">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function OrderDetailView({ orderId }: Props) {
  const router = useRouter();
  const [order, setOrder] = useState<MedicalOrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getMedicalOrder(orderId);
      setOrder(data);
    } catch {
      setError('No se pudo cargar la orden.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);
    try {
      const updated = await apiClient.retryMedicalOrder(orderId);
      setOrder(updated);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al reemitir.';
      setError(typeof msg === 'string' ? msg : 'Error al reemitir.');
      await load();
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-800">
        {error ?? 'Orden no encontrada.'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button
        type="button"
        onClick={() => router.push('/dashboard/orders')}
        className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a órdenes
      </button>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Detalle de orden médica</h1>
            <p className="mt-1 text-sm text-gray-500 font-mono">{order.id}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              order.status === 'EMITTED' || order.status === 'ISSUED'
                ? 'bg-emerald-100 text-emerald-800'
                : order.status === 'FAILED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
            }`}
          >
            {order.status}
          </span>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {order.errorMessage && order.status === 'FAILED' && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            {order.errorMessage}
          </div>
        )}

        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-gray-500">Paciente</dt>
            <dd className="font-medium">
              {order.patient
                ? `${order.patient.lastName}, ${order.patient.firstName}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Médico</dt>
            <dd className="font-medium">
              {order.doctor
                ? `Dr. ${order.doctor.lastName}, ${order.doctor.firstName}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Diagnóstico</dt>
            <dd>
              {order.diagnosisCode} — {order.diagnosisDescription}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Fecha emisión</dt>
            <dd>{order.orderDate}</dd>
          </div>
          <div>
            <dt className="text-gray-500">ID Recetario</dt>
            <dd className="font-mono">{order.recetarioOrderId ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Referencia</dt>
            <dd className="font-mono">{order.reference ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-500">Solicitudes</dt>
            <dd className="mt-1 whitespace-pre-wrap rounded-xl bg-gray-50 p-3">
              {order.requestItems?.length
                ? order.requestItems.map((i) => i.description).join('\n')
                : order.orderText}
            </dd>
          </div>
        </dl>

        {order.pdfUrl && (
          <a
            href={order.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
          >
            <ExternalLink className="h-4 w-4" />
            Ver PDF
          </a>
        )}

        {order.status === 'FAILED' && (
          <button
            type="button"
            disabled={retrying}
            onClick={() => void handleRetry()}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-60"
          >
            {retrying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Reemitir orden
          </button>
        )}

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Payload enviado a Recetario</h2>
          <JsonBlock data={order.rawRequest} />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Respuesta Recetario</h2>
          <JsonBlock data={order.rawResponse} />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Auditoría local</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Creada</dt>
              <dd>{new Date(order.createdAt).toLocaleString('es-AR')}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Actualizada</dt>
              <dd>{new Date(order.updatedAt).toLocaleString('es-AR')}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Emitida por</dt>
              <dd>
                {order.createdBy
                  ? `${order.createdBy.lastName}, ${order.createdBy.firstName}`
                  : '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
