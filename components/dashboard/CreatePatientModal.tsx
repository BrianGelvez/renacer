'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Shield,
  Heart,
  FileText,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const STEPS = [
  { id: 1, title: 'Datos personales', icon: User },
  { id: 2, title: 'Contacto y dirección', icon: MapPin },
  { id: 3, title: 'Obra social', icon: Shield },
  { id: 4, title: 'Otros datos', icon: FileText },
] as const;

interface CreatePatientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (patientId: string) => void;
  /** Por defecto true: abre la ficha del paciente al guardar */
  navigateAfterCreate?: boolean;
}

interface HealthInsuranceOption {
  id: string;
  name: string;
  code?: string | null;
}

export default function CreatePatientModal({
  open,
  onClose,
  onSuccess,
  navigateAfterCreate = true,
}: CreatePatientModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const canManageMedicalRecordNumber =
    user?.role === 'OWNER' || user?.role === 'ADMIN';
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    medicalRecordNumber: '',
    dni: '',
    birthDate: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    province: '',
    department: '',
    healthInsuranceId: '',
    affiliateNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
  });
  const [healthInsurances, setHealthInsurances] = useState<
    HealthInsuranceOption[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthInsurances = useCallback(() => {
    apiClient.getHealthInsurances().then((data: HealthInsuranceOption[]) => {
      setHealthInsurances(Array.isArray(data) ? data : []);
    });
  }, []);

  useEffect(() => {
    if (open) fetchHealthInsurances();
  }, [open, fetchHealthInsurances]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setForm({
        firstName: '',
        lastName: '',
        medicalRecordNumber: '',
        dni: '',
        birthDate: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        province: '',
        department: '',
        healthInsuranceId: '',
        affiliateNumber: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        notes: '',
      });
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }
    if (form.healthInsuranceId && !form.affiliateNumber.trim()) {
      setError('El número de afiliado es obligatorio cuando se selecciona obra social.');
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
      const patient = await apiClient.createPatient({
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
        healthInsuranceId: form.healthInsuranceId || undefined,
        affiliateNumber: form.affiliateNumber.trim() || undefined,
      });
      onClose();
      if (onSuccess) onSuccess(patient.id);
      if (navigateAfterCreate) {
        router.push(`/dashboard/patients/${patient.id}`);
      }
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al crear el paciente.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const goNext = () => {
    setError(null);
    if (step === 1 && (!form.firstName.trim() || !form.lastName.trim())) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }
    if (step === 3 && form.healthInsuranceId && !form.affiliateNumber.trim()) {
      setError('El número de afiliado es obligatorio cuando se selecciona obra social.');
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const goBack = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  if (!open) return null;

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]';

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
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Nuevo paciente
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
            <div className="space-y-2 flex flex-col gap-2">
              <div className="flex items-center w-full">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="contents">
                    <button
                      type="button"
                      onClick={() => step > s.id && setStep(s.id)}
                      disabled={step < s.id}
                      className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-sm font-bold transition-all shrink-0 ${
                        step === s.id
                          ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200 ring-offset-2 scale-110'
                          : step > s.id
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer'
                            : 'bg-gray-100 text-gray-500 cursor-default'
                      }`}
                      aria-label={`Paso ${s.id}: ${s.title}`}
                    >
                      {s.id}
                    </button>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-1 sm:mx-2 rounded-full transition-colors min-w-0 ${
                          step > s.id ? 'bg-indigo-200' : 'bg-gray-200'
                        }`}
                        aria-hidden
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-indigo-700 text-center px-1">
                {STEPS[step - 1].title}
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step < 4) {
                goNext();
                return;
              }
              handleSubmit(e);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && step < 4) {
                e.preventDefault();
                goNext();
              }
            }}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="overflow-y-auto flex-1 p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-gray-500 mb-4">
                      Información básica del paciente
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => update('firstName', e.target.value)}
                        className={inputCls}
                        placeholder="Ej. Juan"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => update('lastName', e.target.value)}
                        className={inputCls}
                        placeholder="Ej. Pérez"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                      <input
                        type="text"
                        value={form.dni}
                        onChange={(e) => update('dni', e.target.value)}
                        className={inputCls}
                        placeholder="Ej. 12345678"
                      />
                    </div>
                    {canManageMedicalRecordNumber && (
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
                            update('medicalRecordNumber', e.target.value)
                          }
                          className={inputCls}
                          placeholder="Ej: 405"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                      <input
                        type="date"
                        value={form.birthDate}
                        onChange={(e) => update('birthDate', e.target.value)}
                        max={new Date().toISOString().slice(0, 10)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                      <select
                        value={form.gender}
                        onChange={(e) => update('gender', e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="male">Masculino</option>
                        <option value="female">Femenino</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-gray-500 mb-4">
                      Datos de contacto y ubicación
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        className={inputCls}
                        placeholder="Ej. +54 11 1234-5678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        className={inputCls}
                        placeholder="Ej. juan@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => update('address', e.target.value)}
                        className={inputCls}
                        placeholder="Ej. Av. Corrientes 1234"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) => update('city', e.target.value)}
                          className={inputCls}
                          placeholder="Ej. CABA"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                        <input
                          type="text"
                          value={form.province}
                          onChange={(e) => update('province', e.target.value)}
                          className={inputCls}
                          placeholder="Ej. Buenos Aires"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Departamento / Partido</label>
                      <input
                        type="text"
                        value={form.department}
                        onChange={(e) => update('department', e.target.value)}
                        className={inputCls}
                        placeholder="Ej. Comuna 3"
                      />
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-gray-500 mb-4">
                      Obra social del paciente (opcional)
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Obra social</label>
                      <select
                        value={form.healthInsuranceId}
                        onChange={(e) => {
                          update('healthInsuranceId', e.target.value);
                          if (!e.target.value) update('affiliateNumber', '');
                        }}
                        className={inputCls}
                      >
                        <option value="">Sin obra social</option>
                        {healthInsurances.map((hi) => (
                          <option key={hi.id} value={hi.id}>
                            {hi.name}
                            {hi.code ? ` (${hi.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    {form.healthInsuranceId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número de afiliado *</label>
                        <input
                          type="text"
                          value={form.affiliateNumber}
                          onChange={(e) => update('affiliateNumber', e.target.value)}
                          required={!!form.healthInsuranceId}
                          className={inputCls}
                          placeholder="Ej. 12345678"
                        />
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-gray-500 mb-4">
                      Contacto de emergencia y notas
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del contacto de emergencia</label>
                      <input
                        type="text"
                        value={form.emergencyContactName}
                        onChange={(e) => update('emergencyContactName', e.target.value)}
                        className={inputCls}
                        placeholder="Ej. María Pérez"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono del contacto</label>
                      <input
                        type="text"
                        value={form.emergencyContactPhone}
                        onChange={(e) => update('emergencyContactPhone', e.target.value)}
                        className={inputCls}
                        placeholder="Ej. +54 11 9876-5432"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                      <textarea
                        value={form.notes}
                        onChange={(e) => update('notes', e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        placeholder="Notas adicionales sobre el paciente..."
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <div className="px-4 sm:px-6 pb-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              </div>
            )}

            <div className="flex gap-2 p-4 sm:p-6 pt-2 border-t border-gray-100 shrink-0">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="py-3.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 min-h-[48px] inline-flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 min-h-[48px]"
                >
                  Cancelar
                </button>
              )}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    goNext();
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 inline-flex items-center justify-center gap-2 min-h-[48px]"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 inline-flex items-center justify-center gap-2 min-h-[48px]"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Crear paciente'
                  )}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
