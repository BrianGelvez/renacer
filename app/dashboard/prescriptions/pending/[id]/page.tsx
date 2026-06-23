'use client';

import { useParams } from 'next/navigation';
import PrescriptionPendingApprovalView from '@/components/prescriptions/PrescriptionPendingApprovalView';

export default function PrescriptionPendingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  if (!id) return null;
  return <PrescriptionPendingApprovalView prescriptionId={id} />;
}
