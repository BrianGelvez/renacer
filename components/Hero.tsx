'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Play, Shield, Clock, Heart, MapPin, Calendar } from 'lucide-react';

const clinicSlug = process.env.NEXT_PUBLIC_CLINIC_SLUG || 'consultorio-ensigna';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center ensigna-page-bg pt-36 md:pt-24 pb-16 overflow-hidden w-full">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-ensigna-soft/35 via-[var(--ensigna-background)] to-ensigna-primary/10" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-ensigna-soft/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-ensigna-primary-light/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge superior */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-ensigna-accent-soft rounded-full mb-8"
          >
            <Shield className="w-4 h-4 text-ensigna-primary" />
            <span className="text-sm font-semibold text-ensigna-primary-dark">
              Centro Médico Certificado
            </span>
          </motion.div>

          {/* Título principal */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-[var(--ensigna-text)] mb-6 leading-tight tracking-tight"
          >
            Cuidamos tu salud con
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 text-ensigna-primary">excelencia médica</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 1.2, ease: 'easeOut' }}
                className="absolute bottom-3 left-0 right-0 h-4 bg-ensigna-soft/50 -z-0"
                style={{ transformOrigin: 'left' }}
              />
            </span>
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-lg sm:text-xl md:text-2xl text-[var(--ensigna-text-secondary)] mb-12 max-w-3xl mx-auto leading-relaxed px-4"
          >
            En <strong className="text-[var(--ensigna-text)]">Renacer</strong> combinamos la
            experiencia médica con tecnología de vanguardia. Un espacio diseñado
            para tu bienestar, donde cada atención cuenta.
          </motion.p>

          {/* CTAs públicos (pacientes): sin acceso al sistema */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 px-4"
          >
            <Link
              href={`/public/${clinicSlug}/agenda`}
              className="group btn-ensigna-primary !px-8 !py-4 text-base sm:text-lg min-w-[200px] shadow-ensigna-primary"
            >
              <Calendar className="w-5 h-5" />
              <span>Reservar turno</span>
            </Link>
            <Link
              href="#sobre-nosotros"
              className="group btn-ensigna-secondary !px-8 !py-4 text-base sm:text-lg min-w-[200px] !border-2 !border-ensigna-primary !text-ensigna-primary hover:!bg-ensigna-accent"
            >
              <Play className="w-5 h-5" />
              <span>Conocer más</span>
            </Link>
            <Link
              href="#ubicacion"
              className="group btn-ensigna-secondary !px-8 !py-4 text-base sm:text-lg min-w-[200px] !border-2 !border-ensigna-primary !text-ensigna-primary hover:!bg-ensigna-accent"
            >
              <MapPin className="w-5 h-5" />
              <span>Dónde estamos</span>
            </Link>
          </motion.div>

          {/* Features destacados */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4"
          >
            {[
              {
                icon: Clock,
                title: 'Atención rápida',
                description: 'Turnos disponibles',
              },
              {
                icon: Heart,
                title: 'Cuidado integral',
                description: 'Múltiples especialidades',
              },
              {
                icon: Shield,
                title: 'Confianza total',
                description: 'Profesionales certificados',
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="ensigna-glass rounded-[var(--ensigna-radius-lg)] p-6 transition-all duration-200 hover:shadow-ensigna-hover"
                >
                  <div className="w-12 h-12 bg-ensigna-primary/15 backdrop-blur-sm rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Icon className="w-6 h-6 text-ensigna-primary" />
                  </div>
                  <h3 className="font-bold text-[var(--ensigna-text)] mb-1 text-sm sm:text-base">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--ensigna-text-secondary)]">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
