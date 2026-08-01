<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['id' => 'food', 'name' => 'food', 'label' => 'Food & Dining', 'icon' => '🍔', 'color' => '#FF6B6B', 'type' => 'expense'],
            ['id' => 'transport', 'name' => 'transport', 'label' => 'Transport', 'icon' => '🚗', 'color' => '#4ECDC4', 'type' => 'expense'],
            ['id' => 'entertainment', 'name' => 'entertainment', 'label' => 'Entertainment', 'icon' => '🎬', 'color' => '#45B7D1', 'type' => 'expense'],
            ['id' => 'shopping', 'name' => 'shopping', 'label' => 'Shopping', 'icon' => '🛍️', 'color' => '#96CEB4', 'type' => 'expense'],
            ['id' => 'bills', 'name' => 'bills', 'label' => 'Bills & Utilities', 'icon' => '📄', 'color' => '#FFEAA7', 'type' => 'expense'],
            ['id' => 'health', 'name' => 'health', 'label' => 'Health', 'icon' => '❤️', 'color' => '#DDA0DD', 'type' => 'expense'],
            ['id' => 'salary', 'name' => 'salary', 'label' => 'Salary', 'icon' => '💼', 'color' => '#98FB98', 'type' => 'income'],
            ['id' => 'freelance', 'name' => 'freelance', 'label' => 'Freelance', 'icon' => '💻', 'color' => '#87CEEB', 'type' => 'income'],
            ['id' => 'investment', 'name' => 'investment', 'label' => 'Investment', 'icon' => '📈', 'color' => '#F0E68C', 'type' => 'income'],
            ['id' => 'other', 'name' => 'other', 'label' => 'Other', 'icon' => '📦', 'color' => '#D3D3D3', 'type' => 'both'],
        ];

        foreach ($categories as $cat) {
            DB::table('categories')->updateOrInsert(
                ['name' => $cat['name']],
                [
                    'id' => $cat['id'],
                    'label' => $cat['label'],
                    'icon' => $cat['icon'],
                    'color' => $cat['color'],
                    'type' => $cat['type'],
                ]
            );
        }
    }
}
