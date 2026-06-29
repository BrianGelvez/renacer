'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color: string;
  href?: string;
  delay?: number;
  trend?: { text: string; className: string };
  actionLabel?: string;
}

export default function DashboardCard({
  title,
  value,
  icon,
  color,
  href,
  delay = 0,
  trend,
  actionLabel,
}: DashboardCardProps) {
  const router = useRouter();
  const isClickable = Boolean(href);

  const go = () => {
    if (!href) return;
    router.push(href);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      onClick={isClickable ? go : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                go();
              }
            }
          : undefined
      }
      title={isClickable ? 'Ver detalles' : undefined}
      className={`ensigna-card relative min-w-0 ${
        isClickable ? 'ensigna-card-interactive cursor-pointer active:translate-y-0' : ''
      }`}
    >
      {isClickable && (
        <div className="absolute inset-0 rounded-[var(--ensigna-radius-lg)] bg-black/[0.03] opacity-0 hover:opacity-100 transition pointer-events-none" />
      )}
      <div className="relative flex items-start justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-sm font-medium text-[var(--ensigna-text-secondary)]">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--ensigna-text)]">{value}</p>
          {trend ? (
            <p className={`mt-1.5 text-sm ${trend.className}`}>{trend.text}</p>
          ) : null}
          {actionLabel ? (
            <p className="mt-3 text-xs font-semibold text-ensigna-primary">
              {actionLabel}
            </p>
          ) : null}
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
