// Shared category catalogue for the AI Money Tracker (/money).
// Safe to import from both client and server code.

export type MoneyType = 'EXPENSE' | 'INCOME';

export interface MoneyCategory {
  key: string;
  label: string;
  emoji: string;
  type: MoneyType;
}

export const MONEY_CATEGORIES: MoneyCategory[] = [
  { key: 'FOOD', label: 'Khana / Food', emoji: '🍔', type: 'EXPENSE' },
  { key: 'GROCERY', label: 'Ration / Grocery', emoji: '🛒', type: 'EXPENSE' },
  { key: 'FUEL', label: 'Petrol / Fuel', emoji: '⛽', type: 'EXPENSE' },
  { key: 'TRAVEL', label: 'Travel', emoji: '🚕', type: 'EXPENSE' },
  { key: 'BILLS', label: 'Bills / Recharge', emoji: '💡', type: 'EXPENSE' },
  { key: 'RENT', label: 'Rent / Kiraya', emoji: '🏠', type: 'EXPENSE' },
  { key: 'SHOPPING', label: 'Shopping', emoji: '🛍️', type: 'EXPENSE' },
  { key: 'HEALTH', label: 'Health / Dawai', emoji: '💊', type: 'EXPENSE' },
  { key: 'EDUCATION', label: 'Padhai / Education', emoji: '📚', type: 'EXPENSE' },
  { key: 'ENTERTAINMENT', label: 'Entertainment', emoji: '🎬', type: 'EXPENSE' },
  { key: 'FAMILY', label: 'Family / Ghar', emoji: '👨‍👩‍👧', type: 'EXPENSE' },
  { key: 'LENT', label: 'Udhaar Diya', emoji: '🤝', type: 'EXPENSE' },
  { key: 'BUSINESS', label: 'Business Kharcha', emoji: '💼', type: 'EXPENSE' },
  { key: 'EMI', label: 'EMI / Loan', emoji: '🏦', type: 'EXPENSE' },
  { key: 'OTHER', label: 'Other', emoji: '📦', type: 'EXPENSE' },
  { key: 'SALARY', label: 'Salary', emoji: '💰', type: 'INCOME' },
  { key: 'SALES', label: 'Sales / Business Income', emoji: '📈', type: 'INCOME' },
  { key: 'RECEIVED', label: 'Paisa Mila', emoji: '📥', type: 'INCOME' },
  { key: 'OTHER_INCOME', label: 'Other Income', emoji: '✨', type: 'INCOME' },
];

const BY_KEY = new Map(MONEY_CATEGORIES.map((c) => [c.key, c]));

export function getMoneyCategory(key: string | null | undefined, type: MoneyType = 'EXPENSE'): MoneyCategory {
  const found = key ? BY_KEY.get(key.toUpperCase()) : undefined;
  if (found) return found;
  return type === 'INCOME' ? BY_KEY.get('OTHER_INCOME')! : BY_KEY.get('OTHER')!;
}

export function isMoneyCategoryKey(key: string): boolean {
  return BY_KEY.has(key.toUpperCase());
}
