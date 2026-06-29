'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardPermissionGate from '@/components/auth/DashboardPermissionGate';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { buildDashboardBreadcrumbs } from '@/lib/breadcrumbs';

function DashboardRouteLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isPatientDetail = pathname?.match(/^\/dashboard\/patients\/[^/]+$/);
  const isOrdersRoute = pathname?.startsWith('/dashboard/orders');
  const isPrescriptionsRoute = pathname?.startsWith('/dashboard/prescriptions');

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
    : isOrdersRoute
      ? 'orders'
      : isPrescriptionsRoute
        ? 'prescriptions'
        : pathSectionMap[pathname || ''] ??
          searchParams?.get('section') ??
          'overview';

  const breadcrumbItems = buildDashboardBreadcrumbs(
    pathname,
    searchParams?.get('section'),
  );

  return (
    <DashboardPermissionGate>
      <DashboardLayout activeSection={activeSection}>
        {breadcrumbItems.length > 0 && (
          <Breadcrumbs items={breadcrumbItems} />
        )}
        {children}
      </DashboardLayout>
    </DashboardPermissionGate>
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
