<?php
require __DIR__ . '/../lib/bootstrap.php';
require_login();

$repo = new OrderRepository();
$order = $repo->find((int) $_GET['id']);
if (!$order) {
    http_response_code(404);
    echo 'Invoice not found';
    exit;
}

$renderer = new InvoiceRenderer($order);
$body = $renderer->render();

if (isset($_GET['download'])) {
    header('Content-Disposition: attachment; filename="' . invoice_number($order->id) . '.html"');
}
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title><?php echo h(invoice_number($order->id)); ?></title>
<style>
body { font: 14px/1.5 Georgia, serif; color: #222; max-width: 760px; margin: 40px auto; padding: 0 16px; }
.invoice-head { display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
table { width: 100%; border-collapse: collapse; margin-top: 24px; }
th, td { padding: 6px 8px; border-bottom: 1px solid #ddd; text-align: left; }
.num { text-align: right; }
.grand td { font-weight: bold; border-top: 2px solid #222; }
@media print { a { display: none; } }
</style>
</head>
<body>
<?php echo $body; ?>
<p><a href="javascript:window.print()">Print</a></p>
</body>
</html>
