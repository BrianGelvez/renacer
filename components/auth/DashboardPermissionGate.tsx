'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { resolvePermissionFromRoute } from '@/lib/route-permissions';

export default function DashboardPermissionGate({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { canAccess } = usePermissions();

  const section = searchParams?.get('section');
  const requiredModule = resolvePermissionFromRoute(pathname, section);
  const allowed =
    !requiredModule || (isAuthenticated && canAccess(requiredModule));

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    if (requiredModule && !canAccess(requiredModule)) {
      router.replace('/403');
    }
  }, [
    isLoading,
    isAuthenticated,
    requiredModule,
    canAccess,
    router,
  ]);

  if (isLoading) {
    return null;
  }

  if (requiredModule && isAuthenticated && !allowed) {
    return null;
  }

  return <>{children}</>;
}
