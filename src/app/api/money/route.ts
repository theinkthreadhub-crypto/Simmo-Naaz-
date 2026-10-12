import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser, AuthRequiredError } from '@/lib/auth/requireUser';
import { parseMoneyEntry } from '@/lib/money/parseEntry';

const addSchema = z.object({
  text: z.string().trim().min(1).max(300),
  amount: z.coerce.number().positive().max(100_000_000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

function toEntry(row: any) {
  const amount = Number(row.amount);
  return {
    id: row.id,
    amount: Math.abs(amount),
    type: amount >= 0 ? 'INCOME' : 'EXPENSE',
    category: row.category,
    description: row.description,
    scope: row.business_personal,
    date: row.date,
    createdAt: row.created_at,
  };
}

function errorResponse(err: unknown) {
  if (err instanceof AuthRequiredError) {
    return NextResponse.json({ error: 'Login required.' }, { status: 401 });
  }
  return NextResponse.json({ error: (err as Error)?.message || 'Server error' }, { status: 500 });
}

// GET /api/money?month=YYYY-MM  → entries for that month (default: current month)
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const supabase = createClient();
    const url = new URL(request.url);
    const month = url.searchParams.get('month');
    const now = new Date();
    const [y, m] = month && /^\d{4}-\d{2}$/.test(month)
      ? month.split('-').map(Number)
      : [now.getFullYear(), now.getMonth() + 1];

    const from = `${y}-${String(m).padStart(2, '0')}-01`;
    const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;

    const { data, error } = await supabase
      .from('finance_transactions')
      .select('id, amount, category, description, business_personal, date, created_at')
      .eq('user_id', user.id)
      .gte('date', from)
      .lt('date', next)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    return NextResponse.json({ entries: (data || []).map(toEntry) });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/money  { text: "500 petrol", amount?: 500 }  → AI picks type + category and saves
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = addSchema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json({ error: 'Enter an amount and what it was for, e.g. "500 petrol".' }, { status: 400 });
    }

    const parsed = await parseMoneyEntry(body.data.text, body.data.amount);
    if (!parsed) {
      return NextResponse.json({ error: 'Could not read the amount. Include a number, e.g. "250 tea".' }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('finance_transactions')
      .insert({
        user_id: user.id,
        amount: parsed.type === 'EXPENSE' ? -parsed.amount : parsed.amount,
        description: parsed.description,
        category: parsed.category,
        business_personal: parsed.scope,
        account_source: 'MONEY_APP',
        date: body.data.date || new Date().toISOString().split('T')[0],
        tags: ['money-app', `parsed-by-${parsed.source}`],
      })
      .select('id, amount, category, description, business_personal, date, created_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ entry: toEntry(data), parsedBy: parsed.source });
  } catch (err) {
    return errorResponse(err);
  }
}
