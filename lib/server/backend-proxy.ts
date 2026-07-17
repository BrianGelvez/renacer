import { NextRequest, NextResponse } from 'next/server';
import { getServerApiKey, getServerBackendUrl } from '@/lib/server/env';

/**
 * Cabeceras que el navegador puede enviar al proxy (sin secretos).
 * El proxy inyecta x-api-key en el servidor antes de llamar a Render.
 */
const CLIENT_FORWARD_HEADERS = [
  'authorization',
  'content-type',
  'accept',
  'accept-language',
  'x-clinic-slug',
] as const;

/** No reenviar content-length ni content-encoding: fetch descomprime el body y el stream ya no coincide. */
const RESPONSE_FORWARD_HEADERS = [
  'content-type',
  'content-disposition',
  'cache-control',
] as const;

function buildBackendUrl(pathSegments: string[], search: string): string {
  const base = getServerBackendUrl();
  const path = pathSegments.map(encodeURIComponent).join('/');
  const url = `${base}/${path}${search}`;
  return url;
}

function buildUpstreamHeaders(req: NextRequest): Headers {
  const headers = new Headers();

  for (const name of CLIENT_FORWARD_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

  const apiKey = getServerApiKey();
  if (apiKey) {
    headers.set('x-api-key', apiKey);
  }

  return headers;
}

/**
 * Proxy BFF: el navegador → /api/backend/* (mismo origen, sin CORS ni secretos).
 * Next.js (servidor) → Render con SAAS_API_KEY inyectada.
 */
export async function proxyToBackend(
  req: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const targetUrl = buildBackendUrl(pathSegments, req.nextUrl.search);
  const headers = buildUpstreamHeaders(req);

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: 'no-store',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const body = await req.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, init);
  } catch (error) {
    console.error('[api/backend] upstream fetch failed:', error);
    return NextResponse.json(
      { message: 'Backend no disponible' },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  for (const name of RESPONSE_FORWARD_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  const contentType = upstream.headers.get('content-type') ?? '';

  if (contentType.includes('text/event-stream')) {
    responseHeaders.set('Content-Type', 'text/event-stream');
    responseHeaders.set('Cache-Control', 'no-cache');
    responseHeaders.set('Connection', 'keep-alive');
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  }

  const body = await upstream.arrayBuffer();

  if (contentType && !responseHeaders.has('content-type')) {
    responseHeaders.set('Content-Type', contentType);
  }

  return new NextResponse(body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function proxyOptions(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    },
  });
}
