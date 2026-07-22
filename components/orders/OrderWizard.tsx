'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, ExternalLink, FileText, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  apiClient,
  type ClinicTeamMemberDto,
  type CreateMedicalOrderPayload,
  type MedicalOrderDto,
} from '@/lib/api';
import { isClinicRecetarioLinked } from '@/lib/recetario-patient-form';
import type { DiagnosisSelection } from '@/components/prescriptions/DiagnosisAutocomplete';
import type { LocalOrderRequestItem } from '@/components/orders/OrderRequestStep';
import Alert from '@/components/ui/Alert';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChanges';
import OrderWizardStepper from '@/components/orders/wizard/OrderWizardStepper';
import OrderWizardFooter from '@/components/orders/wizard/OrderWizardFooter';
import OrderStepPatient from '@/components/orders/wizard/OrderStepPatient';
import OrderStepRequests from '@/components/orders/wizard/OrderStepRequests';
import OrderStepDiagnosis from '@/components/orders/wizard/OrderStepDiagnosis';
import OrderStepConfig from '@/components/orders/wizard/OrderStepConfig';
import OrderStepPreview from '@/components/orders/wizard/OrderStepPreview';
import OrderSummarySidebar, {
  type OrderSummaryCheck,
} from '@/components/orders/wizard/OrderSummarySidebar';
import {
  displayToIso,
  formatSavedAgo,
  isoToDisplay,
  newRequestKey,
  pushRecentToStorage,
  readRecentFromStorage,
  todayIsoDate,
  type OrderPatientDetail,
  type OrderWizardDraft,
  type PatientListItem,
} from '@/components/orders/wizard/helpers';

const PATIENT_SEARCH_DEBOUNCE_MS = 500;
const DRAFT_STORAGE_KEY = 'order-wizard-draft-v1';
const RECENT_DX_KEY = 'order-recent-diagnoses';

const STEPS = [
  {
    id: 1,
    title: 'Médico y paciente',
    subtitle: 'Profesional responsable y paciente de la orden',
  },
  {
    id: 2,
    title: 'Solicitudes',
    subtitle: 'Estudios, laboratorio e interconsultas',
  },
  {
    id: 3,
    title: 'Diagnóstico',
    subtitle: 'CIE-10 que justifica la orden',
  },
  {
    id: 4,
    title: 'Configuración',
    subtitle: 'Fecha y opciones administrativas',
  },
  {
    id: 5,
    title: 'Confirmación',
    subtitle: 'Revisá todo antes de emitir',
  },
] as const;

export type OrderWizardProps = {
  initialPatientId?: string;
  lockPatient?: boolean;
};

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function OrderSuccessModal({
  order,
  onClose,
}: {
  order: MedicalOrderDto;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    if (!order.pdfUrl) return;
    await navigator.clipboard.writeText(order.pdfUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Orden emitida correctamente</h3>
            <p className="mt-1 text-sm text-gray-600">La orden fue generada en Recetario.</p>
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
            <dt className="text-gray-500">ID Recetario</dt>
            <dd className="font-mono font-medium text-gray-900">
              {order.recetarioOrderId ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Fecha</dt>
            <dd className="text-gray-900">{order.orderDate}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          {order.pdfUrl && (
            <>
              <a
                href={order.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
              >
                <FileText className="h-4 w-4" />
                Ver PDF
              </a>
              <a
                href={order.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir en nueva pestaña
              </a>
              <button
                type="button"
                onClick={() => void copyLink()}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copiar enlace
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderWizard({
  initialPatientId,
  lockPatient = false,
}: OrderWizardProps) {
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
  const [selectedPatient, setSelectedPatient] = useState<OrderPatientDetail | null>(null);
  const [patientLoading, setPatientLoading] = useState(!!initialPatientId);
  const [createPatientOpen, setCreatePatientOpen] = useState(false);

  const [requestItems, setRequestItems] = useState<LocalOrderRequestItem[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisSelection | null>(null);
  const [dateDisplay, setDateDisplay] = useState(() => isoToDisplay(todayIsoDate()));
  const [recentDiagnoses, setRecentDiagnoses] = useState<DiagnosisSelection[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [issuedOrder, setIssuedOrder] = useState<MedicalOrderDto | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const activeDoctors = useMemo(
    () => doctors.filter((d) => d.isDoctor && d.isActive),
    [doctors],
  );
  const selectedDoctor = useMemo(
    () => activeDoctors.find((d) => d.userId === doctorId) ?? null,
    [activeDoctors, doctorId],
  );
  const primaryInsurance = useMemo(() => {
    if (!selectedPatient?.insurances?.length) return null;
    return selectedPatient.insurances.find((i) => i.isPrimary && i.isActive) ?? null;
  }, [selectedPatient]);
  const primaryInsuranceName = primaryInsurance?.healthInsurance.name ?? null;
  const affiliateNumber = primaryInsurance?.affiliateNumber ?? null;
  const dateValid = !!displayToIso(dateDisplay);

  const isAssignedPhysician = user?.isDoctor === true && user?.id === doctorId;
  const isStaffPreparer = user?.role === 'ADMIN' || user?.role === 'SECRETARY';

  const hasDraft =
    !!doctorId ||
    !!selectedPatient ||
    requestItems.length > 0 ||
    !!selectedDiagnosis ||
    dateDisplay !== isoToDisplay(todayIsoDate());

  useUnsavedChangesGuard(hasDraft && !issuedOrder);

  const completionChecks = useMemo((): OrderSummaryCheck[] => {
    const doctorValid =
      !!selectedDoctor &&
      (!isAssignedPhysician ||
        (selectedDoctor.recetarioUserId != null && selectedDoctor.recetarioActive !== false));

    return [
      {
        id: 'patient',
        label: 'Paciente seleccionado',
        complete: !!selectedPatient,
        warning: 'Seleccioná un paciente para continuar.',
      },
      {
        id: 'doctor',
        label: 'Médico válido',
        complete: doctorValid,
        warning:
          isAssignedPhysician && !doctorValid
            ? 'Debés estar activo en Recetario para emitir.'
            : 'Seleccioná el profesional responsable.',
      },
      {
        id: 'requests',
        label: 'Solicitudes cargadas',
        complete: requestItems.length > 0,
        warning: 'Agregá al menos una solicitud.',
      },
      {
        id: 'diagnosis',
        label: 'Diagnóstico CIE-10',
        complete: !!selectedDiagnosis?.diagnosisCode,
        warning: 'Seleccioná un diagnóstico.',
      },
      {
        id: 'date',
        label: 'Fecha válida',
        complete: dateValid,
        warning: 'Ingresá una fecha válida (dd/MM/aaaa).',
      },
    ];
  }, [
    selectedPatient,
    selectedDoctor,
    isAssignedPhysician,
    requestItems.length,
    selectedDiagnosis,
    dateValid,
  ]);

  const canEmit = completionChecks.every((c) => c.complete);
  const pendingCount = completionChecks.filter((c) => !c.complete).length;
  const savedLabel = formatSavedAgo(lastSavedAt);

  const draftSnapshot = useMemo(
    () => ({
      doctorId,
      selectedPatientId: selectedPatient?.id ?? null,
      requestItems,
      selectedDiagnosis,
      dateDisplay,
    }),
    [doctorId, selectedPatient, requestItems, selectedDiagnosis, dateDisplay],
  );

  const loadPatient = useCallback(async (id: string) => {
    setPatientLoading(true);
    setError(null);
    try {
      setSelectedPatient((await apiClient.getPatientById(id)) as OrderPatientDetail);
    } catch {
      setError('No se pudo cargar el paciente.');
    } finally {
      setPatientLoading(false);
    }
  }, []);

  const applyDraft = useCallback((draft: OrderWizardDraft) => {
    if (draft.doctorId) setDoctorId(draft.doctorId);
    if (draft.requestItems?.length) setRequestItems(draft.requestItems);
    if (draft.selectedDiagnosis) setSelectedDiagnosis(draft.selectedDiagnosis);
    if (draft.dateDisplay) setDateDisplay(draft.dateDisplay);
    if (draft.savedAt) setLastSavedAt(draft.savedAt);
  }, []);

  const saveDraftNow = useCallback(() => {
    if (typeof window === 'undefined' || issuedOrder) return;
    const draft: OrderWizardDraft = { ...draftSnapshot, savedAt: Date.now() };
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setLastSavedAt(draft.savedAt);
    } catch {
      /* ignore quota */
    }
  }, [draftSnapshot, issuedOrder]);

  useEffect(() => {
    setRecentDiagnoses(readRecentFromStorage<DiagnosisSelection>(RECENT_DX_KEY));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || draftLoaded) return;
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as OrderWizardDraft;
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
    if (!draftLoaded || issuedOrder) return;
    const timer = window.setTimeout(() => saveDraftNow(), 800);
    return () => window.clearTimeout(timer);
  }, [draftLoaded, draftSnapshot, issuedOrder, saveDraftNow]);

  useEffect(() => {
    setStepError(null);
  }, [doctorId, selectedPatient, requestItems, selectedDiagnosis, dateDisplay]);

  useEffect(() => {
    apiClient
      .getTeamMembers()
      .then((t) => setDoctors(Array.isArray(t) ? t : []))
      .catch(() => setError('No se pudo cargar el equipo médico.'))
      .finally(() => setDoctorsLoading(false));
  }, []);

  useEffect(() => {
    if (user?.isDoctor && user.id) {
      const self = activeDoctors.find((d) => d.userId === user.id);
      if (self) setDoctorId(self.userId);
    } else if (activeDoctors.length === 1) {
      setDoctorId(activeDoctors[0].userId);
    }
  }, [activeDoctors, user]);

  useEffect(() => {
    if (initialPatientId) void loadPatient(initialPatientId);
  }, [initialPatientId, loadPatient]);

  useEffect(() => {
    if (!debouncedPatientTerm.trim() || lockPatient) {
      setPatientHits([]);
      return;
    }
    setPatientSearchLoading(true);
    apiClient
      .getPatients({ q: debouncedPatientTerm.trim(), limit: 8 })
      .then((res) => setPatientHits((res as { items?: PatientListItem[] }).items ?? []))
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

  const duplicateRequest = (key: string) => {
    const source = requestItems.find((i) => i.key === key);
    if (!source) return;
    setRequestItems((prev) => [...prev, { ...source, key: newRequestKey() }]);
  };

  const reorderRequests = (fromIndex: number, toIndex: number) => {
    setRequestItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!doctorId) return 'Seleccioná el profesional responsable.';
      if (!selectedPatient) return 'Seleccioná un paciente.';
    }
    if (s === 2 && requestItems.length === 0) {
      return 'Agregá al menos una solicitud.';
    }
    if (
      s === 3 &&
      (!selectedDiagnosis?.diagnosisCode || !selectedDiagnosis.diagnosisDescriptionEs)
    ) {
      return 'Seleccioná un diagnóstico CIE-10.';
    }
    if (s === 4 && !displayToIso(dateDisplay)) {
      return 'Ingresá una fecha válida (dd/MM/aaaa).';
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

    if (step === 3 && selectedDiagnosis) {
      pushRecentToStorage(RECENT_DX_KEY, selectedDiagnosis);
      setRecentDiagnoses(readRecentFromStorage<DiagnosisSelection>(RECENT_DX_KEY));
    }

    setStep((x) => Math.min(5, x + 1));
  };

  const goBack = () => {
    setError(null);
    setStepError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const buildPayload = (): CreateMedicalOrderPayload | null => {
    if (
      !doctorId ||
      !selectedPatient ||
      !selectedDiagnosis?.diagnosisCode ||
      !selectedDiagnosis.diagnosisDescriptionEs
    ) {
      return null;
    }
    const iso = displayToIso(dateDisplay);
    if (!iso) return null;
    return {
      doctorId,
      patientId: selectedPatient.id,
      diagnosisCode: selectedDiagnosis.diagnosisCode,
      diagnosisDescription: selectedDiagnosis.diagnosisDescriptionEs,
      date: iso,
      requestItems: requestItems.map((i) => ({
        description: i.description,
        category: i.category,
      })),
    };
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

    const payload = buildPayload();
    if (!payload) {
      setError('Completá todos los campos obligatorios.');
      return;
    }

    setSubmitting(true);
    try {
      let current = await apiClient.createMedicalOrder(payload);
      current = await apiClient.submitMedicalOrder(current.id);

      if (isAssignedPhysician) {
        if (current.status === 'PENDING_APPROVAL') {
          current = await apiClient.approveMedicalOrder(current.id);
        }
        if (current.status === 'APPROVED') {
          current = await apiClient.issueMedicalOrder(current.id);
        }
      }

      if (current.status === 'EMITTED' || current.status === 'ISSUED') {
        setIssuedOrder(current);
        try {
          window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {
          /* ignore */
        }
        setLastSavedAt(null);
      } else if (current.status === 'PENDING_APPROVAL') {
        setError(
          isStaffPreparer
            ? 'Orden enviada a aprobación del médico asignado.'
            : 'Orden enviada a aprobación.',
        );
        router.push(`/dashboard/orders/pending/${current.id}`);
      } else {
        setError('No se pudo completar la emisión.');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al emitir la orden.';
      setError(typeof msg === 'string' ? msg : 'Error al emitir la orden.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!recetarioLinked) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-medium">Recetario no vinculado</p>
        <p className="mt-1 text-sm">
          Vinculá la clínica con Recetario desde Integraciones antes de emitir órdenes médicas.
        </p>
      </div>
    );
  }

  return (
    <div className="wizard-mobile-shell mx-auto w-full max-w-[1400px] space-y-4 pb-28 lg:space-y-6 lg:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nueva orden médica</h1>
        <p className="mt-1 text-sm text-gray-600">
          Solicitudes de estudios e interconsultas vía Recetario
        </p>
      </div>

      <OrderWizardStepper steps={STEPS} currentStep={step} onStepClick={goToStep} />

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          {step === 1 && (
            <OrderStepPatient
              doctorsLoading={doctorsLoading}
              activeDoctors={activeDoctors}
              selectedDoctor={selectedDoctor}
              doctorId={doctorId}
              showDoctorPicker={showDoctorPicker}
              onToggleDoctorPicker={() => setShowDoctorPicker((open) => !open)}
              onDoctorChange={setDoctorId}
              clinicName={clinic?.name}
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
              createPatientOpen={createPatientOpen}
              onCreatePatientOpenChange={setCreatePatientOpen}
              onCreatePatientSuccess={(id) => {
                setCreatePatientOpen(false);
                void loadPatient(id);
              }}
              primaryInsuranceName={primaryInsuranceName}
              affiliateNumber={affiliateNumber}
              stepError={stepError}
            />
          )}

          {step === 2 && (
            <OrderStepRequests
              items={requestItems}
              onChange={setRequestItems}
              onDuplicate={duplicateRequest}
              onReorder={reorderRequests}
              stepError={stepError}
            />
          )}

          {step === 3 && (
            <OrderStepDiagnosis
              selectedDiagnosis={selectedDiagnosis}
              onDiagnosisChange={setSelectedDiagnosis}
              recentDiagnoses={recentDiagnoses}
              stepError={stepError}
            />
          )}

          {step === 4 && (
            <OrderStepConfig
              dateDisplay={dateDisplay}
              onDateDisplayChange={setDateDisplay}
              stepError={stepError}
            />
          )}

          {step === 5 && (
            <OrderStepPreview
              clinicName={clinic?.name}
              selectedDoctor={selectedDoctor}
              selectedPatient={selectedPatient}
              primaryInsuranceName={primaryInsuranceName}
              affiliateNumber={affiliateNumber}
              requestItems={requestItems}
              selectedDiagnosis={selectedDiagnosis}
              dateDisplay={dateDisplay}
              checks={completionChecks}
              canEmit={canEmit}
            />
          )}
        </div>

        <OrderSummarySidebar
          currentStep={step}
          totalSteps={STEPS.length}
          selectedDoctor={selectedDoctor}
          selectedPatient={selectedPatient}
          primaryInsuranceName={primaryInsuranceName}
          affiliateNumber={affiliateNumber}
          requestItems={requestItems}
          selectedDiagnosis={selectedDiagnosis}
          dateDisplay={dateDisplay}
          dateValid={dateValid}
          checks={completionChecks}
          pendingCount={pendingCount}
        />
      </div>

      <OrderWizardFooter
        step={step}
        totalSteps={STEPS.length}
        submitting={submitting}
        emitLabel="Emitir orden"
        savedLabel={savedLabel}
        onBack={goBack}
        onNext={goNext}
        onEmit={() => void handleEmit()}
        onSaveDraft={saveDraftNow}
        onCancel={() => router.push('/dashboard/orders')}
        canEmit={canEmit}
      />

      {issuedOrder && (
        <OrderSuccessModal
          order={issuedOrder}
          onClose={() => router.push(`/dashboard/orders/${issuedOrder.id}`)}
        />
      )}
    </div>
  );
}
