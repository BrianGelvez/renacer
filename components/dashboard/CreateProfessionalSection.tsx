'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Award,
  ArrowRight,
  X,
  Building2,
  Mail,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface CreateProfessionalSectionProps {
  onCreated?: () => void;
}

export default function CreateProfessionalSection({ onCreated }: CreateProfessionalSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [managedByClinic, setManagedByClinic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [successType, setSuccessType] = useState<'managed' | 'pending' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!firstName.trim() || !lastName.trim()) return;

    setLoading(true);
    try {
      await apiClient.createProfessional({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        specialty: specialty.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        phone: phone.trim() || undefined,
        isActive: true,
        managedByClinic,
      });
      const name = `Dr. ${firstName.trim()} ${lastName.trim()}`;
      setSuccess(name);
      setSuccessType(managedByClinic ? 'managed' : 'pending');
      setFirstName('');
      setLastName('');
      setSpecialty('');
      setLicenseNumber('');
      setPhone('');
      onCreated?.();
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
        setSuccessType(null);
      }, 6000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al crear el profesional.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setSuccess(null);
    setSuccessType(null);
    if (!success) {
      setFirstName('');
      setLastName('');
      setSpecialty('');
      setLicenseNumber('');
      setPhone('');
      setManagedByClinic(true);
    }
  };

  return (
    <>
      {/* Botón para abrir el modal */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto inline-flex items-center gap-2 px-6 py-3 gradient-red text-white rounded-xl font-semibold hover:brightness-105 transition-all shadow-lg shadow-ensigna-primary/25 hover:shadow-xl"
      >
        <UserPlus className="w-5 h-5" />
        Agregar profesional
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header del modal */}
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-ensigna-soft/40 to-ensigna-accent-soft">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-red flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Crear nuevo profesional</h3>
                      <p className="text-sm text-gray-600">
                        Con o sin cuenta de usuario
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-2 rounded-lg hover:bg-white/80 transition-colors"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Contenido del modal - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Banner de éxito: ocupa toda la vista cuando hay éxito */}
                {success && successType && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 rounded-2xl overflow-hidden border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg"
                  >
                    <div className="p-8 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                      >
                        <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
                      </motion.div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">
                        ¡Profesional creado con éxito!
                      </h4>
                      <p className="text-lg font-semibold text-emerald-800 mb-4">{success}</p>
                      {successType === 'managed' ? (
                        <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/80 border border-emerald-200 text-emerald-800 text-sm font-medium">
                          <Building2 className="w-5 h-5 flex-shrink-0" />
                          <span>
                            Aparecerá como <strong>Gestionado por la clínica</strong>. Podés configurar su horario en la sección <strong>Disponibilidad</strong>.
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/80 border border-emerald-200 text-emerald-800 text-sm font-medium">
                          <Mail className="w-5 h-5 flex-shrink-0" />
                          <span>
                            Aparecerá como <strong>Pendiente</strong>. Enviále la invitación desde la sección <strong>Invitaciones</strong> para que cree su cuenta.
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {!success && (
                  <>
                    {!managedByClinic && (
                      <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ArrowRight className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-sm text-blue-800">
                            Después de crear el profesional, podrás invitarlo por correo desde la
                            sección <strong>&quot;Invitaciones&quot;</strong> para que cree su cuenta de usuario.
                          </p>
                        </div>
                      </div>
                    )}
                    {managedByClinic && (
                      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-sm text-amber-800">
                          Este profesional no tendrá cuenta. La clínica gestionará su horario y disponibilidad desde la sección <strong>Disponibilidad</strong>.
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200"
                      >
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                      </motion.div>
                    )}

                    <form id="create-professional-form" onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pro-firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre <span className="text-ensigna-primary">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          id="pro-firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Juan"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[rgba(209,106,138,0.2)] focus:border-ensigna-primary text-gray-900 placeholder-gray-400 transition-all"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="pro-lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Apellido <span className="text-ensigna-primary">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          id="pro-lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Pérez"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[rgba(209,106,138,0.2)] focus:border-ensigna-primary text-gray-900 placeholder-gray-400 transition-all"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="pro-specialty" className="block text-sm font-medium text-gray-700 mb-2">
                      Especialidad
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="pro-specialty"
                        type="text"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Cardiología, Pediatría, Dermatología..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[rgba(209,106,138,0.2)] focus:border-ensigna-primary text-gray-900 placeholder-gray-400 transition-all"
                        disabled={loading}
                      />
                    </div>
                  </div>



                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pro-licenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Matrícula profesional
                      </label>
                      <div className="relative">
                        <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          id="pro-licenseNumber"
                          type="text"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="MN 12345"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[rgba(209,106,138,0.2)] focus:border-ensigna-primary text-gray-900 placeholder-gray-400 transition-all"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="pro-phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          id="pro-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+54 11 1234-5678"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[rgba(209,106,138,0.2)] focus:border-ensigna-primary text-gray-900 placeholder-gray-400 transition-all"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50/50">
                    <input
                      id="pro-managedByClinic"
                      type="checkbox"
                      checked={managedByClinic}
                      onChange={(e) => setManagedByClinic(e.target.checked)}
                      disabled={loading}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-ensigna-primary focus:ring-ensigna-primary"
                    />
                    <label htmlFor="pro-managedByClinic" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Gestionado por la clínica (no tendrá cuenta de usuario). La clínica configurará su horario y disponibilidad.
                    </label>
                  </div>

                    </form>
                  </>
                )}
              </div>

              {/* Footer del modal */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                {success ? (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Listo
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-white disabled:opacity-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      form="create-professional-form"
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-6 py-2.5 gradient-red text-white rounded-xl font-semibold hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-ensigna-primary/25"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Crear profesional
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
