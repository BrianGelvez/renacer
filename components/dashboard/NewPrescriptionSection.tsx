'use client';

import PrescriptionWizard from '@/components/prescriptions/PrescriptionWizard';

export type NewPrescriptionSectionProps = {
  initialPatientId?: string;
  lockPatient?: boolean;
};

export default function NewPrescriptionSection({
  initialPatientId,
  lockPatient = false,
}: NewPrescriptionSectionProps) {
  return (
    <PrescriptionWizard
      initialPatientId={initialPatientId}
      lockPatient={lockPatient}
    />
  );
}
