/**
 * Variables públicas del cliente (seguras para el navegador).
 * NUNCA incluir API keys ni secretos aquí.
 */

/** Ruta same-origin del proxy BFF — el navegador nunca llama a Render directamente. */
export const API_PROXY_BASE = '/api/backend';

/**
 * URL base para peticiones HTTP.
 * - Cliente: proxy interno (sin CORS, sin secretos).
 * - Servidor Next: BACKEND_URL directo (solo en Route Handlers / RSC).
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return API_PROXY_BASE;
  }
  const backend = process.env.BACKEND_URL?.trim();
  if (backend) return backend.replace(/\/+$/, '');
  return 'http://localhost:3333';
}

/**
 * URL pública del backend para WebSocket (Socket.IO).
 * No es un secreto — es el host de Render. REST no la usa en el navegador.
 */
export function getWsBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_WS_URL?.trim().replace(/\/+$/, '') ||
    'http://localhost:3333'
  );
}

export function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export function getClinicSlug(): string {
  return process.env.NEXT_PUBLIC_CLINIC_SLUG || 'consultorio-renacer';
}
