'use client';

import { useState, useEffect } from 'react';
import {
  Stethoscope,
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
  UserCheck,
  UserX,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: string | null;
  phone?: string | null;
  userId: string | null;
  isActive: boolean;
}

export default function InviteProfessionalsSection() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [emailByProfessional, setEmailByProfessional] = useState<
    Record<string, string>
  >({});
  const [successByProfessional, setSuccessByProfessional] = useState<
    Record<string, string>
  >({});
  const [errorByProfessional, setErrorByProfessional] = useState<
    Record<string, string>
  >({});

  const loadProfessionals = async () => {
    setLoadingList(true);
    try {
      const data = await apiClient.getProfessionals();
      setProfessionals(Array.isArray(data) ? data : []);
    } catch {
      setProfessionals([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadProfessionals();
  }, []);

  const handleInvite = async (professionalId: string) => {
    const email = emailByProfessional[professionalId]?.trim();
    if (!email) return;

    setErrorByProfessional((prev) => ({ ...prev, [professionalId]: '' }));
    setSuccessByProfessional((prev) => ({ ...prev, [professionalId]: '' }));
    setInvitingId(professionalId);

    try {
      await apiClient.inviteProfessional(professionalId, email);
      setSuccessByProfessional((prev) => ({
        ...prev,
        [professionalId]: `Invitación enviada a ${email}. Expira en 48 horas.`,
      }));
      setEmailByProfessional((prev) => {
        const next = { ...prev };
        delete next[professionalId];
        return next;
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Error al enviar la invitación.';
      setErrorByProfessional((prev) => ({
        ...prev,
        [professionalId]: message,
      }));
    } finally {
      setInvitingId(null);
    }
  };

  const canInvite = (p: Professional) => !p.userId && p.isActive;

  if (loadingList) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#D16A8A] to-[#E89AB0] px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Invitar Profesionales
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
          Invitar Profesionales
        </h2>
      </div>
      <div className="px-6 py-5 sm:p-6">
        <p className="text-sm text-gray-600 mb-4">
          Los profesionales sin cuenta pueden recibir una invitación por correo
          para registrarse y vincularse a su perfil.
        </p>
        {professionals.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            No hay profesionales cargados. Agregá profesionales primero desde el
            panel (próximamente) o desde el backend.
          </p>
        ) : (
          <ul className="space-y-4">
            {professionals.map((p) => (
              <li
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    {p.userId ? (
                      <UserCheck className="w-5 h-5 text-green-600" />
                    ) : (
                      <UserX className="w-5 h-5 text-amber-600" />
                    )}
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
                    {p.userId ? (
                      <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Con cuenta
                      </span>
                    ) : (
                      <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                        Sin cuenta
                      </span>
                    )}
                  </div>
                </div>
                {canInvite(p) && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-end flex-1 sm:max-w-md">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={emailByProfessional[p.id] ?? ''}
                        onChange={(e) =>
                          setEmailByProfessional((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        placeholder="email@ejemplo.com"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-gray-900 placeholder-gray-400"
                        disabled={invitingId === p.id}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInvite(p.id)}
                      disabled={
                        invitingId === p.id ||
                        !emailByProfessional[p.id]?.trim()
                      }
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 gradient-red text-white rounded-lg text-sm font-medium hover:brightness-105 focus:ring-2 focus:ring-[rgba(209,106,138,0.35)] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex-shrink-0"
                    >
                      {invitingId === p.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Invitar'
                      )}
                    </button>
                  </div>
                )}
                {successByProfessional[p.id] && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-green-50 text-green-800 text-sm sm:col-span-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{successByProfessional[p.id]}</span>
                  </div>
                )}
                {errorByProfessional[p.id] && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 text-red-800 text-sm sm:col-span-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{errorByProfessional[p.id]}</span>
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
