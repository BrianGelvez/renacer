'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  className = '',
}: EmptyStateProps) {
  const primaryButton = actionLabel ? (
    actionHref ? (
      <Link
        href={actionHref}
        className="btn-ensigna-primary inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium"
      >
        {actionLabel}
      </Link>
    ) : (
      <button
        type="button"
        onClick={onAction}
        className="btn-ensigna-primary inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium"
      >
        {actionLabel}
      </button>
    )
  ) : null;

  return (
    <div
      className={`ensigna-empty-state flex flex-col items-center justify-center text-center px-6 py-12 ${className}`}
      role="status"
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ensigna-accent-soft)] text-ensigna-primary">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--ensigna-text)]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-[var(--ensigna-text-secondary)]">
          {description}
        </p>
      )}
      {(primaryButton || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {primaryButton}
          {secondaryActionLabel && secondaryActionHref && (
            <Link
              href={secondaryActionHref}
              className="text-sm font-medium text-ensigna-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ensigna-primary"
            >
              {secondaryActionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
