'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

function DashboardRouteLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isPatientDetail = pathname?.match(/^\/dashboard\/patients\/[^/]+$/);

  const pathSectionMap: Record<string, string> = {
    '/dashboard/agenda': 'schedule',
    '/dashboard/patients': 'patients',
    '/dashboard/conversaciones': 'conversations',
    '/dashboard/finanzas': 'finanzas',
    '/dashboard/reports': 'reports',
    '/dashboard/auditoria': 'auditoria',
    '/dashboard/integraciones/recetario': 'recetario',
  };

  const activeSection = isPatientDetail
    ? 'patients'
    : pathSectionMap[pathname || ''] ??
      searchParams?.get('section') ??
      'overview';

  return (
    <DashboardLayout activeSection={activeSection}>
      {children}
    </DashboardLayout>
  );
}

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <DashboardRouteLayoutInner>{children}</DashboardRouteLayoutInner>
    </Suspense>
  );
}
