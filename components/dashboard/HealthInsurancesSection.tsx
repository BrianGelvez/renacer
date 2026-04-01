'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface HealthInsurance {
  id: string;
  name: string;
  code?: string | null;
  coveragePercent?: number;
  isActive: boolean;
}

export default function HealthInsurancesSection() {
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchInsurances = useCallback(() => {
    setLoading(true);
    apiClient
      .getHealthInsurances(true)
      .then((data: HealthInsurance[]) => setInsurances(Array.isArray(data) ? data : []))
      .catch(() => setInsurances([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchInsurances();
  }, [fetchInsurances]);

  const activeCount = insurances.filter((i) => i.isActive).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          Obras sociales
          {activeCount > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({activeCount} activas)
            </span>
          )}
        </h4>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : insurances.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">
          No hay obras sociales configuradas. Agregá las que trabaja tu clínica para
          asignarlas a los pacientes.
        </p>
      ) : (
        <div className="space-y-2">
          {insurances.map((hi) => (
            <div
              key={hi.id}
              className={`flex items-center justify-between p-3 rounded-xl ${
                hi.isActive ? 'bg-gray-50' : 'bg-gray-50/50 opacity-60'
              }`}
            >
              <div>
                <p className="font-medium text-gray-900">{hi.name}</p>
                {typeof hi.coveragePercent === 'number' && hi.coveragePercent > 0 && (
                  <p className="text-xs text-indigo-600 font-medium">
                    Cobertura: {hi.coveragePercent}% (copago en finanzas)
                  </p>
                )}
                {hi.code && (
                  <p className="text-xs text-gray-500">Código: {hi.code}</p>
                )}
                {!hi.isActive && (
                  <span className="text-xs text-gray-500">(Desactivada)</span>
                )}
              </div>
              {hi.isActive && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditId(hi.id)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-200"
                    aria-label="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(hi.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                    aria-label="Desactivar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {addModalOpen && (
        <HealthInsuranceFormModal
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => {
            fetchInsurances();
            setAddModalOpen(false);
          }}
        />
      )}
      {editId && (
        <HealthInsuranceFormModal
          insurance={insurances.find((i) => i.id === editId)!}
          onClose={() => setEditId(null)}
          onSuccess={() => {
            fetchInsurances();
            setEditId(null);
          }}
        />
      )}
      {deleteId && (
        <DeleteConfirmModal
          name={insurances.find((i) => i.id === deleteId)?.name ?? ''}
          onClose={() => setDeleteId(null)}
          onConfirm={async () => {
            await apiClient.deleteHealthInsurance(deleteId);
            fetchInsurances();
            setDeleteId(null);
          }}
        />
      )}
    </motion.div>
  );
}

function HealthInsuranceFormModal({
  insurance,
  onClose,
  onSuccess,
}: {
  insurance?: HealthInsurance;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!insurance;
  const [name, setName] = useState(insurance?.name ?? '');
  const [code, setCode] = useState(insurance?.code ?? '');
  const [coveragePercent, setCoveragePercent] = useState(
    insurance?.coveragePercent != null ? String(insurance.coveragePercent) : '0',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!insurance) return;
    setName(insurance.name);
    setCode(insurance.code ?? '');
    setCoveragePercent(
      insurance.coveragePercent != null ? String(insurance.coveragePercent) : '0',
    );
  }, [insurance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setSubmitting(true);
    try {
      const pct = Math.min(100, Math.max(0, parseFloat(coveragePercent.replace(',', '.')) || 0));
      if (isEdit && insurance) {
        await apiClient.updateHealthInsurance(insurance.id, {
          name: name.trim(),
          code: code.trim() || undefined,
          coveragePercent: pct,
        });
      } else {
        await apiClient.createHealthInsurance({
          name: name.trim(),
          code: code.trim() || undefined,
          coveragePercent: pct,
        });
      }
      onSuccess();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al guardar.',
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
          {isEdit ? 'Editar obra social' : 'Agregar obra social'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej: OSDE"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código (opcional)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ej: OSDE310"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              % Cobertura (0–100)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={coveragePercent}
              onChange={(e) => setCoveragePercent(e.target.value)}
              placeholder="Ej: 10 (la OS cubre 10%, el paciente 90%)"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Usado al registrar pagos con copago. 0 = particular paga todo.
            </p>
          </div>
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
              {isEdit ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function DeleteConfirmModal({
  name,
  onClose,
  onConfirm,
}: {
  name: string;
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
          ¿Desactivar {name}? Los registros históricos mantendrán la información.
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
