'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const trustPoints = [
  'Atención médica con respaldo profesional y experiencia comprobada',
  'Un espacio pensado para tu bienestar y comodidad',
  'Tecnología al servicio de la salud, sin perder el trato humano',
  'Compromiso con tu salud integral y seguimiento continuo',
];

export default function TrustSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-[#D16A8A] via-[#c75f82] to-[#E89AB0] relative overflow-hidden w-full">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Confianza y Cercanía
          </h2>
          <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            En Renacer, creemos que la mejor medicina combina conocimiento,
            tecnología y, sobre todo, un trato cercano y empático
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 lg:p-12 border border-white/20"
        >
          <div className="space-y-6">
            {trustPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start space-x-4"
              >
                <div className="flex-shrink-0 w-6 h-6 mt-1">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <p className="text-lg sm:text-xl text-white leading-relaxed">
                  {point}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-white/90 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Tu salud es nuestra prioridad. Estamos aquí para acompañarte en cada
            paso de tu camino hacia el bienestar.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
