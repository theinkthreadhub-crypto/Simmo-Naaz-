import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { browserAgent } from '@/lib/agents/browserAgent';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const url = req.nextUrl.searchParams.get('url') || '';
  if (!url) {
    return NextResponse.json(
      { success: false, error: 'URL_REQUIRED' },
      { status: 400 }
    );
  }

  const sessionId = await browserAgent.ensureSession(user.id, url);
  const result = await browserAgent.screenshot(url);

  await browserAgent.logBrowserAction(
    user.id,
    sessionId,
    result,
    'LOW_RISK_EXTERNAL'
  );

  if (!result.success || !result.screenshotUrl) {
    return NextResponse.json(
      {
        success: false,
        error: result.error || result.status
      },
      { status: 502 }
    );
  }

  const match = /^data:image\/png;base64,(.+)$/.exec(result.screenshotUrl);
  if (!match) {
    return NextResponse.json(
      { success: false, error: 'INVALID_SCREENSHOT_DATA' },
      { status: 500 }
    );
  }

  const bytes = Buffer.from(match[1], 'base64');

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
