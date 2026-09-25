import { supabase } from '@/lib/supabase/client';
import { FinanceTransaction, FinanceSummary } from '@/types/mentra';

export async function getUserFinance(userId: string): Promise<FinanceSummary> {
  const { data: txData, error } = await supabase
    .from('finance_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error || !txData || txData.length === 0) {
    return {
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlySavings: 0,
      budgetRemaining: 0,
      businessExpenseRatio: 0,
      aiInsight: 'Financial telemetry initialized. Log your first revenue stream or expense to activate AI insights.',
      transactions: []
    };
  }

  const transactions: FinanceTransaction[] = txData.map(tx => ({
    id: tx.id,
    user_id: tx.user_id,
    date: tx.date,
    title: tx.description || tx.title || 'Transaction',
    amount: Number(tx.amount),
    type: tx.amount >= 0 ? 'INCOME' : 'EXPENSE',
    category: tx.category || 'OTHER',
    scope: (tx.business_personal as 'BUSINESS' | 'PERSONAL') || 'BUSINESS',
    tags: tx.tags || []
  }));

  const monthlyIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const monthlySavings = monthlyIncome - monthlyExpenses;
  const businessExpenses = transactions
    .filter(t => t.type === 'EXPENSE' && t.scope === 'BUSINESS')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const businessExpenseRatio = monthlyExpenses > 0 ? Number((businessExpenses / monthlyExpenses).toFixed(2)) : 0;

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    budgetRemaining: Math.max(0, monthlyIncome - monthlyExpenses),
    businessExpenseRatio,
    aiInsight: monthlyIncome > 0 
      ? `Cash flow ratio stable. Net margin: ${Math.round((monthlySavings / monthlyIncome) * 100)}%.`
      : 'Ready to track revenue and burn rate.',
    transactions
  };
}

export async function createTransaction(
  userId: string,
  tx: Omit<FinanceTransaction, 'id'>
): Promise<FinanceTransaction | null> {
  const { data, error } = await supabase
    .from('finance_transactions')
    .insert({
      user_id: userId,
      amount: tx.type === 'EXPENSE' ? -Math.abs(tx.amount) : Math.abs(tx.amount),
      description: tx.title,
      category: tx.category,
      business_personal: tx.scope,
      date: tx.date || new Date().toISOString().split('T')[0],
      tags: tx.tags || []
    })
    .select()
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    user_id: data.user_id,
    date: data.date,
    title: data.description,
    amount: Math.abs(Number(data.amount)),
    type: Number(data.amount) >= 0 ? 'INCOME' : 'EXPENSE',
    category: data.category,
    scope: data.business_personal,
    tags: data.tags
  };
}
