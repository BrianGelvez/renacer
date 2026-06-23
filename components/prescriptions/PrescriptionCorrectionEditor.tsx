'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import {
  apiClient,
  type CreatePrescriptionMedicinePayload,
  type PrescriptionDto,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import MedicationAutocomplete from '@/components/dashboard/MedicationAutocomplete';
import DiagnosisAutocomplete, {
  type DiagnosisSelection,
} from '@/components/prescriptions/DiagnosisAutocomplete';
import type { SelectedMedication } from '@/lib/api';

const MAX_MEDICINES = 3;

type MedicineLine = {
  key: string;
  selection: SelectedMedication | null;
  externalId: string;
  posology: string;
  quantity: number;
  longTerm: boolean;
};

type Props = {
  prescriptionId: string;
};

export default function PrescriptionCorrectionEditor({ prescriptionId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [rx, setRx] = useState<PrescriptionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blockingError, setBlockingError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisSelection | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [medicines, setMedicines] = useState<MedicineLine[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setBlockingError(null);
    setError(null);
    try {
      const data = await apiClient.getPrescription(prescriptionId);
      if (data.status !== 'CHANGES_REQUESTED') {
        setBlockingError('Esta receta no está pendiente de corrección.');
        setRx(data);
        return;
      }
      if (data.createdById !== user?.id) {
        setBlockingError('Solo quien preparó la receta puede editarla.');
        setRx(data);
        return;
      }
      setRx(data);
      setDiagnosis({
        diagnosisCode: data.diagnosisCode ?? '',
        diagnosisDescriptionEs: data.diagnosisDescriptionEs ?? data.diagnosis,
        diagnosisDescriptionEn: data.diagnosisDescriptionEn ?? data.diagnosis,
      });
      setClinicalNotes(data.clinicalRequest?.clinicalNotes ?? '');
      const rawMeds = (data.clinicalRequest?.medicines ?? []) as Array<{
        externalId?: string;
        posology?: string;
        quantity?: number;
        longTerm?: boolean;
      }>;
      setMedicines(
        rawMeds.length > 0
          ? rawMeds.map((m, i) => ({
              key: `m-${i}`,
              selection: null,
              externalId: m.externalId ?? '',
              posology: m.posology ?? '',
              quantity: m.quantity ?? 1,
              longTerm: m.longTerm ?? false,
            }))
          : [{ key: 'm-0', selection: null, externalId: '', posology: '', quantity: 1, longTerm: false }],
      );
    } catch {
      setBlockingError('No se pudo cargar la receta.');
    } finally {
      setLoading(false);
    }
  }, [prescriptionId, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateMedicine = (key: string, patch: Partial<MedicineLine>) => {
    setMedicines((prev) =>
      prev.map((m) => (m.key === key ? { ...m, ...patch } : m)),
    );
  };

  const handleSave = async () => {
    if (!rx || !diagnosis) {
      setError('Completá el diagnóstico.');
      return;
    }
    const payloadMeds: CreatePrescriptionMedicinePayload[] = [];
    for (const m of medicines) {
      const externalId = m.selection?.package.externalId ?? m.externalId;
      if (!externalId?.trim() || !m.posology.trim()) {
        setError('Completá medicamentos y posología.');
        return;
      }
      payloadMeds.push({
        externalId,
        quantity: m.quantity,
        longTerm: m.longTerm,
        posology: m.posology.trim(),
      });
    }
    setSaving(true);
    setError(null);
    try {
      await apiClient.applyPrescriptionCorrection(rx.id, {
        diagnosis: diagnosis.diagnosisDescriptionEs,
        diagnosisCode: diagnosis.diagnosisCode,
        diagnosisDescriptionEs: diagnosis.diagnosisDescriptionEs,
        diagnosisDescriptionEn: diagnosis.diagnosisDescriptionEn,
        clinicalNotes: clinicalNotes.trim() || undefined,
        medicines: payloadMeds,
        hiv: rx.clinicalRequest?.hiv ?? false,
      });
      router.push(`/dashboard/prescriptions/pending/${rx.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al guardar correcciones.';
      setError(typeof msg === 'string' ? msg : 'Error al guardar correcciones.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!rx || blockingError) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-800">
          {blockingError ?? 'Receta no disponible para edición.'}
        </div>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/prescriptions/pending/${prescriptionId}`)}
          className="text-sm text-indigo-600 hover:underline"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={() => router.push(`/dashboard/prescriptions/pending/${rx.id}`)}
        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al detalle
      </button>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">
          El médico solicitó modificaciones antes de aprobar esta receta.
        </p>
        {rx.rejectionReason && (
          <p className="mt-2 whitespace-pre-wrap">{rx.rejectionReason}</p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
        <h1 className="text-xl font-semibold text-gray-900">Editar receta</h1>
        <p className="text-sm text-gray-500">
          Paciente: {rx.patient?.lastName}, {rx.patient?.firstName} · Médico: Dr.{' '}
          {rx.doctor?.lastName}
        </p>

        {error && (
          <div className="flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diagnóstico (CIE-10)
          </label>
          <DiagnosisAutocomplete
            value={diagnosis}
            onChange={setDiagnosis}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medicamentos
          </label>
          <ul className="space-y-4">
            {medicines.map((m) => (
              <li key={m.key} className="rounded-xl border border-gray-100 p-4 space-y-3">
                <MedicationAutocomplete
                  value={m.selection}
                  onSelect={(sel) =>
                    updateMedicine(m.key, {
                      selection: sel,
                      externalId: sel?.package.externalId ?? m.externalId,
                    })
                  }
                  placeholder={
                    m.externalId
                      ? `Reemplazar medicamento (actual: ${m.externalId})`
                      : 'Buscar medicamento'
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-gray-500">Cantidad</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={m.quantity}
                      onChange={(e) =>
                        updateMedicine(m.key, {
                          quantity: Number.parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={m.longTerm}
                        onChange={(e) =>
                          updateMedicine(m.key, { longTerm: e.target.checked })
                        }
                      />
                      Tratamiento prolongado
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Posología</label>
                  <textarea
                    value={m.posology}
                    onChange={(e) =>
                      updateMedicine(m.key, { posology: e.target.value })
                    }
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                {medicines.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setMedicines((prev) => prev.filter((x) => x.key !== m.key))
                    }
                    className="inline-flex items-center gap-1 text-xs text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar
                  </button>
                )}
              </li>
            ))}
          </ul>
          {medicines.length < MAX_MEDICINES && (
            <button
              type="button"
              onClick={() =>
                setMedicines((prev) => [
                  ...prev,
                  {
                    key: `m-${Date.now()}`,
                    selection: null,
                    externalId: '',
                    posology: '',
                    quantity: 1,
                    longTerm: false,
                  },
                ])
              }
              className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600"
            >
              <Plus className="h-4 w-4" />
              Agregar medicamento
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones clínicas
          </label>
          <textarea
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar y reenviar a aprobación
        </button>
      </div>
    </div>
  );
}
