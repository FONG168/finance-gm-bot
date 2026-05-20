import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth';
import { createAuditLog, getClientInfo } from '../../services/audit.service';

const router = Router();
router.use(authenticateAdmin);

// GET /api/admin/users
router.get('/', requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const { search, plan, status, page = '1', limit = '20', sortBy = 'createdAt', sortDir = 'desc' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (plan) where.plan = plan;
    if (status === 'banned') where.isBanned = true;
    else if (status === 'suspended') where.isSuspended = true;
    else if (status === 'active') where.isActive = true;
    else if (status) where.subscriptionStatus = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortDir },
        select: {
          id: true, telegramId: true, firstName: true, lastName: true, username: true,
          photoUrl: true, currency: true, isActive: true, isBanned: true, isSuspended: true,
          plan: true, subscriptionStatus: true, trialEndsAt: true, premiumExpiresAt: true,
          createdAt: true, updatedAt: true,
          _count: { select: { transactions: true, accounts: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users: users.map(u => ({ ...u, telegramId: Number(u.telegramId) })),
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id
router.get('/:id', requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        accounts: true,
        transactions: { orderBy: { date: 'desc' }, take: 20, include: { category: true } },
        paymentRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
        subscriptionLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { transactions: true, accounts: true } },
      },
    });
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: { ...user, telegramId: Number(user.telegramId) } });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// POST /api/admin/users/:id/suspend
router.post('/:id/suspend', requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const admin = (req as any).admin;
    const user = await prisma.user.findUnique({ where: { id }, select: { isSuspended: true, firstName: true } });
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    await prisma.user.update({ where: { id }, data: { isSuspended: true } });
    await createAuditLog({
      adminId: admin.adminId, action: 'user.suspend', targetType: 'user', targetId: id, targetUserId: id,
      oldValue: { isSuspended: user.isSuspended }, newValue: { isSuspended: true, reason },
      ...getClientInfo(req),
    });
    res.json({ success: true, message: 'User suspended' });
  } catch (err) {
    console.error('Suspend user error:', err);
    res.status(500).json({ success: false, error: 'Failed to suspend user' });
  }
});

// POST /api/admin/users/:id/unsuspend
router.post('/:id/unsuspend', requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = (req as any).admin;
    await prisma.user.update({ where: { id }, data: { isSuspended: false } });
    await createAuditLog({
      adminId: admin.adminId, action: 'user.unsuspend', targetType: 'user', targetId: id, targetUserId: id,
      newValue: { isSuspended: false }, ...getClientInfo(req),
    });
    res.json({ success: true, message: 'User unsuspended' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to unsuspend user' });
  }
});

// POST /api/admin/users/:id/ban
router.post('/:id/ban', requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const admin = (req as any).admin;
    await prisma.user.update({ where: { id }, data: { isBanned: true, isActive: false } });
    await createAuditLog({
      adminId: admin.adminId, action: 'user.ban', targetType: 'user', targetId: id, targetUserId: id,
      newValue: { isBanned: true, reason }, ...getClientInfo(req),
    });
    res.json({ success: true, message: 'User banned' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to ban user' });
  }
});

// POST /api/admin/users/:id/unban
router.post('/:id/unban', requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = (req as any).admin;
    await prisma.user.update({ where: { id }, data: { isBanned: false, isActive: true } });
    await createAuditLog({
      adminId: admin.adminId, action: 'user.unban', targetType: 'user', targetId: id, targetUserId: id,
      newValue: { isBanned: false }, ...getClientInfo(req),
    });
    res.json({ success: true, message: 'User unbanned' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to unban user' });
  }
});

// POST /api/admin/users/:id/extend-trial
router.post('/:id/extend-trial', requirePermission('manage_subscriptions'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { days = 7 } = req.body;
    const admin = (req as any).admin;
    const user = await prisma.user.findUnique({ where: { id }, select: { trialEndsAt: true } });
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    const base = user.trialEndsAt && user.trialEndsAt > new Date() ? user.trialEndsAt : new Date();
    const newTrialEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id },
      data: { trialEndsAt: newTrialEnd, subscriptionStatus: 'TRIAL' },
    });
    await prisma.subscriptionLog.create({
      data: { userId: id, action: 'extend', plan: 'FREE', startDate: new Date(), endDate: newTrialEnd, note: `Extended ${days} days by admin ${admin.email}` },
    });
    await createAuditLog({
      adminId: admin.adminId, action: 'subscription.extend_trial', targetType: 'user', targetId: id, targetUserId: id,
      oldValue: { trialEndsAt: user.trialEndsAt }, newValue: { trialEndsAt: newTrialEnd, days },
      ...getClientInfo(req),
    });
    res.json({ success: true, data: { trialEndsAt: newTrialEnd } });
  } catch (err) {
    console.error('Extend trial error:', err);
    res.status(500).json({ success: false, error: 'Failed to extend trial' });
  }
});

// POST /api/admin/users/:id/activate-premium
router.post('/:id/activate-premium', requirePermission('manage_subscriptions'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { days = 30, plan = 'PREMIUM' } = req.body;
    const admin = (req as any).admin;
    const user = await prisma.user.findUnique({ where: { id }, select: { plan: true, subscriptionStatus: true, premiumExpiresAt: true } });
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    const isLifetime = plan === 'LIFETIME';
    const start = new Date();
    const expiry = isLifetime ? new Date('2099-12-31') : new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id },
      data: { plan, subscriptionStatus: 'ACTIVE', premiumStartedAt: start, premiumExpiresAt: expiry },
    });
    await prisma.subscriptionLog.create({
      data: { userId: id, action: 'premium_activate', plan, startDate: start, endDate: expiry, note: `Activated by admin ${admin.email}` },
    });
    await createAuditLog({
      adminId: admin.adminId, action: 'subscription.activate', targetType: 'user', targetId: id, targetUserId: id,
      oldValue: { plan: user.plan, status: user.subscriptionStatus }, newValue: { plan, premiumExpiresAt: expiry },
      ...getClientInfo(req),
    });
    res.json({ success: true, data: { plan, premiumExpiresAt: expiry } });
  } catch (err) {
    console.error('Activate premium error:', err);
    res.status(500).json({ success: false, error: 'Failed to activate premium' });
  }
});

// POST /api/admin/users/:id/expire  — immediately expire trial or premium
router.post('/:id/expire', requirePermission('manage_subscriptions'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = (req as any).admin;
    const user = await prisma.user.findUnique({ where: { id }, select: { plan: true, subscriptionStatus: true, trialEndsAt: true, premiumExpiresAt: true } });
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    const now = new Date();
    const updateData: any = { subscriptionStatus: 'EXPIRED' };
    if (user.plan === 'FREE') updateData.trialEndsAt = now;
    else updateData.premiumExpiresAt = now;
    await prisma.user.update({ where: { id }, data: updateData });
    await prisma.subscriptionLog.create({
      data: { userId: id, action: 'cancel', plan: user.plan, note: `Manually expired by admin ${admin.email}` },
    });
    await createAuditLog({
      adminId: admin.adminId, action: 'subscription.expire', targetType: 'user', targetId: id, targetUserId: id,
      oldValue: { plan: user.plan, status: user.subscriptionStatus }, newValue: { subscriptionStatus: 'EXPIRED' },
      ...getClientInfo(req),
    });
    res.json({ success: true, message: 'Subscription expired' });
  } catch (err) {
    console.error('Expire subscription error:', err);
    res.status(500).json({ success: false, error: 'Failed to expire subscription' });
  }
});

// POST /api/admin/users/:id/downgrade
router.post('/:id/downgrade', requirePermission('manage_subscriptions'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = (req as any).admin;
    const user = await prisma.user.findUnique({ where: { id }, select: { plan: true, subscriptionStatus: true } });
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    await prisma.user.update({
      where: { id },
      data: { plan: 'FREE', subscriptionStatus: 'EXPIRED', premiumExpiresAt: new Date() },
    });
    await prisma.subscriptionLog.create({
      data: { userId: id, action: 'cancel', plan: 'FREE', note: `Downgraded by admin ${admin.email}` },
    });
    await createAuditLog({
      adminId: admin.adminId, action: 'subscription.downgrade', targetType: 'user', targetId: id, targetUserId: id,
      oldValue: { plan: user.plan, status: user.subscriptionStatus }, newValue: { plan: 'FREE' },
      ...getClientInfo(req),
    });
    res.json({ success: true, message: 'User downgraded to free' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to downgrade' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/:id', requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = (req as any).admin;
    if (admin.role !== 'SUPER_ADMIN' && admin.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only ADMIN+ can delete users' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id }, select: { firstName: true, telegramId: true } });
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    await prisma.user.delete({ where: { id } });
    await createAuditLog({
      adminId: admin.adminId, action: 'user.delete', targetType: 'user', targetId: id,
      oldValue: { firstName: user.firstName, telegramId: Number(user.telegramId) },
      ...getClientInfo(req),
    });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

export default router;
