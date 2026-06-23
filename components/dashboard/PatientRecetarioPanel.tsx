'use client';

import { useState } from 'react';
import { AlertCircle, Link2, Loader2, RefreshCw } from 'lucide-react';
import { apiClient, type PatientDto } from '@/lib/api';
import RecetarioSyncBadge from '@/components/dashboard/RecetarioSyncBadge';
import type { RecetarioSyncStatus } from '@/contexts/AuthContext';

type Props = {
  patient: Pick<
    PatientDto,
    | 'id'
    | 'recetarioSyncStatus'
    | 'recetarioSyncedAt'
    | 'recetarioLastError'
    | 'healthInsurancePlan'
  >;
  healthCenterId: number | null | undefined;
  canSync: boolean;
  onSynced: (patient: PatientDto) => void;
};

export default function PatientRecetarioPanel({
  patient,
  healthCenterId,
  canSync,
  onSynced,
}: Props) {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const { patient: updated, result } =
        await apiClient.syncPatientRecetario(patient.id);
      onSynced(updated);
      if (result.status === 'FAILED') {
        setSyncError(result.message);
      }
    } catch (err: unknown) {
      setSyncError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'No se pudo sincronizar con Recetario.',
      );
    } finally {
      setSyncing(false);
    }
  };

  if (!healthCenterId) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-600">
        <p className="flex items-center gap-2 font-medium text-gray-700">
          <Link2 className="h-4 w-4" />
          Recetario
        </p>
        <p className="mt-1">
          Vinculá la clínica a Recetario desde Configuración para habilitar la
          sincronización de pacientes.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-indigo-600" />
            Recetario
          </p>
          <RecetarioSyncBadge
            status={patient.recetarioSyncStatus as RecetarioSyncStatus | null}
            syncedAt={patient.recetarioSyncedAt ?? null}
            lastError={patient.recetarioLastError ?? null}
            healthCenterId={healthCenterId}
          />
        </div>
        {canSync && (
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
          </button>
        )}
      </div>

      {patient.healthInsurancePlan && (
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-700">Plan de cobertura:</span>{' '}
          {patient.healthInsurancePlan}
        </p>
      )}

      {patient.recetarioLastError &&
        patient.recetarioSyncStatus === 'FAILED' && (
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Último error</p>
              <p className="break-words opacity-90">{patient.recetarioLastError}</p>
            </div>
          </div>
        )}

      {syncError && (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {syncError}
        </div>
      )}

      <p className="text-xs text-gray-500">
        La sincronización se ejecuta automáticamente al crear o editar el
        paciente. Requiere DNI (≥6 dígitos), fecha de nacimiento y género.
      </p>
    </div>
  );
}
