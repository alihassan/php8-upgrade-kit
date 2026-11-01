<?php
// Rector, configured for an upgrade to PHP 8.3 and nothing else: the PHP
// version sets only, no code-quality or coding-style sets.
use Rector\Config\RectorConfig;

$app = __DIR__ . '/../legacy-app';

return RectorConfig::configure()
    ->withPaths([$app . '/config', $app . '/db', $app . '/lib', $app . '/public', $app . '/templates', $app . '/tests'])
    ->withPhpSets(php83: true);
