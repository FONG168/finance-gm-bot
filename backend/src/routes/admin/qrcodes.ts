import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth';
import { createAuditLog, getClientInfo } from '../../services/audit.service';

const router = Router();
router.use(authenticateAdmin);

// GET /api/admin/qr-codes
router.get('/', async (_req: Request, res: Response) => {
  try {
    const qrCodes = await prisma.qRCode.findMany({ orderBy: { provider: 'asc' } });
    res.json({ success: true, data: qrCodes });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch QR codes' });
  }
});

// PUT /api/admin/qr-codes/:provider — upsert a QR code
router.put('/:provider', requirePermission('manage_settings'), async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { imageUrl, accountName, accountNumber, instructions, isActive } = req.body;
    const admin = (req as any).admin;

    const validProviders = ['ABA', 'ACLEDA', 'WING', 'KHQR'];
    if (!validProviders.includes(provider)) {
      res.status(400).json({ success: false, error: 'Invalid provider' });
      return;
    }
    if (!imageUrl) {
      res.status(400).json({ success: false, error: 'imageUrl is required' });
      return;
    }

    const existing = await prisma.qRCode.findUnique({ where: { provider: provider as any } });

    const qrCode = await prisma.qRCode.upsert({
      where: { provider: provider as any },
      create: { provider: provider as any, imageUrl, accountName, accountNumber, instructions, isActive: isActive ?? true, uploadedById: admin.adminId },
      update: { imageUrl, accountName, accountNumber, instructions, ...(isActive !== undefined ? { isActive } : {}), uploadedById: admin.adminId },
    });

    await createAuditLog({
      adminId: admin.adminId, action: 'qrcode.update', targetType: 'qrcode', targetId: qrCode.id,
      oldValue: existing ? { imageUrl: existing.imageUrl } : null,
      newValue: { provider, imageUrl },
      ...getClientInfo(req),
    });

    res.json({ success: true, data: qrCode });
  } catch (err) {
    console.error('Update QR code error:', err);
    res.status(500).json({ success: false, error: 'Failed to update QR code' });
  }
});

// DELETE /api/admin/qr-codes/:provider
router.delete('/:provider', requirePermission('manage_settings'), async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const admin = (req as any).admin;
    await prisma.qRCode.delete({ where: { provider: provider as any } });
    await createAuditLog({
      adminId: admin.adminId, action: 'qrcode.delete', targetType: 'qrcode',
      newValue: { provider }, ...getClientInfo(req),
    });
    res.json({ success: true, message: 'QR code deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete QR code' });
  }
});

export default router;
