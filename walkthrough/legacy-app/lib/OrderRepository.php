<?php

class OrderRepository
{
    /**
     * Most recent orders, with the customer name and total filled in.
     *
     * @return OrderCollection
     */
    public function recent($limit)
    {
        $rows = db_all('SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT ' . (int) $limit);
        $orders = array();
        foreach ($rows as $row) {
            $order = Order::fromRow($row);
            $customer = db_one('SELECT name FROM customers WHERE id = ?', array($order->customer_id));
            $order->customer_name = $customer['name'];
            $order->lines = $this->lines($order->id);
            $totals = calculate_totals($order->lines, $order->tax_rate);
            $order->total = $totals['total'];
            $orders[] = $order;
        }
        return new OrderCollection($orders);
    }

    public function find($id)
    {
        $row = db_one('SELECT * FROM orders WHERE id = ?', array($id));
        if (!$row) {
            return null;
        }
        $order = Order::fromRow($row);
        $order->notes = $row['notes'];
        $order->customer = db_one('SELECT * FROM customers WHERE id = ?', array($order->customer_id));
        $order->lines = $this->lines($order->id);
        return $order;
    }

    public function lines($orderId)
    {
        return db_all('SELECT * FROM order_lines WHERE order_id = ? ORDER BY id', array($orderId));
    }
}
