import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth';
import { createAuditLog, getClientInfo } from '../../services/audit.service';

const router = Router();
router.use(authenticateAdmin);

// GET /api/admin/settings
router.get('/', requirePermission('manage_settings'), async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const map: Record<string, any> = {};
    for (const s of settings) map[s.key] = s.value;
    res.json({ success: true, data: map });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// PUT /api/admin/settings/:key
router.put('/:key', requirePermission('manage_settings'), async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const admin = (req as any).admin;
    if (value === undefined) {
      res.status(400).json({ success: false, error: 'value is required' });
      return;
    }
    const existing = await prisma.systemSetting.findUnique({ where: { key } });
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    await createAuditLog({
      adminId: admin.adminId, action: 'setting.update', targetType: 'setting', targetId: key,
      oldValue: existing?.value, newValue: value, ...getClientInfo(req),
    });
    res.json({ success: true, data: setting });
  } catch (err) {
    console.error('Update setting error:', err);
    res.status(500).json({ success: false, error: 'Failed to update setting' });
  }
});

// GET /api/admin/admins — list admin users (SUPER_ADMIN only)
router.get('/admins/list', requirePermission('manage_roles'), async (_req: Request, res: Response) => {
  try {
    const admins = await prisma.adminUser.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, permissions: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: admins });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch admins' });
  }
});

// PUT /api/admin/admins/:id/permissions (SUPER_ADMIN only)
router.put('/admins/:id/permissions', requirePermission('manage_roles'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions, role } = req.body;
    const admin = (req as any).admin;
    if (admin.role !== 'SUPER_ADMIN') {
      res.status(403).json({ success: false, error: 'Only SUPER_ADMIN can modify permissions' });
      return;
    }
    const updated = await prisma.adminUser.update({
      where: { id },
      data: { ...(permissions ? { permissions } : {}), ...(role ? { role } : {}) },
    });
    await createAuditLog({
      adminId: admin.adminId, action: 'admin.update_permissions', targetType: 'admin', targetId: id,
      newValue: { permissions, role }, ...getClientInfo(req),
    });
    res.json({ success: true, data: { id: updated.id, role: updated.role, permissions: updated.permissions } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update permissions' });
  }
});

export default router;
