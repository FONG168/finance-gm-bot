import { Router } from 'express';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth';
import adminRoutes from './admin';
import { requireActiveSubscription } from '../middleware/subscriptionGate';
import { telegramAuth } from '../controllers/auth.controller';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactions.controller';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountTransactions,
  transferBetweenAccounts,
} from '../controllers/accounts.controller';
import {
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getReports,
  getAccountSummary,
} from '../controllers/analytics.controller';
import { prisma } from '../lib/prisma';
import { generateJWT } from '../middleware/auth';

const router = Router();

// Admin routes
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
router.post('/auth/telegram', telegramAuth);

router.post('/auth/bot-token', async (req, res) => {
  try {
    const { uid, tok } = req.body;
    if (!uid || !tok) { res.status(400).json({ success: false, error: 'uid and tok required' }); return; }
    const botToken = process.env.BOT_TOKEN!;
    const expected = crypto.createHmac('sha256', botToken).update(`telegramId:${uid}`).digest('hex');
    if (expected !== tok) { res.status(401).json({ success: false, error: 'Invalid token' }); return; }
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(uid) } });
    if (!user) { res.status(404).json({ success: false, error: 'User not found — send /start to the bot first' }); return; }
    const token = generateJWT({ userId: user.id, telegramId: Number(user.telegramId), firstName: user.firstName });
    res.json({ success: true, data: { token, user: { id: user.id, telegramId: Number(user.telegramId), firstName: user.firstName, lastName: user.lastName, username: user.username, photoUrl: user.photoUrl, currency: user.currency, timezone: user.timezone, plan: user.plan, subscriptionStatus: user.subscriptionStatus, trialEndsAt: user.trialEndsAt, premiumStartedAt: user.premiumStartedAt, premiumExpiresAt: user.premiumExpiresAt } } });
  } catch (err) {
    console.error('Bot-token auth error:', err);
    res.status(500).json({ success: false, error: 'Auth failed' });
  }
});

router.get('/auth/me', authenticate, async (req, res) => {
  try {
    const payload = (req as any).user;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({
      success: true,
      data: {
        id: user.id,
        telegramId: Number(user.telegramId),
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        photoUrl: user.photoUrl,
        currency: user.currency,
        timezone: user.timezone,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
        premiumStartedAt: user.premiumStartedAt,
        premiumExpiresAt: user.premiumExpiresAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

// Transaction routes (write ops require active subscription)
router.get('/transactions', authenticate, getTransactions);
router.post('/transactions', authenticate, requireActiveSubscription, createTransaction);
router.put('/transactions/:id', authenticate, requireActiveSubscription, updateTransaction);
router.delete('/transactions/:id', authenticate, deleteTransaction);

// Account routes
router.get('/accounts', authenticate, getAccounts);
router.post('/accounts', authenticate, createAccount);
router.put('/accounts/:id', authenticate, updateAccount);
router.delete('/accounts/:id', authenticate, deleteAccount);
router.get('/accounts/:id/transactions', authenticate, getAccountTransactions);
router.post('/accounts/transfer', authenticate, transferBetweenAccounts);

// Analytics routes
router.get('/analytics/weekly', authenticate, getWeeklyAnalytics);
router.get('/analytics/monthly', authenticate, getMonthlyAnalytics);
router.get('/analytics/accounts', authenticate, getAccountSummary);
router.get('/reports', authenticate, getReports);

// Payment requests (user submits after paying via QR)
router.post('/payments/request', authenticate, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const { amount, currency, plan, durationDays, qrProvider, screenshotUrl, note } = req.body;
    if (!amount || !plan || !durationDays) {
      res.status(400).json({ success: false, error: 'amount, plan, durationDays required' });
      return;
    }
    const payment = await prisma.paymentRequest.create({
      data: { userId, amount, currency: currency || 'USD', plan, durationDays, qrProvider, screenshotUrl, note },
    });
    res.status(201).json({ success: true, data: { id: payment.id, status: payment.status } });
  } catch (err) {
    console.error('Payment request error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit payment request' });
  }
});

// Get active QR codes (user-facing — public)
router.get('/qr-codes', async (_req, res) => {
  try {
    const qrCodes = await prisma.qRCode.findMany({ where: { isActive: true }, orderBy: { provider: 'asc' } });
    res.json({ success: true, data: qrCodes });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch QR codes' });
  }
});

// User's payment history
router.get('/payments/my', authenticate, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const payments = await prisma.paymentRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json({ success: true, data: payments });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

// User's subscription status
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, subscriptionStatus: true, trialEndsAt: true, premiumStartedAt: true, premiumExpiresAt: true },
    });
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get subscription' });
  }
});

// Categories (public)
router.get('/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: categories });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// Debug endpoint
router.post('/debug/auth', (req, res) => {
  const { initData } = req.body;
  if (!initData) { res.json({ received: false }); return; }
  const crypto2 = require('crypto');
  const botToken = process.env.BOT_TOKEN!;
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  const checkString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secretKey = crypto2.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto2.createHmac('sha256', secretKey).update(checkString).digest('hex');
  res.json({ received: true, initDataLength: initData.length, receivedHash: hash, computedHash, match: computedHash === hash });
});

export default router;
