<?php
class Order { public $id; public $total; function load() { $this->total = 5; } }
$o = new Order();
$o->id = 1;
#[\AllowDynamicProperties]
class Bag { function f() { $this->x = 1; } }
class Magic { function __set($k, $v) {} function f() { $this->y = 1; } }
class Child extends VendorBase { function f() { $this->z = 1; } }
$s = new stdClass();
$s->any = 1;
class P { function __construct(private int $a) { $this->a = 2; } }
