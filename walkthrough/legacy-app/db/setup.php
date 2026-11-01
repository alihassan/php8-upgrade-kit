<?php
/*
 * Create (or recreate) the database, load the schema, run migrations and seed it.
 *
 *   php db/setup.php                 5,000 orders, the demo size
 *   php db/setup.php --orders=60     a small set, used by the tests
 *   DB_NAME=invoicer_test php db/setup.php --orders=60 --customers=25 --products=15
 */
require __DIR__ . '/seed.php';

$opts = getopt('', ['orders::', 'customers::', 'products::']);
$c = require __DIR__ . '/../config/config.php';

$pdo = new PDO('mysql:host=' . $c['db_host'] . ';port=' . $c['db_port'] . ';charset=utf8mb4', $c['db_user'], $c['db_pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec('DROP DATABASE IF EXISTS `' . $c['db_name'] . '`');
$pdo->exec('CREATE DATABASE `' . $c['db_name'] . '` CHARACTER SET utf8mb4');
$pdo->exec('USE `' . $c['db_name'] . '`');

$sql = file_get_contents(__DIR__ . '/schema.sql');
$migrations = glob(__DIR__ . '/migrations/*.sql');
sort($migrations);
foreach ($migrations as $m) {
    $sql .= "\n" . file_get_contents($m);
}
foreach (array_filter(array_map(trim(...), explode(';', preg_replace('/^--.*$/m', '', $sql)))) as $statement) {
    $pdo->exec($statement);
}

$counts = seed_database(
    $pdo,
    isset($opts['orders']) ? (int) $opts['orders'] : 5000,
    isset($opts['customers']) ? (int) $opts['customers'] : 500,
    isset($opts['products']) ? (int) $opts['products'] : 120
);

fwrite(STDERR, sprintf("Database %s ready: %d customers, %d products, %d orders, %d order lines, %d migration(s).\n", $c['db_name'], $counts['customers'], $counts['products'], $counts['orders'], $counts['lines'], count($migrations)));
