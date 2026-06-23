'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Heart,
  FileText,
  Shield,
} from 'lucide-react';
import { apiClient, type PatientDto } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface EditPatientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient: PatientDto & { isActive?: boolean };
}

export default function EditPatientModal({
  open,
  onClose,
  onSuccess,
  patient,
}: EditPatientModalProps) {
  const { user } = useAuth();
  const canManageMedicalRecordNumber =
    user?.role === 'OWNER' || user?.role === 'ADMIN';
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    medicalRecordNumber: '',
    dni: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: '',
    address: '',
    city: '',
    province: '',
    department: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
    healthInsurancePlan: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && patient) {
      const bd = patient.birthDate
        ? new Date(patient.birthDate).toISOString().slice(0, 10)
        : '';
      setForm({
        firstName: patient.firstName ?? '',
        lastName: patient.lastName ?? '',
        medicalRecordNumber:
          patient.medicalRecordNumber != null
            ? String(patient.medicalRecordNumber)
            : '',
        dni: patient.dni ?? '',
        phone: patient.phone ?? '',
        email: patient.email ?? '',
        birthDate: bd,
        gender: patient.gender ?? '',
        address: patient.address ?? '',
        city: patient.city ?? '',
        province: patient.province ?? '',
        department: patient.department ?? '',
        emergencyContactName: patient.emergencyContactName ?? '',
        emergencyContactPhone: patient.emergencyContactPhone ?? '',
        notes: patient.notes ?? '',
        healthInsurancePlan: patient.healthInsurancePlan ?? '',
      });
      setError(null);
    }
  }, [open, patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }
    if (canManageMedicalRecordNumber && form.medicalRecordNumber.trim()) {
      const mrn = Number.parseInt(form.medicalRecordNumber, 10);
      if (!Number.isInteger(mrn) || mrn <= 0) {
        setError('El número de historia clínica debe ser un entero positivo.');
        return;
      }
    }
    setSubmitting(true);
    try {
      const medicalRecordNumber =
        canManageMedicalRecordNumber && form.medicalRecordNumber.trim()
          ? Number.parseInt(form.medicalRecordNumber, 10)
          : undefined;
      await apiClient.updatePatient(patient.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        medicalRecordNumber,
        dni: form.dni.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        birthDate: form.birthDate || undefined,
        gender: form.gender || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        province: form.province.trim() || undefined,
        department: form.department.trim() || undefined,
        emergencyContactName: form.emergencyContactName.trim() || undefined,
        emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
        notes: form.notes.trim() || undefined,
        healthInsurancePlan: form.healthInsurancePlan.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Error al actualizar el paciente.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 min-h-[100dvh] min-w-full bg-black/50 z-0"
          onClick={onClose}
          aria-hidden
        />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: 'tween', duration: 0.2 }}
          className="relative z-10 w-full sm:max-w-lg sm:max-h-[90vh] max-h-[85vh] sm:rounded-2xl rounded-t-2xl overflow-hidden bg-white shadow-xl border border-gray-100 flex flex-col"
        >
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Editar paciente
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 -mr-2 rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5 safe-area-pb"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4 text-indigo-600" />
                Datos personales
              </div>
              <div className="space-y-3 pl-6 border-l-2 border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                    placeholder="Ej. Juan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                    placeholder="Ej. Pérez"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° Historia Clínica
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={form.medicalRecordNumber}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        medicalRecordNumber: e.target.value,
                      }))
                    }
                    disabled={!canManageMedicalRecordNumber}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px] disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Ej. 405"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                  <input
                    type="text"
                    value={form.dni}
                    onChange={(e) => setForm((f) => ({ ...f, dni: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                    placeholder="Ej. 12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Phone className="w-4 h-4 text-indigo-600" />
                Contacto
              </div>
              <div className="space-y-3 pl-6 border-l-2 border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                    placeholder="Ej. +54 11 1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                    placeholder="Ej. juan@email.com"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Dirección
              </div>
              <div className="space-y-3 pl-6 border-l-2 border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                    placeholder="Ej. Av. Corrientes 1234"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                    <input
                      type="text"
                      value={form.province}
                      onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departamento / Partido</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Heart className="w-4 h-4 text-indigo-600" />
                Contacto de emergencia
              </div>
              <div className="space-y-3 pl-6 border-l-2 border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={form.emergencyContactName}
                    onChange={(e) => setForm((f) => ({ ...f, emergencyContactName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                    placeholder="Ej. María Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={form.emergencyContactPhone}
                    onChange={(e) => setForm((f) => ({ ...f, emergencyContactPhone: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                    placeholder="Ej. +54 11 9876-5432"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Shield className="w-4 h-4 text-indigo-600" />
                Recetario / cobertura
              </div>
              <div className="pl-6 border-l-2 border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan de cobertura
                </label>
                <input
                  type="text"
                  value={form.healthInsurancePlan}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      healthInsurancePlan: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                  placeholder="Ej. 310, PMO…"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4 text-indigo-600" />
                Notas
              </div>
              <div className="pl-6 border-l-2 border-gray-100">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="Observaciones..."
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 min-h-[48px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 inline-flex items-center justify-center gap-2 min-h-[48px]"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Guardar
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
