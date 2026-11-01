<?php
require __DIR__ . '/../lib/bootstrap.php';
require_login();

// Every order, newest first, with its customer and line totals in one query.
// (This page used to run two more queries per order: 10,001 for 5,000 orders.)
$orders = db_all('
    SELECT o.id, o.status, o.tax_rate, o.created_at, c.name AS customer,
           SUM(l.qty * l.unit_price) AS subtotal, COUNT(l.id) AS line_count
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    LEFT JOIN order_lines l ON l.order_id = o.id
    GROUP BY o.id, o.status, o.tax_rate, o.created_at, c.name
    ORDER BY o.created_at DESC, o.id DESC
');

$rows = [];
$grand = 0;
foreach ($orders as $o) {
    $subtotal = round((float) $o['subtotal'], 2);
    $total = round($subtotal + round($subtotal * $o['tax_rate'] / 100, 2), 2);
    $grand += $total;
    $rows[] = [
        'id' => $o['id'],
        'customer' => $o['customer'],
        'status' => $o['status'],
        'created_at' => $o['created_at'],
        'lines' => $o['line_count'],
        'total' => $total,
    ];
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
