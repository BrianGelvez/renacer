'use client';

import { motion } from 'framer-motion';
import { ClockIcon, MapPin, Navigation } from 'lucide-react';

interface ClinicData {
  address?: string;
  city?: string;
  province?: string;
}

interface LocationProps {
  clinic: ClinicData | null;
}

export default function Location({ clinic }: LocationProps) {
  return (
    <section id="ubicacion" className="py-24 ensigna-page-bg w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Cómo Llegar
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Encuéntranos en San José de la Dormida, Córdoba. Estamos aquí para
            atenderte
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Información de dirección */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 lg:p-10 shadow-xl border border-gray-100">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-14 h-14 bg-ensigna-accent-soft rounded-xl flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-ensigna-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Nuestra Ubicación
                  </h3>
                  <p className="text-lg text-gray-600">
                    {[clinic?.address, clinic?.city, clinic?.province].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Información de Acceso
                </h4>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start space-x-3">
                    <Navigation className="w-5 h-5 text-ensigna-primary mt-0.5 flex-shrink-0" />
                    <span>Fácil acceso desde el centro de la ciudad</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Navigation className="w-5 h-5 text-ensigna-primary mt-0.5 flex-shrink-0" />
                    <span>Estacionamiento disponible</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Navigation className="w-5 h-5 text-ensigna-primary mt-0.5 flex-shrink-0" />
                    <span>Transporte público cercano</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Mapa de Google */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3442.811519294931!2d-63.955157103210475!3d-30.356306099999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x943220188dfbe69f%3A0xc841596f7fcd185c!2sSan%20Jose%20de%20la%20Dormida%2C%20C%C3%B3rdoba!5e0!3m2!1ses!2sar!4v1769466955057!5m2!1ses!2sar"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
