'use client';

import { useState, useEffect } from 'react';
import {
  Stethoscope,
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { apiClient, type ClinicTeamMemberDto } from '@/lib/api';

export default function InviteProfessionalsSection() {
  const [doctors, setDoctors] = useState<ClinicTeamMemberDto[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [emailByDoctorUserId, setEmailByDoctorUserId] = useState<
    Record<string, string>
  >({});
  const [successByDoctorUserId, setSuccessByDoctorUserId] = useState<
    Record<string, string>
  >({});
  const [errorByDoctorUserId, setErrorByDoctorUserId] = useState<
    Record<string, string>
  >({});

  const loadDoctors = async () => {
    setLoadingList(true);
    try {
      const data = await apiClient.listClinicDoctors();
      setDoctors(Array.isArray(data) ? data : []);
    } catch {
      setDoctors([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleInvite = async (doctorUserId: string) => {
    const email = emailByDoctorUserId[doctorUserId]?.trim();
    if (!email) return;

    setErrorByDoctorUserId((prev) => ({ ...prev, [doctorUserId]: '' }));
    setSuccessByDoctorUserId((prev) => ({ ...prev, [doctorUserId]: '' }));
    setInvitingId(doctorUserId);

    try {
      await apiClient.inviteDoctor(doctorUserId, email);
      setSuccessByDoctorUserId((prev) => ({
        ...prev,
        [doctorUserId]: `Invitación enviada a ${email}. Expira en 48 horas.`,
      }));
      setEmailByDoctorUserId((prev) => {
        const next = { ...prev };
        delete next[doctorUserId];
        return next;
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Error al enviar la invitación.';
      setErrorByDoctorUserId((prev) => ({
        ...prev,
        [doctorUserId]: message,
      }));
    } finally {
      setInvitingId(null);
    }
  };

  const canInvite = (d: ClinicTeamMemberDto) => d.isActive && !d.hasAccount;

  if (loadingList) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#D16A8A] to-[#E89AB0] px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Invitar médicos
          </h2>
        </div>
        <div className="px-6 py-8 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white/80" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-[#D16A8A] to-[#E89AB0] px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
          <h2 className="text-lg font-semibold text-white">
            Invitar médicos
          </h2>
      </div>
      <div className="px-6 py-5 sm:p-6">
        <p className="text-sm text-gray-600 mb-4">
          Enviá un enlace para que el médico defina su contraseña. El email debe ser
          el mismo que el de la cuenta creada al dar de alta al médico en Equipo.
        </p>
        {doctors.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            No hay médicos en la clínica. Primero cargá médicos desde la sección
            Equipo.
          </p>
        ) : (
          <ul className="space-y-4">
            {doctors.map((p) => (
              <li
                key={p.userId}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {p.firstName} {p.lastName}
                    </p>
                    {p.specialty && (
                      <p className="text-sm text-gray-500 truncate">
                        {p.specialty}
                      </p>
                    )}
                    <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                      {p.email}
                    </span>
                  </div>
                </div>
                {canInvite(p) && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-end flex-1 sm:max-w-md">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={emailByDoctorUserId[p.userId] ?? p.email ?? ''}
                        onChange={(e) =>
                          setEmailByDoctorUserId((prev) => ({
                            ...prev,
                            [p.userId]: e.target.value,
                          }))
                        }
                        placeholder="email@ejemplo.com"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-gray-900 placeholder-gray-400"
                        disabled={invitingId === p.userId}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInvite(p.userId)}
                      disabled={
                        invitingId === p.userId ||
                        !emailByDoctorUserId[p.userId]?.trim()
                      }
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 gradient-red text-white rounded-lg text-sm font-medium hover:brightness-105 focus:ring-2 focus:ring-[rgba(209,106,138,0.35)] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex-shrink-0"
                    >
                      {invitingId === p.userId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Invitar'
                      )}
                    </button>
                  </div>
                )}
                {successByDoctorUserId[p.userId] && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-green-50 text-green-800 text-sm sm:col-span-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{successByDoctorUserId[p.userId]}</span>
                  </div>
                )}
                {errorByDoctorUserId[p.userId] && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 text-red-800 text-sm sm:col-span-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{errorByDoctorUserId[p.userId]}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
