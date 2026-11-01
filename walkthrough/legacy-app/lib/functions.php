<?php

/**
 * Escape text for HTML output.
 */
function h($text)
{
    static $escaper = null;
    if ($escaper === null) {
        $escaper = new Zend\Escaper\Escaper('utf-8');
    }
    return $escaper->escapeHtml($text);
}

/**
 * Format an amount of money, e.g. money(12.5, 'USD', 2) => "$12.50".
 */
function money($amount, $currency = 'USD', $decimals)
{
    $symbols = array('USD' => '$', 'EUR' => '€', 'GBP' => '£');
    $symbol = isset($symbols[$currency]) ? $symbols[$currency] : $currency . ' ';
    return $symbol . number_format($amount, $decimals);
}

/**
 * Build "?a=1&b=2" from an array, skipping empty values.
 */
function build_query($params)
{
    $parts = array();
    reset($params);
    while (list($key, $value) = each($params)) {
        if ($value === null || $value === '') {
            continue;
        }
        $parts[] = urlencode($key) . '=' . urlencode($value);
    }
    return $parts ? '?' . implode('&', $parts) : '';
}

/**
 * First letter of a name, for the little avatar circles.
 */
function initials($name)
{
    return strtoupper($name{0});
}

function format_date($datetime)
{
    return strftime('%d %b %Y', strtotime($datetime));
}

function invoice_number($orderId)
{
    $prefix = $GLOBALS['config']['invoice_prefix'];
    return "${prefix}-" . str_pad($orderId, 6, '0', STR_PAD_LEFT);
}

function status_label($status)
{
    $labels = array('open' => 'Open', 'paid' => 'Paid', 'void' => 'Void');
    return isset($labels[$status]) ? $labels[$status] : ucfirst($status);
}

function redirect($url)
{
    header('Location: ' . $url);
    exit;
}

function flash($message = null)
{
    if ($message !== null) {
        $_SESSION['flash'] = $message;
        return null;
    }
    $m = isset($_SESSION['flash']) ? $_SESSION['flash'] : null;
    unset($_SESSION['flash']);
    return $m;
}

function require_login()
{
    if (!Auth::check()) {
        redirect('login.php');
    }
}
