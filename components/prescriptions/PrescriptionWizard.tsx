'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Loader2,
  Plus,
  Search,
  Share2,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  apiClient,
  type ClinicTeamMemberDto,
  type CreatePrescriptionPayload,
  type PrescriptionDto,
  type SelectedMedication,
} from '@/lib/api';
import { isClinicRecetarioLinked } from '@/lib/recetario-patient-form';
import MedicationAutocomplete from '@/components/dashboard/MedicationAutocomplete';
import DiagnosisAutocomplete, {
  type DiagnosisSelection,
} from '@/components/prescriptions/DiagnosisAutocomplete';

const MAX_MEDICINES = 3;
const PATIENT_SEARCH_DEBOUNCE_MS = 500;
const STEPS = [
  { id: 1, title: 'Profesional y paciente' },
  { id: 2, title: 'Medicamentos' },
  { id: 3, title: 'Diagnóstico' },
  { id: 4, title: 'Configuración' },
  { id: 5, title: 'Resumen' },
] as const;

type PatientListItem = {
  id: string;
  firstName: string;
  lastName: string;
  dni?: string | null;
};

type PatientInsuranceRow = {
  isPrimary: boolean;
  isActive: boolean;
  affiliateNumber: string;
  healthInsurance: { name: string };
};

type PatientDetail = PatientListItem & {
  healthInsurancePlan?: string | null;
  insurances?: PatientInsuranceRow[];
};

type MedicineLine = {
  key: string;
  selection: SelectedMedication | null;
  posology: string;
  quantity: number;
  longTerm: boolean;
  genericOnly: boolean;
  brandRecommendation: boolean;
  requiresDuplicate: boolean;
};

export type PrescriptionWizardProps = {
  initialPatientId?: string;
  lockPatient?: boolean;
};

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isoToDisplay(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function displayToIso(display: string): string | null {
  const trimmed = display.trim();
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = String(Number.parseInt(m[1], 10)).padStart(2, '0');
  const month = String(Number.parseInt(m[2], 10)).padStart(2, '0');
  const year = m[3];
  if (Number.parseInt(month, 10) < 1 || Number.parseInt(month, 10) > 12) return null;
  if (Number.parseInt(day, 10) < 1 || Number.parseInt(day, 10) > 31) return null;
  return `${year}-${month}-${day}`;
}

function emptyMedicineLine(): MedicineLine {
  return {
    key: crypto.randomUUID(),
    selection: null,
    posology: '',
    quantity: 1,
    longTerm: false,
    genericOnly: false,
    brandRecommendation: false,
    requiresDuplicate: false,
  };
}

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function PrescriptionSuccessModal({
  prescription,
  onClose,
}: {
  prescription: PrescriptionDto;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<'number' | 'link' | null>(null);

  const copyText = async (text: string, kind: 'number' | 'link') => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const share = async () => {
    if (!prescription.pdfUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Receta electrónica',
          text: `Receta ${prescription.recetarioExternalId ?? ''}`.trim(),
          url: prescription.pdfUrl,
        });
      } catch {
        /* usuario canceló */
      }
    } else if (prescription.pdfUrl) {
      await copyText(prescription.pdfUrl, 'link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Receta emitida correctamente
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              La receta fue generada en Recetario.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="text-gray-500">Número de receta</dt>
            <dd className="font-mono font-medium text-gray-900">
              {prescription.recetarioExternalId ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Fecha de emisión</dt>
            <dd className="text-gray-900">
              {new Date(prescription.createdAt).toLocaleString('es-AR')}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          {prescription.pdfUrl && (
            <a
              href={prescription.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <FileText className="h-4 w-4" />
              Ver PDF
            </a>
          )}
          {prescription.pdfUrl && (
            <button
              type="button"
              onClick={() => void copyText(prescription.pdfUrl!, 'link')}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {copied === 'link' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copiar enlace
            </button>
          )}
          {prescription.pdfUrl && (
            <button
              type="button"
              onClick={() => void share()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4" />
              Compartir
            </button>
          )}
          {prescription.recetarioExternalId && (
            <button
              type="button"
              onClick={() =>
                void copyText(prescription.recetarioExternalId!, 'number')
              }
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {copied === 'number' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copiar número
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PrescriptionWizard({
  initialPatientId,
  lockPatient = false,
}: PrescriptionWizardProps) {
  const { clinic, user } = useAuth();
  const recetarioLinked = isClinicRecetarioLinked(clinic?.recetarioHealthCenterId);

  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<ClinicTeamMemberDto[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorId, setDoctorId] = useState('');

  const [patientTerm, setPatientTerm] = useState('');
  const debouncedPatientTerm = useDebouncedValue(patientTerm, PATIENT_SEARCH_DEBOUNCE_MS);
  const [patientHits, setPatientHits] = useState<PatientListItem[]>([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [patientLoading, setPatientLoading] = useState(!!initialPatientId);
  const patientBoxRef = useRef<HTMLDivElement>(null);

  const [medicines, setMedicines] = useState<MedicineLine[]>([emptyMedicineLine()]);
  const [selectedDiagnosis, setSelectedDiagnosis] =
    useState<DiagnosisSelection | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');

  const [dateIso, setDateIso] = useState(todayIsoDate);
  const [dateDisplay, setDateDisplay] = useState(() => isoToDisplay(todayIsoDate()));
  const [hiv, setHiv] = useState(false);
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringDays, setRecurringDays] = useState<30 | 60 | 90>(30);
  const [recurringQuantity, setRecurringQuantity] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedPrescription, setIssuedPrescription] =
    useState<PrescriptionDto | null>(null);

  const activeDoctors = useMemo(
    () => doctors.filter((d) => d.isDoctor && d.isActive),
    [doctors],
  );

  const selectedDoctor = useMemo(
    () => activeDoctors.find((d) => d.userId === doctorId) ?? null,
    [activeDoctors, doctorId],
  );

  const canIssueAsUser = user?.isDoctor === true;

  const isAssignedPhysician =
    canIssueAsUser && !!doctorId && user?.id === doctorId;

  const isStaffPreparer =
    user?.role === 'ADMIN' || user?.role === 'SECRETARY';

  const primaryInsurance = useMemo(() => {
    if (!selectedPatient?.insurances?.length) return null;
    return (
      selectedPatient.insurances.find((i) => i.isPrimary && i.isActive) ?? null
    );
  }, [selectedPatient]);

  const loadPatient = useCallback(async (id: string) => {
    setPatientLoading(true);
    setError(null);
    try {
      const detail = (await apiClient.getPatientById(id)) as PatientDetail;
      setSelectedPatient(detail);
    } catch {
      setError('No se pudo cargar el paciente.');
    } finally {
      setPatientLoading(false);
    }
  }, []);

  useEffect(() => {
    setDoctorsLoading(true);
    apiClient
      .getTeamMembers()
      .then((team) => setDoctors(Array.isArray(team) ? team : []))
      .catch(() => setError('No se pudo cargar el equipo médico.'))
      .finally(() => setDoctorsLoading(false));
  }, []);

  useEffect(() => {
    if (canIssueAsUser && user?.id) {
      const self = activeDoctors.find((d) => d.userId === user.id);
      if (self) setDoctorId(self.userId);
    } else if (activeDoctors.length === 1) {
      setDoctorId(activeDoctors[0].userId);
    }
  }, [activeDoctors, user, canIssueAsUser]);

  useEffect(() => {
    if (initialPatientId) {
      void loadPatient(initialPatientId);
    }
  }, [initialPatientId, loadPatient]);

  useEffect(() => {
    if (!debouncedPatientTerm.trim() || lockPatient) {
      setPatientHits([]);
      return;
    }
    setPatientSearchLoading(true);
    apiClient
      .getPatients({ q: debouncedPatientTerm.trim(), limit: 8 })
      .then((res) => {
        const items = (res as { items?: PatientListItem[] }).items ?? [];
        setPatientHits(items);
      })
      .catch(() => setPatientHits([]))
      .finally(() => setPatientSearchLoading(false));
  }, [debouncedPatientTerm, lockPatient]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        patientBoxRef.current &&
        !patientBoxRef.current.contains(e.target as Node)
      ) {
        setPatientOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectPatient = useCallback(
    async (hit: PatientListItem) => {
      setPatientTerm('');
      setPatientOpen(false);
      await loadPatient(hit.id);
    },
    [loadPatient],
  );

  const updateMedicine = (key: string, patch: Partial<MedicineLine>) => {
    setMedicines((prev) =>
      prev.map((m) => (m.key === key ? { ...m, ...patch } : m)),
    );
  };

  const addMedicineLine = () => {
    if (medicines.length >= MAX_MEDICINES) return;
    setMedicines((prev) => [...prev, emptyMedicineLine()]);
  };

  const removeMedicineLine = (key: string) => {
    setMedicines((prev) => {
      const next = prev.filter((m) => m.key !== key);
      return next.length > 0 ? next : [emptyMedicineLine()];
    });
  };

  const filledMedicines = medicines.filter((m) => m.selection);

  const validateStep = (currentStep: number): string | null => {
    if (currentStep === 1) {
      if (!doctorId) return 'Seleccioná el profesional responsable.';
      if (!selectedPatient) return 'Seleccioná un paciente.';
    }
    if (currentStep === 2) {
      if (filledMedicines.length === 0) return 'Agregá al menos un medicamento.';
      if (filledMedicines.some((m) => !m.posology.trim())) {
        return 'Completá la posología de cada medicamento.';
      }
      if (
        filledMedicines.some((m) => m.genericOnly && m.brandRecommendation)
      ) {
        return 'Genérico solamente y recomendar marca son incompatibles.';
      }
    }
    if (currentStep === 3) {
      if (
        !selectedDiagnosis?.diagnosisCode ||
        !selectedDiagnosis.diagnosisDescriptionEs
      ) {
        return 'Seleccioná un diagnóstico CIE-10.';
      }
    }
    if (currentStep === 4) {
      const iso = displayToIso(dateDisplay);
      if (!iso) return 'Ingresá una fecha válida (dd/MM/aaaa).';
    }
    return null;
  };

  const goNext = () => {
    setError(null);
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    if (step === 4) {
      const iso = displayToIso(dateDisplay);
      if (iso) setDateIso(iso);
    }
    setStep((s) => Math.min(5, s + 1));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const buildPayload = (): CreatePrescriptionPayload | null => {
    if (
      !doctorId ||
      !selectedPatient ||
      !selectedDiagnosis?.diagnosisCode ||
      !selectedDiagnosis.diagnosisDescriptionEs ||
      !selectedDiagnosis.diagnosisDescriptionEn
    ) {
      return null;
    }
    const iso = displayToIso(dateDisplay) ?? dateIso;
    const payload: CreatePrescriptionPayload = {
      doctorId,
      patientId: selectedPatient.id,
      date: iso,
      diagnosis: selectedDiagnosis.diagnosisDescriptionEs,
      diagnosisCode: selectedDiagnosis.diagnosisCode,
      diagnosisDescriptionEs: selectedDiagnosis.diagnosisDescriptionEs,
      diagnosisDescriptionEn: selectedDiagnosis.diagnosisDescriptionEn,
      hiv,
      medicines: filledMedicines.map((m) => ({
        externalId: m.selection!.package.externalId,
        quantity: m.quantity,
        longTerm: m.longTerm,
        posology: m.posology.trim(),
        ...(m.genericOnly ? { genericOnly: true } : {}),
        ...(m.brandRecommendation ? { brandRecommendation: true } : {}),
        ...(m.requiresDuplicate ? { requiresDuplicate: true } : {}),
      })),
    };
    const notes = clinicalNotes.trim();
    if (notes) payload.clinicalNotes = notes;
    if (recurringEnabled) {
      payload.recurring = {
        days: recurringDays,
        quantity: recurringQuantity,
      };
    }
    return payload;
  };

  const handleEmit = async () => {
    setError(null);
    for (let s = 1; s <= 4; s++) {
      const err = validateStep(s);
      if (err) {
        setError(err);
        setStep(s);
        return;
      }
    }
    if (
      isAssignedPhysician &&
      (selectedDoctor?.recetarioUserId == null ||
        selectedDoctor?.recetarioActive === false)
    ) {
      setError('Debés estar sincronizado y activo en Recetario para emitir recetas.');
      return;
    }

    const payload = buildPayload();
    if (!payload) {
      setError('Completá todos los campos obligatorios.');
      return;
    }

    setSubmitting(true);
    try {
      const draft = await apiClient.createPrescription(payload);
      let current = await apiClient.submitPrescription(draft.id);

      if (isAssignedPhysician) {
        if (current.status === 'PENDING_APPROVAL') {
          current = await apiClient.approvePrescription(current.id);
        }
        current = await apiClient.issuePrescription(current.id);
      }

      if (current.status === 'ISSUED') {
        setIssuedPrescription(current);
      } else {
        setError(
          isStaffPreparer
            ? 'Receta enviada a aprobación del médico asignado.'
            : 'Receta enviada a aprobación.',
        );
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al procesar la receta.';
      setError(typeof msg === 'string' ? msg : 'Error al procesar la receta.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!recetarioLinked) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-medium">Recetario no vinculado</p>
        <p className="mt-1 text-sm">
          Vinculá la clínica con Recetario desde Integraciones antes de emitir
          recetas electrónicas.
        </p>
      </div>
    );
  }

  const stepTitle =
    step === 1
      ? 'Datos de la prescripción'
      : step === 2
        ? 'Medicamentos'
        : step === 3
          ? 'Diagnóstico'
          : step === 4
            ? 'Configuración'
            : 'Resumen';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nueva receta</h1>
        <p className="mt-1 text-sm text-gray-600">
          Prescripción electrónica vía vademécum Recetario
        </p>
      </div>

      {/* Stepper */}
      <nav aria-label="Pasos de la receta" className="overflow-x-auto">
        <ol className="flex min-w-max gap-1 sm:gap-2">
          {STEPS.map((s) => {
            const done = s.id < step;
            const active = s.id === step;
            return (
              <li key={s.id} className="flex items-center gap-1 sm:gap-2">
                <div
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium sm:px-3 sm:text-sm ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : done
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      active
                        ? 'bg-white/20'
                        : done
                          ? 'bg-indigo-200 text-indigo-800'
                          : 'bg-gray-200'
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : s.id}
                  </span>
                  <span className="hidden sm:inline">{s.title}</span>
                </div>
                {s.id < STEPS.length && (
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">{stepTitle}</h2>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="mt-5 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Profesional</h3>
              {doctorsLoading ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando…
                </div>
              ) : activeDoctors.length === 0 ? (
                <p className="mt-2 text-sm text-amber-700">
                  No hay médicos activos en la clínica.
                </p>
              ) : activeDoctors.length === 1 && selectedDoctor ? (
                <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm">
                  <p className="font-semibold text-gray-900">
                    Dr/a. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </p>
                  {selectedDoctor.licenseNumber && (
                    <p className="text-gray-600">
                      Matrícula: {selectedDoctor.licenseNumber}
                    </p>
                  )}
                  {selectedDoctor.specialty && (
                    <p className="text-gray-600">
                      Especialidad: {selectedDoctor.specialty}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Seleccionar profesional…</option>
                    {activeDoctors.map((d) => (
                      <option key={d.userId} value={d.userId}>
                        Dr/a. {d.firstName} {d.lastName}
                        {d.specialty ? ` — ${d.specialty}` : ''}
                        {d.recetarioUserId == null ? ' (sin Recetario)' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedDoctor && (
                    <div className="mt-2 text-sm text-gray-600">
                      {selectedDoctor.licenseNumber && (
                        <p>Matrícula: {selectedDoctor.licenseNumber}</p>
                      )}
                      {selectedDoctor.specialty && (
                        <p>Especialidad: {selectedDoctor.specialty}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700">Paciente</h3>
              {patientLoading ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando paciente…
                </div>
              ) : selectedPatient ? (
                <div
                  className={`mt-2 rounded-xl border p-4 ${
                    lockPatient
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-indigo-100 bg-indigo-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 text-sm">
                      <User className="mt-0.5 h-4 w-4 text-indigo-600" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </p>
                        {selectedPatient.dni && (
                          <p className="text-gray-600">
                            DNI: {selectedPatient.dni}
                          </p>
                        )}
                        <p className="mt-1 text-gray-600">
                          Obra social:{' '}
                          <span className="font-medium">
                            {primaryInsurance?.healthInsurance.name ?? 'particular'}
                          </span>
                        </p>
                        {primaryInsurance && (
                          <p className="text-gray-600">
                            Nº afiliado: {primaryInsurance.affiliateNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    {!lockPatient && (
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(null)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-white"
                        aria-label="Cambiar paciente"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div ref={patientBoxRef} className="relative mt-2">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={patientTerm}
                    onChange={(e) => {
                      setPatientTerm(e.target.value);
                      setPatientOpen(true);
                    }}
                    onFocus={() => setPatientOpen(true)}
                    placeholder="Buscar paciente por nombre o DNI…"
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  />
                  {patientSearchLoading && (
                    <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-500" />
                  )}
                  {patientOpen && patientTerm.trim() && (
                    <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                      {patientHits.length === 0 && !patientSearchLoading && (
                        <li className="px-4 py-3 text-sm text-gray-500">
                          Sin resultados
                        </li>
                      )}
                      {patientHits.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => void selectPatient(p)}
                            className="w-full px-4 py-3 text-left text-sm hover:bg-indigo-50"
                          >
                            <span className="font-medium text-gray-900">
                              {p.firstName} {p.lastName}
                            </span>
                            {p.dni && (
                              <span className="ml-2 text-gray-500">
                                · {p.dni}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-gray-500">
              Buscá en el vademécum Recetario (máximo {MAX_MEDICINES} medicamentos).
            </p>
            {medicines.map((line, index) => (
              <div
                key={line.key}
                className="rounded-xl border border-gray-100 bg-gray-50/60 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Medicamento {index + 1}
                  </span>
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicineLine(line.key)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-red-600"
                      aria-label="Eliminar medicamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <MedicationAutocomplete
                  value={line.selection}
                  onSelect={(sel) =>
                    updateMedicine(line.key, {
                      selection: sel,
                      requiresDuplicate: sel?.requiresDuplicate ?? false,
                    })
                  }
                  placeholder="Buscar medicamento…"
                />

                {line.selection && (
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
                      <p>
                        <span className="text-gray-500">Marca:</span>{' '}
                        {line.selection.brand}
                      </p>
                      <p>
                        <span className="text-gray-500">Principio activo:</span>{' '}
                        {line.selection.drug}
                      </p>
                      <p>
                        <span className="text-gray-500">Presentación:</span>{' '}
                        {line.selection.package.name}
                      </p>
                      {line.selection.package.power?.value && (
                        <p>
                          <span className="text-gray-500">Potencia:</span>{' '}
                          {line.selection.package.power.value}
                          {line.selection.package.power.unit ?? ''}
                        </p>
                      )}
                      {line.selection.package.shape && (
                        <p>
                          <span className="text-gray-500">Forma:</span>{' '}
                          {line.selection.package.shape}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Posología <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={line.posology}
                        onChange={(e) =>
                          updateMedicine(line.key, { posology: e.target.value })
                        }
                        placeholder="Ej. 1 comprimido cada 8 horas"
                        className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Cantidad (1–10)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={line.quantity}
                          onChange={(e) =>
                            updateMedicine(line.key, {
                              quantity: Math.min(
                                10,
                                Math.max(1, Number(e.target.value) || 1),
                              ),
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={line.requiresDuplicate}
                          onChange={(e) =>
                            updateMedicine(line.key, {
                              requiresDuplicate: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300 text-indigo-600"
                        />
                        Duplicado
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={line.genericOnly}
                          disabled={line.brandRecommendation}
                          onChange={(e) =>
                            updateMedicine(line.key, {
                              genericOnly: e.target.checked,
                              brandRecommendation: e.target.checked
                                ? false
                                : line.brandRecommendation,
                            })
                          }
                          className="rounded border-gray-300 text-indigo-600"
                        />
                        Sólo genérico
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={line.brandRecommendation}
                          disabled={line.genericOnly}
                          onChange={(e) =>
                            updateMedicine(line.key, {
                              brandRecommendation: e.target.checked,
                              genericOnly: e.target.checked
                                ? false
                                : line.genericOnly,
                            })
                          }
                          className="rounded border-gray-300 text-indigo-600"
                        />
                        Recomendar marca
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={line.longTerm}
                          onChange={(e) =>
                            updateMedicine(line.key, {
                              longTerm: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300 text-indigo-600"
                        />
                        Tratamiento prolongado
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {medicines.length < MAX_MEDICINES && (
              <button
                type="button"
                onClick={addMedicineLine}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4" />
                Agregar medicamento
              </button>
            )}
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Diagnóstico CIE-10 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <DiagnosisAutocomplete
                  value={selectedDiagnosis}
                  onChange={setSelectedDiagnosis}
                  required
                  placeholder="Buscar por código o descripción (mín. 3 caracteres)…"
                />
              </div>
              {selectedDiagnosis && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800 border border-emerald-200">
                  <span className="font-mono font-semibold">
                    {selectedDiagnosis.diagnosisCode}
                  </span>
                  <span>—</span>
                  <span>{selectedDiagnosis.diagnosisDescriptionEs}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDiagnosis(null)}
                    className="ml-1 rounded p-0.5 hover:bg-emerald-100"
                    aria-label="Quitar diagnóstico"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Observaciones clínicas
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Solo uso interno. No se envía a Recetario.
              </p>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={3}
                placeholder="Notas clínicas opcionales…"
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="mt-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha de la receta
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={dateDisplay}
                onChange={(e) => setDateDisplay(e.target.value)}
                placeholder="dd/MM/aaaa"
                className="mt-1 w-full max-w-xs rounded-xl border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Paciente VIH
                </span>
                <p className="text-xs text-gray-500">Mapea hiv=true en Recetario</p>
              </div>
              <input
                type="checkbox"
                role="switch"
                checked={hiv}
                onChange={(e) => setHiv(e.target.checked)}
                className="h-5 w-9 rounded-full accent-indigo-600"
              />
            </label>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-4">
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-gray-900">
                  Emitir recetas recurrentes
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={recurringEnabled}
                  onChange={(e) => setRecurringEnabled(e.target.checked)}
                  className="h-5 w-9 rounded-full accent-indigo-600"
                />
              </label>

              {recurringEnabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Frecuencia
                    </label>
                    <select
                      value={recurringDays}
                      onChange={(e) =>
                        setRecurringDays(
                          Number.parseInt(e.target.value, 10) as 30 | 60 | 90,
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
                    >
                      <option value={30}>30 días</option>
                      <option value={60}>60 días</option>
                      <option value={90}>90 días</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cantidad
                    </label>
                    <select
                      value={recurringQuantity}
                      onChange={(e) =>
                        setRecurringQuantity(
                          Number.parseInt(e.target.value, 10),
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <div className="mt-5 space-y-4 text-sm">
            <SummaryBlock title="Profesional">
              {selectedDoctor ? (
                <>
                  Dr/a. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  {selectedDoctor.licenseNumber && (
                    <> · Mat. {selectedDoctor.licenseNumber}</>
                  )}
                  {selectedDoctor.specialty && (
                    <> · {selectedDoctor.specialty}</>
                  )}
                </>
              ) : (
                '—'
              )}
            </SummaryBlock>

            <SummaryBlock title="Paciente">
              {selectedPatient ? (
                <>
                  {selectedPatient.firstName} {selectedPatient.lastName}
                  {selectedPatient.dni && <> · DNI {selectedPatient.dni}</>}
                  <br />
                  OS: {primaryInsurance?.healthInsurance.name ?? 'particular'}
                  {primaryInsurance && (
                    <> · Afiliado {primaryInsurance.affiliateNumber}</>
                  )}
                </>
              ) : (
                '—'
              )}
            </SummaryBlock>

            <SummaryBlock title="Diagnóstico">
              {selectedDiagnosis ? (
                <>
                  <span className="font-mono">
                    {selectedDiagnosis.diagnosisCode}
                  </span>{' '}
                  — {selectedDiagnosis.diagnosisDescriptionEs}
                </>
              ) : (
                '—'
              )}
              {clinicalNotes.trim() && (
                <p className="mt-1 text-gray-500 italic">
                  Obs.: {clinicalNotes.trim()}
                </p>
              )}
            </SummaryBlock>

            <SummaryBlock title="Medicamentos">
              <ul className="list-disc pl-5 space-y-1">
                {filledMedicines.map((m) => (
                  <li key={m.key}>
                    {m.selection!.brand} ({m.selection!.drug}) — {m.posology} ×{' '}
                    {m.quantity}
                  </li>
                ))}
              </ul>
            </SummaryBlock>

            <SummaryBlock title="Configuración">
              Fecha: {dateDisplay}
              {hiv && <> · Paciente VIH</>}
              {recurringEnabled && (
                <>
                  <br />
                  Recurrentes: cada {recurringDays} días × {recurringQuantity}
                </>
              )}
            </SummaryBlock>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </button>
        )}

        {step < 5 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Siguiente
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleEmit()}
            disabled={submitting || activeDoctors.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Emitiendo…
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                {isAssignedPhysician
                  ? 'Emitir receta'
                  : 'Enviar a aprobación'}
              </>
            )}
          </button>
        )}
      </div>

      {issuedPrescription && (
        <PrescriptionSuccessModal
          prescription={issuedPrescription}
          onClose={() => setIssuedPrescription(null)}
        />
      )}
    </div>
  );
}

function SummaryBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </p>
      <p className="mt-1 text-gray-900">{children}</p>
    </div>
  );
}
