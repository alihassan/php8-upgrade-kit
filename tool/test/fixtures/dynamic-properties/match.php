<?php
class Order { public $id; function load() { $this->total = 5; } }
$o = new Order();
$o->customer = 'x';
class Invoice { public $id; public static function make() { $i = new Invoice(); return $i; } }
$inv = Invoice::make();
$inv->paidAt = 'today';
