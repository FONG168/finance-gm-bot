// Mirrors the backend analytics logic for use directly in the bot (no HTTP round-trip needed)
import { prisma } from '../lib/prisma';
import { WeeklySummary, MonthlySummary, CategoryBreakdown, WeeklyTrend, TransactionRecord } from '../types';

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export const analyticsService = {
  async getWeeklySummary(userId: string, date?: Date): Promise<WeeklySummary> {
    const now = date || new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: weekStart, lte: weekEnd } },
      include: { category: true },
    });

    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 1000) / 10 : 0;

    const expenseTxns = transactions.filter((t) => t.type === 'expense');
    const categoryMap = new Map<string, CategoryBreakdown>();

    for (const t of expenseTxns) {
      const cat = t.category;
      if (!categoryMap.has(cat.id)) {
        categoryMap.set(cat.id, {
          categoryId: cat.id,
          categoryName: cat.name as any,
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

    const categoryBreakdown = Array.from(categoryMap.values())
      .map((e) => ({ ...e, percentage: totalExpenses > 0 ? Math.round((e.amount / totalExpenses) * 1000) / 10 : 0 }))
      .sort((a, b) => b.amount - a.amount);

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalIncome,
      totalExpenses,
      netBalance,
      savingsRate,
      topCategory: categoryBreakdown[0]?.label || 'None',
      transactionCount: transactions.length,
      categoryBreakdown,
    };
  },

  async getMonthlySummary(userId: string, month?: number, year?: number): Promise<MonthlySummary> {
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const monthStart = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      include: { category: true, account: true },
      orderBy: { date: 'asc' },
    });

    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 1000) / 10 : 0;

    const expenseTxns = transactions.filter((t) => t.type === 'expense');
    const categoryMap = new Map<string, CategoryBreakdown>();
    for (const t of expenseTxns) {
      const cat = t.category;
      if (!categoryMap.has(cat.id)) {
        categoryMap.set(cat.id, {
          categoryId: cat.id, categoryName: cat.name as any, label: cat.label,
          icon: cat.icon, color: cat.color, amount: 0, percentage: 0, transactionCount: 0,
        });
      }
      const entry = categoryMap.get(cat.id)!;
      entry.amount += Number(t.amount);
      entry.transactionCount++;
    }
    const categoryBreakdown = Array.from(categoryMap.values())
      .map((e) => ({ ...e, percentage: totalExpenses > 0 ? Math.round((e.amount / totalExpenses) * 1000) / 10 : 0 }))
      .sort((a, b) => b.amount - a.amount);

    const weeklyTrends: WeeklyTrend[] = [];
    let current = new Date(monthStart);
    let weekNumber = 1;
    while (current <= monthEnd) {
      const wStart = new Date(current);
      const wEnd = new Date(current);
      wEnd.setDate(wEnd.getDate() + 6);
      if (wEnd > monthEnd) wEnd.setTime(monthEnd.getTime());

      const weekTxns = transactions.filter((t) => {
        const d = new Date(t.date);
        return d >= wStart && d <= wEnd;
      });
      weeklyTrends.push({
        weekNumber,
        weekStart: wStart.toISOString(),
        income: weekTxns.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        expenses: weekTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      });

      current.setDate(current.getDate() + 7);
      weekNumber++;
    }

    const txRecords: TransactionRecord[] = transactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      type: t.type,
      amount: Number(t.amount),
      note: t.note || '',
      categoryLabel: t.category.label,
      categoryName: t.category.name as string,
      categoryIcon: t.category.icon,
      accountName: (t as any).account?.name || '—',
      accountIcon: (t as any).account?.icon || '💵',
    }));

    return { month: targetMonth, year: targetYear, totalIncome, totalExpenses, netBalance, savingsRate, categoryBreakdown, weeklyTrends, transactions: txRecords };
  },
};
