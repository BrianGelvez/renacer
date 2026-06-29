'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Loader2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertCircle,
  Diff,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  apiClient,
  type MedicalRecordVersion,
  type MedicalRecordVersionContent,
} from '@/lib/api';

interface Props {
  medicalRecordId: string;
  canEdit?: boolean;
  /** Llamado cuando se restaura una versión (refresca padre). */
  onRestored?: () => void;
}

const FIELD_LABELS: Record<keyof MedicalRecordVersionContent, string> = {
  reason: 'Motivo de consulta',
  symptoms: 'Síntomas',
  diagnosis: 'Diagnóstico',
  treatment: 'Tratamiento',
  notes: 'Observaciones',
  consultationDate: 'Fecha de consulta',
  healthInsuranceName: 'Obra social',
  affiliateNumber: 'Nº afiliado',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calcula los campos que cambiaron entre dos snapshots de versión.
 */
function diffSnapshots(
  prev: MedicalRecordVersionContent | null,
  current: MedicalRecordVersionContent,
): Array<{
  field: keyof MedicalRecordVersionContent;
  before: string | null;
  after: string | null;
}> {
  const changes: Array<{
    field: keyof MedicalRecordVersionContent;
    before: string | null;
    after: string | null;
  }> = [];

  (Object.keys(FIELD_LABELS) as Array<keyof MedicalRecordVersionContent>).forEach(
    (key) => {
      const before = prev ? (prev[key] ?? null) : null;
      const after = current[key] ?? null;
      if ((before ?? '') !== (after ?? '')) {
        changes.push({ field: key, before, after });
      }
    },
  );

  return changes;
}

export default function MedicalRecordVersionsPanel({
  medicalRecordId,
  canEdit = true,
  onRestored,
}: Props) {
  const [versions, setVersions] = useState<MedicalRecordVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [restoreReason, setRestoreReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getMedicalRecordVersions(medicalRecordId);
      // Asegurar orden DESC (más reciente primero) por si el backend cambia.
      const sorted = [...data].sort(
        (a, b) => b.versionNumber - a.versionNumber,
      );
      setVersions(sorted);
    } catch {
      setError('No se pudo cargar el historial de versiones.');
    } finally {
      setLoading(false);
    }
  }, [medicalRecordId]);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Indexa por versionNumber para resolver "previous" rápidamente.
   * versions[0] es la más reciente; previous = versions con número menor.
   */
  const versionByNumber = useMemo(() => {
    const map = new Map<number, MedicalRecordVersion>();
    versions.forEach((v) => map.set(v.versionNumber, v));
    return map;
  }, [versions]);

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId);
    try {
      await apiClient.restoreMedicalRecordVersion(
        versionId,
        restoreReason.trim() || undefined,
      );
      setConfirmRestore(null);
      setRestoreReason('');
      await load();
      onRestored?.();
    } catch {
      setError('No se pudo restaurar la versión.');
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 text-ensigna-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic px-1 py-2">
        Sin versiones registradas.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <History className="w-4 h-4 text-ensigna-primary" />
        Historial de versiones
        <span className="ml-auto text-xs text-gray-400 font-normal">
          {versions.length} {versions.length === 1 ? 'versión' : 'versiones'}
        </span>
      </div>

      <ul className="space-y-1.5">
        {versions.map((v, idx) => {
          const isLatest = idx === 0;
          const isExpanded = expanded === v.id;
          const previous = versionByNumber.get(v.versionNumber - 1) ?? null;
          const changes = previous
            ? diffSnapshots(previous.content, v.content)
            : [];

          return (
            <li
              key={v.id}
              className={`rounded-xl border overflow-hidden transition-colors ${
                isLatest
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : v.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-black/[0.02] transition-colors"
              >
                <span
                  className={`flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold ${
                    isLatest
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  v{v.versionNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {isLatest ? 'Versión actual' : `Versión ${v.versionNumber}`}
                    </p>
                    {isLatest && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        ACTUAL
                      </span>
                    )}
                    {previous && changes.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                        <Diff className="w-3 h-3" />
                        {changes.length}{' '}
                        {changes.length === 1 ? 'cambio' : 'cambios'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(v.createdAt)}
                  </p>
                  {v.changeReason && (
                    <p className="text-xs text-gray-600 italic mt-1 truncate">
                      “{v.changeReason}”
                    </p>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden border-t border-gray-100 bg-white"
                  >
                    <div className="p-3 space-y-3">
                      {/* Cambios respecto a la versión anterior */}
                      {previous && changes.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Cambios vs v{previous.versionNumber}
                          </p>
                          <div className="space-y-2">
                            {changes.map((c) => (
                              <div
                                key={c.field}
                                className="rounded-lg bg-gray-50 border border-gray-100 p-2.5"
                              >
                                <p className="text-xs font-semibold text-gray-700 mb-1">
                                  {FIELD_LABELS[c.field]}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  <div className="rounded bg-red-50 border border-red-100 px-2 py-1">
                                    <p className="text-[10px] font-semibold text-red-700 mb-0.5">
                                      Antes
                                    </p>
                                    <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                      {c.before ?? (
                                        <span className="italic text-gray-400">
                                          (vacío)
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="rounded bg-emerald-50 border border-emerald-100 px-2 py-1">
                                    <p className="text-[10px] font-semibold text-emerald-700 mb-0.5">
                                      Después
                                    </p>
                                    <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                      {c.after ?? (
                                        <span className="italic text-gray-400">
                                          (vacío)
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Snapshot completo */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Contenido de esta versión
                        </p>
                        <div className="rounded-lg bg-gray-50 border border-gray-100 p-2.5 space-y-1.5">
                          {(
                            Object.keys(
                              FIELD_LABELS,
                            ) as Array<keyof MedicalRecordVersionContent>
                          ).map((key) => {
                            const value = v.content[key];
                            if (!value) return null;
                            return (
                              <div key={key}>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                  {FIELD_LABELS[key]}
                                </p>
                                <p className="text-xs text-gray-800 whitespace-pre-wrap">
                                  {value}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Acciones de restauración */}
                      {!isLatest && canEdit && (
                        <div className="pt-1">
                          {confirmRestore !== v.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmRestore(v.id);
                                setRestoreReason('');
                              }}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ensigna-soft text-ensigna-primary-dark text-xs font-medium hover:bg-ensigna-accent transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Restaurar esta versión
                            </button>
                          ) : (
                            <div className="rounded-lg bg-ensigna-accent/60 border border-ensigna-soft/50 p-3 space-y-2">
                              <p className="text-xs text-gray-700">
                                Se creará una <strong>nueva versión</strong>{' '}
                                con el contenido de v{v.versionNumber}. Las
                                versiones anteriores no se modifican.
                              </p>
                              <input
                                type="text"
                                placeholder="Motivo de la restauración (opcional)"
                                value={restoreReason}
                                onChange={(e) =>
                                  setRestoreReason(e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmRestore(null);
                                    setRestoreReason('');
                                  }}
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleRestore(v.id)}
                                  disabled={restoring === v.id}
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-ensigna-primary text-white text-xs font-medium disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                                >
                                  {restoring === v.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      Confirmar
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
