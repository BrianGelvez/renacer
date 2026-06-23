'use client';

import Link from 'next/link';
import OrdersListSection from '@/components/orders/OrdersListSection';

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 border-b border-gray-100 pb-4">
        <Link
          href="/dashboard/orders"
          className="rounded-lg bg-teal-100 px-3 py-1.5 text-sm font-medium text-teal-800"
        >
          Emitidas
        </Link>
        <Link
          href="/dashboard/orders/pending"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Pendientes de aprobación
        </Link>
        <Link
          href="/dashboard/orders/new"
          className="ml-auto rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
        >
          Nueva orden
        </Link>
      </div>
      <OrdersListSection />
    </div>
  );
}
