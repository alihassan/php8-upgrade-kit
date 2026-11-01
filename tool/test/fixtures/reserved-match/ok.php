<?php
$r = match ($x) { 1 => 'one', default => 'other' };
class P { public function match($a) {} }
$p->match(1);
