<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\Account;
use App\Models\Category;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
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
        $page = (int) $request->query('page', 1);
        $limit = (int) $request->query('limit', 20);
        $skip = ($page - 1) * $limit;

        $type = $request->query('type');
        $categoryId = $request->query('categoryId');
        $accountId = $request->query('accountId');
        $startDate = $request->query('startDate');
        $endDate = $request->query('endDate');

        $query = Transaction::where('user_id', $user->id)
            ->with(['category', 'account']);

        if ($type) {
            $query->where('type', $type);
        }
        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }
        if ($accountId) {
            $query->where('account_id', $accountId);
        }
        if ($startDate) {
            $query->where('date', '>=', new \DateTime($startDate));
        }
        if ($endDate) {
            $query->where('date', '<=', new \DateTime($endDate));
        }

        $total = $query->count();
        $transactions = $query->orderBy('date', 'desc')
            ->skip($skip)
            ->take($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $transactions->map(fn($t) => $this->serializeTransaction($t)),
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'hasMore' => $skip + $limit < $total,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:income,expense',
            'categoryId' => 'required|string',
            'accountId' => 'nullable|string',
            'note' => 'nullable|string',
            'date' => 'nullable|string'
        ]);

        $amount = (float) $request->input('amount');
        $type = $request->input('type');
        $categoryId = $request->input('categoryId');
        $accountId = $request->input('accountId');
        $note = $request->input('note');
        $date = $request->input('date');

        $category = Category::find($categoryId);
        if (!$category) {
            return response()->json(['success' => false, 'error' => 'Invalid category'], 400);
        }

        $account = null;
        if ($accountId) {
            $account = Account::where('id', $accountId)->where('user_id', $user->id)->where('is_archived', false)->first();
            if (!$account) {
                return response()->json(['success' => false, 'error' => 'Invalid account'], 400);
            }
        } else {
            $account = Account::where('user_id', $user->id)->where('is_archived', false)->orderBy('is_default', 'desc')->orderBy('created_at', 'asc')->first();
            if (!$account) {
                return response()->json(['success' => false, 'error' => 'No account found. Please create a cash account first.'], 400);
            }
            $accountId = $account->id;
        }

        // Allow transaction recording regardless of account balance
        $balanceDelta = $type === 'income' ? $amount : -$amount;

        $transaction = DB::transaction(function () use ($user, $accountId, $amount, $type, $categoryId, $note, $date, $balanceDelta) {
            $t = Transaction::create([
                'id' => Str::random(24),
                'user_id' => $user->id,
                'account_id' => $accountId,
                'amount' => $amount,
                'type' => $type,
                'category_id' => $categoryId,
                'note' => $note,
                'date' => $date ? new \DateTime($date) : now()
            ]);

            Account::where('id', $accountId)->increment('balance', $balanceDelta);

            return $t;
        });

        // Reload relationships
        $transaction->load(['category', 'account']);

        return response()->json(['success' => true, 'data' => $this->serializeTransaction($transaction)], 201);
    }

    public function update(Request $request, string $id)
    {
        $user = $request->user();

        $request->validate([
            'amount' => 'nullable|numeric|min:0.01',
            'type' => 'nullable|in:income,expense',
            'categoryId' => 'nullable|string',
            'accountId' => 'nullable|string',
            'note' => 'nullable|string',
            'date' => 'nullable|string'
        ]);

        $existing = Transaction::where('id', $id)->where('user_id', $user->id)->first();
        if (!$existing) {
            return response()->json(['success' => false, 'error' => 'Transaction not found'], 404);
        }

        $amount = $request->input('amount');
        $type = $request->input('type');
        $categoryId = $request->input('categoryId');
        $accountId = $request->input('accountId');
        $note = $request->input('note');
        $date = $request->input('date');

        DB::transaction(function () use ($existing, $amount, $type, $categoryId, $accountId, $note, $date) {
            // Reverse old balance effect
            if ($existing->account_id) {
                $oldDelta = $existing->type === 'income' ? -(float)$existing->amount : (float)$existing->amount;
                Account::where('id', $existing->account_id)->increment('balance', $oldDelta);
            }

            $newAccountId = $accountId !== null ? $accountId : $existing->account_id;
            $newAmount = $amount !== null ? (float)$amount : (float)$existing->amount;
            $newType = $type !== null ? $type : $existing->type;

            // Apply new balance effect
            if ($newAccountId) {
                $newDelta = $newType === 'income' ? $newAmount : -$newAmount;
                Account::where('id', $newAccountId)->increment('balance', $newDelta);
            }

            $existing->update([
                'amount' => $amount !== null ? $amount : $existing->amount,
                'type' => $type !== null ? $type : $existing->type,
                'category_id' => $categoryId !== null ? $categoryId : $existing->category_id,
                'account_id' => $accountId !== null ? $accountId : $existing->account_id,
                'note' => $note !== null ? $note : $existing->note,
                'date' => $date !== null ? new \DateTime($date) : $existing->date,
            ]);
        });

        $existing->load(['category', 'account']);

        return response()->json(['success' => true, 'data' => $this->serializeTransaction($existing)]);
    }

    public function destroy(Request $request, string $id)
    {
        $user = $request->user();

        $existing = Transaction::where('id', $id)->where('user_id', $user->id)->first();
        if (!$existing) {
            return response()->json(['success' => false, 'error' => 'Transaction not found'], 404);
        }

        DB::transaction(function () use ($existing) {
            // Reverse the balance effect
            if ($existing->account_id && $existing->type !== 'transfer') {
                $delta = $existing->type === 'income' ? -(float)$existing->amount : (float)$existing->amount;
                Account::where('id', $existing->account_id)->increment('balance', $delta);
            }

            $existing->delete();
        });

        return response()->json(['success' => true, 'message' => 'Transaction deleted']);
    }
}
