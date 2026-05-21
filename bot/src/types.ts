export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  label: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface WeeklyTrend {
  weekNumber: number;
  weekStart: string;
  income: number;
  expenses: number;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  topCategory: string;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface TransactionRecord {
  id: string;
  date: string;
  type: string;
  amount: number;
  note: string;
  categoryLabel: string;
  categoryName: string;
  categoryIcon: string;
  accountName: string;
  accountIcon: string;
}

export interface MonthlySummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  categoryBreakdown: CategoryBreakdown[];
  weeklyTrends: WeeklyTrend[];
  transactions: TransactionRecord[];
}
