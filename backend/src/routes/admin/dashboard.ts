import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth';

const router = Router();
router.use(authenticateAdmin);

// GET /api/admin/dashboard/stats
router.get('/stats', requirePermission('view_reports'), async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      trialUsers,
      expiredUsers,
      suspendedUsers,
      pendingPayments,
      newUsersThisMonth,
      newUsersLastMonth,
      approvedPaymentsThisMonth,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true, isBanned: false, isSuspended: false } }),
      prisma.user.count({ where: { plan: 'PREMIUM', subscriptionStatus: 'ACTIVE' } }),
      prisma.user.count({ where: { subscriptionStatus: 'TRIAL' } }),
      prisma.user.count({ where: { subscriptionStatus: 'EXPIRED' } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.paymentRequest.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.paymentRequest.findMany({
        where: { status: 'APPROVED', reviewedAt: { gte: startOfMonth } },
        select: { amount: true },
      }),
      prisma.paymentRequest.findMany({
        where: { status: 'APPROVED' },
        select: { amount: true },
      }),
    ]);

    const revenueThisMonth = approvedPaymentsThisMonth.reduce(
      (sum, p) => sum + Number(p.amount), 0
    );
    const revenueTotal = totalRevenue.reduce((sum, p) => sum + Number(p.amount), 0);

    // Monthly user growth for chart (last 6 months)
    const monthlyGrowth = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        return prisma.user.count({ where: { createdAt: { gte: d, lte: end } } }).then(count => ({
          month: d.toLocaleString('default', { month: 'short' }),
          users: count,
        }));
      })
    );

    // Monthly revenue chart (last 6 months)
    const monthlyRevenue = await Promise.all(
      Array.from({ length: 6 }, async (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const payments = await prisma.paymentRequest.findMany({
          where: { status: 'APPROVED', reviewedAt: { gte: d, lte: end } },
          select: { amount: true },
        });
        return {
          month: d.toLocaleString('default', { month: 'short' }),
          revenue: payments.reduce((sum, p) => sum + Number(p.amount), 0),
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          premium: premiumUsers,
          trial: trialUsers,
          expired: expiredUsers,
          suspended: suspendedUsers,
          newThisMonth: newUsersThisMonth,
          newLastMonth: newUsersLastMonth,
        },
        payments: { pending: pendingPayments },
        revenue: { thisMonth: revenueThisMonth, total: revenueTotal },
        charts: { monthlyGrowth, monthlyRevenue },
      },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to load stats' });
  }
});

// GET /api/admin/dashboard/recent-activity
router.get('/recent-activity', requirePermission('view_reports'), async (_req: Request, res: Response) => {
  try {
    const [recentUsers, recentPayments, recentLogs] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, firstName: true, lastName: true, username: true, createdAt: true, plan: true },
      }),
      prisma.paymentRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { firstName: true, username: true } } },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { admin: { select: { firstName: true, email: true } } },
      }),
    ]);

    res.json({ success: true, data: { recentUsers, recentPayments, recentLogs } });
  } catch (err) {
    console.error('Recent activity error:', err);
    res.status(500).json({ success: false, error: 'Failed to load activity' });
  }
});

export default router;
