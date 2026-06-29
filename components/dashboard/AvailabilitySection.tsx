'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CalendarDays,
  LayoutGrid,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import WeekAvailabilityCalendar from './WeekAvailabilityCalendar';
import MonthAvailabilityCalendar from './MonthAvailabilityCalendar';
import AvailabilityBlockForm, { type AvailabilityFormValues } from './AvailabilityBlockForm';

export interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason?: string;
}

interface AvailabilitySectionProps {
  readOnly?: boolean;
  doctorUserId?: string;
}

export default function AvailabilitySection({ readOnly = false, doctorUserId }: AvailabilitySectionProps) {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Vista: semana (grid 7 días) o mes (calendario mensual) */
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  /** Mes visible en calendario (para cargar días bloqueados) */
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  /** Modal formulario: crear/editar bloque */
  const [formOpen, setFormOpen] = useState(false);
  const [formInitialValues, setFormInitialValues] = useState<Partial<AvailabilityFormValues> | null>(null);
  const [formEditId, setFormEditId] = useState<string | null>(null);

  const loadAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (doctorUserId) {
        data = await apiClient.getDoctorAvailability(doctorUserId);
      } else {
        data = await apiClient.getMyAvailability();
      }
      setAvailabilities(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        setError('No tenés permiso para ver esta disponibilidad.');
      } else if (status === 404) {
        setError('Profesional no encontrado o no pertenece a tu clínica.');
      } else {
        setError('Error al cargar disponibilidad.');
      }
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedDates = async () => {
    if (!doctorUserId) {
      try {
        const data = await apiClient.getMyBlockedDates(
          calendarMonth.year,
          calendarMonth.month,
        );
        setBlockedDates(Array.isArray(data) ? data : []);
      } catch {
        setBlockedDates([]);
      }
      return;
    }
    try {
      const data = await apiClient.getDoctorBlockedDates(
        doctorUserId,
        calendarMonth.year,
        calendarMonth.month,
      );
      setBlockedDates(Array.isArray(data) ? data : []);
    } catch {
      setBlockedDates([]);
    }
  };

  useEffect(() => {
    if (readOnly && !doctorUserId) {
      setLoading(false);
      return;
    }
    loadAvailability();
  }, [doctorUserId, readOnly]);

  useEffect(() => {
    if (viewMode !== 'month') return;
    loadBlockedDates();
  }, [viewMode, calendarMonth.year, calendarMonth.month, doctorUserId]);

  const handleCreate = async (values: AvailabilityFormValues) => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await apiClient.createAvailability({
        ...values,
        ...(doctorUserId ? { doctorUserId } : {}),
      });
      setSuccess('Horario agregado correctamente.');
      setFormOpen(false);
      setFormInitialValues(null);
      await loadAvailability();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Error al crear el horario.';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (values: AvailabilityFormValues) => {
    if (!formEditId) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await apiClient.updateAvailability(formEditId, values);
      setSuccess('Horario actualizado correctamente.');
      setFormOpen(false);
      setFormEditId(null);
      setFormInitialValues(null);
      await loadAvailability();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al actualizar el horario.';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este horario?')) return;
    setError(null);
    setSuccess(null);
    try {
      await apiClient.deleteAvailability(id);
      setSuccess('Horario eliminado correctamente.');
      await loadAvailability();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al eliminar el horario.';
      setError(message);
    }
  };

  const openFormForDay = (dayOfWeek: number) => {
    setFormInitialValues({ dayOfWeek, startTime: '09:00', endTime: '13:00', slotDuration: 30 });
    setFormEditId(null);
    setFormOpen(true);
  };

  const openFormForEdit = (block: Availability) => {
    setFormInitialValues({
      dayOfWeek: block.dayOfWeek,
      startTime: block.startTime,
      endTime: block.endTime,
      slotDuration: block.slotDuration,
    });
    setFormEditId(block.id);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values: AvailabilityFormValues) => {
    if (formEditId) {
      await handleUpdate(values);
    } else {
      await handleCreate(values);
    }
  };

  const handleBlockDate = async (dateStr: string) => {
    setError(null);
    setSuccess(null);
    try {
      await apiClient.createBlockedDate({ date: dateStr });
      setSuccess('Día marcado como no disponible.');
      await loadBlockedDates();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al bloquear el día.';
      setError(message);
    }
  };

  const handleUnblockDate = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      await apiClient.deleteBlockedDate(id);
      setSuccess('Día desbloqueado.');
      await loadBlockedDates();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al desbloquear.';
      setError(message);
    }
  };

  /** Solo el propio profesional puede bloquear/desbloquear días; OWNER/ADMIN no. */
  const canManageBlockedDates = !doctorUserId;

  // Para vista mes: agrupar por día de la semana (solo indicador de si hay bloques)
  const availabilityByWeekday = availabilities.reduce((acc, b) => {
    if (!acc[b.dayOfWeek]) acc[b.dayOfWeek] = [];
    acc[b.dayOfWeek].push({ dayOfWeek: b.dayOfWeek, startTime: b.startTime, endTime: b.endTime });
    return acc;
  }, {} as Record<number, { dayOfWeek: number; startTime: string; endTime: string }[]>);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex justify-center"
      >
        <Loader2 className="w-8 h-8 animate-spin text-ensigna-primary" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Header con toggle vista */}
      <div className="px-4 sm:px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ensigna-primary to-ensigna-primary-light flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {doctorUserId ? 'Horarios del profesional' : 'Mis horarios'}
            </h3>
            <p className="text-sm text-gray-500">
              {availabilities.length} bloque{availabilities.length !== 1 ? 's' : ''} · Vista por {viewMode === 'week' ? 'semana' : 'mes'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Semana / Mes */}
          <div className="inline-flex rounded-xl border border-gray-200 p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'week' ? 'bg-white text-ensigna-primary-dark shadow-sm border border-gray-200' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Semana
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'month' ? 'bg-white text-ensigna-primary-dark shadow-sm border border-gray-200' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Mes
            </button>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                setFormInitialValues(null);
                setFormEditId(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-ensigna-primary text-white rounded-xl text-sm font-medium hover:bg-ensigna-primary-dark transition-colors shadow-lg shadow-ensigna-primary/20"
            >
              <Clock className="w-4 h-4" />
              Nuevo horario
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {readOnly && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Vista de solo lectura. Solo el profesional puede modificar sus horarios.
            </p>
          </div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200"
          >
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-emerald-800">{success}</span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{error}</span>
          </motion.div>
        )}

        {readOnly && !doctorUserId ? (
          <div className="py-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Seleccioná un profesional para ver su disponibilidad.</p>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              {viewMode === 'week' ? (
                <motion.div
                  key="week"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto scrollbar-thin"
                >
                  <WeekAvailabilityCalendar
                    availabilities={availabilities}
                    readOnly={readOnly}
                    onAddDay={readOnly ? undefined : openFormForDay}
                    onEditBlock={readOnly ? undefined : openFormForEdit}
                    onDeleteBlock={readOnly ? undefined : handleDelete}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="month"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0"
                >
                  <MonthAvailabilityCalendar
                    availabilityByWeekday={availabilityByWeekday}
                    blockedDates={blockedDates}
                    readOnly={readOnly}
                    onDayClick={readOnly ? undefined : openFormForDay}
                    onMonthChange={(year, month) => setCalendarMonth({ year, month })}
                    onBlockDate={readOnly || !canManageBlockedDates ? undefined : handleBlockDate}
                    onUnblockDate={readOnly || !canManageBlockedDates ? undefined : handleUnblockDate}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {availabilities.length === 0 && !readOnly && (
              <p className="text-center text-sm text-gray-500 py-4">
                Agregá horarios desde la vista Semana (botón &quot;Agregar&quot; en cada día) o desde la vista Mes (clic en un día).
              </p>
            )}
          </>
        )}
      </div>

      {/* Modal formulario crear/editar */}
      {!readOnly && (
        <AvailabilityBlockForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setFormEditId(null);
            setFormInitialValues(null);
          }}
          initialValues={formInitialValues ?? undefined}
          editId={formEditId}
          onSubmit={handleFormSubmit}
          isSubmitting={submitting}
        />
      )}
    </motion.div>
  );
}
