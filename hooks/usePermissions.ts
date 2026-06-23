'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicTeamRole } from '@/lib/api';
import {
  canAccess as checkAccess,
  canCreate as checkCreate,
  canDelete as checkDelete,
  canEdit as checkEdit,
  canConfigure as checkConfigure,
  type PermissionModule,
} from '@/lib/permissions';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role as ClinicTeamRole | undefined;

  return useMemo(
    () => ({
      role,
      canAccess: (module: PermissionModule) => checkAccess(role, module),
      canCreate: (module: PermissionModule) => checkCreate(role, module),
      canEdit: (module: PermissionModule) => checkEdit(role, module),
      canDelete: (module: PermissionModule) => checkDelete(role, module),
      canConfigure: (module: PermissionModule) => checkConfigure(role, module),
    }),
    [role],
  );
}
