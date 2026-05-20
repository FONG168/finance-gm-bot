import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth';

const router = Router();
router.use(authenticateAdmin);

// GET /api/admin/audit-logs
router.get('/', requirePermission('view_reports'), async (req: Request, res: Response) => {
  try {
    const { action, adminId, targetUserId, page = '1', limit = '50' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (adminId) where.adminId = adminId;
    if (targetUserId) where.targetUserId = targetUserId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { id: true, firstName: true, email: true, role: true } },
          targetUser: { select: { id: true, firstName: true, username: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: { logs, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } },
    });
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

export default router;
