<?php

/**
 * Escape text for HTML output.
 */
function h($text)
{
    static $escaper = null;
    $escaper ??= new Zend\Escaper\Escaper('utf-8');
    // Empty database columns arrive as null; htmlspecialchars() needs a string since PHP 8.1.
    return $escaper->escapeHtml((string) $text);
}

/**
 * Format an amount of money, e.g. money(12.5, 'USD', 2) => "$12.50".
 */
function money($amount, $currency = 'USD', $decimals = null)
{
    $symbols = ['USD' => '$', 'EUR' => '€', 'GBP' => '£'];
    $symbol = $symbols[$currency] ?? $currency . ' ';
    return $symbol . number_format($amount, $decimals);
}

/**
 * Build "?a=1&b=2" from an array, skipping empty values.
 */
function build_query($params)
{
    $parts = [];
    reset($params);
    foreach ($params as $key => $value) {
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
    return strtoupper($name[0]);
}

function format_date($datetime)
{
    // Was strftime('%d %b %Y'). date() gives the same English output without the server locale.
    return date('d M Y', strtotime($datetime));
}

function invoice_number($orderId)
{
    $prefix = $GLOBALS['config']['invoice_prefix'];
    return "{$prefix}-" . str_pad($orderId, 6, '0', STR_PAD_LEFT);
}

/**
 * A posted text field with HTML tags removed, or null when it wasn't sent.
 * Replaces FILTER_SANITIZE_STRING, which also turned quotes into &#39; and
 * &#34; before they were saved, so "O'Brien" showed up as "O&#39;Brien".
 */
function post_text($field)
{
    $value = filter_input(INPUT_POST, $field);
    return is_string($value) ? strip_tags($value) : null;
}

function status_label($status)
{
    $labels = ['open' => 'Open', 'paid' => 'Paid', 'void' => 'Void'];
    return $labels[$status] ?? ucfirst($status);
}

function redirect($url): never
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
    $m = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $m;
}

function require_login()
{
    if (!Auth::check()) {
        redirect('login.php');
    }
}
