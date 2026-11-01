<?php

use PHPUnit\Framework\TestCase;

/**
 * Characterization tests: they pin down what the app shows today (on PHP
 * 7.4, tag v0-php72-original) so every upgrade step can be checked against
 * it. The numbers come from the deterministic 60-order test database.
 */
final class PagesTest extends TestCase
{
    /** Strings PHP prints when something goes wrong. */
    const PHP_ERRORS = '/(Fatal error|Parse error|Warning|Notice|Deprecated|Uncaught)\b.{0,200}/';

    private function page(Http $http, $path, $status = 200)
    {
        $res = $http->get($path);
        $this->assertSame($status, $res['status'], "HTTP status for $path\n" . substr($res['body'], 0, 1500));
        $this->assertNotRegExp(self::PHP_ERRORS, $res['body'], "PHP error output on $path");
        return $res['body'];
    }

    private function signedIn()
    {
        $http = new Http();
        return $http->signIn();
    }

    public function testLoginPageRenders()
    {
        $body = $this->page(new Http(), '/login.php');
        $this->assertStringContainsString('<h1>Sign in</h1>', $body);
    }

    public function testPagesNeedASignedInUser()
    {
        $http = new Http();
        foreach (array('/index.php', '/customers.php', '/products.php', '/orders.php', '/order.php?id=1', '/invoice.php?id=1') as $path) {
            $res = $http->get($path);
            $this->assertSame(302, $res['status'], $path);
            $this->assertSame('login.php', $res['headers']['location'], $path);
        }
    }

    public function testWrongPasswordIsRejected()
    {
        $res = (new Http())->post('/login.php', array('email' => 'admin@example.com', 'password' => 'nope'));
        $this->assertSame(200, $res['status']);
        $this->assertStringContainsString('don&#039;t match', $res['body']);
    }

    public function testDashboard()
    {
        $body = $this->page($this->signedIn(), '/index.php');
        $this->assertStringContainsString('id="count-customers">25<', $body);
        $this->assertStringContainsString('id="count-products">15<', $body);
        $this->assertStringContainsString('id="count-orders">60<', $body);
        $this->assertSame(10, substr_count($body, 'order.php?id='));
        $this->assertStringContainsString('id="recent-value">$45,451.03<', $body);
    }

    public function testCustomerListPagesAndSearch()
    {
        $http = $this->signedIn();
        $body = $this->page($http, '/customers.php');
        $this->assertStringContainsString('id="customer-total">25<', $body);
        $this->assertSame(20, substr_count($body, 'class="customer-row"'));
        $this->assertStringContainsString('customers.php?page=2', $body);
        $this->assertStringContainsString('class="avatar">A<', $body);

        $this->assertSame(5, substr_count($this->page($http, '/customers.php?page=2'), 'class="customer-row"'));

        $search = $this->page($http, '/customers.php?q=Lopez');
        $this->assertStringContainsString('id="customer-total">4<', $search);
        $this->assertSame(4, substr_count($search, 'class="customer-row"'));
    }

    public function testProducts()
    {
        $body = $this->page($this->signedIn(), '/products.php');
        $this->assertStringContainsString('id="product-total">15<', $body);
        $this->assertSame(15, substr_count($body, 'class="product-row"'));
        $this->assertStringContainsString('<td>SKU-0001</td>', $body);
        $this->assertStringContainsString('$326.15', $body);
    }

    public function testOrdersList()
    {
        $body = $this->page($this->signedIn(), '/orders.php');
        $this->assertStringContainsString('id="order-total">60<', $body);
        $this->assertSame(60, substr_count($body, 'class="order-row"'));
        $this->assertStringContainsString('id="orders-value">$325,714.71<', $body);
    }

    public function testOrderPageListsLinesBySku()
    {
        $body = $this->page($this->signedIn(), '/order.php?id=1');
        preg_match_all('#<td>(SKU-\d+)</td>#', $body, $m);
        $this->assertSame(array('SKU-0002', 'SKU-0003', 'SKU-0006'), $m[1]);
        $this->assertStringContainsString('id="order-total">$3,355.62<', $body);
    }

    public function testUnknownOrderIs404()
    {
        $this->page($this->signedIn(), '/order.php?id=99999', 404);
    }

    public function testInvoice()
    {
        $http = $this->signedIn();
        $body = $this->page($http, '/invoice.php?id=1');
        $this->assertStringContainsString('INV-000001', $body);
        $this->assertStringContainsString('Date: 05 Sep 2019', $body);
        $this->assertStringContainsString('Tax (5.00%)', $body);
        $this->assertStringContainsString('id="subtotal">$3,195.83<', $body);
        $this->assertStringContainsString('id="tax">$159.79<', $body);
        $this->assertStringContainsString('id="total">$3,355.62<', $body);

        $download = $http->get('/invoice.php?id=1&download=1');
        $this->assertSame('attachment; filename="INV-000001.html"', $download['headers']['content-disposition']);
    }

    public function testAddProductAndCustomer()
    {
        $http = $this->signedIn();
        $res = $http->post('/products.php', array('sku' => 'test-1', 'name' => 'Test widget', 'price' => '12.5'));
        $this->assertSame(302, $res['status']);
        $body = $this->page($http, '/products.php');
        $this->assertStringContainsString('Product added.', $body);
        $this->assertStringContainsString('<td>TEST-1</td>', $body);
        $this->assertStringContainsString('$12.50', $body);

        $res = $http->post('/customers.php', array('name' => 'Test <b>Person</b>', 'email' => 'test.person@example.com', 'company' => '', 'city' => 'Leeds'));
        $this->assertSame(302, $res['status']);
        $body = $this->page($http, '/customers.php?q=test.person');
        $this->assertStringContainsString('Customer added.', $body);
        $this->assertStringContainsString('id="customer-total">1<', $body);
        // The old FILTER_SANITIZE_STRING stripped the tags before saving.
        $this->assertStringContainsString('<td>Test Person</td>', $body);
    }

    public static function tearDownAfterClass(): void
    {
        $c = require __DIR__ . '/../config/config.php';
        $pdo = new PDO('mysql:host=' . $c['db_host'] . ';port=' . $c['db_port'] . ';dbname=invoicer_test', $c['db_user'], $c['db_pass']);
        $pdo->exec("DELETE FROM products WHERE sku = 'TEST-1'");
        $pdo->exec("DELETE FROM customers WHERE email = 'test.person@example.com'");
    }
}
