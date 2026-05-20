import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth';
import { createAuditLog, getClientInfo } from '../../services/audit.service';

const router = Router();
router.use(authenticateAdmin);

// GET /api/admin/announcements
router.get('/', requirePermission('manage_settings'), async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { firstName: true, email: true } } },
      }),
      prisma.announcement.count(),
    ]);
    res.json({ success: true, data: { announcements, pagination: { page: parseInt(page), limit: parseInt(limit), total } } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch announcements' });
  }
});

// POST /api/admin/announcements
router.post('/', requirePermission('manage_settings'), async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const { title, message, type, channel, targetUserIds, scheduledAt } = req.body;
    if (!title || !message) {
      res.status(400).json({ success: false, error: 'title and message are required' });
      return;
    }
    const announcement = await prisma.announcement.create({
      data: {
        title, message,
        type: type || 'GLOBAL',
        channel: channel || 'BOTH',
        targetUserIds: targetUserIds || [],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        createdById: admin.adminId,
      },
    });
    await createAuditLog({
      adminId: admin.adminId, action: 'announcement.create', targetType: 'announcement',
      targetId: announcement.id, newValue: { title, type, channel },
      ...getClientInfo(req),
    });
    res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ success: false, error: 'Failed to create announcement' });
  }
});

// DELETE /api/admin/announcements/:id
router.delete('/:id', requirePermission('manage_settings'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = (req as any).admin;
    await prisma.announcement.delete({ where: { id } });
    await createAuditLog({
      adminId: admin.adminId, action: 'announcement.delete', targetType: 'announcement', targetId: id,
      ...getClientInfo(req),
    });
    res.json({ success: true, message: 'Announcement deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete announcement' });
  }
});

export default router;
