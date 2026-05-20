import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT_AGENT';

export interface AdminPayload {
  adminId: string;
  email: string;
  role: AdminRole;
  permissions: string[];
}

const ADMIN_JWT_SECRET = () => process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET!;

export function generateAdminJWT(payload: AdminPayload): string {
  return jwt.sign(payload, ADMIN_JWT_SECRET(), {
    expiresIn: (process.env.ADMIN_JWT_EXPIRES_IN || '12h') as jwt.SignOptions['expiresIn'],
  });
}

export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Admin token required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET()) as AdminPayload;
    (req as any).admin = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired admin token' });
  }
}

// Role hierarchy: SUPER_ADMIN > ADMIN > MODERATOR > SUPPORT_AGENT
const ROLE_RANK: Record<AdminRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  MODERATOR: 2,
  SUPPORT_AGENT: 1,
};

export function requireRole(...roles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const admin = (req as any).admin as AdminPayload;
    if (!admin) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    const minRank = Math.min(...roles.map(r => ROLE_RANK[r]));
    if (ROLE_RANK[admin.role] < minRank) {
      res.status(403).json({ success: false, error: 'Insufficient role' });
      return;
    }
    next();
  };
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const admin = (req as any).admin as AdminPayload;
    if (!admin) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    // SUPER_ADMIN bypasses all permission checks
    if (admin.role === 'SUPER_ADMIN') { next(); return; }
    if (!admin.permissions.includes(permission)) {
      res.status(403).json({ success: false, error: `Permission required: ${permission}` });
      return;
    }
    next();
  };
}
