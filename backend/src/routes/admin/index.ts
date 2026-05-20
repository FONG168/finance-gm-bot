import { Router } from 'express';
import authRoutes from './auth';
import dashboardRoutes from './dashboard';
import usersRoutes from './users';
import paymentsRoutes from './payments';
import qrCodesRoutes from './qrcodes';
import announcementsRoutes from './announcements';
import auditLogsRoutes from './auditlogs';
import settingsRoutes from './settings';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/qr-codes', qrCodesRoutes);
router.use('/announcements', announcementsRoutes);
router.use('/audit-logs', auditLogsRoutes);
router.use('/settings', settingsRoutes);

export default router;
