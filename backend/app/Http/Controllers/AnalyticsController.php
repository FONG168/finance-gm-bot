<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\Account;
use App\Models\WeeklyReport;
use App\Models\MonthlyReport;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    private function startOfWeek(Carbon $date): Carbon
    {
        return $date->copy()->startOfWeek(Carbon::MONDAY);
    }

    private function endOfWeek(Carbon $date): Carbon
    {
        return $date->copy()->endOfWeek(Carbon::SUNDAY);
    }

    private function startOfMonth(int $year, int $month): Carbon
    {
        return Carbon::create($year, $month, 1, 0, 0, 0);
    }

    private function endOfMonth(int $year, int $month): Carbon
    {
        return Carbon::create($year, $month, 1, 23, 59, 59)->endOfMonth();
    }

    private function buildCategoryBreakdown($expenseTransactions, float $total): array
    {
        $categoryMap = [];

        foreach ($expenseTransactions as $t) {
            $cat = $t->category;
            if (!$cat) continue;

            if (!isset($categoryMap[$cat->id])) {
                $categoryMap[$cat->id] = [
                    'categoryId' => $cat->id,
                    'categoryName' => $cat->name,
                    'label' => $cat->label,
                    'icon' => $cat->icon,
                    'color' => $cat->color,
                    'amount' => 0.00,
                    'percentage' => 0.00,
                    'transactionCount' => 0
                ];
            }
            $categoryMap[$cat->id]['amount'] += (float) $t->amount;
            $categoryMap[$cat->id]['transactionCount']++;
        }

        $result = array_values($categoryMap);
        foreach ($result as &$entry) {
            $entry['percentage'] = $total > 0 ? round(($entry['amount'] / $total) * 100, 1) : 0;
        }

        // Sort by amount descending
        usort($result, fn($a, $b) => $b['amount'] <=> $a['amount']);

        return $result;
    }

    private function buildWeeklyTrends($transactions, Carbon $monthStart, Carbon $monthEnd): array
    {
        $weeks = [];
        $current = $monthStart->copy();
        $weekNumber = 1;

        while ($current <= $monthEnd) {
            $wStart = $current->copy();
            $wEnd = $current->copy()->addDays(6);
            if ($wEnd > $monthEnd) {
                $wEnd = $monthEnd->copy();
            }

            // Filter transactions in this week range
            $weekTransactions = $transactions->filter(function ($t) use ($wStart, $wEnd) {
                $txDate = Carbon::instance($t->date);
                return $txDate >= $wStart && $txDate <= $wEnd;
            });

            $income = $weekTransactions->where('type', 'income')->sum(fn($t) => (float)$t->amount);
            $expenses = $weekTransactions->where('type', 'expense')->sum(fn($t) => (float)$t->amount);

            $weeks[] = [
                'weekNumber' => $weekNumber,
                'weekStart' => $wStart->toIso8601String(),
                'income' => (float) $income,
                'expenses' => (float) $expenses,
            ];

            $current->addDays(7);
            $weekNumber++;
        }

        return $weeks;
    }

    public function getWeeklyAnalytics(Request $request)
    {
        $user = $request->user();
        $dateParam = $request->query('date');
        $now = $dateParam ? Carbon::parse($dateParam) : Carbon::now();

        $weekStart = $this->startOfWeek($now);
        $weekEnd = $this->endOfWeek($now);

        $transactions = Transaction::where('user_id', $user->id)
            ->where('date', '>=', $weekStart)
            ->where('date', '<=', $weekEnd)
            ->with('category')
            ->get();

        $totalIncome = $transactions->where('type', 'income')->sum(fn($t) => (float)$t->amount);
        $totalExpenses = $transactions->where('type', 'expense')->sum(fn($t) => (float)$t->amount);
        $netBalance = $totalIncome - $totalExpenses;
        $savingsRate = $totalIncome > 0 ? (($totalIncome - $totalExpenses) / $totalIncome) * 100 : 0;

        $categoryBreakdown = $this->buildCategoryBreakdown(
            $transactions->where('type', 'expense'),
            $totalExpenses
        );

        $topCategory = count($categoryBreakdown) > 0 ? $categoryBreakdown[0]['label'] : 'None';

        return response()->json([
            'success' => true,
            'data' => [
                'weekStart' => $weekStart->toIso8601String(),
                'weekEnd' => $weekEnd->toIso8601String(),
                'totalIncome' => (float) $totalIncome,
                'totalExpenses' => (float) $totalExpenses,
                'netBalance' => (float) $netBalance,
                'savingsRate' => round($savingsRate, 1),
                'topCategory' => $topCategory,
                'transactionCount' => $transactions->count(),
                'categoryBreakdown' => $categoryBreakdown,
            ]
        ]);
    }

    public function getMonthlyAnalytics(Request $request)
    {
        $user = $request->user();
        $month = $request->query('month');
        $year = $request->query('year');

        $now = Carbon::now();
        $targetMonth = $month ? (int)$month : (int)$now->format('m');
        $targetYear = $year ? (int)$year : (int)$now->format('Y');

        $monthStart = $this->startOfMonth($targetYear, $targetMonth);
        $monthEnd = $this->endOfMonth($targetYear, $targetMonth);

        $transactions = Transaction::where('user_id', $user->id)
            ->where('date', '>=', $monthStart)
            ->where('date', '<=', $monthEnd)
            ->with('category')
            ->orderBy('date', 'asc')
            ->get();

        $totalIncome = $transactions->where('type', 'income')->sum(fn($t) => (float)$t->amount);
        $totalExpenses = $transactions->where('type', 'expense')->sum(fn($t) => (float)$t->amount);
        $netBalance = $totalIncome - $totalExpenses;
        $savingsRate = $totalIncome > 0 ? (($totalIncome - $totalExpenses) / $totalIncome) * 100 : 0;

        $categoryBreakdown = $this->buildCategoryBreakdown(
            $transactions->where('type', 'expense'),
            $totalExpenses
        );

        $weeklyTrends = $this->buildWeeklyTrends($transactions, $monthStart, $monthEnd);

        return response()->json([
            'success' => true,
            'data' => [
                'month' => $targetMonth,
                'year' => $targetYear,
                'totalIncome' => (float) $totalIncome,
                'totalExpenses' => (float) $totalExpenses,
                'netBalance' => (float) $netBalance,
                'savingsRate' => round($savingsRate, 1),
                'categoryBreakdown' => $categoryBreakdown,
                'weeklyTrends' => $weeklyTrends,
            ]
        ]);
    }

    public function getAccountSummary(Request $request)
    {
        $user = $request->user();

        $accounts = Account::where('user_id', $user->id)
            ->where('is_archived', false)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'asc')
            ->get();

        $byType = function ($type) use ($accounts) {
            return (float) $accounts->where('type', $type)->sum('balance');
        };

        return response()->json([
            'success' => true,
            'data' => [
                'totalAssets' => (float) $accounts->sum('balance'),
                'totalCash' => $byType('cash'),
                'totalBank' => $byType('bank'),
                'totalEwallet' => $byType('ewallet'),
                'totalSavings' => $byType('savings'),
                'accounts' => $accounts->map(function ($a) {
                    return [
                        'id' => $a->id,
                        'name' => $a->name,
                        'type' => $a->type,
                        'balance' => (float) $a->balance,
                        'currency' => $a->currency,
                        'color' => $a->color,
                        'icon' => $a->icon,
                        'isDefault' => $a->is_default,
                        'isArchived' => $a->is_archived,
                    ];
                })
            ]
        ]);
    }

    public function getReports(Request $request)
    {
        $user = $request->user();
        $type = $request->query('type', 'monthly');
        $count = min((int)$request->query('count', 3), 12);

        $reports = [];
        $now = Carbon::now();

        if ($type === 'weekly') {
            for ($i = 0; $i < $count; $i++) {
                $date = $now->copy()->subWeeks($i);
                
                $weekStart = $this->startOfWeek($date);
                $weekEnd = $this->endOfWeek($date);

                $transactions = Transaction::where('user_id', $user->id)
                    ->where('date', '>=', $weekStart)
                    ->where('date', '<=', $weekEnd)
                    ->with('category')
                    ->get();

                $totalIncome = $transactions->where('type', 'income')->sum(fn($t) => (float)$t->amount);
                $totalExpenses = $transactions->where('type', 'expense')->sum(fn($t) => (float)$t->amount);
                $netBalance = $totalIncome - $totalExpenses;
                $savingsRate = $totalIncome > 0 ? (($totalIncome - $totalExpenses) / $totalIncome) * 100 : 0;

                $categoryBreakdown = $this->buildCategoryBreakdown(
                    $transactions->where('type', 'expense'),
                    $totalExpenses
                );

                $topCategory = count($categoryBreakdown) > 0 ? $categoryBreakdown[0]['label'] : 'None';

                $reports[] = [
                    'weekStart' => $weekStart->toIso8601String(),
                    'weekEnd' => $weekEnd->toIso8601String(),
                    'totalIncome' => (float) $totalIncome,
                    'totalExpenses' => (float) $totalExpenses,
                    'netBalance' => (float) $netBalance,
                    'savingsRate' => round($savingsRate, 1),
                    'topCategory' => $topCategory,
                    'transactionCount' => $transactions->count(),
                    'categoryBreakdown' => $categoryBreakdown,
                ];
            }
        } else {
            for ($i = 0; $i < $count; $i++) {
                $date = $now->copy()->subMonths($i);
                
                $targetMonth = (int) $date->format('m');
                $targetYear = (int) $date->format('Y');

                $monthStart = $this->startOfMonth($targetYear, $targetMonth);
                $monthEnd = $this->endOfMonth($targetYear, $targetMonth);

                $transactions = Transaction::where('user_id', $user->id)
                    ->where('date', '>=', $monthStart)
                    ->where('date', '<=', $monthEnd)
                    ->with('category')
                    ->orderBy('date', 'asc')
                    ->get();

                $totalIncome = $transactions->where('type', 'income')->sum(fn($t) => (float)$t->amount);
                $totalExpenses = $transactions->where('type', 'expense')->sum(fn($t) => (float)$t->amount);
                $netBalance = $totalIncome - $totalExpenses;
                $savingsRate = $totalIncome > 0 ? (($totalIncome - $totalExpenses) / $totalIncome) * 100 : 0;

                $categoryBreakdown = $this->buildCategoryBreakdown(
                    $transactions->where('type', 'expense'),
                    $totalExpenses
                );

                $weeklyTrends = $this->buildWeeklyTrends($transactions, $monthStart, $monthEnd);

                $reports[] = [
                    'month' => $targetMonth,
                    'year' => $targetYear,
                    'totalIncome' => (float) $totalIncome,
                    'totalExpenses' => (float) $totalExpenses,
                    'netBalance' => (float) $netBalance,
                    'savingsRate' => round($savingsRate, 1),
                    'categoryBreakdown' => $categoryBreakdown,
                    'weeklyTrends' => $weeklyTrends,
                ];
            }
        }

        return response()->json(['success' => true, 'data' => $reports]);
    }
}
