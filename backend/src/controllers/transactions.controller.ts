import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const createTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().min(1, 'Category is required'),
  accountId: z.string().optional(),
  note: z.string().optional(),
  date: z.string().optional(),
});

const updateTransactionSchema = createTransactionSchema.partial();

export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { page = '1', limit = '20', type, categoryId, accountId, startDate, endDate } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (accountId) where.accountId = accountId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true, account: true },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        data: transactions.map(serializeTransaction),
        total,
        page: pageNum,
        limit: limitNum,
        hasMore: skip + limitNum < total,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
}

export async function createTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const parsed = createTransactionSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { amount, type, categoryId, note, date } = parsed.data;
    let { accountId } = parsed.data;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      res.status(400).json({ success: false, error: 'Invalid category' });
      return;
    }

    // Resolve account: use provided accountId, else fall back to default account
    let account = null;
    if (accountId) {
      account = await prisma.account.findFirst({ where: { id: accountId, userId, isArchived: false } });
      if (!account) {
        res.status(400).json({ success: false, error: 'Invalid account' });
        return;
      }
    } else {
      account = await prisma.account.findFirst({
        where: { userId, isArchived: false },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      });
      if (!account) {
        res.status(400).json({ success: false, error: 'No account found. Please create a cash account first.' });
        return;
      }
      accountId = account.id;
    }

    // Insufficient funds check for expenses
    if (type === 'expense' && Number(account.balance) < amount) {
      res.status(400).json({
        success: false,
        error: `Insufficient funds. ${account.name} balance: $${Number(account.balance).toFixed(2)}, required: $${amount.toFixed(2)}`,
      });
      return;
    }

    // Balance delta: income increases, expense decreases
    const balanceDelta = type === 'income' ? amount : -amount;

    const ops: any[] = [
      prisma.transaction.create({
        data: { userId, accountId, amount, type, categoryId, note, date: date ? new Date(date) : new Date() },
        include: { category: true, account: true },
      }),
      prisma.account.update({
        where: { id: accountId },
        data: { balance: { increment: balanceDelta } },
      }),
    ];

    const results = await prisma.$transaction(ops);
    const transaction = results[0];

    res.status(201).json({ success: true, data: serializeTransaction(transaction) });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ success: false, error: 'Failed to create transaction' });
  }
}

export async function updateTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const parsed = updateTransactionSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    const { amount, type, categoryId, accountId, note, date } = parsed.data;

    // Reverse old balance effect
    const ops: any[] = [];
    if (existing.accountId) {
      const oldDelta = existing.type === 'income' ? -Number(existing.amount) : Number(existing.amount);
      ops.push(prisma.account.update({ where: { id: existing.accountId }, data: { balance: { increment: oldDelta } } }));
    }

    const newAccountId = accountId !== undefined ? accountId : existing.accountId;
    const newAmount = amount ?? Number(existing.amount);
    const newType = type ?? existing.type;

    // Apply new balance effect
    if (newAccountId) {
      const newDelta = newType === 'income' ? newAmount : -newAmount;
      ops.push(prisma.account.update({ where: { id: newAccountId }, data: { balance: { increment: newDelta } } }));
    }

    ops.push(
      prisma.transaction.update({
        where: { id },
        data: {
          ...(amount !== undefined && { amount }),
          ...(type !== undefined && { type }),
          ...(categoryId !== undefined && { categoryId }),
          ...(accountId !== undefined && { accountId }),
          ...(note !== undefined && { note }),
          ...(date !== undefined && { date: new Date(date) }),
        },
        include: { category: true, account: true },
      }),
    );

    const results = await prisma.$transaction(ops);
    const transaction = results[results.length - 1];

    res.json({ success: true, data: serializeTransaction(transaction) });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ success: false, error: 'Failed to update transaction' });
  }
}

export async function deleteTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    const ops: any[] = [prisma.transaction.delete({ where: { id } })];

    // Reverse the balance effect
    if (existing.accountId && existing.type !== 'transfer') {
      const delta = existing.type === 'income' ? -Number(existing.amount) : Number(existing.amount);
      ops.push(prisma.account.update({ where: { id: existing.accountId }, data: { balance: { increment: delta } } }));
    }

    await prisma.$transaction(ops);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete transaction' });
  }
}

export function serializeTransaction(t: any) {
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

function serializeAccount(a: any) {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    balance: Number(a.balance),
    currency: a.currency,
    color: a.color,
    icon: a.icon,
    isDefault: a.isDefault,
  };
}
