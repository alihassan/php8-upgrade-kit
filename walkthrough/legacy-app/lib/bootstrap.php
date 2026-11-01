<?php
// Loaded at the top of every page.

// Report everything, deprecations included, so they show up in logs and tests
// before the next PHP version turns them into errors.
error_reporting(E_ALL);
// Whether errors are shown or only logged is up to php.ini: off in production.

date_default_timezone_set('UTC');

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

$GLOBALS['config'] = require __DIR__ . '/../config/config.php';

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/invoice.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/Order.php';
require_once __DIR__ . '/OrderCollection.php';
require_once __DIR__ . '/OrderRepository.php';
require_once __DIR__ . '/InvoiceRenderer.php';
