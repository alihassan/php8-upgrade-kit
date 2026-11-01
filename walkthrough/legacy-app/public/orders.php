<?php
require __DIR__ . '/../lib/bootstrap.php';
require_login();

// Every order, newest first.
$orders = db_all('SELECT * FROM orders ORDER BY created_at DESC, id DESC');

$rows = array();
$grand = 0;
foreach ($orders as $o) {
    // One query for the customer and one for the lines, per order.
    $customer = db_one('SELECT name FROM customers WHERE id = ?', array($o['customer_id']));
    $sum = db_one('SELECT SUM(qty * unit_price) AS subtotal, COUNT(*) AS line_count FROM order_lines WHERE order_id = ?', array($o['id']));
    $subtotal = round((float) $sum['subtotal'], 2);
    $total = round($subtotal + round($subtotal * $o['tax_rate'] / 100, 2), 2);
    $grand += $total;
    $rows[] = array(
        'id' => $o['id'],
        'customer' => $customer['name'],
        'status' => $o['status'],
        'created_at' => $o['created_at'],
        'lines' => $sum['line_count'],
        'total' => $total,
    );
}

$title = 'Orders';
include __DIR__ . '/../templates/header.php';
?>
<h1>Orders <small id="order-total"><?php echo count($rows); ?></small></h1>
<p>Total value: <strong id="orders-value"><?php echo money($grand, $config['currency'], 2); ?></strong></p>
<table>
    <thead><tr><th>Invoice</th><th>Customer</th><th>Status</th><th>Date</th><th class="num">Lines</th><th class="num">Total</th></tr></thead>
    <tbody>
    <?php foreach ($rows as $r): ?>
        <tr class="order-row">
            <td><a href="order.php?id=<?php echo $r['id']; ?>"><?php echo h(invoice_number($r['id'])); ?></a></td>
            <td><?php echo h($r['customer']); ?></td>
            <td><?php echo h(status_label($r['status'])); ?></td>
            <td><?php echo h(format_date($r['created_at'])); ?></td>
            <td class="num"><?php echo (int) $r['lines']; ?></td>
            <td class="num"><?php echo money($r['total'], $config['currency'], 2); ?></td>
        </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<?php include __DIR__ . '/../templates/footer.php';
