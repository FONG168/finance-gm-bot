<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Account;
use App\Models\Transaction;
use App\Models\Category;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class AccountController extends Controller
{
    private const ACCOUNT_ICONS = [
        'cash' => '💵',
        'bank' => '🏦',
        'ewallet' => '📱',
        'savings' => '🏧',
        'credit' => '💳',
    ];

    private const ACCOUNT_COLORS = [
        'cash' => '#10b981',
        'bank' => '#3b82f6',
        'ewallet' => '#8b5cf6',
        'savings' => '#f59e0b',
        'credit' => '#ef4444',
    ];

    private function serializeAccount(Account $a)
    {
        return [
            'id' => $a->id,
            'userId' => $a->user_id,
            'name' => $a->name,
            'type' => $a->type,
            'balance' => (float) $a->balance,
            'currency' => $a->currency,
            'color' => $a->color,
            'icon' => $a->icon,
            'isArchived' => $a->is_archived,
            'isDefault' => $a->is_default,
            'createdAt' => $a->created_at->toIso8601String(),
            'updatedAt' => $a->updated_at->toIso8601String(),
        ];
    }

    private function serializeTransaction(Transaction $t)
    {
        return [
            'id' => $t->id,
            'userId' => $t->user_id,
            'accountId' => $t->account_id,
            'account' => $t->account ? [
                'id' => $t->account->id,
                'name' => $t->account->name,
                'type' => $t->account->type,
                'balance' => (float) $t->account->balance,
                'currency' => $t->account->currency,
                'color' => $t->account->color,
                'icon' => $t->account->icon,
                'isDefault' => $t->account->is_default,
            ] : null,
            'amount' => (float) $t->amount,
            'type' => $t->type,
            'categoryId' => $t->category_id,
            'category' => $t->category ? [
                'id' => $t->category->id,
                'name' => $t->category->name,
                'label' => $t->category->label,
                'icon' => $t->category->icon,
                'color' => $t->category->color,
                'type' => $t->category->type,
            ] : null,
            'note' => $t->note,
            'transferId' => $t->transfer_id,
            'date' => $t->date->toIso8601String(),
            'createdAt' => $t->created_at->toIso8601String(),
            'updatedAt' => $t->updated_at->toIso8601String(),
        ];
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $accounts = Account::where('user_id', $user->id)
            ->where('is_archived', false)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'asc')
            ->get();

        $totalAssets = $accounts->sum(fn($a) => (float) $a->balance);

        return response()->json([
            'success' => true,
            'data' => [
                'accounts' => $accounts->map(fn($a) => $this->serializeAccount($a)),
                'totalAssets' => $totalAssets,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|min:1|max:50',
            'type' => 'required|in:cash,bank,ewallet,savings,credit',
            'balance' => 'nullable|numeric',
            'currency' => 'nullable|string',
            'color' => 'nullable|string',
            'icon' => 'nullable|string'
        ]);

        $name = $request->input('name');
        $type = $request->input('type');
        $balance = (float) $request->input('balance', 0);
        $currency = $request->input('currency', 'USD');
        $color = $request->input('color');
        $icon = $request->input('icon');

        $account = Account::create([
            'id' => Str::random(24),
            'user_id' => $user->id,
            'name' => $name,
            'type' => $type,
            'balance' => $balance,
            'currency' => $currency,
            'color' => $color ?: (self::ACCOUNT_COLORS[$type] ?? '#7c3aed'),
            'icon' => $icon ?: (self::ACCOUNT_ICONS[$type] ?? '💰')
        ]);

        return response()->json(['success' => true, 'data' => $this->serializeAccount($account)], 201);
    }

    public function update(Request $request, string $id)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'nullable|string|min:1|max:50',
            'type' => 'nullable|in:cash,bank,ewallet,savings,credit',
            'color' => 'nullable|string',
            'icon' => 'nullable|string',
            'isArchived' => 'nullable|boolean'
        ]);

        $account = Account::where('id', $id)->where('user_id', $user->id)->first();
        if (!$account) {
            return response()->json(['success' => false, 'error' => 'Account not found'], 404);
        }

        $data = [];
        if ($request->has('name')) $data['name'] = $request->input('name');
        if ($request->has('type')) $data['type'] = $request->input('type');
        if ($request->has('color')) $data['color'] = $request->input('color');
        if ($request->has('icon')) $data['icon'] = $request->input('icon');
        if ($request->has('isArchived')) $data['is_archived'] = $request->input('isArchived');

        $account->update($data);

        return response()->json(['success' => true, 'data' => $this->serializeAccount($account)]);
    }

    public function destroy(Request $request, string $id)
    {
        $user = $request->user();

        $account = Account::where('id', $id)->where('user_id', $user->id)->first();
        if (!$account) {
            return response()->json(['success' => false, 'error' => 'Account not found'], 404);
        }

        if ($account->is_default) {
            return response()->json(['success' => false, 'error' => 'Cannot delete the default account'], 400);
        }

        DB::transaction(function () use ($id) {
            // Detach transactions instead of deleting them
            Transaction::where('account_id', $id)->update(['account_id' => null]);
            Account::where('id', $id)->delete();
        });

        return response()->json(['success' => true, 'message' => 'Account deleted']);
    }

    public function getAccountTransactions(Request $request, string $id)
    {
        $user = $request->user();
        $page = (int) $request->query('page', 1);
        $limit = (int) $request->query('limit', 20);
        $skip = ($page - 1) * $limit;

        $account = Account::where('id', $id)->where('user_id', $user->id)->first();
        if (!$account) {
            return response()->json(['success' => false, 'error' => 'Account not found'], 404);
        }

        $transactions = Transaction::where('account_id', $id)
            ->where('user_id', $user->id)
            ->with(['category', 'account'])
            ->orderBy('date', 'desc')
            ->skip($skip)
            ->take($limit)
            ->get();

        $total = Transaction::where('account_id', $id)->where('user_id', $user->id)->count();

        $incomeSum = Transaction::where('account_id', $id)->where('user_id', $user->id)->where('type', 'income')->sum('amount');
        $expenseSum = Transaction::where('account_id', $id)->where('user_id', $user->id)->where('type', 'expense')->sum('amount');
        $transferInSum = Transaction::where('account_id', $id)->where('user_id', $user->id)->where('type', 'transfer')->where('note', 'like', 'Transfer from%')->sum('amount');

        $incomingTransferIds = [];
        foreach ($transactions as $tx) {
            if ($tx->type === 'transfer' && $tx->transfer_id && str_starts_with($tx->note ?? '', 'Transfer from')) {
                $incomingTransferIds[] = $tx->transfer_id;
            }
        }
        $incomingTransferIds = array_unique($incomingTransferIds);

        $serialized = $transactions->map(function ($t) use ($incomingTransferIds) {
            $base = $this->serializeTransaction($t);
            if ($t->type === 'transfer' && $t->transfer_id) {
                $base['transferDirection'] = in_array($t->transfer_id, $incomingTransferIds) ? 'in' : 'out';
            }
            return $base;
        });

        $totalIncome = (float) $incomeSum + (float) $transferInSum;
        $totalExpense = (float) $expenseSum;

        return response()->json([
            'success' => true,
            'data' => [
                'account' => $this->serializeAccount($account),
                'data' => $serialized,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'hasMore' => $skip + $limit < $total,
                'totalIncome' => $totalIncome,
                'totalExpense' => $totalExpense,
            ]
        ]);
    }

    public function transferBetweenAccounts(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'fromAccountId' => 'required|string',
            'toAccountId' => 'required|string',
            'amount' => 'required|numeric|gt:0',
            'note' => 'nullable|string',
            'date' => 'nullable|string'
        ]);

        $fromAccountId = $request->input('fromAccountId');
        $toAccountId = $request->input('toAccountId');
        $amount = (float) $request->input('amount');
        $note = $request->input('note');
        $date = $request->input('date');

        if ($fromAccountId === $toAccountId) {
            return response()->json(['success' => false, 'error' => 'Cannot transfer to the same account'], 400);
        }

        $from = Account::where('id', $fromAccountId)->where('user_id', $user->id)->first();
        $to = Account::where('id', $toAccountId)->where('user_id', $user->id)->first();

        if (!$from || !$to) {
            return response()->json(['success' => false, 'error' => 'Account not found'], 404);
        }

        if ((float) $from->balance < $amount) {
            return response()->json(['success' => false, 'error' => 'Insufficient balance'], 400);
        }

        $transferId = 'trf_' . time();
        $txDate = $date ? new \DateTime($date) : now();

        $transferCategory = Category::where('name', 'transfer')->first();
        if (!$transferCategory) {
            $transferCategory = Category::create([
                'id' => 'transfer',
                'name' => 'transfer',
                'label' => 'Transfer',
                'icon' => '↔️',
                'color' => '#6366f1',
                'type' => 'both'
            ]);
        }

        DB::transaction(function () use ($user, $fromAccountId, $toAccountId, $amount, $note, $txDate, $transferId, $transferCategory, $from, $to) {
            // Debit from source
            Transaction::create([
                'id' => Str::random(24),
                'user_id' => $user->id,
                'account_id' => $fromAccountId,
                'amount' => $amount,
                'type' => 'transfer',
                'category_id' => $transferCategory->id,
                'note' => $note ?: "Transfer to {$to->name}",
                'transfer_id' => $transferId,
                'date' => $txDate
            ]);

            // Credit to destination
            Transaction::create([
                'id' => Str::random(24),
                'user_id' => $user->id,
                'account_id' => $toAccountId,
                'amount' => $amount,
                'type' => 'transfer',
                'category_id' => $transferCategory->id,
                'note' => $note ?: "Transfer from {$from->name}",
                'transfer_id' => $transferId,
                'date' => $txDate
            ]);

            // Update balances
            Account::where('id', $fromAccountId)->decrement('balance', $amount);
            Account::where('id', $toAccountId)->increment('balance', $amount);
        });

        $updatedFrom = Account::find($fromAccountId);
        $updatedTo = Account::find($toAccountId);

        return response()->json([
            'success' => true,
            'data' => [
                'fromAccount' => $this->serializeAccount($updatedFrom),
                'toAccount' => $this->serializeAccount($updatedTo)
            ]
        ]);
    }
}
