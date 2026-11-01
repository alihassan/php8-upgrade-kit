<?php

/**
 * Work out invoice totals from order lines.
 *
 * Each line needs 'qty' and 'unit_price'. The tax rate is a percentage
 * (20 means 20%). Tax is rounded once, on the subtotal.
 *
 * @return array subtotal, tax, total (floats rounded to 2 places)
 */
function calculate_totals(array $lines, $taxRate)
{
    $subtotal = 0;
    foreach ($lines as $line) {
        $subtotal += $line['qty'] * $line['unit_price'];
    }
    $subtotal = round($subtotal, 2);
    $tax = round($subtotal * $taxRate / 100, 2);

    return [
        'subtotal' => $subtotal,
        'tax' => $tax,
        'total' => round($subtotal + $tax, 2),
    ];
}

function sort_lines_by_sku($lines)
{
    usort($lines, fn($a, $b) => strcmp($a["sku"], $b["sku"]));
    return $lines;
}
