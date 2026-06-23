'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { apiClient, type MedicalOrderDto } from '@/lib/api';

type Props = { patientId: string; compact?: boolean };

function statusLabel(status: MedicalOrderDto['status']): string {
  if (status === 'EMITTED' || status === 'ISSUED') return 'Emitida';
  if (status === 'PENDING_APPROVAL') return 'Pendiente';
  if (status === 'FAILED') return 'Fallida';
  if (status === 'REJECTED') return 'Rechazada';
  return status;
}

export default function PatientOrdersSection({ patientId, compact }: Props) {
  const [items, setItems] = useState<MedicalOrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .listMedicalOrders({ patientId, limit: compact ? 5 : 20 })
      .then((res) => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [patientId, compact]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Órdenes médicas</h2>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">Este paciente aún no tiene órdenes médicas.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString('es-AR')} · {statusLabel(order.status)}
                  </p>
                  <p className="text-gray-600">{order.diagnosisDescription}</p>
                </div>
                {order.pdfUrl && (
                  <a href={order.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-600 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Ver PDF
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
