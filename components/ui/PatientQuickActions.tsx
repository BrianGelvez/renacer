'use client';

import Link from 'next/link';
import {
  Calendar,
  ClipboardList,
  MessageCircle,
  Pill,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export interface PatientQuickActionsProps {
  patientId: string;
  patientName: string;
  patientDni?: string | null;
  disabled?: boolean;
  className?: string;
}

export default function PatientQuickActions({
  patientId,
  patientName,
  patientDni,
  disabled = false,
  className = '',
}: PatientQuickActionsProps) {
  const { canAccess } = usePermissions();

  const actions = [
    canAccess('prescriptions') && {
      href: `/dashboard/prescriptions/new?patientId=${patientId}`,
      label: 'Nueva receta',
      icon: Pill,
      className: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100',
    },
    canAccess('orders') && {
      href: `/dashboard/orders/new?patientId=${patientId}`,
      label: 'Nueva orden',
      icon: ClipboardList,
      className: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-100',
    },
    canAccess('schedule') && {
      href: `/dashboard/agenda?patientId=${patientId}`,
      label: 'Nuevo turno',
      icon: Calendar,
      className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100',
    },
    canAccess('conversations') && {
      href: `/dashboard/conversaciones?patientDni=${encodeURIComponent(patientDni ?? patientName)}`,
      label: 'Conversación',
      icon: MessageCircle,
      className: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-100',
    },
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    icon: typeof Pill;
    className: string;
  }>;

  if (actions.length === 0 || disabled) return null;

  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${className}`}
      aria-label="Acciones rápidas del paciente"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Acciones rápidas
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ href, label, icon: Icon, className: btnClass }) => (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ensigna-primary ${btnClass}`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
