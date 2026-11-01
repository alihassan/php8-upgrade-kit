<?php
require __DIR__ . '/../lib/bootstrap.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $sku = strtoupper(trim($_POST['sku']));
    $name = trim($_POST['name']);
    $price = (real) $_POST['price'];
    if ($sku !== '' && $name !== '' && $price > 0) {
        $stmt = db()->prepare('INSERT INTO products (sku, name, unit_price) VALUES (?, ?, ?)');
        $stmt->execute(array($sku, $name, $price));
        flash('Product added.');
    } else {
        flash('SKU, name and a price above zero are required.');
    }
    redirect('products.php');
}

$products = db_all('SELECT * FROM products ORDER BY sku');

$title = 'Products';
include __DIR__ . '/../templates/header.php';
?>
<h1>Products <small id="product-total"><?php echo count($products); ?></small></h1>
<table>
    <thead><tr><th>SKU</th><th>Name</th><th class="num">Unit price</th><th>Status</th></tr></thead>
    <tbody>
    <?php foreach ($products as $p): ?>
        <tr class="product-row">
            <td><?php echo h($p['sku']); ?></td>
            <td><?php echo h($p['name']); ?></td>
            <td class="num"><?php echo money($p['unit_price'], $config['currency'], 2); ?></td>
            <td><?php echo $p['active'] ? 'Active' : 'Retired'; ?></td>
        </tr>
    <?php endforeach; ?>
    </tbody>
</table>

<h2>Add a product</h2>
<form method="post" class="card">
    <label>SKU <input name="sku" required></label>
    <label>Name <input name="name" required></label>
    <label>Unit price <input name="price" inputmode="decimal" required></label>
    <button type="submit">Add product</button>
</form>
<?php include __DIR__ . '/../templates/footer.php';
