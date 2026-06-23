'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import type { PermissionModule } from '@/lib/permissions';

interface RoleGuardProps {
  permission: PermissionModule;
  action?: 'access' | 'create' | 'edit' | 'delete' | 'configure';
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({
  permission,
  action = 'access',
  children,
  fallback = null,
}: RoleGuardProps) {
  const router = useRouter();
  const { canAccess, canCreate, canEdit, canDelete, canConfigure } =
    usePermissions();

  const allowed = (() => {
    switch (action) {
      case 'create':
        return canCreate(permission);
      case 'edit':
        return canEdit(permission);
      case 'delete':
        return canDelete(permission);
      case 'configure':
        return canConfigure(permission);
      default:
        return canAccess(permission);
    }
  })();

  useEffect(() => {
    if (!allowed) {
      router.replace('/403');
    }
  }, [allowed, router]);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
