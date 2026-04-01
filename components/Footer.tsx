'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';

interface ClinicData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
}

interface FooterProps {
  clinic: ClinicData | null;
}

export default function Footer({ clinic }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-gray-300 relative overflow-hidden w-full">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-ensigna-primary rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-ensigna-primary-light rounded-full blur-3xl opacity-35"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {/* Brand */}
          <div>
            <h3 className="text-3xl font-bold text-white mb-6">Renacer</h3>
            <p className="text-gray-400 leading-relaxed text-base">
              Centro Médico comprometido con tu salud y bienestar, utilizando
              tecnología de vanguardia para brindarte la mejor atención médica.
            </p>
          </div>

          {/* Contact Info */}
          {clinic && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">
                Información de Contacto
              </h4>
              <div className="space-y-3">
                {clinic.name && (
                  <p className="text-gray-400 font-medium">{clinic.name}</p>
                )}
                {(clinic.address || clinic.city || clinic.province) && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-ensigna-primary-light mt-0.5 flex-shrink-0" />
                    <p className="text-gray-400">
                      {[clinic.address, clinic.city, clinic.province].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                {clinic.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-ensigna-primary-light flex-shrink-0" />
                    <a
                      href={`tel:${clinic.phone}`}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {clinic.phone}
                    </a>
                  </div>
                )}
                {clinic.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-ensigna-primary-light flex-shrink-0" />
                    <a
                      href={`mailto:${clinic.email}`}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {clinic.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#sobre-nosotros"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Sobre Nosotros
                </a>
              </li>
              <li>
                <a
                  href="#servicios"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Servicios
                </a>
              </li>
              <li>
                <a
                  href="#beneficios"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Beneficios
                </a>
              </li>
              <li>
                <a
                  href="#nuestro-enfoque"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Nuestro Enfoque
                </a>
              </li>
              <li>
                <a
                  href="#ubicacion"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Ubicación
                </a>
              </li>
              <li>
                <a
                  href="/login"
                  className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
                  title="Acceso para profesionales"
                >
                  Acceso profesionales
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center space-y-3">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} ENSIGNA - Centro Médico. Todos los
            derechos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
            <Link
              href="/privacidad"
              className="text-gray-500 hover:text-white transition-colors"
            >
              Política de privacidad
            </Link>
            <span className="text-gray-600 hidden sm:inline" aria-hidden>
              ·
            </span>
            <Link
              href="/condiciones"
              className="text-gray-500 hover:text-white transition-colors"
            >
              Condiciones del servicio
            </Link>
          </div>
          <p className="text-gray-500 text-xs">
            Tecnología al servicio de la salud
          </p>
        </div>
      </div>
    </footer>
  );
}
