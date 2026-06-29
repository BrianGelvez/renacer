'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface WizardSummaryItem {
  id: string;
  label: string;
  value?: string | null;
  complete?: boolean;
  multiline?: boolean;
}

export interface WizardSummaryPanelProps {
  title?: string;
  items: WizardSummaryItem[];
  accent?: 'indigo' | 'teal';
  currentStep: number;
  totalSteps: number;
}

function SummaryContent({
  items,
  accent,
  currentStep,
  totalSteps,
  title,
}: WizardSummaryPanelProps) {
  const accentText =
    accent === 'teal' ? 'text-teal-700' : 'text-indigo-700';
  const accentDot =
    accent === 'teal' ? 'bg-teal-600' : 'bg-indigo-600';

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">{title ?? 'Resumen en curso'}</h2>
        <span className={`text-xs font-medium ${accentText}`}>
          Paso {currentStep}/{totalSteps}
        </span>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/80">
        <div
          className={`h-full rounded-full ${accentDot} transition-all duration-300`}
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      <dl className="space-y-3">
        {items.map((item) => (
          <div key={item.id}>
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
              {item.complete ? (
                <Check className={`h-3.5 w-3.5 ${accentText}`} aria-hidden />
              ) : (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300" />
              )}
              {item.label}
            </dt>
            <dd
              className={`mt-1 text-sm ${
                item.value ? 'font-medium text-gray-900' : 'text-gray-400 italic'
              } ${item.multiline ? 'whitespace-pre-wrap' : 'truncate'}`}
            >
              {item.value || 'Pendiente'}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}

export default function WizardSummaryPanel({
  title = 'Resumen en curso',
  items,
  accent = 'indigo',
  currentStep,
  totalSteps,
}: WizardSummaryPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const accentBorder =
    accent === 'teal' ? 'border-teal-100' : 'border-indigo-100';
  const accentBg =
    accent === 'teal' ? 'bg-teal-50/60' : 'bg-indigo-50/60';
  const accentText =
    accent === 'teal' ? 'text-teal-700' : 'text-indigo-700';
  const completedCount = items.filter((item) => item.complete).length;

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className={`flex w-full touch-row items-center justify-between rounded-2xl border ${accentBorder} ${accentBg} px-4 py-3 text-left`}
          aria-expanded={mobileOpen}
        >
          <span>
            <span className="block text-sm font-semibold text-gray-900">{title}</span>
            <span className={`text-xs font-medium ${accentText}`}>
              Paso {currentStep}/{totalSteps} · {completedCount}/{items.length} completos
            </span>
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {mobileOpen && (
          <div
            className={`mt-2 rounded-2xl border ${accentBorder} ${accentBg} p-4`}
            aria-label="Resumen del trámite"
          >
            <SummaryContent
              title={title}
              items={items}
              accent={accent}
              currentStep={currentStep}
              totalSteps={totalSteps}
            />
          </div>
        )}
      </div>

      <aside
        className={`sticky top-24 hidden h-fit rounded-2xl border ${accentBorder} ${accentBg} p-5 lg:block`}
        aria-label="Resumen del trámite"
      >
        <SummaryContent
          title={title}
          items={items}
          accent={accent}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      </aside>
    </>
  );
}
