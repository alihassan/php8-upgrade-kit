<?php
/*
 * Deterministic demo data. The same counts always produce the same rows,
 * so tests can check exact totals. Kept free of version-specific code so
 * it runs unchanged on PHP 7.2 through 8.3.
 */

final class SeedRandom
{
    private $state;

    public function __construct($seed)
    {
        $this->state = $seed;
    }

    /** Integer between $min and $max inclusive (a plain LCG, the same on every PHP version). */
    public function between($min, $max)
    {
        $this->state = ($this->state * 1103515245 + 12345) % 2147483648;
        return $min + ($this->state % ($max - $min + 1));
    }

    public function pick(array $items)
    {
        return $items[$this->between(0, count($items) - 1)];
    }
}

function seed_database(PDO $pdo, $orderCount = 5000, $customerCount = 500, $productCount = 120)
{
    $r = new SeedRandom(20170615);
    $first = array('Amira', 'Ben', 'Chloe', 'Dmitri', 'Elena', 'Farid', 'Grace', 'Hiro', 'Ines', 'Jonas', 'Kofi', 'Lena', 'Mateo', 'Nadia', 'Omar', 'Priya', 'Quinn', 'Rosa', 'Sven', 'Tariq', 'Uma', 'Victor', 'Wen', 'Yara', 'Zane');
    $last = array('Adams', 'Baker', 'Costa', 'Diaz', 'Evans', 'Fischer', 'Garcia', 'Haddad', 'Ito', 'Jensen', 'Khan', 'Lopez', 'Moreau', 'Novak', 'Okafor', 'Petrov', 'Reyes', 'Sato', 'Tanaka', 'Weber');
    $companies = array('Acorn Labs', 'Bluefin Retail', 'Cedar & Co', 'Delta Freight', 'Ember Studio', 'Fjord Foods', 'Granite Works', 'Harbor Health', null, null);
    $cities = array('Leeds', 'Lyon', 'Austin', 'Porto', 'Karachi', 'Osaka', 'Denver', 'Gdansk', 'Nairobi', 'Toronto');
    $items = array('Paper, A4 ream', 'Toner cartridge', 'Desk lamp', 'Office chair', 'USB-C cable', 'Label printer', 'Whiteboard', 'Shipping boxes (25)', 'Packing tape', 'Monitor arm', 'Notebook pack', 'Stapler');
    $statuses = array('paid', 'paid', 'paid', 'open', 'open', 'void');

    $pdo->beginTransaction();

    $stmt = $pdo->prepare('INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)');
    $stmt->execute(array('admin@example.com', password_hash('secret', PASSWORD_DEFAULT), 'Admin', '2017-01-01 09:00:00'));

    $rows = array();
    for ($i = 1; $i <= $customerCount; $i++) {
        $name = $r->pick($first) . ' ' . $r->pick($last);
        $email = strtolower(str_replace(' ', '.', $name)) . $i . '@example.com';
        $notes = $r->between(1, 5) === 1 ? 'Prefers invoices by post.' : null;
        $rows[] = array($name, $email, $r->pick($companies), $r->pick($cities), $notes, sprintf('2017-%02d-%02d 10:00:00', $r->between(1, 12), $r->between(1, 28)));
    }
    insert_many($pdo, 'customers', array('name', 'email', 'company', 'city', 'notes', 'created_at'), $rows);

    $rows = array();
    $prices = array();
    for ($i = 1; $i <= $productCount; $i++) {
        $price = $r->between(199, 49999) / 100;
        $prices[$i] = $price;
        $rows[] = array(sprintf('SKU-%04d', $i), $r->pick($items) . ' #' . $i, $price, $r->between(1, 10) === 1 ? 0 : 1);
    }
    insert_many($pdo, 'products', array('sku', 'name', 'unit_price', 'active'), $rows);

    $orders = array();
    $lines = array();
    $taxRates = array(0, 5, 10, 20);
    for ($i = 1; $i <= $orderCount; $i++) {
        $day = $r->between(0, 1094);
        $created = date('Y-m-d H:i:s', strtotime('2017-01-01 08:00:00 UTC') + $day * 86400 + $r->between(0, 36000));
        $notes = $r->between(1, 8) === 1 ? 'Deliver to the back entrance.' : null;
        $orders[] = array($r->between(1, $customerCount), $r->pick($statuses), $r->pick($taxRates), $notes, $created);
        $lineCount = $r->between(1, 4);
        for ($l = 0; $l < $lineCount; $l++) {
            $pid = $r->between(1, $productCount);
            $lines[] = array($i, $pid, sprintf('SKU-%04d', $pid), 'Item ' . sprintf('SKU-%04d', $pid), $r->between(1, 12), $prices[$pid]);
        }
    }
    insert_many($pdo, 'orders', array('customer_id', 'status', 'tax_rate', 'notes', 'created_at'), $orders);
    insert_many($pdo, 'order_lines', array('order_id', 'product_id', 'sku', 'description', 'qty', 'unit_price'), $lines);

    $pdo->commit();
    return array('customers' => $customerCount, 'products' => $productCount, 'orders' => $orderCount, 'lines' => count($lines));
}

function insert_many(PDO $pdo, $table, array $columns, array $rows)
{
    foreach (array_chunk($rows, 500) as $chunk) {
        $placeholders = '(' . implode(', ', array_fill(0, count($columns), '?')) . ')';
        $sql = 'INSERT INTO ' . $table . ' (' . implode(', ', $columns) . ') VALUES ' . implode(', ', array_fill(0, count($chunk), $placeholders));
        $values = array();
        foreach ($chunk as $row) {
            foreach ($row as $v) {
                $values[] = $v;
            }
        }
        $pdo->prepare($sql)->execute($values);
    }
}
