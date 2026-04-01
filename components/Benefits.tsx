'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Shield, Zap } from 'lucide-react';

const benefits = [
  {
    icon: CheckCircle2,
    title: 'Organización Total',
    description:
      'Gestiona turnos, pacientes y profesionales desde una plataforma centralizada y eficiente.',
    color: 'text-ensigna-primary',
  },
  {
    icon: Clock,
    title: 'Atención Profesional',
    description:
      'Equipo médico altamente capacitado comprometido con tu bienestar y salud integral.',
    color: 'text-blue-600',
  },
  {
    icon: Zap,
    title: 'Tecnología Aplicada',
    description:
      'Sistema digital avanzado que agiliza procesos y mejora la experiencia de atención.',
    color: 'text-yellow-600',
  },
  {
    icon: Shield,
    title: 'Confianza y Seguridad',
    description:
      'Tus datos médicos están protegidos con los más altos estándares de seguridad.',
    color: 'text-green-600',
  },
];

export default function Benefits() {
  return (
    <section id="beneficios" className="py-24 ensigna-page-bg w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            ¿Por qué elegirnos?
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            La combinación perfecta entre atención humana, profesionalismo y
            tecnología aplicada a la salud
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl mb-6 group-hover:shadow-2xl transition-all"
                >
                  <Icon className={`w-10 h-10 ${benefit.color}`} />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
