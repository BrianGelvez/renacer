import type { PermissionModule } from '@/lib/permissions';

const SECTION_PERMISSION_MAP: Record<string, PermissionModule> = {
  overview: 'overview',
  clinic: 'clinic',
  team: 'team',
  invite: 'invite',
  availability: 'availability',
  schedule: 'schedule',
  patients: 'patients',
  prescriptions: 'prescriptions',
  orders: 'orders',
  conversations: 'conversations',
  finanzas: 'finance',
  reports: 'reports',
  auditoria: 'audit',
  settings: 'settings',
  recetario: 'settings',
};

export function resolvePermissionFromRoute(
  pathname: string | null,
  section?: string | null,
): PermissionModule | null {
  if (!pathname) return null;

  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    const querySection = section?.trim();
    if (querySection && SECTION_PERMISSION_MAP[querySection]) {
      return SECTION_PERMISSION_MAP[querySection];
    }
    return 'overview';
  }

  if (pathname.startsWith('/dashboard/agenda')) return 'schedule';
  if (pathname.startsWith('/dashboard/patients')) return 'patients';
  if (pathname.startsWith('/dashboard/prescriptions')) return 'prescriptions';
  if (pathname.startsWith('/dashboard/orders')) return 'orders';
  if (pathname.startsWith('/dashboard/conversaciones')) return 'conversations';
  if (pathname.startsWith('/dashboard/finanzas')) return 'finance';
  if (pathname.startsWith('/dashboard/reports')) return 'reports';
  if (pathname.startsWith('/dashboard/auditoria')) return 'audit';
  if (pathname.startsWith('/dashboard/integraciones')) return 'settings';

  return null;
}

export function resolveSectionPermission(section: string): PermissionModule {
  return SECTION_PERMISSION_MAP[section] ?? 'overview';
}
