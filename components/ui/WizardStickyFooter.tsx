'use client';

import type { ReactNode } from 'react';

export interface WizardStickyFooterProps {
  children: ReactNode;
  className?: string;
}

export default function WizardStickyFooter({
  children,
  className = '',
}: WizardStickyFooterProps) {
  return (
    <div
      className={`wizard-sticky-footer lg:mt-6 ${className}`}
      role="group"
      aria-label="Acciones del asistente"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-stretch gap-3 lg:justify-start">
        {children}
      </div>
    </div>
  );
}
