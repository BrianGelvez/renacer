'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  X,
  User,
  Stethoscope,
  RefreshCw,
  Link2,
} from 'lucide-react';
import { apiClient, type UpdateMeApiPayload, type UserProfileDto } from '@/lib/api';

type ProvinceRow = { id: number; name: string };

interface EditMyProfileModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function applyProfileToForm(
  p: UserProfileDto,
  setters: {
    setName: (v: string) => void;
    setLastName: (v: string) => void;
    setEmail: (v: string) => void;
    setPhone: (v: string) => void;
    setIsDoctor: (v: boolean) => void;
    setSpecialty: (v: string) => void;
    setLicenseNumber: (v: string) => void;
    setLicenseType: (v: string) => void;
    setDocumentNumber: (v: string) => void;
    setTitle: (v: string) => void;
    setWorkPhone: (v: string) => void;
    setAddress: (v: string) => void;
    setProvince: (v: string) => void;
    setSignatureUrl: (v: string) => void;
    setPrescriptionLegend: (v: string) => void;
  },
) {
  setters.setName(p.name ?? '');
  setters.setLastName(p.lastName ?? '');
  setters.setEmail(p.email ?? '');
  setters.setPhone(p.phone ?? '');
  setters.setIsDoctor(!!p.isDoctor);
  setters.setSpecialty(p.specialty ?? '');
  setters.setLicenseNumber(p.licenseNumber ?? '');
  setters.setLicenseType(p.licenseType ?? '');
  setters.setDocumentNumber(p.documentNumber ?? '');
  setters.setTitle(p.title ?? '');
  setters.setWorkPhone(p.workPhone ?? '');
  setters.setAddress(p.address ?? '');
  setters.setProvince(p.province?.trim() ? p.province : '');
  setters.setSignatureUrl(p.signatureUrl ?? '');
  setters.setPrescriptionLegend(p.prescriptionLegend ?? '');
}

export default function EditMyProfileModal({
  onClose,
  onSaved,
}: EditMyProfileModalProps) {
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserProfileDto | null>(null);

  const [licenseTypes, setLicenseTypes] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<ProvinceRow[]>([]);

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isDoctor, setIsDoctor] = useState(false);

  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [title, setTitle] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [prescriptionLegend, setPrescriptionLegend] = useState('');

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const applyServerProfile = useCallback((p: UserProfileDto) => {
    setDetail(p);
    applyProfileToForm(p, {
      setName,
      setLastName,
      setEmail,
      setPhone,
      setIsDoctor,
      setSpecialty,
      setLicenseNumber,
      setLicenseType,
      setDocumentNumber,
      setTitle,
      setWorkPhone,
      setAddress,
      setProvince,
      setSignatureUrl,
      setPrescriptionLegend,
    });
  }, []);

  const buildPayload = useCallback((): UpdateMeApiPayload => {
    const digits = documentNumber.replace(/\D/g, '');
    const payload: UpdateMeApiPayload = {
      name: name.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      isDoctor,
    };

    if (isDoctor) {
      payload.specialty = specialty.trim() || null;
      payload.licenseNumber = licenseNumber.trim() || null;
      payload.licenseType = licenseType.trim() === '' ? null : licenseType.trim();
      payload.documentNumber = digits === '' ? null : digits;
      payload.title = title.trim() === '' ? null : title.trim();
      payload.workPhone = workPhone.trim() || null;
      payload.address = address.trim() || null;
      payload.province = province.trim() === '' ? null : province.trim();
      payload.prescriptionLegend =
        prescriptionLegend.trim() === '' ? null : prescriptionLegend.trim();
      payload.signatureUrl =
        signatureUrl.trim() === '' ? null : signatureUrl.trim();
    }

    return payload;
  }, [
    name,
    lastName,
    email,
    phone,
    isDoctor,
    specialty,
    licenseNumber,
    licenseType,
    documentNumber,
    title,
    workPhone,
    address,
    province,
    prescriptionLegend,
    signatureUrl,
  ]);

  const saveProfile = useCallback(async (): Promise<UserProfileDto> => {
    const payload = buildPayload();
    const updated = await apiClient.patchMe(payload);
    applyServerProfile(updated);
    return updated;
  }, [applyServerProfile, buildPayload]);

  const reloadDetail = useCallback(async () => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const [p, cats, provs] = await Promise.all([
        apiClient.getMe(),
        apiClient.getRecetarioProfessionalFields(),
        apiClient.getRecetarioProvinces(false),
      ]);
      applyServerProfile(p);
      setLicenseTypes(Array.isArray(cats?.licenseTypes) ? cats.licenseTypes : []);
      setTitles(Array.isArray(cats?.titles) ? cats.titles : []);
      setProvinces(Array.isArray(provs) ? provs : []);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'No se pudo cargar tu perfil.';
      setDetailError(message);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [applyServerProfile]);

  useEffect(() => {
    void reloadDetail();
  }, [reloadDetail]);

  const persistedIsDoctor = detail?.isDoctor === true;
  const hasUnsavedDoctorFlag = isDoctor !== persistedIsDoctor;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await saveProfile();
      onSaved();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      setError(
        Array.isArray(message)
          ? message.join(', ')
          : String(message ?? 'Error al actualizar.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setError(null);
    setSyncing(true);
    try {
      const updated = await saveProfile();
      if (!updated.isDoctor) {
        setError(
          'Activá "¿Soy médico?" y guardá el perfil antes de sincronizar con Recetario.',
        );
        return;
      }
      await apiClient.syncMyRecetario();
      await reloadDetail();
      onSaved();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Error al sincronizar con Recetario.';
      setError(message);
    } finally {
      setSyncing(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="edit-my-profile-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
      >
        <div
          className="absolute inset-0 min-h-[100dvh] min-w-full bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ type: 'tween', duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 flex w-full max-w-2xl max-h-[min(92dvh,90vh)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
        >
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Editar mi perfil</h3>
              {persistedIsDoctor && detail?.recetarioSyncStatus && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <Link2 className="w-3 h-3" />
                  Recetario: {detail.recetarioSyncStatus}
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
                onClick={() => void reloadDetail()}
              >
                Reintentar
              </button>
            </div>
          )}

          {!detailLoading && !detailError && detail && (
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
            >
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <section>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                  <User className="w-4 h-4" />
                  Datos personales
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre"
                    className="px-3 py-2 rounded-xl border border-gray-200"
                  />
                  <input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Apellido"
                    className="px-3 py-2 rounded-xl border border-gray-200"
                  />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="px-3 py-2 rounded-xl border border-gray-200 sm:col-span-2"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Teléfono"
                    className="px-3 py-2 rounded-xl border border-gray-200 sm:col-span-2"
                  />
                </div>
              </section>

              <section>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                  <Stethoscope className="w-4 h-4" />
                  Perfil profesional
                </h4>
                <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                  <span className="text-sm font-medium text-gray-800">
                    ¿Soy médico?
                  </span>
                  <input
                    type="checkbox"
                    checked={isDoctor}
                    onChange={(e) => setIsDoctor(e.target.checked)}
                    className="w-5 h-5 rounded accent-red-600"
                  />
                </label>

                {isDoctor && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-gray-200"
                    >
                      <option value="">Título</option>
                      {titles.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Especialidad"
                      className="px-3 py-2 rounded-xl border border-gray-200"
                    />
                    <select
                      value={licenseType}
                      onChange={(e) => setLicenseType(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-gray-200"
                    >
                      <option value="">Tipo matrícula</option>
                      {licenseTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="Nº matrícula"
                      className="px-3 py-2 rounded-xl border border-gray-200"
                    />
                    <input
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="Documento"
                      className="px-3 py-2 rounded-xl border border-gray-200"
                    />
                    <input
                      value={workPhone}
                      onChange={(e) => setWorkPhone(e.target.value)}
                      placeholder="Teléfono profesional"
                      className="px-3 py-2 rounded-xl border border-gray-200"
                    />
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Dirección profesional"
                      className="px-3 py-2 rounded-xl border border-gray-200 sm:col-span-2"
                    />
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-gray-200 sm:col-span-2"
                    >
                      <option value="">Provincia</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={prescriptionLegend}
                      onChange={(e) => setPrescriptionLegend(e.target.value)}
                      placeholder="Leyenda de receta"
                      rows={2}
                      className="px-3 py-2 rounded-xl border border-gray-200 sm:col-span-2"
                    />
                    <input
                      value={signatureUrl}
                      onChange={(e) => setSignatureUrl(e.target.value)}
                      placeholder="URL firma"
                      className="px-3 py-2 rounded-xl border border-gray-200 sm:col-span-2"
                    />
                    {hasUnsavedDoctorFlag && (
                      <p className="sm:col-span-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Los cambios de médico aún no están guardados. Al sincronizar
                        se guardará el perfil automáticamente.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleSync()}
                      disabled={syncing || loading}
                      className="sm:col-span-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-medium hover:bg-emerald-100 disabled:opacity-60"
                    >
                      {syncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      {hasUnsavedDoctorFlag
                        ? 'Guardar y sincronizar con Recetario'
                        : 'Sincronizar con Recetario'}
                    </button>
                  </div>
                )}
              </section>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || syncing}
                  className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white font-medium disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Guardar cambios'
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
