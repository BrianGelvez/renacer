import type { DiagnosisSelection } from '@/components/prescriptions/DiagnosisAutocomplete';
import type { SelectedMedication } from '@/lib/api';

export type MedicineLine = {
  key: string;
  selection: SelectedMedication | null;
  posology: string;
  quantity: number;
  longTerm: boolean;
  genericOnly: boolean;
  brandRecommendation: boolean;
  requiresDuplicate: boolean;
};

export type PatientListItem = {
  id: string;
  firstName: string;
  lastName: string;
  dni?: string | null;
  phone?: string | null;
  birthDate?: string | null;
};

export type PatientInsuranceRow = {
  isPrimary: boolean;
  isActive: boolean;
  affiliateNumber: string;
  healthInsurance: { name: string };
};

export type PatientDetail = PatientListItem & {
  healthInsurancePlan?: string | null;
  insurances?: PatientInsuranceRow[];
};

export type WizardDraft = {
  doctorId: string;
  selectedPatientId: string | null;
  medicines: MedicineLine[];
  selectedDiagnosis: DiagnosisSelection | null;
  clinicalNotes: string;
  dateDisplay: string;
  hiv: boolean;
  recurringEnabled: boolean;
  recurringDays: 30 | 60 | 90;
  recurringQuantity: number;
  savedAt: number;
};

export function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isoToDisplay(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function displayToIso(display: string): string | null {
  const trimmed = display.trim();
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = String(Number.parseInt(m[1], 10)).padStart(2, '0');
  const month = String(Number.parseInt(m[2], 10)).padStart(2, '0');
  const year = m[3];
  if (Number.parseInt(month, 10) < 1 || Number.parseInt(month, 10) > 12) return null;
  if (Number.parseInt(day, 10) < 1 || Number.parseInt(day, 10) > 31) return null;
  return `${year}-${month}-${day}`;
}

export function emptyMedicineLine(): MedicineLine {
  return {
    key: crypto.randomUUID(),
    selection: null,
    posology: '',
    quantity: 1,
    longTerm: false,
    genericOnly: false,
    brandRecommendation: false,
    requiresDuplicate: false,
  };
}

export function calcAge(birthDate?: string | null): string | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  const age = Math.floor(
    (Date.now() - b.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
  return `${age} años`;
}

export function formatSavedAgo(savedAt: number | null): string | null {
  if (!savedAt) return null;
  const sec = Math.max(0, Math.floor((Date.now() - savedAt) / 1000));
  if (sec < 5) return 'Guardado recién';
  if (sec < 60) return `Guardado hace ${sec} s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `Guardado hace ${min} min`;
  return `Guardado hace ${Math.floor(min / 60)} h`;
}

export function readRecentFromStorage<T>(key: string, limit = 5): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed.slice(0, limit) : [];
  } catch {
    return [];
  }
}

export function pushRecentToStorage<T>(key: string, item: T, limit = 8): void {
  if (typeof window === 'undefined') return;
  try {
    const current = readRecentFromStorage<T>(key, limit);
    const next = [
      item,
      ...current.filter(
        (x) => JSON.stringify(x) !== JSON.stringify(item),
      ),
    ].slice(0, limit);
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}
