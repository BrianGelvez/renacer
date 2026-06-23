'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import NewPrescriptionSection from '@/components/dashboard/NewPrescriptionSection';

function NewPrescriptionPageContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId') ?? undefined;

  return (
    <NewPrescriptionSection
      initialPatientId={patientId}
      lockPatient={!!patientId}
    />
  );
}

export default function NewPrescriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <NewPrescriptionPageContent />
    </Suspense>
  );
}
