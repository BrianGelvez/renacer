'use client';

import {
  Copy,
  GripVertical,
  Loader2,
  Pill,
  Plus,
  Trash2,
} from 'lucide-react';
import MedicationAutocomplete from '@/components/dashboard/MedicationAutocomplete';
import type { SelectedMedication } from '@/lib/api';
import type { MedicineLine } from '@/components/prescriptions/wizard/helpers';

type PrescriptionStepMedicinesProps = {
  medicines: MedicineLine[];
  maxMedicines: number;
  recentMedications: SelectedMedication[];
  onUpdate: (key: string, patch: Partial<MedicineLine>) => void;
  onAdd: () => void;
  onRemove: (key: string) => void;
  onDuplicate: (key: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onQuickAddRecent: (selection: SelectedMedication) => void;
  stepError: string | null;
};

export default function PrescriptionStepMedicines({
  medicines,
  maxMedicines,
  recentMedications,
  onUpdate,
  onAdd,
  onRemove,
  onDuplicate,
  onReorder,
  onQuickAddRecent,
  stepError,
}: PrescriptionStepMedicinesProps) {
  const dragIndex = { current: null as number | null };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Medicamentos</h3>
        <p className="mt-1 text-sm text-gray-500">
          Buscá en el vademécum Recetario. Máximo {maxMedicines} medicamentos por receta.
        </p>
      </div>

      {recentMedications.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Recientes
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentMedications.map((med) => (
              <button
                key={`${med.medicationId}-${med.package.externalId}`}
                type="button"
                onClick={() => onQuickAddRecent(med)}
                disabled={medicines.length >= maxMedicines}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:border-ensigna-primary hover:text-ensigna-primary disabled:opacity-50"
              >
                {med.brand}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {medicines.map((line, index) => (
          <article
            key={line.key}
            draggable
            onDragStart={() => {
              dragIndex.current = index;
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex.current == null || dragIndex.current === index) return;
              onReorder(dragIndex.current, index);
              dragIndex.current = null;
            }}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="cursor-grab rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 active:cursor-grabbing"
                  aria-label={`Reordenar medicamento ${index + 1}`}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ensigna-accent-soft text-ensigna-primary">
                  <Pill className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Medicamento {index + 1}
                  </p>
                  {line.selection && (
                    <p className="text-xs text-gray-500">{line.selection.drug}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onDuplicate(line.key)}
                  disabled={medicines.length >= maxMedicines || !line.selection}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-ensigna-primary disabled:opacity-40"
                  aria-label="Duplicar medicamento"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {medicines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(line.key)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Eliminar medicamento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <MedicationAutocomplete
              value={line.selection}
              onSelect={(sel) =>
                onUpdate(line.key, {
                  selection: sel,
                  requiresDuplicate: sel?.requiresDuplicate ?? false,
                })
              }
              placeholder="Buscar medicamento en vademécum…"
            />

            {line.selection && (
              <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <InfoChip label="Marca" value={line.selection.brand} />
                  <InfoChip label="Principio activo" value={line.selection.drug} />
                  <InfoChip label="Presentación" value={line.selection.package.name} />
                  {line.selection.package.power?.value && (
                    <InfoChip
                      label="Potencia"
                      value={`${line.selection.package.power.value}${line.selection.package.power.unit ?? ''}`}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Posología <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={line.posology}
                    onChange={(e) => onUpdate(line.key, { posology: e.target.value })}
                    placeholder="Ej. 1 comprimido cada 8 horas"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-ensigna-primary focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cantidad (1–10)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={line.quantity}
                      onChange={(e) =>
                        onUpdate(line.key, {
                          quantity: Math.min(
                            10,
                            Math.max(1, Number(e.target.value) || 1),
                          ),
                        })
                      }
                      className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    {
                      id: `${line.key}-dup`,
                      label: 'Duplicado',
                      checked: line.requiresDuplicate,
                      onChange: (v: boolean) =>
                        onUpdate(line.key, { requiresDuplicate: v }),
                    },
                    {
                      id: `${line.key}-generic`,
                      label: 'Sólo genérico',
                      checked: line.genericOnly,
                      disabled: line.brandRecommendation,
                      onChange: (v: boolean) =>
                        onUpdate(line.key, {
                          genericOnly: v,
                          brandRecommendation: v ? false : line.brandRecommendation,
                        }),
                    },
                    {
                      id: `${line.key}-brand`,
                      label: 'Recomendar marca',
                      checked: line.brandRecommendation,
                      disabled: line.genericOnly,
                      onChange: (v: boolean) =>
                        onUpdate(line.key, {
                          brandRecommendation: v,
                          genericOnly: v ? false : line.genericOnly,
                        }),
                    },
                    {
                      id: `${line.key}-long`,
                      label: 'Tratamiento prolongado',
                      checked: line.longTerm,
                      onChange: (v: boolean) => onUpdate(line.key, { longTerm: v }),
                    },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2.5 text-sm text-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={opt.checked}
                        disabled={opt.disabled}
                        onChange={(e) => opt.onChange(e.target.checked)}
                        className="rounded border-gray-300 text-ensigna-primary focus:ring-ensigna-primary"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      {medicines.length < maxMedicines && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 px-4 py-4 text-sm font-semibold text-ensigna-primary hover:border-ensigna-primary/40 hover:bg-ensigna-accent-soft/40 sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Agregar medicamento
        </button>
      )}

      {stepError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {stepError}
        </p>
      )}
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}
