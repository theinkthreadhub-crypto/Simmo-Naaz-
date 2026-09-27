import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeWebResearch } from '@/lib/research/researchAgent';
import { ResearchDepth } from '@/lib/research/types';

function mapRun(row: any) {
  return {
    id: row.id,
    topic: row.topic,
    objective: row.objective || undefined,
    depth: row.depth,
    provider: row.provider || 'stored',
    synthesisMode: row.synthesis_mode || 'EVIDENCE_ONLY',
    persisted: true,
    summary: row.summary || '',
    keyFindings: row.key_findings || [],
    evidence: row.evidence || [],
    sources: row.sources || [],
    recommendations: row.recommendations || [],
    status: row.status,
    createdAt: row.created_at
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const id = request.nextUrl.searchParams.get('id');

    if (id) {
      const { data, error } = await supabase
        .from('research_runs')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'RESEARCH_RUN_NOT_FOUND' }, { status: 404 });
      return NextResponse.json({ report: mapRun(data) });
    }

    const { data, error } = await supabase
      .from('research_runs')
      .select('id, topic, objective, depth, status, summary, provider, synthesis_mode, source_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    return NextResponse.json({ runs: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const body = await request.json();
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    const objective = typeof body.objective === 'string' ? body.objective.trim() : undefined;
    const depth: ResearchDepth = ['QUICK', 'STANDARD', 'DEEP'].includes(body.depth)
      ? body.depth
      : 'STANDARD';

    if (!topic) return NextResponse.json({ error: 'RESEARCH_TOPIC_REQUIRED' }, { status: 400 });

    const report = await executeWebResearch(user.id, topic, objective, depth);
    return NextResponse.json({ success: true, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('NO_LIVE_SOURCES') ? 502 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
