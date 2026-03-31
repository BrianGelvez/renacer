'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  Stethoscope,
  User,
  Phone,
  Award,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import BookingModal from './BookingModal';
import AppointmentDetailModal from './AppointmentDetailModal';

export interface SlotItem {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  professionalId: string;
  clinicId: string;
  status: string;
}

export interface AppointmentItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  patient: { firstName: string; lastName: string };
  reason?: string | null;
  notes?: string | null;
}

type SlotsByDate = Record<string, SlotItem[]>;
type AppointmentsByDate = Record<string, AppointmentItem[]>;

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = DAY_LABELS[(date.getDay() + 6) % 7];
  return `${dayName} ${d}`;
}

function getWeekRange(anchor: Date): { start: string; end: string; weekDates: string[] } {
  const d = new Date(anchor);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const start = monday.toISOString().slice(0, 10);
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    weekDates.push(x.toISOString().slice(0, 10));
  }
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const end = sunday.toISOString().slice(0, 10);
  return { start, end, weekDates };
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return dateStr === `${y}-${m}-${d}`;
}

function appointmentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    SCHEDULED: 'Programado',
    PENDING_CONFIRMATION: 'Pend. confirmación',
    CONFIRMED: 'Confirmado',
    RESCHEDULE_REQUESTED: 'Reprogramar',
    COMPLETED: 'Realizado',
    CANCELED: 'Cancelado',
    NO_SHOW: 'No se presentó',
  };
  return labels[status] ?? status;
}

/** Colores por estado del turno en la agenda (vista calendario, bloques compactos). */
function appointmentStatusColors(status: string): { bg: string; border: string; text: string } {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    SCHEDULED: { bg: 'bg-amber-500', border: 'border-amber-600/50', text: 'text-white' },
    PENDING_CONFIRMATION: {
      bg: 'bg-violet-500',
      border: 'border-violet-600/50',
      text: 'text-white',
    },
    CONFIRMED: { bg: 'bg-emerald-500', border: 'border-emerald-600/50', text: 'text-white' },
    RESCHEDULE_REQUESTED: {
      bg: 'bg-sky-500',
      border: 'border-sky-600/50',
      text: 'text-white',
    },
    COMPLETED: { bg: 'bg-blue-500', border: 'border-blue-600/50', text: 'text-white' },
    CANCELED: { bg: 'bg-gray-400', border: 'border-gray-500/50', text: 'text-white' },
    NO_SHOW: { bg: 'bg-red-500', border: 'border-red-600/50', text: 'text-white' },
  };
  return map[status] ?? map.SCHEDULED;
}

/** Colores por estado en vista lista (fondo claro + borde). */
function appointmentStatusListColors(status: string): { bg: string; border: string; badge: string; text: string } {
  const map: Record<string, { bg: string; border: string; badge: string; text: string }> = {
    SCHEDULED: { bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-200/80 text-amber-800', text: 'text-amber-900' },
    PENDING_CONFIRMATION: {
      bg: 'bg-violet-50',
      border: 'border-violet-300',
      badge: 'bg-violet-200/80 text-violet-900',
      text: 'text-violet-900',
    },
    CONFIRMED: { bg: 'bg-emerald-50', border: 'border-emerald-300', badge: 'bg-emerald-200/80 text-emerald-800', text: 'text-emerald-900' },
    RESCHEDULE_REQUESTED: {
      bg: 'bg-sky-50',
      border: 'border-sky-300',
      badge: 'bg-sky-200/80 text-sky-900',
      text: 'text-sky-900',
    },
    COMPLETED: { bg: 'bg-blue-50', border: 'border-blue-300', badge: 'bg-blue-200/80 text-blue-800', text: 'text-blue-900' },
    CANCELED: { bg: 'bg-gray-100', border: 'border-gray-300', badge: 'bg-gray-200 text-gray-600', text: 'text-gray-700' },
    NO_SHOW: { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-200/80 text-red-800', text: 'text-red-900' },
  };
  return map[status] ?? map.SCHEDULED;
}

/** Ítem de agenda ordenable: turno programado o slot disponible. */
type AgendaItem =
  | { type: 'appointment'; data: AppointmentItem }
  | { type: 'slot'; data: SlotItem };

/** Para un día, combina turnos y slots y los ordena por hora de inicio. */
function getSortedAgendaItems(
  dateStr: string,
  slotsByDate: SlotsByDate,
  appointmentsByDate: AppointmentsByDate,
): AgendaItem[] {
  const slots = slotsByDate[dateStr] ?? [];
  const appointments = appointmentsByDate[dateStr] ?? [];
  const items: AgendaItem[] = [
    ...appointments.map((apt) => ({ type: 'appointment' as const, data: apt })),
    ...slots.map((slot) => ({ type: 'slot' as const, data: slot })),
  ];
  items.sort((a, b) => {
    const timeA = a.type === 'appointment' ? a.data.startTime : a.data.startTime;
    const timeB = b.type === 'appointment' ? b.data.startTime : b.data.startTime;
    return timeA.localeCompare(timeB);
  });
  return items;
}

export interface ProfessionalOption {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: string | null;
  phone?: string | null;
  licenseNumber?: string | null;
  isActive?: boolean;
}

export default function ScheduleSection() {
  const { user } = useAuth();
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [slotsByDate, setSlotsByDate] = useState<SlotsByDate>({});
  const [appointmentsByDate, setAppointmentsByDate] = useState<AppointmentsByDate>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [refreshKey, setRefreshKey] = useState(0);
  const [bookingSlot, setBookingSlot] = useState<SlotItem | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const bookIntentHandled = useRef(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { start: startDate, end: endDate, weekDates } = useMemo(
    () => getWeekRange(weekAnchor),
    [weekAnchor],
  );

  const canBook = user?.role === 'OWNER' || user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiClient.getProfessionals();
        if (cancelled) return;
        setProfessionals(Array.isArray(list) ? list : []);
        if (list?.length && !selectedProfessionalId) {
          setSelectedProfessionalId(list[0].id);
        }
      } catch {
        if (!cancelled) setProfessionals([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isStaff && !selectedProfessionalId) {
      setSlotsByDate({});
      setAppointmentsByDate({});
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [slotsData, appointmentsData] = await Promise.all([
          isStaff
            ? apiClient.getMySlots(startDate, endDate)
            : apiClient.getProfessionalSlots(
                selectedProfessionalId,
                startDate,
                endDate,
              ),
          isStaff
            ? apiClient.getMyAppointments(startDate, endDate)
            : apiClient.getProfessionalAppointments(
                selectedProfessionalId,
                startDate,
                endDate,
              ),
        ]);
        if (cancelled) return;
        setSlotsByDate((slotsData as SlotsByDate) ?? {});
        setAppointmentsByDate((appointmentsData as AppointmentsByDate) ?? {});
      } catch (err: unknown) {
        if (!cancelled) {
          setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al cargar agenda.');
          setSlotsByDate({});
          setAppointmentsByDate({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedProfessionalId, startDate, endDate, isStaff, refreshKey]);

  useEffect(() => {
    if (searchParams.get('book') !== '1') {
      bookIntentHandled.current = false;
    }
  }, [searchParams]);

  useEffect(() => {
    if (!canBook || searchParams.get('book') !== '1') return;
    if (bookIntentHandled.current) return;
    if (loading) return;
    if (!isStaff && !selectedProfessionalId) return;

    let first: SlotItem | null = null;
    for (const d of weekDates) {
      const arr = slotsByDate[d] ?? [];
      if (arr.length) {
        first = arr[0];
        break;
      }
    }
    if (first) {
      setBookingSlot(first);
      setBookingSuccess(null);
    }
    bookIntentHandled.current = true;

    const params = new URLSearchParams(searchParams.toString());
    params.delete('book');
    const q = params.toString();
    const base = pathname || '/dashboard/agenda';
    router.replace(q ? `${base}?${q}` : base, { scroll: false });
  }, [
    canBook,
    searchParams,
    loading,
    selectedProfessionalId,
    isStaff,
    weekDates,
    slotsByDate,
    router,
    pathname,
  ]);

  const sortedDates = useMemo(() => {
    const allDates = new Set([
      ...Object.keys(slotsByDate),
      ...Object.keys(appointmentsByDate),
    ]);
    return Array.from(allDates).sort();
  }, [slotsByDate, appointmentsByDate]);

  const goPrevWeek = () => {
    setWeekAnchor((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const goNextWeek = () => {
    setWeekAnchor((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const goThisWeek = () => setWeekAnchor(new Date());

  const handleSlotClick = (slot: SlotItem) => {
    if (!canBook) return;
    setBookingSlot(slot);
    setBookingSuccess(null);
  };

  const handleBookingClose = () => {
    setBookingSlot(null);
    if (bookingSuccess) setBookingSuccess(null);
  };

  const handleBookingSuccess = () => {
    setBookingSuccess('Turno reservado correctamente.');
    setBookingSlot(null);
    setRefreshKey((k) => k + 1);
  };

  const handleAppointmentClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
  };

  const selectedProfessional = professionals.find((p) => p.id === selectedProfessionalId);
  const weekMonthLabel = `${MONTHS[weekAnchor.getMonth()]} ${weekAnchor.getFullYear()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Agenda</h2>
            <p className="text-sm text-gray-500 truncate">
              {canBook
                ? 'Gestioná turnos y disponibilidad por profesional'
                : 'Tu disponibilidad y turnos'}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros: profesional + navegación semana + vista */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-3 sm:p-5 border-b border-gray-100 space-y-3 sm:space-y-4">
          {!isStaff && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">
                Profesional
              </label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <select
                  value={selectedProfessionalId}
                  onChange={(e) => setSelectedProfessionalId(e.target.value)}
                  className="w-full sm:max-w-md px-10 py-3.5 sm:py-3 rounded-xl border-2 border-gray-200 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50 text-base touch-manipulation min-h-[48px] appearance-none cursor-pointer"
                >
                  <option value="">Seleccionar profesional...</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      Dr. {p.firstName} {p.lastName}
                      {p.specialty ? ` · ${p.specialty}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none rotate-90" />
              </div>
              {/* Tarjeta con información del profesional seleccionado */}
              {selectedProfessional && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-base sm:text-lg">
                      Dr. {selectedProfessional.firstName} {selectedProfessional.lastName}
                    </p>
                    {selectedProfessional.specialty && (
                      <p className="flex items-center gap-1.5 text-sm text-emerald-800 mt-0.5">
                        <Stethoscope className="w-4 h-4 shrink-0" />
                        {selectedProfessional.specialty}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                      {selectedProfessional.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          {selectedProfessional.phone}
                        </span>
                      )}
                      {selectedProfessional.licenseNumber && (
                        <span className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          Mat. {selectedProfessional.licenseNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Navegación de semana */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                type="button"
                onClick={goPrevWeek}
                className="p-3 sm:p-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Semana anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={goNextWeek}
                className="p-3 sm:p-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Semana siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={goThisWeek}
                className="px-4 py-3 sm:py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors text-sm touch-manipulation min-h-[44px]"
              >
                Hoy
              </button>
              <span className="text-sm font-semibold text-gray-800 hidden sm:inline px-2">
                {weekMonthLabel}
              </span>
              <p className="text-sm font-semibold text-gray-700 sm:hidden w-full basis-full mt-1">
                {weekMonthLabel}
              </p>
            </div>
            <div className="inline-flex rounded-xl border-2 border-gray-200 p-1 bg-gray-50 touch-manipulation">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-all min-h-[40px] touch-manipulation ${
                  viewMode === 'calendar' ? 'bg-white text-emerald-700 shadow-sm border border-gray-200' : 'text-gray-600 hover:text-gray-900 active:bg-gray-100'
                }`}
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                Semana
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-all min-h-[40px] touch-manipulation ${
                  viewMode === 'list' ? 'bg-white text-emerald-700 shadow-sm border border-gray-200' : 'text-gray-600 hover:text-gray-900 active:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4 shrink-0" />
                Lista
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-3 sm:mx-5 mt-3 sm:mt-4 flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="p-3 sm:p-5 min-h-[260px] sm:min-h-[280px] pb-safe">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
              <p className="text-sm text-gray-500">Cargando horarios...</p>
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium text-sm sm:text-base">No hay horarios en esta semana</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Probá otra semana o otro profesional</p>
            </div>
          ) : viewMode === 'calendar' ? (
            /* Vista calendario: 7 columnas; en móvil flex horizontal con scroll, en desktop grid */
            <div className="overflow-x-auto overflow-y-hidden -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-thin py-2 sm:pb-0">
              <div className="flex sm:grid sm:grid-cols-7 gap-2 sm:gap-3 min-w-0 sm:min-w-0">
                {weekDates.map((dateStr) => {
                  const slots = slotsByDate[dateStr] ?? [];
                  const appointments = appointmentsByDate[dateStr] ?? [];
                  const today = isToday(dateStr);
                  const [, , d] = dateStr.split('-');
                  const dayIndex = new Date(dateStr + 'T12:00:00').getDay();
                  const dayLabel = DAY_LABELS[(dayIndex + 6) % 7];
                  const hasContent = slots.length > 0 || appointments.length > 0;
                  return (
                    <motion.div
                      key={dateStr}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        flex flex-col rounded-xl border min-h-[120px] sm:min-h-[140px] overflow-hidden flex-shrink-0 w-[80px] sm:w-auto sm:min-w-0
                        ${today ? 'border-emerald-300 bg-emerald-50/50 ring-2 ring-emerald-200' : 'border-gray-100 bg-gray-50/30'}
                      `}
                    >
                      <div className={`p-2 sm:p-3 text-center border-b flex-shrink-0 ${today ? 'border-emerald-200 bg-emerald-100/50' : 'border-gray-100'}`}>
                        <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">{dayLabel}</p>
                        <p className={`text-base sm:text-xl font-bold ${today ? 'text-emerald-700' : 'text-gray-800'}`}>{d}</p>
                        {hasContent && (
                          <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">
                            {appointments.length > 0 && `${appointments.length} turno${appointments.length !== 1 ? 's' : ''}`}
                            {appointments.length > 0 && slots.length > 0 && ' · '}
                            {slots.length > 0 && `${slots.length} disp.`}
                          </p>
                        )}
                      </div>
                      <div className="p-1.5 sm:p-2 flex-1 flex flex-col gap-1.5 overflow-y-auto min-h-0">
                        {!hasContent ? (
                          <p className="text-[10px] text-gray-400 text-center py-2">—</p>
                        ) : (
                          getSortedAgendaItems(dateStr, slotsByDate, appointmentsByDate).map((item) => {
                            const colors = item.type === 'appointment' ? appointmentStatusColors(item.data.status) : null;
                            return item.type === 'appointment' ? (
                              <button
                                key={item.data.id}
                                type="button"
                                onClick={() => handleAppointmentClick(item.data.id)}
                                className={`w-full text-center px-1.5 py-2 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium ${colors!.bg} ${colors!.text} border ${colors!.border} shadow-sm min-h-[40px] sm:min-h-0 flex flex-col items-center justify-center hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation cursor-pointer`}
                                title={
                                  item.data.reason
                                    ? `${item.data.patient.firstName} ${item.data.patient.lastName} · Motivo: ${item.data.reason} — Tocá para ver detalle`
                                    : `${item.data.patient.firstName} ${item.data.patient.lastName} · ${appointmentStatusLabel(item.data.status)} — Tocá para ver detalle`
                                }
                              >
                                <span className="font-semibold">{item.data.startTime}</span>
                                <span className="opacity-90 truncate w-full max-w-full" title={`${item.data.patient.firstName} ${item.data.patient.lastName}`}>
                                  {appointmentStatusLabel(item.data.status)}
                                </span>
                              </button>
                            ) : (
                              <button
                                key={`${item.data.date}-${item.data.startTime}`}
                                type="button"
                                onClick={() => handleSlotClick(item.data)}
                                disabled={!canBook}
                                className={`
                                  text-center px-1.5 py-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition-all touch-manipulation min-h-[44px] sm:min-h-0 active:scale-[0.97]
                                  ${canBook
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-sm'
                                    : 'bg-gray-200 text-gray-600 cursor-default'
                                  }
                                `}
                              >
                                {item.data.startTime}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2 sm:hidden">Deslizá para ver todos los días</p>
            </div>
          ) : (
            /* Vista lista: por día, turnos programados (ámbar) y slots disponibles (verde) */
            <div className="space-y-3 sm:space-y-5 -mx-1 px-1 sm:mx-0 sm:px-0">
              {sortedDates.map((dateStr) => {
                const today = isToday(dateStr);
                const slots = slotsByDate[dateStr] ?? [];
                const appointments = appointmentsByDate[dateStr] ?? [];
                return (
                  <motion.div
                    key={dateStr}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`
                      rounded-xl border overflow-hidden
                      ${today ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100 bg-white'}
                    `}
                  >
                    <div className={`px-3 sm:px-4 py-3 flex items-center gap-2 border-b ${today ? 'border-emerald-200 bg-emerald-100/50' : 'border-gray-100 bg-gray-50/50'}`}>
                      <CalendarIcon className={`w-4 h-4 shrink-0 ${today ? 'text-emerald-600' : 'text-gray-500'}`} />
                      <span className={`font-semibold text-sm sm:text-base ${today ? 'text-emerald-800' : 'text-gray-800'}`}>
                        {formatDateLabel(dateStr)}
                        {today && <span className="ml-2 text-xs font-normal text-emerald-600">(Hoy)</span>}
                      </span>
                    </div>
                    <div className="p-3 sm:p-4 flex flex-wrap gap-2">
                      {getSortedAgendaItems(dateStr, slotsByDate, appointmentsByDate).map((item) => {
                        const listColors = item.type === 'appointment' ? appointmentStatusListColors(item.data.status) : null;
                        return item.type === 'appointment' ? (
                          <button
                            key={item.data.id}
                            type="button"
                            onClick={() => handleAppointmentClick(item.data.id)}
                            className={`inline-flex items-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl border ${listColors!.border} ${listColors!.bg} ${listColors!.text} min-h-[48px] sm:min-h-0 hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation cursor-pointer text-left`}
                            title={
                              item.data.reason
                                ? `${item.data.patient.firstName} ${item.data.patient.lastName} · Motivo: ${item.data.reason} — Tocá para ver detalle`
                                : `${item.data.patient.firstName} ${item.data.patient.lastName} — Tocá para ver detalle`
                            }
                          >
                            <Clock className="w-4 h-4 shrink-0 opacity-80" />
                            <span className="font-medium">{item.data.startTime} – {item.data.endTime}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${listColors!.badge}`}>
                              {appointmentStatusLabel(item.data.status)}
                            </span>
                            <span className="text-xs truncate max-w-[120px] opacity-90" title={`${item.data.patient.firstName} ${item.data.patient.lastName}`}>
                              {item.data.patient.firstName} {item.data.patient.lastName}
                            </span>
                          </button>
                        ) : (
                          <button
                            key={`${item.data.date}-${item.data.startTime}`}
                            type="button"
                            onClick={() => handleSlotClick(item.data)}
                            disabled={!canBook}
                            className={`
                              inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl border text-sm font-medium transition-all touch-manipulation min-h-[48px] sm:min-h-0 active:scale-[0.98]
                              ${canBook
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200 hover:border-emerald-300 cursor-pointer'
                                : 'border-gray-200 bg-gray-50 text-gray-600 cursor-default'
                              }
                            `}
                          >
                            <Clock className="w-4 h-4 shrink-0" />
                            {item.data.startTime} – {item.data.endTime}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {!loading && (sortedDates.length > 0 || Object.keys(appointmentsByDate).length > 0) && (
          <div className="px-3 sm:px-5 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl sm:rounded-b-2xl safe-area-pb">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500" aria-hidden />
                Disponible
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500" aria-hidden />
                Programado
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600" aria-hidden />
                Confirmado
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-500" aria-hidden />
                Realizado
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gray-400" aria-hidden />
                Cancelado
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-500" aria-hidden />
                No se presentó
              </span>
            </div>
            {canBook && (
              <p className="text-xs text-gray-500 text-center mt-1.5">
                Tocá un horario disponible para reservar un turno
              </p>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {bookingSlot && selectedProfessional && (
          <BookingModal
            slot={bookingSlot}
            professionalName={`${selectedProfessional.firstName} ${selectedProfessional.lastName}`}
            onClose={handleBookingClose}
            onSuccess={handleBookingSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedAppointmentId && (
          <AppointmentDetailModal
            appointmentId={selectedAppointmentId}
            onClose={() => setSelectedAppointmentId(null)}
            onSuccess={() => setRefreshKey((k) => k + 1)}
            canEdit={canBook}
          />
        )}
      </AnimatePresence>

      {bookingSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200"
        >
          <span className="text-sm text-emerald-800">{bookingSuccess}</span>
        </motion.div>
      )}
    </motion.div>
  );
}
