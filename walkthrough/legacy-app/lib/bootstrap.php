<?php
// Loaded at the top of every page.

// Hide the "strict standards" and deprecation noise.
error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
ini_set('display_errors', '1');

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
