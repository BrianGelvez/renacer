'use client';

import type { ReactNode } from 'react';

export interface MobileDataCardField {
  label: string;
  value: ReactNode;
}

export interface MobileDataCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  fields?: MobileDataCardField[];
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function MobileDataCard({
  title,
  subtitle,
  badge,
  fields = [],
  actions,
  onClick,
  className = '',
}: MobileDataCardProps) {
  const Wrapper = onClick ? 'button' : 'article';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`mobile-data-card w-full text-left ${onClick ? 'touch-row transition-colors active:bg-gray-50' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-gray-900">{title}</p>
          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        {badge}
      </div>

      {fields.length > 0 && (
        <dl className="mt-3 space-y-2">
          {fields.map((field) => (
            <div key={field.label} className="flex flex-wrap gap-x-2 text-sm">
              <dt className="text-gray-500">{field.label}:</dt>
              <dd className="font-medium text-gray-800">{field.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {actions && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {actions}
        </div>
      )}
    </Wrapper>
  );
}
