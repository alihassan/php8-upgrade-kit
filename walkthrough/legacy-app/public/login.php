<?php
require __DIR__ . '/../lib/bootstrap.php';

$error = null;
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    if (Auth::attempt($email, $password)) {
        redirect('index.php');
    }
    $error = 'That email and password don\'t match.';
}

$title = 'Sign in';
include __DIR__ . '/../templates/header.php';
?>
<form method="post" class="card login">
    <h1>Sign in</h1>
    <?php if ($error): ?><p class="error"><?php echo h($error); ?></p><?php endif; ?>
    <label>Email <input type="email" name="email" required></label>
    <label>Password <input type="password" name="password" required></label>
    <button type="submit">Sign in</button>
</form>
<?php include __DIR__ . '/../templates/footer.php';
