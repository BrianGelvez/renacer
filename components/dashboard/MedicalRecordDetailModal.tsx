'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  Stethoscope,
  User,
  Calendar,
  Clock,
  AlertCircle,
  Shield,
  History,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import MedicalRecordFilesSection from './MedicalRecordFilesSection';
import MedicalRecordVersionsPanel from './MedicalRecordVersionsPanel';

interface MedicalRecordDetailModalProps {
  recordId: string | null;
  onClose: () => void;
  onSuccess: () => void;
  canEdit?: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Fecha y hora del slot de turno en UTC (coincide con Turnos/Agenda). */
function formatAppointmentSlot(appointment: {
  startTime: string;
  endTime: string;
} | null | undefined): string | null {
  if (!appointment) return null;
  const d = new Date(appointment.startTime);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleString('es-AR', { month: 'short', timeZone: 'UTC' });
  const year = d.getUTCFullYear();
  const hS = d.getUTCHours();
  const mS = d.getUTCMinutes();
  const start = `${String(hS).padStart(2, '0')}:${String(mS).padStart(2, '0')}`;
  const dE = new Date(appointment.endTime);
  const hE = dE.getUTCHours();
  const mE = dE.getUTCMinutes();
  const end = `${String(hE).padStart(2, '0')}:${String(mE).padStart(2, '0')}`;
  return `${day} ${month} ${year}, ${start} - ${end}`;
}

/** Fecha de consulta en formato legible (UTC para consistencia). */
function formatConsultationDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleString('es-AR', { month: 'short', timeZone: 'UTC' });
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export default function MedicalRecordDetailModal({
  recordId,
  onClose,
  onSuccess,
  canEdit = true,
}: MedicalRecordDetailModalProps) {
  const [record, setRecord] = useState<{
    id: string;
    reason?: string | null;
    symptoms?: string | null;
    diagnosis?: string | null;
    treatment?: string | null;
    notes?: string | null;
    healthInsuranceName?: string | null;
    affiliateNumber?: string | null;
    createdAt: string;
    consultationDate: string;
    currentVersion?: number;
    professional: { firstName: string; lastName: string; specialty?: string | null };
    patient: { firstName: string; lastName: string };
    appointment?: {
      id: string;
      startTime: string;
      endTime: string;
      status?: string;
    } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'detail' | 'versions'>('detail');
  const [form, setForm] = useState({
    reason: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    notes: '',
    changeReason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchRecord = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getMedicalRecordById(recordId);
      setRecord(data);
      setForm({
        reason: data.reason ?? '',
        symptoms: data.symptoms ?? '',
        diagnosis: data.diagnosis ?? '',
        treatment: data.treatment ?? '',
        notes: data.notes ?? '',
        changeReason: '',
      });
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al cargar el registro.',
      );
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    if (recordId) fetchRecord();
  }, [recordId, fetchRecord]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordId) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.updateMedicalRecord(recordId, {
        reason: form.reason.trim() || undefined,
        symptoms: form.symptoms.trim() || undefined,
        diagnosis: form.diagnosis.trim() || undefined,
        treatment: form.treatment.trim() || undefined,
        notes: form.notes.trim() || undefined,
        changeReason: form.changeReason.trim() || undefined,
      });
      setEditing(false);
      fetchRecord();
      onSuccess();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al actualizar.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!recordId) return;
    setDeleting(true);
    setError(null);
    try {
      await apiClient.deleteMedicalRecord(recordId);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al eliminar.',
      );
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  if (!recordId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
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
        <div className="flex flex-col flex-shrink-0 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center justify-between px-6 pt-4 pb-2">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Detalle del registro
              {record?.currentVersion && record.currentVersion > 1 && (
                <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  v{record.currentVersion}
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-200"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-1 px-6 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('detail')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'detail'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Detalle
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('versions')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'versions'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Historial
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
              <p className="text-sm text-gray-500">Cargando...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          ) : record ? (
            activeTab === 'versions' ? (
              <MedicalRecordVersionsPanel
                medicalRecordId={record.id}
                canEdit={canEdit}
                onRestored={() => {
                  void fetchRecord();
                  onSuccess();
                }}
              />
            ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-2">
                {record.appointment ? (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium">
                      Turno: {formatAppointmentSlot(record.appointment)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">
                      Fecha de consulta: {formatConsultationDate(record.consultationDate)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Stethoscope className="w-4 h-4" />
                  {record.professional.firstName} {record.professional.lastName}
                  {record.professional.specialty && (
                    <span className="text-gray-500">
                      — {record.professional.specialty}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  {record.patient.firstName} {record.patient.lastName}
                </div>
                {(record.healthInsuranceName || record.affiliateNumber) && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Shield className="w-4 h-4 text-gray-600" />
                    {record.healthInsuranceName}
                    {record.affiliateNumber && (
                      <span className="text-gray-500">
                        · Nº afiliado: {record.affiliateNumber}
                      </span>
                    )}
                  </div>
                )}
                {record.appointment && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 border-t border-gray-100">
                    <Calendar className="w-3.5 h-3.5" />
                    Registro creado: {formatDate(record.createdAt)}
                  </div>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo de consulta
                    </label>
                    <input
                      type="text"
                      value={form.reason}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, reason: e.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Síntomas
                    </label>
                    <textarea
                      value={form.symptoms}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, symptoms: e.target.value }))
                      }
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Diagnóstico
                    </label>
                    <input
                      type="text"
                      value={form.diagnosis}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, diagnosis: e.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tratamiento
                    </label>
                    <textarea
                      value={form.treatment}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, treatment: e.target.value }))
                      }
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none"
                    />
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                    <label className="block text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
                      Motivo de la corrección
                    </label>
                    <p className="text-[11px] text-amber-700/80 mb-2 leading-snug">
                      Se generará una nueva versión inmutable. La versión actual quedará registrada como histórica.
                    </p>
                    <input
                      type="text"
                      placeholder="Ej: Corrección por error de transcripción"
                      value={form.changeReason}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, changeReason: e.target.value }))
                      }
                      maxLength={500}
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Guardar'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {record.reason && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        Motivo de consulta
                      </p>
                      <p className="text-sm text-gray-900">{record.reason}</p>
                    </div>
                  )}
                  {record.symptoms && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        Síntomas
                      </p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {record.symptoms}
                      </p>
                    </div>
                  )}
                  {record.diagnosis && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        Diagnóstico
                      </p>
                      <p className="text-sm text-gray-900">{record.diagnosis}</p>
                    </div>
                  )}
                  {record.treatment && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        Tratamiento
                      </p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {record.treatment}
                      </p>
                    </div>
                  )}
                  {record.notes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        Observaciones
                      </p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {record.notes}
                      </p>
                    </div>
                  )}
                  {!record.reason &&
                    !record.symptoms &&
                    !record.diagnosis &&
                    !record.treatment &&
                    !record.notes && (
                      <p className="text-sm text-gray-500 italic">
                        Sin datos adicionales en este registro.
                      </p>
                    )}

                  <MedicalRecordFilesSection
                    medicalRecordId={record.id}
                    canEdit={canEdit}
                  />

                  {canEdit && (
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </button>
                      {!deleteConfirm ? (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(true)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-700 font-medium hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            ¿Eliminar?
                          </span>
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-50"
                          >
                            {deleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Sí'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(false)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            )
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
