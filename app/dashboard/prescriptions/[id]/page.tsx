'use client';

import { useParams } from 'next/navigation';
import MedicalDocumentDetailView from '@/components/dashboard/MedicalDocumentDetailView';

export default function MedicalDocumentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  if (!id) return null;
  return <MedicalDocumentDetailView id={id} />;
}
