'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PrescriptionPendingListSection from '@/components/prescriptions/PrescriptionPendingListSection';

export default function PrescriptionsPendingPage() {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-100 pb-1">
        <Link
          href="/dashboard/prescriptions"
          className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
            pathname === '/dashboard/prescriptions'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Emitidas
        </Link>
        <Link
          href="/dashboard/prescriptions/pending"
          className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
            pathname?.startsWith('/dashboard/prescriptions/pending')
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Pendientes de firma
        </Link>
      </div>
      <PrescriptionPendingListSection />
    </div>
  );
}
