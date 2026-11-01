<?php

class Order
{
    public $id;
    public $customer_id;
    public $status;
    public $tax_rate;
    public $created_at;

    public static function fromRow(array $row)
    {
        $order = new Order();
        $order->id = (int) $row['id'];
        $order->customer_id = (int) $row['customer_id'];
        $order->status = $row['status'];
        $order->tax_rate = $row['tax_rate'];
        $order->created_at = $row['created_at'];
        return $order;
    }

    public function label()
    {
        return invoice_number($this->id) . ' (' . status_label($this->status) . ')';
    }
}
