import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { generateAdminJWT, authenticateAdmin } from '../../middleware/adminAuth';
import { createAuditLog, getClientInfo } from '../../services/audit.service';

const router = Router();

// POST /api/admin/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password required' });
      return;
    }

    const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!admin || !admin.isActive) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateAdminJWT({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    });

    await createAuditLog({
      adminId: admin.id,
      action: 'admin.login',
      targetType: 'admin',
      targetId: admin.id,
      ...getClientInfo(req),
    });

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          permissions: admin.permissions,
        },
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// GET /api/admin/auth/me
router.get('/me', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { adminId } = (req as any).admin;
    const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin) {
      res.status(404).json({ success: false, error: 'Admin not found' });
      return;
    }
    res.json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        permissions: admin.permissions,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get admin profile' });
  }
});

// POST /api/admin/auth/create-admin (SUPER_ADMIN only — first-time setup uses env seed)
router.post('/create-admin', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const caller = (req as any).admin;
    if (caller.role !== 'SUPER_ADMIN') {
      res.status(403).json({ success: false, error: 'Only SUPER_ADMIN can create admins' });
      return;
    }
    const { email, password, firstName, lastName, role, permissions } = req.body;
    if (!email || !password || !firstName) {
      res.status(400).json({ success: false, error: 'email, password, firstName required' });
      return;
    }
    const existing = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.adminUser.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role: role || 'SUPPORT_AGENT',
        permissions: permissions || [],
        createdById: caller.adminId,
      },
    });
    await createAuditLog({
      adminId: caller.adminId,
      action: 'admin.create',
      targetType: 'admin',
      targetId: admin.id,
      newValue: { email: admin.email, role: admin.role },
      ...getClientInfo(req),
    });
    res.status(201).json({
      success: true,
      data: { id: admin.id, email: admin.email, role: admin.role },
    });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ success: false, error: 'Failed to create admin' });
  }
});

// POST /api/admin/auth/seed — one-time SUPER_ADMIN bootstrap (requires ADMIN_SEED_KEY)
router.post('/seed', async (req: Request, res: Response) => {
  try {
    const { seedKey, email, password, firstName } = req.body;
    if (!seedKey || seedKey !== process.env.ADMIN_SEED_KEY) {
      res.status(403).json({ success: false, error: 'Invalid seed key' });
      return;
    }
    const existing = await prisma.adminUser.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (existing) {
      res.status(409).json({ success: false, error: 'SUPER_ADMIN already exists' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.adminUser.create({
      data: { email: email.toLowerCase(), passwordHash, firstName, role: 'SUPER_ADMIN', permissions: [] },
    });
    res.status(201).json({ success: true, data: { id: admin.id, email: admin.email } });
  } catch (err) {
    console.error('Seed admin error:', err);
    res.status(500).json({ success: false, error: 'Seed failed' });
  }
});

export default router;
