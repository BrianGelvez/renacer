"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  Loader2,
  AlertCircle,
  Stethoscope,
  Clock,
  ChevronRight,
  Pencil,
  UserX,
  UserCheck,
  MapPin,
  Heart,
  Shield,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AppointmentDetailModal from "@/components/dashboard/AppointmentDetailModal";
import EditPatientModal from "@/components/dashboard/EditPatientModal";
import MedicalRecordsSection from "@/components/dashboard/MedicalRecordsSection";
import PatientInsurancesSection from "@/components/dashboard/PatientInsurancesSection";

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Programado",
  PENDING_CONFIRMATION: "Pendiente de confirmación",
  CONFIRMED: "Confirmado",
  RESCHEDULE_REQUESTED: "Reprogramar",
  COMPLETED: "Completado",
  CANCELED: "Cancelado",
  NO_SHOW: "No se presentó",
};

/** Fecha en formato local legible (día, mes, año). Usa UTC para coincidir con la Agenda. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = d.toLocaleString("es-AR", { month: "short", timeZone: "UTC" });
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/** Hora en formato HH:mm en UTC, para coincidir con el horario mostrado en la Agenda. */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getUTCHours();
  const min = d.getUTCMinutes();
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export default function PatientDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params?.id as string | undefined;
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [patient, setPatient] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    medicalRecordNumber?: number | null;
    dni?: string | null;
    phone?: string | null;
    email?: string | null;
    birthDate?: string | null;
    gender?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    department?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    notes?: string | null;
    createdAt: string;
    isActive?: boolean;
    deactivatedAt?: string | null;
    appointments: Array<{
      id: string;
      startTime: string;
      endTime: string;
      status: string;
      reason?: string | null;
      professional: { id: string; firstName: string; lastName: string };
    }>;
    insurances?: Array<{
      id: string;
      affiliateNumber: string;
      isPrimary: boolean;
      isActive: boolean;
      healthInsurance: { id: string; name: string; code?: string | null };
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [activating, setActivating] = useState(false);
  const [
    openCreateMedicalRecordWithAppointment,
    setOpenCreateMedicalRecordWithAppointment,
  ] = useState<string | null>(null);

  const fetchPatient = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiClient
      .getPatientById(id)
      .then((data) => setPatient(data))
      .catch((err: unknown) => {
        setError(
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Error al cargar el paciente.",
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .getPatientById(id)
      .then((data) => {
        if (!cancelled) setPatient(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Error al cargar el paciente.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const canEditAppointments = user?.role === "OWNER" || user?.role === "ADMIN";
  const canManagePatient = user?.role === "OWNER" || user?.role === "ADMIN";
  const isInactive = patient?.isActive === false;

  const handleAppointmentActionSuccess = () => {
    fetchPatient();
  };

  const handleDeactivateConfirm = async () => {
    if (!id) return;
    setDeactivating(true);
    setError(null);
    try {
      await apiClient.deactivatePatient(id);
      setDeactivateConfirmOpen(false);
      fetchPatient();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al desactivar el paciente.",
      );
    } finally {
      setDeactivating(false);
    }
  };

  const handleActivate = async () => {
    if (!id) return;
    setActivating(true);
    setError(null);
    try {
      await apiClient.activatePatient(id);
      fetchPatient();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al reactivar el paciente.",
      );
    } finally {
      setActivating(false);
    }
  };

  if (!id) {
    return null;
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 gap-3"
      >
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-sm text-gray-500">Cargando paciente...</p>
      </motion.div>
    );
  }

  if (error || !patient) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <Link
          href="/dashboard?section=patients"
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Pacientes
        </Link>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">
            {error ?? "Paciente no encontrado."}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <Link
        href="/dashboard?section=patients"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Pacientes
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100">
          <div className="flex flex-col sm:items-start gap-2">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {patient.lastName}, {patient.firstName}
                  </h1>
                  {isInactive && (
                    <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-200 text-gray-700">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  Creado el {formatDate(patient.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-gray-600">
                  {patient.dni && (
                    <span className="inline-flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      DNI {patient.dni}
                    </span>
                  )}
                  {patient.medicalRecordNumber != null && (
                    <span className="inline-flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      N° HC: {patient.medicalRecordNumber}
                    </span>
                  )}
                  {patient.phone && (
                    <span className="inline-flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {patient.phone}
                    </span>
                  )}
                  {patient.email && (
                    <span className="inline-flex items-center gap-2 truncate">
                      <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                      {patient.email}
                    </span>
                  )}
                  {patient.birthDate && (
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      Nac: {formatDate(patient.birthDate)}
                    </span>
                  )}
                  {patient.gender && (
                    <span className="inline-flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {patient.gender === "male"
                        ? "Masculino"
                        : patient.gender === "female"
                          ? "Femenino"
                          : "Otro"}
                    </span>
                  )}
                </div>
                {(patient.address ||
                  patient.city ||
                  patient.province ||
                  patient.department) && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      {patient.address && <p>{patient.address}</p>}
                      {[
                        patient.city,
                        patient.department,
                        patient.province,
                      ].some(Boolean) && (
                        <p>
                          {[patient.city, patient.department, patient.province]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {(patient.emergencyContactName ||
                  patient.emergencyContactPhone) && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <Heart className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="text-pink-400">
                      {patient.emergencyContactName}
                      {patient.emergencyContactPhone &&
                        ` - Telefono: ${patient.emergencyContactPhone}`}
                    </span>
                  </div>
                )}
                {patient.insurances?.filter((i) => i.isActive).length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {patient.insurances
                      .filter((i) => i.isActive)
                      .map((pi) => (
                        <span
                          key={pi.id}
                          className="inline-flex items-center gap-1.5 py-1 rounded-lg text-indigo-700 text-sm"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          {pi.healthInsurance.name}
                          {pi.isPrimary && (
                            <span className="text-xs text-indigo-600">
                              (Principal)
                            </span>
                          )}
                          · {pi.affiliateNumber}
                        </span>
                      ))}
                  </div>
                ) : null}
                {patient.notes && (
                  <p className="my-4 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                    {patient.notes}
                  </p>
                )}
              </div>
            </div>
            {canManagePatient && (
              <div className="flex flex-wrap gap-2 shrink-0">
                {isInactive ? (
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={activating}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-medium hover:bg-emerald-100 disabled:opacity-50"
                  >
                    {activating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    Reactivar paciente
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar datos
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeactivateConfirmOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100"
                    >
                      <UserX className="w-4 h-4" />
                      Desactivar paciente
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Turnos
          </h2>
          {!patient.appointments?.length ? (
            <div className="text-center py-12 rounded-xl bg-gray-50 border border-gray-100">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                Sin turnos registrados
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Los turnos que reserves para este paciente aparecerán aquí.
              </p>
            </div>
          ) : (
            <>
              {canEditAppointments && (
                <p className="text-sm text-gray-500 mb-3">
                  Tocá un turno para ver detalle y gestionar (confirmar,
                  cancelar, marcar como atendido, etc.).
                </p>
              )}
              <ul className="space-y-3">
                {patient.appointments.map((apt) => (
                  <li key={apt.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedAppointmentId(apt.id)}
                      className="w-full flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-indigo-100 active:scale-[0.99] transition-all text-left touch-manipulation"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {apt.professional?.firstName}{" "}
                            {apt.professional?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(apt.startTime)} ·{" "}
                            {formatTime(apt.startTime)} –{" "}
                            {formatTime(apt.endTime)}
                          </p>
                          {apt.reason && (
                            <p
                              className="text-xs text-gray-600 mt-0.5 truncate max-w-xs"
                              title={apt.reason}
                            >
                              Motivo: {apt.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`
                            inline-flex px-2.5 py-1 rounded-lg text-xs font-medium
                            ${apt.status === "CANCELED" ? "bg-gray-200 text-gray-600" : ""}
                            ${apt.status === "SCHEDULED" ? "bg-amber-100 text-amber-800" : ""}
                            ${apt.status === "PENDING_CONFIRMATION" ? "bg-[rgba(209,106,138,0.12)] text-[#b85578]" : ""}
                            ${apt.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800" : ""}
                            ${apt.status === "RESCHEDULE_REQUESTED" ? "bg-sky-100 text-sky-900" : ""}
                            ${apt.status === "COMPLETED" ? "bg-blue-100 text-blue-800" : ""}
                            ${apt.status === "NO_SHOW" ? "bg-red-100 text-red-800" : ""}
                          `}
                        >
                          {STATUS_LABELS[apt.status] ?? apt.status}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="mt-6">
        <PatientInsurancesSection
          patientId={patient.id}
          canManage={canManagePatient}
          initialInsurances={patient.insurances}
          onUpdate={fetchPatient}
        />
      </div>

      <div className="mt-6">
        <MedicalRecordsSection
          patientId={patient.id}
          canCreate
          canEdit
          initialAppointmentId={openCreateMedicalRecordWithAppointment}
          onInitialAppointmentHandled={() =>
            setOpenCreateMedicalRecordWithAppointment(null)
          }
          patientInsurances={patient.insurances}
        />
      </div>

      <AnimatePresence>
        {selectedAppointmentId && (
          <AppointmentDetailModal
            appointmentId={selectedAppointmentId}
            onClose={() => setSelectedAppointmentId(null)}
            onSuccess={handleAppointmentActionSuccess}
            onAddMedicalRecord={(patientIdFromApt, appointmentId) => {
              setSelectedAppointmentId(null);
              setOpenCreateMedicalRecordWithAppointment(appointmentId);
            }}
            canEdit={canEditAppointments}
          />
        )}
      </AnimatePresence>

      {patient && (
        <EditPatientModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => {
            fetchPatient();
            setEditModalOpen(false);
          }}
          patient={patient}
        />
      )}

      {deactivateConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !deactivating && setDeactivateConfirmOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Desactivar paciente
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Se cancelarán todos los turnos futuros del paciente. El historial
              de turnos se mantiene. ¿Continuar?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => !deactivating && setDeactivateConfirmOpen(false)}
                disabled={deactivating}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeactivateConfirm}
                disabled={deactivating}
                className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {deactivating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
