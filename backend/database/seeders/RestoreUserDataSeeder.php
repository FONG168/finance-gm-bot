<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RestoreUserDataSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 'M7YU9ktVW2S0DtE4Bgzt3TLE';
        $telegramId = 8341172708;

        // Wipe old/dummy accounts and transactions for this telegram_id
        $existingUsers = DB::table('users')->where('telegram_id', $telegramId)->pluck('id');
        if ($existingUsers->count() > 0) {
            DB::table('transactions')->whereIn('user_id', $existingUsers)->delete();
            DB::table('accounts')->whereIn('user_id', $existingUsers)->delete();
            DB::table('users')->where('telegram_id', $telegramId)->delete();
        }

        // Restore User
        DB::table('users')->insert([
            'id' => $userId,
            'telegram_id' => $telegramId,
            'first_name' => 'Peaky',
            'last_name' => 'Blinder',
            'username' => 'god_of_wealthy',
            'photo_url' => 'https://t.me/i/userpic/320/95plM3pE2MW_V2ubHWDSri2xXoSTxwd-g5ww-o-u5OGAGQ0hHmNi5pz3hC-bKf7W.svg',
            'currency' => 'USD',
            'timezone' => 'UTC',
            'preferred_language' => 'en',
            'is_active' => true,
            'plan' => 'PREMIUM',
            'subscription_status' => 'ACTIVE',
            'trial_ends_at' => '2026-08-07 14:06:26',
            'premium_started_at' => '2026-07-25 05:55:53',
            'premium_expires_at' => '2026-08-24 05:55:53',
            'created_at' => '2026-07-24 07:06:26',
            'updated_at' => '2026-07-31 23:03:11'
        ]);

        // Restore Accounts
        $accounts = [
            ['id' => '700872A2ulDtEuTDJIPt8fdf', 'user_id' => $userId, 'name' => 'GEM Wallet', 'type' => 'ewallet', 'balance' => 28.46, 'currency' => 'USD', 'color' => '#10b981', 'icon' => '📱', 'is_archived' => 0, 'is_default' => 0, 'is_frozen' => 0, 'created_at' => '2026-07-24 07:58:02', 'updated_at' => '2026-07-31 23:04:37'],
            ['id' => '9igZsJ1ENKh4tQANJZy0Seff', 'user_id' => $userId, 'name' => 'ABA', 'type' => 'bank', 'balance' => 4509.21, 'currency' => 'USD', 'color' => '#3b82f6', 'icon' => '🏦', 'is_archived' => 0, 'is_default' => 0, 'is_frozen' => 0, 'created_at' => '2026-07-24 08:04:38', 'updated_at' => '2026-07-31 23:15:33'],
            ['id' => 'bLYKdGDMNS4AeKviQRugTmKN', 'user_id' => $userId, 'name' => 'OKX', 'type' => 'ewallet', 'balance' => 12.82, 'currency' => 'USD', 'color' => '#8b5cf6', 'icon' => '📱', 'is_archived' => 0, 'is_default' => 0, 'is_frozen' => 0, 'created_at' => '2026-07-28 20:55:18', 'updated_at' => '2026-07-31 23:08:45'],
            ['id' => 'GroKzcuGEJO3bmLz7HKEXYzU', 'user_id' => $userId, 'name' => 'C Wallet', 'type' => 'ewallet', 'balance' => 0.00, 'currency' => 'USD', 'color' => '#8b5cf6', 'icon' => '🪙', 'is_archived' => 0, 'is_default' => 0, 'is_frozen' => 0, 'created_at' => '2026-07-28 20:06:14', 'updated_at' => '2026-07-31 23:06:09'],
            ['id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'user_id' => $userId, 'name' => 'Cash on Hand', 'type' => 'cash', 'balance' => 32.26, 'currency' => 'USD', 'color' => '#10b981', 'icon' => '💵', 'is_archived' => 0, 'is_default' => 1, 'is_frozen' => 0, 'created_at' => '2026-07-24 07:06:26', 'updated_at' => '2026-07-31 23:18:28']
        ];

        foreach ($accounts as $acc) {
            DB::table('accounts')->insert($acc);
        }

        // Restore Transactions
        $transactions = [
            ['id' => '22oUspdwrBDakxLZnwb79ip4', 'user_id' => $userId, 'account_id' => 'GroKzcuGEJO3bmLz7HKEXYzU', 'amount' => 351.96, 'type' => 'expense', 'category_id' => 'other', 'note' => 'commision 40%', 'transfer_id' => null, 'date' => '2026-07-29 03:20:37', 'created_at' => '2026-07-28 20:20:38', 'updated_at' => '2026-07-28 20:20:38'],
            ['id' => '23Dg9XyFuQW6D3KFcW3t8xMz', 'user_id' => $userId, 'account_id' => 'GroKzcuGEJO3bmLz7HKEXYzU', 'amount' => 48.69, 'type' => 'expense', 'category_id' => 'other', 'note' => 'Fee of WD USDT to C Wallet', 'transfer_id' => null, 'date' => '2026-07-28 03:51:02', 'created_at' => '2026-07-28 20:51:03', 'updated_at' => '2026-07-28 20:51:03'],
            ['id' => '3wecGJm4xzrhpZjTLW8RtikS', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 649.35, 'type' => 'transfer', 'category_id' => 'other', 'note' => 'Commission 60%= 527.93USDT + 121.42 USDT from own GEM WALLET', 'transfer_id' => 'trf_1785294896', 'date' => '2026-07-29 03:14:55', 'created_at' => '2026-07-28 20:14:56', 'updated_at' => '2026-07-28 20:14:56'],
            ['id' => '46Xt3bRlgA13elCxza5pi9Tc', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 0.75, 'type' => 'expense', 'category_id' => 'food', 'note' => 'coffee', 'transfer_id' => null, 'date' => '2026-07-27 12:00:00', 'created_at' => '2026-07-26 22:43:35', 'updated_at' => '2026-07-26 22:43:35'],
            ['id' => '6xsZTT0QBcpUPIo26RAcwR15', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 1.00, 'type' => 'expense', 'category_id' => 'other', 'note' => 'Cellcard 089400025', 'transfer_id' => null, 'date' => '2026-07-30 06:38:07', 'created_at' => '2026-07-29 23:38:07', 'updated_at' => '2026-07-29 23:38:07'],
            ['id' => '8xJG75zlyJUmOVAcJbWovAoF', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 1.00, 'type' => 'expense', 'category_id' => 'other', 'note' => null, 'transfer_id' => null, 'date' => '2026-07-31 06:15:32', 'created_at' => '2026-07-31 23:15:33', 'updated_at' => '2026-07-31 23:15:33'],
            ['id' => '9EYQwTgGliZ3mGWbLMlAAMyL', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 60.00, 'type' => 'expense', 'category_id' => 'shopping', 'note' => 'purchased ទូរខោរអាវ', 'transfer_id' => null, 'date' => '2026-07-25 12:00:00', 'created_at' => '2026-07-25 02:40:02', 'updated_at' => '2026-07-25 02:40:02'],
            ['id' => 'a0yuUFrzA6dZd3t3oByDRLjP', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 3.50, 'type' => 'expense', 'category_id' => 'health', 'note' => null, 'transfer_id' => null, 'date' => '2026-07-30 05:56:48', 'created_at' => '2026-07-29 22:56:49', 'updated_at' => '2026-07-29 22:56:49'],
            ['id' => 'biOD6O7Z7oGwmlWJF1nohfvL', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 213.87, 'type' => 'expense', 'category_id' => 'other', 'note' => '40%', 'transfer_id' => null, 'date' => '2026-08-01 06:13:20', 'created_at' => '2026-07-31 23:13:21', 'updated_at' => '2026-07-31 23:13:21'],
            ['id' => 'BRO19vIsNgZbOJwr5dgLs15z', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 12.41, 'type' => 'expense', 'category_id' => 'other', 'note' => 'កក់ទូរត្រី', 'transfer_id' => null, 'date' => '2026-07-30 06:03:12', 'created_at' => '2026-07-29 23:03:13', 'updated_at' => '2026-07-29 23:05:10'],
            ['id' => 'EpR1e1L0z3mt9r8Ie5kyTaXm', 'user_id' => $userId, 'account_id' => 'GroKzcuGEJO3bmLz7HKEXYzU', 'amount' => 900.00, 'type' => 'transfer', 'category_id' => 'other', 'note' => 'Transfer from GEM Wallet', 'transfer_id' => 'trf_1785564277', 'date' => '2026-08-01 06:04:36', 'created_at' => '2026-07-31 23:04:37', 'updated_at' => '2026-07-31 23:04:37'],
            ['id' => 'EVWxgZ9vRNr11PWsIBjxBA7J', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 2.50, 'type' => 'expense', 'category_id' => 'other', 'note' => 'changed GAS for mom', 'transfer_id' => null, 'date' => '2026-07-30 05:58:18', 'created_at' => '2026-07-29 22:58:18', 'updated_at' => '2026-07-29 22:58:18'],
            ['id' => 'F9qADzFWvQJwDokTP0vKrXQr', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 50.00, 'type' => 'transfer', 'category_id' => 'other', 'note' => 'Transfer from ABA', 'transfer_id' => 'trf_1785317839', 'date' => '2026-07-29 09:37:19', 'created_at' => '2026-07-29 02:37:19', 'updated_at' => '2026-07-29 02:37:19'],
            ['id' => 'fh7sXAnb2u8mJvPYlWO8EdsG', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 16.11, 'type' => 'expense', 'category_id' => 'shopping', 'note' => 'floryn skin car', 'transfer_id' => null, 'date' => '2026-07-31 12:19:38', 'created_at' => '2026-07-31 05:19:40', 'updated_at' => '2026-07-31 05:44:22'],
            ['id' => 'FnItu2iOhQLvZNkHxBelvvf0', 'user_id' => $userId, 'account_id' => '700872A2ulDtEuTDJIPt8fdf', 'amount' => 1050.00, 'type' => 'transfer', 'category_id' => 'other', 'note' => 'Transfer to C Wallet', 'transfer_id' => 'trf_1785294400', 'date' => '2026-07-29 03:06:39', 'created_at' => '2026-07-28 20:06:40', 'updated_at' => '2026-07-28 20:06:40'],
            ['id' => 'FY7FAQmMm0x0SEHdyXNpygzy', 'user_id' => $userId, 'account_id' => 'GroKzcuGEJO3bmLz7HKEXYzU', 'amount' => 46.30, 'type' => 'expense', 'category_id' => 'other', 'note' => 'C wallet WD fee', 'transfer_id' => null, 'date' => '2026-08-01 06:06:09', 'created_at' => '2026-07-31 23:06:09', 'updated_at' => '2026-07-31 23:06:09'],
            ['id' => 'G2cT5T626w6KPnxWPFNmclDN', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 2.50, 'type' => 'income', 'category_id' => 'other', 'note' => null, 'transfer_id' => null, 'date' => '2026-07-27 12:00:00', 'created_at' => '2026-07-26 22:46:10', 'updated_at' => '2026-07-26 22:46:10'],
            ['id' => 'gbWjS32rFgzPbrjPiHQlAtzK', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 92.00, 'type' => 'expense', 'category_id' => 'other', 'note' => 'E Borrow', 'transfer_id' => null, 'date' => '2026-07-31 12:43:50', 'created_at' => '2026-07-31 05:43:51', 'updated_at' => '2026-07-31 05:43:51'],
            ['id' => 'HM9v1SYn9qYKhBo3ZiRwILQg', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 1.00, 'type' => 'expense', 'category_id' => 'other', 'note' => null, 'transfer_id' => null, 'date' => '2026-07-31 06:12:18', 'created_at' => '2026-07-31 23:12:18', 'updated_at' => '2026-07-31 23:12:18'],
            ['id' => 'IL14Jl4AKh3yyAxeB8g9SsdK', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 10.00, 'type' => 'expense', 'category_id' => 'other', 'note' => 'Heang Borrow', 'transfer_id' => null, 'date' => '2026-07-30 06:01:45', 'created_at' => '2026-07-29 23:01:46', 'updated_at' => '2026-07-29 23:01:46'],
            ['id' => 'JGoPMfNJdaBrmyh623QDETem', 'user_id' => $userId, 'account_id' => 'bLYKdGDMNS4AeKviQRugTmKN', 'amount' => 898.20, 'type' => 'transfer', 'category_id' => 'other', 'note' => 'Transfer to ABA', 'transfer_id' => 'trf_1785564430', 'date' => '2026-08-01 06:07:09', 'created_at' => '2026-07-31 23:07:10', 'updated_at' => '2026-07-31 23:07:10'],
            ['id' => 'JHnF8TOmhF9FOfTLzL6FF0DT', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 15.00, 'type' => 'expense', 'category_id' => 'bills', 'note' => 'Claude PRO MAX plan', 'transfer_id' => null, 'date' => '2026-07-26 12:00:00', 'created_at' => '2026-07-26 04:09:53', 'updated_at' => '2026-07-26 04:09:53'],
            ['id' => 'jOMJk5wrhQNHv8jfFhhuJQzB', 'user_id' => $userId, 'account_id' => 'GroKzcuGEJO3bmLz7HKEXYzU', 'amount' => 1050.00, 'type' => 'transfer', 'category_id' => 'other', 'note' => 'Transfer from GEM Wallet', 'transfer_id' => 'trf_1785294400', 'date' => '2026-07-29 03:06:39', 'created_at' => '2026-07-28 20:06:40', 'updated_at' => '2026-07-28 20:06:40'],
            ['id' => 'juPFwzHKVuhBstqXldmkd1Yv', 'user_id' => $userId, 'account_id' => '700872A2ulDtEuTDJIPt8fdf', 'amount' => 225.60, 'type' => 'expense', 'category_id' => 'other', 'note' => '40% of 564', 'transfer_id' => null, 'date' => '2026-07-30 06:33:23', 'created_at' => '2026-07-29 23:33:24', 'updated_at' => '2026-07-29 23:33:24'],
            ['id' => 'K2xUcglwAM02pSUc8cFZGf4Q', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 13.37, 'type' => 'expense', 'category_id' => 'food', 'note' => 'dinning', 'transfer_id' => null, 'date' => '2026-07-29 09:40:19', 'created_at' => '2026-07-29 02:40:20', 'updated_at' => '2026-07-29 02:40:20'],
            ['id' => 'koYYy7ugpzOJFKON4HA9Wncp', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 49.63, 'type' => 'transfer', 'category_id' => 'other', 'note' => 'Transfer to Cash on Hand', 'transfer_id' => 'trf_1785564861', 'date' => '2026-08-01 06:14:21', 'created_at' => '2026-07-31 23:14:21', 'updated_at' => '2026-07-31 23:14:21'],
            ['id' => 'L95nziOP8vH4FIv5sIp6UbUb', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 11.25, 'type' => 'expense', 'category_id' => 'health', 'note' => 'Herpes Virus treatment', 'transfer_id' => null, 'date' => '2026-07-26 12:00:00', 'created_at' => '2026-07-25 22:27:35', 'updated_at' => '2026-07-25 22:27:35'],
            ['id' => 'MEfFb6qzoeHMQyApRK2OJw51', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 15.00, 'type' => 'income', 'category_id' => 'other', 'note' => 'refunded from purchased Claude Pro Max', 'transfer_id' => null, 'date' => '2026-07-26 12:00:00', 'created_at' => '2026-07-26 22:42:26', 'updated_at' => '2026-07-26 22:42:26'],
            ['id' => 'metmfjofkMZOX9ZhnYplYIY8', 'user_id' => $userId, 'account_id' => 'bLYKdGDMNS4AeKviQRugTmKN', 'amount' => 1.73, 'type' => 'expense', 'category_id' => 'other', 'note' => 'WD from OKX to ABA P2P', 'transfer_id' => null, 'date' => '2026-08-01 06:08:45', 'created_at' => '2026-07-31 23:08:45', 'updated_at' => '2026-07-31 23:08:45'],
            ['id' => 'mQn3YPrF0H9NKPzBZa0Qz4Ar', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 49.63, 'type' => 'transfer', 'category_id' => 'other', 'note' => 'Transfer from ABA', 'transfer_id' => 'trf_1785564861', 'date' => '2026-08-01 06:14:21', 'created_at' => '2026-07-31 23:14:21', 'updated_at' => '2026-07-31 23:14:21'],
            ['id' => 'nYUJmGfvRsqf1RlPxRmlcV9G', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 4.75, 'type' => 'expense', 'category_id' => 'food', 'note' => 'Dinning', 'transfer_id' => null, 'date' => '2026-07-26 12:00:00', 'created_at' => '2026-07-26 03:57:44', 'updated_at' => '2026-07-26 03:57:44'],
            ['id' => 'oKELH9PBEE97WB9cBgkQjoHe', 'user_id' => $userId, 'account_id' => '700872A2ulDtEuTDJIPt8fdf', 'amount' => 564.00, 'type' => 'income', 'category_id' => 'freelance', 'note' => 'Edo Fani Ardiansyah', 'transfer_id' => null, 'date' => '2026-07-30 06:30:30', 'created_at' => '2026-07-29 23:30:30', 'updated_at' => '2026-07-29 23:30:30'],
            ['id' => 'P2IMkzN8ilAa5kEwA3LKzUhK', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 12.50, 'type' => 'expense', 'category_id' => 'food', 'note' => 'lunch', 'transfer_id' => null, 'date' => '2026-08-01 06:16:08', 'created_at' => '2026-07-31 23:16:08', 'updated_at' => '2026-07-31 23:16:08'],
            ['id' => 'p67GZLR0OfXJaYF1vjymZdS6', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 13.00, 'type' => 'expense', 'category_id' => 'food', 'note' => null, 'transfer_id' => null, 'date' => '2026-07-27 02:50:25', 'created_at' => '2026-07-28 19:50:26', 'updated_at' => '2026-07-28 19:50:26'],
            ['id' => 'PAoAki6GrQZKat342vNrOAOn', 'user_id' => $userId, 'account_id' => '700872A2ulDtEuTDJIPt8fdf', 'amount' => 102.80, 'type' => 'income', 'category_id' => 'other', 'note' => 'Other Income', 'transfer_id' => null, 'date' => '2026-07-24 15:09:46', 'created_at' => '2026-07-24 08:09:46', 'updated_at' => '2026-07-24 08:09:46'],
            ['id' => 'PzFIzXGmjybxrgZ4ysdjnAe1', 'user_id' => $userId, 'account_id' => '700872A2ulDtEuTDJIPt8fdf', 'amount' => 122.69, 'type' => 'income', 'category_id' => 'other', 'note' => 'Muhammad Malik Fajar AT-00097', 'transfer_id' => null, 'date' => '2026-07-24 14:59:44', 'created_at' => '2026-07-24 07:59:46', 'updated_at' => '2026-07-24 07:59:46'],
            ['id' => 'q7B7MxF8d1u5jfJdFoDGlyCH', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 5.00, 'type' => 'expense', 'category_id' => 'other', 'note' => 'ចូលបុណ្យ​ចូលបសារ', 'transfer_id' => null, 'date' => '2026-08-01 06:17:10', 'created_at' => '2026-07-31 23:17:11', 'updated_at' => '2026-07-31 23:18:28'],
            ['id' => 'QdrizaGFFC320s7pkt1xHTRk', 'user_id' => $userId, 'account_id' => '700872A2ulDtEuTDJIPt8fdf', 'amount' => 291.31, 'type' => 'income', 'category_id' => 'freelance', 'note' => null, 'transfer_id' => null, 'date' => '2026-07-28 02:52:40', 'created_at' => '2026-07-28 19:52:41', 'updated_at' => '2026-07-28 19:52:41'],
            ['id' => 'R5oCQQJomAkeKntO2raxDGV2', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 898.20, 'type' => 'transfer', 'category_id' => 'other', 'note' => 'Transfer from OKX', 'transfer_id' => 'trf_1785564430', 'date' => '2026-08-01 06:07:09', 'created_at' => '2026-07-31 23:07:10', 'updated_at' => '2026-07-31 23:07:10'],
            ['id' => 's3orVXd9XEfmCCsmeW3OzE9u', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 33.12, 'type' => 'expense', 'category_id' => 'food', 'note' => null, 'transfer_id' => null, 'date' => '2026-07-31 12:37:39', 'created_at' => '2026-07-31 05:38:16', 'updated_at' => '2026-07-31 05:38:16'],
            ['id' => 's9kguw4j4ZJB8BYmqEWWxsfY', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 33.75, 'type' => 'income', 'category_id' => 'other', 'note' => 'Cash Deposit', 'transfer_id' => null, 'date' => '2026-07-25 12:00:00', 'created_at' => '2026-07-24 21:00:05', 'updated_at' => '2026-07-24 21:00:05'],
            ['id' => 'SkZg4FwvFGqk6C67riLniY6j', 'user_id' => $userId, 'account_id' => '700872A2ulDtEuTDJIPt8fdf', 'amount' => 900.00, 'type' => 'transfer', 'category_id' => 'other', 'note' => 'Transfer to C Wallet', 'transfer_id' => 'trf_1785564277', 'date' => '2026-08-01 06:04:36', 'created_at' => '2026-07-31 23:04:37', 'updated_at' => '2026-07-31 23:04:37'],
            ['id' => 'TUAdFF9yewhRg3nCsqekf6O9', 'user_id' => $userId, 'account_id' => 'bLYKdGDMNS4AeKviQRugTmKN', 'amount' => 853.70, 'type' => 'transfer', 'category_id' => 'other', 'note' => 'Transfer from C Wallet', 'transfer_id' => 'trf_1785564326', 'date' => '2026-08-01 06:05:26', 'created_at' => '2026-07-31 23:05:26', 'updated_at' => '2026-07-31 23:05:26'],
            ['id' => 'Ty7AqqP4KjblWZ8nfMTH6rWz', 'user_id' => $userId, 'account_id' => '700872A2ulDtEuTDJIPt8fdf', 'amount' => 534.68, 'type' => 'income', 'category_id' => 'freelance', 'note' => null, 'transfer_id' => null, 'date' => '2026-08-01 06:04:10', 'created_at' => '2026-07-31 23:04:10', 'updated_at' => '2026-07-31 23:04:10'],
            ['id' => 'UadNuxQkUD5nowDinthLrMAX', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 6.00, 'type' => 'expense', 'category_id' => 'bills', 'note' => 'Smart card Data 016262411', 'transfer_id' => null, 'date' => '2026-07-26 12:00:00', 'created_at' => '2026-07-25 22:26:31', 'updated_at' => '2026-07-25 22:26:31'],
            ['id' => 'uolRRy9Wfde7E6JZ4872r9AF', 'user_id' => $userId, 'account_id' => '700872A2ulDtEuTDJIPt8fdf', 'amount' => 588.58, 'type' => 'income', 'category_id' => 'freelance', 'note' => null, 'transfer_id' => null, 'date' => '2026-07-28 02:53:12', 'created_at' => '2026-07-28 19:53:13', 'updated_at' => '2026-07-28 19:53:13'],
            ['id' => 'V2YNLXt488qRjCU95BRd6jW8', 'user_id' => $userId, 'account_id' => 'GroKzcuGEJO3bmLz7HKEXYzU', 'amount' => 853.70, 'type' => 'transfer', 'category_id' => 'other', 'note' => 'Transfer to OKX', 'transfer_id' => 'trf_1785564326', 'date' => '2026-08-01 06:05:26', 'created_at' => '2026-07-31 23:05:26', 'updated_at' => '2026-07-31 23:05:26'],
            ['id' => 'VCXRgYf3EZExate8RAeTkYEz', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 0.38, 'type' => 'expense', 'category_id' => 'other', 'note' => 'change money fee', 'transfer_id' => null, 'date' => '2026-07-29 09:39:03', 'created_at' => '2026-07-29 02:39:04', 'updated_at' => '2026-07-29 02:39:04'],
            ['id' => 'vdX0VTwQ7NWH8xSgfqSDtVW9', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 24.79, 'type' => 'expense', 'category_id' => 'entertainment', 'note' => null, 'transfer_id' => null, 'date' => '2026-07-31 12:18:22', 'created_at' => '2026-07-31 05:18:24', 'updated_at' => '2026-07-31 05:44:37'],
            ['id' => 'WMGcc5WQdm4yKrWZNmCCOuwu', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 1.50, 'type' => 'expense', 'category_id' => 'other', 'note' => 'Phanith\'s Taking photo service', 'transfer_id' => null, 'date' => '2026-07-30 05:57:25', 'created_at' => '2026-07-29 22:57:25', 'updated_at' => '2026-07-29 22:57:25'],
            ['id' => 'XHshDjzXQ0nzOjTGtU62AhWq', 'user_id' => $userId, 'account_id' => '9igZsJ1ENKh4tQANJZy0Seff', 'amount' => 49.61, 'type' => 'expense', 'category_id' => 'other', 'note' => 'Transfer to Cash on Hand', 'transfer_id' => 'trf_1785317839', 'date' => '2026-07-29 09:37:19', 'created_at' => '2026-07-29 02:37:19', 'updated_at' => '2026-07-29 23:06:18'],
            ['id' => 'zNjOE4U03NNHMu6d1VMbKUOw', 'user_id' => $userId, 'account_id' => 'GroKzcuGEJO3bmLz7HKEXYzU', 'amount' => 649.35, 'type' => 'transfer', 'category_id' => 'other', 'note' => 'Commission 60%= 527.93USDT + 121.42 USDT from own GEM WALLET', 'transfer_id' => 'trf_1785294896', 'date' => '2026-07-29 03:14:55', 'created_at' => '2026-07-28 20:14:56', 'updated_at' => '2026-07-28 20:14:56'],
            ['id' => 'Zq306g6l8h9spkBUZoaZtqKB', 'user_id' => $userId, 'account_id' => 'n2rmSzq2Y0YuCi5NjajCPp0v', 'amount' => 1.00, 'type' => 'expense', 'category_id' => 'other', 'note' => 'coffee', 'transfer_id' => null, 'date' => '2026-07-30 05:57:55', 'created_at' => '2026-07-29 22:57:56', 'updated_at' => '2026-07-29 22:57:56']
        ];

        foreach ($transactions as $tx) {
            DB::table('transactions')->insert($tx);
        }
    }
}
