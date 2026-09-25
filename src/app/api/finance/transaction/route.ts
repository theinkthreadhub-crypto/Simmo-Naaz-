import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Session required.' }, { status: 401 });
    }

    const { amount, description, category, businessPersonal, accountSource } = await request.json();

    if (amount === undefined || !description) {
      return NextResponse.json({ error: 'Amount and description are required.' }, { status: 400 });
    }

    const numericAmount = Number(amount);

    const { data, error } = await supabase
      .from('finance_transactions')
      .insert({
        user_id: user.id,
        amount: numericAmount,
        description,
        category: category || 'OTHER',
        business_personal: businessPersonal || 'BUSINESS',
        account_source: accountSource || 'PRIMARY_ACCOUNT',
        date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;

    // Record activity log
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'TRANSACTION_RECORDED',
      module: 'FINANCE',
      details: {
        transaction_id: data.id,
        amount: numericAmount,
        description,
        type: numericAmount >= 0 ? 'INCOME' : 'EXPENSE'
      }
    });

    return NextResponse.json({ success: true, transaction: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
