'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Building2 } from 'lucide-react';

interface ClinicData {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  isActive: boolean;
}

interface AboutClinicProps {
  clinic: ClinicData | null;
}

export default function AboutClinic({ clinic }: AboutClinicProps) {
  if (!clinic) {
    return (
      <section id="sobre-nosotros" className="py-20 ensigna-page-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="ensigna-glass rounded-[var(--ensigna-radius-lg)] p-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Información no disponible
            </h2>
            <p className="text-gray-600">
              No se pudo cargar la información del centro médico en este momento.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!clinic.isActive) {
    return (
      <section id="sobre-nosotros" className="py-20 ensigna-page-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="ensigna-glass rounded-[var(--ensigna-radius-lg)] p-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Centro Médico Temporalmente Cerrado
            </h2>
            <p className="text-gray-600">
              Estamos realizando mejoras en nuestras instalaciones. Pronto
              estaremos de vuelta para atenderte.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const infoItems = [
    {
      icon: Building2,
      label: 'Nombre',
      value: clinic.name,
      show: true,
    },
    {
      icon: MapPin,
      label: 'Dirección',
      value: [clinic.address, clinic.city, clinic.province].filter(Boolean).join(', ') || undefined,
      show: !!(clinic.address || clinic.city || clinic.province),
    },
    {
      icon: Phone,
      label: 'Teléfono',
      value: clinic.phone,
      show: !!clinic.phone,
    },
    {
      icon: Mail,
      label: 'Email',
      value: clinic.email,
      show: !!clinic.email,
    },
  ].filter((item) => item.show);

  return (
    <section id="sobre-nosotros" className="py-24 ensigna-page-bg w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Sobre el Centro Médico
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Un espacio diseñado para tu bienestar, con instalaciones modernas y
            un equipo comprometido con tu salud
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
          {/* Imagen del consultorio - placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-ensigna-soft/40 via-white to-gray-50">
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="text-center">
                    <Building2 className="w-24 h-24 text-ensigna-primary-light mx-auto mb-4" />
                    <p className="text-gray-400 text-sm font-medium">
                      {/* TODO: Reemplazar con imagen real del consultorio */}
                      Imagen: Instalaciones del centro médico
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-ensigna-soft/50 rounded-full blur-2xl -z-10"></div>
          </motion.div>

          {/* Información */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
              <div className="space-y-6">
                {infoItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start space-x-4 group"
                    >
                      <div className="flex-shrink-0 w-14 h-14 bg-ensigna-accent-soft rounded-xl flex items-center justify-center group-hover:bg-ensigna-accent transition-colors">
                        <Icon className="w-7 h-7 text-ensigna-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          {item.label}
                        </h3>
                        <p className="text-lg sm:text-xl font-semibold text-gray-900">
                          {item.value}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
