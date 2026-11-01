<?php
require __DIR__ . '/../lib/bootstrap.php';
require_login();

$counts = db_one('SELECT
    (SELECT COUNT(*) FROM customers) AS customers,
    (SELECT COUNT(*) FROM products) AS products,
    (SELECT COUNT(*) FROM orders) AS orders');

$repo = new OrderRepository();
$recent = $repo->recent(10);

$title = 'Dashboard';
include __DIR__ . '/../templates/header.php';
?>
<h1>Dashboard</h1>
<ul class="stats">
    <li><strong id="count-customers"><?php echo (int) $counts['customers']; ?></strong> customers</li>
    <li><strong id="count-products"><?php echo (int) $counts['products']; ?></strong> products</li>
    <li><strong id="count-orders"><?php echo (int) $counts['orders']; ?></strong> orders</li>
</ul>

<h2>Latest <?php echo count($recent); ?> orders</h2>
<table>
    <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th class="num">Total</th></tr></thead>
    <tbody>
    <?php foreach ($recent as $order): ?>
        <tr>
            <td><a href="order.php?id=<?php echo $order->id; ?>"><?php echo h($order->label()); ?></a></td>
            <td><?php echo h($order->customer_name); ?></td>
            <td><?php echo h(format_date($order->created_at)); ?></td>
            <td class="num"><?php echo money($order->total, $config['currency'], 2); ?></td>
        </tr>
    <?php endforeach; ?>
    </tbody>
    <tfoot><tr><td colspan="3">Value of these orders</td><td class="num" id="recent-value"><?php echo money($recent->totalValue(), $config['currency'], 2); ?></td></tr></tfoot>
</table>
<?php include __DIR__ . '/../templates/footer.php';
