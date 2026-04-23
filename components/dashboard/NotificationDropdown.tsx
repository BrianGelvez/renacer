'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck, Loader2 } from 'lucide-react';

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type NotificationPanelProps = {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  onFetch: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onUnreadCountChange: (count: number) => void;
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function getNavigationForNotification(n: NotificationItem): string | null {
  const meta = n.metadata as { appointmentId?: string; patientId?: string } | null;
  if (!meta) return null;
  if (meta.appointmentId) return '/dashboard?section=schedule';
  if (meta.patientId) return `/dashboard/patients/${meta.patientId}`;
  return null;
}

export function NotificationDropdown({
  open,
  onClose,
  notifications,
  unreadCount,
  loading,
  onFetch,
  onMarkAsRead,
  onMarkAllAsRead,
  onUnreadCountChange,
}: NotificationPanelProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      onFetch();
    }
  }, [open, onFetch]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  const handleItemClick = (n: NotificationItem) => {
    if (!n.readAt) {
      onMarkAsRead(n.id);
      onUnreadCountChange(Math.max(0, unreadCount - 1));
    }
    const href = getNavigationForNotification(n);
    if (href) router.push(href);
    onClose();
  };

  const handleMarkAllAsRead = () => {
    onMarkAllAsRead();
    onUnreadCountChange(0);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="fixed top-16 right-4 left-4 z-50 sm:left-auto sm:w-[380px] ensigna-modal-panel overflow-hidden rounded-[var(--ensigna-radius)]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] bg-white/50">
          <h3 className="font-semibold text-[var(--ensigna-text)]">Notificaciones</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-xs font-medium text-ensigna-primary hover:text-ensigna-primary-dark flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas como leídas
            </button>
          )}
        </div>
        <div className="max-h-[min(70vh,400px)] overflow-y-auto bg-white/50">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-ensigna-primary-light animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-center text-[var(--ensigna-text-secondary)] py-8 px-4">
              No tenés notificaciones
            </p>
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={`group w-full text-left px-4 py-3 transition-all duration-200 hover:bg-ensigna-accent/70 ${
                      !n.readAt ? 'bg-ensigna-accent-soft/80' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {!n.readAt && (
                        <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-ensigna-primary" />
                      )}
                      <div className={`flex-1 min-w-0 ${!n.readAt ? '' : 'pl-5'}`}>
                        <p className="font-medium text-[var(--ensigna-text)] text-sm group-hover:text-white">
                          {n.title}
                        </p>
                        <p className="text-sm text-[var(--ensigna-text-secondary)] line-clamp-2 group-hover:text-white">
                          {n.message}
                        </p>
                        <p className="text-xs text-[var(--ensigna-text-secondary)]/80 mt-1 group-hover:text-white">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
