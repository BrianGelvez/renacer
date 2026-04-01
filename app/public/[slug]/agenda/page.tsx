'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Stethoscope,
  Building2,
  MapPin,
  ArrowLeft,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface Slot {
  date: string;
  startTime: string;
  endTime: string;
  duration?: number;
  professionalId?: string;
  clinicId?: string;
  status?: string;
  type: 'SLOT' | 'APPOINTMENT';
  id?: string;
  patientId?: string;
  patient?: {
    firstName: string;
    lastName: string;
  };
}

interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: string | null;
}

interface ClinicInfo {
  name: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  phone?: string | null;
  email?: string | null;
  professionals: Professional[];
}

function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes
  const monday = new Date(d.setDate(diff));
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  const format = (d: Date) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return { start: format(monday), end: format(sunday) };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(timeStr: string): string {
  return timeStr;
}

export default function PublicAgendaPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string | undefined;
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [slots, setSlots] = useState<Record<string, Slot[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [appointmentReason, setAppointmentReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAppointmentSuccessModal, setShowAppointmentSuccessModal] = useState(false);
  const [lastAppointmentInfo, setLastAppointmentInfo] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    professionalName: string;
  } | null>(null);
  const [patientData, setPatientData] = useState<{
    firstName: string;
    lastName: string;
    dni?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);

  const patientId = typeof window !== 'undefined' ? sessionStorage.getItem('publicPatientId') : null;
  const clinicSlug = typeof window !== 'undefined' ? sessionStorage.getItem('publicClinicSlug') : null;

  useEffect(() => {
    if (!slug) return;
    if (!patientId || !clinicSlug) {
      router.push(`/public/${slug}/identify`);
      return;
    }
    
    // Cargar datos del paciente desde sessionStorage
    const patientDataStr = sessionStorage.getItem('publicPatientData');
    if (patientDataStr) {
      try {
        const data = JSON.parse(patientDataStr);
        setPatientData(data);
      } catch (e) {
        console.error('Error parsing patient data', e);
      }
    }
    
    // Verificar si mostrar modal de bienvenida/creado
    const isNewPatientStr = sessionStorage.getItem('publicPatientIsNew');
    if (isNewPatientStr === 'true' || isNewPatientStr === 'false') {
      setIsNewPatient(isNewPatientStr === 'true');
      setShowWelcomeModal(true);
      // Limpiar el flag para que no se muestre de nuevo al recargar
      sessionStorage.removeItem('publicPatientIsNew');
    }
    
    apiClient
      .getPublicClinicInfo(slug)
      .then((data) => {
        setClinicInfo(data);
        if (data.professionals?.length > 0) {
          setSelectedProfessionalId(data.professionals[0].id);
        }
      })
      .catch(() => {
        setError('Error al cargar información de la clínica.');
      })
      .finally(() => setLoading(false));
  }, [slug, router, patientId, clinicSlug]);

  const fetchSlots = useCallback(async () => {
    if (!selectedProfessionalId || !clinicSlug) return;
    setLoadingSlots(true);
    setError(null);
    const range = getWeekRange(currentWeek);
    try {
      const data = await apiClient.getPublicSlots({
        clinicSlug,
        professionalId: selectedProfessionalId,
        startDate: range.start,
        endDate: range.end,
      });
      setSlots(data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Error al cargar disponibilidad.',
      );
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedProfessionalId, currentWeek, clinicSlug]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handlePreviousWeek = () => {
    setCurrentWeek((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeek((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleRequestAppointment = async () => {
    if (!selectedSlot || !clinicSlug || !patientId || selectedSlot.type !== 'SLOT') return;
    setSubmitting(true);
    setError(null);
    try {
      const body: Parameters<typeof apiClient.requestPublicAppointment>[0] = {
        clinicSlug,
        professionalId: selectedSlot.professionalId!,
        patientId,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      };
      const trimmedReason = appointmentReason.trim().slice(0, 150);
      if (trimmedReason) body.reason = trimmedReason;
      await apiClient.requestPublicAppointment(body);
      
      // Guardar información del turno antes de cerrar el modal
      const professional = clinicInfo?.professionals.find(
        (p) => p.id === selectedSlot.professionalId,
      );
      setLastAppointmentInfo({
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        professionalName: professional
          ? `${professional.firstName} ${professional.lastName}`
          : 'Profesional',
      });
      
      setSelectedSlot(null);
      setAppointmentReason('');
      setShowAppointmentSuccessModal(true);
      setTimeout(() => {
        fetchSlots(); // Refrescar slots después de un momento
      }, 1000);
      // Cerrar el modal automáticamente después de 5 segundos
      setTimeout(() => {
        setShowAppointmentSuccessModal(false);
        setLastAppointmentInfo(null);
      }, 5000);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Error al solicitar turno.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !clinicInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ensigna-soft/50 via-[var(--ensigna-background)] to-ensigna-primary/5 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-ensigna-primary" />
      </div>
    );
  }

  const range = getWeekRange(currentWeek);
  const days = [];
  const current = new Date(range.start + 'T12:00:00Z');
  for (let i = 0; i < 7; i++) {
    const dateStr = current.toISOString().split('T')[0];
    days.push(dateStr);
    current.setDate(current.getDate() + 1);
  }

  const selectedProfessional = clinicInfo.professionals.find(
    (p) => p.id === selectedProfessionalId,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-ensigna-soft/50 via-[var(--ensigna-background)] to-ensigna-primary/5 p-4 lg:p-24">
      <div className="w-full mx-auto space-y-6">
        {/* Botón para volver a landing */}
        <div className="flex justify-start">
          <Link
            href={`/`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl ensigna-glass border-0 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a inicio
          </Link>
        </div>

        {/* Header con información de la clínica */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ensigna-glass p-6 sm:p-8 shadow-ensigna-hover"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-red flex items-center justify-center flex-shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {clinicInfo.name}
                </h1>
                {(clinicInfo.address || clinicInfo.city || clinicInfo.province) && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {[clinicInfo.address, clinicInfo.city, clinicInfo.province].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selector de profesional - SIEMPRE VISIBLE */}
          <div className="bg-ensigna-accent-soft rounded-xl p-4 border border-[rgba(209,106,138,0.15)]">
            <label className="block text-sm font-semibold text-[var(--ensigna-text)] mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              Seleccioná el profesional con el que querés atenderte
            </label>
            <select
              value={selectedProfessionalId || ''}
              onChange={(e) => setSelectedProfessionalId(e.target.value)}
              className="w-full rounded-xl border-2 border-[rgba(209,106,138,0.25)] bg-white px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-[rgba(209,106,138,0.2)] focus:border-ensigna-primary min-h-[48px] text-base"
            >
              {clinicInfo.professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                  {p.specialty ? ` - ${p.specialty}` : ''}
                </option>
              ))}
            </select>
            {selectedProfessional && (
              <div className="mt-3 flex items-center gap-2 text-sm text-ensigna-primary-dark">
                <User className="w-4 h-4" />
                <span className="font-medium">
                  Profesional seleccionado: {selectedProfessional.firstName}{' '}
                  {selectedProfessional.lastName}
                  {selectedProfessional.specialty && (
                    <span className="text-ensigna-primary"> - {selectedProfessional.specialty}</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Datos del paciente */}
          {patientData && (
            <div className="mt-4 bg-ensigna-accent-soft rounded-xl p-4 border border-[rgba(209,106,138,0.15)]">
              <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Tus datos
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-ensigna-primary font-medium">Nombre:</span>{' '}
                  <span className="text-gray-900">
                    {patientData.firstName} {patientData.lastName}
                  </span>
                </div>
                {patientData.dni && (
                  <div>
                    <span className="text-ensigna-primary font-medium">DNI:</span>{' '}
                    <span className="text-gray-900">{patientData.dni}</span>
                  </div>
                )}
                {patientData.phone && (
                  <div>
                    <span className="text-ensigna-primary font-medium">Teléfono:</span>{' '}
                    <span className="text-gray-900">{patientData.phone}</span>
                  </div>
                )}
                {patientData.email && (
                  <div>
                    <span className="text-ensigna-primary font-medium">Email:</span>{' '}
                    <span className="text-gray-900">{patientData.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Calendario de slots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ensigna-glass p-6 sm:p-8 shadow-ensigna-hover"
        >
          {/* Navegación de semana */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={handlePreviousWeek}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">
                {formatDateShort(range.start)} - {formatDateShort(range.end)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Semana actual</p>
            </div>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}


          {loadingSlots ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-ensigna-primary mb-3" />
              <p className="text-sm text-gray-600">Cargando horarios disponibles...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 mx-auto gap-4">
              {days.map((dateStr) => {
                const daySlots = slots[dateStr] || [];
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={dateStr}
                    className={`border-2 rounded-xl p-4 transition-all ${
                      isToday
                        ? 'border-[rgba(209,106,138,0.35)] bg-ensigna-accent-soft/60'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <h3
                      className={`text-sm font-bold mb-3 ${
                        isToday ? 'text-[var(--ensigna-text)]' : 'text-gray-900'
                      }`}
                    >
                      {formatDateShort(dateStr)}
                      {isToday && (
                        <span className="ml-2 text-xs font-normal text-ensigna-primary">(Hoy)</span>
                      )}
                    </h3>
                    {daySlots.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-xs text-gray-400">Sin disponibilidad</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {daySlots.map((item, idx) => {
                          if (item.type === 'APPOINTMENT') {
                            // Turno ocupado
                            const isMyAppointment = item.patientId === patientId;
                            return (
                              <div
                                key={item.id || idx}
                                className={`w-full px-3 py-2.5 rounded-lg border-2 text-sm font-medium cursor-not-allowed ${
                                  isMyAppointment
                                    ? 'bg-ensigna-accent-soft border-[rgba(209,106,138,0.35)] text-[var(--ensigna-text)]'
                                    : 'bg-gray-100 border-gray-300 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <X className={`w-4 h-4 ${isMyAppointment ? 'text-ensigna-primary' : 'text-gray-500'}`} />
                                  <span className="flex-1 text-[12px]">
                                    {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                  </span>
                                  {isMyAppointment ? (
                                    <span className="text-xs font-semibold text-ensigna-primary">TU TURNO</span>
                                  ) : (
                                    <span className="text-xs text-gray-500">
                                      No disponible
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          } else {
                            // Slot disponible
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  if (item.type === 'SLOT') {
                                    setSelectedSlot(item as Slot);
                                  }
                                }}
                                className="w-full text-left px-3 py-2.5 rounded-lg bg-white border-2 border-gray-200 text-[var(--ensigna-text)] text-sm font-semibold hover:bg-ensigna-accent-soft hover:border-[rgba(209,106,138,0.25)] transition-all active:scale-[0.98] shadow-sm"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4" />
                                  <span className="text-[12px]">
                                    {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                  </span>
                                  <span className="ml-auto text-xs font-normal text-[var(--ensigna-text-secondary)]">
                                    Disponible
                                  </span>
                                </div>
                              </button>
                            );
                          }
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal de confirmación - Solo para slots disponibles */}
      <AnimatePresence>
        {selectedSlot && selectedSlot.type === 'SLOT' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 ensigna-modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="ensigna-modal-panel p-6 sm:p-8 max-w-md w-full rounded-[var(--ensigna-radius-lg)]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl gradient-red flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Confirmar turno</h3>
              </div>

              <div className="space-y-4 mb-6">
                {/* Clínica */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Clínica</p>
                  <p className="text-base font-bold text-gray-900">{clinicInfo.name}</p>
                </div>

                {/* Profesional */}
                {selectedProfessional && (
                  <div className="bg-ensigna-accent-soft rounded-xl p-4 border-2 border-[rgba(209,106,138,0.2)]">
                    <p className="text-xs font-semibold text-ensigna-primary uppercase mb-1 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" />
                      Profesional
                    </p>
                    <p className="text-base font-bold text-[var(--ensigna-text)]">
                      {selectedProfessional.firstName} {selectedProfessional.lastName}
                    </p>
                    {selectedProfessional.specialty && (
                      <p className="text-sm text-[var(--ensigna-text-secondary)] mt-1">
                        {selectedProfessional.specialty}
                      </p>
                    )}
                  </div>
                )}

                {/* Fecha y hora */}
                <div className="bg-ensigna-accent-soft rounded-xl p-4 border-2 border-[rgba(209,106,138,0.15)]">
                  <p className="text-xs font-semibold text-ensigna-primary uppercase mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Fecha y horario
                  </p>
                  <p className="text-base font-bold text-[var(--ensigna-text)] mb-1">
                    {formatDate(selectedSlot.date)}
                  </p>
                  <p className="text-lg font-bold text-[var(--ensigna-text)]">
                    {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </p>
                </div>

                {/* Motivo de consulta (opcional) */}
                <div className="rounded-xl p-4 border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                    Motivo de consulta (opcional)
                  </label>
                  <input
                    type="text"
                    value={appointmentReason}
                    onChange={(e) => setAppointmentReason(e.target.value.slice(0, 150))}
                    maxLength={150}
                    placeholder="Ej: control, fiebre, chequeo general..."
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[rgba(209,106,138,0.2)] focus:border-ensigna-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {appointmentReason.length}/150
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSlot(null);
                    setAppointmentReason('');
                  }}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRequestAppointment}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl gradient-red text-white font-semibold hover:brightness-110 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Solicitar turno
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de bienvenida / paciente creado */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 ensigna-modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="ensigna-modal-panel p-6 sm:p-8 max-w-md w-full rounded-[var(--ensigna-radius-lg)]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isNewPatient
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                      : 'gradient-red'
                  }`}
                >
                  {isNewPatient ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isNewPatient ? '¡Paciente creado exitosamente!' : '¡Bienvenido!'}
                </h3>
              </div>

              <div className="space-y-4 mb-6">
                {isNewPatient ? (
                  <p className="text-gray-700">
                    Tu cuenta de paciente ha sido creada correctamente. Ya podés solicitar turnos
                    con los profesionales disponibles.
                  </p>
                ) : (
                  <p className="text-gray-700">
                    Te identificamos correctamente. Ya podés solicitar turnos con los profesionales
                    disponibles.
                  </p>
                )}
                {patientData && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Tus datos
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {patientData.firstName} {patientData.lastName}
                    </p>
                    {patientData.dni && (
                      <p className="text-xs text-gray-600 mt-1">DNI: {patientData.dni}</p>
                    )}
                    {patientData.phone && (
                      <p className="text-xs text-gray-600">Tel: {patientData.phone}</p>
                    )}
                    {patientData.email && (
                      <p className="text-xs text-gray-600">Email: {patientData.email}</p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowWelcomeModal(false)}
                className="w-full py-3 rounded-xl gradient-red text-white font-semibold hover:brightness-110 transition-colors"
              >
                Continuar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de éxito al agendar turno - Parte superior */}
      <AnimatePresence>
        {showAppointmentSuccessModal && (
          <div className="fixed top-4 left-0 right-0 z-50 flex items-start justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl border-2 border-emerald-200 p-5 max-w-md w-full pointer-events-auto"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    ¡Turno agendado exitosamente!
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Tu turno ha sido solicitado correctamente. La clínica confirmará tu turno y te
                    contactará.
                  </p>
                  {lastAppointmentInfo && (
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 text-xs">
                      <p className="font-semibold text-emerald-900 mb-1">
                        {lastAppointmentInfo.professionalName}
                      </p>
                      <p className="text-[var(--ensigna-text-secondary)]">
                        {formatDate(lastAppointmentInfo.date)} -{' '}
                        {formatTime(lastAppointmentInfo.startTime)} a{' '}
                        {formatTime(lastAppointmentInfo.endTime)}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAppointmentSuccessModal(false);
                    setLastAppointmentInfo(null);
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
