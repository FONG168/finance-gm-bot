import { prisma } from '../lib/prisma';

interface AuditParams {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetUserId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        targetUserId: params.targetUserId,
        oldValue: params.oldValue ? (params.oldValue as any) : undefined,
        newValue: params.newValue ? (params.newValue as any) : undefined,
        metadata: params.metadata ? (params.metadata as any) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    // Audit log failures should never crash the main operation
    console.error('Audit log write failed:', err);
  }
}

export function getClientInfo(req: any) {
  return {
    ipAddress: req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  };
}
