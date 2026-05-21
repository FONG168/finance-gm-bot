import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

// Blocks write operations for users whose free trial has expired.
// Premium/Lifetime users are always allowed through.
export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payload = (req as any).user;
    if (!payload?.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { plan: true, subscriptionStatus: true, isBanned: true, isSuspended: true, premiumExpiresAt: true, trialEndsAt: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Banned or suspended users are always blocked
    if (user.isBanned) {
      res.status(403).json({ success: false, error: 'ACCOUNT_BANNED', message: 'Your account has been banned.' });
      return;
    }
    if (user.isSuspended) {
      res.status(403).json({ success: false, error: 'ACCOUNT_SUSPENDED', message: 'Your account is temporarily suspended.' });
      return;
    }

    // Lifetime users are always active
    if (user.plan === 'LIFETIME') { next(); return; }

    // Premium users: check if premium is still valid
    if (user.plan === 'PREMIUM') {
      if (user.premiumExpiresAt && user.premiumExpiresAt < new Date()) {
        res.status(403).json({
          success: false,
          error: 'SUBSCRIPTION_EXPIRED',
          message: 'Your premium subscription has expired. Please renew to continue recording transactions.',
        });
        return;
      }
      next();
      return;
    }

    // FREE plan users: auto-expire trial if time has passed
    if (user.subscriptionStatus === 'TRIAL' && user.trialEndsAt && user.trialEndsAt < new Date()) {
      await prisma.user.update({ where: { id: payload.userId }, data: { subscriptionStatus: 'EXPIRED' } });
      res.status(403).json({
        success: false,
        error: 'SUBSCRIPTION_EXPIRED',
        message: 'Your 14-day free trial has ended. Upgrade to Premium to keep recording transactions.',
      });
      return;
    }

    if (user.subscriptionStatus === 'EXPIRED') {
      res.status(403).json({
        success: false,
        error: 'SUBSCRIPTION_EXPIRED',
        message: 'Your free trial has ended. Upgrade to Premium to keep recording transactions.',
      });
      return;
    }

    // Trial still active or other status — allow
    next();
  } catch (err) {
    console.error('Subscription gate error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
