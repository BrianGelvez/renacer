import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

export type ClinicTeamRole =
  | 'OWNER'
  | 'ADMIN'
  | 'SECRETARY'
  | 'DOCTOR';

/** Estado de sincronización del médico con Recetario (User). */
export type RecetarioDoctorUserSyncStatus =
  | 'PENDING'
  | 'SYNCED'
  | 'SYNCED_IMMUTABLE_SANDBOX'
  | 'FAILED'
  | null;

/** Una fila de `GET /users/team`: `User` + `ClinicUser` en la clínica actual. */
export type ClinicTeamMemberDto = {
  id: string;
  clinicUserId: string;
  userId: string;
  email: string;
  name: string;
  lastName: string;
  firstName: string;
  phone: string | null;
  role: ClinicTeamRole;
  isActive: boolean;
  /** Indica si el usuario puede actuar como médico (emitir recetas). */
  isDoctor: boolean;
  specialty: string | null;
  licenseNumber: string | null;
  managedByClinic: boolean | null;
  hasAccount: boolean;
  recetarioUserId: number | null;
  recetarioActive: boolean | null;
  recetarioSyncStatus: RecetarioDoctorUserSyncStatus;
  recetarioSyncedAt: string | null;
  recetarioLastError: string | null;
  recetarioEnvironment?: 'STAGING' | 'PRODUCTION' | null;
  recetarioIsTestUser?: boolean;
  recetarioRemoteImmutable?: boolean;
  createdAt: string;
};

export type UserProfileDto = {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role?: ClinicTeamRole;
  clinicId?: string;
  isDoctor: boolean;
  title?: string | null;
  specialty?: string | null;
  licenseType?: string | null;
  licenseNumber?: string | null;
  documentNumber?: string | null;
  workPhone?: string | null;
  address?: string | null;
  province?: string | null;
  prescriptionLegend?: string | null;
  signatureUrl?: string | null;
  recetarioUserId?: number | null;
  recetarioActive?: boolean | null;
  recetarioSyncStatus?: RecetarioDoctorUserSyncStatus;
  recetarioSyncedAt?: string | null;
  recetarioLastError?: string | null;
  recetarioEnvironment?: 'STAGING' | 'PRODUCTION' | null;
  recetarioIsTestUser?: boolean;
  recetarioRemoteImmutable?: boolean;
};

export type UpdateMeApiPayload = {
  name?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  avatar?: string | null;
  isDoctor?: boolean;
  title?: string | null;
  specialty?: string | null;
  licenseType?: string | null;
  licenseNumber?: string | null;
  documentNumber?: string | null;
  workPhone?: string | null;
  address?: string | null;
  province?: string | null;
  prescriptionLegend?: string | null;
  signatureUrl?: string | null;
};

export type UpsertDoctorRecetarioPayload = {
  contactEmail?: string | null;
  licenseType?: string | null;
  documentNumber?: string | null;
  title?: string | null;
  workPhone?: string | null;
  address?: string | null;
  /** Nombre exacto como en GET /provinces (ej. "Córdoba"). */
  province?: string | null;
  signatureUrl?: string | null;
  prescriptionLegend?: string | null;
};

export type CreateDoctorApiPayload = {
  /** Identidad de inicio de sesión; debe coincidir con el User creado. */
  email: string;
  firstName: string;
  lastName: string;
  specialty?: string;
  licenseNumber?: string;
  phone?: string;
  isActive?: boolean;
  managedByClinic?: boolean;
} & UpsertDoctorRecetarioPayload;

export type UpdateDoctorApiPayload = {
  firstName?: string;
  lastName?: string;
  specialty?: string;
  licenseNumber?: string;
  phone?: string;
  isActive?: boolean;
  managedByClinic?: boolean;
} & UpsertDoctorRecetarioPayload;

/** Estado de sincronización del paciente con Recetario (PUT /patients). */
export type RecetarioPatientSyncStatus =
  | 'PENDING'
  | 'SYNCED'
  | 'FAILED'
  | null;

export type PatientRecetarioFields = {
  healthInsurancePlan?: string | null;
  recetarioSyncStatus?: RecetarioPatientSyncStatus;
  recetarioSyncedAt?: string | null;
  recetarioLastError?: string | null;
};

export type PatientDto = {
  id: string;
  firstName: string;
  lastName: string;
  medicalRecordNumber?: number | null;
  dni?: string | null;
  phone?: string | null;
  email?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  department?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
  createdAt?: string;
  isActive?: boolean;
  deactivatedAt?: string | null;
} & PatientRecetarioFields;

export type CreatePatientApiPayload = {
  firstName: string;
  lastName: string;
  medicalRecordNumber?: number;
  dni?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  city?: string;
  province?: string;
  department?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  healthInsuranceId?: string;
  /** Id numérico del catálogo Recetario (`GET /health-insurances`). */
  recetarioHealthInsuranceId?: number;
  affiliateNumber?: string;
  healthInsurancePlan?: string;
};

export type RecetarioHealthInsuranceDto = {
  id: number;
  name: string;
  description?: string | null;
};

// --- Medicamentos Recetario (vademécum para futuras recetas) ---

export type RecetarioMedicationPowerDto = {
  value: string | null;
  unit: string | null;
};

export type RecetarioMedicationPackageDto = {
  id: number;
  /** Id requerido por Recetario al generar una nueva receta (POST /prescriptions). */
  externalId: string;
  name: string;
  shape: string | null;
  action: string | null;
  barcode: string | null;
  disabled: boolean;
  drugExternalId: string | null;
  power: RecetarioMedicationPowerDto | null;
};

export type RecetarioMedicationDto = {
  id: number;
  brand: string;
  drug: string;
  requiresDuplicate: boolean;
  hivSpecific: boolean;
  packages: RecetarioMedicationPackageDto[];
};

/**
 * Medicamento + presentación elegidos en el autocomplete.
 * Conserva todo lo necesario para construir el payload de Nueva Receta.
 */
export type SelectedMedication = {
  medicationId: number;
  brand: string;
  drug: string;
  requiresDuplicate: boolean;
  hivSpecific: boolean;
  package: {
    id: number;
    externalId: string;
    name: string;
    shape: string | null;
    action?: string | null;
    power: RecetarioMedicationPowerDto | null;
  };
};

// --- Diagnósticos ICD-10 (NIH Clinical Tables) ---

export type DiagnosisSearchResult = {
  code: string;
  /** Descripción en español (display). */
  description: string;
  descriptionEn: string;
};

export type SelectedDiagnosis = DiagnosisSearchResult;

// --- Recetas electrónicas (POST /prescriptions) ---

export type PrescriptionStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ISSUED'
  | 'CANCELLED'
  | 'FAILED';

export type PrescriptionCorrectionEvent = {
  type: 'CHANGES_REQUESTED' | 'ADMIN_CORRECTED' | 'RESUBMITTED';
  at: string;
  userId: string;
  userName?: string;
  note?: string;
};

export type PrescriptionCorrectionPayload = {
  diagnosis: string;
  diagnosisCode: string;
  diagnosisDescriptionEs: string;
  diagnosisDescriptionEn: string;
  reference?: string;
  clinicalNotes?: string;
  hiv?: boolean;
  recurring?: {
    days: 30 | 60 | 90;
    quantity: number;
  };
  medicines: CreatePrescriptionMedicinePayload[];
};

export type PrescriptionClinicalRequest = {
  date: string | null;
  reference: string | null;
  clinicalNotes: string | null;
  hiv: boolean;
  recurring: unknown;
  medicines: unknown[];
};

// --- Órdenes médicas (POST /medical-orders) ---

export type MedicalOrderStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EMITTED'
  | 'FAILED'
  | 'CANCELLED'
  | 'PENDING'
  | 'ISSUED';

export type MedicalOrderTemplateCategory = 'MANUAL' | 'IMAGING' | 'LABORATORY';

export type MedicalOrderRequestItemPayload = {
  description: string;
  category?: MedicalOrderTemplateCategory;
};

export type CreateMedicalOrderPayload = {
  doctorId: string;
  patientId: string;
  diagnosisCode: string;
  diagnosisDescription: string;
  requestItems: MedicalOrderRequestItemPayload[];
  date: string;
  reference?: string;
};

export type MedicalOrderRequestItemDto = {
  id: string;
  description: string;
  sortOrder: number;
  category: MedicalOrderTemplateCategory;
};

export type MedicalOrderTemplateDto = {
  id: string;
  name: string;
  category: MedicalOrderTemplateCategory;
  items: Array<{ id: string; description: string; sortOrder?: number }>;
};

export type MedicalOrderDto = {
  id: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  recetarioOrderId: number | null;
  reference: string | null;
  diagnosisCode: string;
  diagnosisDescription: string;
  orderText: string;
  orderDate: string;
  pdfUrl: string | null;
  status: MedicalOrderStatus;
  errorMessage: string | null;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdByUserId: string;
  doctorSnapshot?: unknown;
  patientSnapshot?: unknown;
  rawRequest?: unknown;
  rawResponse?: unknown;
  requestItems?: MedicalOrderRequestItemDto[];
  createdAt: string;
  updatedAt: string;
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    recetarioUserId: number | null;
  };
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    dni?: string | null;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  rejectedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type ListMedicalOrdersParams = {
  patientId?: string;
  doctorId?: string;
  page?: number;
  limit?: number;
};

export type MedicalOrdersListResponse = {
  items: MedicalOrderDto[];
  total: number;
  page: number;
  limit: number;
};

export type CreatePrescriptionMedicinePayload = {
  externalId: string;
  quantity: number;
  longTerm: boolean;
  posology: string;
  genericOnly?: boolean;
  brandRecommendation?: boolean;
  requiresDuplicate?: boolean;
};

export type CreatePrescriptionPayload = {
  doctorId: string;
  patientId: string;
  date: string;
  diagnosis: string;
  diagnosisCode: string;
  diagnosisDescriptionEs: string;
  diagnosisDescriptionEn: string;
  reference?: string;
  /** Observaciones clínicas — solo almacenamiento local, no se envía a Recetario. */
  clinicalNotes?: string;
  hiv?: boolean;
  recurring?: {
    days: 30 | 60 | 90;
    quantity: number;
  };
  medicines: CreatePrescriptionMedicinePayload[];
};

export type PrescriptionDto = {
  id: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  createdById: string;
  diagnosis: string;
  diagnosisCode: string | null;
  diagnosisDescriptionEs: string | null;
  diagnosisDescriptionEn: string | null;
  recetarioPrescriptionId: number | null;
  recetarioExternalId: string | null;
  pdfUrl: string | null;
  status: PrescriptionStatus;
  approvedById: string | null;
  rejectedById: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    recetarioUserId: number | null;
  };
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    dni: string | null;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  rejectedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  clinicalRequest?: PrescriptionClinicalRequest | null;
  correctionHistory?: PrescriptionCorrectionEvent[];
};

export type MedicalDocumentType =
  | 'PRESCRIPTION'
  | 'STUDY_ORDER'
  | 'PRACTICE_ORDER'
  | 'OTHER';

export type MedicalDocumentStatus =
  | 'ISSUED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'DRAFT'
  | 'UNKNOWN';

export type MedicalDocumentListItemDto = {
  id: string;
  issuedAt: string;
  expiresAt: string | null;
  patientId: string | null;
  patientName: string;
  patientDni: string | null;
  doctorUserId: string | null;
  doctorName: string;
  documentType: MedicalDocumentType;
  documentTypeLabel: string;
  status: MedicalDocumentStatus;
  statusLabel: string;
  healthInsurance: string | null;
  documentNumber: string | null;
  pdfUrl: string | null;
  diagnosis: string | null;
};

export type MedicalDocumentsStatsDto = {
  total: number;
  prescriptions: number;
  studyOrders: number;
  cancelled: number;
  issuedToday: number;
};

export type MedicalDocumentsListResponse = {
  items: MedicalDocumentListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type MedicalDocumentDetailDto = MedicalDocumentListItemDto & {
  institutionName: string | null;
  qrUrl: string | null;
  indications: string | null;
  recetarioDocumentId: number | null;
  prescriptionId: string | null;
  syncedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dni: string | null;
    email: string | null;
    phone: string | null;
    healthInsurancePlan: string | null;
    insurances: Array<{
      name: string;
      affiliateNumber: string;
      isPrimary: boolean;
    }>;
  } | null;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialty: string | null;
    licenseNumber: string | null;
    recetarioUserId: number | null;
  } | null;
  medicines: Array<Record<string, unknown>>;
  futureActions: {
    renew: boolean;
    repeat: boolean;
    cancel: boolean;
    whatsapp: boolean;
    email: boolean;
  };
};

export type ListMedicalDocumentsParams = {
  page?: number;
  limit?: number;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  doctorUserId?: string;
  patientId?: string;
  documentType?: MedicalDocumentType;
  status?: MedicalDocumentStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type UpdatePatientApiPayload = Partial<
  Omit<CreatePatientApiPayload, 'healthInsuranceId' | 'affiliateNumber'>
>;

/**
 * Cliente API configurado para el backend NestJS
 * 
 * Decisiones clave:
 * - JWT almacenado en cookies httpOnly sería más seguro, pero para desarrollo
 *   usamos localStorage para facilitar debugging
 * - El header x-clinic-slug se agrega automáticamente en registro
 * - El header Authorization se agrega automáticamente cuando hay token
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';

    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey, // API Key para endpoints públicos protegidos
      },
    });

    // Interceptor para agregar JWT automáticamente
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar errores
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token inválido o expirado
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Obtiene el token JWT desde localStorage
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  /**
   * Guarda el token JWT en localStorage
   */
  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Elimina el token JWT
   */
  clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  }

  /**
   * Registro de usuario OWNER (primer usuario de la clínica).
   * Requiere x-clinic-slug. No usar cuando hay inviteToken.
   */
  async register(data: {
    email: string;
    password: string;
    name: string;
    lastName: string;
    phone?: string;
  }) {
    const clinicSlug = process.env.NEXT_PUBLIC_CLINIC_SLUG;
    if (!clinicSlug) {
      throw new Error('NEXT_PUBLIC_CLINIC_SLUG no está configurado');
    }

    const response = await this.client.post('/auth/register', data, {
      headers: {
        'x-clinic-slug': clinicSlug,
      },
    });

    return response.data;
  }

  /**
   * Registro por invitación (profesional → STAFF).
   * Envía inviteToken en el body. No se usa x-clinic-slug.
   */
  async registerWithInvite(data: {
    inviteToken: string;
    email: string;
    password: string;
    name: string;
    lastName: string;
    phone?: string;
  }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  /**
   * Login de usuario
   */
  async login(data: { email: string; password: string }) {
    const response = await this.client.post('/auth/login', data);
    return response.data;
  }

  /**
   * Obtener información pública de la clínica por slug
   */
  async getClinicBySlug(slug: string) {
    const response = await this.client.get(`/clinics/slug/${slug}`);
    return response.data;
  }

  /**
   * Obtener la clínica actual del usuario autenticado
   */
  async getCurrentClinic() {
    const response = await this.client.get('/clinics/current');
    return response.data;
  }

  /**
   * Obtener los horarios de atención de la clínica actual
   */
  async getClinicAvailability() {
    const response = await this.client.get('/clinics/current/availability');
    return response.data;
  }

  /**
   * Actualizar información de la clínica actual (OWNER/ADMIN)
   */
  async updateClinic(data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    province?: string;
    prescriptionLogoUrl?: string | null;
    isActive?: boolean;
  }) {
    const response = await this.client.patch('/clinics/current', data);
    return response.data;
  }

  /**
   * Crear horario de atención de la clínica (clinic availability)
   */
  async createClinicAvailability(data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive?: boolean;
  }) {
    const response = await this.client.post(
      '/clinics/current/availability',
      data,
    );
    return response.data;
  }

  /**
   * Actualizar horario de atención de la clínica
   */
  async updateClinicAvailability(
    id: string,
    data: {
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      isActive?: boolean;
    },
  ) {
    const response = await this.client.patch(
      `/clinics/current/availability/${id}`,
      data,
    );
    return response.data;
  }

  /**
   * Eliminar horario de atención de la clínica
   */
  async deleteClinicAvailability(id: string) {
    const response = await this.client.delete(
      `/clinics/current/availability/${id}`,
    );
    return response.data;
  }

  /**
   * Equipo multi-tenant: todos los usuarios miembros de la clínica actual (`ClinicUser` activos/no borrados).
   */
  async getTeamMembers(): Promise<ClinicTeamMemberDto[]> {
    const response = await this.client.get('/users/team');
    return response.data;
  }

  /** Médicos con rol DOCTOR en la clínica (útil para selectores). */
  async listClinicDoctors(): Promise<ClinicTeamMemberDto[]> {
    const team = await this.getTeamMembers();
    return team.filter((m) => m.isDoctor && m.isActive);
  }

  /**
   * @deprecated usar `getTeamMembers` (misma información; legacy `/clinics/current/members` solo admins activos).
   */
  async getClinicMembers() {
    const response = await this.client.get('/clinics/current/members');
    return response.data;
  }

  /**
   * Obtener datos del usuario autenticado
   */
  async getMe(): Promise<UserProfileDto> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async patchMe(data: UpdateMeApiPayload): Promise<UserProfileDto> {
    const response = await this.client.patch('/users/me', data);
    return response.data;
  }

  async syncMyRecetario() {
    const response = await this.client.post('/users/me/recetario/sync');
    return response.data;
  }

  /** Crear médico (`User` + `ClinicUser` DOCTOR). */
  async createDoctor(data: CreateDoctorApiPayload) {
    const response = await this.client.post('/doctors', data);
    return response.data;
  }

  /** Detalle médico en esta clínica. */
  async getDoctor(doctorUserId: string) {
    const response = await this.client.get(`/doctors/${doctorUserId}`);
    return response.data;
  }

  async updateDoctor(doctorUserId: string, data: UpdateDoctorApiPayload) {
    const response = await this.client.patch(
      `/doctors/${doctorUserId}`,
      data,
    );
    return response.data;
  }

  async deactivateDoctorMembership(doctorUserId: string) {
    const response = await this.client.delete(`/doctors/${doctorUserId}`);
    return response.data;
  }

  async inviteDoctor(doctorUserId: string, email: string) {
    const response = await this.client.post(
      `/doctors/${doctorUserId}/invite`,
      { email },
    );
    return response.data;
  }

  /** Invitar médico solo con email (OWNER / ADMIN) */
  async inviteDoctorByEmail(email: string) {
    const response = await this.client.post('/invitations/doctor', { email });
    return response.data as { expiresAt: string; inviteUrl: string };
  }

  async getInvitationPreview(token: string) {
    const response = await this.client.get(`/invitations/${token}`);
    return response.data as {
      status: 'VALID' | 'EXPIRED' | 'ACCEPTED' | 'CANCELLED' | 'INVALID';
      email?: string;
      role?: 'ADMIN' | 'DOCTOR';
      clinicName?: string;
      inviterName?: string | null;
      requiresRegistration?: boolean;
      hasAccount?: boolean;
    };
  }

  async registerInvitationAccept(
    token: string,
    data: {
      email: string;
      password: string;
      name: string;
      lastName: string;
      phone?: string;
    },
  ) {
    const response = await this.client.post(
      `/invitations/${token}/register`,
      data,
    );
    return response.data as {
      accessToken: string;
      user: { id: string; clinicId: string; role: string; clinicName: string };
    };
  }

  async acceptInvitation(token: string) {
    const response = await this.client.post(`/invitations/${token}/accept`);
    return response.data as {
      accessToken: string;
      user: { id: string; clinicId: string; role: string; clinicName: string };
    };
  }

  async resendAdminInvite(inviteId: string) {
    const response = await this.client.post(
      `/invitations/admin/${inviteId}/resend`,
    );
    return response.data as { inviteUrl: string; expiresAt: string };
  }

  async cancelAdminInvite(inviteId: string) {
    const response = await this.client.post(
      `/invitations/admin/${inviteId}/cancel`,
    );
    return response.data;
  }

  async resendDoctorInvite(inviteId: string) {
    const response = await this.client.post(
      `/invitations/doctor/${inviteId}/resend`,
    );
    return response.data as { inviteUrl: string; expiresAt: string };
  }

  async cancelDoctorInvite(inviteId: string) {
    const response = await this.client.post(
      `/invitations/doctor/${inviteId}/cancel`,
    );
    return response.data;
  }

  async syncDoctorRecetario(doctorUserId: string) {
    const response = await this.client.post(
      `/doctors/${doctorUserId}/recetario/sync`,
    );
    return response.data;
  }

  async setDoctorRecetarioSignature(
    doctorUserId: string,
    signatureUrl: string,
  ) {
    const response = await this.client.put(
      `/doctors/${doctorUserId}/recetario/signature`,
      { signatureUrl },
    );
    return response.data;
  }

  /**
   * Catálogos estáticos Recetario (tipo matrícula, título).
   */
  async getRecetarioProfessionalFields() {
    const response = await this.client.get('/recetario/professional-fields');
    return response.data as { licenseTypes: string[]; titles: string[] };
  }

  /**
   * Provincias según GET /provinces de Recetario (cache en backend).
   */
  async getRecetarioProvinces(refresh = false) {
    const q = refresh ? '?refresh=1' : '';
    const response = await this.client.get(`/recetario/provinces${q}`);
    return response.data as { id: number; name: string }[];
  }

  /** Obras sociales/prepagas nacionales (cache upstream Recetario). */
  async getRecetarioHealthInsurances(refresh = false) {
    const q = refresh ? '?refresh=1' : '';
    const response = await this.client.get(
      `/recetario/health-insurances${q}`,
    );
    return response.data as RecetarioHealthInsuranceDto[];
  }

  /**
   * Buscar medicamentos del vademécum Recetario (mínimo 3 caracteres).
   * `signal` permite cancelar requests anteriores desde React Query.
   */
  async searchRecetarioMedications(search: string, signal?: AbortSignal) {
    const response = await this.client.get(
      `/recetario/medications?search=${encodeURIComponent(search)}`,
      { signal },
    );
    return response.data as RecetarioMedicationDto[];
  }

  /** Búsqueda ICD-10-CM vía backend (`GET /icd10/search?q=`). */
  async searchIcd10(q: string, signal?: AbortSignal) {
    const response = await this.client.get(
      `/icd10/search?q=${encodeURIComponent(q)}`,
      { signal },
    );
    return response.data as DiagnosisSearchResult[];
  }

  /** @deprecated usar `searchIcd10` */
  async searchDiagnosis(q: string, signal?: AbortSignal) {
    return this.searchIcd10(q, signal);
  }

  /** Crear borrador de receta (DRAFT). */
  async createPrescription(
    data: CreatePrescriptionPayload,
  ): Promise<PrescriptionDto> {
    const response = await this.client.post('/prescriptions', data);
    return response.data as PrescriptionDto;
  }

  async submitPrescription(id: string): Promise<PrescriptionDto> {
    const response = await this.client.post(`/prescriptions/${id}/submit`);
    return response.data as PrescriptionDto;
  }

  async approvePrescription(id: string): Promise<PrescriptionDto> {
    const response = await this.client.post(`/prescriptions/${id}/approve`);
    return response.data as PrescriptionDto;
  }

  async rejectPrescription(
    id: string,
    rejectionReason: string,
  ): Promise<PrescriptionDto> {
    const response = await this.client.post(`/prescriptions/${id}/reject`, {
      rejectionReason,
    });
    return response.data as PrescriptionDto;
  }

  /** Emite en Recetario (requiere APPROVED + médico sincronizado). */
  async issuePrescription(id: string): Promise<PrescriptionDto> {
    const response = await this.client.post(`/prescriptions/${id}/issue`);
    return response.data as PrescriptionDto;
  }

  /** Detalle de receta emitida (auditoría / reimpresión). */
  async getPrescription(id: string): Promise<PrescriptionDto> {
    const response = await this.client.get(`/prescriptions/${id}`);
    return response.data as PrescriptionDto;
  }

  async listPendingPrescriptions(): Promise<PrescriptionDto[]> {
    const response = await this.client.get('/prescriptions/pending');
    return response.data as PrescriptionDto[];
  }

  async approveAndIssuePrescription(id: string): Promise<PrescriptionDto> {
    const response = await this.client.post(
      `/prescriptions/${id}/approve-and-issue`,
    );
    return response.data as PrescriptionDto;
  }

  async requestPrescriptionChanges(
    id: string,
    changesNote: string,
  ): Promise<PrescriptionDto> {
    const response = await this.client.post(
      `/prescriptions/${id}/request-changes`,
      { changesNote },
    );
    return response.data as PrescriptionDto;
  }

  async applyPrescriptionCorrection(
    id: string,
    data: PrescriptionCorrectionPayload,
  ): Promise<PrescriptionDto> {
    const response = await this.client.patch(`/prescriptions/${id}/correction`, data);
    return response.data as PrescriptionDto;
  }

  async getPrescriptionCorrectionHistory(id: string): Promise<{
    prescriptionId: string;
    events: PrescriptionCorrectionEvent[];
  }> {
    const response = await this.client.get(
      `/prescriptions/${id}/correction-history`,
    );
    return response.data;
  }

  // ── Órdenes médicas (POST /medical-orders → Recetario POST /orders) ──

  async createMedicalOrder(
    data: CreateMedicalOrderPayload,
  ): Promise<MedicalOrderDto> {
    const response = await this.client.post('/medical-orders', data);
    return response.data as MedicalOrderDto;
  }

  async submitMedicalOrder(id: string): Promise<MedicalOrderDto> {
    const response = await this.client.post(`/medical-orders/${id}/submit`);
    return response.data as MedicalOrderDto;
  }

  async listPendingMedicalOrders(): Promise<MedicalOrderDto[]> {
    const response = await this.client.get('/medical-orders/pending');
    return response.data as MedicalOrderDto[];
  }

  async approveMedicalOrder(id: string): Promise<MedicalOrderDto> {
    const response = await this.client.post(`/medical-orders/${id}/approve`);
    return response.data as MedicalOrderDto;
  }

  async approveAndIssueMedicalOrder(id: string): Promise<MedicalOrderDto> {
    const response = await this.client.post(
      `/medical-orders/${id}/approve-and-issue`,
    );
    return response.data as MedicalOrderDto;
  }

  async rejectMedicalOrder(
    id: string,
    rejectionReason: string,
  ): Promise<MedicalOrderDto> {
    const response = await this.client.post(`/medical-orders/${id}/reject`, {
      rejectionReason,
    });
    return response.data as MedicalOrderDto;
  }

  async issueMedicalOrder(id: string): Promise<MedicalOrderDto> {
    const response = await this.client.post(`/medical-orders/${id}/issue`);
    return response.data as MedicalOrderDto;
  }

  async cancelMedicalOrder(id: string): Promise<MedicalOrderDto> {
    const response = await this.client.post(`/medical-orders/${id}/cancel`);
    return response.data as MedicalOrderDto;
  }

  async listMedicalOrderTemplates(category?: MedicalOrderTemplateCategory) {
    const response = await this.client.get('/medical-orders/templates', {
      params: category ? { category } : undefined,
    });
    return response.data as MedicalOrderTemplateDto[];
  }

  async createMedicalOrderTemplate(data: {
    name: string;
    category: MedicalOrderTemplateCategory;
    items: Array<{ description: string }>;
  }): Promise<MedicalOrderTemplateDto> {
    const response = await this.client.post('/medical-orders/templates', data);
    return response.data as MedicalOrderTemplateDto;
  }

  async listMedicalOrders(params: ListMedicalOrdersParams = {}) {
    const response = await this.client.get('/medical-orders', { params });
    return response.data as MedicalOrdersListResponse;
  }

  async getMedicalOrder(id: string): Promise<MedicalOrderDto> {
    const response = await this.client.get(`/medical-orders/${id}`);
    return response.data as MedicalOrderDto;
  }

  async retryMedicalOrder(id: string): Promise<MedicalOrderDto> {
    const response = await this.client.post(`/medical-orders/${id}/retry`);
    return response.data as MedicalOrderDto;
  }

  // ── Documentos médicos Recetario (GET /medical-documents cache local) ──

  async getMedicalDocumentsStats(): Promise<MedicalDocumentsStatsDto> {
    const response = await this.client.get('/medical-documents/stats');
    return response.data as MedicalDocumentsStatsDto;
  }

  async listMedicalDocuments(params: ListMedicalDocumentsParams = {}) {
    const response = await this.client.get('/medical-documents', { params });
    return response.data as MedicalDocumentsListResponse;
  }

  async getMedicalDocument(id: string): Promise<MedicalDocumentDetailDto> {
    const response = await this.client.get(`/medical-documents/${id}`);
    return response.data as MedicalDocumentDetailDto;
  }

  async syncMedicalDocuments(force = false): Promise<{ synced: number }> {
    const response = await this.client.post(
      '/medical-documents/sync',
      {},
      force ? { params: { force: 'true' } } : undefined,
    );
    return response.data as { synced: number };
  }

  async downloadMedicalDocument(id: string): Promise<{
    id: string;
    pdfUrl: string | null;
    documentNumber: string | null;
  }> {
    const response = await this.client.get(`/medical-documents/${id}/download`);
    return response.data as {
      id: string;
      pdfUrl: string | null;
      documentNumber: string | null;
    };
  }

  /**
   * Invitar ADMIN por email (solo OWNER)
   */
  async inviteAdmin(email: string) {
    const response = await this.client.post('/auth/invite-admin', { email });
    return response.data;
  }

  /**
   * Listar invitaciones de ADMIN de la clínica (solo OWNER)
   */
  async getAdminInvites() {
    const response = await this.client.get('/auth/admin-invites');
    return response.data;
  }

  /**
   * Listar invitaciones de profesionales de la clínica
   */
  async getDoctorInvites() {
    const response = await this.client.get('/doctors/invites');
    return response.data;
  }

  /**
   * Obtener mi disponibilidad (solo profesional con cuenta)
   */
  async getMyAvailability() {
    const response = await this.client.get('/professional-availability/me');
    return response.data;
  }

  /**
   * Obtener disponibilidad de un profesional específico (OWNER/ADMIN)
   */
  async getDoctorAvailability(doctorUserId: string) {
    const response = await this.client.get(
      `/professional-availability/doctor/${doctorUserId}`,
    );
    return response.data;
  }

  /**
   * Crear disponibilidad. DOCTOR: la propia. OWNER/ADMIN: enviar doctorUserId.
   */
  async createAvailability(data: {
    doctorUserId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
  }) {
    const response = await this.client.post('/professional-availability', data);
    return response.data;
  }

  /**
   * Editar disponibilidad (solo si es del profesional autenticado)
   */
  async updateAvailability(
    id: string,
    data: {
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      slotDuration?: number;
      isActive?: boolean;
    },
  ) {
    const response = await this.client.patch(
      `/professional-availability/${id}`,
      data,
    );
    return response.data;
  }

  /**
   * Eliminar disponibilidad (soft delete, solo si es del profesional)
   */
  async deleteAvailability(id: string) {
    const response = await this.client.delete(
      `/professional-availability/${id}`,
    );
    return response.data;
  }

  // --- Días bloqueados (excepciones: no atender un día concreto) ---

  /**
   * Listar mis días bloqueados (opcional: year, month para filtrar por mes)
   */
  async getMyBlockedDates(year?: number, month?: number) {
    const params = new URLSearchParams();
    if (year != null) params.set('year', String(year));
    if (month != null) params.set('month', String(month));
    const qs = params.toString();
    const url = `/professional-blocked-dates/me${qs ? `?${qs}` : ''}`;
    const response = await this.client.get(url);
    return response.data;
  }

  /**
   * Listar días bloqueados de un profesional (OWNER/ADMIN, solo lectura)
   */
  async getDoctorBlockedDates(
    doctorUserId: string,
    year?: number,
    month?: number,
  ) {
    const params = new URLSearchParams();
    if (year != null) params.set('year', String(year));
    if (month != null) params.set('month', String(month));
    const qs = params.toString();
    const url = `/professional-blocked-dates/doctor/${doctorUserId}${qs ? `?${qs}` : ''}`;
    const response = await this.client.get(url);
    return response.data;
  }

  /**
   * Crear día bloqueado (solo profesional): no atender esa fecha concreta
   */
  async createBlockedDate(data: { date: string; reason?: string }) {
    const response = await this.client.post(
      '/professional-blocked-dates',
      data,
    );
    return response.data;
  }

  /**
   * Eliminar día bloqueado (solo profesional)
   */
  async deleteBlockedDate(id: string) {
    const response = await this.client.delete(
      `/professional-blocked-dates/${id}`,
    );
    return response.data;
  }

  // --- Slots (generados on-the-fly, agrupados por fecha) ---

  /**
   * Slots del profesional indicado (OWNER/ADMIN). Agrupados por fecha.
   */
  async getDoctorSlots(
    doctorUserId: string,
    startDate: string,
    endDate: string,
  ) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await this.client.get(
      `/slots/doctor/${doctorUserId}?${params}`,
    );
    return response.data;
  }

  /**
   * Mis slots (STAFF). Agrupados por fecha.
   */
  async getMySlots(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await this.client.get(`/slots/me?${params}`);
    return response.data;
  }

  // --- Turnos (appointments) por rango ---

  /**
   * Turnos del profesional autenticado (STAFF). Agrupados por fecha.
   */
  async getMyAppointments(startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await this.client.get(`/appointments/me?${params}`);
    return response.data;
  }

  /**
   * Turnos de un profesional (OWNER/ADMIN). Agrupados por fecha.
   */
  async getDoctorAppointments(
    doctorUserId: string,
    startDate: string,
    endDate: string,
  ) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await this.client.get(
      `/appointments/doctor/${doctorUserId}?${params}`,
    );
    return response.data;
  }

  /**
   * Detalle de un turno por id (paciente, profesional, notas). OWNER/ADMIN: cualquier turno; STAFF: solo propios.
   */
  async getAppointmentById(id: string) {
    const response = await this.client.get(`/appointments/detail/${id}`);
    return response.data;
  }

  /**
   * Cambiar estado del turno. Solo OWNER/ADMIN. Body: status, cancelReason? (opcional al cancelar).
   */
  async patchAppointmentStatus(
    id: string,
    data: { status: string; cancelReason?: string },
  ) {
    const response = await this.client.patch(`/appointments/${id}/status`, data);
    return response.data;
  }

  /**
   * Resumen operativo del dashboard (KPIs, actividad, próximos turnos). Una sola request.
   */
  // --- Pagos / Finanzas ---

  async getPaymentsSummary(): Promise<{
    todayPatientIncome: number;
    totalPatientIncome: number;
    pendingInsurance: number;
    invoicedInsurance: number;
    collectedInsurance: number;
    todayPendingInsurance: number;
    todayInvoicedInsurance: number;
    todayCollectedInsurance: number;
    todayIncome: number;
    totalIncome: number;
    pendingIncome: number;
    byMethod: { CASH: number; CARD: number; TRANSFER: number; OTHER: number };
    bySource: { PRIVATE: number; INSURANCE: number };
  }> {
    const response = await this.client.get('/payments/summary');
    return response.data;
  }

  async getPayments(params?: {
    fromDate?: string;
    toDate?: string;
    status?: string;
    source?: string;
    appointmentId?: string;
    doctorUserId?: string;
    healthInsuranceId?: string;
    insuranceBillingStatus?: 'PENDING' | 'INVOICED' | 'COLLECTED';
  }) {
    const q = new URLSearchParams();
    if (params?.fromDate) q.set('fromDate', params.fromDate);
    if (params?.toDate) q.set('toDate', params.toDate);
    if (params?.status) q.set('status', params.status);
    if (params?.source) q.set('source', params.source);
    if (params?.appointmentId) q.set('appointmentId', params.appointmentId);
    if (params?.doctorUserId) q.set('doctorUserId', params.doctorUserId);
    if (params?.healthInsuranceId) q.set('healthInsuranceId', params.healthInsuranceId);
    if (params?.insuranceBillingStatus) {
      q.set('insuranceBillingStatus', params.insuranceBillingStatus);
    }
    const qs = q.toString();
    const response = await this.client.get(`/payments${qs ? `?${qs}` : ''}`);
    return response.data;
  }

  async createPayment(data: {
    patientId: string;
    appointmentId?: string;
    amount: number;
    method: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER';
    /** Sin obra social en el payload = particular (100% paciente). */
    source?: 'PRIVATE' | 'INSURANCE';
    /** Copago: reparte según `coveragePercent` de la obra social. */
    healthInsuranceId?: string;
  }) {
    const response = await this.client.post('/payments', data);
    return response.data;
  }

  async patchPaymentStatus(id: string, data: { status: 'PAID' | 'CANCELED' }) {
    const response = await this.client.patch(`/payments/${id}/status`, data);
    return response.data;
  }

  async patchPaymentInsuranceBilling(
    id: string,
    data: { action: 'INVOICED' | 'COLLECTED' },
  ) {
    const response = await this.client.patch(`/payments/${id}/insurance-billing`, data);
    return response.data;
  }

  /**
   * Descarga Excel de liquidación por obra social (solo pendientes de facturar).
   * Por defecto el backend marca esos pagos como facturados salvo markInvoiced: false.
   */
  async downloadLiquidacionObraSocialExcel(
    obraSocialId: string,
    params?: { from?: string; to?: string; markInvoiced?: boolean },
  ): Promise<void> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    if (params?.markInvoiced === false) q.set('markInvoiced', 'false');
    const qs = q.toString();
    const url = `/finanzas/export/obra-social/${obraSocialId}${qs ? `?${qs}` : ''}`;
    const response = await this.client.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      validateStatus: (s) => s < 500,
    });
    if (response.status !== 200) {
      let msg = 'No se pudo generar el archivo';
      try {
        const raw = response.data as ArrayBuffer;
        const t = new TextDecoder().decode(new Uint8Array(raw));
        const j = JSON.parse(t) as { message?: string | string[] };
        const m = j.message;
        msg = Array.isArray(m) ? m.join(', ') : (m ?? msg);
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    const cd = response.headers['content-disposition'] as string | undefined;
    let filename = 'liquidacion.xlsx';
    const match = cd?.match(/filename="([^"]+)"/i) ?? cd?.match(/filename=([^;]+)/i);
    if (match?.[1]) filename = match[1].trim();
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async getDashboardSummary(): Promise<{
    professionalsActive: number;
    patientsTotal: number;
    appointmentsToday: number;
    appointmentsPending: number;
    monthlyIncome: number;
    monthlyIncomeMomPercent: number | null;
    attendanceRate: number;
    recentActivity: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      createdAt: string;
    }>;
    upcomingAppointments: Array<{
      id: string;
      startTime: string;
      endTime: string;
      status: string;
      patientName: string;
      professionalName: string;
      reason: string | null;
    }>;
    alerts: {
      noShowRateHigh: boolean;
      pendingAppointmentsHigh: boolean;
    };
    nextUpcoming: {
      id: string;
      startTime: string;
      patientName: string;
      professionalName: string;
      reason: string | null;
      status: string;
      minutesUntil: number;
    } | null;
    medicalDocumentsTotal: number;
    medicalDocumentsIssuedToday: number;
    prescriptionsIssuedTotal: number;
    ordersIssuedTotal: number;
  }> {
    const response = await this.client.get('/dashboard/summary');
    return response.data;
  }

  // --- Pacientes ---

  /**
   * Listar pacientes con paginación y búsqueda (OWNER, ADMIN, STAFF).
   * activeFilter: 'active' | 'inactive' | 'all' (default active).
   */
  async getPatients(params?: {
    page?: number;
    limit?: number;
    q?: string;
    activeFilter?: 'active' | 'inactive' | 'all';
    myAppointmentsOnly?: boolean;
  }) {
    const search = new URLSearchParams();
    if (params?.page != null) search.set('page', String(params.page));
    if (params?.limit != null) search.set('limit', String(params.limit));
    if (params?.q?.trim()) search.set('q', params.q.trim());
    if (params?.activeFilter && params.activeFilter !== 'active')
      search.set('activeFilter', params.activeFilter);
    if (params?.myAppointmentsOnly === true)
      search.set('myAppointmentsOnly', 'true');
    const qs = search.toString();
    const response = await this.client.get(`/patients${qs ? `?${qs}` : ''}`);
    return response.data;
  }

  /**
   * Obtener un paciente por id con sus turnos (OWNER, ADMIN, STAFF).
   */
  async getPatientById(id: string) {
    const response = await this.client.get(`/patients/${id}`);
    return response.data;
  }

  /**
   * Buscar pacientes por DNI y/o email (OWNER/ADMIN). Por defecto solo activos.
   */
  async searchPatients(params: {
    medicalRecordNumber?: number;
    dni?: string;
    name?: string;
    email?: string;
    includeInactive?: boolean;
  }) {
    const q = new URLSearchParams();
    if (params.medicalRecordNumber != null)
      q.set('medicalRecordNumber', String(params.medicalRecordNumber));
    if (params.dni) q.set('dni', params.dni);
    if (params.name) q.set('name', params.name);
    if (params.email) q.set('email', params.email);
    if (params.includeInactive === true) q.set('includeInactive', 'true');
    const response = await this.client.get(`/patients/search?${q}`);
    return response.data;
  }

  /**
   * Crear paciente (OWNER/ADMIN).
   * Incluye datos personales ampliados y obra social opcional.
   */
  async createPatient(data: CreatePatientApiPayload): Promise<PatientDto> {
    const response = await this.client.post('/patients', data);
    return response.data;
  }

  /**
   * Editar paciente (parcial). Solo OWNER/ADMIN.
   */
  async updatePatient(id: string, data: UpdatePatientApiPayload) {
    const response = await this.client.patch(`/patients/${id}`, data);
    return response.data;
  }

  /** Sincronizar paciente con Recetario (PUT /patients). OWNER/ADMIN. */
  async syncPatientRecetario(patientId: string) {
    const response = await this.client.post(
      `/patients/${patientId}/recetario/sync`,
    );
    return response.data as {
      result: {
        status: string;
        message: string;
        error?: unknown;
      };
      patient: PatientDto;
    };
  }

  /**
   * Desactivar paciente (soft delete). Cancela turnos futuros. Solo OWNER/ADMIN.
   */
  async deactivatePatient(id: string) {
    const response = await this.client.patch(`/patients/${id}/deactivate`);
    return response.data;
  }

  /**
   * Reactivar paciente. Solo OWNER/ADMIN.
   */
  async activatePatient(id: string) {
    const response = await this.client.patch(`/patients/${id}/activate`);
    return response.data;
  }

  // --- Obras Sociales del Paciente (Patient Insurances) ---

  /**
   * Obtener obras sociales asignadas a un paciente.
   */
  async getPatientInsurances(patientId: string) {
    const response = await this.client.get(`/patients/${patientId}/insurances`);
    return response.data;
  }

  /**
   * Agregar obra social a un paciente. OWNER/ADMIN.
   */
  async addPatientInsurance(
    patientId: string,
    data: {
      healthInsuranceId?: string;
      recetarioHealthInsuranceId?: number;
      affiliateNumber: string;
      isPrimary?: boolean;
    },
  ) {
    const response = await this.client.post(
      `/patients/${patientId}/insurances`,
      data,
    );
    return response.data;
  }

  /**
   * Actualizar obra social del paciente. OWNER/ADMIN.
   */
  async updatePatientInsurance(
    patientId: string,
    insuranceId: string,
    data: { affiliateNumber?: string; isPrimary?: boolean },
  ) {
    const response = await this.client.patch(
      `/patients/${patientId}/insurances/${insuranceId}`,
      data,
    );
    return response.data;
  }

  /**
   * Desactivar obra social del paciente. OWNER/ADMIN.
   */
  async deactivatePatientInsurance(patientId: string, insuranceId: string) {
    const response = await this.client.patch(
      `/patients/${patientId}/insurances/${insuranceId}/deactivate`,
    );
    return response.data;
  }

  // --- Obras Sociales (Health Insurances) - CRUD clínica ---

  /**
   * Listar obras sociales de la clínica.
   */
  async getHealthInsurances(includeInactive?: boolean) {
    const q = includeInactive ? '?includeInactive=true' : '';
    const response = await this.client.get(`/health-insurances${q}`);
    return response.data;
  }

  /**
   * Crear obra social. OWNER/ADMIN.
   */
  async createHealthInsurance(data: {
    name?: string;
    recetarioHealthInsuranceId?: number;
    code?: string;
    /** % de la consulta cubierto por la OS (0–100). */
    coveragePercent?: number;
    isActive?: boolean;
  }) {
    const response = await this.client.post('/health-insurances', data);
    return response.data;
  }

  /**
   * Actualizar obra social. OWNER/ADMIN.
   */
  async updateHealthInsurance(
    id: string,
    data: { name?: string; code?: string; coveragePercent?: number; isActive?: boolean },
  ) {
    const response = await this.client.patch(`/health-insurances/${id}`, data);
    return response.data;
  }

  /**
   * Desactivar obra social (soft delete). OWNER/ADMIN.
   */
  async deleteHealthInsurance(id: string) {
    const response = await this.client.delete(`/health-insurances/${id}`);
    return response.data;
  }

  // --- Historia Clínica (Medical Records) ---

  /**
   * Obtener historial clínico de un paciente.
   */
  async getMedicalRecordsByPatient(patientId: string) {
    const response = await this.client.get(
      `/medical-records/patient/${patientId}`,
    );
    return response.data;
  }

  /**
   * Obtener detalle de un registro médico.
   */
  async getMedicalRecordById(id: string) {
    const response = await this.client.get(`/medical-records/${id}`);
    return response.data;
  }

  /**
   * Crear registro médico.
   * consultationDate: obligatorio si no hay appointmentId (YYYY-MM-DD).
   * doctorUserId: obligatorio para OWNER/ADMIN cuando no hay appointmentId.
   * healthInsuranceId: opcional; si no se envía, usa la obra social primaria del paciente.
   */
  async createMedicalRecord(data: {
    patientId: string;
    appointmentId?: string;
    doctorUserId?: string;
    consultationDate?: string; // YYYY-MM-DD
    healthInsuranceId?: string;
    reason?: string;
    symptoms?: string;
    diagnosis?: string;
    treatment?: string;
    notes?: string;
  }) {
    const response = await this.client.post('/medical-records', data);
    return response.data;
  }

  /**
   * Actualizar registro médico.
   */
  async updateMedicalRecord(
    id: string,
    data: {
      reason?: string;
      symptoms?: string;
      diagnosis?: string;
      treatment?: string;
      notes?: string;
      changeReason?: string;
    },
  ) {
    const response = await this.client.patch(`/medical-records/${id}`, data);
    return response.data;
  }

  /**
   * Soft delete clínico — el registro queda recuperable y todas las
   * versiones permanecen intactas.
   */
  async deleteMedicalRecord(id: string, reason?: string) {
    const response = await this.client.delete(`/medical-records/${id}`, {
      data: reason ? { reason } : undefined,
    });
    return response.data;
  }

  /** Restaurar HC eliminada lógicamente (OWNER/ADMIN). */
  async restoreMedicalRecord(id: string) {
    const response = await this.client.post(
      `/medical-records/${id}/restore`,
    );
    return response.data;
  }

  /** Listar todas las versiones de una HC (más nueva primero). */
  async getMedicalRecordVersions(id: string) {
    const response = await this.client.get(
      `/medical-records/${id}/versions`,
    );
    return response.data as MedicalRecordVersion[];
  }

  /** Obtener una versión específica de la HC. */
  async getMedicalRecordVersion(versionId: string) {
    const response = await this.client.get(
      `/medical-records/versions/${versionId}`,
    );
    return response.data as MedicalRecordVersion;
  }

  /**
   * Restaurar el contenido de una versión histórica.
   * NO sobrescribe versiones existentes — crea una nueva versión.
   */
  async restoreMedicalRecordVersion(versionId: string, reason?: string) {
    const response = await this.client.post(
      `/medical-records/versions/${versionId}/restore`,
      reason ? { reason } : {},
    );
    return response.data;
  }

  /**
   * Listar archivos de un registro médico.
   */
  async getMedicalRecordFiles(medicalRecordId: string) {
    const response = await this.client.get(
      `/medical-records/${medicalRecordId}/files`,
    );
    return response.data;
  }

  /**
   * Subir archivo PDF a un registro médico.
   */
  async uploadMedicalRecordFile(
    medicalRecordId: string,
    file: File,
  ): Promise<{
    id: string;
    fileName: string;
    fileSize: number;
    createdAt: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post(
      `/medical-records/${medicalRecordId}/files`,
      formData,
    );
    return response.data;
  }

  /**
   * Obtener URL para ver/descargar archivo (requiere auth, usar con fetch).
   */
  getMedicalRecordFileUrl(fileId: string): string {
    const base = this.client.defaults.baseURL || '';
    return `${base}/medical-records/files/${fileId}/content`;
  }

  /**
   * Obtener blob del archivo para ver o descargar.
   */
  async getMedicalRecordFileBlob(fileId: string): Promise<Blob> {
    const response = await this.client.get(
      `/medical-records/files/${fileId}/content`,
      { responseType: 'blob' },
    );
    return response.data;
  }

  /**
   * Eliminar archivo de un registro médico.
   */
  async deleteMedicalRecordFile(fileId: string) {
    const response = await this.client.delete(
      `/medical-records/files/${fileId}`,
    );
    return response.data;
  }

  // --- Agenda Pública (sin autenticación) ---

  /**
   * Obtener información pública de la clínica con profesionales activos.
   */
  async getPublicClinicInfo(slug: string) {
    const response = await this.client.get(`/public/clinic/${slug}`);
    return response.data;
  }

  /**
   * Buscar paciente por DNI o teléfono (solo búsqueda, no crea).
   */
  async searchPublicPatient(clinicSlug: string, dni?: string, phone?: string) {
    const q = new URLSearchParams();
    q.set('clinicSlug', clinicSlug);
    if (dni) q.set('dni', dni);
    if (phone) q.set('phone', phone);
    const response = await this.client.get(`/public/patients/search?${q}`);
    return response.data;
  }

  /**
   * Identificar o crear paciente sin autenticación.
   */
  async identifyPatientPublic(data: {
    clinicSlug: string;
    firstName?: string;
    lastName?: string;
    dni?: string;
    phone?: string;
    email?: string;
    birthDate?: string;
    gender?: string;
    address?: string;
    city?: string;
    province?: string;
    department?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    notes?: string;
    healthInsuranceId?: string;
    affiliateNumber?: string;
  }) {
    const response = await this.client.post('/public/patients/identify', data);
    return response.data;
  }

  /**
   * Obtener slots públicos disponibles.
   */
  async getPublicSlots(params: {
    clinicSlug: string;
    doctorUserId: string;
    startDate: string;
    endDate: string;
  }) {
    const q = new URLSearchParams();
    q.set('clinicSlug', params.clinicSlug);
    q.set('doctorUserId', params.doctorUserId);
    q.set('startDate', params.startDate);
    q.set('endDate', params.endDate);
    const response = await this.client.get(`/public/slots?${q}`);
    return response.data;
  }

  /**
   * Solicitar turno desde agenda pública.
   */
  async requestPublicAppointment(data: {
    clinicSlug: string;
    doctorUserId: string;
    patientId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
    notes?: string;
  }) {
    const response = await this.client.post('/public/appointments/request', data);
    return response.data;
  }

  // --- Turnos (reserva manual) ---

  /**
   * Reservar turno manual (OWNER/ADMIN).
   * Body: doctorUserId, date, startTime, endTime, patientId? o patientData?
   */
  async createManualAppointment(data: {
    doctorUserId: string;
    date: string;
    startTime: string;
    endTime: string;
    patientId?: string;
    patientData?: {
      firstName: string;
      lastName: string;
      dni?: string;
      phone?: string;
      email?: string;
    };
    notes?: string;
    /** Motivo de consulta (opcional), mismo límite que agenda pública. */
    reason?: string;
  }) {
    const response = await this.client.post('/appointments/manual', data);
    return response.data;
  }

  // --- Notificaciones ---

  /**
   * Lista las últimas notificaciones del usuario y el conteo de no leídas.
   */
  async getNotifications(): Promise<{
    notifications: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      readAt: string | null;
      metadata: Record<string, unknown> | null;
      createdAt: string;
    }>;
    unreadCount: number;
  }> {
    const response = await this.client.get('/notifications');
    return response.data;
  }

  /**
   * Marca una notificación como leída.
   */
  async markNotificationAsRead(id: string) {
    const response = await this.client.patch(`/notifications/${id}/read`);
    return response.data;
  }

  /**
   * Marca todas las notificaciones como leídas.
   */
  async markAllNotificationsAsRead() {
    const response = await this.client.patch('/notifications/read-all');
    return response.data;
  }

  // --- Historial de conversaciones (chat web + WhatsApp) — OWNER / ADMIN ---

  async getMessageConversations(channel?: 'whatsapp' | 'web') {
    const q = channel ? `?channel=${encodeURIComponent(channel)}` : '';
    const response = await this.client.get(`/messages/conversations${q}`);
    return response.data as Array<{
      id: string;
      channel: string;
      externalId: string;
      patientDni: string | null;
      createdAt: string;
      updatedAt: string;
      _count: { messages: number };
    }>;
  }

  async getMessageConversationById(id: string) {
    const response = await this.client.get(`/messages/conversations/${id}`);
    return response.data as {
      id: string;
      channel: string;
      externalId: string;
      patientDni: string | null;
      createdAt: string;
      updatedAt: string;
      messages: Array<{
        id: string;
        conversationId: string;
        direction: string;
        content: string;
        type: string;
        channel: string;
        meta: Record<string, unknown> | null;
        createdAt: string;
      }>;
    };
  }

  async sendManualConversationMessage(conversationId: string, message: string) {
    const response = await this.client.post(
      `/messages/conversations/${conversationId}/send-message`,
      { message },
    );
    return response.data;
  }

  // --- Auditoría ---

  async getAuditLogs(params?: {
    entity?: string;
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.entity) query.set('entity', params.entity);
    if (params?.userId) query.set('userId', params.userId);
    if (params?.action) query.set('action', params.action);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const response = await this.client.get(`/audit?${query.toString()}`);
    return response.data as {
      items: AuditLogItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }

  async getAuditLogById(id: string) {
    const response = await this.client.get(`/audit/${id}`);
    return response.data as AuditLogItem;
  }

  // --- Integración Recetario.com.ar ---

  async getRecetarioHealthCenters() {
    const response = await this.client.get('/recetario/health-centers');
    return response.data as RecetarioHealthCenter[];
  }

  async getRecetarioHealthCenterById(id: number) {
    const response = await this.client.get(`/recetario/health-centers/${id}`);
    return response.data as RecetarioHealthCenter;
  }

  async updateRecetarioHealthCenter(
    id: number,
    payload: UpdateRecetarioHealthCenterPayload,
  ) {
    const response = await this.client.put(
      `/recetario/health-centers/${id}`,
      payload,
    );
    return response.data as RecetarioHealthCenter;
  }

  // --- Vinculación clínica ↔ Recetario ---

  async listAvailableRecetarioHealthCenters() {
    const response = await this.client.get(
      '/clinics/current/recetario/available',
    );
    return response.data as AvailableRecetarioHealthCenter[];
  }

  async linkRecetario(healthCenterId: number) {
    const response = await this.client.post(
      '/clinics/current/recetario/link',
      { healthCenterId },
    );
    return response.data as ClinicWithRecetario;
  }

  async unlinkRecetario() {
    const response = await this.client.delete(
      '/clinics/current/recetario/link',
    );
    return response.data as ClinicWithRecetario;
  }

  async triggerRecetarioSync() {
    const response = await this.client.post(
      '/clinics/current/recetario/sync',
    );
    return response.data as {
      result: {
        status: 'PENDING' | 'SYNCED' | 'FAILED' | 'SKIPPED';
        message: string;
        recetarioHealthCenterId?: number;
        error?: { name: string; message: string };
      };
      clinic: ClinicWithRecetario;
    };
  }
}

export interface MedicalRecordVersionContent {
  reason: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  consultationDate: string;
  healthInsuranceName: string | null;
  affiliateNumber: string | null;
}

export interface MedicalRecordVersion {
  id: string;
  medicalRecordId: string;
  clinicId: string;
  versionNumber: number;
  content: MedicalRecordVersionContent;
  changeReason: string | null;
  createdById: string;
  createdAt: string;
  medicalRecord?: {
    id: string;
    patientId: string;
    doctorUserId: string;
  };
}

export interface AuditLogItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'DOWNLOAD';
  entity: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  clinicId: string | null;
  userId: string | null;
  user: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  } | null;
}

export interface RecetarioHealthCenterUser {
  id: number | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  active: boolean | null;
}

export interface RecetarioHealthCenter {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  prescriptionLogoUrl: string | null;
  independentDoctors: boolean;
  footer: string | null;
  pdfVersion: number | null;
  users: RecetarioHealthCenterUser[];
}

export interface AvailableRecetarioHealthCenter extends RecetarioHealthCenter {
  isLinked: boolean;
  linkedToOtherClinic: { id: string; name: string } | null;
}

export interface ClinicWithRecetario {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  prescriptionLogoUrl: string | null;
  isActive: boolean;
  recetarioHealthCenterId: number | null;
  recetarioSyncStatus: 'PENDING' | 'SYNCED' | 'FAILED' | null;
  recetarioSyncedAt: string | null;
  recetarioLastError: string | null;
}

export interface UpdateRecetarioHealthCenterPayload {
  name?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  prescriptionLogoUrl?: string | null;
  independentDoctors?: boolean;
  footer?: string | null;
}

export const apiClient = new ApiClient();
