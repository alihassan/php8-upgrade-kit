<?php
class Order { public $id; function load() { $this->total = 5; } }
$o = new Order();
$o->customer = 'x';
