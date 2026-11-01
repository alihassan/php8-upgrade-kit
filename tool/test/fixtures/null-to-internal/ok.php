<?php
$e = trim($_POST['email'] ?? '');
$q = $_GET['q'] ?? '';
echo strlen($q);
$n = null;
$n = 'x';
echo trim($n);
function f(?string $x = null) { return strtolower((string) $x); }
function post_text($field) { $v = filter_input(INPUT_POST, $field); return is_string($v) ? strip_tags($v) : null; }
$w = filter_input(INPUT_GET, 'w');
if ($w !== null && strlen($w) > 2) { echo trim($w); }
