<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?php echo h($title); ?> · Invoicer</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<?php if (Auth::check()): ?>
<nav class="nav">
    <a href="index.php" class="brand">Invoicer</a>
    <a href="customers.php">Customers</a>
    <a href="products.php">Products</a>
    <a href="orders.php">Orders</a>
    <span class="who">Signed in as <?php echo h(Auth::user()); ?> · <a href="logout.php">Sign out</a></span>
</nav>
<?php endif; ?>
<main>
<?php $msg = flash(); if ($msg): ?>
<p class="flash"><?php echo h($msg); ?></p>
<?php endif; ?>
