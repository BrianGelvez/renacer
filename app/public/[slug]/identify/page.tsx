'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Loader2,
  AlertCircle,
  ArrowRight,
  UserPlus,
  LogIn,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

type TabId = 'identify' | 'new';
const STEPS = [
  { id: 1, title: 'Datos personales' },
  { id: 2, title: 'Contacto y dirección' },
  { id: 3, title: 'Obra social' },
  { id: 4, title: 'Otros datos' },
] as const;

export default function IdentifyPatientPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string | undefined;
  const [activeTab, setActiveTab] = useState<TabId>('identify');
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState(1);
  const [fullForm, setFullForm] = useState({
    firstName: '',
    lastName: '',
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinicInfo, setClinicInfo] = useState<{
    name: string;
    address?: string | null;
    healthInsurances?: Array<{ id: string; name: string; code?: string | null }>;
  } | null>(null);

  useEffect(() => {
    if (!slug) return;
    apiClient
      .getPublicClinicInfo(slug)
      .then((data) => setClinicInfo(data))
      .catch(() => {
        setError('Clínica no encontrada.');
      });
  }, [slug]);

  const handleIdentifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = identifier.trim();
    if (!value) {
      setError('Ingresá tu DNI, teléfono o email para identificarte.');
      return;
    }
    if (!slug) return;
    const isEmail = value.includes('@');
    const payload: Parameters<typeof apiClient.identifyPatientPublic>[0] = {
      clinicSlug: slug,
      ...(isEmail ? { email: value } : { dni: value, phone: value }),
    };
    setSubmitting(true);
    try {
      const result = await apiClient.identifyPatientPublic(payload);
      sessionStorage.setItem('publicPatientId', result.patientId);
      sessionStorage.setItem('publicClinicId', result.clinicId);
      sessionStorage.setItem('publicClinicSlug', slug);
      if (result.patient) {
        sessionStorage.setItem('publicPatientData', JSON.stringify(result.patient));
      }
      sessionStorage.setItem('publicPatientIsNew', 'false');
      router.push(`/public/${slug}/agenda`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al identificar.';
      setError(
        msg.includes('No encontramos')
          ? 'No te encontramos con esos datos. Completá el formulario "Nuevo paciente" para registrarte.'
          : msg,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    setError(null);
    if (step === 1 && (!fullForm.firstName.trim() || !fullForm.lastName.trim())) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }
    if (step === 3 && fullForm.healthInsuranceId && !fullForm.affiliateNumber.trim()) {
      setError('El número de afiliado es obligatorio cuando elegís obra social.');
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const goBack = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const handleFullFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullForm.firstName.trim() || !fullForm.lastName.trim()) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }
    if (fullForm.healthInsuranceId && !fullForm.affiliateNumber.trim()) {
      setError('El número de afiliado es obligatorio cuando elegís obra social.');
      return;
    }
    if (!slug) return;
    setSubmitting(true);
    try {
      const result = await apiClient.identifyPatientPublic({
        clinicSlug: slug,
        firstName: fullForm.firstName.trim(),
        lastName: fullForm.lastName.trim(),
        dni: fullForm.dni.trim() || undefined,
        phone: fullForm.phone.trim() || undefined,
        email: fullForm.email.trim() || undefined,
        birthDate: fullForm.birthDate || undefined,
        gender: fullForm.gender || undefined,
        address: fullForm.address.trim() || undefined,
        city: fullForm.city.trim() || undefined,
        province: fullForm.province.trim() || undefined,
        department: fullForm.department.trim() || undefined,
        emergencyContactName: fullForm.emergencyContactName.trim() || undefined,
        emergencyContactPhone: fullForm.emergencyContactPhone.trim() || undefined,
        notes: fullForm.notes.trim() || undefined,
        healthInsuranceId: fullForm.healthInsuranceId || undefined,
        affiliateNumber: fullForm.affiliateNumber.trim() || undefined,
      });
      sessionStorage.setItem('publicPatientId', result.patientId);
      sessionStorage.setItem('publicClinicId', result.clinicId);
      sessionStorage.setItem('publicClinicSlug', slug);
      if (result.patient) {
        sessionStorage.setItem('publicPatientData', JSON.stringify(result.patient));
      }
      sessionStorage.setItem('publicPatientIsNew', result.isNewPatient ? 'true' : 'false');
      router.push(`/public/${slug}/agenda`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Error al registrarte.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key: keyof typeof fullForm, value: string) => {
    setFullForm((f) => ({ ...f, [key]: value }));
  };

  useEffect(() => {
    if (activeTab === 'new') setStep(1);
  }, [activeTab]);

  if (!slug) return null;

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-[rgba(209,106,138,0.2)] focus:border-ensigna-primary min-h-[44px]';
  const healthInsurances = clinicInfo?.healthInsurances ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ensigna-soft/50 via-[var(--ensigna-background)] to-ensigna-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="ensigna-modal-panel overflow-hidden rounded-[var(--ensigna-radius-lg)]">
          <div className="p-6 sm:p-8 pb-4">
            <div className="w-16 h-16 rounded-2xl gradient-red flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {clinicInfo?.name ?? 'Reservar Turno'}
            </h1>
            <p className="text-sm text-gray-600 text-center">
              Si ya sos paciente, ingresá tu DNI, email o teléfono. Si es la primera vez, completá el formulario.
            </p>
          </div>

          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => { setActiveTab('identify'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
                activeTab === 'identify'
                  ? 'text-white border-b-2 border-ensigna-primary bg-ensigna-accent-soft/90'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Ya soy paciente
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('new'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
                activeTab === 'new'
                  ? 'text-white border-b-2 border-ensigna-primary bg-ensigna-accent-soft/90'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Nuevo paciente
            </button>
          </div>

          <div className="p-6 sm:p-8 pt-5">
            <AnimatePresence mode="wait">
              {activeTab === 'identify' ? (
                <motion.form
                  key="identify"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleIdentifySubmit}
                  className="space-y-4"
                >
                  <p className="text-sm text-gray-600 mb-4">
                    Ingresá tu DNI, teléfono o email.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI, teléfono o email
                    </label>
                    <input
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className={inputCls}
                      placeholder=""
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl gradient-red text-white font-medium hover:brightness-110 active:brightness-95 disabled:opacity-50 inline-flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>Identificarme <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="new"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (step < 4) goNext();
                    else handleFullFormSubmit(e);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && step < 4) {
                      e.preventDefault();
                      goNext();
                    }
                  }}
                  className="space-y-4"
                >
                  {/* Stepper */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center w-full gap-0">
                      {STEPS.map((s, i) => (
                        <div key={s.id} className="contents">
                          <div
                            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                              step === s.id
                                ? 'gradient-red text-white'
                                : step > s.id
                                  ? 'bg-ensigna-accent-soft text-ensigna-primary-dark'
                                  : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {s.id}
                          </div>
                          {i < STEPS.length - 1 && (
                            <div
                              className={`flex-1 h-1 mx-1 rounded-full min-w-0 ${
                                step > s.id ? 'bg-ensigna-primary-light/50' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-medium text-ensigna-primary">{STEPS[step - 1].title}</p>
                  </div>

                  {/* Step 1 */}
                  {step === 1 && (
                    <motion.div
                      key="s1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input type="text" value={fullForm.firstName} onChange={(e) => update('firstName', e.target.value)} className={inputCls} placeholder="Ej. Juan" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                        <input type="text" value={fullForm.lastName} onChange={(e) => update('lastName', e.target.value)} className={inputCls} placeholder="Ej. Pérez" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                        <input type="text" value={fullForm.dni} onChange={(e) => update('dni', e.target.value)} className={inputCls} placeholder="Ej. 12345678" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                        <input type="date" value={fullForm.birthDate} onChange={(e) => update('birthDate', e.target.value)} max={new Date().toISOString().slice(0, 10)} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                        <select value={fullForm.gender} onChange={(e) => update('gender', e.target.value)} className={inputCls}>
                          <option value="">Seleccionar...</option>
                          <option value="male">Masculino</option>
                          <option value="female">Femenino</option>
                          <option value="other">Otro</option>
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2 */}
                  {step === 2 && (
                    <motion.div
                      key="s2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input type="text" value={fullForm.phone} onChange={(e) => update('phone', e.target.value)} className={inputCls} placeholder="Ej. +54 11 1234-5678" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value={fullForm.email} onChange={(e) => update('email', e.target.value)} className={inputCls} placeholder="Ej. juan@email.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                        <input type="text" value={fullForm.address} onChange={(e) => update('address', e.target.value)} className={inputCls} placeholder="Ej. Av. Corrientes 1234" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                          <input type="text" value={fullForm.city} onChange={(e) => update('city', e.target.value)} className={inputCls} placeholder="Ej. CABA" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                          <input type="text" value={fullForm.province} onChange={(e) => update('province', e.target.value)} className={inputCls} placeholder="Ej. Buenos Aires" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Departamento / Partido</label>
                        <input type="text" value={fullForm.department} onChange={(e) => update('department', e.target.value)} className={inputCls} placeholder="Ej. Comuna 3" />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3 */}
                  {step === 3 && (
                    <motion.div
                      key="s3"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Obra social</label>
                        <select
                          value={fullForm.healthInsuranceId}
                          onChange={(e) => { update('healthInsuranceId', e.target.value); if (!e.target.value) update('affiliateNumber', ''); }}
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
                      {fullForm.healthInsuranceId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Número de afiliado *</label>
                          <input type="text" value={fullForm.affiliateNumber} onChange={(e) => update('affiliateNumber', e.target.value)} required={!!fullForm.healthInsuranceId} className={inputCls} placeholder="Ej. 12345678" />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 4 */}
                  {step === 4 && (
                    <motion.div
                      key="s4"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contacto de emergencia (nombre)</label>
                        <input type="text" value={fullForm.emergencyContactName} onChange={(e) => update('emergencyContactName', e.target.value)} className={inputCls} placeholder="Ej. María Pérez" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contacto de emergencia (teléfono)</label>
                        <input type="text" value={fullForm.emergencyContactPhone} onChange={(e) => update('emergencyContactPhone', e.target.value)} className={inputCls} placeholder="Ej. +54 11 9876-5432" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                        <textarea value={fullForm.notes} onChange={(e) => update('notes', e.target.value)} rows={2} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-[rgba(209,106,138,0.2)] focus:border-ensigna-primary resize-none" placeholder="Notas opcionales..." />
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={goBack}
                        className="py-3.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 min-h-[48px] inline-flex items-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </button>
                    ) : null}
                    {step < 4 ? (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); goNext(); }}
                        className="flex-1 py-3.5 rounded-xl gradient-red text-white font-medium hover:brightness-110 inline-flex items-center justify-center gap-2 min-h-[48px]"
                      >
                        Siguiente
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-3.5 rounded-xl gradient-red text-white font-medium hover:brightness-110 disabled:opacity-50 inline-flex items-center justify-center gap-2 min-h-[48px]"
                      >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrarme y continuar'}
                      </button>
                    )}
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
