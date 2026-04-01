'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  User,
  Stethoscope,
  FileText,
  Loader2,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  XCircle,
  UserX,
  Ban,
  ClipboardList,
  Banknote,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import RegisterPaymentModal from './RegisterPaymentModal';

export interface AppointmentDetail {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  reason?: string | null;
  notes?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dni?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    specialty?: string | null;
  };
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programado',
  PENDING_CONFIRMATION: 'Pendiente de confirmación',
  CONFIRMED: 'Confirmado',
  RESCHEDULE_REQUESTED: 'Reprogramar',
  COMPLETED: 'Realizado',
  CANCELED: 'Cancelado',
  NO_SHOW: 'No se presentó',
};

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-amber-100 text-amber-800 border-amber-200',
  PENDING_CONFIRMATION:
    'bg-[rgba(209,106,138,0.1)] text-[#D16A8A] border-[rgba(209,106,138,0.25)]',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  RESCHEDULE_REQUESTED:
    'bg-sky-100 text-sky-900 border-sky-200',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
  CANCELED: 'bg-gray-100 text-gray-600 border-gray-200',
  NO_SHOW: 'bg-red-100 text-red-800 border-red-200',
};

type AppointmentPaymentRow = {
  id: string;
  status: string;
  source: string;
  amount: number;
};

function paymentBadgeForAppointment(rows: AppointmentPaymentRow[]): {
  label: string;
  className: string;
} {
  if (!rows.length) {
    return {
      label: 'Sin registro de pago',
      className: 'bg-gray-100 text-gray-600 border-gray-200',
    };
  }
  const hasPaid = rows.some((p) => p.status === 'PAID');
  const hasPending = rows.some((p) => p.status === 'PENDING');
  const allCanceled = rows.every((p) => p.status === 'CANCELED');
  if (allCanceled) {
    return {
      label: 'Pagos anulados',
      className: 'bg-red-100 text-red-800 border-red-200',
    };
  }
  if (hasPaid && !hasPending) {
    return {
      label: 'Pagado',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  }
  if (hasPending && rows.some((p) => p.source === 'INSURANCE' && p.status === 'PENDING')) {
    return {
      label: 'Obra social (pendiente)',
      className: 'bg-amber-100 text-amber-900 border-amber-200',
    };
  }
  if (hasPending) {
    return {
      label: 'Cobro pendiente',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    };
  }
  if (hasPaid) {
    return {
      label: 'Cobro registrado',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
  }
  return {
    label: '—',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  };
}

interface AppointmentDetailModalProps {
  appointmentId: string;
  onClose: () => void;
  onSuccess?: () => void;
  onAddMedicalRecord?: (patientId: string, appointmentId: string) => void;
  canEdit?: boolean;
}

type ActionVisual = 'success' | 'primary' | 'danger' | 'neutral' | 'outline';

function TurnActionButton({
  visual,
  icon,
  title,
  description,
  loading,
  disabled,
  onClick,
  'aria-label': ariaLabel,
}: {
  visual: ActionVisual;
  icon: ReactNode;
  title: string;
  description: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  'aria-label'?: string;
}) {
  const shell: Record<ActionVisual, string> = {
    success:
      'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-600/25 hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.99]',
    primary:
      'bg-gradient-to-br from-[#D16A8A] to-[#E89AB0] text-white shadow-md shadow-[rgba(209,106,138,0.25)] hover:brightness-105 active:scale-[0.99]',
    danger:
      'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-md shadow-red-600/20 hover:from-red-500 hover:to-red-600 active:scale-[0.99]',
    neutral:
      'bg-white text-gray-800 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.99]',
    outline:
      'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.99]',
  };
  const iconBg: Record<ActionVisual, string> = {
    success: 'bg-white/20 text-white',
    primary: 'bg-white/20 text-white',
    danger: 'bg-white/20 text-white',
    neutral: 'bg-gray-100 text-gray-600',
    outline: 'bg-amber-50 text-amber-700',
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel ?? title}
      className={`group w-full flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none touch-manipulation min-h-[4.25rem] ${shell[visual]}`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg[visual]}`}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-semibold text-[15px] leading-tight">
          {title}
          {(visual === 'success' || visual === 'primary') && (
            <ArrowRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5 shrink-0" />
          )}
        </span>
        <span
          className={`mt-0.5 block text-xs leading-snug ${
            visual === 'neutral' || visual === 'outline'
              ? 'text-gray-500'
              : 'text-white/85'
          }`}
        >
          {description}
        </span>
      </span>
    </button>
  );
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return `${days[date.getDay()]}, ${d} de ${months[m - 1]} de ${y}`;
}

export default function AppointmentDetailModal({
  appointmentId,
  onClose,
  onSuccess,
  onAddMedicalRecord,
  canEdit = false,
}: AppointmentDetailModalProps) {
  const [detail, setDetail] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [appointmentPayments, setAppointmentPayments] = useState<AppointmentPaymentRow[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAppointmentById(appointmentId);
      setDetail(data as AppointmentDetail);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'No se pudo cargar el turno.',
      );
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const fetchAppointmentPayments = useCallback(async (aptId: string) => {
    setPaymentsLoading(true);
    try {
      const list = await apiClient.getPayments({ appointmentId: aptId });
      const arr = Array.isArray(list) ? list : [];
      setAppointmentPayments(
        arr.map((p: AppointmentPaymentRow) => ({
          id: p.id,
          status: p.status,
          source: p.source,
          amount: p.amount,
        })),
      );
    } catch {
      setAppointmentPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!detail?.id) {
      setAppointmentPayments([]);
      return;
    }
    void fetchAppointmentPayments(detail.id);
  }, [detail?.id, fetchAppointmentPayments]);

  const hasAppointmentPayment = appointmentPayments.length > 0;

  useEffect(() => {
    if (hasAppointmentPayment) setPaymentModalOpen(false);
  }, [hasAppointmentPayment]);

  const handleStatusChange = async (newStatus: string, cancelReasonValue?: string) => {
    if (!detail || !canEdit) return;
    setActionLoading(newStatus);
    setError(null);
    try {
      await apiClient.patchAppointmentStatus(detail.id, {
        status: newStatus,
        ...(newStatus === 'CANCELED' && cancelReasonValue != null && { cancelReason: cancelReasonValue }),
      });
      await fetchDetail();
      onSuccess?.();
      if (newStatus === 'CANCELED') {
        setShowCancelConfirm(false);
        setCancelReason('');
      }
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'No se pudo actualizar el turno.',
      );
    } finally {
      setActionLoading(null);
    }
  };

  const statusStyle = detail ? STATUS_STYLES[detail.status] ?? STATUS_STYLES.SCHEDULED : '';
  const statusLabel = detail ? (STATUS_LABELS[detail.status] ?? detail.status) : '';
  const payBadge = paymentBadgeForAppointment(appointmentPayments);

  const canTransition =
    canEdit &&
    detail &&
    [
      'SCHEDULED',
      'PENDING_CONFIRMATION',
      'RESCHEDULE_REQUESTED',
      'CONFIRMED',
    ].includes(detail.status);

  const actionsScheduled = canEdit && detail?.status === 'SCHEDULED';
  const actionsPendingConfirmation =
    canEdit && detail?.status === 'PENDING_CONFIRMATION';
  const actionsRescheduleRequested =
    canEdit && detail?.status === 'RESCHEDULE_REQUESTED';
  const actionsConfirmed = canEdit && detail?.status === 'CONFIRMED';

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-detail-title"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 min-h-[100dvh] min-w-full ensigna-modal-backdrop z-0"
          onClick={onClose}
          aria-hidden
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-hidden ensigna-modal-panel flex flex-col rounded-[var(--ensigna-radius-lg)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between flex-shrink-0 px-4 sm:px-6 py-4 border-b border-black/[0.06] bg-white/40 backdrop-blur-md">
            <h2 id="appointment-detail-title" className="text-lg font-semibold text-gray-900">
              Detalle del turno
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors touch-manipulation"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                <p className="text-sm text-gray-500">Cargando turno...</p>
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            ) : detail ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{formatDateLabel(detail.date)}</p>
                    <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {detail.startTime} – {detail.endTime}
                    </p>
                    <span
                      className={`inline-block mt-2 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusStyle}`}
                    >
                      {statusLabel}
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {paymentsLoading ? (
                        <span className="text-xs text-gray-500">Cargando cobros…</span>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${payBadge.className}`}
                        >
                          {payBadge.label}
                        </span>
                      )}
                    </div>
                    {detail.status === 'CANCELED' && detail.cancelReason && (
                      <p className="text-xs text-gray-600 mt-2 italic">Motivo cancelación: {detail.cancelReason}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Motivo de consulta</span>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-700">
                      {detail.reason ? (
                        <>&quot;{detail.reason}&quot;</>
                      ) : (
                        <span className="text-gray-400 italic">No indicado</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Paciente</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="font-semibold text-gray-900">
                      {detail.patient.firstName} {detail.patient.lastName}
                    </p>
                    {detail.patient.dni && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        DNI: {detail.patient.dni}
                      </p>
                    )}
                    {detail.patient.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${detail.patient.phone}`} className="text-amber-600 hover:underline">
                          {detail.patient.phone}
                        </a>
                      </p>
                    )}
                    {detail.patient.email && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${detail.patient.email}`} className="text-amber-600 hover:underline truncate block">
                          {detail.patient.email}
                        </a>
                      </p>
                    )}
                    {!detail.patient.dni && !detail.patient.phone && !detail.patient.email && (
                      <p className="text-sm text-gray-400">Sin datos de contacto adicionales</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Profesional</span>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-gray-900">
                      {detail.professional.firstName} {detail.professional.lastName}
                    </p>
                    {detail.professional.specialty && (
                      <p className="text-sm text-gray-600 mt-0.5">{detail.professional.specialty}</p>
                    )}
                  </div>
                </div>

                {detail.notes && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Notas</span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{detail.notes}</p>
                    </div>
                  </div>
                )}

                {/* —— Acciones del turno (estado) —— */}
                <AnimatePresence mode="wait">
                  {showCancelConfirm ? (
                    <motion.div
                      key="cancel-panel"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden rounded-2xl border-2 border-red-200 bg-gradient-to-b from-red-50/90 to-white shadow-sm"
                    >
                      <div className="border-b border-red-100 bg-red-50/80 px-4 py-3 flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                          <Ban className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <p className="font-semibold text-red-950 text-[15px]">
                            Cancelar este turno
                          </p>
                          <p className="text-xs text-red-800/80 mt-0.5 leading-relaxed">
                            El paciente verá el turno como cancelado. Podés dejar un motivo para el
                            historial interno.
                          </p>
                        </div>
                      </div>
                      <div className="p-4 space-y-4">
                        <label className="block">
                          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Motivo <span className="font-normal text-gray-400">(opcional)</span>
                          </span>
                          <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Ej.: reprogramación, pedido del paciente…"
                            rows={3}
                            className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200/60"
                          />
                        </label>
                        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                          <button
                            type="button"
                            disabled={!!actionLoading}
                            onClick={() => {
                              setShowCancelConfirm(false);
                              setCancelReason('');
                            }}
                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 touch-manipulation min-h-[2.75rem]"
                          >
                            Volver sin cancelar
                          </button>
                          <button
                            type="button"
                            disabled={!!actionLoading}
                            onClick={() =>
                              handleStatusChange(
                                'CANCELED',
                                cancelReason.trim() || undefined,
                              )
                            }
                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 touch-manipulation min-h-[2.75rem] shadow-sm shadow-red-600/20"
                          >
                            {actionLoading === 'CANCELED' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4 shrink-0" />
                            )}
                            Confirmar cancelación
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : canTransition ? (
                    <motion.div
                      key="actions-panel"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-2xl border border-gray-200/90 bg-gradient-to-b from-gray-50/80 to-white shadow-sm overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-white/60">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                          <Zap className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Acciones del turno
                          </p>
                          <p className="text-xs text-gray-500">
                            {actionsScheduled &&
                              'Enviá la solicitud de confirmación por WhatsApp o cancelá si ya no aplica.'}
                            {actionsPendingConfirmation &&
                              'El paciente debe confirmar, cancelar o pedir reprogramar desde WhatsApp. Podés cancelar acá si corresponde.'}
                            {actionsRescheduleRequested &&
                              'El paciente pidió reprogramar. Cancelá el turno si ya no aplica o gestioná el nuevo horario con la agenda.'}
                            {actionsConfirmed &&
                              'Registrá el resultado cuando el paciente pase por consulta.'}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        {actionsScheduled && (
                          <>
                            <TurnActionButton
                              visual="success"
                              icon={<CheckCircle className="h-5 w-5" />}
                              title="Solicitar confirmación (WhatsApp)"
                              description="Se envía la plantilla al paciente; el turno queda pendiente hasta que responda."
                              loading={actionLoading === 'PENDING_CONFIRMATION'}
                              disabled={
                                !!actionLoading &&
                                actionLoading !== 'PENDING_CONFIRMATION'
                              }
                              onClick={() =>
                                handleStatusChange('PENDING_CONFIRMATION')
                              }
                            />
                            <div className="relative flex items-center gap-3 py-0.5">
                              <div className="h-px flex-1 bg-gray-200" />
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                o
                              </span>
                              <div className="h-px flex-1 bg-gray-200" />
                            </div>
                            <TurnActionButton
                              visual="outline"
                              icon={<Ban className="h-5 w-5" />}
                              title="Cancelar turno"
                              description="Liberá el horario si la visita no se realizará."
                              loading={false}
                              disabled={!!actionLoading}
                              onClick={() => setShowCancelConfirm(true)}
                              aria-label="Cancelar turno"
                            />
                          </>
                        )}

                        {(actionsPendingConfirmation ||
                          actionsRescheduleRequested) && (
                          <>
                            <TurnActionButton
                              visual="outline"
                              icon={<Ban className="h-5 w-5" />}
                              title="Cancelar turno"
                              description="Liberá el horario si la visita no se realizará."
                              loading={false}
                              disabled={!!actionLoading}
                              onClick={() => setShowCancelConfirm(true)}
                              aria-label="Cancelar turno"
                            />
                          </>
                        )}

                        {actionsConfirmed && (
                          <>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 px-0.5">
                              Resultado de la consulta
                            </p>
                            <div className="space-y-2.5">
                              <TurnActionButton
                                visual="primary"
                                icon={<CheckCircle className="h-5 w-5" />}
                                title="Marcar como atendido"
                                description="La consulta se realizó con normalidad."
                                loading={actionLoading === 'COMPLETED'}
                                disabled={
                                  !!actionLoading && actionLoading !== 'COMPLETED'
                                }
                                onClick={() => handleStatusChange('COMPLETED')}
                              />
                              <TurnActionButton
                                visual="danger"
                                icon={<UserX className="h-5 w-5" />}
                                title="No se presentó"
                                description="Ausencia del paciente sin aviso previo."
                                loading={actionLoading === 'NO_SHOW'}
                                disabled={
                                  !!actionLoading && actionLoading !== 'NO_SHOW'
                                }
                                onClick={() => handleStatusChange('NO_SHOW')}
                              />
                            </div>
                            <div className="relative flex items-center gap-3 py-1">
                              <div className="h-px flex-1 bg-gray-200" />
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                anulación
                              </span>
                              <div className="h-px flex-1 bg-gray-200" />
                            </div>
                            <TurnActionButton
                              visual="neutral"
                              icon={<Ban className="h-5 w-5 text-gray-500" />}
                              title="Cancelar turno"
                              description="Anulá la cita (distinto a inasistencia)."
                              loading={false}
                              disabled={!!actionLoading}
                              onClick={() => setShowCancelConfirm(true)}
                              aria-label="Cancelar turno"
                            />
                          </>
                        )}
                      </div>
                    </motion.div>
                  ) : ['COMPLETED', 'CANCELED', 'NO_SHOW'].includes(
                      detail.status,
                    ) ? (
                    <motion.div
                      key="closed-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/90 px-4 py-3.5"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          detail.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-700'
                            : detail.status === 'CANCELED'
                              ? 'bg-gray-200/90 text-gray-600'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {detail.status === 'COMPLETED' && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        {detail.status === 'CANCELED' && <Ban className="h-4 w-4" />}
                        {detail.status === 'NO_SHOW' && (
                          <UserX className="h-4 w-4" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        <p className="font-medium text-gray-800">Turno cerrado</p>
                        <p className="mt-0.5 text-xs">
                          {detail.status === 'COMPLETED' &&
                            'Marcado como realizado. Podés registrar cobro o historia clínica abajo.'}
                          {detail.status === 'CANCELED' &&
                            'Este turno fue cancelado. No hay más acciones disponibles.'}
                          {detail.status === 'NO_SHOW' &&
                            'Inasistencia registrada. El estado no se puede modificar desde aquí.'}
                        </p>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Cobranza */}
                <div
                  className={`rounded-2xl border p-4 transition-shadow ${
                    hasAppointmentPayment
                      ? 'border-gray-200 bg-gray-50/80'
                      : 'border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <Banknote className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-semibold text-gray-900">Cobranza</p>
                  </div>
                  {paymentsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-1">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                      Comprobando cobros…
                    </div>
                  ) : hasAppointmentPayment ? (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Ya hay un pago vinculado a este turno. Para ajustes, usá{' '}
                      <span className="font-medium text-gray-800">Finanzas</span>{' '}
                      (anular o marcar cobro obra social: según permisos).
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPaymentModalOpen(true)}
                      className="mt-1 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-700 active:scale-[0.99] touch-manipulation min-h-[2.75rem]"
                    >
                      <Banknote className="w-4 h-4 shrink-0" />
                      Registrar pago
                    </button>
                  )}
                </div>

                {/* Historia clínica (turno COMPLETED) */}
                {detail.status === 'COMPLETED' && onAddMedicalRecord && (
                  <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/60 to-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-indigo-950">
                          Historia clínica
                        </p>
                        <p className="text-xs text-indigo-900/70 mt-0.5 leading-relaxed">
                          ¿Querés dejar constancia de esta consulta en la historia del paciente?
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            onAddMedicalRecord(detail.patient.id, detail.id)
                          }
                          className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm min-h-[2.75rem] touch-manipulation"
                        >
                          <ClipboardList className="w-4 h-4 shrink-0" />
                          Agregar a historia clínica
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/80">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>

      {detail && !hasAppointmentPayment && (
        <RegisterPaymentModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={() => {
            void fetchAppointmentPayments(detail.id);
            onSuccess?.();
          }}
          defaultPatientId={detail.patient.id}
          defaultPatientLabel={`${detail.patient.firstName} ${detail.patient.lastName}`}
          defaultAppointmentId={detail.id}
          allowPatientChange={false}
        />
      )}
    </AnimatePresence>
  );
}
