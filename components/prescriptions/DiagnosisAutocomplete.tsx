'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  AlertCircle,
  Loader2,
  Search,
  SearchX,
  X,
} from 'lucide-react';
import type { SelectedDiagnosis } from '@/lib/api';
import {
  useDiagnosisSearch,
  DIAGNOSIS_SEARCH_MIN_LENGTH,
} from '@/hooks/useDiagnosisSearch';

const ROW_HEIGHT_PX = 44;
const LIST_MAX_HEIGHT_PX = 280;
const DEBOUNCE_HINT = 'Escribí al menos 3 caracteres (código o enfermedad).';

export type DiagnosisSelection = {
  diagnosisCode: string;
  diagnosisDescriptionEs: string;
  diagnosisDescriptionEn: string;
};

interface DiagnosisAutocompleteProps {
  value: DiagnosisSelection | null;
  onChange: (selection: DiagnosisSelection | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

function formatIcd10Label(item: { code: string; description: string }): string {
  return `${item.code} - ${item.description}`;
}

function toSelection(item: SelectedDiagnosis): DiagnosisSelection {
  return {
    diagnosisCode: item.code,
    diagnosisDescriptionEs: item.description,
    diagnosisDescriptionEn: item.descriptionEn,
  };
}

function fromSelection(
  selection: DiagnosisSelection,
): SelectedDiagnosis {
  return {
    code: selection.diagnosisCode,
    description: selection.diagnosisDescriptionEs,
    descriptionEn: selection.diagnosisDescriptionEn,
  };
}

/**
 * Autocomplete ICD-10 profesional para recetas electrónicas.
 * Búsqueda por código, nombre, coincidencia parcial y múltiples palabras.
 */
export default function DiagnosisAutocomplete({
  value,
  onChange,
  placeholder = 'Buscar por código o enfermedad (ej. diabetes, E11, asma)…',
  disabled = false,
  required = false,
}: DiagnosisAutocompleteProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listParentRef = useRef<HTMLDivElement>(null);

  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const {
    diagnoses,
    isLoading,
    isError,
    errorMessage,
    isTermTooShort,
    debouncedTerm,
  } = useDiagnosisSearch(term);

  const selectedItem = value ? fromSelection(value) : null;
  const displayValue = selectedItem ? formatIcd10Label(selectedItem) : term;

  const showDropdown =
    open && !selectedItem && term.trim().length > 0 && !disabled;

  const canShowResults =
    !isTermTooShort &&
    debouncedTerm.length >= DIAGNOSIS_SEARCH_MIN_LENGTH &&
    !isLoading &&
    !isError;

  const virtualizer = useVirtualizer({
    count: diagnoses.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 8,
  });

  useEffect(() => {
    setActiveIndex(diagnoses.length > 0 ? 0 : -1);
  }, [diagnoses]);

  useEffect(() => {
    if (!showDropdown || activeIndex < 0) return;
    virtualizer.scrollToIndex(activeIndex, { align: 'auto' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scroll on keyboard highlight only
  }, [activeIndex, showDropdown]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pick = useCallback(
    (item: SelectedDiagnosis) => {
      onChange(toSelection(item));
      setTerm('');
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    },
    [onChange],
  );

  const clear = useCallback(() => {
    onChange(null);
    setTerm('');
    setOpen(false);
    setActiveIndex(-1);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (selectedItem) {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        clear();
      }
      return;
    }

    if (!showDropdown) {
      if (e.key === 'ArrowDown' && term.trim().length >= DIAGNOSIS_SEARCH_MIN_LENGTH) {
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (diagnoses.length === 0) return;
        setActiveIndex((i) =>
          i < diagnoses.length - 1 ? i + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (diagnoses.length === 0) return;
        setActiveIndex((i) =>
          i > 0 ? i - 1 : diagnoses.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < diagnoses.length) {
          pick(diagnoses[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          value={displayValue}
          readOnly={!!selectedItem}
          disabled={disabled}
          required={required && !selectedItem}
          onChange={(e) => {
            if (selectedItem) return;
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!selectedItem) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`min-h-[48px] w-full rounded-lg border bg-white py-3 pl-10 pr-10 font-mono text-sm uppercase tracking-wide text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:bg-slate-100 ${
            selectedItem
              ? 'border-emerald-300 bg-emerald-50/40'
              : 'border-slate-300'
          }`}
          aria-label="Buscar diagnóstico ICD-10"
        />
        {isLoading && !selectedItem && (
          <Loader2 className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-sky-600" />
        )}
        {(selectedItem || term) && !disabled && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Limpiar diagnóstico"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
          style={{ maxHeight: LIST_MAX_HEIGHT_PX }}
        >
          {isTermTooShort && (
            <p className="px-4 py-3 text-sm text-slate-500">{DEBOUNCE_HINT}</p>
          )}

          {!isTermTooShort && isLoading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
              Buscando diagnósticos ICD-10…
            </div>
          )}

          {!isTermTooShort && isError && !isLoading && (
            <div className="flex items-start gap-2 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {canShowResults && diagnoses.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
              <SearchX className="h-4 w-4" />
              No se encontraron diagnósticos
            </div>
          )}

          {canShowResults && diagnoses.length > 0 && (
            <div
              ref={listParentRef}
              id={listboxId}
              role="listbox"
              className="overflow-y-auto"
              style={{ maxHeight: LIST_MAX_HEIGHT_PX }}
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const item = diagnoses[virtualRow.index];
                  const isActive = virtualRow.index === activeIndex;
                  return (
                    <button
                      key={`${item.code}-${virtualRow.index}`}
                      id={`${listboxId}-option-${virtualRow.index}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(virtualRow.index)}
                      onClick={() => pick(item)}
                      className={`absolute left-0 top-0 w-full px-4 text-left transition ${
                        isActive
                          ? 'bg-sky-50 text-sky-950'
                          : 'bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <span className="block truncate font-mono text-sm font-semibold tracking-wide">
                        <span className="text-sky-700">{item.code}</span>
                        <span className="mx-2 text-slate-300">-</span>
                        <span className="font-sans font-medium uppercase text-slate-800">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
