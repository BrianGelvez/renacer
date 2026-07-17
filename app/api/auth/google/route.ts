import { NextRequest, NextResponse } from 'next/server';
import { getServerBackendUrl } from '@/lib/server/env';

/**
 * Inicia OAuth Google sin exponer la URL del backend en el cliente.
 * El navegador solo visita /api/auth/google (mismo origen).
 */
export async function GET(req: NextRequest) {
  const backend = getServerBackendUrl();
  const clinicSlug =
    req.nextUrl.searchParams.get('clinicSlug')?.trim() ||
    process.env.CLINIC_SLUG?.trim() ||
    process.env.NEXT_PUBLIC_CLINIC_SLUG?.trim();

  if (!clinicSlug) {
    return NextResponse.json(
      { message: 'clinicSlug es requerido' },
      { status: 400 },
    );
  }

  const url = new URL(`${backend}/auth/google`);
  url.searchParams.set('clinicSlug', clinicSlug);

  return NextResponse.redirect(url.toString());
}

export const dynamic = 'force-dynamic';
