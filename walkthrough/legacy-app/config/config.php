<?php
/*
 * App settings. Values come from environment variables so Docker, CI and a
 * local install can share this file. config/local.php (not committed) can
 * override anything for a developer machine.
 */
$config = [
    'db_host' => getenv('DB_HOST') ?: '127.0.0.1',
    'db_port' => getenv('DB_PORT') ?: '3306',
    'db_name' => getenv('DB_NAME') ?: 'invoicer',
    'db_user' => getenv('DB_USER') ?: 'root',
    'db_pass' => getenv('DB_PASS') !== false ? getenv('DB_PASS') : '',
    'company' => 'Northwind Supplies Ltd',
    'invoice_prefix' => 'INV',
    'currency' => 'USD',
];

if (file_exists(__DIR__ . '/local.php')) {
    $config = array_merge($config, include __DIR__ . '/local.php');
}

return $config;
