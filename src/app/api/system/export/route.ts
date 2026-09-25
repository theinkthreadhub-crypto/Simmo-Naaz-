import { NextResponse } from 'next/server';
import { generateUserDataExport } from '@/lib/privacy/dataExport';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  let userId = 'user_demo_default';
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    }
  } catch {
    // Demo fallback
  }

  const exportData = await generateUserDataExport(userId);

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="mentra-user-export-${new Date().toISOString().split('T')[0]}.json"`
    }
  });
}
