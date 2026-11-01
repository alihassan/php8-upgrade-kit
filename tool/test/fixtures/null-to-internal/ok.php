<?php
$e = trim($_POST['email'] ?? '');
$q = $_GET['q'] ?? '';
echo strlen($q);
$n = null;
$n = 'x';
echo trim($n);
function f(?string $x = null) { return strtolower((string) $x); }
