'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Ruta de navegación" className="mb-4 min-w-0">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-[var(--ensigna-text-secondary)]">
        <li>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:text-ensigna-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ensigna-primary"
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Inicio</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
              {isLast || !item.href ? (
                <span
                  className="truncate font-medium text-[var(--ensigna-text)]"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="truncate transition-colors hover:text-ensigna-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ensigna-primary"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
