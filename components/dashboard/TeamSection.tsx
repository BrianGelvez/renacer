'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Shield,
  Stethoscope,
  Loader2,
  Crown,
  ShieldCheck,
  UserCog,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Pencil,
  Building2,
  FileText,
} from 'lucide-react';
import { apiClient, type ClinicTeamMemberDto } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import CreateProfessionalSection from './CreateProfessionalSection';
import EditProfessionalModal, {
  type ProfessionalToEdit,
} from './EditProfessionalModal';
import EditMyProfileModal from './EditMyProfileModal';

function isRecetarioSandboxMailbox(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@recetario.com.ar');
}

function RecetarioStatusChips({
  email,
  recetarioSyncStatus,
  recetarioEnvironment,
  recetarioIsTestUser,
  recetarioRemoteImmutable,
  isActive,
}: {
  email: string;
  recetarioSyncStatus?: ClinicTeamMemberDto['recetarioSyncStatus'];
  recetarioEnvironment?: ClinicTeamMemberDto['recetarioEnvironment'];
  recetarioIsTestUser?: boolean;
  recetarioRemoteImmutable?: boolean;
  isActive: boolean;
}) {
  const sandboxMailbox = isRecetarioSandboxMailbox(email);
  const sandboxEnv =
    recetarioEnvironment === 'STAGING' || sandboxMailbox === true;

  const sync =
    recetarioSyncStatus === 'SYNCED' ||
    recetarioSyncStatus === 'SYNCED_IMMUTABLE_SANDBOX'
      ? 'bg-emerald-100 text-emerald-800'
      : recetarioSyncStatus === 'FAILED'
        ? 'bg-rose-100 text-rose-800'
        : recetarioSyncStatus === 'PENDING'
          ? 'bg-amber-100 text-amber-800'
          : sandboxEnv
            ? 'bg-violet-100 text-violet-800'
            : 'bg-slate-100 text-slate-600';

  let syncLabel: string;
  if (recetarioSyncStatus === 'SYNCED_IMMUTABLE_SANDBOX') {
    syncLabel = 'Sincronizado (Sandbox)';
  } else if (recetarioSyncStatus === 'SYNCED') {
    syncLabel = 'Sincronizado';
  } else if (recetarioSyncStatus === 'FAILED') {
    syncLabel = 'Recetario error';
  } else if (recetarioSyncStatus === 'PENDING') {
    syncLabel = 'Recetario pendiente';
  } else if (sandboxEnv) {
    syncLabel =
      'Usuario Recetario staging: pendiente de vincular o sin estado local';
  } else {
    syncLabel = 'Pendiente de vincular con Recetario';
  }

  const act = isActive ? 'bg-teal-50 text-teal-800' : 'bg-gray-200 text-gray-600';
  const actLabel = isActive ? 'Activo' : 'Inactivo';

  return (
    <div className="flex flex-wrap gap-1.5 mt-1 items-center">
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${sync}`}>
        {syncLabel}
      </span>
      {(recetarioEnvironment === 'STAGING' || sandboxMailbox) && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900">
          Recetario Sandbox
        </span>
      )}
      {recetarioRemoteImmutable === true && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-amber-300 text-amber-900 bg-amber-50">
          Solo lectura
        </span>
      )}
      {(recetarioIsTestUser === true || sandboxMailbox) &&
        recetarioSyncStatus !== 'FAILED' && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
            Usuario de pruebas
          </span>
        )}
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${act}`}>
        {actLabel}
      </span>
    </div>
  );
}

function PhysicianBadge({ isDoctor }: { isDoctor: boolean }) {
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
        isDoctor
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      {isDoctor ? 'Médico' : 'No médico'}
    </span>
  );
}

function RoleBadge({ role }: { role: ClinicTeamMemberDto['role'] }) {
  if (role === 'OWNER') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg gradient-red text-white shadow-sm">
        <Crown className="w-3 h-3" />
        Propietario
      </span>
    );
  }
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm">
        <ShieldCheck className="w-3 h-3" />
        Admin
      </span>
    );
  }
  if (role === 'SECRETARY') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm">
        <UserCog className="w-3 h-3" />
        Recepción
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm">
      <Stethoscope className="w-3 h-3" />
      Médico
    </span>
  );
}

interface TeamSectionProps {
  refreshKey?: number;
}

export default function TeamSection({ refreshKey = 0 }: TeamSectionProps) {
  const router = useRouter();
  const { user, loadUserData } = useAuth();
  const [team, setTeam] = useState<ClinicTeamMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'staff' | 'doctors'>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editDoctorTarget, setEditDoctorTarget] =
    useState<ProfessionalToEdit | null>(null);
  const [editMyProfileOpen, setEditMyProfileOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-menu-container]')) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiClient.getTeamMembers();
      setTeam(Array.isArray(data) ? data : []);
    } catch {
      setTeam([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [refreshKey]);

  const staff = team.filter((m) => m.role !== 'DOCTOR');
  const physicians = team.filter((m) => m.isDoctor);

  const adminCount = team.filter(
    (m) => m.role === 'OWNER' || m.role === 'ADMIN',
  ).length;
  const secretaryCount = team.filter((m) => m.role === 'SECRETARY').length;

  const lowered = searchTerm.toLowerCase();

  const filteredStaff = staff.filter((m) =>
    `${m.firstName} ${m.lastName} ${m.email} ${m.phone ?? ''} ${m.role}`
      .toLowerCase()
      .includes(lowered),
  );

  const filteredDoctors = physicians.filter((d) =>
    `${d.firstName} ${d.lastName} ${d.specialty ?? ''} ${d.licenseNumber ?? ''} ${d.role}`
      .toLowerCase()
      .includes(lowered),
  );

  const totalMembers = team.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Equipo</h2>
            <p className="text-gray-500">Gestiona los miembros de tu clínica</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-ensigna-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Equipo</h2>
          <p className="text-gray-500">{totalMembers} miembros en tu clínica</p>
        </div>
        <div className="flex items-center">
          <CreateProfessionalSection onCreated={() => void load(true)} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: 'Total miembros',
            value: totalMembers,
            color: 'bg-blue-50 text-blue-600',
          },
          {
            label: 'Administradores',
            value: adminCount,
            color: 'bg-amber-50 text-amber-600',
          },
          {
            label: 'Recepción',
            value: secretaryCount,
            color: 'bg-sky-50 text-sky-600',
          },
          {
            label: 'Médicos',
            value: physicians.length,
            color: 'bg-emerald-50 text-emerald-600',
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o especialidad..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>
          <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'staff', label: 'Administración' },
              { key: 'doctors', label: 'Médicos' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {(activeTab === 'all' || activeTab === 'staff') &&
          filteredStaff.length > 0 && (
            <div
              className={activeTab === 'all' ? 'border-b border-gray-100' : ''}
            >
              <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Shield className="w-4 h-4 text-amber-600" />
                  Administración y recepción ({filteredStaff.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredStaff.map((m, index) => (
                  <motion.div
                    key={m.clinicUserId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                          m.role === 'OWNER'
                            ? 'gradient-red'
                            : m.role === 'ADMIN'
                              ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                              : 'bg-gradient-to-br from-sky-500 to-blue-600'
                        }`}
                      >
                        {m.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {m.name} {m.lastName}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3.5 h-3.5" />
                            {m.email}
                          </span>
                          {m.phone && (
                            <span className="hidden sm:flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {m.phone}
                            </span>
                          )}
                        </div>
                        {m.isDoctor && (
                          <RecetarioStatusChips
                            email={m.email}
                            recetarioSyncStatus={m.recetarioSyncStatus}
                            recetarioEnvironment={m.recetarioEnvironment}
                            recetarioIsTestUser={m.recetarioIsTestUser}
                            recetarioRemoteImmutable={m.recetarioRemoteImmutable}
                            isActive={m.isActive}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoleBadge role={m.role} />
                      {(m.role === 'OWNER' || m.role === 'ADMIN') && (
                        <PhysicianBadge isDoctor={m.isDoctor} />
                      )}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${m.isActive ? 'bg-teal-50 text-teal-800' : 'bg-gray-200 text-gray-600'}`}
                      >
                        {m.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                      <div className="relative" data-menu-container>
                        <button
                          type="button"
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === `staff-${m.clinicUserId}`
                                ? null
                                : `staff-${m.clinicUserId}`,
                            )
                          }
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Opciones"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        <AnimatePresence>
                          {menuOpenId === `staff-${m.clinicUserId}` && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="absolute right-0 top-full mt-1 w-48 py-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10"
                            >
                              <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                                {m.email}
                              </div>
                              {user?.id === m.userId ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditMyProfileOpen(true);
                                    setMenuOpenId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Editar mi perfil
                                </button>
                              ) : (
                                <p className="px-4 py-2 text-sm text-gray-500">
                                  Sin opciones de edición desde Equipo.
                                </p>
                              )}
                              {m.isDoctor && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    router.push(
                                      `/dashboard/prescriptions?doctorUserId=${m.userId}`,
                                    );
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-700 hover:bg-indigo-50 rounded-lg"
                                >
                                  <FileText className="w-4 h-4" />
                                  Documentos emitidos
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        {(activeTab === 'all' || activeTab === 'doctors') &&
          filteredDoctors.length > 0 && (
            <div>
              <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  Médicos ({filteredDoctors.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredDoctors.map((p, index) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                        {p.firstName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {p.role === 'DOCTOR' ? 'Dr. ' : ''}
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {p.specialty || 'Sin especialidad'}
                        </p>
                        {p.role !== 'DOCTOR' && (
                          <div className="flex gap-1.5 mt-1">
                            <RoleBadge role={p.role} />
                          </div>
                        )}
                        <RecetarioStatusChips
                          email={p.email}
                          recetarioSyncStatus={p.recetarioSyncStatus}
                          recetarioEnvironment={p.recetarioEnvironment}
                          recetarioIsTestUser={p.recetarioIsTestUser}
                          recetarioRemoteImmutable={p.recetarioRemoteImmutable}
                          isActive={p.isActive}
                        />
                        {p.recetarioSyncStatus === 'FAILED' &&
                          p.recetarioLastError && (
                            <p
                              className="text-[11px] text-rose-600 mt-1 line-clamp-2"
                              title={p.recetarioLastError}
                            >
                              {p.recetarioLastError}
                            </p>
                          )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.hasAccount ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Con cuenta
                        </span>
                      ) : p.managedByClinic ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">
                          <Building2 className="w-3.5 h-3.5" />
                          Gestionado por la clínica
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100 text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Pendiente
                        </span>
                      )}
                      <div className="relative" data-menu-container>
                        <button
                          type="button"
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === `doc-${p.id}` ? null : `doc-${p.id}`,
                            )
                          }
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Opciones"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        <AnimatePresence>
                          {menuOpenId === `doc-${p.id}` && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="absolute right-0 top-full mt-1 w-52 py-1 bg-white rounded-xl border border-gray-200 shadow-lg z-20"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (user?.id === p.userId) {
                                    setEditMyProfileOpen(true);
                                  } else {
                                    setEditDoctorTarget({ id: p.id });
                                  }
                                  setMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                              >
                                <Pencil className="w-4 h-4" />
                                {user?.id === p.userId
                                  ? 'Editar mi perfil'
                                  : 'Editar médico'}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        {filteredStaff.length === 0 && filteredDoctors.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron miembros</p>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {editMyProfileOpen && (
          <EditMyProfileModal
            onClose={() => setEditMyProfileOpen(false)}
            onSaved={() => {
              void load(true);
              void loadUserData();
              setEditMyProfileOpen(false);
            }}
          />
        )}
        {editDoctorTarget && (
          <EditProfessionalModal
            professional={editDoctorTarget}
            onClose={() => setEditDoctorTarget(null)}
            onSaved={() => {
              void load(true);
              setEditDoctorTarget(null);
            }}
            onDeactivated={() => {
              void load(true);
              setEditDoctorTarget(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
