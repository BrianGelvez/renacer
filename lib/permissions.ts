import type { ClinicTeamRole } from './api';

export const PERMISSION_MODULES = [
  'overview',
  'clinic',
  'team',
  'invite',
  'availability',
  'schedule',
  'patients',
  'prescriptions',
  'orders',
  'conversations',
  'finance',
  'reports',
  'audit',
  'settings',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export type PermissionAction =
  | 'access'
  | 'create'
  | 'edit'
  | 'delete'
  | 'configure';

const ALL: PermissionAction[] = [
  'access',
  'create',
  'edit',
  'delete',
  'configure',
];
const CRUD: PermissionAction[] = ['access', 'create', 'edit', 'delete'];

function ownerPermissions(): Record<PermissionModule, PermissionAction[]> {
  return PERMISSION_MODULES.reduce(
    (acc, module) => {
      acc[module] = ALL;
      return acc;
    },
    {} as Record<PermissionModule, PermissionAction[]>,
  );
}

export const ROLE_PERMISSIONS: Record<
  ClinicTeamRole,
  Partial<Record<PermissionModule, PermissionAction[]>>
> = {
  OWNER: ownerPermissions(),
  ADMIN: {
    overview: ALL,
    clinic: ALL,
    team: ALL,
    invite: ALL,
    availability: ALL,
    schedule: ALL,
    patients: ALL,
    prescriptions: ALL,
    orders: ALL,
    conversations: ALL,
    reports: ALL,
  },
  DOCTOR: {
    overview: ['access', 'edit'],
    availability: CRUD,
    schedule: CRUD,
    patients: CRUD,
    prescriptions: CRUD,
    orders: CRUD,
  },
  SECRETARY: {
    overview: ['access', 'edit'],
    schedule: CRUD,
    patients: CRUD,
    orders: CRUD,
  },
};

export function hasPermission(
  role: ClinicTeamRole | string | undefined | null,
  module: PermissionModule,
  action: PermissionAction = 'access',
): boolean {
  if (!role) return false;
  const rolePermissions = ROLE_PERMISSIONS[role as ClinicTeamRole];
  if (!rolePermissions) return false;
  const modulePermissions = rolePermissions[module];
  if (!modulePermissions) return false;
  return modulePermissions.includes(action);
}

export function canAccess(
  role: ClinicTeamRole | string | undefined | null,
  module: PermissionModule,
): boolean {
  return hasPermission(role, module, 'access');
}

export function canCreate(
  role: ClinicTeamRole | string | undefined | null,
  module: PermissionModule,
): boolean {
  return hasPermission(role, module, 'create');
}

export function canEdit(
  role: ClinicTeamRole | string | undefined | null,
  module: PermissionModule,
): boolean {
  return hasPermission(role, module, 'edit');
}

export function canDelete(
  role: ClinicTeamRole | string | undefined | null,
  module: PermissionModule,
): boolean {
  return hasPermission(role, module, 'delete');
}

export function canConfigure(
  role: ClinicTeamRole | string | undefined | null,
  module: PermissionModule,
): boolean {
  return hasPermission(role, module, 'configure');
}
