/** Validación mínima para PUT /patients Recetario (preflight local del backend). */
export function validateRecetarioPatientForm(input: {
  dni: string;
  birthDate: string;
  gender: string;
  healthInsuranceId?: string;
  recetarioHealthInsuranceId?: string;
  affiliateNumber: string;
}): string | null {
  const dniDigits = input.dni.replace(/\D/g, '');
  if (dniDigits.length < 6) {
    return 'Para Recetario, el DNI debe tener al menos 6 dígitos.';
  }
  if (!input.birthDate) {
    return 'Para Recetario, la fecha de nacimiento es obligatoria.';
  }
  if (!input.gender) {
    return 'Para Recetario, el género es obligatorio.';
  }
  const hasInsurance =
    !!input.healthInsuranceId || !!input.recetarioHealthInsuranceId;
  if (hasInsurance && !input.affiliateNumber.trim()) {
    return 'El número de afiliado es obligatorio cuando hay obra social.';
  }
  return null;
}

export function isClinicRecetarioLinked(
  healthCenterId: number | null | undefined,
): boolean {
  return healthCenterId != null && Number.isFinite(healthCenterId);
}
