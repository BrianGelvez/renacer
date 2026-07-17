/**
 * Variables de entorno SOLO del servidor Next.js (nunca NEXT_PUBLIC_*).
 * La API Key y la URL del backend viven aquí — nunca llegan al bundle del navegador.
 */
export function getServerBackendUrl(): string {
  const url = process.env.BACKEND_URL?.trim();
  if (url) return url.replace(/\/+$/, '');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('BACKEND_URL must be set in production (Vercel server env).');
  }
  return 'http://localhost:3333';
}

export function getServerApiKey(): string {
  const key = process.env.SAAS_API_KEY?.trim();
  if (key) return key;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SAAS_API_KEY must be set in production (Vercel server env).');
  }
  return '';
}
