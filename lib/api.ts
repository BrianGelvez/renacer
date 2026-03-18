import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

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
   * Obtener miembros de la clínica (OWNER, ADMIN, STAFF) con datos del usuario
   */
  async getClinicMembers() {
    const response = await this.client.get('/clinics/current/members');
    return response.data;
  }

  /**
   * Obtener datos del usuario autenticado
   */
  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  /**
   * Listar profesionales de la clínica
   */
  async getProfessionals() {
    const response = await this.client.get('/professionals');
    return response.data;
  }

  /**
   * Crear profesional.
   * managedByClinic: true = la clínica gestiona su horario (sin cuenta). false = aparece como Pendiente hasta que se le envíe invitación.
   */
  async createProfessional(data: {
    firstName: string;
    lastName: string;
    specialty?: string;
    licenseNumber?: string;
    phone?: string;
    isActive?: boolean;
    managedByClinic?: boolean;
  }) {
    const response = await this.client.post('/professionals', data);
    return response.data;
  }

  /**
   * Obtener un profesional por id
   */
  async getProfessional(id: string) {
    const response = await this.client.get(`/professionals/${id}`);
    return response.data;
  }

  /**
   * Actualizar profesional (parcial)
   */
  async updateProfessional(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      specialty?: string;
      licenseNumber?: string;
      phone?: string;
      isActive?: boolean;
    },
  ) {
    const response = await this.client.patch(`/professionals/${id}`, data);
    return response.data;
  }

  /**
   * Desactivar profesional (soft delete)
   */
  async deleteProfessional(id: string) {
    const response = await this.client.delete(`/professionals/${id}`);
    return response.data;
  }

  /**
   * Invitar profesional por email (envía link de registro)
   */
  async inviteProfessional(professionalId: string, email: string) {
    const response = await this.client.post(
      `/professionals/${professionalId}/invite`,
      { email },
    );
    return response.data;
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
  async getProfessionalInvites() {
    const response = await this.client.get('/professionals/invites');
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
  async getProfessionalAvailability(professionalId: string) {
    const response = await this.client.get(
      `/professional-availability/professional/${professionalId}`,
    );
    return response.data;
  }

  /**
   * Crear disponibilidad. STAFF: sin professionalId. OWNER/ADMIN: enviar professionalId.
   */
  async createAvailability(data: {
    professionalId?: string;
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
  async getProfessionalBlockedDates(
    professionalId: string,
    year?: number,
    month?: number,
  ) {
    const params = new URLSearchParams();
    if (year != null) params.set('year', String(year));
    if (month != null) params.set('month', String(month));
    const qs = params.toString();
    const url = `/professional-blocked-dates/professional/${professionalId}${qs ? `?${qs}` : ''}`;
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
  async getProfessionalSlots(
    professionalId: string,
    startDate: string,
    endDate: string,
  ) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await this.client.get(
      `/slots/professional/${professionalId}?${params}`,
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
  async getProfessionalAppointments(
    professionalId: string,
    startDate: string,
    endDate: string,
  ) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await this.client.get(
      `/appointments/professional/${professionalId}?${params}`,
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
  }) {
    const search = new URLSearchParams();
    if (params?.page != null) search.set('page', String(params.page));
    if (params?.limit != null) search.set('limit', String(params.limit));
    if (params?.q?.trim()) search.set('q', params.q.trim());
    if (params?.activeFilter && params.activeFilter !== 'active')
      search.set('activeFilter', params.activeFilter);
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
    dni?: string;
    email?: string;
    includeInactive?: boolean;
  }) {
    const q = new URLSearchParams();
    if (params.dni) q.set('dni', params.dni);
    if (params.email) q.set('email', params.email);
    if (params.includeInactive === true) q.set('includeInactive', 'true');
    const response = await this.client.get(`/patients/search?${q}`);
    return response.data;
  }

  /**
   * Crear paciente (OWNER/ADMIN).
   */
  async createPatient(data: {
    firstName: string;
    lastName: string;
    dni?: string;
    phone?: string;
    email?: string;
    notes?: string;
  }) {
    const response = await this.client.post('/patients', data);
    return response.data;
  }

  /**
   * Editar paciente (parcial). Solo OWNER/ADMIN.
   */
  async updatePatient(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      dni?: string;
      phone?: string;
      email?: string;
    }
  ) {
    const response = await this.client.patch(`/patients/${id}`, data);
    return response.data;
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
  }) {
    const response = await this.client.post('/public/patients/identify', data);
    return response.data;
  }

  /**
   * Obtener slots públicos disponibles.
   */
  async getPublicSlots(params: {
    clinicSlug: string;
    professionalId: string;
    startDate: string;
    endDate: string;
  }) {
    const q = new URLSearchParams();
    q.set('clinicSlug', params.clinicSlug);
    q.set('professionalId', params.professionalId);
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
    professionalId: string;
    patientId: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) {
    const response = await this.client.post('/public/appointments/request', data);
    return response.data;
  }

  // --- Turnos (reserva manual) ---

  /**
   * Reservar turno manual (OWNER/ADMIN).
   * Body: professionalId, date, startTime, endTime, patientId? o patientData?
   */
  async createManualAppointment(data: {
    professionalId: string;
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
}

export const apiClient = new ApiClient();
