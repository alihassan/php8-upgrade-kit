<?php
require __DIR__ . '/../lib/bootstrap.php';
require_login();

$repo = new OrderRepository();
$order = $repo->find((int) $_GET['id']);
if (!$order) {
    http_response_code(404);
    $title = 'Not found';
    include __DIR__ . '/../templates/header.php';
    echo '<h1>Order not found</h1>';
    include __DIR__ . '/../templates/footer.php';
    exit;
}

$lines = sort_lines_by_sku($order->lines);
$totals = calculate_totals($lines, $order->tax_rate);

$title = invoice_number($order->id);
include __DIR__ . '/../templates/header.php';
?>
<h1><?php echo h(invoice_number($order->id)); ?> <small><?php echo h(status_label($order->status)); ?></small></h1>
<p>Customer: <strong><?php echo h($order->customer['name']); ?></strong> · <?php echo h(format_date($order->created_at)); ?></p>
<table>
    <thead><tr><th>SKU</th><th>Item</th><th class="num">Qty</th><th class="num">Unit price</th></tr></thead>
    <tbody>
    <?php foreach ($lines as $line): ?>
        <tr class="line-row">
            <td><?php echo h($line['sku']); ?></td>
            <td><?php echo h($line['description']); ?></td>
            <td class="num"><?php echo (int) $line['qty']; ?></td>
            <td class="num"><?php echo money($line['unit_price'], $config['currency'], 2); ?></td>
        </tr>
    <?php endforeach; ?>
    </tbody>
    <tfoot><tr><td colspan="3">Total incl. tax</td><td class="num" id="order-total"><?php echo money($totals['total'], $config['currency'], 2); ?></td></tr></tfoot>
</table>
<p><a href="invoice.php?id=<?php echo $order->id; ?>">View invoice</a> · <a href="invoice.php?id=<?php echo $order->id; ?>&amp;download=1">Download invoice (HTML)</a></p>
<?php include __DIR__ . '/../templates/footer.php';
