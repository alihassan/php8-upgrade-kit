<?php
/*
 * Test setup:
 *   1. Build a small, deterministic test database (60 orders).
 *   2. Start PHP's built-in web server on the same PHP binary that runs the tests.
 *   3. Stop the server when the tests finish.
 *
 * Uses DB_HOST / DB_PORT / DB_USER / DB_PASS from the environment. The test
 * database is always called invoicer_test so the demo data is never touched.
 */
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/Http.php';

putenv('DB_NAME=invoicer_test');
$_ENV['DB_NAME'] = 'invoicer_test';

$root = dirname(__DIR__);
$env = array_merge(getenv(), ['DB_NAME' => 'invoicer_test']);

// 1. Database
$setup = proc_open([PHP_BINARY, $root . '/db/setup.php', '--orders=60', '--customers=25', '--products=15'], [2 => ['pipe', 'w']], $pipes, $root, $env);
$log = stream_get_contents($pipes[2]);
if (proc_close($setup) !== 0) {
    fwrite(STDERR, "Could not create the test database:\n" . $log);
    exit(1);
}

// 2. Web server. Error settings match a typical production host, with
// errors shown so the tests can see them.
$port = (int) (getenv('TEST_PORT') ?: 8765);
$server = proc_open(
    [PHP_BINARY, '-d', 'display_errors=1', '-d', 'error_reporting=' . TEST_ERROR_REPORTING, '-S', '127.0.0.1:' . $port, '-t', $root . '/public'],
    [1 => ['file', $root . '/tests/server.log', 'w'], 2 => ['file', $root . '/tests/server.log', 'a']],
    $pipes,
    $root,
    $env
);
for ($i = 0; $i < 50; $i++) {
    $sock = @fsockopen('127.0.0.1', $port);
    if ($sock) {
        fclose($sock);
        break;
    }
    usleep(100000);
}
define('BASE_URL', 'http://127.0.0.1:' . $port);

// 3. Clean up
register_shutdown_function(function () use ($server) {
    proc_terminate($server);
    proc_close($server);
});
