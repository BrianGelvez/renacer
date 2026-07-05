"use client";

import { ReactNode, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserPlus,
  Calendar,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Sparkles,
  BarChart3,
  Wallet,
  MessageCircle,
  ShieldCheck,
  Pill,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionModule } from "@/lib/permissions";
import { apiClient } from "@/lib/api";
import { useNotificationsSocket } from "@/hooks/useNotificationsSocket";
import {
  NotificationDropdown,
  type NotificationItem,
} from "./NotificationDropdown";
import GlobalSearch from "./GlobalSearch";

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  href: string;
  permission: PermissionModule;
  badge?: number;
}

interface DashboardLayoutProps {
  children: ReactNode;
  activeSection?: string;
}

const MOBILE_BOTTOM_PRIORITY = [
  "overview",
  "patients",
  "schedule",
  "prescriptions",
  "orders",
] as const;

const navItems: NavItem[] = [
  {
    id: "overview",
    label: "Resumen",
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: "/dashboard",
    permission: "overview",
  },
  {
    id: "clinic",
    label: "Mi Clínica",
    icon: <Building2 className="w-5 h-5" />,
    href: "/dashboard?section=clinic",
    permission: "clinic",
  },
  {
    id: "team",
    label: "Equipo",
    icon: <Users className="w-5 h-5" />,
    href: "/dashboard?section=team",
    permission: "team",
  },
  {
    id: "invite",
    label: "Invitaciones",
    icon: <UserPlus className="w-5 h-5" />,
    href: "/dashboard?section=invite",
    permission: "invite",
  },
  {
    id: "availability",
    label: "Disponibilidad",
    icon: <Clock className="w-5 h-5" />,
    href: "/dashboard?section=availability",
    permission: "availability",
  },
  {
    id: "schedule",
    label: "Agenda",
    icon: <Calendar className="w-5 h-5" />,
    href: "/dashboard/agenda",
    permission: "schedule",
  },
  {
    id: "patients",
    label: "Pacientes",
    icon: <Users className="w-5 h-5" />,
    href: "/dashboard/patients",
    permission: "patients",
  },
  {
    id: "prescriptions",
    label: "Recetas",
    icon: <Pill className="w-5 h-5" />,
    href: "/dashboard/prescriptions",
    permission: "prescriptions",
  },
  {
    id: "orders",
    label: "Órdenes",
    icon: <ClipboardList className="w-5 h-5" />,
    href: "/dashboard/orders",
    permission: "orders",
  },
  {
    id: "conversations",
    label: "Conversaciones",
    icon: <MessageCircle className="w-5 h-5" />,
    href: "/dashboard/conversaciones",
    permission: "conversations",
  },
  {
    id: "finanzas",
    label: "Finanzas",
    icon: <Wallet className="w-5 h-5" />,
    href: "/dashboard/finanzas",
    permission: "finance",
  },
  {
    id: "reports",
    label: "Reportes",
    icon: <BarChart3 className="w-5 h-5" />,
    href: "/dashboard/reports",
    permission: "reports",
  },
  {
    id: "auditoria",
    label: "Auditoría",
    icon: <ShieldCheck className="w-5 h-5" />,
    href: "/dashboard/auditoria",
    permission: "audit",
  },
  {
    id: "settings",
    label: "Configuración",
    icon: <Settings className="w-5 h-5" />,
    href: "/dashboard?section=settings",
    permission: "settings",
  },
];

export default function DashboardLayout({
  children,
  activeSection = "overview",
}: DashboardLayoutProps) {
  const { user, clinic, logout } = useAuth();
  const { canAccess } = usePermissions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [drawerTouchStartX, setDrawerTouchStartX] = useState<number | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Notifications
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setNotificationLoading(true);
    try {
      const res = await apiClient.getNotifications();
      setNotifications(res.notifications);
      setNotificationUnreadCount(res.unreadCount);
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  const markNotificationAsRead = useCallback(async (id: string) => {
    await apiClient.markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    await apiClient.markAllNotificationsAsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
    setNotificationUnreadCount(0);
  }, []);

  // Initial unread count for badge
  useEffect(() => {
    apiClient
      .getNotifications()
      .then((res) => setNotificationUnreadCount(res.unreadCount))
      .catch(() => {});
  }, []);

  // Realtime notifications (Socket.IO)
  useNotificationsSocket(
    user?.id ?? null,
    useMemo(
      () => ({
        onNewNotification: (n: NotificationItem) => {
          if (!n?.id) return;
          setNotifications((prev) => {
            const exists = prev.some((x) => x.id === n.id);
            if (exists) return prev;
            return [n, ...prev].slice(0, 50);
          });
          if (!n.readAt) {
            setNotificationUnreadCount((c) => c + 1);
          }
        },
        onNotificationRead: (payload: any) => {
          if (payload?.all === true) {
            setNotifications((prev) =>
              prev.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })),
            );
            setNotificationUnreadCount(0);
            return;
          }
          const id = payload?.id;
          const readAt = payload?.readAt ? String(payload.readAt) : new Date().toISOString();
          if (!id) return;
          setNotifications((prev) => {
            let decremented = false;
            const next = prev.map((x) => {
              if (x.id !== id) return x;
              if (!x.readAt) decremented = true;
              return { ...x, readAt };
            });
            if (decremented) {
              setNotificationUnreadCount((c) => Math.max(0, c - 1));
            }
            return next;
          });
        },
      }),
      [],
    ),
  );

  // Update time every minute. Inicializamos en cliente (useEffect) para
  // evitar hydration mismatch: el formateo `toLocaleTimeString` produce
  // strings con caracteres invisibles distintos según el ICU de Node vs
  // del navegador (NBSP vs espacio normal antes de a. m. / p. m.).
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Filter nav items by user role
  const filteredNavItems = navItems.filter((item) =>
    canAccess(item.permission),
  );

  const mobileBottomNavItems = useMemo(
    () =>
      MOBILE_BOTTOM_PRIORITY.map((id) =>
        filteredNavItems.find((item) => item.id === id),
      )
        .filter((item): item is NavItem => Boolean(item))
        .slice(0, 4),
    [filteredNavItems],
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "from-[#D16A8A] to-[#E89AB0]";
      case "ADMIN":
        return "from-amber-500 to-orange-600";
      case "DOCTOR":
        return "from-emerald-500 to-teal-600";
      case "SECRETARY":
        return "from-sky-500 to-blue-600";
      case "STAFF":
        return "from-emerald-500 to-teal-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "OWNER":
        return "Propietario";
      case "ADMIN":
        return "Administrador";
      case "DOCTOR":
        return "Médico";
      case "SECRETARY":
        return "Recepción";
      case "STAFF":
        return "Médico";
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen ensigna-page-bg overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen hidden lg:flex flex-col ensigna-sidebar transition-all duration-300 ${
          isSidebarCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Logo & Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <Link href="/" className="flex items-center gap-3 min-h-10">
            <div className="relative h-10 w-10 flex-shrink-0">
              <Image
                src="/logo-renacer.png"
                alt="Renacer"
                fill
                className="object-contain"
                priority
              />
            </div>
            {!isSidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold text-[var(--ensigna-text)]"
              >
                Renacer
              </motion.span>
            )}
          </Link>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-black/[0.04] text-[var(--ensigna-text-secondary)] transition-colors"
          >
            <ChevronRight
              className={`w-5 h-5 transition-transform duration-300 ${
                isSidebarCollapsed ? "" : "rotate-180"
              }`}
            />
          </button>
        </div>

        {/* User Profile Card */}
        <div className={`p-4 ${isSidebarCollapsed ? "px-2" : ""}`}>
          <div
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getRoleColor(
              user?.role || "",
            )} p-4 text-white ${isSidebarCollapsed ? "p-3" : ""}`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              {isSidebarCollapsed ? (
                <div className="w-10 h-10 mx-auto rounded-xl bg-white/20 flex items-center justify-center text-lg font-bold">
                  {user?.name?.[0]}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">
                      {user?.name?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">
                        {user?.name} {user?.lastName}
                      </p>
                      <p className="text-sm text-white/80 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {getRoleName(user?.role || "")}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                      isActive
                        ? "bg-ensigna-accent text-ensigna-primary"
                        : "text-[var(--ensigna-text-secondary)] hover:bg-black/[0.04] hover:text-[var(--ensigna-text)]"
                    } ${isSidebarCollapsed ? "justify-center" : ""}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute left-0 inset-y-2 w-1 bg-ensigna-primary rounded-r-full"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    <span
                      className={`flex-shrink-0 ${
                        isActive
                          ? "text-ensigna-primary"
                          : "text-[var(--ensigna-text-secondary)] group-hover:text-[var(--ensigna-text)]"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!isSidebarCollapsed && (
                      <>
                        <span className="font-medium flex-1 text-left">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-ensigna-accent-soft text-ensigna-primary rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isSidebarCollapsed && item.badge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold bg-ensigna-primary text-white rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Clinic Info & Logout */}
        <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08]">
          {!isSidebarCollapsed && clinic && (
            <div className="mb-4 p-3 rounded-xl ensigna-glass">
              <p className="text-xs font-medium text-[var(--ensigna-text-secondary)] uppercase tracking-wider mb-1">
                Clínica
              </p>
              <p className="font-semibold text-[var(--ensigna-text)] truncate">
                {clinic.name}
              </p>
            </div>
          )}
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-ensigna-accent hover:text-ensigna-primary transition-colors ${
              isSidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!isSidebarCollapsed && (
              <span className="font-medium">Cerrar sesión</span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 ensigna-header-public safe-area-pt">
        <div className="flex items-center justify-between gap-2 px-3 h-14">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="touch-target inline-flex items-center justify-center rounded-xl text-[var(--ensigna-text-secondary)] hover:bg-black/[0.04]"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-2 px-1">
            <div className="relative h-9 w-9 shrink-0">
              <Image
                src="/logo-renacer.png"
                alt="Renacer"
                fill
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--ensigna-text)]">
                {clinic?.name || "Renacer"}
              </p>
              <p className="truncate text-xs text-[var(--ensigna-text-secondary)]">
                {user?.name}
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-1">
            <GlobalSearch canAccess={canAccess} compact />
            <button
              type="button"
              onClick={() => setIsNotificationOpen(true)}
              className="touch-target relative inline-flex items-center justify-center rounded-xl text-[var(--ensigna-text-secondary)] hover:bg-black/[0.04]"
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              {notificationUnreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-ensigna-primary text-white rounded-full flex items-center justify-center">
                  {notificationUnreadCount > 99
                    ? "99+"
                    : notificationUnreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 z-50 ensigna-modal-backdrop"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[min(320px,88vw)] ensigna-sidebar shadow-ensigna-hover safe-area-pt safe-area-pb"
              onTouchStart={(event) =>
                setDrawerTouchStartX(event.touches[0]?.clientX ?? null)
              }
              onTouchMove={(event) => {
                if (drawerTouchStartX === null) return;
                const delta = (event.touches[0]?.clientX ?? 0) - drawerTouchStartX;
                if (delta < -72) {
                  setIsMobileMenuOpen(false);
                  setDrawerTouchStartX(null);
                }
              }}
              onTouchEnd={() => setDrawerTouchStartX(null)}
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                <Link href="/" className="flex items-center gap-3 min-h-10">
                  <div className="relative h-10 w-10">
                    <Image
                      src="/logo-renacer.png"
                      alt="Renacer"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-xl font-bold text-[var(--ensigna-text)]">
                    Renacer
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="touch-target inline-flex items-center justify-center rounded-xl hover:bg-black/[0.04] text-[var(--ensigna-text-secondary)]"
                  aria-label="Cerrar menú"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile User Card */}
              <div className="p-4">
                <div
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getRoleColor(
                    user?.role || "",
                  )} p-4 text-white`}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">
                      {user?.name?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">
                        {user?.name} {user?.lastName}
                      </p>
                      <div className="flex items-center gap-1.5 text-sm text-white/80">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{getRoleName(user?.role || "")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Nav */}
              <nav className="px-3 py-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                <ul className="space-y-1">
                  {filteredNavItems.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 min-h-12 rounded-xl transition-all touch-row ${
                            isActive
                              ? "bg-ensigna-accent text-ensigna-primary"
                              : "text-[var(--ensigna-text-secondary)] hover:bg-black/[0.04]"
                          }`}
                        >
                          {item.icon}
                          <span className="font-medium flex-1 text-left">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-ensigna-accent-soft text-ensigna-primary rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Mobile Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-black/[0.06] ensigna-glass">
                {clinic && (
                  <div className="mb-3 p-3 rounded-xl ensigna-glass">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clínica
                    </p>
                    <p className="font-semibold text-gray-900">{clinic.name}</p>
                  </div>
                )}
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-ensigna-accent text-ensigna-primary font-medium hover:bg-ensigna-accent-soft transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 ensigna-header-public border-t safe-area-pb">
        <div className="flex items-stretch justify-around px-1 py-1">
          {mobileBottomNavItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="mobile-bottom-nav-item relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBottomNav"
                    className="absolute inset-0 bg-ensigna-accent rounded-xl"
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  />
                )}
                <span
                  className={`relative z-10 ${
                    isActive ? "text-ensigna-primary" : "text-gray-400"
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`relative z-10 text-[11px] font-medium leading-none ${
                    isActive ? "text-ensigna-primary" : "text-gray-500"
                  }`}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <span className="absolute top-0.5 right-2 min-w-[16px] h-4 px-1 text-[10px] font-bold bg-ensigna-primary text-white rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="mobile-bottom-nav-item relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-gray-500"
            aria-label="Más opciones"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[11px] font-medium leading-none">Más</span>
          </button>
        </div>
      </nav>

      {/* Main Content: ancho = viewport - sidebar para no desbordar a la derecha */}
      <main
        className={`transition-all duration-300 overflow-x-hidden min-w-0 ${
          isSidebarCollapsed
            ? "lg:ml-20 lg:w-[calc(100vw-5rem)]"
            : "lg:ml-72 lg:w-[calc(100vw-18rem)]"
        } pt-14 lg:pt-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0`}
      >
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-6 lg:px-8 h-16 min-w-0 mx-4 lg:mx-8 mt-4 ensigna-dashboard-header">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white drop-shadow-sm">
                {filteredNavItems.find((item) => item.id === activeSection)
                ?.label || "Dashboard"}                
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <GlobalSearch canAccess={canAccess} />
            <button
              type="button"
              onClick={() => setIsNotificationOpen(true)}
              className="relative p-2 rounded-xl hover:bg-white/15 text-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notificationUnreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-white text-ensigna-primary rounded-full flex items-center justify-center">
                  {notificationUnreadCount > 99
                    ? "99+"
                    : notificationUnreadCount}
                </span>
              )}
            </button>
            <div className="h-8 w-px bg-white/25" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden xl:block">
                <p className="text-sm font-medium text-white">
                  {user?.name} {user?.lastName}
                </p>
                <p
                  className="text-xs text-white/75"
                  suppressHydrationWarning
                >
                  {currentTime
                    ? currentTime.toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getRoleColor(
                  user?.role || "",
                )} flex items-center justify-center text-white font-bold shadow-lg shadow-ensigna-primary/25`}
              >
                {user?.name?.[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content: min-w-0 para que grid/flex hijos puedan reducir y no provoquen overflow */}
        <div className="p-4 sm:p-6 lg:p-8 min-w-0 max-w-full">{children}</div>
      </main>

      <NotificationDropdown
        open={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        unreadCount={notificationUnreadCount}
        loading={notificationLoading}
        onFetch={fetchNotifications}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllAsRead={markAllNotificationsAsRead}
        onUnreadCountChange={setNotificationUnreadCount}
      />
    </div>
  );
}
