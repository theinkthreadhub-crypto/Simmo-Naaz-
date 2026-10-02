import { NextResponse } from 'next/server';

const SOURCE =
  'https://cdn.polyhaven.com/asset_img/thumbs/poly_haven_studio.png?format=png';

export const runtime = 'nodejs';
export const revalidate = 86400;

export async function GET() {
  try {
    const response = await fetch(SOURCE, {
      next: { revalidate: 86400 },
      headers: {
        'User-Agent': 'MentraHQ/1.0',
        Accept: 'image/png,image/*;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return new NextResponse('Panorama unavailable', { status: 502 });
    }

    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('Panorama unavailable', { status: 502 });
  }
}
