<?php

/**
 * A list of Order objects you can foreach over and count().
 */
class OrderCollection implements Iterator, Countable
{
    private $orders = [];
    private $position = 0;

    public function __construct(array $orders)
    {
        $this->orders = array_values($orders);
    }

    public function current(): Order
    {
        return $this->orders[$this->position];
    }

    public function key(): int
    {
        return $this->position;
    }

    public function next(): void
    {
        $this->position++;
    }

    public function rewind(): void
    {
        $this->position = 0;
    }

    public function valid(): bool
    {
        return isset($this->orders[$this->position]);
    }

    public function count(): int
    {
        return count($this->orders);
    }

    public function totalValue()
    {
        $sum = 0;
        foreach ($this->orders as $order) {
            $sum += $order->total;
        }
        return $sum;
    }
}
