<?php
require __DIR__ . '/../lib/bootstrap.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $name = post_text('name');
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $company = post_text('company');
    $city = post_text('city');
    if ($name && $email) {
        $stmt = db()->prepare('INSERT INTO customers (name, email, company, city, created_at) VALUES (?, ?, ?, ?, NOW())');
        $stmt->execute([$name, $email, $company, $city]);
        flash('Customer added.');
        redirect('customers.php');
    }
    flash('Please enter a name and a valid email.');
    redirect('customers.php');
}

// The search term is never stored, and h() escapes it on output.
$q = (string) filter_input(INPUT_GET, 'q');
$page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
$perPage = 20;

$where = '';
$params = [];
if (strlen($q) > 0) {
    $where = 'WHERE name LIKE ? OR email LIKE ? OR company LIKE ?';
    $params = ['%' . $q . '%', '%' . $q . '%', '%' . $q . '%'];
}
$total = db_one("SELECT COUNT(*) AS n FROM customers $where", $params);
$customers = db_all("SELECT * FROM customers $where ORDER BY name LIMIT $perPage OFFSET " . (($page - 1) * $perPage), $params);
$pages = (int) ceil($total['n'] / $perPage);

$title = 'Customers';
include __DIR__ . '/../templates/header.php';
?>
<h1>Customers <small id="customer-total"><?php echo (int) $total['n']; ?></small></h1>
<form method="get" class="search">
    <input type="search" name="q" value="<?php echo h($q); ?>" placeholder="Search by name, email or company">
    <button type="submit">Search</button>
</form>
<table>
    <thead><tr><th></th><th>Name</th><th>Email</th><th>Company</th><th>City</th></tr></thead>
    <tbody>
    <?php foreach ($customers as $c): ?>
        <tr class="customer-row">
            <td><span class="avatar"><?php echo h(initials($c['name'])); ?></span></td>
            <td><?php echo h($c['name']); ?></td>
            <td><?php echo h($c['email']); ?></td>
            <td><?php echo h($c['company']); ?></td>
            <td><?php echo h($c['city']); ?></td>
        </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<?php if ($pages > 1): ?>
<p class="pager">
    <?php for ($i = 1; $i <= $pages; $i++): ?>
        <a href="customers.php<?php echo h(build_query(['q' => $q, 'page' => $i])); ?>"<?php if ($i == $page) echo ' class="current"'; ?>><?php echo $i; ?></a>
    <?php endfor; ?>
</p>
<?php endif; ?>

<h2>Add a customer</h2>
<form method="post" class="card">
    <label>Name <input name="name" required></label>
    <label>Email <input type="email" name="email" required></label>
    <label>Company <input name="company"></label>
    <label>City <input name="city"></label>
    <button type="submit">Add customer</button>
</form>
<?php include __DIR__ . '/../templates/footer.php';
