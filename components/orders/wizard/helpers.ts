import type { DiagnosisSelection } from '@/components/prescriptions/DiagnosisAutocomplete';
import type { LocalOrderRequestItem } from '@/components/orders/OrderRequestStep';
import type { MedicalOrderTemplateCategory } from '@/lib/api';

export type {
  PatientDetail,
  PatientListItem,
} from '@/components/prescriptions/wizard/helpers';

export {
  calcAge,
  displayToIso,
  formatSavedAgo,
  isoToDisplay,
  pushRecentToStorage,
  readRecentFromStorage,
  todayIsoDate,
} from '@/components/prescriptions/wizard/helpers';

export type OrderWizardDraft = {
  doctorId: string;
  selectedPatientId: string | null;
  requestItems: LocalOrderRequestItem[];
  selectedDiagnosis: DiagnosisSelection | null;
  dateDisplay: string;
  savedAt: number;
};

export const CATEGORY_LABELS: Record<MedicalOrderTemplateCategory, string> = {
  MANUAL: 'Manual / Interconsulta',
  IMAGING: 'Estudio por imágenes',
  LABORATORY: 'Laboratorio',
};

export const CATEGORY_GROUPS: Array<{
  id: MedicalOrderTemplateCategory;
  label: string;
  hint: string;
}> = [
  { id: 'LABORATORY', label: 'Laboratorio', hint: 'Análisis clínicos, sangre, orina…' },
  { id: 'IMAGING', label: 'Imágenes', hint: 'Radiología, ecografía, tomografía…' },
  { id: 'MANUAL', label: 'Manual', hint: 'Interconsultas y solicitudes libres' },
];

export function genderLabel(gender?: string | null): string | null {
  if (!gender) return null;
  const map: Record<string, string> = {
    M: 'Masculino',
    F: 'Femenino',
    X: 'Otro',
    male: 'Masculino',
    female: 'Femenino',
  };
  return map[gender] ?? gender;
}

export function newRequestKey(): string {
  return crypto.randomUUID();
}

export type OrderPatientDetail = import('@/components/prescriptions/wizard/helpers').PatientDetail & {
  gender?: string | null;
  notes?: string | null;
};

export function orderTypeSummary(items: LocalOrderRequestItem[]): string {
  if (items.length === 0) return 'Sin solicitudes';
  const cats = [...new Set(items.map((i) => CATEGORY_LABELS[i.category]))];
  return cats.join(', ');
}
