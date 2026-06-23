'use client';

import { useParams } from 'next/navigation';
import PrescriptionCorrectionEditor from '@/components/prescriptions/PrescriptionCorrectionEditor';

export default function PrescriptionCorrectionEditPage() {
  const params = useParams();
  const id = params?.id as string;
  if (!id) return null;
  return <PrescriptionCorrectionEditor prescriptionId={id} />;
}
