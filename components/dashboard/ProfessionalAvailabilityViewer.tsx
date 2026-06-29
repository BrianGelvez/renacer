'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Loader2, AlertCircle } from 'lucide-react';
import { apiClient, type ClinicTeamMemberDto } from '@/lib/api';
import AvailabilitySection from './AvailabilitySection';

export default function ProfessionalAvailabilityViewer() {
  const [doctors, setDoctors] = useState<ClinicTeamMemberDto[]>([]);
  const [selectedDoctorUserId, setSelectedDoctorUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.listClinicDoctors();
      const list = Array.isArray(data) ? data : [];
      setDoctors(list);
      if (list.length > 0) {
        setSelectedDoctorUserId((prev) =>
          prev && list.some((m) => m.userId === prev) ? prev : list[0].userId,
        );
      }
    } catch {
      setError('Error al cargar médicos.');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedDoctor = doctors.find((d) => d.userId === selectedDoctorUserId);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex justify-center"
      >
        <Loader2 className="w-8 h-8 animate-spin text-ensigna-primary" />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      </motion.div>
    );
  }

  if (doctors.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sin médicos
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Agregá médicos en la sección Equipo. Podés gestionar la disponibilidad con o sin cuenta de usuario.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ensigna-primary to-ensigna-primary-light flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Seleccionar médico</h3>
              <p className="text-sm text-gray-500">
                {doctors.length} médico{doctors.length !== 1 ? 's' : ''}. Gestioná horarios con o sin cuenta.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {doctors.map((prof) => (
              <button
                key={prof.userId}
                type="button"
                onClick={() => setSelectedDoctorUserId(prof.userId)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  selectedDoctorUserId === prof.userId
                    ? 'border-ensigna-primary bg-ensigna-accent'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                  selectedDoctorUserId === prof.userId
                    ? 'bg-gradient-to-br from-ensigna-primary to-ensigna-primary-light'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  {prof.firstName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-medium truncate ${
                    selectedDoctorUserId === prof.userId ? 'text-ensigna-primary-dark' : 'text-gray-900'
                  }`}>
                    Dr. {prof.firstName} {prof.lastName}
                  </p>
                  <p className={`text-sm truncate ${
                    selectedDoctorUserId === prof.userId ? 'text-ensigna-primary' : 'text-gray-500'
                  }`}>
                    {prof.specialty || 'Sin especialidad'}
                    {prof.hasAccount
                      ? ' · Con cuenta'
                      : prof.managedByClinic
                        ? ' · Gestionado por la clínica'
                        : ' · Pendiente'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {selectedDoctor && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-ensigna-primary to-ensigna-primary-light rounded-2xl p-6 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold">
              {selectedDoctor.firstName[0]}
            </div>
            <div>
              <h3 className="text-xl font-bold">
                Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
              </h3>
              <p className="text-white/80">
                {selectedDoctor.specialty || 'Sin especialidad asignada'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {selectedDoctorUserId && (
        <motion.div
          key={selectedDoctorUserId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AvailabilitySection doctorUserId={selectedDoctorUserId} />
        </motion.div>
      )}
    </div>
  );
}
