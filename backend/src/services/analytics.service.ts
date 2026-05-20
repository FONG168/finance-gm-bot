import { prisma } from '../lib/prisma';
import { CategoryBreakdown, WeeklySummary, MonthlySummary, WeeklyTrend } from '../shared/types';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from '../utils/date';

export class AnalyticsService {
  async getWeeklySummary(userId: string, date?: Date): Promise<WeeklySummary> {
    const now = date || new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: weekStart, lte: weekEnd },
      },
      include: { category: true },
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const categoryBreakdown = this.buildCategoryBreakdown(
      transactions.filter((t) => t.type === 'expense'),
      totalExpenses,
    );

    const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0].label : 'None';

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalIncome,
      totalExpenses,
      netBalance,
      savingsRate: Math.round(savingsRate * 10) / 10,
      topCategory,
      transactionCount: transactions.length,
      categoryBreakdown,
    };
  }

  async getMonthlySummary(userId: string, month?: number, year?: number): Promise<MonthlySummary> {
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const monthStart = startOfMonth(targetYear, targetMonth);
    const monthEnd = endOfMonth(targetYear, targetMonth);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: monthStart, lte: monthEnd },
      },
      include: { category: true },
      orderBy: { date: 'asc' },
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const categoryBreakdown = this.buildCategoryBreakdown(
      transactions.filter((t) => t.type === 'expense'),
      totalExpenses,
    );

    const weeklyTrends = this.buildWeeklyTrends(transactions, monthStart, monthEnd);

    return {
      month: targetMonth,
      year: targetYear,
      totalIncome,
      totalExpenses,
      netBalance,
      savingsRate: Math.round(savingsRate * 10) / 10,
      categoryBreakdown,
      weeklyTrends,
    };
  }

  private buildCategoryBreakdown(
    expenseTransactions: Array<{ amount: any; category: any }>,
    total: number,
  ): CategoryBreakdown[] {
    const categoryMap = new Map<string, CategoryBreakdown>();

    for (const t of expenseTransactions) {
      const cat = t.category;
      if (!categoryMap.has(cat.id)) {
        categoryMap.set(cat.id, {
          categoryId: cat.id,
          categoryName: cat.name,
          label: cat.label,
          icon: cat.icon,
          color: cat.color,
          amount: 0,
          percentage: 0,
          transactionCount: 0,
        });
      }
      const entry = categoryMap.get(cat.id)!;
      entry.amount += Number(t.amount);
      entry.transactionCount++;
    }

    return Array.from(categoryMap.values())
      .map((entry) => ({
        ...entry,
        percentage: total > 0 ? Math.round((entry.amount / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  private buildWeeklyTrends(
    transactions: Array<{ date: Date; type: string; amount: any }>,
    monthStart: Date,
    monthEnd: Date,
  ): WeeklyTrend[] {
    const weeks: WeeklyTrend[] = [];
    let current = new Date(monthStart);
    let weekNumber = 1;

    while (current <= monthEnd) {
      const wStart = new Date(current);
      const wEnd = new Date(current);
      wEnd.setDate(wEnd.getDate() + 6);
      if (wEnd > monthEnd) wEnd.setTime(monthEnd.getTime());

      const weekTransactions = transactions.filter(
        (t) => t.date >= wStart && t.date <= wEnd,
      );

      weeks.push({
        weekNumber,
        weekStart: wStart.toISOString(),
        income: weekTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        expenses: weekTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      });

      current.setDate(current.getDate() + 7);
      weekNumber++;
    }

    return weeks;
  }

  async getAccountSummary(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId, isArchived: false },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    const byType = (type: string) =>
      accounts.filter((a) => a.type === type).reduce((s, a) => s + Number(a.balance), 0);

    return {
      totalAssets: accounts.reduce((s, a) => s + Number(a.balance), 0),
      totalCash: byType('cash'),
      totalBank: byType('bank'),
      totalEwallet: byType('ewallet'),
      totalSavings: byType('savings'),
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: Number(a.balance),
        currency: a.currency,
        color: a.color,
        icon: a.icon,
        isDefault: a.isDefault,
        isArchived: a.isArchived,
      })),
    };
  }
}

export const analyticsService = new AnalyticsService();
