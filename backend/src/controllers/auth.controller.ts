import { Request, Response } from 'express';
import { validateTelegramInitData, generateJWT } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { CATEGORIES } from '../shared/types';

export async function telegramAuth(req: Request, res: Response): Promise<void> {
  try {
    const { initData } = req.body;

    if (!initData) {
      res.status(400).json({ success: false, error: 'initData is required' });
      return;
    }

    const botToken = process.env.BOT_TOKEN!;

    // Skip HMAC validation only in local development (outside Telegram)
    const isValid =
      process.env.NODE_ENV === 'development'
        ? true
        : validateTelegramInitData(initData, botToken);

    if (!isValid) {
      console.error('[Auth] HMAC validation failed. initData preview:', initData.substring(0, 80));
      res.status(401).json({ success: false, error: 'Invalid Telegram authentication data' });
      return;
    }

    const params = new URLSearchParams(initData);
    const userRaw = params.get('user');

    if (!userRaw) {
      res.status(400).json({ success: false, error: 'User data not found in initData' });
      return;
    }

    const telegramUser = JSON.parse(userRaw);

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(telegramUser.id) },
      update: {
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name || null,
        username: telegramUser.username || null,
        photoUrl: telegramUser.photo_url || null,
        languageCode: telegramUser.language_code || null,
      },
      create: {
        telegramId: BigInt(telegramUser.id),
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name || null,
        username: telegramUser.username || null,
        photoUrl: telegramUser.photo_url || null,
        languageCode: telegramUser.language_code || null,
      },
    });

    // Seed categories and default account
    await seedCategories();
    await seedDefaultAccount(user.id);

    const token = generateJWT({
      userId: user.id,
      telegramId: Number(user.telegramId),
      firstName: user.firstName,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          telegramId: Number(user.telegramId),
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          photoUrl: user.photoUrl,
          currency: user.currency,
          timezone: user.timezone,
          plan: user.plan,
          subscriptionStatus: user.subscriptionStatus,
          trialEndsAt: user.trialEndsAt,
          premiumStartedAt: user.premiumStartedAt,
          premiumExpiresAt: user.premiumExpiresAt,
        },
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
}

async function seedDefaultAccount(userId: string): Promise<void> {
  const existing = await prisma.account.findFirst({ where: { userId, isDefault: true } });
  if (!existing) {
    await prisma.account.create({
      data: {
        userId,
        name: 'Cash on Hand',
        type: 'cash',
        balance: 0,
        currency: 'USD',
        color: '#10b981',
        icon: '💵',
        isDefault: true,
      },
    });
  }
}

async function seedCategories(): Promise<void> {
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { label: cat.label, icon: cat.icon, color: cat.color, type: cat.type },
      create: { id: cat.id, name: cat.name, label: cat.label, icon: cat.icon, color: cat.color, type: cat.type },
    });
  }
}
