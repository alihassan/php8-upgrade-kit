<?php
class L implements Countable, JsonSerializable {
  public function count(): int { return 0; }
  #[\ReturnTypeWillChange]
  public function jsonSerialize() { return []; }
}
class M { public function count() {} }
