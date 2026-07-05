'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Mail,
  Loader2,
  AlertCircle,
  ShieldPlus,
  Stethoscope,
  Send,
  Clock,
  Copy,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

type InviteType = 'admin' | 'doctor';

type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

interface RecentInviteItem {
  id: string;
  type: 'admin' | 'doctor';
  email: string;
  role: string;
  status: InviteStatus;
  date: string;
  dateRaw: Date;
  invitedBy: string | null;
  inviteUrl: string | null;
}

interface InviteSectionProps {
  refreshKey?: number;
  canInviteAdmin?: boolean;
}

const STATUS_BADGE: Record<
  InviteStatus,
  { label: string; className: string }
> = {
  PENDING: { label: 'Pendiente', className: 'bg-amber-100 text-amber-700' },
  ACCEPTED: { label: 'Aceptada', className: 'bg-emerald-100 text-emerald-700' },
  EXPIRED: { label: 'Expirada', className: 'bg-gray-100 text-gray-600' },
  CANCELLED: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
};

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30)
    return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) === 1 ? '' : 's'}`;
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function mapStatus(raw: string | undefined, inv: {
  usedAt: string | null;
  expiresAt: string;
  cancelledAt?: string | null;
}): InviteStatus {
  if (raw && ['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'].includes(raw)) {
    return raw as InviteStatus;
  }
  if (inv.cancelledAt) return 'CANCELLED';
  if (inv.usedAt) return 'ACCEPTED';
  if (new Date(inv.expiresAt) < new Date()) return 'EXPIRED';
  return 'PENDING';
}

export default function InviteSection({
  refreshKey = 0,
  canInviteAdmin = true,
}: InviteSectionProps) {
  const toast = useToast();
  const [inviteType, setInviteType] = useState<InviteType>(
    canInviteAdmin ? 'admin' : 'doctor',
  );
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentInvites, setRecentInvites] = useState<RecentInviteItem[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [inviteListKey, setInviteListKey] = useState(0);
  const [actionId, setActionId] = useState<string | null>(null);

  const emailValid = useMemo(() => isValidEmail(email), [email]);

  useEffect(() => {
    if (!canInviteAdmin) setInviteType('doctor');
  }, [canInviteAdmin]);

  useEffect(() => {
    setLoadingInvites(true);
    const load = async () => {
      try {
        const adminPromise = canInviteAdmin
          ? apiClient.getAdminInvites()
          : Promise.resolve([]);
        const [adminInvites, doctorInvRows] = await Promise.all([
          adminPromise,
          apiClient.getDoctorInvites(),
        ]);
        const items: RecentInviteItem[] = [];

        (
          adminInvites as Array<{
            id: string;
            email: string;
            role?: string;
            status?: string;
            createdAt: string;
            expiresAt: string;
            usedAt: string | null;
            cancelledAt?: string | null;
            invitedBy?: string | null;
            inviteUrl?: string | null;
          }>
        )?.forEach((inv) => {
          const date = new Date(inv.createdAt);
          items.push({
            id: inv.id,
            type: 'admin',
            email: inv.email,
            role: 'Administrador',
            status: mapStatus(inv.status, inv),
            date: formatRelativeDate(date),
            dateRaw: date,
            invitedBy: inv.invitedBy ?? null,
            inviteUrl: inv.inviteUrl ?? null,
          });
        });

        (
          doctorInvRows as Array<{
            id: string;
            email: string;
            role?: string;
            status?: string;
            createdAt: string;
            expiresAt: string;
            usedAt: string | null;
            cancelledAt?: string | null;
            invitedBy?: string | null;
            inviteUrl?: string | null;
          }>
        )?.forEach((inv) => {
          const date = new Date(inv.createdAt);
          items.push({
            id: inv.id,
            type: 'doctor',
            email: inv.email,
            role: 'Médico',
            status: mapStatus(inv.status, inv),
            date: formatRelativeDate(date),
            dateRaw: date,
            invitedBy: inv.invitedBy ?? null,
            inviteUrl: inv.inviteUrl ?? null,
          });
        });

        items.sort((a, b) => b.dateRaw.getTime() - a.dateRaw.getTime());
        setRecentInvites(items);
      } catch {
        setRecentInvites([]);
      } finally {
        setLoadingInvites(false);
      }
    };
    load();
  }, [refreshKey, canInviteAdmin, inviteListKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid || loading) return;

    setLoading(true);
    try {
      if (inviteType === 'admin') {
        await apiClient.inviteAdmin(email.trim());
      } else {
        await apiClient.inviteDoctorByEmail(email.trim());
      }
      toast.success('Invitación enviada correctamente.');
      setEmail('');
      setInviteListKey((k) => k + 1);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'No se pudo enviar la invitación.';
      toast.error(typeof message === 'string' ? message : 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado al portapapeles.');
    } catch {
      toast.error('No se pudo copiar el enlace.');
    }
  };

  const handleResend = async (invite: RecentInviteItem) => {
    setActionId(invite.id);
    try {
      if (invite.type === 'admin') {
        await apiClient.resendAdminInvite(invite.id);
      } else {
        await apiClient.resendDoctorInvite(invite.id);
      }
      toast.success('Invitación reenviada.');
      setInviteListKey((k) => k + 1);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'No se pudo reenviar la invitación.';
      toast.error(typeof message === 'string' ? message : 'Error inesperado.');
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (invite: RecentInviteItem) => {
    setActionId(invite.id);
    try {
      if (invite.type === 'admin') {
        await apiClient.cancelAdminInvite(invite.id);
      } else {
        await apiClient.cancelDoctorInvite(invite.id);
      }
      toast.success('Invitación cancelada.');
      setInviteListKey((k) => k + 1);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'No se pudo cancelar la invitación.';
      toast.error(typeof message === 'string' ? message : 'Error inesperado.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-gray-900">Invitaciones</h2>
        <p className="text-gray-500">
          Invita nuevos miembros a tu clínica por correo electrónico
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`grid gap-4 ${canInviteAdmin ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}
      >
        {canInviteAdmin && (
          <button
            type="button"
            onClick={() => setInviteType('admin')}
            className={`text-left bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white relative overflow-hidden transition ring-2 ${
              inviteType === 'admin' ? 'ring-white/80' : 'ring-transparent'
            }`}
          >
            <ShieldPlus className="w-10 h-10 mb-3 relative z-10" />
            <h3 className="text-lg font-semibold mb-1 relative z-10">
              Administrador
            </h3>
            <p className="text-white/80 text-sm relative z-10">
              Gestiona equipo, estadísticas y configuración.
            </p>
          </button>
        )}
        <button
          type="button"
          onClick={() => setInviteType('doctor')}
          className={`text-left bg-gradient-to-br from-ensigna-primary to-ensigna-primary-light rounded-2xl p-6 text-white relative overflow-hidden transition ring-2 ${
            inviteType === 'doctor' || !canInviteAdmin
              ? 'ring-white/80'
              : 'ring-transparent'
          }`}
        >
          <Stethoscope className="w-10 h-10 mb-3 relative z-10" />
          <h3 className="text-lg font-semibold mb-1 relative z-10">Médico</h3>
          <p className="text-white/80 text-sm relative z-10">
            Gestionan disponibilidad, turnos y pacientes.
          </p>
        </button>
      </motion.div>

      {!canInviteAdmin && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Como administrador podés invitar médicos por correo.
        </p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Enviar invitación</h3>
          <p className="text-sm text-gray-500 mt-1">
            El destinatario recibirá un correo con un enlace seguro. Expira en 48
            horas.
          </p>
        </div>

        <div className="p-6">
          {canInviteAdmin && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setInviteType('admin')}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  inviteType === 'admin'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <ShieldPlus
                  className={`w-6 h-6 ${inviteType === 'admin' ? 'text-amber-600' : 'text-gray-500'}`}
                />
                <span
                  className={`font-medium ${inviteType === 'admin' ? 'text-amber-700' : 'text-gray-700'}`}
                >
                  Administrador
                </span>
              </button>
              <button
                type="button"
                onClick={() => setInviteType('doctor')}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  inviteType === 'doctor'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <Stethoscope
                  className={`w-6 h-6 ${inviteType === 'doctor' ? 'text-emerald-600' : 'text-gray-500'}`}
                />
                <span
                  className={`font-medium ${inviteType === 'doctor' ? 'text-emerald-700' : 'text-gray-700'}`}
                >
                  Médico
                </span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="invite-email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900 placeholder-gray-400 transition-all"
                  required
                  disabled={loading}
                />
              </div>
              {email.length > 0 && !emailValid && (
                <p className="text-xs text-red-600 mt-1">
                  Ingresá un email válido.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Expira en 48 horas</span>
              </div>
              <button
                type="submit"
                disabled={loading || !emailValid}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                  canInviteAdmin && inviteType === 'admin'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar invitación
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h3 className="font-semibold text-gray-900 mb-4">Historial de invitaciones</h3>
        {loadingInvites ? (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando invitaciones…</span>
          </div>
        ) : recentInvites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserPlus className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aún no hay invitaciones enviadas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentInvites.map((invite) => {
              const badge = STATUS_BADGE[invite.status];
              const isPending = invite.status === 'PENDING';
              const busy = actionId === invite.id;

              return (
                <div
                  key={`${invite.type}-${invite.id}`}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          invite.type === 'admin'
                            ? 'bg-amber-100'
                            : 'bg-emerald-100'
                        }`}
                      >
                        {invite.type === 'admin' ? (
                          <ShieldPlus className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Stethoscope className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {invite.email}
                        </p>
                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500">
                          <span>{invite.role}</span>
                          <span aria-hidden>·</span>
                          <span>{invite.date}</span>
                          {invite.invitedBy && (
                            <>
                              <span aria-hidden>·</span>
                              <span>Por {invite.invitedBy}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {isPending && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleResend(invite)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
                      >
                        {busy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        Reenviar
                      </button>
                      {invite.inviteUrl && (
                        <button
                          type="button"
                          onClick={() => handleCopy(invite.inviteUrl!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copiar enlace
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleCancel(invite)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
