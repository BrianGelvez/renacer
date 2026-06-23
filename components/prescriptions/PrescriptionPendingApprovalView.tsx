'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import { apiClient, type PrescriptionDto, type PrescriptionCorrectionEvent } from '@/lib/api';
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

type Props = {
  prescriptionId: string;
};

export default function PrescriptionPendingApprovalView({
  prescriptionId,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [rx, setRx] = useState<PrescriptionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<PrescriptionCorrectionEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reason, setReason] = useState('');

  const canApprove =
    (user?.role === 'DOCTOR' || user?.isDoctor === true) &&
    rx?.status === 'PENDING_APPROVAL' &&
    rx?.doctorId === user?.id;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getPrescription(prescriptionId);
      setRx(data);
    } catch {
      setError('No se pudo cargar la receta.');
    } finally {
      setLoading(false);
    }
  }, [prescriptionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApproveAndIssue = async () => {
    if (!rx) return;
    setActing(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await apiClient.approveAndIssuePrescription(rx.id);
      setRx(updated);
      setSuccess('Receta aprobada y emitida en Recetario.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al emitir la receta.';
      setError(typeof msg === 'string' ? msg : 'Error al emitir la receta.');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!rx || !reason.trim()) return;
    setActing(true);
    setError(null);
    try {
      const updated = await apiClient.rejectPrescription(rx.id, reason.trim());
      setRx(updated);
      setRejectOpen(false);
      setReason('');
      setSuccess('Receta rechazada. Se notificó al equipo administrativo.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al rechazar.';
      setError(typeof msg === 'string' ? msg : 'Error al rechazar.');
    } finally {
      setActing(false);
    }
  };

  const canEdit =
    user?.id === rx?.createdById && rx?.status === 'CHANGES_REQUESTED';

  const statusBadge = (status: PrescriptionDto['status']) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return { label: 'Pendiente de aprobación', className: 'bg-violet-100 text-violet-800' };
      case 'CHANGES_REQUESTED':
        return { label: 'Pendiente de corrección', className: 'bg-amber-100 text-amber-800' };
      case 'ISSUED':
        return { label: 'Emitida', className: 'bg-emerald-100 text-emerald-800' };
      case 'REJECTED':
        return { label: 'Rechazada', className: 'bg-red-100 text-red-800' };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-800' };
    }
  };

  const openHistory = async () => {
    if (!rx) return;
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await apiClient.getPrescriptionCorrectionHistory(rx.id);
      setHistory(res.events);
    } catch {
      setHistory(rx.correctionHistory ?? []);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!rx || !reason.trim()) return;
    setActing(true);
    setError(null);
    try {
      const updated = await apiClient.requestPrescriptionChanges(
        rx.id,
        reason.trim(),
      );
      setRx(updated);
      setChangesOpen(false);
      setReason('');
      setSuccess('Se solicitaron cambios al equipo administrativo.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al solicitar cambios.';
      setError(typeof msg === 'string' ? msg : 'Error al solicitar cambios.');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!rx) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-800">
        {error ?? 'Receta no encontrada.'}
      </div>
    );
  }

  const medicines = rx.clinicalRequest?.medicines ?? [];
  const badge = statusBadge(rx.status);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={() => router.push('/dashboard/prescriptions/pending')}
        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a pendientes
      </button>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-600">
              Receta pendiente de aprobación
            </p>
            <h1 className="mt-1 text-xl font-semibold text-gray-900">
              {rx.patient
                ? `${rx.patient.lastName}, ${rx.patient.firstName}`
                : 'Paciente'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">ID {rx.id}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        {rx.status === 'CHANGES_REQUESTED' && rx.rejectionReason && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">
              El médico solicitó modificaciones antes de aprobar esta receta.
            </p>
            <p className="mt-2 whitespace-pre-wrap">{rx.rejectionReason}</p>
            {rx.rejectedBy && (
              <p className="mt-2 text-xs text-amber-800">
                Solicitado por Dr. {rx.rejectedBy.lastName},{' '}
                {rx.rejectedBy.firstName}
                {rx.rejectedAt ? ` · ${formatDateTime(rx.rejectedAt)}` : ''}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {rx.rejectionReason &&
          rx.status === 'REJECTED' && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Observación del médico</p>
            <p className="mt-1">{rx.rejectionReason}</p>
          </div>
        )}

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Médico responsable
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {rx.doctor
                ? `Dr. ${rx.doctor.lastName}, ${rx.doctor.firstName}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Preparada por
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {rx.createdBy
                ? `${rx.createdBy.lastName}, ${rx.createdBy.firstName}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Fecha de creación
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatDateTime(rx.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">
              Fecha de receta
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {rx.clinicalRequest?.date ?? '—'}
            </dd>
          </div>
        </dl>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900">Diagnóstico</h2>
        <p className="mt-2 text-sm text-gray-800">
          {rx.diagnosisDescriptionEs ?? rx.diagnosis}
        </p>
        {rx.diagnosisCode && (
          <p className="mt-1 text-xs text-gray-500">CIE-10: {rx.diagnosisCode}</p>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900">Medicamentos</h2>
        {medicines.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Sin medicamentos cargados.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {medicines.map((m, idx) => {
              const med = m as {
                externalId?: string;
                quantity?: number;
                posology?: string;
                longTerm?: boolean;
              };
              return (
                <li
                  key={`${med.externalId ?? idx}`}
                  className="rounded-xl bg-gray-50 p-4 text-sm"
                >
                  <p className="font-medium text-gray-900">
                    Medicamento #{med.externalId ?? idx + 1}
                  </p>
                  <p className="mt-1 text-gray-600">
                    Cantidad: {med.quantity ?? '—'} · Posología:{' '}
                    {med.posology ?? '—'}
                    {med.longTerm ? ' · Tratamiento prolongado' : ''}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {(rx.clinicalRequest?.clinicalNotes ||
        rx.clinicalRequest?.reference) && (
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">Observaciones</h2>
          {rx.clinicalRequest?.clinicalNotes && (
            <p className="mt-2 text-sm text-gray-800">
              {rx.clinicalRequest.clinicalNotes}
            </p>
          )}
          {rx.clinicalRequest?.reference && (
            <p className="mt-2 text-sm text-gray-600">
              Referencia: {rx.clinicalRequest.reference}
            </p>
          )}
        </section>
      )}

      {canApprove && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={acting}
            onClick={() => void handleApproveAndIssue()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {acting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Aprobar y emitir
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={() => {
              setChangesOpen(false);
              setRejectOpen(true);
              setReason('');
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />
            Rechazar
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={() => {
              setRejectOpen(false);
              setChangesOpen(true);
              setReason('');
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-5 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-50"
          >
            <MessageSquare className="h-4 w-4" />
            Solicitar cambios
          </button>
        </div>
      )}

      {!canApprove && rx.status === 'PENDING_APPROVAL' && (
        <p className="text-sm text-gray-500">
          Solo el médico asignado puede aprobar o rechazar esta receta.
        </p>
      )}

      {canEdit && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(`/dashboard/prescriptions/pending/${rx.id}/edit`)
            }
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Editar receta
          </button>
          <button
            type="button"
            onClick={() => void openHistory()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Ver historial de correcciones
          </button>
        </div>
      )}

      {(rx.correctionHistory?.length ?? 0) > 0 && !canEdit && (
        <button
          type="button"
          onClick={() => void openHistory()}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Ver historial de correcciones
        </button>
      )}

      {(rejectOpen || changesOpen) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700">
            {rejectOpen ? 'Motivo del rechazo' : 'Observaciones para corrección'}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Escribí el detalle..."
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={acting || !reason.trim()}
              onClick={() =>
                void (rejectOpen ? handleReject() : handleRequestChanges())
              }
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => {
                setRejectOpen(false);
                setChangesOpen(false);
                setReason('');
              }}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {rx.status === 'ISSUED' && rx.pdfUrl && (
        <a
          href={rx.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-sm font-medium text-indigo-600 hover:underline"
        >
          Ver PDF emitido
        </a>
      )}

      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="font-semibold text-gray-900">
                Historial de correcciones
              </h3>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-gray-500">Sin eventos registrados.</p>
              ) : (
                <ul className="space-y-3">
                  {history.map((ev, idx) => (
                    <li
                      key={`${ev.at}-${idx}`}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm"
                    >
                      <p className="font-medium text-gray-900">
                        {ev.type === 'CHANGES_REQUESTED'
                          ? 'Cambios solicitados'
                          : ev.type === 'ADMIN_CORRECTED'
                            ? 'Corrección aplicada'
                            : 'Reenviada a aprobación'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {ev.userName ?? ev.userId} · {formatDateTime(ev.at)}
                      </p>
                      {ev.note && (
                        <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                          {ev.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-gray-100 px-5 py-3 text-right">
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
