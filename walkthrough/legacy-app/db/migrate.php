<?php
/*
 * Apply new migrations to an existing database, e.g. on a live server:
 *
 *   php db/migrate.php
 */
require __DIR__ . '/migrations.php';

$c = require __DIR__ . '/../config/config.php';
$pdo = new PDO('mysql:host=' . $c['db_host'] . ';port=' . $c['db_port'] . ';dbname=' . $c['db_name'] . ';charset=utf8mb4', $c['db_user'], $c['db_pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$applied = run_migrations($pdo);
fwrite(STDERR, $applied ? 'Applied: ' . implode(', ', $applied) . "\n" : "Nothing to do.\n");
