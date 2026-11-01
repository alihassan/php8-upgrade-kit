<?php

/**
 * A list of Order objects you can foreach over and count().
 */
class OrderCollection implements Iterator, Countable
{
    private $orders = array();
    private $position = 0;

    public function __construct(array $orders)
    {
        $this->orders = array_values($orders);
    }

    public function current()
    {
        return $this->orders[$this->position];
    }

    public function key()
    {
        return $this->position;
    }

    public function next()
    {
        $this->position++;
    }

    public function rewind()
    {
        $this->position = 0;
    }

    public function valid()
    {
        return isset($this->orders[$this->position]);
    }

    public function count()
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
