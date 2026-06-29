export interface BreadcrumbItem {
  label: string;
  href?: string;
}

const SECTION_LABELS: Record<string, string> = {
  overview: 'Resumen',
  clinic: 'Mi Clínica',
  team: 'Equipo',
  invite: 'Invitaciones',
  availability: 'Disponibilidad',
  settings: 'Configuración',
};

export function buildDashboardBreadcrumbs(
  pathname: string | null,
  searchSection?: string | null,
): BreadcrumbItem[] {
  if (!pathname?.startsWith('/dashboard')) return [];

  const items: BreadcrumbItem[] = [];

  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    const section = searchSection?.trim();
    if (section && section !== 'overview' && SECTION_LABELS[section]) {
      return [{ label: SECTION_LABELS[section] }];
    }
    return [{ label: 'Resumen' }];
  }

  const segments = pathname.replace(/^\/dashboard\/?/, '').split('/').filter(Boolean);

  if (segments[0] === 'patients') {
    items.push({ label: 'Pacientes', href: '/dashboard/patients' });
    if (segments[1]) items.push({ label: 'Detalle del paciente' });
    return items;
  }

  if (segments[0] === 'prescriptions') {
    items.push({ label: 'Recetas', href: '/dashboard/prescriptions' });
    if (segments[1] === 'new') items.push({ label: 'Nueva receta' });
    else if (segments[1] === 'pending') {
      items.push({ label: 'Pendientes', href: '/dashboard/prescriptions/pending' });
      if (segments[2]) items.push({ label: 'Detalle' });
    } else if (segments[1]) items.push({ label: 'Detalle' });
    return items;
  }

  if (segments[0] === 'orders') {
    items.push({ label: 'Órdenes', href: '/dashboard/orders' });
    if (segments[1] === 'new') items.push({ label: 'Nueva orden' });
    else if (segments[1] === 'pending') {
      items.push({ label: 'Pendientes', href: '/dashboard/orders/pending' });
      if (segments[2]) items.push({ label: 'Detalle' });
    } else if (segments[1]) items.push({ label: 'Detalle' });
    return items;
  }

  const routeLabels: Record<string, string> = {
    agenda: 'Agenda',
    conversaciones: 'Conversaciones',
    finanzas: 'Finanzas',
    reports: 'Reportes',
    auditoria: 'Auditoría',
    integraciones: 'Integraciones',
  };

  const root = segments[0];
  if (routeLabels[root]) {
    items.push({ label: routeLabels[root] });
    if (root === 'integraciones' && segments[1]) {
      items.push({ label: 'Recetario' });
    }
  }

  return items;
}
