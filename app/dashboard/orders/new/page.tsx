'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import NewOrderSection from '@/components/orders/NewOrderSection';

function NewOrderContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId') ?? undefined;
  return (
    <NewOrderSection
      initialPatientId={patientId}
      lockPatient={!!patientId}
    />
  );
}

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        </div>
      }
    >
      <NewOrderContent />
    </Suspense>
  );
}
