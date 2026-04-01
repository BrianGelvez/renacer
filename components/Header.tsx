'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full overflow-x-hidden ensigna-header-public ${
        isScrolled ? 'shadow-ensigna-hover' : 'shadow-ensigna'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 min-h-10">
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
              <Image
                src="/logo-renacer.png"
                alt="Renacer"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg sm:text-xl font-bold text-[var(--ensigna-text)]">
              Renacer
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <a
              href="#sobre-nosotros"
              className="text-[var(--ensigna-text-secondary)] hover:text-ensigna-primary transition-colors font-medium"
            >
              Sobre Nosotros
            </a>
            <a
              href="#servicios"
              className="text-[var(--ensigna-text-secondary)] hover:text-ensigna-primary transition-colors font-medium"
            >
              Servicios
            </a>
            <a
              href="#beneficios"
              className="text-[var(--ensigna-text-secondary)] hover:text-ensigna-primary transition-colors font-medium"
            >
              Beneficios
            </a>
            <a
              href="#ubicacion"
              className="text-[var(--ensigna-text-secondary)] hover:text-ensigna-primary transition-colors font-medium"
            >
              Ubicación
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href={`/public/${process.env.NEXT_PUBLIC_CLINIC_SLUG || 'consultorio-ensigna'}/agenda`}
              className="btn-ensigna-primary text-sm !py-2.5 !px-5"
            >
              Reservar turno
            </Link>
            <Link
              href="/login"
              className="text-sm text-[var(--ensigna-text-secondary)] hover:text-[var(--ensigna-text)] transition-colors"
              title="Acceso para profesionales"
            >
              Ingresar
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[var(--ensigna-text-secondary)] hover:text-ensigna-primary transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-black/[0.06] py-4 space-y-4"
            >
              <a
                href="#sobre-nosotros"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-[var(--ensigna-text-secondary)] hover:text-ensigna-primary transition-colors font-medium"
              >
                Sobre Nosotros
              </a>
              <a
                href="#servicios"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-[var(--ensigna-text-secondary)] hover:text-ensigna-primary transition-colors font-medium"
              >
                Servicios
              </a>
              <a
                href="#beneficios"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-[var(--ensigna-text-secondary)] hover:text-ensigna-primary transition-colors font-medium"
              >
                Beneficios
              </a>
              <a
                href="#ubicacion"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-[var(--ensigna-text-secondary)] hover:text-ensigna-primary transition-colors font-medium"
              >
                Ubicación
              </a>
              <div className="px-4 pt-4 border-t border-black/[0.06] space-y-2">
                <Link
                  href={`/public/${process.env.NEXT_PUBLIC_CLINIC_SLUG || 'consultorio-ensigna'}/agenda`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center btn-ensigna-primary !py-3"
                >
                  Reservar turno
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 text-sm text-[var(--ensigna-text-secondary)] hover:text-[var(--ensigna-text)] transition-colors"
                  title="Acceso para profesionales"
                >
                  Ingresar
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
