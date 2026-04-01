'use client';

import { motion } from 'framer-motion';
import { Heart, Activity, Stethoscope, Users } from 'lucide-react';

const services = [
  {
    icon: Stethoscope,
    title: 'Clínica Médica',
    description:
      'Atención médica general con profesionales altamente capacitados y tecnología de última generación.',
    color: 'bg-ensigna-accent-soft text-ensigna-primary',
  },
  {
    icon: Heart,
    title: 'Cardiología',
    description:
      'Especialistas en el cuidado del corazón con equipamiento de diagnóstico avanzado.',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    icon: Activity,
    title: 'Consultas Generales',
    description:
      'Atención integral para toda la familia con enfoque preventivo y de bienestar.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Users,
    title: 'Medicina Familiar',
    description:
      'Acompañamiento continuo en el cuidado de la salud de todos los miembros de tu familia.',
    color: 'bg-green-100 text-green-600',
  },
];

export default function Services() {
  return (
    <section id="servicios" className="py-24 bg-gradient-to-b from-ensigna-soft/25 to-[var(--ensigna-background)] relative overflow-hidden w-full">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-ensigna-soft/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-ensigna-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Nuestros Servicios
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Especialidades médicas con respaldo profesional y tecnología de
            última generación
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -12, scale: 1.02 }}
                className="group ensigna-glass rounded-[var(--ensigna-radius-lg)] p-8 transition-all duration-200 hover:shadow-ensigna-hover relative overflow-hidden"
              >
                {/* Hover effect background */}
                <div className="absolute inset-0 bg-gradient-to-br from-ensigna-soft/0 to-ensigna-soft/0 group-hover:from-ensigna-soft/40 group-hover:to-transparent transition-all duration-300"></div>
                
                <div className="relative z-10">
                  <div
                    className={`w-16 h-16 ${service.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-base">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
