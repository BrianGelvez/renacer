'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardList, Loader2 } from 'lucide-react';
import { apiClient, type MedicalOrderDto } from '@/lib/api';

export default function OrderPendingListSection() {
  const router = useRouter();
  const [items, setItems] = useState<MedicalOrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .listPendingMedicalOrders()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Órdenes pendientes</h1>
          <p className="text-sm text-gray-500">Solicitudes que requieren revisión del médico</p>
        </div>
        <Link href="/dashboard/orders" className="text-sm text-teal-600 hover:underline">
          Ver emitidas
        </Link>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
        ) : items.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-gray-500">No hay órdenes pendientes.</p>
        ) : (
          <ul className="divide-y">
            {items.map((rx) => (
              <li key={rx.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/orders/pending/${rx.id}`)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {rx.patient ? `${rx.patient.lastName}, ${rx.patient.firstName}` : 'Paciente'}
                    </p>
                    <p className="text-sm text-gray-500 truncate max-w-md">{rx.diagnosisDescription}</p>
                  </div>
                  <ClipboardList className="h-5 w-5 text-teal-600 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
