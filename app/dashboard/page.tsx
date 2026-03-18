'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import OverviewSection from '@/components/dashboard/OverviewSection';
import ClinicSection from '@/components/dashboard/ClinicSection';
import TeamSection from '@/components/dashboard/TeamSection';
import InviteSection from '@/components/dashboard/InviteSection';
import AvailabilitySection from '@/components/dashboard/AvailabilitySection';
import ProfessionalAvailabilityViewer from '@/components/dashboard/ProfessionalAvailabilityViewer';
import ScheduleSection from '@/components/dashboard/ScheduleSection';
import PatientsSection from '@/components/dashboard/PatientsSection';
import { motion } from 'framer-motion';
import { Settings, Construction } from 'lucide-react';

function DashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [refreshTeamKey, setRefreshTeamKey] = useState(0);

  // Sync section from URL
  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Render active section content
  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;

      case 'clinic':
        if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
          return <ClinicSection />;
        }
        return <OverviewSection />;

      case 'team':
        if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
          return <TeamSection refreshKey={refreshTeamKey} />;
        }
        return <OverviewSection />;

      case 'invite':
        if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
          return (
            <InviteSection
              refreshKey={refreshTeamKey}
              canInviteAdmin={user?.role === 'OWNER'}
            />
          );
        }
        return <OverviewSection />;

      case 'availability':
        if (user?.role === 'STAFF') {
          return (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold text-gray-900">Mi Disponibilidad</h2>
                <p className="text-gray-500">
                  Configura tus horarios de atención
                </p>
              </motion.div>
              <AvailabilitySection />
            </div>
          );
        }
        if (user?.role === 'OWNER' || user?.role === 'ADMIN') {
          return (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold text-gray-900">Disponibilidad</h2>
                <p className="text-gray-500">
                  Gestiona la disponibilidad semanal de los profesionales de tu clínica
                </p>
              </motion.div>
              <ProfessionalAvailabilityViewer />
            </div>
          );
        }
        return <OverviewSection />;

      case 'schedule':
        return (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>
              <p className="text-gray-500">
                Gestiona los turnos y citas de la clínica
              </p>
            </motion.div>
            <ScheduleSection />
          </div>
        );

      case 'patients':
        return (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold text-gray-900">Pacientes</h2>
              <p className="text-gray-500">
                Base de pacientes de la clínica
              </p>
            </motion.div>
            <PatientsSection />
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
              <p className="text-gray-500">
                Personaliza tu experiencia y preferencias
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Próximamente
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                La sección de configuración está en desarrollo. Pronto podrás
                personalizar notificaciones, cambiar tu contraseña y más.
              </p>
            </motion.div>
          </div>
        );

      default:
        return <OverviewSection />;
    }
  };

  return (
    <motion.div
      key={activeSection}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {renderContent()}
    </motion.div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardPageInner />
    </Suspense>
  );
}
