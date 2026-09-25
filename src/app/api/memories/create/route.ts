import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Session required.' }, { status: 401 });
    }

    const { title, content, type, importance, tags } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('memories')
      .insert({
        user_id: user.id,
        title,
        content,
        type: type || 'DECISION',
        importance: importance || 'MEDIUM',
        tags: tags || [],
        source: 'Operator Direct Ingestion'
      })
      .select()
      .single();

    if (error) throw error;

    // Record activity log
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'MEMORY_ANCHORED',
      module: 'MEMORY',
      details: {
        memory_id: data.id,
        title,
        type
      }
    });

    return NextResponse.json({ success: true, memory: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
