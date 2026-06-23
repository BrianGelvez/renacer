'use client';

import OrderWizard, { type OrderWizardProps } from '@/components/orders/OrderWizard';

export default function NewOrderSection(props: OrderWizardProps) {
  return <OrderWizard {...props} />;
}
