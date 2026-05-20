import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth';
import { createAuditLog, getClientInfo } from '../../services/audit.service';
import { sendTelegramMessage } from '../../services/notify.service';

function calcBillingExpiry(currentExpiry: Date | null, durationDays: number): { start: Date; expiry: Date } {
  const now = new Date();
  // If user has active premium, extend from their current expiry (no lost days)
  const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const expiry = new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const start = currentExpiry && currentExpiry > now ? currentExpiry : now;
  return { start, expiry };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

const router = Router();
router.use(authenticateAdmin);

// GET /api/admin/payments
router.get('/', requirePermission('manage_payments'), async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = status ? { status } : {};

    const [payments, total] = await Promise.all([
      prisma.paymentRequest.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, username: true, telegramId: true } },
          reviewedBy: { select: { id: true, firstName: true, email: true } },
        },
      }),
      prisma.paymentRequest.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        payments: payments.map(p => ({ ...p, user: { ...p.user, telegramId: Number(p.user.telegramId) } })),
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) {
    console.error('List payments error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

// GET /api/admin/payments/:id
router.get('/:id', requirePermission('manage_payments'), async (req: Request, res: Response) => {
  try {
    const payment = await prisma.paymentRequest.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        reviewedBy: { select: { id: true, firstName: true, email: true } },
      },
    });
    if (!payment) { res.status(404).json({ success: false, error: 'Payment not found' }); return; }
    res.json({ success: true, data: { ...payment, user: { ...payment.user, telegramId: Number(payment.user.telegramId) } } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch payment' });
  }
});

// POST /api/admin/payments/:id/approve
router.post('/:id/approve', requirePermission('manage_payments'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = (req as any).admin;

    const payment = await prisma.paymentRequest.findUnique({
      where: { id },
      include: { user: { select: { telegramId: true, firstName: true, premiumExpiresAt: true, premiumStartedAt: true } } },
    });
    if (!payment) { res.status(404).json({ success: false, error: 'Payment not found' }); return; }
    if (payment.status !== 'PENDING') {
      res.status(400).json({ success: false, error: 'Payment is not pending' });
      return;
    }

    // Billing cycle: extend from current expiry if still active, else from today
    const isLifetime = payment.plan === 'LIFETIME' || payment.durationDays >= 36500;
    const { start, expiry } = isLifetime
      ? { start: new Date(), expiry: new Date('2099-12-31') }
      : calcBillingExpiry(payment.user.premiumExpiresAt, payment.durationDays);

    const isFirstActivation = !payment.user.premiumStartedAt;

    await prisma.$transaction([
      prisma.paymentRequest.update({
        where: { id },
        data: { status: 'APPROVED', reviewedById: admin.adminId, reviewedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: {
          plan: payment.plan as any,
          subscriptionStatus: 'ACTIVE',
          ...(isFirstActivation ? { premiumStartedAt: start } : {}),
          premiumExpiresAt: expiry,
        },
      }),
      prisma.subscriptionLog.create({
        data: {
          userId: payment.userId,
          action: 'premium_activate',
          plan: payment.plan,
          startDate: start,
          endDate: expiry,
          note: `Payment ${id} approved by admin ${admin.email}`,
        },
      }),
    ]);

    await createAuditLog({
      adminId: admin.adminId, action: 'payment.approve', targetType: 'payment', targetId: id,
      targetUserId: payment.userId, oldValue: { status: 'PENDING' }, newValue: { status: 'APPROVED', premiumExpiresAt: expiry },
      ...getClientInfo(req),
    });

    // Notify user via Telegram bot
    const appUrl = process.env.FRONTEND_URL || 'https://t.me/kh_mart_finance_bot';
    const nextBillingDate = isLifetime ? 'Never — Lifetime access!' : formatDate(expiry);
    const planLabel = isLifetime ? 'Lifetime' : `${payment.durationDays}-day Premium`;
    const message = isLifetime
      ? `✅ *Payment Approved!*\n\n` +
        `Your payment of *$${payment.amount}* has been confirmed.\n\n` +
        `🏆 *Plan:* ${planLabel}\n` +
        `♾️ *Access:* Lifetime — never expires\n\n` +
        `You can now record unlimited transactions. Enjoy!\n\n` +
        `[Open Finance GM](${appUrl})`
      : `✅ *Payment Approved!*\n\n` +
        `Your payment of *$${payment.amount}* has been confirmed.\n\n` +
        `⭐ *Plan:* ${planLabel}\n` +
        `📅 *Active until:* ${nextBillingDate}\n` +
        `🔄 *Next payment due:* ${nextBillingDate}\n\n` +
        `You can now record transactions freely. We'll remind you before your next billing date.\n\n` +
        `[Open Finance GM](${appUrl})`;

    await sendTelegramMessage(payment.user.telegramId, message);

    res.json({ success: true, message: 'Payment approved, premium activated' });
  } catch (err) {
    console.error('Approve payment error:', err);
    res.status(500).json({ success: false, error: 'Failed to approve payment' });
  }
});

// POST /api/admin/payments/:id/reject
router.post('/:id/reject', requirePermission('manage_payments'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const admin = (req as any).admin;
    const payment = await prisma.paymentRequest.findUnique({
      where: { id },
      include: { user: { select: { telegramId: true, firstName: true } } },
    });
    if (!payment) { res.status(404).json({ success: false, error: 'Payment not found' }); return; }
    if (payment.status !== 'PENDING') {
      res.status(400).json({ success: false, error: 'Payment is not pending' });
      return;
    }
    await prisma.paymentRequest.update({
      where: { id },
      data: { status: 'REJECTED', reviewedById: admin.adminId, reviewedAt: new Date(), rejectReason: reason },
    });
    await createAuditLog({
      adminId: admin.adminId, action: 'payment.reject', targetType: 'payment', targetId: id,
      targetUserId: payment.userId, oldValue: { status: 'PENDING' }, newValue: { status: 'REJECTED', reason },
      ...getClientInfo(req),
    });

    // Notify user
    const appUrl = process.env.FRONTEND_URL || 'https://t.me/kh_mart_finance_bot';
    const message =
      `❌ *Payment Not Confirmed*\n\n` +
      `Your payment of *$${payment.amount}* could not be verified.\n\n` +
      (reason ? `📝 *Reason:* ${reason}\n\n` : '') +
      `Please try again or contact support.\n\n` +
      `[Open Finance GM](${appUrl})`;

    await sendTelegramMessage(payment.user.telegramId, message);

    res.json({ success: true, message: 'Payment rejected' });
  } catch (err) {
    console.error('Reject payment error:', err);
    res.status(500).json({ success: false, error: 'Failed to reject payment' });
  }
});

export default router;
