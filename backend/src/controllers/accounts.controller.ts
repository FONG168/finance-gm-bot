import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const ACCOUNT_ICONS: Record<string, string> = {
  cash: '💵',
  bank: '🏦',
  ewallet: '📱',
  savings: '🏧',
  credit: '💳',
};

const ACCOUNT_COLORS: Record<string, string> = {
  cash: '#10b981',
  bank: '#3b82f6',
  ewallet: '#8b5cf6',
  savings: '#f59e0b',
  credit: '#ef4444',
};

const createAccountSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['cash', 'bank', 'ewallet', 'savings', 'credit']),
  balance: z.number().default(0),
  currency: z.string().default('USD'),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  type: z.enum(['cash', 'bank', 'ewallet', 'savings', 'credit']).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isArchived: z.boolean().optional(),
});

const transferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amount: z.number().positive(),
  note: z.string().optional(),
  date: z.string().optional(),
});

export async function getAccounts(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;

    const accounts = await prisma.account.findMany({
      where: { userId, isArchived: false },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    const totalAssets = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
    res.json({
      success: true,
      data: {
        accounts: accounts.map(serializeAccount),
        totalAssets,
      },
    });
  } catch (err) {
    console.error('Get accounts error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch accounts' });
  }
}

export async function createAccount(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const parsed = createAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }
    const { name, type, balance, currency, color, icon } = parsed.data;
    const account = await prisma.account.create({
      data: {
        userId,
        name,
        type,
        balance,
        currency,
        color: color || ACCOUNT_COLORS[type] || '#7c3aed',
        icon: icon || ACCOUNT_ICONS[type] || '💰',
      },
    });
    res.status(201).json({ success: true, data: serializeAccount(account) });
  } catch (err) {
    console.error('Create account error:', err);
    res.status(500).json({ success: false, error: 'Failed to create account' });
  }
}

export async function updateAccount(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const parsed = updateAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }
    const existing = await prisma.account.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }
    const account = await prisma.account.update({
      where: { id },
      data: parsed.data,
    });
    res.json({ success: true, data: serializeAccount(account) });
  } catch (err) {
    console.error('Update account error:', err);
    res.status(500).json({ success: false, error: 'Failed to update account' });
  }
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const existing = await prisma.account.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }
    if (existing.isDefault) {
      res.status(400).json({ success: false, error: 'Cannot delete the default account' });
      return;
    }
    // Detach transactions instead of deleting them
    await prisma.transaction.updateMany({ where: { accountId: id }, data: { accountId: null } });
    await prisma.account.delete({ where: { id } });
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete account' });
  }
}

export async function getAccountTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const account = await prisma.account.findFirst({ where: { id, userId } });
    if (!account) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }

    const [transactions, total, incomeAgg, expenseAgg, transferInAgg] = await Promise.all([
      prisma.transaction.findMany({
        where: { accountId: id, userId },
        include: { category: true, account: true },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where: { accountId: id, userId } }),
      prisma.transaction.aggregate({ where: { accountId: id, userId, type: 'income' }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { accountId: id, userId, type: 'expense' }, _sum: { amount: true } }),
      // Incoming transfers: note starts with "Transfer from" (credit leg)
      prisma.transaction.aggregate({
        where: { accountId: id, userId, type: 'transfer', note: { startsWith: 'Transfer from' } },
        _sum: { amount: true },
      }),
    ]);

    // Determine transfer direction for each transfer transaction.
    // Batch-fetch partner legs (same transferId, different accountId) to avoid N+1.
    const transferIds = transactions
      .filter((t) => t.type === 'transfer' && t.transferId)
      .map((t) => t.transferId!);

    const incomingTransferIds = new Set<string>();
    if (transferIds.length > 0) {
      const partners = await prisma.transaction.findMany({
        where: { transferId: { in: transferIds }, accountId: { not: id } },
        select: { transferId: true, accountId: true },
      });
      // The partner is the OTHER leg. If the partner's accountId is the source
      // (i.e., the partner has note "Transfer to …"), then our leg is the credit (incoming).
      // Simpler: query which transferIds had their partner as the FROM side by checking
      // the partner note. But safest is: the transaction on THIS account whose note starts
      // with "Transfer from" is the credit (incoming) leg.
      for (const tx of transactions) {
        if (tx.type === 'transfer' && tx.transferId && tx.note?.startsWith('Transfer from')) {
          incomingTransferIds.add(tx.transferId);
        }
      }
      // Fallback for custom notes: if neither leg has "Transfer from", check if this
      // account's leg was NOT found in partners (i.e., this account IS the destination).
      // The destination was balance-incremented. We can't know from the record alone,
      // so leave unresolved transfers as 'out' (neutral fallback).
    }

    const serialized = transactions.map((t) => {
      const base = serializeTransaction(t);
      if (t.type === 'transfer' && t.transferId) {
        return {
          ...base,
          transferDirection: incomingTransferIds.has(t.transferId) ? 'in' : 'out',
        };
      }
      return base;
    });

    const totalIncome = Number(incomeAgg._sum.amount || 0) + Number(transferInAgg._sum.amount || 0);
    const totalExpense = Number(expenseAgg._sum.amount || 0);

    res.json({
      success: true,
      data: {
        account: serializeAccount(account),
        data: serialized,
        total,
        page: pageNum,
        limit: limitNum,
        hasMore: skip + limitNum < total,
        totalIncome,
        totalExpense,
      },
    });
  } catch (err) {
    console.error('Get account transactions error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch account transactions' });
  }
}

export async function transferBetweenAccounts(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const parsed = transferSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }
    const { fromAccountId, toAccountId, amount, note, date } = parsed.data;

    if (fromAccountId === toAccountId) {
      res.status(400).json({ success: false, error: 'Cannot transfer to the same account' });
      return;
    }

    const [from, to] = await Promise.all([
      prisma.account.findFirst({ where: { id: fromAccountId, userId } }),
      prisma.account.findFirst({ where: { id: toAccountId, userId } }),
    ]);

    if (!from || !to) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }
    if (Number(from.balance) < amount) {
      res.status(400).json({ success: false, error: 'Insufficient balance' });
      return;
    }

    const transferId = `trf_${Date.now()}`;
    const txDate = date ? new Date(date) : new Date();

    // Get or create the transfer category
    let transferCategory = await prisma.category.findUnique({ where: { name: 'transfer' } });
    if (!transferCategory) {
      transferCategory = await prisma.category.create({
        data: { id: 'transfer', name: 'transfer', label: 'Transfer', icon: '↔️', color: '#6366f1', type: 'both' },
      });
    }

    await prisma.$transaction([
      // Debit from source
      prisma.transaction.create({
        data: {
          userId,
          accountId: fromAccountId,
          amount,
          type: 'transfer',
          categoryId: transferCategory.id,
          note: note || `Transfer to ${to.name}`,
          transferId,
          date: txDate,
        },
      }),
      // Credit to destination
      prisma.transaction.create({
        data: {
          userId,
          accountId: toAccountId,
          amount,
          type: 'transfer',
          categoryId: transferCategory.id,
          note: note || `Transfer from ${from.name}`,
          transferId,
          date: txDate,
        },
      }),
      // Update balances
      prisma.account.update({ where: { id: fromAccountId }, data: { balance: { decrement: amount } } }),
      prisma.account.update({ where: { id: toAccountId }, data: { balance: { increment: amount } } }),
    ]);

    const [updatedFrom, updatedTo] = await Promise.all([
      prisma.account.findUnique({ where: { id: fromAccountId } }),
      prisma.account.findUnique({ where: { id: toAccountId } }),
    ]);

    res.json({
      success: true,
      data: { fromAccount: serializeAccount(updatedFrom!), toAccount: serializeAccount(updatedTo!) },
    });
  } catch (err) {
    console.error('Transfer error:', err);
    res.status(500).json({ success: false, error: 'Transfer failed' });
  }
}

function serializeAccount(a: any) {
  return {
    id: a.id,
    userId: a.userId,
    name: a.name,
    type: a.type,
    balance: Number(a.balance),
    currency: a.currency,
    color: a.color,
    icon: a.icon,
    isArchived: a.isArchived,
    isDefault: a.isDefault,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function serializeTransaction(t: any) {
  return {
    id: t.id,
    userId: t.userId,
    accountId: t.accountId,
    account: t.account ? serializeAccount(t.account) : undefined,
    amount: Number(t.amount),
    type: t.type,
    categoryId: t.categoryId,
    category: t.category,
    note: t.note,
    transferId: t.transferId,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
