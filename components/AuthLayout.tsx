'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen ensigna-page-bg py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-ensigna-primary/15 blur-3xl" />
        <div className="absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-ensigna-soft/40 blur-3xl" />
      </div>
      <div className="relative max-w-md w-full mx-auto">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-6 min-h-10">
            <div className="relative h-10 w-10 sm:h-36 sm:w-36">
              <Image
                src="/logo-renacer.png"
                alt="Renacer"
                fill
                className="object-contain"
                priority
              />
            </div>
            {/* <span className="text-xl sm:text-2xl font-bold text-[var(--ensigna-text)]">
              Renacer
            </span> */}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ensigna-text-secondary)] hover:text-ensigna-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="ensigna-modal-panel overflow-hidden"
        >
          <div className="px-6 sm:px-8 pt-8 pb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ensigna-text)] text-center">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-center text-sm text-[var(--ensigna-text-secondary)]">
                {subtitle}
              </p>
            )}
          </div>
          <div className="px-6 sm:px-8 pb-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
