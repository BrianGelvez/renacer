'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Activity,
  Sparkles,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  UserPlus,
  UsersRound,
  Stethoscope,
  AlertCircle,
  Wallet,
  MessageCircle,
  CalendarClock,
  Pill,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import type { PermissionModule } from '@/lib/permissions';
import { apiClient } from '@/lib/api';
import DashboardCard from './DashboardCard';
import QuickActionModals, { type QuickActionKey } from './QuickActionModals';
import { SkeletonDashboardCards } from '@/components/ui/Skeleton';

type DashboardSummary = Awaited<ReturnType<typeof apiClient.getDashboardSummary>>;

interface StatCardProps {
  id: string;
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  href?: string;
  permission: PermissionModule;
  /** Texto secundario bajo el valor (p. ej. variación % ingresos) */
  trend?: { text: string; className: string };
  actionLabel?: string;
  roles?: Array<'OWNER' | 'ADMIN' | 'DOCTOR' | 'SECRETARY' | 'STAFF'>;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'Ahora';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return `Hace ${d} d`;
}

function formatUtcTime(iso: string): string {
  const dt = new Date(iso);
  const h = dt.getUTCHours();
  const min = dt.getUTCMinutes();
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function activityIcon(type: string) {
  switch (type) {
    case 'APPOINTMENT_CREATED':
      return <Calendar className="w-4 h-4 text-blue-600" />;
    case 'APPOINTMENT_CANCELED':
      return <XCircle className="w-4 h-4 text-red-600" />;
    case 'APPOINTMENT_CONFIRMED':
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case 'PATIENT_CREATED':
      return <UserPlus className="w-4 h-4 text-violet-600" />;
    case 'PROFESSIONAL_UPDATED':
      return <Stethoscope className="w-4 h-4 text-indigo-600" />;
    default:
      return <Activity className="w-4 h-4 text-gray-500" />;
  }
}

function upcomingStatusStyle(status: string): {
  dot: string;
  ring: string;
} {
  if (status === 'CONFIRMED')
    return { dot: 'bg-emerald-500', ring: 'ring-emerald-200' };
  if (status === 'PENDING_CONFIRMATION')
    return { dot: 'bg-[#D16A8A]', ring: 'ring-pink-200' };
  if (status === 'RESCHEDULE_REQUESTED')
    return { dot: 'bg-sky-500', ring: 'ring-sky-200' };
  if (status === 'NO_SHOW')
    return { dot: 'bg-red-500', ring: 'ring-red-200' };
  return { dot: 'bg-amber-500', ring: 'ring-amber-200' };
}

function countdownLabel(minutesUntil: number): string {
  if (minutesUntil <= 0) return 'Ahora';
  if (minutesUntil < 60) return `en ${minutesUntil} min`;
  const h = Math.floor(minutesUntil / 60);
  const m = minutesUntil % 60;
  return m ? `en ${h} h ${m} min` : `en ${h} h`;
}

function formatMoneyArs(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatMomPercentForUi(p: number): string {
  const rounded = Math.round(p * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 1e-9) {
    return String(Math.round(rounded));
  }
  return rounded.toFixed(1).replace('.', ',');
}

function monthlyIncomeTrend(summary: DashboardSummary): {
  text: string;
  className: string;
} {
  const cur = summary.monthlyIncome ?? 0;
  const pct =
    summary.monthlyIncomeMomPercent !== undefined
      ? summary.monthlyIncomeMomPercent
      : null;

  if (pct === null) {
    if (cur > 0) {
      return {
        text: 'Nuevo vs mes anterior (sin cobros registrados)',
        className: 'text-emerald-600',
      };
    }
    return {
      text: '0% vs mes anterior',
      className: 'text-gray-500',
    };
  }

  if (pct > 0) {
    return {
      text: `+${formatMomPercentForUi(pct)}% este mes`,
      className: 'text-emerald-600',
    };
  }
  if (pct < 0) {
    return {
      text: `${formatMomPercentForUi(pct)}% este mes`,
      className: 'text-red-600',
    };
  }
  return {
    text: '0% este mes',
    className: 'text-gray-500',
  };
}

export default function OverviewSection() {
  const router = useRouter();
  const { user, clinic } = useAuth();
  const { canAccess } = usePermissions();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickModal, setQuickModal] = useState<QuickActionKey | null>(null);

  const loadSummary = useCallback(async () => {
    setError(null);
    try {
      const data = await apiClient.getDashboardSummary();
      setSummary(data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'No se pudo cargar el resumen.',
      );
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
    const t = setInterval(loadSummary, 120_000);
    return () => clearInterval(t);
  }, [loadSummary]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const isDoctor = user?.role === 'DOCTOR';
  const currentRole = (user?.role ?? 'STAFF') as
    | 'OWNER'
    | 'ADMIN'
    | 'DOCTOR'
    | 'SECRETARY'
    | 'STAFF';
  const go = (href: string) => {
    router.push(href);
  };

  const incomeMomTrend = summary ? monthlyIncomeTrend(summary) : undefined;

  const allStats: StatCardProps[] = summary
    ? [
        {
          id: 'professionals',
          permission: 'team',
          title: 'Profesionales activos',
          value: String(summary.professionalsActive),
          icon: <Users className="w-6 h-6 text-white" />,
          color: 'bg-gradient-to-br from-blue-500 to-blue-600',
          href: '/dashboard?section=team',
          actionLabel: 'Revisar cobertura del equipo',
          roles: ['OWNER', 'ADMIN'],
        },
        {
          id: 'patients',
          permission: 'patients',
          title: 'Pacientes totales',
          value: String(summary.patientsTotal ?? 0),
          icon: <UsersRound className="w-6 h-6 text-white" />,
          color: 'bg-gradient-to-br from-[#D16A8A] to-[#E89AB0]',
          href: '/dashboard/patients',
          actionLabel: 'Buscar o crear paciente',
          roles: ['OWNER', 'ADMIN', 'DOCTOR', 'SECRETARY', 'STAFF'],
        },
        {
          id: 'appointments-today',
          permission: 'schedule',
          title: isDoctor ? 'Mis turnos hoy' : 'Turnos hoy',
          value: String(summary.appointmentsToday),
          icon: <Calendar className="w-6 h-6 text-white" />,
          color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
          href: '/dashboard/agenda?filter=hoy',
          actionLabel: isDoctor ? 'Abrir agenda clinica' : 'Gestionar agenda de hoy',
          roles: ['OWNER', 'ADMIN', 'DOCTOR', 'SECRETARY', 'STAFF'],
        },
        {
          id: 'appointments-pending',
          permission: 'schedule',
          title: 'Pendientes',
          value: String(summary.appointmentsPending),
          icon: <Clock className="w-6 h-6 text-white" />,
          color: 'bg-gradient-to-br from-amber-500 to-amber-600',
          href: '/dashboard/agenda?estado=pendiente_confirmacion',
          actionLabel: 'Confirmar o resolver turnos',
          roles: ['OWNER', 'ADMIN', 'DOCTOR', 'SECRETARY'],
        },
        {
          id: 'attendance',
          permission: 'reports',
          title: 'Tasa asistencia (7 días)',
          value: `${summary.attendanceRate}%`,
          icon: <Activity className="w-6 h-6 text-white" />,
          color: 'bg-gradient-to-br from-purple-500 to-purple-600',
          href: '/dashboard/reports',
          actionLabel: 'Detectar ausentismo',
          roles: ['OWNER', 'ADMIN'],
        },
        {
          id: 'prescriptions',
          permission: 'prescriptions',
          title: 'Recetas emitidas',
          value: String(
            summary.prescriptionsIssuedTotal ?? summary.medicalDocumentsTotal ?? 0,
          ),
          icon: <Pill className="w-6 h-6 text-white" />,
          color: 'bg-gradient-to-br from-indigo-500 to-violet-600',
          href: '/dashboard/prescriptions',
          actionLabel: 'Ver recetas o emitir nueva',
          roles: ['OWNER', 'ADMIN', 'DOCTOR', 'STAFF'],
        },
        {
          id: 'orders',
          permission: 'orders',
          title: 'Órdenes emitidas',
          value: String(summary.ordersIssuedTotal ?? 0),
          icon: <ClipboardList className="w-6 h-6 text-white" />,
          color: 'bg-gradient-to-br from-cyan-500 to-teal-600',
          href: '/dashboard/orders',
          actionLabel: 'Ver ordenes o crear nueva',
          roles: ['OWNER', 'ADMIN', 'DOCTOR', 'SECRETARY', 'STAFF'],
        },
        {
          id: 'finance',
          permission: 'finance',
          title: 'Ingresos mensuales',
          value: formatMoneyArs(summary.monthlyIncome ?? 0),
          icon: <Wallet className="w-6 h-6 text-white" />,
          color: 'bg-gradient-to-br from-teal-500 to-teal-600',
          trend: incomeMomTrend,
          href: '/dashboard/finanzas',
          actionLabel: 'Revisar cobros del mes',
          roles: ['OWNER'],
        },
      ]
    : [];

  const stats = allStats.filter(
    (stat) =>
      canAccess(stat.permission) &&
      (!stat.roles || stat.roles.includes(currentRole)),
  );

  type QuickActionDef = {
    key: QuickActionKey;
    label: string;
    icon: typeof Calendar;
    className: string;
    permission: PermissionModule;
  };

  const quickActionDefs: QuickActionDef[] = [
    {
      key: 'new',
      label: 'Nuevo turno',
      icon: Calendar,
      className: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      permission: 'schedule',
    },
    {
      key: 'agenda',
      label: 'Ver agenda',
      icon: Clock,
      className: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
      permission: 'schedule',
    },
    {
      key: 'patients',
      label: 'Pacientes',
      icon: Users,
      className: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
      permission: 'patients',
    },
    {
      key: 'reports',
      label: 'Reportes',
      icon: TrendingUp,
      className: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
      permission: 'reports',
    },
    {
      key: 'finanzas',
      label: 'Finanzas',
      icon: Wallet,
      className: 'bg-teal-50 text-teal-600 hover:bg-teal-100',
      permission: 'finance',
    },
    {
      key: 'availability',
      label: 'Disponibilidad',
      icon: CalendarClock,
      className: 'bg-sky-50 text-sky-600 hover:bg-sky-100',
      permission: 'availability',
    },
    {
      key: 'team',
      label: 'Equipo',
      icon: UsersRound,
      className: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
      permission: 'team',
    },
    {
      key: 'clinic',
      label: 'Mi clínica',
      icon: Building2,
      className: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
      permission: 'clinic',
    },
    {
      key: 'conversations',
      label: 'Conversaciones',
      icon: MessageCircle,
      className: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100',
      permission: 'conversations',
    },
    {
      key: 'invite',
      label: 'Invitaciones',
      icon: UserPlus,
      className: 'bg-violet-50 text-violet-600 hover:bg-violet-100',
      permission: 'invite',
    },
  ];

  const quickActions = quickActionDefs.filter((action) =>
    canAccess(action.permission),
  );

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[var(--ensigna-radius-lg)] bg-gradient-to-br from-[#D16A8A] via-[#d16a8a] to-[#E89AB0] p-6 sm:p-8 text-white shadow-ensigna"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/20 rounded-full blur-2xl" />

        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span className="text-sm font-medium text-white/80">
                  {new Date().toLocaleDateString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {getGreeting()}, {user?.name}
              </h1>
              <p className="mt-2 text-white/80 max-w-lg">
                {user?.role === 'OWNER'
                  ? 'Resumen operativo de tu clínica en tiempo real.'
                  : user?.role === 'ADMIN'
                    ? 'Métricas y turnos para la operación diaria.'
                    : user?.role === 'DOCTOR'
                      ? 'Tu agenda, pacientes y documentación clínica.'
                      : 'Tu agenda y tareas operativas del día.'}
              </p>
              {summary?.nextUpcoming && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    go(`/dashboard/agenda?appointmentId=${summary.nextUpcoming?.id}`)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      go(`/dashboard/agenda?appointmentId=${summary.nextUpcoming?.id}`);
                    }
                  }}
                  className="mt-4 inline-flex flex-col sm:flex-row sm:items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur-sm border border-white/20 max-w-xl cursor-pointer transition-all hover:scale-[1.01] hover:bg-white/20"
                  title="Ver detalles"
                >
                  <span className="font-semibold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    Próximo turno {countdownLabel(summary.nextUpcoming.minutesUntil)}
                  </span>
                  <span className="text-white/90">
                    {summary.nextUpcoming.patientName} ·{' '}
                    {formatUtcTime(summary.nextUpcoming.startTime)} ·{' '}
                    {summary.nextUpcoming.professionalName}
                  </span>
                </div>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/70">Clínica</p>
                <p className="font-semibold text-lg">
                  {clinic?.name || 'Renacer'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {summary?.alerts &&
        (summary.alerts.noShowRateHigh ||
          summary.alerts.pendingAppointmentsHigh) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 space-y-1">
              {summary.alerts.pendingAppointmentsHigh && (
                <p>
                  <strong>Alta carga:</strong> hay muchos turnos pendientes
                  (programados o confirmados) a futuro. Revisá la agenda.
                </p>
              )}
              {summary.alerts.noShowRateHigh && (
                <p>
                  <strong>Ausentismo elevado:</strong> en los últimos 7 días la
                  tasa de no presentación es alta respecto a turnos finalizados.
                </p>
              )}
            </div>
          </div>
        )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {(canAccess('prescriptions') || canAccess('orders') || canAccess('schedule')) && (
        <div className="grid grid-cols-1 gap-3 lg:hidden">
          {canAccess('prescriptions') && (
            <button
              type="button"
              onClick={() => router.push('/dashboard/prescriptions/new')}
              className="touch-row flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4 text-left text-indigo-800"
            >
              <span>
                <span className="block text-base font-semibold">Nueva receta</span>
                <span className="text-sm text-indigo-700">Emitir en segundos</span>
              </span>
              <Pill className="h-6 w-6" />
            </button>
          )}
          {canAccess('orders') && (
            <button
              type="button"
              onClick={() => router.push('/dashboard/orders/new')}
              className="touch-row flex items-center justify-between rounded-2xl border border-teal-100 bg-teal-50 px-4 py-4 text-left text-teal-800"
            >
              <span>
                <span className="block text-base font-semibold">Nueva orden</span>
                <span className="text-sm text-teal-700">Solicitudes y diagnóstico</span>
              </span>
              <ClipboardList className="h-6 w-6" />
            </button>
          )}
          {canAccess('schedule') && (
            <button
              type="button"
              onClick={() => router.push('/dashboard/agenda?filter=hoy')}
              className="touch-row flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-left text-emerald-800"
            >
              <span>
                <span className="block text-base font-semibold">Agenda de hoy</span>
                <span className="text-sm text-emerald-700">Turnos y confirmaciones</span>
              </span>
              <Calendar className="h-6 w-6" />
            </button>
          )}
        </div>
      )}

      {loading && !summary ? (
        <SkeletonDashboardCards count={currentRole === 'OWNER' ? 6 : 4} />
      ) : (
        <div
          className={`grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${
            stats.length >= 6
              ? 'xl:grid-cols-6'
              : stats.length >= 4
                ? 'lg:grid-cols-4'
                : 'lg:grid-cols-3'
          }`}
        >
          {stats.map((stat, index) => {
            const { id, permission: _permission, ...cardProps } = stat;
            return (
              <DashboardCard key={id} {...cardProps} delay={index * 0.1} />
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 min-w-0 ensigna-glass p-6 overflow-hidden transition-all duration-200 hover:shadow-ensigna-hover"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Acciones rápidas
          </h3>
          {(canAccess('prescriptions') || canAccess('orders')) && (
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {canAccess('prescriptions') && (
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/prescriptions/new')}
                  className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-left text-indigo-800 transition-colors hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  <span>
                    <span className="block text-sm font-semibold">Nueva receta</span>
                    <span className="text-xs text-indigo-700">Paciente, vademecum y diagnostico</span>
                  </span>
                  <Pill className="h-5 w-5" />
                </button>
              )}
              {canAccess('orders') && (
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/orders/new')}
                  className="flex items-center justify-between rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-left text-teal-800 transition-colors hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
                >
                  <span>
                    <span className="block text-sm font-semibold">Nueva orden</span>
                    <span className="text-xs text-teal-700">Solicitudes, plantillas y diagnostico</span>
                  </span>
                  <ClipboardList className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 min-w-0">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => setQuickModal(action.key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors min-h-[96px] touch-target sm:min-h-[92px] lg:min-h-0 ${action.className}`}
                >
                  <Icon className="w-6 h-6 shrink-0" />
                  <span className="text-sm font-medium text-center leading-tight">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="min-w-0 ensigna-glass p-6 overflow-hidden transition-all duration-200 hover:shadow-ensigna-hover"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Actividad reciente
          </h3>
          {!summary?.recentActivity?.length ? (
            <p className="text-sm text-gray-500">
              Aún no hay actividad registrada en el período reciente.
            </p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto overflow-x-hidden pr-2">
              {summary.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  role="button"
                  tabIndex={0}
                  title="Ver detalles"
                  onClick={() => {
                    const href = activity.type.startsWith('APPOINTMENT_')
                      ? '/dashboard/agenda'
                      : canAccess('reports')
                        ? '/dashboard/reports'
                        : '/dashboard/patients';
                    go(href);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      const href = activity.type.startsWith('APPOINTMENT_')
                        ? '/dashboard/agenda'
                        : canAccess('reports')
                          ? '/dashboard/reports'
                          : '/dashboard/patients';
                      go(href);
                    }
                  }}
                  className="group flex items-start gap-3 rounded-xl px-3 py-2.5 cursor-pointer border border-transparent bg-transparent transition-colors duration-200 hover:bg-ensigna-accent-soft/80 hover:border-[rgba(209,106,138,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ensigna-primary/40"
                >
                  <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-200/90 shadow-sm">
                    {activityIcon(activity.type)}
                  </div>
                  <div className="min-w-0 flex-1 group-hover:text-white">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-white">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2 group-hover:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 group-hover:text-white">
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="min-w-0 ensigna-glass p-6 overflow-hidden transition-all duration-200 hover:shadow-ensigna-hover"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Próximos turnos (hoy)
          </h3>
          <button
            type="button"
            onClick={() => router.push('/dashboard/agenda')}
            className="touch-target text-sm font-medium text-ensigna-primary hover:text-ensigna-primary-dark px-2 py-1"
          >
            Ver todos
          </button>
        </div>
        {!summary?.upcomingAppointments?.length ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            No hay turnos programados o confirmados para el resto del día.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:gap-4 lg:overflow-x-auto lg:py-2">
              {summary.upcomingAppointments.map((apt) => {
                const st = upcomingStatusStyle(apt.status);
                return (
                  <div
                    key={apt.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => go(`/dashboard/agenda?appointmentId=${apt.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        go(`/dashboard/agenda?appointmentId=${apt.id}`);
                      }
                    }}
                    className={`touch-row w-full rounded-xl border border-gray-100 bg-gray-50 p-4 ring-2 ${st.ring} transition-colors hover:border-gray-200 lg:w-52 lg:flex-shrink-0`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-gray-900">
                        {formatUtcTime(apt.startTime)}
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ring-2 ring-white ${st.dot}`}
                        title={apt.status}
                      />
                    </div>
                    <p className="font-medium text-gray-900 truncate">
                      {apt.patientName}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {apt.professionalName}
                    </p>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {apt.reason || 'Sin motivo indicado'}
                    </p>
                  </div>
                );
              })}
          </div>
        )}
      </motion.div>

      <QuickActionModals
        action={quickModal}
        onClose={() => setQuickModal(null)}
        dashboardSummary={summary}
        onDashboardRefresh={loadSummary}
      />
    </div>
  );
}
