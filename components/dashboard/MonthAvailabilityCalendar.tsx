'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Ban, CircleSlash } from 'lucide-react';

export interface AvailabilityBlock {
  dayOfWeek: number;
  startTime?: string;
  endTime?: string;
}

/** Día bloqueado: no atender esa fecha concreta (excepción al horario recurrente) */
export interface BlockedDateItem {
  id: string;
  date: string; // ISO o YYYY-MM-DD
  reason?: string;
}

const DAYS_HEADER = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const DAYS_HEADER_FULL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeBlockedDate(b: BlockedDateItem): string {
  if (b.date.includes('T')) return b.date.slice(0, 10);
  return b.date;
}

interface MonthAvailabilityCalendarProps {
  /** Disponibilidad por día de semana (0-6). Si tiene bloques, el día se marca. */
  availabilityByWeekday: Record<number, AvailabilityBlock[]>;
  /** Días bloqueados (no atender esa fecha). Se filtran por el mes mostrado. */
  blockedDates?: BlockedDateItem[];
  readOnly?: boolean;
  /** Clic en día: editar horarios recurrentes de ese día de la semana */
  onDayClick?: (dayOfWeek: number) => void;
  /** Notificar mes visible para cargar días bloqueados */
  onMonthChange?: (year: number, month: number) => void;
  /** Bloquear esta fecha concreta (no atender este día) */
  onBlockDate?: (dateStr: string) => void;
  /** Desbloquear día (por id del registro) */
  onUnblockDate?: (id: string) => void;
}

export default function MonthAvailabilityCalendar({
  availabilityByWeekday,
  blockedDates = [],
  readOnly = false,
  onDayClick,
  onMonthChange,
  onBlockDate,
  onUnblockDate,
}: MonthAvailabilityCalendarProps) {
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    onMonthChange?.(current.year, current.month);
  }, [current.year, current.month]);

  const firstDay = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const prevMonthDays = new Date(current.year, current.month, 0).getDate();

  type DayCell = { day: number; dayOfWeek: number; isCurrentMonth: boolean; dateStr: string };
  const days: DayCell[] = [];

  // Previous month padding
  const prevYear = current.month === 0 ? current.year - 1 : current.year;
  const prevMonth = current.month === 0 ? 11 : current.month - 1;
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const date = new Date(prevYear, prevMonth, d);
    days.push({
      day: d,
      dayOfWeek: i,
      isCurrentMonth: false,
      dateStr: toDateStr(date),
    });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(current.year, current.month, d);
    days.push({
      day: d,
      dayOfWeek: date.getDay(),
      isCurrentMonth: true,
      dateStr: toDateStr(date),
    });
  }
  // Next month padding to complete grid
  const remaining = 42 - days.length;
  const nextYear = current.month === 11 ? current.year + 1 : current.year;
  const nextMonth = current.month === 11 ? 0 : current.month + 1;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(nextYear, nextMonth, d);
    days.push({
      day: d,
      dayOfWeek: date.getDay(),
      isCurrentMonth: false,
      dateStr: toDateStr(date),
    });
  }

  const hasAvailability = (dayOfWeek: number) =>
    availabilityByWeekday[dayOfWeek]?.length > 0;

  const getBlockedForDate = (dateStr: string): BlockedDateItem | undefined =>
    blockedDates.find((b) => normalizeBlockedDate(b) === dateStr);

  const goPrev = () => {
    setCurrent((c) =>
      c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }
    );
  };

  const goNext = () => {
    setCurrent((c) =>
      c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }
    );
  };

  const goToday = () => {
    const now = new Date();
    setCurrent({ year: now.getFullYear(), month: now.getMonth() });
  };

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white min-w-0">
      {/* Header: móvil más compacto */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-gray-100 bg-gray-50/80 min-w-0">
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={goPrev}
            className="p-2.5 sm:p-2 rounded-xl text-gray-500 active:bg-white active:text-gray-700 border border-transparent active:border-gray-200 transition-colors touch-manipulation"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="p-2.5 sm:p-2 rounded-xl text-gray-500 active:bg-white active:text-gray-700 border border-transparent active:border-gray-200 transition-colors touch-manipulation"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={goToday}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium text-sm sm:text-base active:bg-gray-50 transition-colors touch-manipulation min-w-0 shrink"
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="truncate">
            <span className="hidden sm:inline">{MONTHS[current.month]}</span>
            <span className="sm:hidden">{MONTHS_SHORT[current.month]}</span> {current.year}
          </span>
        </button>
        <div className="w-14 sm:w-20 shrink-0" />
      </div>

      {/* Weekday headers: una letra en móvil */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS_HEADER.map((d, i) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-tight sm:tracking-wider"
            title={DAYS_HEADER_FULL[i]}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid: celdas táctiles en móvil */}
      <div className="grid grid-cols-7 min-w-0">
        {days.map((cell, index) => {
          const hasBlock = hasAvailability(cell.dayOfWeek);
          const blocked = getBlockedForDate(cell.dateStr);
          const clickable = !readOnly && onDayClick && !blocked;

          return (
            <motion.div
              key={index}
              className={`
                min-h-[44px] sm:min-h-[56px] md:min-h-[64px] p-1 sm:p-1.5 md:p-2 border-b border-r border-gray-100
                text-left transition-colors touch-manipulation flex flex-col
                ${cell.isCurrentMonth ? 'text-gray-900 bg-white' : 'text-gray-300 bg-gray-50/50'}
                ${hasBlock && cell.isCurrentMonth && !blocked ? 'bg-ensigna-accent/70' : ''}
                ${blocked && cell.isCurrentMonth ? 'bg-amber-50/80' : ''}
              `}
            >
              <button
                type="button"
                onClick={() => clickable && onDayClick(cell.dayOfWeek)}
                disabled={!clickable}
                className={`
                  text-left w-full flex-1 min-w-0
                  ${clickable ? 'active:bg-ensigna-accent sm:hover:bg-ensigna-accent cursor-pointer rounded' : 'cursor-default'}
                `}
              >
                <span className="text-xs sm:text-sm font-medium block truncate">{cell.day}</span>
                {hasBlock && !blocked && (
                  <div className="flex items-center gap-0.5 mt-0.5 sm:mt-1">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-ensigna-accent0 shrink-0" />
                    {availabilityByWeekday[cell.dayOfWeek].length > 1 && (
                      <span className="text-[9px] sm:text-[10px] text-ensigna-primary font-medium truncate">
                        +{availabilityByWeekday[cell.dayOfWeek].length - 1}
                      </span>
                    )}
                  </div>
                )}
              </button>
              {blocked && cell.isCurrentMonth && (
                <div className="mt-0.5 flex items-center gap-1 flex-wrap">
                  <span className="text-[9px] sm:text-[10px] text-amber-700 font-medium flex items-center gap-0.5">
                    <Ban className="w-3 h-3" />
                    Bloqueado
                  </span>
                  {!readOnly && onUnblockDate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnblockDate(blocked.id);
                      }}
                      className="text-[9px] sm:text-[10px] text-amber-700 underline active:opacity-80"
                    >
                      Desbloquear
                    </button>
                  )}
                </div>
              )}
              {!blocked && hasBlock && cell.isCurrentMonth && !readOnly && onBlockDate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBlockDate(cell.dateStr);
                  }}
                  className="text-[9px] sm:text-[10px] text-amber-600 hover:text-amber-800 mt-0.5 flex items-center gap-0.5 active:opacity-80"
                >
                  <CircleSlash className="w-3 h-3" />
                  No atender este día
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {!readOnly && onDayClick && (
        <div className="px-3 sm:px-4 py-3 text-xs text-gray-500 border-t border-gray-100 bg-gray-50/50 space-y-1 leading-snug">
          <p>Tocá un día para agregar o editar horarios de ese día de la semana (aplica a todas las semanas).</p>
          <p>Si un día concreto no podés atender, usá &quot;No atender este día&quot; en esa fecha.</p>
        </div>
      )}
    </div>
  );
}
