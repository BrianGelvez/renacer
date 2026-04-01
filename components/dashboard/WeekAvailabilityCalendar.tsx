'use client';

import { motion } from 'framer-motion';
import { Plus, Clock, Edit2, Trash2 } from 'lucide-react';

export interface AvailabilityBlock {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const DAY_COLORS = [
  'from-ensigna-primary/10 to-ensigna-soft/20 border-[rgba(209,106,138,0.2)]',
  'from-blue-500/10 to-blue-500/5 border-blue-200',
  'from-emerald-500/10 to-emerald-500/5 border-emerald-200',
  'from-purple-500/10 to-purple-500/5 border-purple-200',
  'from-amber-500/10 to-amber-500/5 border-amber-200',
  'from-pink-500/10 to-pink-500/5 border-pink-200',
  'from-orange-500/10 to-orange-500/5 border-orange-200',
];

interface WeekAvailabilityCalendarProps {
  availabilities: AvailabilityBlock[];
  readOnly?: boolean;
  onAddDay?: (dayOfWeek: number) => void;
  onEditBlock?: (block: AvailabilityBlock) => void;
  onDeleteBlock?: (id: string) => void;
}

function BlockCard({
  block,
  readOnly,
  onEditBlock,
  onDeleteBlock,
}: {
  block: AvailabilityBlock;
  readOnly: boolean;
  onEditBlock?: (b: AvailabilityBlock) => void;
  onDeleteBlock?: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-3 bg-white shadow-sm group ${
        readOnly
          ? 'border-gray-200'
          : 'border-gray-200 active:border-purple-300 transition-all'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-gray-900 font-medium text-sm">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>
              {block.startTime} - {block.endTime}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {block.slotDuration} min/turno
          </p>
        </div>
        {!readOnly && (onEditBlock || onDeleteBlock) && (
          <div className="flex items-center gap-1">
            {onEditBlock && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditBlock(block);
                }}
                className="p-2 rounded-lg text-gray-400 active:text-purple-600 active:bg-purple-50 transition-colors touch-manipulation"
                aria-label="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDeleteBlock && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBlock(block.id);
                }}
                className="p-2 rounded-lg text-gray-400 active:text-ensigna-primary active:bg-ensigna-accent transition-colors touch-manipulation"
                aria-label="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function WeekAvailabilityCalendar({
  availabilities,
  readOnly = false,
  onAddDay,
  onEditBlock,
  onDeleteBlock,
}: WeekAvailabilityCalendarProps) {
  const byDay = availabilities.reduce((acc, b) => {
    if (!acc[b.dayOfWeek]) acc[b.dayOfWeek] = [];
    acc[b.dayOfWeek].push(b);
    return acc;
  }, {} as Record<number, AvailabilityBlock[]>);

  Object.keys(byDay).forEach((d) => {
    byDay[Number(d)].sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
  });

  // Mobile: lista vertical por día
  const mobileDayList = DAYS_SHORT.map((label, dayIndex) => ({
    label,
    fullName: DAYS[dayIndex],
    dayIndex,
    blocks: byDay[dayIndex] || [],
  }));

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white min-w-0">
      {/* Mobile: vista lista vertical */}
      <div className="sm:hidden flex flex-col">
        {mobileDayList.map(({ fullName, dayIndex, blocks }) => (
          <div
            key={dayIndex}
            className={`border-b border-gray-100 last:border-b-0 bg-gradient-to-b ${DAY_COLORS[dayIndex]}`}
          >
            <div className="px-4 py-3 border-b border-gray-100/80">
              <h4 className="font-semibold text-gray-900">{fullName}</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {blocks.length} bloque{blocks.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-4 space-y-3 bg-white">
              {blocks.length === 0 && (
                <p className="text-sm text-gray-500 py-2">Sin horarios este día</p>
              )}
              {blocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  readOnly={readOnly}
                  onEditBlock={onEditBlock}
                  onDeleteBlock={onDeleteBlock}
                />
              ))}
              {!readOnly && onAddDay && (
                <button
                  type="button"
                  onClick={() => onAddDay(dayIndex)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 active:border-purple-400 active:text-purple-600 active:bg-purple-50/50 transition-colors text-sm font-medium touch-manipulation"
                >
                  <Plus className="w-5 h-5" />
                  Agregar horario
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: grid 7 columnas */}
      <div className="hidden sm:grid grid-cols-7 w-full min-w-0">
        {DAYS_SHORT.map((label, dayIndex) => (
          <div
            key={dayIndex}
            className={`flex flex-col border-r border-gray-100 last:border-r-0 ${
              dayIndex === 0 ? 'border-l-0' : ''
            }`}
          >
            <div
              className={`px-2 py-3 text-center border-b border-gray-100 bg-gradient-to-b ${DAY_COLORS[dayIndex]} min-h-[52px] flex items-center justify-center`}
            >
              <span className="font-semibold text-gray-900 text-sm">{label}</span>
            </div>
            <div className="flex-1 p-2 min-h-[120px] flex flex-col gap-2">
              {(byDay[dayIndex] || []).map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  readOnly={readOnly}
                  onEditBlock={onEditBlock}
                  onDeleteBlock={onDeleteBlock}
                />
              ))}
              {!readOnly && onAddDay && (
                <button
                  type="button"
                  onClick={() => onAddDay(dayIndex)}
                  className="mt-auto flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/50 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
