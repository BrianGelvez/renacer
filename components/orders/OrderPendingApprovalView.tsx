'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  XCircle,
} from 'lucide-react';
import { apiClient, type MedicalOrderDto } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type Props = { orderId: string };

export default function OrderPendingApprovalView({ orderId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<MedicalOrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const canApprove =
    (user?.role === 'DOCTOR' || user?.isDoctor === true) &&
    order?.status === 'PENDING_APPROVAL' &&
    order?.doctorId === user?.id;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrder(await apiClient.getMedicalOrder(orderId));
    } catch {
      setError('No se pudo cargar la orden.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApproveAndIssue = async () => {
    if (!order) return;
    setActing(true);
    setError(null);
    try {
      const updated = await apiClient.approveAndIssueMedicalOrder(order.id);
      setOrder(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al emitir.';
      setError(typeof msg === 'string' ? msg : 'Error al emitir.');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!order || !reason.trim()) return;
    setActing(true);
    try {
      const updated = await apiClient.rejectMedicalOrder(order.id, reason.trim());
      setOrder(updated);
      setRejectOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al rechazar.';
      setError(typeof msg === 'string' ? msg : 'Error al rechazar.');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-teal-600" /></div>;
  }

  if (!order) {
    return <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-800">{error ?? 'Orden no encontrada.'}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button type="button" onClick={() => router.push('/dashboard/orders/pending')} className="inline-flex items-center gap-2 text-sm text-teal-600">
        <ArrowLeft className="h-4 w-4" /> Volver a pendientes
      </button>

      <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-semibold">Orden pendiente de aprobación</h1>
        {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-gray-500">Paciente</dt><dd>{order.patient ? `${order.patient.lastName}, ${order.patient.firstName}` : '—'}</dd></div>
          <div><dt className="text-gray-500">Diagnóstico</dt><dd>{order.diagnosisCode} — {order.diagnosisDescription}</dd></div>
          <div className="sm:col-span-2"><dt className="text-gray-500">Solicitudes</dt><dd className="whitespace-pre-wrap">{order.orderText}</dd></div>
        </dl>

        {canApprove && (
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" disabled={acting} onClick={() => void handleApproveAndIssue()} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Aprobar y emitir
            </button>
            <button type="button" onClick={() => setRejectOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm text-red-700">
              <XCircle className="h-4 w-4" /> Rechazar
            </button>
          </div>
        )}

        {(order.status === 'EMITTED' || order.status === 'ISSUED') && order.pdfUrl && (
          <a href={order.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-teal-600 text-sm">
            <ExternalLink className="h-4 w-4" /> Ver PDF emitido
          </a>
        )}
      </div>

      {rejectOpen && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
          <p className="font-medium">Motivo del rechazo</p>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full rounded-xl border px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="button" onClick={() => void handleReject()} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white">Confirmar</button>
            <button type="button" onClick={() => setRejectOpen(false)} className="rounded-lg px-4 py-2 text-sm">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
