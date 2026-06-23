'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { RecetarioHealthInsuranceDto } from '@/lib/api';

type RecetarioHealthInsurancePickerProps = {
  insurances: RecetarioHealthInsuranceDto[];
  value: string;
  onChange: (recetarioId: string) => void;
  search: string;
  onSearchChange: (q: string) => void;
  loading?: boolean;
  id?: string;
  className?: string;
  emptyLabel?: string;
};

export function filterRecetarioHealthInsurances(
  insurances: RecetarioHealthInsuranceDto[],
  query: string,
  limit = 250,
): RecetarioHealthInsuranceDto[] {
  const q = query.trim().toLowerCase();
  const list = q
    ? insurances.filter((hi) => hi.name.toLowerCase().includes(q))
    : insurances;
  return list.slice(0, limit);
}

export default function RecetarioHealthInsurancePicker({
  insurances,
  value,
  onChange,
  search,
  onSearchChange,
  loading = false,
  id = 'recetario-hi-search',
  className = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500',
  emptyLabel = 'Sin obra social (particular)',
}: RecetarioHealthInsurancePickerProps) {
  const filtered = useMemo(
    () => filterRecetarioHealthInsurances(insurances, search),
    [insurances, search],
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando catálogo Recetario…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          Buscar en catálogo nacional
        </label>
        <input
          id={id}
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={className}
          placeholder="Ej. OSDE, Swiss Medical, igualdad salud…"
        />
        <p className="text-xs text-gray-500 mt-1">
          {insurances.length} obras sociales/prepagas (Recetario)
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Obra social / prepaga
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={className}
          size={Math.min(8, Math.max(4, filtered.length + 1))}
        >
          <option value="">{emptyLabel}</option>
          {filtered.map((hi) => (
            <option key={hi.id} value={String(hi.id)}>
              {hi.name}
            </option>
          ))}
        </select>
        {search.trim() && filtered.length === 0 && (
          <p className="mt-1 text-xs text-amber-700">
            Sin resultados. Probá otro término.
          </p>
        )}
        {search.trim() && filtered.length >= 250 && (
          <p className="mt-1 text-xs text-gray-500">
            Mostrando las primeras 250 coincidencias.
          </p>
        )}
      </div>
    </div>
  );
}
