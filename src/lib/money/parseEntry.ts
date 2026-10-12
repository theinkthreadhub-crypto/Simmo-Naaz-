import { z } from 'zod';
import { getAIProvider } from '@/lib/ai/provider';
import { MONEY_CATEGORIES, MoneyType, isMoneyCategoryKey } from './categories';

export interface ParsedMoneyEntry {
  amount: number;
  type: MoneyType;
  category: string;
  description: string;
  scope: 'PERSONAL' | 'BUSINESS';
  source: 'ai' | 'rules';
}

const aiSchema = z.object({
  amount: z.coerce.number().positive(),
  type: z.enum(['EXPENSE', 'INCOME']),
  category: z.string(),
  description: z.string().min(1).max(120),
  scope: z.enum(['PERSONAL', 'BUSINESS']).catch('PERSONAL'),
});

const KEYWORDS: Array<[string, RegExp]> = [
  ['SALARY', /salary|tankhwah|tankha|payment aaya|stipend/i],
  ['SALES', /sale|sold|bikri|becha|order mila|customer ne/i],
  ['RECEIVED', /mila|mile|aaya|aaye|received|wapas|return kiya|lautaya/i],
  ['FUEL', /petrol|diesel|fuel|cng|pump/i],
  ['FOOD', /khana|food|chai|tea|coffee|nashta|lunch|dinner|breakfast|zomato|swiggy|pizza|samosa|restaurant|hotel|dhaba/i],
  ['GROCERY', /ration|grocery|sabzi|sabji|doodh|milk|atta|chawal|dal|kirana|blinkit|zepto/i],
  ['TRAVEL', /auto|taxi|uber|ola|rapido|bus|train|ticket|metro|flight|kiraya bhada|travel/i],
  ['BILLS', /bill|recharge|bijli|electricity|wifi|internet|gas|cylinder|mobile|dth|jio|airtel/i],
  ['RENT', /rent|kiraya|room/i],
  ['HEALTH', /dawai|dawa|medicine|doctor|hospital|clinic|test|chemist|medical/i],
  ['EDUCATION', /fees|fee|school|college|book|kitab|course|tuition|coaching/i],
  ['ENTERTAINMENT', /movie|film|netflix|prime|hotstar|game|party|outing/i],
  ['SHOPPING', /kapde|kapda|shirt|jeans|shoes|joote|amazon|flipkart|meesho|shopping|mall/i],
  ['EMI', /emi|loan|kist|installment/i],
  ['LENT', /udhaar|udhar|ko diye|ko diya|lend|lent/i],
  ['FAMILY', /mummy|papa|bhai|behen|ghar|family|wife|biwi|bachche/i],
  ['BUSINESS', /stock|maal|inventory|supplier|packing|courier|ads|marketing|printing/i],
];

const INCOME_HINT = /salary|mila|mile|aaya|aaye|received|income|sale|bikri|becha|kamaya|earned|credit|wapas/i;

/** Deterministic parser used when no AI key is configured or the AI call fails. */
export function parseWithRules(text: string, amountOverride?: number): ParsedMoneyEntry | null {
  const clean = text.replace(/(\d),(?=\d)/g, '$1');
  const match = clean.match(/(\d+(?:\.\d{1,2})?)\s*(k)?/i);
  let amount = amountOverride ?? (match ? Number(match[1]) * (match[2] ? 1000 : 1) : NaN);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  amount = Math.round(amount * 100) / 100;

  const description = clean
    .replace(/(?:₹|rs\.?|inr|rupaye|rupees|rupay)\s*/gi, '')
    .replace(/\d+(?:\.\d{1,2})?\s*k?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Entry';

  const isIncome = INCOME_HINT.test(text) && !/ko diye|ko diya|udhaar diya|udhar diya/i.test(text);
  const type: MoneyType = isIncome ? 'INCOME' : 'EXPENSE';

  let category = type === 'INCOME' ? 'OTHER_INCOME' : 'OTHER';
  for (const [key, re] of KEYWORDS) {
    const cat = MONEY_CATEGORIES.find((c) => c.key === key)!;
    if (cat.type === type && re.test(text)) {
      category = key;
      break;
    }
  }

  return {
    amount,
    type,
    category,
    description: description.slice(0, 120),
    scope: category === 'BUSINESS' || category === 'SALES' ? 'BUSINESS' : 'PERSONAL',
    source: 'rules',
  };
}

function buildPrompt(text: string, amountOverride?: number): string {
  const cats = MONEY_CATEGORIES.map((c) => `${c.key} (${c.type}: ${c.label})`).join('\n');
  return [
    'You are a money-tracking assistant for an Indian user who writes in Hindi, Hinglish or English.',
    'Read the entry and return ONLY a JSON object, no markdown, with keys:',
    '{"amount": number (rupees, positive), "type": "EXPENSE"|"INCOME", "category": one key from the list, "description": short clean title in the user\'s language (max 6 words), "scope": "PERSONAL"|"BUSINESS"}',
    'Rules: money paid, spent, given or lent is EXPENSE. Money received, earned, salary or returned to the user is INCOME.',
    '"k" means thousand (2k = 2000). Pick the closest category; use OTHER / OTHER_INCOME only when nothing fits.',
    amountOverride ? `The user already typed the amount separately: ${amountOverride}. Use exactly this amount.` : '',
    '',
    'Categories:',
    cats,
    '',
    `Entry: ${JSON.stringify(text)}`,
  ].filter(Boolean).join('\n');
}

function extractJson(raw: string): unknown {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Uses the app's configured AI provider (same Gemini key) and falls back to rules. */
export async function parseMoneyEntry(text: string, amountOverride?: number): Promise<ParsedMoneyEntry | null> {
  const rules = parseWithRules(text, amountOverride);

  try {
    const provider = getAIProvider({ purpose: 'FAST' });
    if (provider.name !== 'fallback_intelligence') {
      const res = await provider.generate(
        [{ role: 'user', content: buildPrompt(text, amountOverride) }],
        { temperature: 0, maxTokens: 300 }
      );
      const parsed = aiSchema.safeParse(extractJson(res.content || ''));
      if (parsed.success) {
        const d = parsed.data;
        const category = d.category.toUpperCase();
        const cat = MONEY_CATEGORIES.find((c) => c.key === category);
        return {
          amount: amountOverride ?? Math.round(d.amount * 100) / 100,
          type: d.type,
          category: cat && cat.type === d.type && isMoneyCategoryKey(category)
            ? category
            : d.type === 'INCOME' ? 'OTHER_INCOME' : 'OTHER',
          description: d.description.trim(),
          scope: d.scope,
          source: 'ai',
        };
      }
    }
  } catch (err) {
    console.warn('[money] AI categorisation failed, using rules:', (err as Error)?.message);
  }

  return rules;
}
