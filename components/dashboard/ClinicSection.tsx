'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  CheckCircle,
  Edit2,
  Upload,
  Camera,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import EditClinicModal from './EditClinicModal';
import HealthInsurancesSection from './HealthInsurancesSection';
import RecetarioSyncBadge from './RecetarioSyncBadge';
import RecetarioIntegrationPanel from './RecetarioIntegrationPanel';
import Link from 'next/link';

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type ClinicStats = {
  professionals: number;
  patients: number;
  appointmentsThisMonth: number;
  attendanceRate: number;
};

function formatStat(value: number): string {
  return new Intl.NumberFormat('es-AR').format(value);
}

export default function ClinicSection() {
  const { clinic, loadUserData } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const prescriptionLogoUrl = clinic?.prescriptionLogoUrl?.trim() || null;

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const [summary, appointmentsReport] = await Promise.all([
        apiClient.getDashboardSummary(),
        apiClient.getReportsAppointments({ period: 'this_month' }),
      ]);

      const appointmentsThisMonth = Array.isArray(appointmentsReport?.byStatus)
        ? appointmentsReport.byStatus.reduce(
            (sum, row) => sum + (row.count ?? 0),
            0,
          )
        : 0;

      setStats({
        professionals: summary.professionalsActive,
        patients: summary.patientsTotal,
        appointmentsThisMonth,
        attendanceRate: summary.attendanceRate,
      });
    } catch {
      setStats(null);
      setStatsError('No se pudieron cargar las estadísticas.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [prescriptionLogoUrl]);

  useEffect(() => {
    void loadStats();
  }, [loadStats, clinic?.id]);

  /**
   * Tras un guardado, recargamos los datos.
   * Adicionalmente, programamos un segundo refresh 2.5s después: la
   * sincronización con Recetario corre en background (fire-and-forget)
   * y normalmente termina poco después de que el endpoint principal
   * respondió. Este segundo fetch captura el estado final del badge
   * (SYNCED / FAILED) sin obligar al usuario a refrescar manualmente.
   */
  const handleSaved = async () => {
    await loadUserData();
    void loadStats();
    window.setTimeout(() => {
      void loadUserData();
      void loadStats();
    }, 2500);
  };

  const clinicAvailabilities = (clinic?.clinicAvailabilities ?? []).filter((a) => a.isActive);

  const statCards = stats
    ? [
        {
          label: 'Profesionales',
          value: formatStat(stats.professionals),
          hint: 'Médicos activos',
          accent: 'bg-blue-50 text-blue-600',
        },
        {
          label: 'Pacientes',
          value: formatStat(stats.patients),
          hint: 'Registrados en la clínica',
          accent: 'bg-emerald-50 text-emerald-600',
        },
        {
          label: 'Turnos este mes',
          value: formatStat(stats.appointmentsThisMonth),
          hint: 'Todos los estados',
          accent: 'bg-ensigna-accent text-ensigna-primary',
        },
        {
          label: 'Asistencia',
          value: `${stats.attendanceRate}%`,
          hint: 'Últimos 7 días',
          accent: 'bg-amber-50 text-amber-600',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mi Clínica</h2>
          <p className="text-gray-500">
            Gestiona la información y configuración de tu clínica
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 gradient-brand bg-ensigna-primary hover:bg-ensigna-primary-dark text-white rounded-xl font-medium hover:brightness-105 transition-all shadow-lg shadow-ensigna-primary/25"
        >
          <Edit2 className="w-4 h-4" />
          Editar información
        </button>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-hover)] to-[var(--color-primary-light)]">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-colors">
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* Logo & Info */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16 relative z-10">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white shadow-xl border-4 border-white flex items-center justify-center overflow-hidden">
              {prescriptionLogoUrl && !logoLoadFailed ? (
                <img
                  src={prescriptionLogoUrl}
                  alt={`Logo de ${clinic?.name ?? 'la clínica'}`}
                  className="h-full w-full object-cover"
                  onError={() => setLogoLoadFailed(true)}
                />
              ) : (
                <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" />
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {clinic?.name || 'Mi Clínica'}
                </h3>
                {clinic?.isActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Activa
                  </span>
                )}
              </div>
              <p className="text-gray-500 font-mono text-sm">
                /{clinic?.slug || 'mi-clinica'}
              </p>
              <div className="mt-2">
                <RecetarioSyncBadge
                  status={clinic?.recetarioSyncStatus ?? null}
                  syncedAt={clinic?.recetarioSyncedAt ?? null}
                  lastError={clinic?.recetarioLastError ?? null}
                  healthCenterId={clinic?.recetarioHealthCenterId ?? null}
                />
              </div>
              {/* Nota: el badge anterior es solo informativo. El panel
                  completo con acciones está debajo en la grilla. */}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Información de contacto
          </h4>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900">
                  {clinic?.email || 'contacto@clinica.com'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Teléfono</p>
                <p className="text-gray-900">{clinic?.phone || '+54 11 1234-5678'}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-ensigna-accent flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-ensigna-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Dirección</p>
                <p className="text-gray-900">
                  {clinic?.address || 'Av. Corrientes 1234'}
                </p>
                {(clinic?.city || clinic?.province) && (
                  <p className="text-gray-600 text-sm mt-1">
                    {[clinic?.city, clinic?.province].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Sitio web</p>
                <Link href="https://renacer-eight.vercel.app/" target="_blank" className="text-ensigna-primary hover:text-ensigna-primary-dark cursor-pointer">
                https://renacer-eight.vercel.app/
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Business Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Horarios de atención
          </h4>
          <div className="space-y-3">
            {clinicAvailabilities.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">
                No hay horarios configurados. Hacé clic en &quot;Editar información&quot; para
                agregarlos.
              </p>
            ) : (
              clinicAvailabilities.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {DAYS_SHORT[a.dayOfWeek]}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {a.startTime} - {a.endTime}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recetario.com.ar integration */}
        <div className="lg:col-span-2">
          <RecetarioIntegrationPanel />
        </div>

        {/* Health Insurances */}
        <div className="lg:col-span-2">
          <HealthInsurancesSection />
        </div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statsLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`stat-skeleton-${index}`}
              className="flex min-h-[108px] items-center justify-center rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
            </div>
          ))}

        {!statsLoading &&
          statCards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm"
            >
              <span
                className={`mb-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stat.accent}`}
              >
                {stat.hint}
              </span>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}

        {!statsLoading && statsError && (
          <div className="col-span-2 lg:col-span-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {statsError}
          </div>
        )}
      </motion.div>

      {/* Documents */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Documentos</h4>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-ensigna-primary hover:bg-ensigna-accent rounded-lg transition-colors">
            <Upload className="w-4 h-4" />
            Subir documento
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { name: 'Habilitación municipal', status: 'Vigente', date: '2025-12-31' },
            { name: 'Seguro de responsabilidad', status: 'Vigente', date: '2026-06-15' },
            { name: 'Certificado sanitario', status: 'Por vencer', date: '2026-03-01' },
          ].map((doc, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
            >
              <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
              <div className="flex items-center justify-between mt-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    doc.status === 'Vigente'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {doc.status}
                </span>
                <span className="text-xs text-gray-500">{doc.date}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div> */}

      {editModalOpen && (
        <EditClinicModal
          clinic={clinic}
          onClose={() => setEditModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
