'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Loader2, Calendar, Shield } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface PatientInsuranceOption {
  id: string;
  affiliateNumber: string;
  isPrimary: boolean;
  isActive: boolean;
  healthInsurance: { id: string; name: string; code?: string | null };
}

interface CreateMedicalRecordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: string;
  appointmentId?: string;
  /** Insurances from parent if already loaded (e.g. from patient detail) */
  patientInsurances?: PatientInsuranceOption[];
}

export default function CreateMedicalRecordModal({
  open,
  onClose,
  onSuccess,
  patientId,
  appointmentId,
  patientInsurances: initialPatientInsurances,
}: CreateMedicalRecordModalProps) {
  const { user } = useAuth();
  const [consultationDate, setConsultationDate] = useState('');
  const [doctorUserId, setDoctorUserId] = useState('');
  const [doctorOptions, setDoctorOptions] = useState<
    Array<{ userId: string; firstName: string; lastName: string; specialty?: string | null }>
  >([]);
  const [appointmentDate, setAppointmentDate] = useState<string | null>(null);
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [patientInsurances, setPatientInsurances] = useState<
    PatientInsuranceOption[]
  >(initialPatientInsurances ?? []);
  const [healthInsuranceId, setHealthInsuranceId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFromAppointment = !!appointmentId;
  const canSelectDoctor =
    (user?.role === 'OWNER' || user?.role === 'ADMIN') && !isFromAppointment;

  const fetchAppointmentDate = useCallback(async () => {
    if (!appointmentId) return;
    setLoadingAppointment(true);
    try {
      const detail = await apiClient.getAppointmentById(appointmentId);
      setAppointmentDate(detail.date); // YYYY-MM-DD
      setConsultationDate(detail.date);
      if (detail.reason?.trim()) {
        setReason(detail.reason.trim());
      }
    } catch {
      setError('No se pudo cargar el turno.');
    } finally {
      setLoadingAppointment(false);
    }
  }, [appointmentId]);

  const fetchDoctorOptions = useCallback(() => {
    if (!canSelectDoctor) return;
    void apiClient.listClinicDoctors().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setDoctorOptions(
        list.map((m) => ({
          userId: m.userId,
          firstName: m.firstName,
          lastName: m.lastName,
          specialty: m.specialty ?? null,
        })),
      );
      setDoctorUserId((prev) =>
        prev && list.some((m) => m.userId === prev)
          ? prev
          : (list[0]?.userId ?? ''),
      );
    });
  }, [canSelectDoctor]);

  const fetchPatientInsurances = useCallback(() => {
    if (initialPatientInsurances?.length) {
      setPatientInsurances(initialPatientInsurances);
      const primary = initialPatientInsurances.find((i) => i.isPrimary);
      setHealthInsuranceId(primary?.healthInsurance.id ?? initialPatientInsurances[0]?.healthInsurance.id ?? '');
      return;
    }
    apiClient.getPatientInsurances(patientId).then((data: PatientInsuranceOption[]) => {
      const list = Array.isArray(data) ? data.filter((i) => i.isActive) : [];
      setPatientInsurances(list);
      const primary = list.find((i) => i.isPrimary);
      setHealthInsuranceId(primary?.healthInsurance.id ?? list[0]?.healthInsurance.id ?? '');
    });
  }, [patientId, initialPatientInsurances]);

  useEffect(() => {
    if (open && appointmentId) {
      fetchAppointmentDate();
    }
    if (open && canSelectDoctor) {
      fetchDoctorOptions();
    }
    if (open) {
      fetchPatientInsurances();
    }
  }, [open, appointmentId, canSelectDoctor, fetchAppointmentDate, fetchDoctorOptions, fetchPatientInsurances]);

  useEffect(() => {
    if (!open) {
      setConsultationDate('');
      setDoctorUserId('');
      setAppointmentDate(null);
      setHealthInsuranceId('');
      setReason('');
      setSymptoms('');
      setDiagnosis('');
      setTreatment('');
      setNotes('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFromAppointment && !consultationDate) {
      setError('La fecha de consulta es obligatoria para registros manuales.');
      return;
    }

    if (canSelectDoctor && !doctorUserId) {
      setError('Seleccioná un médico.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.createMedicalRecord({
        patientId,
        ...(appointmentId && { appointmentId }),
        ...(!appointmentId && {
          consultationDate,
          ...(canSelectDoctor && { doctorUserId }),
        }),
        ...(healthInsuranceId && { healthInsuranceId }),
        reason: reason.trim() || undefined,
        symptoms: symptoms.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        treatment: treatment.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al crear el registro.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-medical-record-title"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <h2
            id="create-medical-record-title"
            className="text-lg font-semibold text-gray-900 flex items-center gap-2"
          >
            <FileText className="w-5 h-5 text-ensigna-primary" />
            Nuevo registro clínico
            {isFromAppointment && (
              <span className="text-xs font-normal px-2 py-0.5 rounded-lg bg-ensigna-accent text-ensigna-primary-dark">
                Con turno
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Fecha de consulta
            </label>
            {isFromAppointment ? (
              <input
                type="date"
                value={appointmentDate ?? ''}
                readOnly
                disabled={loadingAppointment}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            ) : (
              <input
                type="date"
                value={consultationDate}
                onChange={(e) => setConsultationDate(e.target.value)}
                required
                max={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-ensigna-primary focus:border-ensigna-primary"
              />
            )}
            {isFromAppointment && (
              <p className="text-xs text-gray-500 mt-1">
                Fecha del turno asociado
              </p>
            )}
          </div>

          {canSelectDoctor && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Médico
              </label>
              <select
                value={doctorUserId}
                onChange={(e) => setDoctorUserId(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-ensigna-primary focus:border-ensigna-primary"
              >
                <option value="">Seleccionar...</option>
                {doctorOptions.map((p) => (
                  <option key={p.userId} value={p.userId}>
                    {p.firstName} {p.lastName}
                    {p.specialty ? ` · ${p.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {patientInsurances.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Shield className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Obra social (opcional)
              </label>
              <select
                value={healthInsuranceId}
                onChange={(e) => setHealthInsuranceId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-ensigna-primary focus:border-ensigna-primary"
              >
                <option value="">Sin obra social</option>
                {patientInsurances.map((pi) => (
                  <option
                    key={pi.id}
                    value={pi.healthInsurance.id}
                  >
                    {pi.healthInsurance.name}
                    {pi.isPrimary ? ' (Principal)' : ''} · {pi.affiliateNumber}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Por defecto se usa la obra social principal del paciente.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de consulta
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Control de presión"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-ensigna-primary focus:border-ensigna-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Síntomas
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Descripción de síntomas que presenta el paciente"
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-ensigna-primary focus:border-ensigna-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnóstico
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Ej: Hipertensión arterial"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-ensigna-primary focus:border-ensigna-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tratamiento
            </label>
            <textarea
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="Indicaciones, medicación, etc."
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-ensigna-primary focus:border-ensigna-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales"
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-ensigna-primary focus:border-ensigna-primary resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || (isFromAppointment && loadingAppointment)}
              className="flex-1 py-3 rounded-xl bg-ensigna-primary text-white font-medium hover:bg-ensigna-primary-dark disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Guardar registro'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
