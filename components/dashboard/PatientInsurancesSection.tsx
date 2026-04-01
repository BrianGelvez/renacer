'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface PatientInsurance {
  id: string;
  affiliateNumber: string;
  isPrimary: boolean;
  isActive: boolean;
  healthInsurance: { id: string; name: string; code?: string | null };
}

interface PatientInsurancesSectionProps {
  patientId: string;
  canManage?: boolean; // OWNER/ADMIN
  initialInsurances?: PatientInsurance[]; // from parent if already loaded
  onUpdate?: () => void;
}

export default function PatientInsurancesSection({
  patientId,
  canManage = false,
  initialInsurances,
  onUpdate,
}: PatientInsurancesSectionProps) {
  const [insurances, setInsurances] = useState<PatientInsurance[]>(
    initialInsurances ?? [],
  );
  const [loading, setLoading] = useState(!initialInsurances?.length);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const fetchInsurances = useCallback(() => {
    if (initialInsurances && initialInsurances.length > 0) return;
    setLoading(true);
    setError(null);
    apiClient
      .getPatientInsurances(patientId)
      .then((data: PatientInsurance[]) => setInsurances(Array.isArray(data) ? data : []))
      .catch(() => setError('Error al cargar obras sociales.'))
      .finally(() => setLoading(false));
  }, [patientId, initialInsurances]);

  useEffect(() => {
    if (initialInsurances?.length) {
      setInsurances(initialInsurances);
      setLoading(false);
    } else {
      fetchInsurances();
    }
  }, [initialInsurances, fetchInsurances]);

  const handleAddSuccess = () => {
    if (initialInsurances) {
      fetchInsurances();
    } else {
      apiClient.getPatientInsurances(patientId).then((data) => {
        setInsurances(Array.isArray(data) ? data : []);
      });
    }
    setAddModalOpen(false);
    onUpdate?.();
  };

  const handleEditSuccess = () => {
    setEditId(null);
    apiClient.getPatientInsurances(patientId).then((data) => {
      setInsurances(Array.isArray(data) ? data : []);
    });
    onUpdate?.();
  };

  const handleDeactivateSuccess = () => {
    setDeactivateId(null);
    apiClient.getPatientInsurances(patientId).then((data) => {
      setInsurances(Array.isArray(data) ? data : []);
    });
    onUpdate?.();
  };

  const activeInsurances = insurances.filter((i) => i.isActive);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-left"
      >
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          Obras sociales
          {activeInsurances.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({activeInsurances.length})
            </span>
          )}
        </h2>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm text-gray-500">Cargando obras sociales...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          ) : activeInsurances.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-gray-50 border border-gray-100">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Sin obras sociales asignadas</p>
              <p className="text-sm text-gray-500 mt-1">
                {canManage
                  ? 'Agregá una obra social para el paciente.'
                  : 'El paciente no tiene obras sociales registradas.'}
              </p>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setAddModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  Agregar obra social
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {activeInsurances.map((pi) => (
                <li
                  key={pi.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50"
                >
                  <div>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      {pi.healthInsurance.name}
                      {pi.isPrimary && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                          Principal
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Nº afiliado: {pi.affiliateNumber}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditId(pi.id)}
                        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                        aria-label="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeactivateId(pi.id)}
                        className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        aria-label="Desactivar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canManage && activeInsurances.length > 0 && (
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-50"
            >
              <Plus className="w-4 h-4" />
              Agregar otra obra social
            </button>
          )}
        </div>
      )}

      {addModalOpen && (
        <AddPatientInsuranceModal
          patientId={patientId}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {editId && (
        <EditPatientInsuranceModal
          patientId={patientId}
          insuranceId={editId}
          insurance={activeInsurances.find((i) => i.id === editId)!}
          onClose={() => setEditId(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {deactivateId && (
        <DeactivateConfirmModal
          insuranceName={
            activeInsurances.find((i) => i.id === deactivateId)?.healthInsurance
              .name ?? ''
          }
          onClose={() => setDeactivateId(null)}
          onConfirm={async () => {
            await apiClient.deactivatePatientInsurance(patientId, deactivateId);
            handleDeactivateSuccess();
          }}
        />
      )}
    </div>
  );
}

function AddPatientInsuranceModal({
  patientId,
  onClose,
  onSuccess,
}: {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [healthInsurances, setHealthInsurances] = useState<
    Array<{ id: string; name: string; code?: string | null }>
  >([]);
  const [healthInsuranceId, setHealthInsuranceId] = useState('');
  const [affiliateNumber, setAffiliateNumber] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getHealthInsurances()
      .then((data) => {
        setHealthInsurances(Array.isArray(data) ? data : []);
        if (data?.length && !healthInsuranceId) {
          setHealthInsuranceId(data[0].id);
        }
      })
      .catch(() => setError('Error al cargar obras sociales.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!healthInsuranceId?.trim() || !affiliateNumber?.trim()) {
      setError('Completá la obra social y el número de afiliado.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.addPatientInsurance(patientId, {
        healthInsuranceId,
        affiliateNumber: affiliateNumber.trim(),
        isPrimary,
      });
      onSuccess();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al agregar la obra social.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Agregar obra social
        </h3>
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : healthInsurances.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-600">
            No hay obras sociales configuradas en la clínica. Agregá obras sociales desde la configuración para poder asignarlas a los pacientes.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Obra social
              </label>
              <select
                value={healthInsuranceId}
                onChange={(e) => setHealthInsuranceId(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleccionar...</option>
                {healthInsurances.map((hi) => (
                  <option key={hi.id} value={hi.id}>
                    {hi.name}
                    {hi.code ? ` (${hi.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de afiliado
              </label>
              <input
                type="text"
                value={affiliateNumber}
                onChange={(e) => setAffiliateNumber(e.target.value)}
                required
                placeholder="Ej: 12345678"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Marcar como principal</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 inline-flex justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Agregar
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function EditPatientInsuranceModal({
  patientId,
  insuranceId,
  insurance,
  onClose,
  onSuccess,
}: {
  patientId: string;
  insuranceId: string;
  insurance: PatientInsurance;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [affiliateNumber, setAffiliateNumber] = useState(insurance.affiliateNumber);
  const [isPrimary, setIsPrimary] = useState(insurance.isPrimary);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!affiliateNumber?.trim()) {
      setError('El número de afiliado es obligatorio.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.updatePatientInsurance(patientId, insuranceId, {
        affiliateNumber: affiliateNumber.trim(),
        isPrimary,
      });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Editar {insurance.healthInsurance.name}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de afiliado
            </label>
            <input
              type="text"
              value={affiliateNumber}
              onChange={(e) => setAffiliateNumber(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Marcar como principal</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 inline-flex justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Guardar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function DeactivateConfirmModal({
  insuranceName,
  onClose,
  onConfirm,
}: {
  insuranceName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Desactivar obra social
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          ¿Desactivar {insuranceName}? Los registros históricos mantendrán la información guardada.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl gradient-red text-white font-medium hover:brightness-105 disabled:opacity-50 inline-flex gap-2 shadow-md shadow-ensigna-primary/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Desactivar
          </button>
        </div>
      </div>
    </div>
  );
}
