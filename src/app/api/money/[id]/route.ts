import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser, AuthRequiredError } from '@/lib/auth/requireUser';
import { getMoneyCategory, isMoneyCategoryKey } from '@/lib/money/categories';

const patchSchema = z.object({
  category: z.string().refine(isMoneyCategoryKey, 'Unknown category'),
});

function errorResponse(err: unknown) {
  if (err instanceof AuthRequiredError) {
    return NextResponse.json({ error: 'Login required.' }, { status: 401 });
  }
  return NextResponse.json({ error: (err as Error)?.message || 'Server error' }, { status: 500 });
}

// PATCH /api/money/:id  { category }  → fix a category the AI got wrong
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    const user = await requireUser();
    const body = patchSchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: existing, error: readError } = await supabase
      .from('finance_transactions')
      .select('amount')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (readError || !existing) {
      return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
    }

    // Switching between an expense and an income category flips the sign.
    const cat = getMoneyCategory(body.data.category);
    const abs = Math.abs(Number(existing.amount));
    const { error } = await supabase
      .from('finance_transactions')
      .update({
        category: cat.key,
        amount: cat.type === 'EXPENSE' ? -abs : abs,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE /api/money/:id
export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    const user = await requireUser();
    const supabase = createClient();
    const { error } = await supabase
      .from('finance_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
