'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Copy,
  ExternalLink,
  Loader2,
  Search,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  apiClient,
  type ClinicTeamMemberDto,
  type CreateMedicalOrderPayload,
  type MedicalOrderDto,
} from '@/lib/api';
import { isClinicRecetarioLinked } from '@/lib/recetario-patient-form';
import DiagnosisAutocomplete, {
  type DiagnosisSelection,
} from '@/components/prescriptions/DiagnosisAutocomplete';
import OrderRequestStep, {
  type LocalOrderRequestItem,
} from '@/components/orders/OrderRequestStep';

const PATIENT_SEARCH_DEBOUNCE_MS = 500;
const STEPS = [
  { id: 1, title: 'Doctor y paciente' },
  { id: 2, title: 'Solicitud' },
  { id: 3, title: 'Diagnóstico' },
  { id: 4, title: 'Fecha' },
  { id: 5, title: 'Confirmación' },
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

export type OrderWizardProps = {
  initialPatientId?: string;
  lockPatient?: boolean;
};

function todayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isoToDisplay(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function displayToIso(display: string): string | null {
  const m = display.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = String(Number.parseInt(m[1], 10)).padStart(2, '0');
  const month = String(Number.parseInt(m[2], 10)).padStart(2, '0');
  return `${m[3]}-${month}-${day}`;
}

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
        <h3 className="text-lg font-semibold text-gray-900">Orden emitida correctamente</h3>
        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="text-gray-500">ID Recetario</dt>
            <dd className="font-mono font-medium">{order.recetarioOrderId ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Fecha</dt>
            <dd>{order.orderDate}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          {order.pdfUrl && (
            <>
              <a href={order.pdfUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white">
                Ver PDF
              </a>
              <a href={order.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm">
                <ExternalLink className="h-4 w-4" /> Abrir en nueva pestaña
              </a>
              <button type="button" onClick={() => void copyLink()} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                Copiar enlace
              </button>
            </>
          )}
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm text-gray-600">
            Cerrar
          </button>
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

  const [patientTerm, setPatientTerm] = useState('');
  const debouncedPatientTerm = useDebouncedValue(patientTerm, PATIENT_SEARCH_DEBOUNCE_MS);
  const [patientHits, setPatientHits] = useState<PatientListItem[]>([]);
  const [patientOpen, setPatientOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [patientLoading, setPatientLoading] = useState(!!initialPatientId);
  const patientBoxRef = useRef<HTMLDivElement>(null);

  const [requestItems, setRequestItems] = useState<LocalOrderRequestItem[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisSelection | null>(null);
  const [dateDisplay, setDateDisplay] = useState(() => isoToDisplay(todayIsoDate()));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedOrder, setIssuedOrder] = useState<MedicalOrderDto | null>(null);

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

  const isAssignedPhysician = user?.isDoctor === true && user?.id === doctorId;
  const isStaffPreparer = user?.role === 'ADMIN' || user?.role === 'SECRETARY';

  const loadPatient = useCallback(async (id: string) => {
    setPatientLoading(true);
    try {
      setSelectedPatient((await apiClient.getPatientById(id)) as PatientDetail);
    } catch {
      setError('No se pudo cargar el paciente.');
    } finally {
      setPatientLoading(false);
    }
  }, []);

  useEffect(() => {
    apiClient.getTeamMembers().then((t) => setDoctors(Array.isArray(t) ? t : [])).finally(() => setDoctorsLoading(false));
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
    apiClient.getPatients({ q: debouncedPatientTerm.trim(), limit: 8 }).then((res) => {
      setPatientHits((res as { items?: PatientListItem[] }).items ?? []);
    });
  }, [debouncedPatientTerm, lockPatient]);

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!doctorId) return 'Seleccioná el profesional responsable.';
      if (!selectedPatient) return 'Seleccioná un paciente.';
    }
    if (s === 2 && requestItems.length === 0) {
      return 'Agregá al menos una solicitud.';
    }
    if (s === 3 && (!selectedDiagnosis?.diagnosisCode || !selectedDiagnosis.diagnosisDescriptionEs)) {
      return 'Seleccioná un diagnóstico CIE-10.';
    }
    if (s === 4 && !displayToIso(dateDisplay)) {
      return 'Ingresá una fecha válida (dd/MM/aaaa).';
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
    setStep((x) => Math.min(5, x + 1));
  };

  const buildPayload = (): CreateMedicalOrderPayload | null => {
    if (!doctorId || !selectedPatient || !selectedDiagnosis?.diagnosisCode || !selectedDiagnosis.diagnosisDescriptionEs) {
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
        Vinculá la clínica con Recetario antes de emitir órdenes médicas.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button type="button" onClick={() => router.push('/dashboard/orders')} className="inline-flex items-center gap-2 text-sm text-teal-600">
        <ArrowLeft className="h-4 w-4" /> Volver a órdenes
      </button>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><ClipboardList className="h-6 w-6" /></div>
          <div>
            <h1 className="text-xl font-semibold">Nueva orden médica</h1>
            <p className="text-sm text-gray-500">Paso {step} — {STEPS[step - 1].title}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {STEPS.map((s) => (
            <div key={s.id} className={`h-1.5 flex-1 rounded-full ${s.id <= step ? 'bg-teal-600' : 'bg-gray-100'}`} />
          ))}
        </div>

        {error && (
          <div className="mb-4 flex gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Profesional responsable</label>
              {doctorsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm">
                  <option value="">Seleccionar médico…</option>
                  {activeDoctors.map((d) => (
                    <option key={d.userId} value={d.userId}>Dr. {d.lastName}, {d.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div ref={patientBoxRef}>
              <label className="block text-sm font-medium mb-2">Paciente</label>
              {lockPatient && selectedPatient ? (
                <div className="rounded-xl border bg-gray-50 p-4 text-sm">
                  <p className="font-medium">{selectedPatient.lastName}, {selectedPatient.firstName}</p>
                  {selectedPatient.dni && <p>DNI {selectedPatient.dni}</p>}
                  {primaryInsurance && (
                    <p className="mt-1">{primaryInsurance.healthInsurance.name} · Afiliado {primaryInsurance.affiliateNumber}</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input value={patientTerm} onChange={(e) => { setPatientTerm(e.target.value); setPatientOpen(true); }} placeholder="Buscar paciente…" className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm" />
                  </div>
                  {patientOpen && patientHits.length > 0 && (
                    <ul className="mt-1 rounded-xl border bg-white shadow-lg">
                      {patientHits.map((p) => (
                        <li key={p.id}>
                          <button type="button" onClick={() => { setPatientOpen(false); setPatientTerm(''); void loadPatient(p.id); }} className="flex w-full gap-2 px-4 py-2.5 text-left text-sm hover:bg-gray-50">
                            <User className="h-4 w-4" /> {p.lastName}, {p.firstName}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              {patientLoading && <p className="mt-2 text-sm text-gray-500">Cargando…</p>}
            </div>
          </div>
        )}

        {step === 2 && <OrderRequestStep items={requestItems} onChange={setRequestItems} />}

        {step === 3 && (
          <div>
            <label className="block text-sm font-medium mb-2">Diagnóstico (CIE-10)</label>
            <DiagnosisAutocomplete value={selectedDiagnosis} onChange={setSelectedDiagnosis} />
            {selectedDiagnosis && (
              <div className="mt-3 inline-flex rounded-full bg-teal-100 px-3 py-1 text-sm text-teal-900">
                {selectedDiagnosis.diagnosisCode} — {selectedDiagnosis.diagnosisDescriptionEs}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <label className="block text-sm font-medium mb-2">Fecha de emisión</label>
            <input value={dateDisplay} onChange={(e) => setDateDisplay(e.target.value)} placeholder="dd/MM/aaaa" className="w-full max-w-xs rounded-xl border px-3 py-2.5 text-sm" />
          </div>
        )}

        {step === 5 && (
          <dl className="space-y-4 text-sm">
            <div><dt className="text-gray-500">Profesional</dt><dd className="font-medium">{selectedDoctor ? `Dr. ${selectedDoctor.lastName}, ${selectedDoctor.name}` : '—'}</dd></div>
            <div><dt className="text-gray-500">Paciente</dt><dd className="font-medium">{selectedPatient ? `${selectedPatient.lastName}, ${selectedPatient.firstName}` : '—'}</dd></div>
            <div><dt className="text-gray-500">Obra social</dt><dd>{primaryInsurance ? `${primaryInsurance.healthInsurance.name} (${primaryInsurance.affiliateNumber})` : 'Particular'}</dd></div>
            <div><dt className="text-gray-500">Diagnóstico</dt><dd>{selectedDiagnosis?.diagnosisCode} — {selectedDiagnosis?.diagnosisDescriptionEs}</dd></div>
            <div><dt className="text-gray-500">Solicitudes</dt><dd className="whitespace-pre-wrap">{requestItems.map((i) => i.description).join('\n')}</dd></div>
            <div><dt className="text-gray-500">Fecha</dt><dd>{displayToIso(dateDisplay)}</dd></div>
          </dl>
        )}

        <div className="mt-8 flex justify-between gap-3">
          <button type="button" onClick={step === 1 ? () => router.push('/dashboard/orders') : () => setStep((s) => s - 1)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm">
            <ArrowLeft className="h-4 w-4" /> {step === 1 ? 'Cancelar' : 'Anterior'}
          </button>
          {step < 5 ? (
            <button type="button" onClick={goNext} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white">
              Siguiente <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" disabled={submitting} onClick={() => void handleEmit()} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
              Emitir orden
            </button>
          )}
        </div>
      </div>

      {issuedOrder && (
        <OrderSuccessModal order={issuedOrder} onClose={() => router.push(`/dashboard/orders/${issuedOrder.id}`)} />
      )}
    </div>
  );
}
