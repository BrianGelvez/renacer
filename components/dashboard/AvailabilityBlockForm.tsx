'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Timer, Loader2, CheckCircle } from 'lucide-react';

export interface AvailabilityFormValues {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const SLOT_OPTIONS = [15, 20, 30, 45, 60];

interface AvailabilityBlockFormProps {
  open: boolean;
  onClose: () => void;
  initialValues?: Partial<AvailabilityFormValues> | null;
  editId?: string | null;
  onSubmit: (values: AvailabilityFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export default function AvailabilityBlockForm({
  open,
  onClose,
  initialValues,
  editId,
  onSubmit,
  isSubmitting,
}: AvailabilityBlockFormProps) {
  const isEdit = Boolean(editId);
  const dayOfWeek = initialValues?.dayOfWeek ?? 1;
  const startTime = initialValues?.startTime ?? '09:00';
  const endTime = initialValues?.endTime ?? '13:00';
  const slotDuration = initialValues?.slotDuration ?? 30;

  const [state, setState] = useState({
    dayOfWeek,
    startTime,
    endTime,
    slotDuration,
  });

  useEffect(() => {
    if (open) {
      setState({
        dayOfWeek: initialValues?.dayOfWeek ?? 1,
        startTime: initialValues?.startTime ?? '09:00',
        endTime: initialValues?.endTime ?? '13:00',
        slotDuration: initialValues?.slotDuration ?? 30,
      });
    }
  }, [open, initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(state);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[85vh] sm:max-h-[90vh] flex flex-col pointer-events-auto"
            >
              <div className="rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-2">
                  {isEdit ? 'Editar horario' : 'Nuevo horario'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2.5 rounded-xl text-gray-500 active:bg-gray-100 transition-colors touch-manipulation shrink-0"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Día de la semana
                  </label>
                    <div className="flex flex-wrap gap-2">
                    {DAYS_SHORT.map((day, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setState((s) => ({ ...s, dayOfWeek: idx }))}
                        disabled={isSubmitting}
                        className={`min-w-[2.75rem] px-3 py-2.5 rounded-xl text-sm font-medium transition-all touch-manipulation ${
                          state.dayOfWeek === idx
                            ? 'bg-ensigna-primary text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora inicio
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={state.startTime}
                        onChange={(e) => setState((s) => ({ ...s, startTime: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-ensigna-primary/20 focus:border-ensigna-primary"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora fin
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={state.endTime}
                        onChange={(e) => setState((s) => ({ ...s, endTime: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-ensigna-primary/20 focus:border-ensigna-primary"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración por turno
                  </label>
                  <div className="relative">
                    <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={state.slotDuration}
                      onChange={(e) =>
                        setState((s) => ({ ...s, slotDuration: Number(e.target.value) }))
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-ensigna-primary/20 focus:border-ensigna-primary appearance-none bg-white"
                      disabled={isSubmitting}
                    >
                      {SLOT_OPTIONS.map((min) => (
                        <option key={min} value={min}>
                          {min} minutos
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium active:bg-gray-50 transition-colors touch-manipulation"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-ensigna-primary text-white rounded-xl font-medium active:bg-ensigna-primary-dark disabled:opacity-60 transition-colors touch-manipulation"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando…
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        {isEdit ? 'Actualizar' : 'Guardar'}
                      </>
                    )}
                  </button>
                </div>
              </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
