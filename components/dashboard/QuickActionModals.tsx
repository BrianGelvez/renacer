'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  AlertCircle,
  Calendar,
  Wallet,
  Mail,
  Send,
  Trash2,
  Plus,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { SlotItem } from './ScheduleSection';
import BookingModal from './BookingModal';
import CreatePatientModal from './CreatePatientModal';
import EditClinicModal from './EditClinicModal';
import AppointmentDetailModal from './AppointmentDetailModal';
import RegisterPaymentModal from './RegisterPaymentModal';
import { ProfessionalPickerField, ModalListboxField } from './QuickModalPickers';

export type QuickActionKey =
  | 'new'
  | 'agenda'
  | 'patients'
  | 'reports'
  | 'finanzas'
  | 'availability'
  | 'team'
  | 'clinic'
  | 'conversations'
  | 'invite';

type DashboardSummary = Awaited<ReturnType<typeof apiClient.getDashboardSummary>>;

type ProfessionalRow = {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: string | null;
  phone?: string | null;
  isActive?: boolean;
  userId?: string | null;
};

type AvailabilityRow = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
};

type AppointmentRow = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  patient: { firstName: string; lastName: string };
};

type SlotsByDate = Record<string, SlotItem[]>;
type AppointmentsByDate = Record<string, AppointmentRow[]>;

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function rangeFromToday(days: number): { start: string; end: string } {
  const startD = new Date();
  const y = startD.getFullYear();
  const m = String(startD.getMonth() + 1).padStart(2, '0');
  const d = String(startD.getDate()).padStart(2, '0');
  const start = `${y}-${m}-${d}`;
  const endD = new Date(startD);
  endD.setDate(endD.getDate() + days);
  const ey = endD.getFullYear();
  const em = String(endD.getMonth() + 1).padStart(2, '0');
  const ed = String(endD.getDate()).padStart(2, '0');
  const end = `${ey}-${em}-${ed}`;
  return { start, end };
}

function formatMoneyArs(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n);
}

const TITLES: Record<QuickActionKey, string> = {
  new: 'Nuevo turno rápido',
  agenda: 'Próximos turnos',
  patients: 'Nuevo paciente',
  reports: 'Indicadores rápidos',
  finanzas: 'Cobros y finanzas',
  availability: 'Disponibilidad',
  team: 'Equipo',
  clinic: 'Mi clínica',
  conversations: 'Conversaciones',
  invite: 'Invitaciones',
};

interface QuickActionModalsProps {
  action: QuickActionKey | null;
  onClose: () => void;
  dashboardSummary: DashboardSummary | null;
  onDashboardRefresh: () => void;
}

function ModalFrame({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 min-h-[100dvh] ensigna-modal-backdrop"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'tween', duration: 0.2 }}
        className={`relative z-10 flex max-h-[min(92dvh,720px)] w-full flex-col overflow-visible rounded-t-[var(--ensigna-radius-lg)] border border-black/[0.06] bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-[var(--ensigna-radius-lg)] ${
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
          <h2 className="text-base font-semibold text-gray-900 sm:text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-x-visible overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function FramedContent({
  action,
  onClose,
  dashboardSummary,
  onDashboardRefresh,
}: QuickActionModalsProps) {
  const { user, loadUserData } = useAuth();
  const isStaff = user?.role === 'STAFF';
  const title = action ? TITLES[action] : '';

  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    if (action !== 'finanzas') setPayOpen(false);
  }, [action]);

  /* —— Nuevo turno —— */
  const [bookPros, setBookPros] = useState<ProfessionalRow[]>([]);
  const [bookProId, setBookProId] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotsFlat, setSlotsFlat] = useState<SlotItem[]>([]);
  const [bookingSlot, setBookingSlot] = useState<SlotItem | null>(null);
  const [proNameForBook, setProNameForBook] = useState('');
  const [slotsNonce, setSlotsNonce] = useState(0);

  useEffect(() => {
    if (action !== 'new') return;
    let cancelled = false;
    (async () => {
      try {
        const list = await apiClient.getProfessionals();
        const arr = Array.isArray(list) ? (list as ProfessionalRow[]) : [];
        const active = arr.filter((p) => p.isActive !== false);
        if (cancelled) return;
        setBookPros(active);
        setBookProId((prev) =>
          prev && active.some((p) => p.id === prev) ? prev : active[0]?.id ?? '',
        );
      } catch {
        if (!cancelled) setBookPros([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [action]);

  useEffect(() => {
    if (action !== 'new' || !bookProId) return;
    let cancelled = false;
    const { start, end } = rangeFromToday(14);
    setSlotsLoading(true);
    setSlotsError(null);
    (async () => {
      try {
        const raw = await apiClient.getProfessionalSlots(bookProId, start, end);
        const byDate = (raw as SlotsByDate) ?? {};
        const flat = Object.keys(byDate)
          .sort()
          .flatMap((date) => (byDate[date] ?? []).map((s) => ({ ...s, date })));
        if (!cancelled) setSlotsFlat(flat.slice(0, 40));
      } catch (err: unknown) {
        if (!cancelled) {
          setSlotsError(
            (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? 'No se pudieron cargar los horarios.',
          );
          setSlotsFlat([]);
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [action, bookProId, slotsNonce]);

  /* —— Agenda / selects admin —— */
  const [pickerPros, setPickerPros] = useState<ProfessionalRow[]>([]);

  /* —— Agenda —— */
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [agendaRows, setAgendaRows] = useState<AppointmentRow[]>([]);
  const [agendaProId, setAgendaProId] = useState('');
  const [appointmentDetailId, setAppointmentDetailId] = useState<string | null>(null);

  useEffect(() => {
    if (action !== 'agenda') return;
    let cancelled = false;
    (async () => {
      setAgendaLoading(true);
      setAgendaError(null);
      try {
        let list: ProfessionalRow[] = [];
        let resolvedPro: string | null = null;
        if (!isStaff) {
          const raw = await apiClient.getProfessionals();
          list = Array.isArray(raw) ? (raw as ProfessionalRow[]) : [];
          const active = list.filter((p) => p.isActive !== false);
          resolvedPro =
            agendaProId && active.some((p) => p.id === agendaProId)
              ? agendaProId
              : active[0]?.id ?? null;
          if (!cancelled) {
            setPickerPros(active);
            if (resolvedPro) setAgendaProId(resolvedPro);
          }
        }
        const { start, end } = rangeFromToday(7);
        const data = isStaff
          ? await apiClient.getMyAppointments(start, end)
          : resolvedPro
            ? await apiClient.getProfessionalAppointments(resolvedPro, start, end)
            : {};
        const byDate = (data as AppointmentsByDate) ?? {};
        const flat = Object.keys(byDate)
          .sort()
          .flatMap((date) =>
            (byDate[date] ?? []).map((a) => ({
              ...a,
              date,
            })),
          );
        flat.sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
        if (!cancelled) setAgendaRows(flat.slice(0, 40));
      } catch (err: unknown) {
        if (!cancelled) {
          setAgendaError(
            (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? 'Error al cargar turnos.',
          );
          setAgendaRows([]);
        }
      } finally {
        if (!cancelled) setAgendaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [action, isStaff, agendaProId]);

  /* —— Finanzas —— */
  const [paySummary, setPaySummary] = useState<Awaited<
    ReturnType<typeof apiClient.getPaymentsSummary>
  > | null>(null);
  const [paySummaryLoading, setPaySummaryLoading] = useState(false);

  useEffect(() => {
    if (action !== 'finanzas') return;
    let cancelled = false;
    setPaySummaryLoading(true);
    apiClient
      .getPaymentsSummary()
      .then((d) => {
        if (!cancelled) setPaySummary(d);
      })
      .catch(() => {
        if (!cancelled) setPaySummary(null);
      })
      .finally(() => {
        if (!cancelled) setPaySummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [action]);

  /* —— Disponibilidad —— */
  const [availRows, setAvailRows] = useState<AvailabilityRow[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);
  const [availProId, setAvailProId] = useState('');
  const [newDay, setNewDay] = useState(1);
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('13:00');
  const [newDur, setNewDur] = useState(30);
  const [availSubmitting, setAvailSubmitting] = useState(false);

  useEffect(() => {
    if (action !== 'availability' || isStaff) return;
    let cancelled = false;
    (async () => {
      const raw = await apiClient.getProfessionals();
      const list = Array.isArray(raw) ? (raw as ProfessionalRow[]) : [];
      const active = list.filter((p) => p.isActive !== false);
      if (cancelled) return;
      setPickerPros(active);
      setAvailProId((prev) =>
        prev && active.some((p) => p.id === prev) ? prev : active[0]?.id ?? '',
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [action, isStaff]);

  const loadAvailabilityList = useCallback(async () => {
    setAvailLoading(true);
    setAvailError(null);
    try {
      const data = isStaff
        ? await apiClient.getMyAvailability()
        : availProId
          ? await apiClient.getProfessionalAvailability(availProId)
          : [];
      setAvailRows(Array.isArray(data) ? (data as AvailabilityRow[]) : []);
    } catch {
      setAvailError('No se pudo cargar la disponibilidad.');
      setAvailRows([]);
    } finally {
      setAvailLoading(false);
    }
  }, [isStaff, availProId]);

  useEffect(() => {
    if (action !== 'availability') return;
    if (!isStaff && !availProId) return;
    void loadAvailabilityList();
  }, [action, isStaff, availProId, loadAvailabilityList]);

  /* —— Equipo —— */
  const [teamList, setTeamList] = useState<ProfessionalRow[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamBusyId, setTeamBusyId] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    setTeamLoading(true);
    try {
      const raw = await apiClient.getProfessionals();
      setTeamList(Array.isArray(raw) ? (raw as ProfessionalRow[]) : []);
    } catch {
      setTeamList([]);
    } finally {
      setTeamLoading(false);
    }
  }, []);

  useEffect(() => {
    if (action !== 'team') return;
    void loadTeam();
  }, [action, loadTeam]);

  /* —— Conversaciones —— */
  const [convList, setConvList] = useState<
    Awaited<ReturnType<typeof apiClient.getMessageConversations>>
  >([]);
  const [convLoading, setConvLoading] = useState(false);
  const [convSelected, setConvSelected] = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<
    Awaited<ReturnType<typeof apiClient.getMessageConversationById>>['messages']
  >([]);
  const [convDraft, setConvDraft] = useState('');
  const [convSending, setConvSending] = useState(false);

  const loadConversations = useCallback(async () => {
    setConvLoading(true);
    try {
      const data = await apiClient.getMessageConversations();
      setConvList(Array.isArray(data) ? data : []);
    } catch {
      setConvList([]);
    } finally {
      setConvLoading(false);
    }
  }, []);

  useEffect(() => {
    if (action !== 'conversations') return;
    void loadConversations();
  }, [action, loadConversations]);

  useEffect(() => {
    if (action !== 'conversations' || !convSelected) {
      setConvMessages([]);
      return;
    }
    let cancelled = false;
    apiClient
      .getMessageConversationById(convSelected)
      .then((d) => {
        if (!cancelled) setConvMessages(d.messages ?? []);
      })
      .catch(() => {
        if (!cancelled) setConvMessages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [action, convSelected]);

  /* —— Invitaciones —— */
  const canInviteAdmin = user?.role === 'OWNER';
  const [inviteType, setInviteType] = useState<'admin' | 'professional'>('professional');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteProId, setInviteProId] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteOk, setInviteOk] = useState<string | null>(null);
  const [invitePros, setInvitePros] = useState<ProfessionalRow[]>([]);

  useEffect(() => {
    if (action !== 'invite') return;
    if (!canInviteAdmin) setInviteType('professional');
  }, [action, canInviteAdmin]);

  useEffect(() => {
    if (action !== 'invite' || inviteType !== 'professional') return;
    let cancelled = false;
    apiClient.getProfessionals().then((raw) => {
      if (cancelled) return;
      const arr = Array.isArray(raw) ? (raw as ProfessionalRow[]) : [];
      setInvitePros(arr);
      const need = arr.filter((p) => !p.userId && p.isActive !== false);
      setInviteProId((prev) => (prev && need.some((p) => p.id === prev) ? prev : need[0]?.id ?? ''));
    });
    return () => {
      cancelled = true;
    };
  }, [action, inviteType]);

  const handleOpenBook = (slot: SlotItem) => {
    const p = bookPros.find((x) => x.id === slot.professionalId);
    setProNameForBook(
      p ? `Dr. ${p.firstName} ${p.lastName}` : 'Profesional',
    );
    setBookingSlot(slot);
  };

  if (!action) return null;

  const body = (() => {
    switch (action) {
      case 'new':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Elegí un profesional y un horario libre para reservar sin salir del resumen.
            </p>
            <ProfessionalPickerField
              idPrefix="qa-book"
              label="Profesional"
              options={bookPros}
              value={bookProId}
              onChange={setBookProId}
            />
            {slotsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-ensigna-primary" />
              </div>
            ) : slotsError ? (
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {slotsError}
              </p>
            ) : slotsFlat.length === 0 ? (
              <p className="text-sm text-gray-500">No hay franjas libres en las próximas dos semanas.</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {slotsFlat.map((s) => (
                  <li key={`${s.date}-${s.startTime}-${s.professionalId}`}>
                    <button
                      type="button"
                      onClick={() => handleOpenBook(s)}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-left text-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/80"
                    >
                      <span className="font-medium text-gray-900">
                        {s.date} · {s.startTime} – {s.endTime}
                      </span>
                      <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case 'agenda':
        return (
          <div className="space-y-4">
            {!isStaff ? (
              <ProfessionalPickerField
                idPrefix="qa-agenda"
                label="Profesional"
                options={pickerPros}
                value={agendaProId}
                onChange={setAgendaProId}
              />
            ) : null}
            {dashboardSummary?.upcomingAppointments?.length ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Hoy (resumen)</p>
                <ul className="space-y-2 text-sm">
                  {dashboardSummary.upcomingAppointments.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex justify-between gap-2">
                      <span className="text-gray-700 truncate">{a.patientName}</span>
                      <span className="text-gray-500 shrink-0">{a.startTime?.slice(0, 5)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {agendaLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-ensigna-primary" />
              </div>
            ) : agendaError ? (
              <p className="text-sm text-red-600">{agendaError}</p>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {agendaRows.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setAppointmentDetailId(a.id)}
                      className="flex w-full flex-col rounded-xl border border-gray-100 bg-white px-3 py-2 text-left text-sm hover:border-emerald-200 hover:bg-emerald-50/40"
                    >
                      <span className="font-medium text-gray-900">
                        {a.patient.firstName} {a.patient.lastName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {a.date} · {a.startTime} – {a.endTime} · {a.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!agendaLoading && agendaRows.length === 0 && !agendaError ? (
              <p className="text-sm text-gray-500">No hay turnos en la próxima semana.</p>
            ) : null}
          </div>
        );

      case 'reports':
        if (!dashboardSummary) {
          return <p className="text-sm text-gray-500">Sin datos de resumen.</p>;
        }
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Vista compacta de los mismos KPI del resumen. Actualizá para refrescar cifras.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 bg-purple-50/60 p-3">
                <p className="text-xs text-purple-800">Asistencia (7 días)</p>
                <p className="text-xl font-bold text-purple-950">{dashboardSummary.attendanceRate}%</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-amber-50/60 p-3">
                <p className="text-xs text-amber-900">Pendientes</p>
                <p className="text-xl font-bold text-amber-950">{dashboardSummary.appointmentsPending}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-emerald-50/60 p-3">
                <p className="text-xs text-emerald-900">Turnos hoy</p>
                <p className="text-xl font-bold text-emerald-950">{dashboardSummary.appointmentsToday}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-600">Pacientes</p>
                <p className="text-xl font-bold text-gray-900">{dashboardSummary.patientsTotal}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDashboardRefresh()}
              className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Actualizar datos
            </button>
          </div>
        );

      case 'finanzas':
        return (
          <div className="space-y-4">
            {paySummaryLoading ? (
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600" />
            ) : paySummary ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-teal-100 bg-teal-50/80 p-3">
                  <p className="text-xs text-teal-800">Ingresos hoy</p>
                  <p className="text-lg font-bold text-teal-950">{formatMoneyArs(paySummary.todayIncome)}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Pendiente de cobro</p>
                  <p className="text-lg font-bold text-gray-900">{formatMoneyArs(paySummary.pendingIncome)}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 sm:col-span-2">
                  <p className="text-xs text-gray-600">Total cobrado (paciente)</p>
                  <p className="text-lg font-bold text-gray-900">{formatMoneyArs(paySummary.totalPatientIncome)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No se pudo cargar el resumen de pagos.</p>
            )}
            <button
              type="button"
              onClick={() => setPayOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <Wallet className="h-4 w-4" />
              Registrar cobro
            </button>
            <RegisterPaymentModal
              open={payOpen}
              onClose={() => setPayOpen(false)}
              onSuccess={() => {
                setPayOpen(false);
                onDashboardRefresh();
                if (action === 'finanzas') {
                  setPaySummaryLoading(true);
                  apiClient
                    .getPaymentsSummary()
                    .then(setPaySummary)
                    .finally(() => setPaySummaryLoading(false));
                }
              }}
              defaultPatientId={null}
              allowPatientChange
            />
          </div>
        );

      case 'availability':
        return (
          <div className="space-y-4">
            {!isStaff ? (
              <ProfessionalPickerField
                idPrefix="qa-avail"
                label="Profesional"
                options={pickerPros}
                value={availProId}
                onChange={setAvailProId}
              />
            ) : null}
            {availLoading ? (
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-600" />
            ) : availError ? (
              <p className="text-sm text-red-600">{availError}</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto">
                {availRows.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span>
                      {DAY_NAMES[r.dayOfWeek] ?? r.dayOfWeek} · {r.startTime}–{r.endTime} (
                      {r.slotDuration} min)
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm('¿Eliminar esta franja?')) return;
                        setAvailSubmitting(true);
                        try {
                          await apiClient.deleteAvailability(r.id);
                          await loadAvailabilityList();
                          onDashboardRefresh();
                        } catch {
                          /* ignore */
                        } finally {
                          setAvailSubmitting(false);
                        }
                      }}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      disabled={availSubmitting}
                      aria-label="Eliminar franja"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/50 p-3 space-y-2">
              <p className="text-xs font-medium text-sky-900 flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" />
                Agregar franja
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <ModalListboxField
                    idPrefix="qa-avail-day"
                    label="Día de la semana"
                    iconKind="calendar"
                    options={DAY_NAMES.map((name, i) => ({
                      value: String(i),
                      label: name,
                    }))}
                    value={String(newDay)}
                    onChange={(v) => setNewDay(Number(v))}
                  />
                </div>
                <input
                  type="time"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm min-h-[48px]"
                />
                <input
                  type="time"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm min-h-[48px]"
                />
                <div className="sm:col-span-2">
                  <ModalListboxField
                    idPrefix="qa-avail-dur"
                    label="Duración por turno"
                    variant="slate"
                    options={[15, 20, 30, 45, 60].map((m) => ({
                      value: String(m),
                      label: `${m} minutos`,
                      sublabel: 'Cada slot en la agenda',
                    }))}
                    value={String(newDur)}
                    onChange={(v) => setNewDur(Number(v))}
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={availSubmitting}
                onClick={async () => {
                  setAvailSubmitting(true);
                  try {
                    await apiClient.createAvailability({
                      ...(!isStaff && availProId ? { professionalId: availProId } : {}),
                      dayOfWeek: newDay,
                      startTime: newStart,
                      endTime: newEnd,
                      slotDuration: newDur,
                    });
                    await loadAvailabilityList();
                    onDashboardRefresh();
                  } catch (err: unknown) {
                    setAvailError(
                      (err as { response?: { data?: { message?: string } } })?.response?.data
                        ?.message ?? 'No se pudo crear la franja.',
                    );
                  } finally {
                    setAvailSubmitting(false);
                  }
                }}
                className="w-full rounded-lg bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                Guardar franja
              </button>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Activá o desactivá profesionales sin salir del resumen.
            </p>
            {teamLoading ? (
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto">
                {teamList.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        Dr. {p.firstName} {p.lastName}
                      </p>
                      {p.specialty ? (
                        <p className="text-xs text-gray-500 truncate">{p.specialty}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={teamBusyId === p.id}
                      onClick={async () => {
                        setTeamBusyId(p.id);
                        try {
                          await apiClient.updateProfessional(p.id, {
                            isActive: !(p.isActive !== false),
                          });
                          await loadTeam();
                          onDashboardRefresh();
                          void loadUserData();
                        } finally {
                          setTeamBusyId(null);
                        }
                      }}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        p.isActive === false
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {teamBusyId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : p.isActive === false ? (
                        'Activar'
                      ) : (
                        'Desactivar'
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case 'conversations':
        return (
          <div className="grid gap-4 sm:grid-cols-2 min-h-[280px]">
            <div className="border border-gray-100 rounded-xl overflow-hidden flex flex-col max-h-72 sm:max-h-96">
              <p className="text-xs font-medium text-gray-500 px-3 py-2 bg-gray-50 border-b">Conversaciones</p>
              {convLoading ? (
                <Loader2 className="m-auto h-6 w-6 animate-spin text-cyan-600" />
              ) : (
                <ul className="overflow-y-auto flex-1 text-sm">
                  {convList.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setConvSelected(c.id)}
                        className={`w-full text-left px-3 py-2 border-b border-gray-50 hover:bg-cyan-50/50 ${
                          convSelected === c.id ? 'bg-cyan-50' : ''
                        }`}
                      >
                        <span className="font-medium text-gray-800">{c.channel}</span>
                        <span className="block text-xs text-gray-500">
                          {c._count?.messages ?? 0} mensajes
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-col border border-gray-100 rounded-xl overflow-hidden min-h-0">
              <p className="text-xs font-medium text-gray-500 px-3 py-2 bg-gray-50 border-b">Mensajes</p>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 text-xs max-h-48">
                {convMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg px-2 py-1.5 ${
                      m.direction === 'OUTBOUND' || m.direction === 'outbound'
                        ? 'bg-cyan-100 ml-4'
                        : 'bg-gray-100 mr-4'
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
                {!convSelected ? (
                  <p className="text-gray-400 text-center py-4">Seleccioná una conversación</p>
                ) : null}
              </div>
              <div className="p-2 border-t border-gray-100 flex gap-2">
                <input
                  value={convDraft}
                  onChange={(e) => setConvDraft(e.target.value)}
                  placeholder="Escribí un mensaje…"
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-2 text-sm min-h-[44px]"
                  disabled={!convSelected}
                />
                <button
                  type="button"
                  disabled={!convSelected || !convDraft.trim() || convSending}
                  onClick={async () => {
                    if (!convSelected) return;
                    setConvSending(true);
                    try {
                      await apiClient.sendManualConversationMessage(convSelected, convDraft.trim());
                      setConvDraft('');
                      const d = await apiClient.getMessageConversationById(convSelected);
                      setConvMessages(d.messages ?? []);
                    } finally {
                      setConvSending(false);
                    }
                  }}
                  className="rounded-lg bg-cyan-600 px-3 text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'invite':
        return (
          <div className="space-y-4">
            {canInviteAdmin && (
              <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setInviteType('professional')}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                    inviteType === 'professional' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                  }`}
                >
                  Profesional
                </button>
                <button
                  type="button"
                  onClick={() => setInviteType('admin')}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                    inviteType === 'admin' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                  }`}
                >
                  Administrador
                </button>
              </div>
            )}
            {inviteType === 'professional' ? (
              <ProfessionalPickerField
                idPrefix="qa-invite"
                label="Profesional (sin cuenta)"
                options={invitePros.filter((p) => !p.userId && p.isActive !== false)}
                value={inviteProId}
                onChange={setInviteProId}
                emptyHint="Necesitás un profesional activo sin usuario asignado"
              />
            ) : null}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm min-h-[44px]"
              />
            </div>
            {inviteError ? <p className="text-sm text-red-600">{inviteError}</p> : null}
            {inviteOk ? <p className="text-sm text-emerald-700">{inviteOk}</p> : null}
            <button
              type="button"
              disabled={inviteLoading || !inviteEmail.trim()}
              onClick={async () => {
                setInviteError(null);
                setInviteOk(null);
                setInviteLoading(true);
                try {
                  if (inviteType === 'admin') {
                    await apiClient.inviteAdmin(inviteEmail.trim());
                  } else {
                    if (!inviteProId) {
                      setInviteError('Seleccioná un profesional.');
                      return;
                    }
                    await apiClient.inviteProfessional(inviteProId, inviteEmail.trim());
                  }
                  setInviteOk('Invitación enviada.');
                  setInviteEmail('');
                } catch (err: unknown) {
                  setInviteError(
                    (err as { response?: { data?: { message?: string } } })?.response?.data
                      ?.message ?? 'No se pudo enviar la invitación.',
                  );
                } finally {
                  setInviteLoading(false);
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {inviteLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Enviar invitación
            </button>
          </div>
        );

      default:
        return null;
    }
  })();

  const wide = action === 'conversations' || action === 'agenda';

  return (
    <>
      <AnimatePresence mode="wait">
        {action && action !== 'patients' && action !== 'clinic' ? (
          <ModalFrame key={action} title={title} onClose={onClose} wide={wide}>
            {body}
          </ModalFrame>
        ) : null}
      </AnimatePresence>
      {bookingSlot ? (
        <BookingModal
          slot={bookingSlot}
          professionalName={proNameForBook}
          onClose={() => setBookingSlot(null)}
          onSuccess={() => {
            setBookingSlot(null);
            setSlotsNonce((n) => n + 1);
            onDashboardRefresh();
          }}
        />
      ) : null}
      {appointmentDetailId ? (
        <AppointmentDetailModal
          appointmentId={appointmentDetailId}
          onClose={() => setAppointmentDetailId(null)}
          onSuccess={() => {
            setAppointmentDetailId(null);
            onDashboardRefresh();
          }}
          canEdit={user?.role === 'OWNER' || user?.role === 'ADMIN'}
        />
      ) : null}
    </>
  );
}

export default function QuickActionModals({
  action,
  onClose,
  dashboardSummary,
  onDashboardRefresh,
}: QuickActionModalsProps) {
  const { clinic, loadUserData } = useAuth();

  if (!action) return null;

  if (action === 'patients') {
    return (
      <CreatePatientModal
        open
        onClose={onClose}
        navigateAfterCreate={false}
        onSuccess={() => {
          onDashboardRefresh();
        }}
      />
    );
  }

  if (action === 'clinic') {
    if (!clinic) {
      return (
        <AnimatePresence>
          <ModalFrame title={TITLES.clinic} onClose={onClose}>
            <p className="text-sm text-gray-600">No hay datos de clínica cargados.</p>
          </ModalFrame>
        </AnimatePresence>
      );
    }
    return (
      <EditClinicModal
        clinic={{
          id: clinic.id,
          name: clinic.name,
          slug: clinic.slug,
          email: clinic.email ?? null,
          phone: clinic.phone ?? null,
          address: clinic.address ?? null,
          city: clinic.city ?? null,
          province: clinic.province ?? null,
          isActive: clinic.isActive,
          clinicAvailabilities: clinic.clinicAvailabilities,
        }}
        onClose={onClose}
        onSaved={() => {
          void loadUserData();
          onDashboardRefresh();
        }}
      />
    );
  }

  return (
    <FramedContent
      action={action}
      onClose={onClose}
      dashboardSummary={dashboardSummary}
      onDashboardRefresh={onDashboardRefresh}
    />
  );
}
