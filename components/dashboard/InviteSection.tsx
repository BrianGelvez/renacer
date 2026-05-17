'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShieldPlus,
  Stethoscope,
  Send,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { apiClient, type ClinicTeamMemberDto } from '@/lib/api';

type InviteType = 'admin' | 'doctor';

/** Invitación unificada para mostrar en la lista (admin o médico). */
interface RecentInviteItem {
  id: string;
  type: 'admin' | 'doctor';
  email: string;
  status: 'pending' | 'accepted';
  date: string;
  dateRaw: Date;
  doctorName?: string;
}

interface InviteSectionProps {
  refreshKey?: number;
  /** Si false, solo se muestra la opción de invitar profesionales (ej. para ADMIN) */
  canInviteAdmin?: boolean;
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) === 1 ? '' : 's'}`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function InviteSection({ refreshKey = 0, canInviteAdmin = true }: InviteSectionProps) {
  const [inviteType, setInviteType] = useState<InviteType>(canInviteAdmin ? 'admin' : 'doctor');
  const [email, setEmail] = useState('');
  const [doctorUserId, setDoctorUserId] = useState('');
  const [doctors, setDoctors] = useState<ClinicTeamMemberDto[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentInvites, setRecentInvites] = useState<RecentInviteItem[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [inviteListKey, setInviteListKey] = useState(0);

  const doctorsWithoutAccount = doctors.filter((d) => !d.hasAccount && d.isActive);

  useEffect(() => {
    if (!canInviteAdmin) {
      setInviteType('doctor');
    }
  }, [canInviteAdmin]);

  useEffect(() => {
    if (inviteType === 'doctor') {
      setLoadingProfessionals(true);
      apiClient
        .listClinicDoctors()
        .then((data) => setDoctors(Array.isArray(data) ? data : []))
        .catch(() => setDoctors([]))
        .finally(() => setLoadingProfessionals(false));
    } else {
      setDoctorUserId('');
    }
  }, [inviteType, refreshKey]);

  /** Cargar invitaciones recientes (admins + profesionales) */
  useEffect(() => {
    setLoadingInvites(true);
    const load = async () => {
      try {
        const adminPromise = canInviteAdmin ? apiClient.getAdminInvites() : Promise.resolve([]);
        const [adminInvites, doctorInvRows] = await Promise.all([
          adminPromise,
          apiClient.getDoctorInvites(),
        ]);
        const items: RecentInviteItem[] = [];
        (adminInvites as Array<{ id: string; email: string; createdAt: string; usedAt: string | null }>)?.forEach((inv) => {
          const date = new Date(inv.createdAt);
          items.push({
            id: inv.id,
            type: 'admin',
            email: inv.email,
            status: inv.usedAt ? 'accepted' : 'pending',
            date: formatRelativeDate(date),
            dateRaw: date,
          });
        });
        (doctorInvRows as Array<{
          id: string;
          email: string;
          createdAt: string;
          usedAt: string | null;
          doctor?: { name: string; lastName: string };
        }>)?.forEach((inv) => {
          const date = new Date(inv.createdAt);
          items.push({
            id: inv.id,
            type: 'doctor',
            email: inv.email,
            status: inv.usedAt ? 'accepted' : 'pending',
            date: formatRelativeDate(date),
            dateRaw: date,
            doctorName: inv.doctor
              ? `Dr. ${inv.doctor.name} ${inv.doctor.lastName}`
              : undefined,
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
    setError(null);
    setSuccess(null);

    if (inviteType === 'admin') {
      if (!email.trim()) return;
      setLoading(true);
      try {
        await apiClient.inviteAdmin(email.trim());
        setSuccess(`Invitación enviada a ${email} como administrador.`);
        setEmail('');
        setInviteListKey((k) => k + 1);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Error al enviar la invitación.';
        setError(message);
      } finally {
        setLoading(false);
      }
    } else {
      if (!doctorUserId || !email.trim()) return;
      setLoading(true);
      try {
        await apiClient.inviteDoctor(doctorUserId, email.trim());
        const doc = doctors.find((d) => d.userId === doctorUserId);
        const name = doc ? `${doc.firstName} ${doc.lastName}` : 'médico';
        setSuccess(`Invitación enviada a ${email} para ${name}.`);
        setEmail('');
        setDoctorUserId('');
        setInviteListKey((k) => k + 1);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Error al enviar la invitación.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-gray-900">Invitaciones</h2>
        <p className="text-gray-500">
          Invita nuevos miembros a tu clínica por correo electrónico
        </p>
      </motion.div>

      {/* Info Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`grid gap-4 ${canInviteAdmin ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}
      >
        {canInviteAdmin && (
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <ShieldPlus className="w-10 h-10 mb-3 relative z-10" />
            <h3 className="text-lg font-semibold mb-1 relative z-10">Administradores</h3>
            <p className="text-white/80 text-sm relative z-10">
              Pueden gestionar el equipo médico, ver estadísticas y configurar la clínica.
            </p>
          </div>
        )}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <Stethoscope className="w-10 h-10 mb-3 relative z-10" />
          <h3 className="text-lg font-semibold mb-1 relative z-10">Médicos</h3>
          <p className="text-white/80 text-sm relative z-10">
            Gestionan su disponibilidad, ven sus turnos y atienden pacientes.
          </p>
        </div>
      </motion.div>

      {!canInviteAdmin && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Como administrador podés invitar médicos por correo para que creen su cuenta de usuario.
        </p>
      )}

      {/* Invite Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Enviar invitación</h3>
          <p className="text-sm text-gray-500 mt-1">
            El destinatario recibirá un enlace para registrarse. Expira en 48 horas.
          </p>
        </div>

        <div className="p-6">
          {/* Type Selector: solo si puede invitar admin (OWNER) */}
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
                {inviteType === 'admin' && (
                  <motion.div
                    layoutId="inviteType"
                    className="absolute inset-0 border-2 border-amber-500 rounded-xl"
                  />
                )}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  inviteType === 'admin' 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <ShieldPlus className="w-6 h-6" />
                </div>
                <span className={`font-medium ${
                  inviteType === 'admin' ? 'text-amber-700' : 'text-gray-700'
                }`}>
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
                {inviteType === 'doctor' && (
                  <motion.div
                    layoutId="inviteType"
                    className="absolute inset-0 border-2 border-emerald-500 rounded-xl"
                  />
                )}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  inviteType === 'doctor' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <Stethoscope className="w-6 h-6" />
                </div>
                <span className={`font-medium ${
                  inviteType === 'doctor' ? 'text-emerald-700' : 'text-gray-700'
                }`}>
                  Médico
                </span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {(inviteType === 'doctor' || !canInviteAdmin) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Médico a vincular
                </label>
                {loadingProfessionals ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-3 px-4 bg-gray-50 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando médicos…
                  </div>
                ) : doctorsWithoutAccount.length === 0 ? (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        No hay médicos para invitar
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Primero creá un médico desde la sección Equipo (&quot;Agregar profesional&quot;).
                      </p>
                    </div>
                  </div>
                ) : (
                  <select
                    value={doctorUserId}
                    onChange={(e) => setDoctorUserId(e.target.value)}
                    required={inviteType === 'doctor' || !canInviteAdmin}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 bg-white transition-all"
                  >
                    <option value="">Seleccionar médico…</option>
                    {doctorsWithoutAccount.map((p) => (
                      <option key={p.userId} value={p.userId}>
                        Dr. {p.firstName} {p.lastName}
                        {p.specialty ? ` — ${p.specialty}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-2">
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
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Expira en 48 horas</span>
              </div>
              <button
                type="submit"
                disabled={
                  loading ||
                  ((inviteType === 'doctor' || !canInviteAdmin) &&
                    (!doctorUserId || doctorsWithoutAccount.length === 0))
                }
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

          {/* Success/Error Messages */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200"
            >
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-800">{success}</p>
                <p className="text-sm text-emerald-700 mt-1">
                  El usuario recibirá un correo con instrucciones para registrarse.
                </p>
              </div>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Invitaciones recientes (datos reales) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h3 className="font-semibold text-gray-900 mb-4">Invitaciones recientes</h3>
        {loadingInvites ? (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando invitaciones…</span>
          </div>
        ) : recentInvites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aún no hay invitaciones enviadas</p>
            <p className="text-xs mt-1">Las que envíes aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    invite.type === 'admin' ? 'bg-amber-100' : 'bg-emerald-100'
                  }`}>
                    {invite.type === 'admin' ? (
                      <ShieldPlus className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Stethoscope className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{invite.email}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                      <span>{invite.date}</span>
                      {invite.type === 'doctor' && invite.doctorName && (
                        <>
                          <span aria-hidden>·</span>
                          <span className="truncate">{invite.doctorName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                  invite.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {invite.status === 'pending' ? 'Pendiente' : 'Aceptada'}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
