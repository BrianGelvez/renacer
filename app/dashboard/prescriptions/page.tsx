'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import MedicalDocumentsSection from '@/components/dashboard/MedicalDocumentsSection';

function PrescriptionsListContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const doctorUserId = searchParams.get('doctorUserId') ?? undefined;
  const patientId = searchParams.get('patientId') ?? undefined;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-100 pb-1">
        <Link
          href="/dashboard/prescriptions"
          className={`px-3 py-2 text-sm font-medium rounded-t-lg ${
            pathname === '/dashboard/prescriptions'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Emitidas
        </Link>
        <Link
          href="/dashboard/prescriptions/pending"
          className={`px-3 py-2 text-sm font-medium rounded-t-lg ${
            pathname?.startsWith('/dashboard/prescriptions/pending')
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Pendientes de firma
        </Link>
      </div>
      <MedicalDocumentsSection
        initialDoctorUserId={doctorUserId}
        patientId={patientId}
      />
    </div>
  );
}
export default function PrescriptionsListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <PrescriptionsListContent />
    </Suspense>
  );
}
