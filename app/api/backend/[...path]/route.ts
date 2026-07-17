import type { NextRequest } from 'next/server';
import { proxyOptions, proxyToBackend } from '@/lib/server/backend-proxy';

type RouteContext = {
  params: Promise<{ path: string[] }> | { path: string[] };
};

async function resolvePath(
  params: RouteContext['params'],
): Promise<string[]> {
  const resolved = await Promise.resolve(params);
  return resolved.path ?? [];
}

async function handle(
  req: NextRequest,
  { params }: RouteContext,
) {
  if (req.method === 'OPTIONS') {
    return proxyOptions();
  }
  return proxyToBackend(req, await resolvePath(params));
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
