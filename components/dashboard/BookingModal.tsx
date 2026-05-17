'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, User, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { SlotItem } from './ScheduleSection';

interface PatientOption {
  id: string;
  firstName: string;
  lastName: string;
  dni?: string | null;
  phone?: string | null;
}

interface BookingModalProps {
  slot: SlotItem;
  doctorDisplayName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_LENGTH = 1;

export default function BookingModal({
  slot,
  doctorDisplayName,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const [mode, setMode] = useState<'search' | 'new'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    email: '',
  });

  const [appointmentReason, setAppointmentReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < SEARCH_MIN_LENGTH) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const data = await apiClient.getPatients({
        q: q.trim(),
        limit: 15,
      });
      const items = (data as { items?: PatientOption[] }).items ?? [];
      setSearchResults(Array.isArray(items) ? items : []);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al buscar.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchPatients(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchPatients]);

  const handleSubmit = async () => {
    setError(null);
    if (mode === 'search') {
      if (!selectedPatientId) {
        setError('Seleccioná un paciente o creá uno nuevo.');
        return;
      }
    } else {
      if (!newPatient.firstName.trim() || !newPatient.lastName.trim()) {
        setError('Nombre y apellido son obligatorios.');
        return;
      }
    }

    const trimmedReason = appointmentReason.trim().slice(0, 150);

    setSubmitting(true);
    try {
      if (mode === 'search' && selectedPatientId) {
        await apiClient.createManualAppointment({
          doctorUserId: slot.doctorUserId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          patientId: selectedPatientId,
          ...(trimmedReason ? { reason: trimmedReason } : {}),
        });
      } else {
        await apiClient.createManualAppointment({
          doctorUserId: slot.doctorUserId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          patientData: {
            firstName: newPatient.firstName.trim(),
            lastName: newPatient.lastName.trim(),
            dni: newPatient.dni.trim() || undefined,
            phone: newPatient.phone.trim() || undefined,
            email: newPatient.email.trim() || undefined,
          },
          ...(trimmedReason ? { reason: trimmedReason } : {}),
        });
      }
      onSuccess();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al reservar el turno.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 min-h-[100dvh] min-w-full ensigna-modal-backdrop z-0"
          onClick={onClose}
          aria-hidden
        />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: 'tween', duration: 0.2 }}
          className="relative z-10 w-full sm:max-w-lg sm:max-h-[90vh] max-h-[85vh] sm:rounded-[var(--ensigna-radius-lg)] rounded-t-[var(--ensigna-radius-lg)] overflow-hidden ensigna-modal-panel flex flex-col"
        >
          <div className="sticky top-0 bg-white/50 backdrop-blur-md border-b border-black/[0.06] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Reservar turno</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 -mr-2 rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 overscroll-contain p-4 sm:p-6 space-y-4 safe-area-pb">
            <div className="p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 shrink-0" />
                {doctorDisplayName}
              </p>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                {slot.date} · {slot.startTime} – {slot.endTime}
              </p>
            </div>

            <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50 touch-manipulation">
              <button
                type="button"
                onClick={() => setMode('search')}
                className={`flex-1 py-3 sm:py-2 rounded-lg text-sm font-medium min-h-[44px] sm:min-h-0 touch-manipulation ${mode === 'search' ? 'bg-white shadow text-gray-900' : 'text-gray-600 active:bg-gray-100'}`}
              >
                Buscar paciente
              </button>
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`flex-1 py-3 sm:py-2 rounded-lg text-sm font-medium min-h-[44px] sm:min-h-0 touch-manipulation ${mode === 'new' ? 'bg-white shadow text-gray-900' : 'text-gray-600 active:bg-gray-100'}`}
              >
                Paciente nuevo
              </button>
            </div>

            {mode === 'search' && (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nombre, apellido o DNI..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedPatientId(null);
                    }}
                    autoComplete="off"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 sm:py-2.5 pl-10 text-base sm:text-sm min-h-[48px] sm:min-h-0 touch-manipulation focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 animate-spin pointer-events-none" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Los resultados se actualizan mientras escribís.
                </p>
                {searchResults.length > 0 && (
                  <ul className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin">
                    {searchResults.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedPatientId(p.id)}
                          className={`w-full text-left px-4 py-3 sm:py-2.5 rounded-xl border text-sm touch-manipulation min-h-[48px] sm:min-h-0 active:scale-[0.99] ${
                            selectedPatientId === p.id
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                              : 'border-gray-200 hover:bg-gray-50 active:bg-gray-100'
                          }`}
                        >
                          {p.lastName}, {p.firstName}
                          {p.dni && ` · DNI ${p.dni}`}
                          {p.phone && ` · ${p.phone}`}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {searchResults.length === 0 && !searching && searchQuery.trim().length >= SEARCH_MIN_LENGTH && (
                  <p className="text-sm text-gray-500">No se encontraron pacientes.</p>
                )}
              </div>
            )}

            {mode === 'new' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre *"
                  value={newPatient.firstName}
                  onChange={(e) => setNewPatient((s) => ({ ...s, firstName: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 sm:py-2.5 text-base sm:text-sm min-h-[48px] sm:min-h-0 touch-manipulation"
                />
                <input
                  type="text"
                  placeholder="Apellido *"
                  value={newPatient.lastName}
                  onChange={(e) => setNewPatient((s) => ({ ...s, lastName: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 sm:py-2.5 text-base sm:text-sm min-h-[48px] sm:min-h-0 touch-manipulation"
                />
                <input
                  type="text"
                  placeholder="DNI"
                  value={newPatient.dni}
                  onChange={(e) => setNewPatient((s) => ({ ...s, dni: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 sm:py-2.5 text-base sm:text-sm min-h-[48px] sm:min-h-0 touch-manipulation"
                />
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient((s) => ({ ...s, phone: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 sm:py-2.5 text-base sm:text-sm min-h-[48px] sm:min-h-0 touch-manipulation"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient((s) => ({ ...s, email: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 sm:py-2.5 text-base sm:text-sm min-h-[48px] sm:min-h-0 touch-manipulation"
                />
              </div>
            )}

            <div className="rounded-xl p-4 border border-gray-200">
              <label
                htmlFor="booking-modal-reason"
                className="block text-xs font-semibold text-gray-600 uppercase mb-2"
              >
                Motivo de consulta (opcional)
              </label>
              <input
                id="booking-modal-reason"
                type="text"
                value={appointmentReason}
                onChange={(e) => setAppointmentReason(e.target.value.slice(0, 150))}
                maxLength={150}
                placeholder="Ej: control, fiebre, chequeo general..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 sm:py-2.5 text-base sm:text-sm min-h-[48px] sm:min-h-0 touch-manipulation focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {appointmentReason.length}/150
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2 pb-2 sm:pb-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 sm:py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 touch-manipulation min-h-[48px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3.5 sm:py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 inline-flex items-center justify-center gap-2 touch-manipulation min-h-[48px]"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirmar turno
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
