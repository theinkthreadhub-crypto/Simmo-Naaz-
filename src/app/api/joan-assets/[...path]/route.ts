import { NextResponse } from 'next/server';

const UPSTREAM_ROOT =
  'https://cdn.jsdelivr.net/gh/jrefusta/joan-portfolio@main/static/';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const cleanParts = path.filter(
    (part) =>
      part &&
      part !== '.' &&
      part !== '..' &&
      !part.includes('\\') &&
      !part.includes('%2f') &&
      !part.includes('%2F')
  );

  if (cleanParts.length !== path.length) {
    return new NextResponse('Invalid asset path', { status: 400 });
  }

  const assetPath = cleanParts.map(encodeURIComponent).join('/');
  const upstream = await fetch(`${UPSTREAM_ROOT}${assetPath}`, {
    headers: {
      'User-Agent': 'MentraHQ/1.0',
      Accept: '*/*',
    },
    next: { revalidate: 604800 },
  });

  if (!upstream.ok) {
    return new NextResponse('Asset unavailable', { status: upstream.status });
  }

  const body = await upstream.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type':
        upstream.headers.get('content-type') || 'application/octet-stream',
      'Cache-Control':
        'public, s-maxage=604800, stale-while-revalidate=2592000',
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  });
}
