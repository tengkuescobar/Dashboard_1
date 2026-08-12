<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = app(App\Http\Controllers\Api\DashboardController::class);
$req = new Illuminate\Http\Request(['year' => 2025, 'month' => 12]);
echo "--- revenueBySalesType (first 2 items) ---\n";
$res1 = $c->revenueBySalesType($req)->getData();
print_r(array_slice($res1, 0, 2));

echo "\n--- revenueTotal (first 2 items) ---\n";
$res2 = $c->revenueTotal($req)->getData();
print_r(array_slice($res2, 0, 2));

