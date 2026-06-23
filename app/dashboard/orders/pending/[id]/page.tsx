'use client';

import { useParams } from 'next/navigation';
import OrderPendingApprovalView from '@/components/orders/OrderPendingApprovalView';

export default function OrderPendingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  if (!id) return null;
  return <OrderPendingApprovalView orderId={id} />;
}
