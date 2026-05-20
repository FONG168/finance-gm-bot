import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';

export async function getWeeklyAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { date } = req.query;

    const summary = await analyticsService.getWeeklySummary(
      userId,
      date ? new Date(date as string) : undefined,
    );

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Weekly analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch weekly analytics' });
  }
}

export async function getMonthlyAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { month, year } = req.query;

    const summary = await analyticsService.getMonthlySummary(
      userId,
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined,
    );

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Monthly analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch monthly analytics' });
  }
}

export async function getAccountSummary(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const summary = await analyticsService.getAccountSummary(userId);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Account summary error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch account summary' });
  }
}

export async function getReports(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { type = 'monthly', count = '3' } = req.query;
    const countNum = Math.min(parseInt(count as string), 12);

    if (type === 'weekly') {
      const reports = [];
      const now = new Date();
      for (let i = 0; i < countNum; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 7);
        reports.push(await analyticsService.getWeeklySummary(userId, date));
      }
      res.json({ success: true, data: reports });
    } else {
      const reports = [];
      const now = new Date();
      for (let i = 0; i < countNum; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        reports.push(
          await analyticsService.getMonthlySummary(userId, date.getMonth() + 1, date.getFullYear()),
        );
      }
      res.json({ success: true, data: reports });
    }
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
}
