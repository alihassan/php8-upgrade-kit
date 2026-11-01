# Invoicer: PHP 8.3 check after Rector

**5 fatal, 22 deprecated, 0 behavior changes for PHP 8.3** across 26 files.

Rough effort: **Medium** (37 points). Points = 3 × fatal + 2 × behavior change + 1 × deprecated. Small: up to 25 points. Medium: 26 to 120. Large: over 120. It counts findings, not how hard each fix is, so treat it as a first guess.

Findings marked *(heuristic)* come from a best guess and can be wrong. Check them by hand.

## Composer packages

composer.json requires `php: ^7.0`, which does **not** allow PHP 8.3.

| Package | Current | PHP constraint | Supports 8.3? | Lowest version that does | Abandoned |
|---|---|---|---|---|---|
| zendframework/zend-escaper | 2.6.1 | `^5.6 \|\| ^7.0` | **no** | none found | yes, use laminas/laminas-escaper |
| doctrine/instantiator (dev) | 1.5.0 | `^7.1 \|\| ^8.0` | yes | 1.5.0 | no |
| myclabs/deep-copy (dev) | 1.13.4 | `^7.1 \|\| ^8.0` | yes | 1.13.4 | no |
| phar-io/manifest (dev) | 2.0.4 | `^7.2 \|\| ^8.0` | yes | 2.0.4 | no |
| phar-io/version (dev) | 3.2.1 | `^7.2 \|\| ^8.0` | yes | 3.2.1 | no |
| phpunit/php-code-coverage (dev) | 7.0.17 | `>=7.2` | yes | 7.0.17 | no |
| phpunit/php-file-iterator (dev) | 2.0.6 | `>=7.1` | yes | 2.0.6 | no |
| phpunit/php-text-template (dev) | 1.2.1 | `>=5.3.3` | yes | 1.2.1 | no |
| phpunit/php-timer (dev) | 2.1.4 | `>=7.1` | yes | 2.1.4 | no |
| phpunit/php-token-stream (dev) | 4.0.4 | `^7.3 \|\| ^8.0` | yes | 4.0.4 | no |
| phpunit/phpunit (dev) | 8.5.56 | `>=7.2` | yes | 8.5.56 | no |
| sebastian/code-unit-reverse-lookup (dev) | 1.0.3 | `>=5.6` | yes | 1.0.3 | no |
| sebastian/comparator (dev) | 3.0.7 | `>=7.1` | yes | 3.0.7 | no |
| sebastian/diff (dev) | 3.0.6 | `>=7.1` | yes | 3.0.6 | no |
| sebastian/environment (dev) | 4.2.5 | `>=7.1` | yes | 4.2.5 | no |
| sebastian/exporter (dev) | 3.1.9 | `>=7.2` | yes | 3.1.9 | no |
| sebastian/global-state (dev) | 3.0.6 | `>=7.2` | yes | 3.0.6 | no |
| sebastian/object-enumerator (dev) | 3.0.5 | `>=7.0` | yes | 3.0.5 | no |
| sebastian/object-reflector (dev) | 1.1.3 | `>=7.0` | yes | 1.1.3 | no |
| sebastian/recursion-context (dev) | 3.0.4 | `>=7.0` | yes | 3.0.4 | no |
| sebastian/resource-operations (dev) | 2.0.3 | `>=7.1` | yes | 2.0.3 | no |
| sebastian/type (dev) | 1.1.5 | `>=7.2` | yes | 1.1.5 | no |
| sebastian/version (dev) | 2.0.1 | `>=5.6` | yes | 2.0.1 | no |
| theseer/tokenizer (dev) | 1.3.1 | `^7.2 \|\| ^8.0` | yes | 1.3.1 | no |

## Fatal (5)

### lib/functions.php

- **Line 83: Calling a normal method as if it were static** *(heuristic)*. Auth::check()
  `if (!Auth::check()) {`
  [PHP docs](https://www.php.net/manual/en/migration80.incompatible.php) · rule `static-call-non-static`

### public/login.php

- **Line 8: Calling a normal method as if it were static** *(heuristic)*. Auth::attempt()
  `if (Auth::attempt($email, $password)) {`
  [PHP docs](https://www.php.net/manual/en/migration80.incompatible.php) · rule `static-call-non-static`

### public/logout.php

- **Line 4: Calling a normal method as if it were static** *(heuristic)*. Auth::logout()
  `Auth::logout();`
  [PHP docs](https://www.php.net/manual/en/migration80.incompatible.php) · rule `static-call-non-static`

### templates/header.php

- **Line 10: Calling a normal method as if it were static** *(heuristic)*. Auth::check()
  `<?php if (Auth::check()): ?>`
  [PHP docs](https://www.php.net/manual/en/migration80.incompatible.php) · rule `static-call-non-static`
- **Line 16: Calling a normal method as if it were static** *(heuristic)*. Auth::user()
  `<span class="who">Signed in as <?php echo h(Auth::user()); ?> · <a href="logout.php">Sign out</a></span>`
  [PHP docs](https://www.php.net/manual/en/migration80.incompatible.php) · rule `static-call-non-static`

## Deprecated (22)

### lib/functions.php

- **Line 49: strftime(), gmstrftime() and strptime() are deprecated**. strftime()
  `return strftime('%d %b %Y', strtotime($datetime));`
  [PHP docs](https://www.php.net/manual/en/migration81.deprecated.php) · rule `strftime`
- **Line 55: "${var}" inside strings is deprecated**
  `return "${prefix}-" . str_pad($orderId, 6, '0', STR_PAD_LEFT);`
  [PHP docs](https://www.php.net/manual/en/migration82.deprecated.php) · rule `dollar-brace-interpolation`

### lib/OrderCollection.php

- **Line 16: Methods of built-in interfaces need return types**. OrderCollection::current() should return mixed
  `public function current()`
  [PHP docs](https://wiki.php.net/rfc/internal_method_return_types) · rule `tentative-return-types`
- **Line 21: Methods of built-in interfaces need return types**. OrderCollection::key() should return mixed
  `public function key()`
  [PHP docs](https://wiki.php.net/rfc/internal_method_return_types) · rule `tentative-return-types`
- **Line 26: Methods of built-in interfaces need return types**. OrderCollection::next() should return void
  `public function next()`
  [PHP docs](https://wiki.php.net/rfc/internal_method_return_types) · rule `tentative-return-types`
- **Line 31: Methods of built-in interfaces need return types**. OrderCollection::rewind() should return void
  `public function rewind()`
  [PHP docs](https://wiki.php.net/rfc/internal_method_return_types) · rule `tentative-return-types`
- **Line 36: Methods of built-in interfaces need return types**. OrderCollection::valid() should return bool
  `public function valid()`
  [PHP docs](https://wiki.php.net/rfc/internal_method_return_types) · rule `tentative-return-types`
- **Line 41: Methods of built-in interfaces need return types**. OrderCollection::count() should return int
  `public function count()`
  [PHP docs](https://wiki.php.net/rfc/internal_method_return_types) · rule `tentative-return-types`

### lib/OrderRepository.php

- **Line 17: Creating properties that the class never declared** *(heuristic)*. Order::$customer_name is not declared
  `$order->customer_name = $customer['name'];`
  [PHP docs](https://www.php.net/manual/en/migration82.deprecated.php) · rule `dynamic-properties`
- **Line 18: Creating properties that the class never declared** *(heuristic)*. Order::$lines is not declared
  `$order->lines = $this->lines($order->id);`
  [PHP docs](https://www.php.net/manual/en/migration82.deprecated.php) · rule `dynamic-properties`
- **Line 20: Creating properties that the class never declared** *(heuristic)*. Order::$total is not declared
  `$order->total = $totals['total'];`
  [PHP docs](https://www.php.net/manual/en/migration82.deprecated.php) · rule `dynamic-properties`
- **Line 33: Creating properties that the class never declared** *(heuristic)*. Order::$notes is not declared
  `$order->notes = $row['notes'];`
  [PHP docs](https://www.php.net/manual/en/migration82.deprecated.php) · rule `dynamic-properties`
- **Line 34: Creating properties that the class never declared** *(heuristic)*. Order::$customer is not declared
  `$order->customer = db_one('SELECT * FROM customers WHERE id = ?', [$order->customer_id]);`
  [PHP docs](https://www.php.net/manual/en/migration82.deprecated.php) · rule `dynamic-properties`
- **Line 35: Creating properties that the class never declared** *(heuristic)*. Order::$lines is not declared
  `$order->lines = $this->lines($order->id);`
  [PHP docs](https://www.php.net/manual/en/migration82.deprecated.php) · rule `dynamic-properties`

### public/customers.php

- **Line 6: FILTER_SANITIZE_STRING is deprecated**. FILTER_SANITIZE_STRING
  `$name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);`
  [PHP docs](https://www.php.net/manual/en/migration81.deprecated.php) · rule `filter-sanitize-string`
- **Line 8: FILTER_SANITIZE_STRING is deprecated**. FILTER_SANITIZE_STRING
  `$company = filter_input(INPUT_POST, 'company', FILTER_SANITIZE_STRING);`
  [PHP docs](https://www.php.net/manual/en/migration81.deprecated.php) · rule `filter-sanitize-string`
- **Line 9: FILTER_SANITIZE_STRING is deprecated**. FILTER_SANITIZE_STRING
  `$city = filter_input(INPUT_POST, 'city', FILTER_SANITIZE_STRING);`
  [PHP docs](https://www.php.net/manual/en/migration81.deprecated.php) · rule `filter-sanitize-string`
- **Line 20: FILTER_SANITIZE_STRING is deprecated**. FILTER_SANITIZE_STRING
  `$q = filter_input(INPUT_GET, 'q', FILTER_SANITIZE_STRING);`
  [PHP docs](https://www.php.net/manual/en/migration81.deprecated.php) · rule `filter-sanitize-string`
- **Line 26: Passing null to a built-in function that expects text** *(heuristic)*. strlen() may get filter_input(), which returns null when the field is missing
  `if (strlen($q) > 0) {`
  [PHP docs](https://www.php.net/manual/en/migration81.deprecated.php) · rule `null-to-internal`

### public/login.php

- **Line 6: Passing null to a built-in function that expects text** *(heuristic)*. trim() may get request input that is null when the field is missing
  `$email = trim($_POST['email']);`
  [PHP docs](https://www.php.net/manual/en/migration81.deprecated.php) · rule `null-to-internal`

### public/products.php

- **Line 6: Passing null to a built-in function that expects text** *(heuristic)*. trim() may get request input that is null when the field is missing
  `$sku = strtoupper(trim($_POST['sku']));`
  [PHP docs](https://www.php.net/manual/en/migration81.deprecated.php) · rule `null-to-internal`
- **Line 7: Passing null to a built-in function that expects text** *(heuristic)*. trim() may get request input that is null when the field is missing
  `$name = trim($_POST['name']);`
  [PHP docs](https://www.php.net/manual/en/migration81.deprecated.php) · rule `null-to-internal`

## How to fix each one

### strftime(), gmstrftime() and strptime() are deprecated

These functions format and read dates using the server's language settings. They behaved differently from one server to the next, and PHP 8.1 deprecated them. Use date() or DateTime for fixed formats, or IntlDateFormatter for month and day names in other languages.

Before:

```php
echo strftime('%d %B %Y', $timestamp);
```

After:

```php
echo date('d F Y', $timestamp);
// translated month names:
$fmt = new IntlDateFormatter('fr_FR', IntlDateFormatter::LONG, IntlDateFormatter::NONE);
echo $fmt->format($timestamp);
```

Docs: https://www.php.net/manual/en/migration81.deprecated.php

### "${var}" inside strings is deprecated

PHP has several ways to put a variable inside quoted text. The "${name}" form is deprecated since PHP 8.2 and logs a warning. Write "{$name}" (dollar sign inside the braces) or just "$name".

Before:

```php
echo "Invoice ${number} for ${customer['name']}";
```

After:

```php
echo "Invoice {$number} for {$customer['name']}";
```

Docs: https://www.php.net/manual/en/migration82.deprecated.php

### Calling a normal method as if it were static

A method written without the word "static" belongs to an object, but older PHP let you call it as ClassName::method() anyway, with only a warning. PHP 8 throws an error instead and the page stops. Either mark the method static (if it doesn't use $this) or create an object and call it on that.

Before:

```php
class Auth {
    function check() { return isset($_SESSION['user']); }
}
if (!Auth::check()) { ... }
```

After:

```php
class Auth {
    public static function check(): bool { return isset($_SESSION['user']); }
}
if (!Auth::check()) { ... }
```

Docs: https://www.php.net/manual/en/migration80.incompatible.php

### Methods of built-in interfaces need return types

When a class plugs into PHP's own interfaces (for loops, array access, count() or JSON), PHP 8.1 expects each method to say what type it returns. Without it, every request logs a deprecation warning. Add the return type, or, if the code must still run on PHP 7, add #[\ReturnTypeWillChange] above the method.

Before:

```php
class OrderList implements Iterator {
    public function current() { return $this->items[$this->i]; }
    public function next() { $this->i++; }
    // ...
}
```

After:

```php
class OrderList implements Iterator {
    public function current(): mixed { return $this->items[$this->i]; }
    public function next(): void { $this->i++; }
    // ...
}
// Must still run on PHP 7? Use the attribute instead:
// #[\ReturnTypeWillChange]
// public function current() { ... }
```

Docs: https://wiki.php.net/rfc/internal_method_return_types

### Creating properties that the class never declared

Older PHP let code attach any new field to an object on the fly, even one the class never listed. PHP 8.2 logs a deprecation warning each time, and PHP 9 is expected to make it an error. List the field in the class (best), or add #[\AllowDynamicProperties] above the class to keep the old behaviour.

Before:

```php
class Order {
    public $id;
}
$order = new Order();
$order->total = 99.50; // "total" was never declared
```

After:

```php
class Order {
    public $id;
    public $total;
}
// or, to keep the old behaviour for now:
#[\AllowDynamicProperties]
class Order { ... }
```

Docs: https://www.php.net/manual/en/migration82.deprecated.php

### FILTER_SANITIZE_STRING is deprecated

This filter stripped HTML tags from form input. It was often mistaken for real protection against attacks, and PHP 8.1 deprecated it. Keep the raw input, validate it, and escape it with htmlspecialchars() when you print it on a page.

Before:

```php
$name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);
echo $name;
```

After:

```php
$name = trim((string) filter_input(INPUT_POST, 'name'));
echo htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
```

Docs: https://www.php.net/manual/en/migration81.deprecated.php

### Passing null to a built-in function that expects text

Functions like trim() and strlen() expect text. Older PHP quietly treated a missing value (null) as empty text. Since PHP 8.1 each one logs a deprecation warning, and a future version will make it an error. On busy sites the warnings can fill the error log fast. Give the value a default before passing it in.

Before:

```php
$email = trim($_POST['email']);
```

After:

```php
$email = trim($_POST['email'] ?? '');
```

Docs: https://www.php.net/manual/en/migration81.deprecated.php

