'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';

interface ClinicData {
  phone?: string;
}

interface CTAProps {
  clinic: ClinicData | null;
}

export default function CTA({ clinic }: CTAProps) {
  const phone = clinic?.phone?.trim() ?? '';
  const hasPhone = phone.length > 0;

  return (
    <section className="py-24 bg-gradient-to-br from-[#D16A8A] via-[#d16a8a] to-[#E89AB0] relative overflow-hidden w-full shadow-ensigna">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Te esperamos
          </h2>
          <p className="text-xl sm:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Visitanos, contactanos por teléfono o escribinos. Estamos para
            cuidarte.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="#ubicacion"
              className="group px-10 py-5 bg-white text-ensigna-primary rounded-xl hover:bg-gray-50 transition-all font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <MapPin className="w-5 h-5" />
              <span>Ver ubicación</span>
            </Link>
            {hasPhone && (
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="px-10 py-5 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white/10 transition-all font-semibold text-lg shadow-lg flex items-center justify-center space-x-2"
              >
                <Phone className="w-5 h-5" />
                <span>Llamar</span>
              </a>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
