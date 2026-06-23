'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Pill,
  Search,
  SearchX,
  X,
} from 'lucide-react';
import type {
  RecetarioMedicationDto,
  RecetarioMedicationPackageDto,
  SelectedMedication,
} from '@/lib/api';
import {
  useMedicationSearch,
  MEDICATION_SEARCH_MIN_LENGTH,
} from '@/hooks/useMedicationSearch';

interface MedicationAutocompleteProps {
  /** Medicamento + presentación seleccionados (controlado por el padre). */
  value: SelectedMedication | null;
  onSelect: (selection: SelectedMedication | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Autocomplete de medicamentos del vademécum Recetario.
 *
 * La selección incluye la presentación (package) con su `externalId`,
 * que es el dato requerido por Recetario para generar una nueva receta.
 */
export default function MedicationAutocomplete({
  value,
  onSelect,
  placeholder = 'Buscar medicamento',
  disabled = false,
}: MedicationAutocompleteProps) {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    medications,
    isLoading,
    isError,
    errorMessage,
    isTermTooShort,
    debouncedTerm,
  } = useMedicationSearch(term);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePick = (
    med: RecetarioMedicationDto,
    pkg: RecetarioMedicationPackageDto,
  ) => {
    onSelect({
      medicationId: med.id,
      brand: med.brand,
      drug: med.drug,
      requiresDuplicate: med.requiresDuplicate,
      hivSpecific: med.hivSpecific,
      package: {
        id: pkg.id,
        externalId: pkg.externalId,
        name: pkg.name,
        shape: pkg.shape,
        action: pkg.action,
        power: pkg.power,
      },
    });
    setOpen(false);
    setTerm('');
  };

  const showDropdown =
    open && term.trim().length > 0 && !disabled;

  return (
    <div ref={containerRef} className="relative">
      {value ? (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3">
          <div className="flex items-start gap-2 min-w-0">
            <Pill className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-gray-900">
                {value.brand}
                <span className="ml-2 font-normal text-gray-600 capitalize">
                  {value.drug}
                </span>
              </p>
              <p className="text-gray-600">
                {value.package.name}
                {value.package.power?.value && (
                  <span>
                    {' '}
                    · {value.package.power.value}
                    {value.package.power.unit ?? ''}
                  </span>
                )}
                {value.package.shape && (
                  <span className="text-gray-400"> · {value.package.shape}</span>
                )}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {value.requiresDuplicate && (
                  <span className="inline-flex rounded-md bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                    Requiere duplicado
                  </span>
                )}
                {value.hivSpecific && (
                  <span className="inline-flex rounded-md bg-violet-100 px-1.5 py-0.5 text-xs text-violet-800">
                    Tratamiento HIV
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            disabled={disabled}
            className="shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-50"
            aria-label="Quitar medicamento"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={term}
            disabled={disabled}
            onChange={(e) => {
              setTerm(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="min-h-[44px] w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            placeholder={placeholder}
            aria-label="Buscar medicamento"
          />
          {isLoading && (
            <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-500" />
          )}
        </div>
      )}

      {showDropdown && !value && (
        <div className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {isTermTooShort && (
            <p className="px-4 py-3 text-sm text-gray-500">
              Escribí al menos {MEDICATION_SEARCH_MIN_LENGTH} caracteres para
              buscar.
            </p>
          )}

          {!isTermTooShort && isLoading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando medicamentos…
            </div>
          )}

          {!isTermTooShort && isError && !isLoading && (
            <div className="flex items-start gap-2 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isTermTooShort &&
            !isLoading &&
            !isError &&
            debouncedTerm.length >= MEDICATION_SEARCH_MIN_LENGTH &&
            medications.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
                <SearchX className="h-4 w-4" />
                Sin resultados para “{debouncedTerm}”.
              </div>
            )}

          {!isLoading &&
            !isError &&
            medications.map((med) => (
              <div
                key={med.id}
                className="border-b border-gray-100 px-4 py-3 last:border-b-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {med.brand}
                  </p>
                  <p className="text-sm capitalize text-gray-600">{med.drug}</p>
                  {med.requiresDuplicate && (
                    <span className="inline-flex rounded-md bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                      Duplicado
                    </span>
                  )}
                  {med.hivSpecific && (
                    <span className="inline-flex rounded-md bg-violet-100 px-1.5 py-0.5 text-xs text-violet-800">
                      HIV
                    </span>
                  )}
                </div>
                {med.packages.length === 0 ? (
                  <p className="mt-1 text-xs text-gray-400">
                    Sin presentaciones disponibles para recetar.
                  </p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {med.packages.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        disabled={pkg.disabled}
                        onClick={() => handlePick(med, pkg)}
                        title={
                          pkg.disabled
                            ? 'Presentación deshabilitada'
                            : (pkg.action ?? undefined)
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Pill className="h-3 w-3" />
                        {pkg.name}
                        {pkg.power?.value && (
                          <span className="text-gray-400">
                            {pkg.power.value}
                            {pkg.power.unit ?? ''}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
