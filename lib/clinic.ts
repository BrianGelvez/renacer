import { getServerApiKey, getServerBackendUrl } from '@/lib/server/env';

/**
 * Datos de clínica para landing (Server Component).
 * Usa BACKEND_URL + SAAS_API_KEY solo en el servidor — nunca en el navegador.
 */
export async function getClinicData(slug: string) {
  const apiUrl = getServerBackendUrl();
  const apiKey = getServerApiKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  try {
    const response = await fetch(`${apiUrl}/clinics/slug/${slug}`, {
      headers,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error al obtener datos de la clínica: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching clinic data:', error);
    throw error;
  }
}
