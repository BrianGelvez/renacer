'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { ClinicAvailability } from '@/contexts/AuthContext';

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface ClinicToEdit {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  isActive: boolean;
  clinicAvailabilities?: ClinicAvailability[];
}

interface EditClinicModalProps {
  clinic: ClinicToEdit | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditClinicModal({ clinic, onClose, onSaved }: EditClinicModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [availabilities, setAvailabilities] = useState<ClinicAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form para nuevo/editar horario
  const [availabilityFormOpen, setAvailabilityFormOpen] = useState(false);
  const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null);
  const [availDayOfWeek, setAvailDayOfWeek] = useState(1);
  const [availStartTime, setAvailStartTime] = useState('09:00');
  const [availEndTime, setAvailEndTime] = useState('17:00');
  const [availSubmitting, setAvailSubmitting] = useState(false);

  useEffect(() => {
    if (clinic) {
      setName(clinic.name ?? '');
      setEmail(clinic.email ?? '');
      setPhone(clinic.phone ?? '');
      setAddress(clinic.address ?? '');
      setCity(clinic.city ?? '');
      setProvince(clinic.province ?? '');
      setAvailabilities(clinic.clinicAvailabilities ?? []);
      setError(null);
    }
  }, [clinic]);

  const loadAvailabilities = async () => {
    try {
      const data = await apiClient.getClinicAvailability();
      setAvailabilities(Array.isArray(data) ? data : []);
    } catch {
      setAvailabilities([]);
    }
  };

  const handleSubmitClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic) return;
    setError(null);
    setLoading(true);
    try {
      await apiClient.updateClinic({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        province: province.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al actualizar.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const openNewAvailability = () => {
    setEditingAvailabilityId(null);
    setAvailDayOfWeek(1);
    setAvailStartTime('09:00');
    setAvailEndTime('17:00');
    setAvailabilityFormOpen(true);
  };

  const openEditAvailability = (a: ClinicAvailability) => {
    setEditingAvailabilityId(a.id);
    setAvailDayOfWeek(a.dayOfWeek);
    setAvailStartTime(a.startTime);
    setAvailEndTime(a.endTime);
    setAvailabilityFormOpen(true);
  };

  const handleSaveAvailability = async () => {
    setAvailSubmitting(true);
    setError(null);
    try {
      if (editingAvailabilityId) {
        await apiClient.updateClinicAvailability(editingAvailabilityId, {
          dayOfWeek: availDayOfWeek,
          startTime: availStartTime,
          endTime: availEndTime,
        });
      } else {
        await apiClient.createClinicAvailability({
          dayOfWeek: availDayOfWeek,
          startTime: availStartTime,
          endTime: availEndTime,
        });
      }
      setAvailabilityFormOpen(false);
      await loadAvailabilities();
      onSaved();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al guardar horario.';
      setError(message);
    } finally {
      setAvailSubmitting(false);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    if (!confirm('¿Eliminar este horario?')) return;
    setAvailSubmitting(true);
    setError(null);
    try {
      await apiClient.deleteClinicAvailability(id);
      setAvailabilityFormOpen(false);
      setEditingAvailabilityId(null);
      await loadAvailabilities();
      onSaved();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al eliminar.';
      setError(message);
    } finally {
      setAvailSubmitting(false);
    }
  };

  if (!clinic) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h3 className="text-xl font-bold text-gray-900">Editar información de la clínica</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Datos de la clínica */}
            <form id="edit-clinic-form" onSubmit={handleSubmitClinic} className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Información general</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    disabled={loading}
                  />
                </div>
              </div>
            </form>

            {/* Horarios de atención */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Horarios de atención</h4>
                <button
                  type="button"
                  onClick={openNewAvailability}
                  disabled={loading || availabilityFormOpen}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-ensigna-primary hover:bg-ensigna-accent rounded-lg transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Agregar horario
                </button>
              </div>

              {availabilityFormOpen && (
                <div className="mb-4 p-4 rounded-xl border-2 border-[rgba(209,106,138,0.2)] bg-ensigna-accent-soft/80 space-y-4">
                  <h5 className="font-medium text-gray-900">
                    {editingAvailabilityId ? 'Editar horario' : 'Nuevo horario'}
                  </h5>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Día de la semana
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_SHORT.map((day, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvailDayOfWeek(idx)}
                          disabled={availSubmitting}
                          className={`min-w-[2.75rem] px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            availDayOfWeek === idx
                              ? 'gradient-red text-white'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora inicio
                      </label>
                      <input
                        type="time"
                        value={availStartTime}
                        onChange={(e) => setAvailStartTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200"
                        disabled={availSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora fin
                      </label>
                      <input
                        type="time"
                        value={availEndTime}
                        onChange={(e) => setAvailEndTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200"
                        disabled={availSubmitting}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAvailabilityFormOpen(false);
                        setEditingAvailabilityId(null);
                      }}
                      disabled={availSubmitting}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAvailability}
                      disabled={availSubmitting}
                      className="inline-flex items-center gap-2 px-4 py-2 gradient-red text-white rounded-lg font-medium hover:brightness-105 disabled:opacity-60"
                    >
                      {availSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        editingAvailabilityId ? 'Actualizar' : 'Guardar'
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {availabilities.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">
                    No hay horarios configurados. Agregá los días y horarios de atención.
                  </p>
                ) : (
                  availabilities.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {DAYS_SHORT[a.dayOfWeek]} {a.startTime} - {a.endTime}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditAvailability(a)}
                          disabled={availabilityFormOpen}
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-200"
                          aria-label="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAvailability(a.id)}
                          disabled={availSubmitting}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-white disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="edit-clinic-form"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 gradient-red text-white rounded-xl font-semibold hover:brightness-105 disabled:opacity-60 shadow-md shadow-ensigna-primary/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Guardar información
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
