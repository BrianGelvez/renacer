'use client';

import { useParams } from 'next/navigation';
import OrderDetailView from '@/components/orders/OrderDetailView';

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  if (!id) return null;
  return <OrderDetailView orderId={id} />;
}
