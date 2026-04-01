'use client';

import { motion } from 'framer-motion';
import { Heart, Users, Zap, Shield } from 'lucide-react';

const approaches = [
  {
    icon: Heart,
    title: 'Atención Humana',
    description:
      'Cada paciente es único. Nos tomamos el tiempo para escucharte, entender tus necesidades y brindarte un trato personalizado que va más allá de la consulta médica.',
    color: 'from-ensigna-soft to-ensigna-accent-soft',
    iconColor: 'text-ensigna-primary',
  },
  {
    icon: Users,
    title: 'Profesionalismo',
    description:
      'Nuestro equipo médico está altamente capacitado y comprometido con la excelencia. Continuamente actualizamos nuestros conocimientos para ofrecerte los mejores tratamientos.',
    color: 'from-blue-100 to-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: Zap,
    title: 'Tecnología Aplicada',
    description:
      'Utilizamos sistemas digitales avanzados que agilizan procesos, mejoran la precisión diagnóstica y optimizan tu experiencia como paciente.',
    color: 'from-yellow-100 to-yellow-50',
    iconColor: 'text-yellow-600',
  },
  {
    icon: Shield,
    title: 'Confianza y Seguridad',
    description:
      'Tus datos médicos están protegidos con los más altos estándares de seguridad. Tu privacidad y confidencialidad son nuestra prioridad.',
    color: 'from-green-100 to-green-50',
    iconColor: 'text-green-600',
  },
];

export default function OurApproach() {
  return (
    <section id="nuestro-enfoque" className="py-24 bg-gradient-to-b from-[var(--ensigna-background)] via-ensigna-soft/20 to-[var(--ensigna-background)] relative overflow-hidden w-full">
      {/* Background decoration */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-ensigna-soft/35 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-blue-50/30 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Nuestro Enfoque
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Tres pilares fundamentales que guían cada decisión y cada atención
            en nuestro centro médico
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {approaches.map((approach, index) => {
            const Icon = approach.icon;
            return (
              <motion.div
                key={approach.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ y: -8 }}
                className="group relative"
              >
                <div className={`bg-gradient-to-br ${approach.color} rounded-2xl p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all border border-white/50 h-full`}>
                  <div className="flex items-start space-x-6">
                    <div className={`flex-shrink-0 w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 ${approach.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        {approach.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-base">
                        {approach.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
