<?php

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../lib/invoice.php';

final class InvoiceTotalsTest extends TestCase
{
    public function testAddsLinesAndTax()
    {
        $lines = [
            ['sku' => 'B', 'qty' => 2, 'unit_price' => '10.00'],
            ['sku' => 'A', 'qty' => 1, 'unit_price' => '5.50'],
        ];
        $this->assertSame(['subtotal' => 25.5, 'tax' => 5.1, 'total' => 30.6], calculate_totals($lines, '20.00'));
    }

    public function testRoundsTaxOnceOnTheSubtotal()
    {
        // 3 x 3.33 = 9.99; 9.99 x 5% = 0.4995 -> 0.50
        $lines = [['sku' => 'A', 'qty' => 3, 'unit_price' => '3.33']];
        $this->assertSame(['subtotal' => 9.99, 'tax' => 0.5, 'total' => 10.49], calculate_totals($lines, '5.00'));
    }

    public function testZeroTaxAndNoLines()
    {
        $this->assertSame(['subtotal' => 0.0, 'tax' => 0.0, 'total' => 0.0], calculate_totals([], 0));
        $lines = [['sku' => 'A', 'qty' => 4, 'unit_price' => '2.25']];
        $this->assertSame(['subtotal' => 9.0, 'tax' => 0.0, 'total' => 9.0], calculate_totals($lines, '0.00'));
    }

    public function testSortsLinesBySku()
    {
        $lines = [['sku' => 'SKU-0009'], ['sku' => 'SKU-0002'], ['sku' => 'SKU-0005']];
        $sorted = sort_lines_by_sku($lines);
        $this->assertSame(['SKU-0002', 'SKU-0005', 'SKU-0009'], array_column($sorted, 'sku'));
    }
}
