'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import CreateProfessionalSection from './CreateProfessionalSection';
import EditProfessionalModal, { type ProfessionalToEdit } from './EditProfessionalModal';

interface ClinicMember {
  id: string;
  userId: string;
  role: string;
  isActive: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    lastName: string;
    phone?: string | null;
  };
}

interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: string | null;
  licenseNumber?: string | null;
  phone?: string | null;
  userId: string | null;
  isActive: boolean;
  managedByClinic?: boolean;
}

function RoleBadge({ role }: { role: string }) {
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
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm">
      <UserCog className="w-3 h-3" />
      Staff
    </span>
  );
}

interface TeamSectionProps {
  refreshKey?: number;
}

export default function TeamSection({ refreshKey = 0 }: TeamSectionProps) {
  const [members, setMembers] = useState<ClinicMember[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'admins' | 'professionals'>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editProfessional, setEditProfessional] = useState<ProfessionalToEdit | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-menu-container]')) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** silent: true = no mostrar spinner (para refrescar tras crear/editar sin desmontar el modal) */
  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [membersData, professionalsData] = await Promise.all([
        apiClient.getClinicMembers(),
        apiClient.getProfessionals(),
      ]);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setProfessionals(Array.isArray(professionalsData) ? professionalsData : []);
    } catch {
      setMembers([]);
      setProfessionals([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const admins = members.filter((m) => m.role === 'OWNER' || m.role === 'ADMIN');
  
  const filteredAdmins = admins.filter((m) =>
    `${m.user.name} ${m.user.lastName} ${m.user.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const filteredProfessionals = professionals.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.specialty || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const totalMembers = admins.length + professionals.length;

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Equipo</h2>
          <p className="text-gray-500">
            {totalMembers} miembros en tu clínica
          </p>
        </div>
        <div className="flex items-center">
          <CreateProfessionalSection onCreated={() => load(true)} />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total miembros', value: totalMembers, color: 'bg-blue-50 text-blue-600' },
          { label: 'Administradores', value: admins.length, color: 'bg-amber-50 text-amber-600' },
          { label: 'Profesionales', value: professionals.length, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Con cuenta', value: professionals.filter(p => p.userId).length, color: 'bg-purple-50 text-purple-600' },
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

      {/* Search & Filters */}
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
              { key: 'admins', label: 'Admins' },
              { key: 'professionals', label: 'Profesionales' },
            ].map((tab) => (
              <button
                key={tab.key}
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

      {/* Team List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Admins */}
        {(activeTab === 'all' || activeTab === 'admins') && filteredAdmins.length > 0 && (
          <div className={activeTab === 'all' ? 'border-b border-gray-100' : ''}>
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Shield className="w-4 h-4 text-amber-600" />
                Administradores ({filteredAdmins.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredAdmins.map((m, index) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                      m.role === 'OWNER' 
                        ? 'gradient-red' 
                        : 'bg-gradient-to-br from-amber-500 to-orange-600'
                    }`}>
                      {m.user.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {m.user.name} {m.user.lastName}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3.5 h-3.5" />
                          {m.user.email}
                        </span>
                        {m.user.phone && (
                          <span className="hidden sm:flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {m.user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RoleBadge role={m.role} />
                    <div className="relative" data-menu-container>
                      <button
                        type="button"
                        onClick={() => setMenuOpenId(menuOpenId === `admin-${m.id}` ? null : `admin-${m.id}`)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Opciones"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      <AnimatePresence>
                        {menuOpenId === `admin-${m.id}` && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute right-0 top-full mt-1 w-48 py-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10"
                          >
                            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                              {m.user.email}
                            </div>
                            <p className="px-4 py-2 text-sm text-gray-500">Sin opciones de edición</p>
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

        {/* Professionals */}
        {(activeTab === 'all' || activeTab === 'professionals') && filteredProfessionals.length > 0 && (
          <div>
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                Profesionales ({filteredProfessionals.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredProfessionals.map((p, index) => (
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
                        Dr. {p.firstName} {p.lastName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {p.specialty || 'Sin especialidad'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.userId ? (
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
                        onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Opciones"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      <AnimatePresence>
                        {menuOpenId === p.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute right-0 top-full mt-1 w-52 py-1 bg-white rounded-xl border border-gray-200 shadow-lg z-20"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setEditProfessional({
                                  id: p.id,
                                  firstName: p.firstName,
                                  lastName: p.lastName,
                                  specialty: p.specialty ?? undefined,
                                  licenseNumber: p.licenseNumber ?? undefined,
                                  phone: p.phone ?? undefined,
                                  isActive: p.isActive,
                                });
                                setMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                            >
                              <Pencil className="w-4 h-4" />
                              Editar profesional
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

        {/* Empty State */}
        {filteredAdmins.length === 0 && filteredProfessionals.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron miembros</p>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {editProfessional && (
          <EditProfessionalModal
            professional={editProfessional}
            onClose={() => setEditProfessional(null)}
            onSaved={() => { load(true); setEditProfessional(null); }}
            onDeactivated={() => { load(true); setEditProfessional(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
