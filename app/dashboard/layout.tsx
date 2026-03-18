'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

function DashboardRouteLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isPatientDetail = pathname?.match(/^\/dashboard\/patients\/[^/]+$/);
  const activeSection = isPatientDetail
    ? 'patients'
    : (searchParams?.get('section') || 'overview');

  const handleSectionChange = (section: string) => {
    if (section === 'patients' && isPatientDetail) {
      router.push('/dashboard?section=patients');
    } else {
      router.push(`/dashboard?section=${section}`);
    }
  };

  return (
    <DashboardLayout
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
    >
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
