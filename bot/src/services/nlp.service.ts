// Natural language parsing for expense/income messages
// Example: "Spent $12 on lunch" → { amount: 12, type: 'expense', category: 'food', note: 'lunch' }

interface ParsedTransaction {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  note: string;
}

const EXPENSE_KEYWORDS = [
  'spent', 'paid', 'bought', 'purchased', 'cost', 'expense', 'spend',
  'pay', 'buy', 'cost me', 'charged', 'withdrew',
];

const INCOME_KEYWORDS = [
  'earned', 'received', 'got', 'income', 'salary', 'profit',
  'revenue', 'payment', 'paid me', 'deposited',
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ['food', 'lunch', 'dinner', 'breakfast', 'meal', 'restaurant', 'eat', 'coffee', 'drink', 'snack', 'pizza', 'burger', 'cafe'],
  transport: ['taxi', 'uber', 'lyft', 'bus', 'metro', 'train', 'transport', 'gas', 'fuel', 'parking', 'ride', 'fare', 'subway'],
  entertainment: ['movie', 'cinema', 'netflix', 'spotify', 'game', 'entertainment', 'concert', 'show', 'ticket', 'subscription'],
  shopping: ['shopping', 'clothes', 'shoes', 'amazon', 'online', 'store', 'market', 'shop', 'mall', 'purchase'],
  bills: ['bill', 'electricity', 'water', 'internet', 'phone', 'rent', 'insurance', 'utility', 'subscription', 'wifi'],
  health: ['doctor', 'medicine', 'gym', 'pharmacy', 'health', 'medical', 'hospital', 'clinic', 'dentist', 'workout'],
  salary: ['salary', 'wage', 'paycheck', 'work', 'job'],
  freelance: ['freelance', 'client', 'project', 'contract', 'consulting'],
  investment: ['investment', 'dividend', 'stock', 'crypto', 'return', 'profit', 'interest'],
};

export function parseTransaction(text: string): ParsedTransaction | null {
  const lower = text.toLowerCase().trim();

  // Extract amount — supports $12, 12$, 12.50, $12.50
  const amountMatch = lower.match(/\$?\s*(\d+(?:\.\d{1,2})?)\s*\$?/);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1]);
  if (isNaN(amount) || amount <= 0) return null;

  // Determine transaction type
  const isExpense = EXPENSE_KEYWORDS.some((kw) => lower.includes(kw));
  const isIncome = INCOME_KEYWORDS.some((kw) => lower.includes(kw));
  const type: 'income' | 'expense' = isIncome && !isExpense ? 'income' : 'expense';

  // Detect category from note
  let detectedCategory = 'other';
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      detectedCategory = category;
      break;
    }
  }

  // Build note from "on ..." or "for ..." patterns
  const noteMatch = lower.match(/(?:on|for)\s+(.+?)(?:\s*$|\s+(?:at|in|from))/);
  const note = noteMatch ? capitalize(noteMatch[1]) : text.trim();

  return { amount, type, category: detectedCategory, note };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
