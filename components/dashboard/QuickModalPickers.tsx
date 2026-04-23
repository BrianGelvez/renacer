'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, ChevronDown, Check, CalendarDays, Clock } from 'lucide-react';

export type PickerProfessional = {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: string | null;
  isActive?: boolean;
};

/** Selector de profesional (misma línea visual que la agenda). */
export function ProfessionalPickerField({
  idPrefix,
  label,
  options,
  value,
  onChange,
  emptyHint = 'Elegí un profesional',
}: {
  idPrefix: string;
  label: string;
  options: PickerProfessional[];
  value: string;
  onChange: (id: string) => void;
  emptyHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((p) => p.id === value) ?? null;
  const labelId = `${idPrefix}-pro-label`;
  const btnId = `${idPrefix}-pro-btn`;
  const listId = `${idPrefix}-pro-list`;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full">
      <label
        id={labelId}
        htmlFor={btnId}
        className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500"
      >
        {label}
      </label>
      <button
        type="button"
        id={btnId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={`group flex min-h-[52px] w-full items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left shadow-sm transition-all duration-200 touch-manipulation ${
          open
            ? 'border-emerald-400 bg-white ring-4 ring-emerald-500/15 shadow-md'
            : 'border-gray-200/90 bg-gradient-to-b from-white to-gray-50/80 hover:border-emerald-200 hover:shadow-md'
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
          <Stethoscope className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <p className="truncate text-base font-semibold text-gray-900">
                Dr. {selected.firstName} {selected.lastName}
              </p>
              {selected.specialty ? (
                <p className="truncate text-sm text-gray-500">{selected.specialty}</p>
              ) : (
                <p className="text-sm text-gray-400">{emptyHint}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-base font-medium text-gray-500">Seleccionar profesional</p>
              <p className="text-sm text-gray-400">{emptyHint}</p>
            </>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-emerald-600' : 'group-hover:text-gray-600'
          }`}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 z-[80] mt-2 max-h-[min(50vh,300px)] overflow-y-auto overflow-x-hidden rounded-2xl border border-gray-200/80 bg-white py-2 shadow-xl shadow-gray-900/10 ring-1 ring-black/[0.04]"
          >
            {options.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500" role="presentation">
                No hay profesionales
              </li>
            ) : null}
            {options.map((p) => {
              const isSelected = p.id === value;
              const inactive = p.isActive === false;
              return (
                <li key={p.id} role="presentation" className="px-2">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(p.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950'
                        : 'text-gray-900 hover:bg-gray-50'
                    } ${inactive ? 'opacity-70' : ''}`}
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.firstName?.[0]}
                      {p.lastName?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[15px] font-semibold leading-snug">
                          Dr. {p.firstName} {p.lastName}
                        </p>
                        {inactive ? (
                          <span className="shrink-0 rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                            Inactivo
                          </span>
                        ) : null}
                      </div>
                      {p.specialty ? (
                        <p className="mt-0.5 truncate text-sm text-gray-500">{p.specialty}</p>
                      ) : (
                        <p className="mt-0.5 text-sm text-gray-400">Sin especialidad indicada</p>
                      )}
                    </div>
                    {isSelected ? (
                      <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

type ListboxOption = { value: string; label: string; sublabel?: string };

/** Listbox compacto para día de la semana, duración, etc. */
export function ModalListboxField({
  idPrefix,
  label,
  options,
  value,
  onChange,
  variant = 'sky',
  iconKind = 'clock',
}: {
  idPrefix: string;
  label: string;
  options: ListboxOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'sky' | 'slate';
  iconKind?: 'calendar' | 'clock';
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected =
    options.find((o) => o.value === value) ?? options[0] ?? { value: '', label: '—' };
  const labelId = `${idPrefix}-lb-label`;
  const btnId = `${idPrefix}-lb-btn`;
  const listId = `${idPrefix}-lb-list`;

  const ringOpen =
    variant === 'sky'
      ? 'border-sky-400 ring-4 ring-sky-500/15'
      : 'border-slate-400 ring-4 ring-slate-500/12';
  const iconWrap =
    variant === 'sky'
      ? 'from-sky-500 to-cyan-600 shadow-sky-500/20'
      : 'from-slate-500 to-slate-700 shadow-slate-500/20';
  const selectedBg = variant === 'sky' ? 'bg-sky-50 text-sky-950' : 'bg-slate-50 text-slate-950';
  const checkColor = variant === 'sky' ? 'text-sky-600' : 'text-slate-600';
  const initialsBg = variant === 'sky' ? 'bg-sky-600 text-white' : 'bg-slate-600 text-white';
  const initialsBgMuted = variant === 'sky' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-800';

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full">
      <label id={labelId} htmlFor={btnId} className="mb-1 block text-xs font-medium text-gray-500">
        {label}
      </label>
      <button
        type="button"
        id={btnId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={`group flex min-h-[48px] w-full items-center gap-3 rounded-xl border-2 px-3 py-2 text-left text-sm shadow-sm transition-all ${
          open
            ? `border-transparent bg-white ${ringOpen} shadow-md`
            : 'border-gray-200/90 bg-gradient-to-b from-white to-gray-50/80 hover:border-gray-300 hover:shadow'
        }`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-md ${iconWrap}`}
        >
          {iconKind === 'calendar' ? (
            <CalendarDays className="h-4 w-4" aria-hidden />
          ) : (
            <Clock className="h-4 w-4" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{selected?.label ?? '—'}</p>
          {selected?.sublabel ? (
            <p className="truncate text-xs text-gray-500">{selected.sublabel}</p>
          ) : null}
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${open ? `rotate-180 ${checkColor}` : ''}`}
          aria-hidden
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 z-[80] mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-gray-200/80 bg-white py-1.5 shadow-lg ring-1 ring-black/[0.04]"
          >
            {options.map((o) => {
              const isSelected = o.value === value;
              return (
                <li key={o.value} role="presentation" className="px-1.5">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${
                      isSelected ? selectedBg : 'text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                        isSelected ? initialsBg : initialsBgMuted
                      }`}
                    >
                      {o.label.slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {isSelected ? <Check className={`h-4 w-4 shrink-0 ${checkColor}`} /> : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
