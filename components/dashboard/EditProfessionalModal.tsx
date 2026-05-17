'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  X,
  User,
  Stethoscope,
  Award,
  Phone,
  UserMinus,
  RefreshCw,
  PenLine,
  Link2,
} from 'lucide-react';
import {
  apiClient,
  type UpdateDoctorApiPayload,
} from '@/lib/api';

export interface ProfessionalToEdit {
  id: string;
}

type ProvinceRow = { id: number; name: string };

type ProfessionalDetail = {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: string | null;
  licenseNumber?: string | null;
  phone?: string | null;
  isActive: boolean;
  managedByClinic?: boolean;
  userId: string;
  user?: { email: string } | null;
  contactEmail?: string | null;
  licenseType?: string | null;
  documentNumber?: string | null;
  title?: string | null;
  workPhone?: string | null;
  address?: string | null;
  province?: string | null;
  signatureUrl?: string | null;
  prescriptionLegend?: string | null;
  recetarioUserId?: number | null;
  recetarioActive?: boolean | null;
  recetarioSyncStatus?: 'PENDING' | 'SYNCED' | 'FAILED' | null;
  recetarioSyncedAt?: string | null;
  recetarioLastError?: string | null;
};

interface EditProfessionalModalProps {
  professional: ProfessionalToEdit | null;
  onClose: () => void;
  onSaved: () => void;
  onDeactivated?: () => void;
}

function syncStatusLabel(
  status: ProfessionalDetail['recetarioSyncStatus'],
): string {
  switch (status) {
    case 'SYNCED':
      return 'Sincronizado';
    case 'PENDING':
      return 'Pendiente de sync';
    case 'FAILED':
      return 'Sync con error';
    default:
      return 'Sin registrar';
  }
}

export default function EditProfessionalModal({
  professional,
  onClose,
  onSaved,
  onDeactivated,
}: EditProfessionalModalProps) {
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProfessionalDetail | null>(null);

  const [licenseTypes, setLicenseTypes] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<ProvinceRow[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [licenseType, setLicenseType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [title, setTitle] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState<string>('');
  const [signatureUrlField, setSignatureUrlField] = useState('');
  const [prescriptionLegend, setPrescriptionLegend] = useState('');

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [signatureSubmitting, setSignatureSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const reloadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const [p, cats, provs] = await Promise.all([
        apiClient.getDoctor(id) as Promise<ProfessionalDetail>,
        apiClient.getRecetarioProfessionalFields(),
        apiClient.getRecetarioProvinces(false),
      ]);
      setDetail(p);
      setLicenseTypes(Array.isArray(cats?.licenseTypes) ? cats.licenseTypes : []);
      setTitles(Array.isArray(cats?.titles) ? cats.titles : []);
      setProvinces(Array.isArray(provs) ? provs : []);

      setFirstName(p.firstName ?? '');
      setLastName(p.lastName ?? '');
      setSpecialty(p.specialty ?? '');
      setLicenseNumber(p.licenseNumber ?? '');
      setPhone(p.phone ?? '');
      setIsActive(!!p.isActive);

      setLicenseType(p.licenseType ?? '');
      setDocumentNumber(p.documentNumber ?? '');
      setTitle(p.title ?? '');
      setWorkPhone(p.workPhone ?? '');
      setAddress(p.address ?? '');
      setProvince(p.province?.trim() ? p.province : '');
      setSignatureUrlField(p.signatureUrl ?? '');
      setPrescriptionLegend(p.prescriptionLegend ?? '');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'No se pudo cargar el médico.';
      setDetailError(message);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!professional?.id) {
      setDetail(null);
      return;
    }
    void reloadDetail(professional.id);
  }, [professional?.id, reloadDetail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professional || !detail) return;
    setError(null);
    setLoading(true);
    try {
      const digits = documentNumber.replace(/\D/g, '');
      const payload: UpdateDoctorApiPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        specialty: specialty.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        phone: phone.trim() || undefined,
        isActive,
        licenseType: licenseType.trim() === '' ? null : licenseType.trim(),
        documentNumber: digits === '' ? null : digits,
        title: title.trim() === '' ? null : title.trim(),
        workPhone: workPhone.trim() || null,
        address: address.trim() || null,
        province: province.trim() === '' ? null : province.trim(),
        prescriptionLegend:
          prescriptionLegend.trim() === '' ? null : prescriptionLegend.trim(),
        signatureUrl:
          signatureUrlField.trim() === '' ? null : signatureUrlField.trim(),
      };

      await apiClient.updateDoctor(professional.id, payload);
      onSaved();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : String(message ?? 'Error al actualizar.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!professional) return;
    setError(null);
    setSyncing(true);
    try {
      await apiClient.syncDoctorRecetario(professional.id);
      await reloadDetail(professional.id);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Error al sincronizar con Recetario.';
      setError(message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSignatureOnly = async () => {
    if (!professional) return;
    const url = signatureUrlField.trim();
    if (!url) {
      setError('Completá la URL de la firma.');
      return;
    }
    setError(null);
    setSignatureSubmitting(true);
    try {
      await apiClient.setDoctorRecetarioSignature(professional.id, url);
      await reloadDetail(professional.id);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Error al enviar la firma.';
      setError(message);
    } finally {
      setSignatureSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!professional || !confirm('¿Desactivar este médico en la clínica? No se eliminarán sus datos ni turnos pasados.')) return;
    setDeactivating(true);
    setError(null);
    try {
      await apiClient.deactivateDoctorMembership(professional.id);
      onDeactivated?.();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al desactivar.';
      setError(message);
    } finally {
      setDeactivating(false);
    }
  };

  if (!professional) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Editar médico</h3>
              {detail && (
                <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5">
                    <Link2 className="w-3 h-3" />
                    Recetario: {syncStatusLabel(detail.recetarioSyncStatus)}
                  </span>
                  {detail.recetarioUserId != null && (
                    <span className="text-slate-500">user #{detail.recetarioUserId}</span>
                  )}
                  {detail.isActive ? (
                    <span className="text-emerald-600 font-medium">Activo en ENSIGNA</span>
                  ) : (
                    <span className="text-rose-600 font-medium">Inactivo en ENSIGNA</span>
                  )}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {detailLoading && (
            <div className="flex-1 flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-ensigna-primary" />
            </div>
          )}

          {!detailLoading && detailError && (
            <div className="p-6 text-center">
              <p className="text-red-600 text-sm mb-4">{detailError}</p>
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-gray-200"
                onClick={() => reloadDetail(professional.id)}
              >
                Reintentar
              </button>
            </div>
          )}

          {!detailLoading && !detailError && detail && (
            <>
              {/* Errores Recetario después de última sync */}
              {detail.recetarioLastError && (
                <div className="px-6 pt-4">
                  <div className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Último error Recetario</p>
                      <p className="opacity-90 break-words">{detail.recetarioLastError}</p>
                      {detail.recetarioSyncedAt && (
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(detail.recetarioSyncedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="px-6 py-3 flex flex-wrap gap-2 border-b border-gray-100 bg-gray-50/80">
                <button
                  type="button"
                  onClick={() => void handleSync()}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                >
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Sincronizar ahora
                </button>
              </div>

              <form
                id="edit-professional-form"
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto p-6 space-y-5"
              >
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    id="edit-pro-active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={loading}
                    className="rounded border-gray-300 text-ensigna-primary"
                  />
                  <label htmlFor="edit-pro-active" className="text-sm font-medium text-gray-800">
                    Profesional activo en el sistema local
                  </label>
                </div>

                {detail.user?.email && (
                  <p className="text-xs text-gray-500">
                    Email de cuenta: <strong>{detail.user.email}</strong>
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Requerido para sincronización con Recetario"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                    <div className="relative">
                      <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="Ej. 12345"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <fieldset className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 space-y-4">
                  <legend className="text-sm font-semibold text-violet-900 px-2">
                    Datos legales / Recetario.com.ar
                  </legend>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email de cuenta (inicio de sesión)
                    </label>
                    <p className="text-sm text-gray-800 px-4 py-2.5 rounded-xl bg-white border border-gray-200">
                      {detail.user?.email ?? '—'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tipo matrícula
                      </label>
                      <select
                        value={licenseType}
                        onChange={(e) => setLicenseType(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
                        disabled={loading}
                      >
                        <option value="">—</option>
                        {licenseTypes.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Título
                      </label>
                      <select
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
                        disabled={loading}
                      >
                        <option value="">—</option>
                        {titles.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      DNI (solo dígitos, ≥6)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={documentNumber}
                      onChange={(e) =>
                        setDocumentNumber(e.target.value.replace(/\D/g, ''))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono"
                      disabled={loading}
                      placeholder="12345678"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Provincia (catálogo Recetario)
                    </label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
                      disabled={loading}
                    >
                      <option value="">—</option>
                      {provinces.map((pr) => (
                        <option key={pr.id} value={pr.name}>
                          {pr.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Teléfono laboral
                      </label>
                      <input
                        type="text"
                        value={workPhone}
                        onChange={(e) => setWorkPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        disabled={loading}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="border-t border-violet-200 pt-4 space-y-3">
                    <p className="text-xs font-medium text-gray-700">
                      Leyenda en receta (opcional)
                    </p>
                    <input
                      type="text"
                      value={prescriptionLegend}
                      onChange={(e) => setPrescriptionLegend(e.target.value)}
                      placeholder="Leyenda / pie de documento"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                  </div>

                  <div className="border-t border-violet-200 pt-4 space-y-2">
                    <label className="block text-xs font-medium text-gray-700">
                      Firma digital (URL pública, ej. después de subir a storage)
                    </label>
                    <input
                      type="url"
                      value={signatureUrlField}
                      onChange={(e) => setSignatureUrlField(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                      disabled={loading}
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => void handleSignatureOnly()}
                      disabled={signatureSubmitting || !detail.recetarioUserId}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      {signatureSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <PenLine className="w-4 h-4" />
                      )}
                      Enviar firma a Recetario
                    </button>
                    {!detail.recetarioUserId && (
                      <p className="text-xs text-amber-700">
                        Sincronizá el profesional primero para habilitar la firma en Recetario.
                      </p>
                    )}
                  </div>
                </fieldset>
              </form>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    disabled={loading || deactivating}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ensigna-primary hover:bg-ensigna-accent rounded-xl disabled:opacity-50"
                  >
                    {deactivating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                    Desactivar profesional
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-white disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    form="edit-professional-form"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 gradient-red text-white rounded-xl font-semibold hover:brightness-105 disabled:opacity-60 shadow-md shadow-ensigna-primary/20"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    Guardar
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
