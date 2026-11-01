<?php
class Cart implements Serializable {
  public function serialize() {} public function unserialize($d) {}
  public function __serialize(): array { return []; } public function __unserialize(array $d): void {}
}
