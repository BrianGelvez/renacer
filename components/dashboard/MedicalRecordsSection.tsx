'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Loader2,
  Stethoscope,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import CreateMedicalRecordModal from './CreateMedicalRecordModal';
import MedicalRecordDetailModal from './MedicalRecordDetailModal';

interface MedicalRecord {
  id: string;
  reason?: string | null;
  symptoms?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  notes?: string | null;
  createdAt: string;
  consultationDate: string;
  professional: {
    firstName: string;
    lastName: string;
    specialty?: string | null;
  };
  appointment?: {
    id: string;
    startTime: string;
    endTime: string;
    status?: string;
  } | null;
}

interface PatientInsuranceOption {
  id: string;
  affiliateNumber: string;
  isPrimary: boolean;
  isActive: boolean;
  healthInsurance: { id: string; name: string; code?: string | null };
}

interface MedicalRecordsSectionProps {
  patientId: string;
  canCreate?: boolean;
  canEdit?: boolean;
  /** Cuando se crea desde turno, pasar appointmentId para pre-cargar */
  initialAppointmentId?: string | null;
  /** Llamar cuando ya se usó initialAppointmentId (para que el padre limpie el estado) */
  onInitialAppointmentHandled?: () => void;
  /** Obras sociales del paciente (para pre-cargar en formulario de nuevo registro) */
  patientInsurances?: PatientInsuranceOption[];
}

/** Fecha en formato legible. Para slot de turno usa UTC (coincide con Turnos/Agenda). */
function formatDate(iso: string, useUTC = false): string {
  const d = new Date(iso);
  if (useUTC) {
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = d.toLocaleString('es-AR', { month: 'short', timeZone: 'UTC' });
    const year = d.getUTCFullYear();
    return `${day} ${month} ${year}`;
  }
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Hora HH:mm. Para slot de turno usa UTC (coincide con Turnos/Agenda). */
function formatTime(iso: string, useUTC = false): string {
  const d = new Date(iso);
  if (useUTC) {
    const h = d.getUTCHours();
    const min = d.getUTCMinutes();
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  return d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatAppointmentSlot(appointment: {
  startTime: string;
  endTime: string;
} | null | undefined): string | null {
  if (!appointment) return null;
  const date = formatDate(appointment.startTime, true);
  const start = formatTime(appointment.startTime, true);
  const end = formatTime(appointment.endTime, true);
  return `${date}, ${start} - ${end}`;
}

/** Muestra fecha/hora según tenga turno o sea manual. Usa consultationDate como base. */
function formatRecordSubtitle(record: MedicalRecord): string {
  const slot = formatAppointmentSlot(record.appointment);
  if (slot) return slot;
  return formatDate(record.consultationDate, true);
}

export default function MedicalRecordsSection({
  patientId,
  canCreate = true,
  canEdit = true,
  initialAppointmentId,
  onInitialAppointmentHandled,
  patientInsurances,
}: MedicalRecordsSectionProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [appointmentIdForCreate, setAppointmentIdForCreate] = useState<
    string | undefined
  >(initialAppointmentId ?? undefined);

  const fetchRecords = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient
      .getMedicalRecordsByPatient(patientId)
      .then((data: MedicalRecord[]) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => {
        setError('Error al cargar la historia clínica.');
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    if (initialAppointmentId) {
      setAppointmentIdForCreate(initialAppointmentId);
      setCreateModalOpen(true);
      onInitialAppointmentHandled?.();
    }
  }, [initialAppointmentId, onInitialAppointmentHandled]);

  const handleOpenCreate = (appointmentId?: string) => {
    setAppointmentIdForCreate(appointmentId);
    setCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    fetchRecords();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-ensigna-primary" />
            Historia clínica
          </h2>
          {canCreate && (
            <button
              type="button"
              onClick={() => handleOpenCreate()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ensigna-primary text-white text-sm font-medium hover:bg-ensigna-primary-dark"
            >
              <Plus className="w-4 h-4" />
              Nuevo registro
            </button>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-ensigna-primary" />
            <p className="text-sm text-gray-500">Cargando historia clínica...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 rounded-xl bg-red-50 border border-red-100">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        ) : !records.length ? (
          <div className="text-center py-16 rounded-xl bg-gray-50 border border-gray-100">
            <FileText className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              Este paciente aún no tiene historia clínica
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Creá el primer registro para comenzar a documentar las consultas.
            </p>
            {canCreate && (
              <button
                type="button"
                onClick={() => handleOpenCreate()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ensigna-primary text-white text-sm font-medium hover:bg-ensigna-primary-dark"
              >
                <Plus className="w-4 h-4" />
                Crear primer registro
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {records.map((record) => (
              <li key={record.id}>
                <button
                  type="button"
                  onClick={() => setSelectedRecordId(record.id)}
                  className="w-full flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-ensigna-soft/50 transition-all text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-ensigna-accent flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="w-5 h-5 text-ensigna-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-ensigna-primary/80" />
                          {formatRecordSubtitle(record)}
                        </span>
                        <span className="text-gray-400">·</span>
                        <span>
                          {record.professional.firstName}{' '}
                          {record.professional.lastName}
                          {record.professional.specialty && ` · ${record.professional.specialty}`}
                        </span>
                        {record.appointment ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-ensigna-accent text-ensigna-primary-dark">
                            Con turno
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-gray-200 text-gray-700">
                            Manual
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 truncate max-w-xs mt-0.5">
                        {record.reason || record.diagnosis || 'Sin detalle'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateMedicalRecordModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setAppointmentIdForCreate(undefined);
        }}
        onSuccess={handleCreateSuccess}
        patientId={patientId}
        appointmentId={appointmentIdForCreate}
        patientInsurances={patientInsurances}
      />

      <MedicalRecordDetailModal
        recordId={selectedRecordId}
        onClose={() => setSelectedRecordId(null)}
        onSuccess={() => {
          handleCreateSuccess();
          setSelectedRecordId(null);
        }}
        canEdit={canEdit}
      />
    </div>
  );
}
