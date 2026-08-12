<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Administrator',
                'email' => 'admin@dashboard.com',
                'password' => 'password',
            ],
            [
                'name' => 'Business Analyst',
                'email' => 'analyst@dashboard.com',
                'password' => 'password',
            ],
            [
                'name' => 'Revenue Manager',
                'email' => 'manager@dashboard.com',
                'password' => 'password',
            ],
            [
                'name' => 'Demo User',
                'email' => 'demo@dashboard.com',
                'password' => 'password',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'password' => Hash::make($user['password']),
                    'email_verified_at' => now(),
                ]
            );
        }

        $this->command->info('User accounts seeded successfully!');
        $this->command->table(
            ['Name', 'Email', 'Password'],
            collect($users)->map(function ($u) {
                return [$u['name'], $u['email'], $u['password']];
            })
        );
    }
}
