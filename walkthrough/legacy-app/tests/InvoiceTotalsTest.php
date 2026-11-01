<?php

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../lib/invoice.php';

final class InvoiceTotalsTest extends TestCase
{
    public function testAddsLinesAndTax()
    {
        $lines = array(
            array('sku' => 'B', 'qty' => 2, 'unit_price' => '10.00'),
            array('sku' => 'A', 'qty' => 1, 'unit_price' => '5.50'),
        );
        $this->assertSame(array('subtotal' => 25.5, 'tax' => 5.1, 'total' => 30.6), calculate_totals($lines, '20.00'));
    }

    public function testRoundsTaxOnceOnTheSubtotal()
    {
        // 3 x 3.33 = 9.99; 9.99 x 5% = 0.4995 -> 0.50
        $lines = array(array('sku' => 'A', 'qty' => 3, 'unit_price' => '3.33'));
        $this->assertSame(array('subtotal' => 9.99, 'tax' => 0.5, 'total' => 10.49), calculate_totals($lines, '5.00'));
    }

    public function testZeroTaxAndNoLines()
    {
        $this->assertSame(array('subtotal' => 0.0, 'tax' => 0.0, 'total' => 0.0), calculate_totals(array(), 0));
        $lines = array(array('sku' => 'A', 'qty' => 4, 'unit_price' => '2.25'));
        $this->assertSame(array('subtotal' => 9.0, 'tax' => 0.0, 'total' => 9.0), calculate_totals($lines, '0.00'));
    }

    public function testSortsLinesBySku()
    {
        $lines = array(array('sku' => 'SKU-0009'), array('sku' => 'SKU-0002'), array('sku' => 'SKU-0005'));
        $sorted = sort_lines_by_sku($lines);
        $this->assertSame(array('SKU-0002', 'SKU-0005', 'SKU-0009'), array_column($sorted, 'sku'));
    }
}
