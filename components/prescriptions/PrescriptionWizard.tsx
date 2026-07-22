'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, FileText, Share2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  apiClient,
  type ClinicTeamMemberDto,
  type CreatePrescriptionPayload,
  type PrescriptionDto,
  type SelectedMedication,
} from '@/lib/api';
import { isClinicRecetarioLinked } from '@/lib/recetario-patient-form';
import type { DiagnosisSelection } from '@/components/prescriptions/DiagnosisAutocomplete';
import CreatePatientModal from '@/components/dashboard/CreatePatientModal';
import WizardSummaryPanel from '@/components/ui/WizardSummaryPanel';
import Alert from '@/components/ui/Alert';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChanges';
import PrescriptionWizardStepper from './wizard/PrescriptionWizardStepper';
import PrescriptionWizardFooter from './wizard/PrescriptionWizardFooter';
import PrescriptionStepPatient from './wizard/PrescriptionStepPatient';
import PrescriptionStepMedicines from './wizard/PrescriptionStepMedicines';
import PrescriptionStepDiagnosis from './wizard/PrescriptionStepDiagnosis';
import PrescriptionStepConfig from './wizard/PrescriptionStepConfig';
import PrescriptionStepPreview from './wizard/PrescriptionStepPreview';
import {
  displayToIso,
  emptyMedicineLine,
  formatSavedAgo,
  isoToDisplay,
  pushRecentToStorage,
  readRecentFromStorage,
  todayIsoDate,
  type MedicineLine,
  type PatientDetail,
  type PatientListItem,
  type WizardDraft,
} from './wizard/helpers';

const MAX_MEDICINES = 3;
const PATIENT_SEARCH_DEBOUNCE_MS = 500;
const DRAFT_STORAGE_KEY = 'rx-wizard-draft-v1';
const RECENT_MEDS_KEY = 'rx-recent-medications';
const RECENT_DX_KEY = 'rx-recent-diagnoses';

const STEPS = [
  {
    id: 1,
    title: 'Paciente',
    subtitle: 'Profesional y paciente de la receta',
  },
  {
    id: 2,
    title: 'Medicamentos',
    subtitle: 'Vademécum Recetario',
  },
  {
    id: 3,
    title: 'Diagnóstico',
    subtitle: 'CIE-10 y observaciones',
  },
  {
    id: 4,
    title: 'Configuración',
    subtitle: 'Fecha, validez y opciones',
  },
  {
    id: 5,
    title: 'Confirmación',
    subtitle: 'Vista previa antes de emitir',
  },
] as const;

export type PrescriptionWizardProps = {
  initialPatientId?: string;
  lockPatient?: boolean;
};

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
  const router = useRouter();
  const { clinic, user } = useAuth();
  const recetarioLinked = isClinicRecetarioLinked(clinic?.recetarioHealthCenterId);

  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<ClinicTeamMemberDto[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorId, setDoctorId] = useState('');
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);

  const [patientTerm, setPatientTerm] = useState('');
  const debouncedPatientTerm = useDebouncedValue(patientTerm, PATIENT_SEARCH_DEBOUNCE_MS);
  const [patientHits, setPatientHits] = useState<PatientListItem[]>([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [patientLoading, setPatientLoading] = useState(!!initialPatientId);
  const [createPatientOpen, setCreatePatientOpen] = useState(false);

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
  const [stepError, setStepError] = useState<string | null>(null);
  const [issuedPrescription, setIssuedPrescription] =
    useState<PrescriptionDto | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [recentMedications, setRecentMedications] = useState<SelectedMedication[]>([]);
  const [recentDiagnoses, setRecentDiagnoses] = useState<DiagnosisSelection[]>([]);
  const [draftLoaded, setDraftLoaded] = useState(false);

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

  const primaryInsuranceName = primaryInsurance?.healthInsurance.name ?? null;

  const filledMedicines = useMemo(
    () => medicines.filter((m) => m.selection && m.posology.trim()),
    [medicines],
  );

  const selectedMedicines = useMemo(
    () => medicines.filter((m) => m.selection),
    [medicines],
  );

  useUnsavedChangesGuard(
    (!!doctorId || !!selectedPatient || filledMedicines.length > 0 || !!selectedDiagnosis) &&
      !issuedPrescription,
  );

  const summaryItems = useMemo(
    () => [
      {
        id: 'doctor',
        label: 'Médico',
        value: selectedDoctor
          ? `Dr/a. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`
          : null,
        complete: !!selectedDoctor,
      },
      {
        id: 'patient',
        label: 'Paciente',
        value: selectedPatient
          ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
          : null,
        complete: !!selectedPatient,
      },
      {
        id: 'medicines',
        label: 'Medicamentos',
        value:
          filledMedicines.length > 0
            ? filledMedicines
                .map(
                  (m) =>
                    `${m.selection!.brand} — ${m.posology} (x${m.quantity})`,
                )
                .join('\n')
            : null,
        complete: filledMedicines.length > 0,
        multiline: true,
      },
      {
        id: 'diagnosis',
        label: 'Diagnóstico',
        value: selectedDiagnosis
          ? `${selectedDiagnosis.diagnosisCode} — ${selectedDiagnosis.diagnosisDescriptionEs}`
          : null,
        complete: !!selectedDiagnosis?.diagnosisCode,
      },
      {
        id: 'date',
        label: 'Fecha',
        value: dateIso,
        complete: !!dateIso,
      },
    ],
    [
      selectedDoctor,
      selectedPatient,
      filledMedicines,
      selectedDiagnosis,
      dateIso,
    ],
  );

  const draftSnapshot = useMemo(
    () => ({
      doctorId,
      selectedPatientId: selectedPatient?.id ?? null,
      medicines,
      selectedDiagnosis,
      clinicalNotes,
      dateDisplay,
      hiv,
      recurringEnabled,
      recurringDays,
      recurringQuantity,
    }),
    [
      doctorId,
      selectedPatient,
      medicines,
      selectedDiagnosis,
      clinicalNotes,
      dateDisplay,
      hiv,
      recurringEnabled,
      recurringDays,
      recurringQuantity,
    ],
  );

  const savedLabel = formatSavedAgo(lastSavedAt);

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

  const applyDraft = useCallback(
    (draft: WizardDraft) => {
      if (draft.doctorId) setDoctorId(draft.doctorId);
      if (draft.medicines?.length) setMedicines(draft.medicines);
      if (draft.selectedDiagnosis) setSelectedDiagnosis(draft.selectedDiagnosis);
      if (typeof draft.clinicalNotes === 'string') setClinicalNotes(draft.clinicalNotes);
      if (draft.dateDisplay) setDateDisplay(draft.dateDisplay);
      setHiv(!!draft.hiv);
      setRecurringEnabled(!!draft.recurringEnabled);
      if (draft.recurringDays) setRecurringDays(draft.recurringDays);
      if (draft.recurringQuantity) setRecurringQuantity(draft.recurringQuantity);
      if (draft.savedAt) setLastSavedAt(draft.savedAt);
      const iso = displayToIso(draft.dateDisplay);
      if (iso) setDateIso(iso);
    },
    [],
  );

  const saveDraftNow = useCallback(() => {
    if (typeof window === 'undefined' || issuedPrescription) return;
    const draft: WizardDraft = {
      ...draftSnapshot,
      savedAt: Date.now(),
    };
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setLastSavedAt(draft.savedAt);
    } catch {
      /* ignore quota */
    }
  }, [draftSnapshot, issuedPrescription]);

  useEffect(() => {
    setRecentMedications(readRecentFromStorage<SelectedMedication>(RECENT_MEDS_KEY));
    setRecentDiagnoses(readRecentFromStorage<DiagnosisSelection>(RECENT_DX_KEY));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || draftLoaded) return;
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as WizardDraft;
        applyDraft(draft);
        if (draft.selectedPatientId && !initialPatientId) {
          void loadPatient(draft.selectedPatientId);
        }
      }
    } catch {
      /* ignore corrupt draft */
    } finally {
      setDraftLoaded(true);
    }
  }, [applyDraft, draftLoaded, initialPatientId, loadPatient]);

  useEffect(() => {
    if (!draftLoaded || issuedPrescription) return;
    const timer = window.setTimeout(() => {
      saveDraftNow();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [draftLoaded, draftSnapshot, issuedPrescription, saveDraftNow]);

  useEffect(() => {
    setStepError(null);
  }, [
    doctorId,
    selectedPatient,
    medicines,
    selectedDiagnosis,
    clinicalNotes,
    dateDisplay,
    hiv,
    recurringEnabled,
    recurringDays,
    recurringQuantity,
  ]);

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

  const duplicateMedicine = (key: string) => {
    if (medicines.length >= MAX_MEDICINES) return;
    const source = medicines.find((m) => m.key === key);
    if (!source) return;
    setMedicines((prev) => [...prev, { ...source, key: crypto.randomUUID() }]);
  };

  const reorderMedicines = (fromIndex: number, toIndex: number) => {
    setMedicines((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const onQuickAddRecent = (selection: SelectedMedication) => {
    if (medicines.length >= MAX_MEDICINES) return;
    const emptyLine = medicines.find((m) => !m.selection);
    if (emptyLine) {
      updateMedicine(emptyLine.key, {
        selection,
        requiresDuplicate: selection.requiresDuplicate ?? false,
      });
      return;
    }
    setMedicines((prev) => [
      ...prev,
      {
        ...emptyMedicineLine(),
        selection,
        requiresDuplicate: selection.requiresDuplicate ?? false,
      },
    ]);
  };

  const validateStep = (currentStep: number): string | null => {
    if (currentStep === 1) {
      if (!doctorId) return 'Seleccioná el profesional responsable.';
      if (!selectedPatient) return 'Seleccioná un paciente.';
    }
    if (currentStep === 2) {
      if (selectedMedicines.length === 0) return 'Agregá al menos un medicamento.';
      if (selectedMedicines.some((m) => !m.posology.trim())) {
        return 'Completá la posología de cada medicamento.';
      }
      if (
        selectedMedicines.some((m) => m.genericOnly && m.brandRecommendation)
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

  const goToStep = (targetStep: number) => {
    if (targetStep < step) {
      setStepError(null);
      setError(null);
      setStep(targetStep);
    }
  };

  const goNext = () => {
    setError(null);
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);

    if (step === 2) {
      selectedMedicines.forEach((m) => {
        if (m.selection) {
          pushRecentToStorage(RECENT_MEDS_KEY, m.selection);
        }
      });
      setRecentMedications(readRecentFromStorage<SelectedMedication>(RECENT_MEDS_KEY));
    }

    if (step === 3 && selectedDiagnosis) {
      pushRecentToStorage(RECENT_DX_KEY, selectedDiagnosis);
      setRecentDiagnoses(readRecentFromStorage<DiagnosisSelection>(RECENT_DX_KEY));
    }

    if (step === 4) {
      const iso = displayToIso(dateDisplay);
      if (iso) setDateIso(iso);
    }

    setStep((s) => Math.min(5, s + 1));
  };

  const goBack = () => {
    setError(null);
    setStepError(null);
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
        setStepError(err);
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
        try {
          window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {
          /* ignore */
        }
        setLastSavedAt(null);
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

  const handleCancel = () => {
    router.push('/dashboard/prescriptions');
  };

  const handleCreatePatientSuccess = (patientId: string) => {
    setCreatePatientOpen(false);
    void loadPatient(patientId);
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

  return (
    <div className="wizard-mobile-shell mx-auto w-full max-w-5xl space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nueva receta</h1>
        <p className="mt-1 text-sm text-gray-600">
          Prescripción electrónica vía vademécum Recetario
        </p>
      </div>

      <PrescriptionWizardStepper
        steps={STEPS}
        currentStep={step}
        onStepClick={goToStep}
      />

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        {step === 1 && (
          <PrescriptionStepPatient
            doctorsLoading={doctorsLoading}
            activeDoctors={activeDoctors}
            selectedDoctor={selectedDoctor}
            doctorId={doctorId}
            showDoctorPicker={showDoctorPicker}
            onToggleDoctorPicker={() => setShowDoctorPicker((open) => !open)}
            onDoctorChange={setDoctorId}
            patientLoading={patientLoading}
            selectedPatient={selectedPatient}
            lockPatient={lockPatient}
            onClearPatient={() => setSelectedPatient(null)}
            patientTerm={patientTerm}
            onPatientTermChange={setPatientTerm}
            patientOpen={patientOpen}
            onPatientOpenChange={setPatientOpen}
            patientSearchLoading={patientSearchLoading}
            patientHits={patientHits}
            onSelectPatient={(hit) => void selectPatient(hit)}
            onCreatePatient={() => setCreatePatientOpen(true)}
            primaryInsuranceName={primaryInsuranceName}
            stepError={stepError}
          />
        )}

        {step === 2 && (
          <PrescriptionStepMedicines
            medicines={medicines}
            maxMedicines={MAX_MEDICINES}
            recentMedications={recentMedications}
            onUpdate={updateMedicine}
            onAdd={addMedicineLine}
            onRemove={removeMedicineLine}
            onDuplicate={duplicateMedicine}
            onReorder={reorderMedicines}
            onQuickAddRecent={onQuickAddRecent}
            stepError={stepError}
          />
        )}

        {step === 3 && (
          <PrescriptionStepDiagnosis
            selectedDiagnosis={selectedDiagnosis}
            onDiagnosisChange={setSelectedDiagnosis}
            clinicalNotes={clinicalNotes}
            onClinicalNotesChange={setClinicalNotes}
            recentDiagnoses={recentDiagnoses}
            stepError={stepError}
          />
        )}

        {step === 4 && (
          <PrescriptionStepConfig
            dateDisplay={dateDisplay}
            onDateDisplayChange={setDateDisplay}
            hiv={hiv}
            onHivChange={setHiv}
            recurringEnabled={recurringEnabled}
            onRecurringEnabledChange={setRecurringEnabled}
            recurringDays={recurringDays}
            onRecurringDaysChange={setRecurringDays}
            recurringQuantity={recurringQuantity}
            onRecurringQuantityChange={setRecurringQuantity}
            stepError={stepError}
          />
        )}

        {step === 5 && (
          <PrescriptionStepPreview
            clinicName={clinic?.name}
            clinicLogoUrl={clinic?.prescriptionLogoUrl}
            selectedDoctor={selectedDoctor}
            selectedPatient={selectedPatient}
            primaryInsuranceName={primaryInsuranceName}
            selectedDiagnosis={selectedDiagnosis}
            clinicalNotes={clinicalNotes}
            filledMedicines={filledMedicines}
            dateDisplay={dateDisplay}
            hiv={hiv}
            recurringEnabled={recurringEnabled}
            recurringDays={recurringDays}
            recurringQuantity={recurringQuantity}
          />
        )}
      </div>

      {step >= 3 && (
        <>
          <div className="hidden justify-end lg:flex">
            <button
              type="button"
              onClick={() => setSummaryOpen((open) => !open)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {summaryOpen ? 'Ocultar resumen' : 'Ver resumen en curso'}
            </button>
          </div>
          <div className={summaryOpen ? 'lg:block' : 'lg:hidden'}>
            <WizardSummaryPanel
              items={summaryItems}
              accent="indigo"
              currentStep={step}
              totalSteps={STEPS.length}
            />
          </div>
        </>
      )}

      <PrescriptionWizardFooter
        step={step}
        totalSteps={STEPS.length}
        submitting={submitting}
        canEmit={activeDoctors.length > 0}
        emitLabel={
          isAssignedPhysician ? 'Emitir receta' : 'Enviar a aprobación'
        }
        savedLabel={savedLabel}
        onBack={goBack}
        onNext={goNext}
        onEmit={() => void handleEmit()}
        onSaveDraft={saveDraftNow}
        onCancel={handleCancel}
      />

      <CreatePatientModal
        open={createPatientOpen}
        onClose={() => setCreatePatientOpen(false)}
        onSuccess={handleCreatePatientSuccess}
        navigateAfterCreate={false}
      />

      {issuedPrescription && (
        <PrescriptionSuccessModal
          prescription={issuedPrescription}
          onClose={() => setIssuedPrescription(null)}
        />
      )}
    </div>
  );
}
