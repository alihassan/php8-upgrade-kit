# Upgrading a PHP 7.2 app to PHP 8.3, one commit at a time

This folder holds **Invoicer**, a small order and invoice app written the way
plenty of PHP apps were around 2017, and the full upgrade of that app to PHP 8.3.
Every step is its own commit with its own tag, so you can see exactly what
changed, check out any point, and run the tests there.

If you own a PHP site and your host is about to switch PHP versions, read the
checklist and skip the rest. If you're the developer doing the work, each step
links to its diff.

## The checklist

1. **Get a copy running that matches the live site.** Same PHP version, same database. Never upgrade on the live server first.
2. **Write tests that record what the site does today.** Then you'll know the moment something changes.
3. **Scan the code.** A checker like [php8-check](https://hassan.im/php8-check/?utm_source=github&utm_medium=walkthrough) lists what will break before you touch anything.
4. **Let a tool make the mechanical fixes** (Rector), then read every change it made.
5. **Fix the rest by hand, one kind of problem at a time**, running the tests after each.
6. **Check your Composer packages.** Old or abandoned ones are often the real blocker.
7. **Turn deprecation warnings back on** and fix what shows up. Today's warning is the next version's error.
8. **Switch the server**, with error display off and error logging on.

## The app

Customers, products, orders, a printable HTML invoice and an admin login. Plain
PHP pages, PDO and MySQL, a few helper classes, `require_once` everywhere. The
demo database has 5,000 orders. Details: [legacy-app/README.md](legacy-app/README.md).

It was written with the upgrade blockers that real apps of that era had:
`each()`, `create_function()`, `$name{0}`, a PHP 4 constructor, static calls to
instance methods, objects given properties their class never declared,
`FILTER_SANITIZE_STRING`, an `Iterator` without return types, `null` reaching
string functions, `strftime()`, `"${var}"`, an abandoned Composer package that
only allows PHP 7, and one page that runs a query per order.

Run it with `docker compose up` from this folder. At the starting tag you get
PHP 7.4 on <http://localhost:8074> and PHP 8.3 on <http://localhost:8083>; at the
end, PHP 8.3 on port 8083. Sign in as `admin@example.com` / `secret`.

## The steps

Tests are the 15 (later 16) PHPUnit tests from step 1, run on PHP 8.3.

| Step | Tag and diff | What happened | Tests on PHP 8.3 |
|---|---|---|---|
| 0 | [`v0-php72-original`](https://github.com/alihassan/php8-upgrade-kit/tree/v0-php72-original/walkthrough) | The app as it shipped. Works on PHP 7.4, fatal errors on every page on 8.3. | no tests yet |
| 1 | [`v1-safety-net`](https://github.com/alihassan/php8-upgrade-kit/compare/v0-php72-original...v1-safety-net) | Characterization tests: every page over HTTP, plus invoice totals. | fail: 9 errors, 3 failures |
| 2 | [`v2-checker-report`](https://github.com/alihassan/php8-upgrade-kit/compare/v1-safety-net...v2-checker-report) | php8-check report: 9 fatal, 24 deprecated, 1 behavior change. | unchanged |
| 3 | [`v3-static-analysis`](https://github.com/alihassan/php8-upgrade-kit/compare/v2-checker-report...v3-static-analysis) | PHPCompatibility: 4 errors, 8 warnings. PHPStan can't parse the file with `$name{0}`. | unchanged |
| 4 | [`v4-rector`](https://github.com/alihassan/php8-upgrade-kit/compare/v3-static-analysis...v4-rector) | Rector's PHP 8.3 set changes 17 files. | fail: 8 errors, 3 failures |
| 5a | [`v5a-removed-functions`](https://github.com/alihassan/php8-upgrade-kit/compare/v4-rector...v5a-removed-functions) | Static `Auth` methods, `date()` for `strftime()`, `{$var}`, no `FILTER_SANITIZE_STRING`. | **pass** (15) |
| 5b | [`v5b-dynamic-properties`](https://github.com/alihassan/php8-upgrade-kit/compare/v5a-removed-functions...v5b-dynamic-properties) | `Order` declares the 5 properties the repository sets. | pass |
| 5c | [`v5c-return-types`](https://github.com/alihassan/php8-upgrade-kit/compare/v5b-dynamic-properties...v5c-return-types) | Return types on the 6 `Iterator`/`Countable` methods. | pass |
| 5d | [`v5d-null-handling`](https://github.com/alihassan/php8-upgrade-kit/compare/v5c-return-types...v5d-null-handling) | Deprecations switched on; nulls fixed, including one only the tests found. | pass (16, all errors on) |
| 5e | [`v5e-composer`](https://github.com/alihassan/php8-upgrade-kit/compare/v5d-null-handling...v5e-composer) | `zendframework/zend-escaper` replaced by `laminas/laminas-escaper`; PHPUnit 9.6. | pass |
| 6 | [`v6-n-plus-one`](https://github.com/alihassan/php8-upgrade-kit/compare/v5e-composer...v6-n-plus-one) | Orders page: one query instead of 10,001; index on `order_lines.order_id`. | pass |
| 7 | [`v7-php83`](https://github.com/alihassan/php8-upgrade-kit/compare/v6-n-plus-one...v7-php83) | Docker runs PHP 8.3 only, production error settings. php8-check: 0 / 0 / 0. | pass |

CI ([`.github/workflows/walkthrough.yml`](../.github/workflows/walkthrough.yml))
re-proves the start and the end on every push: the original code passes on PHP
7.4 and fails on 8.3, the finished code passes on 8.3, and `docker compose up`
serves the app at both tags.

### 1. A safety net before touching anything

[`tests/PagesTest.php`](legacy-app/tests/PagesTest.php) signs in and loads every
page through PHP's built-in web server, against a 60-order database that is
generated the same way every time. It checks real output: the dashboard counts,
the 20-per-page customer list, the order total on the orders page
(`$325,714.71`), the lines on order 1 sorted by SKU, and the invoice subtotal,
tax and total. Every page is also checked for PHP error text.
[`tests/InvoiceTotalsTest.php`](legacy-app/tests/InvoiceTotalsTest.php) pins the
rounding rules.

These are *characterization* tests. They don't say what the app should do;
they record what it does. That is exactly what an upgrade needs, because the
goal is "same behavior, newer PHP". They pass on PHP 7.4 and fail on PHP 8.3.

### 2. Scan with php8-check

[`reports/01-before.md`](reports/01-before.md), produced by
[`scripts/check.sh`](scripts/check.sh): 9 fatal, 24 deprecated and 1 behavior
change across 26 files, a "Medium" effort band, and one Composer package
(`zendframework/zend-escaper` 2.6.1) that requires `php ^5.6 || ^7.0` and was
abandoned in favour of `laminas/laminas-escaper`.

### 3. PHPCompatibility and PHPStan

Both live in [`tools/`](tools/) with their own `composer.json`, so they never
mix with the app's dependencies. PHPCompatibility is pinned to `10.0.0-alpha2`
because its last stable release, 9.3.5, came out in 2019 and knows nothing about
PHP 8.

- [`reports/03-phpcompatibility.txt`](reports/03-phpcompatibility.txt): 4 errors, 8 warnings.
- [`reports/03-phpstan.txt`](reports/03-phpstan.txt): one error, then it stops. PHPStan's parser can't read `$name{0}`, so it analyses nothing else. On old code, syntax fixes come before deep static analysis.

### 4. Rector

[`tools/rector.php`](tools/rector.php) uses the PHP 8.3 set and nothing else.
The full log is in [`reports/04-rector.txt`](reports/04-rector.txt), and
[`reports/04-after-rector.md`](reports/04-after-rector.md) is php8-check's view
afterwards (5 fatal, 22 deprecated).

**What Rector fixed:** `each()` to `foreach`, `create_function()` to an arrow
function, `$name{0}` to `$name[0]`, `(real)` to `(float)`, the PHP 4
constructor to `__construct`, and `get_class()` to `self::class`. It also
rewrote a lot of style (short arrays, `??`, promoted properties, `never`), which
means the code needs PHP 8.1+ from this commit on.

**What Rector did not fix:**

- The 5 static calls such as `Auth::check()`. Rector added `public` to the methods but left them non-static, so every page still died with "Non-static method Auth::check() cannot be called statically".
- The 6 dynamic properties on `Order`.
- The 6 `Iterator`/`Countable` methods without return types.
- The 4 uses of `FILTER_SANITIZE_STRING`.
- The 4 places where `null` can reach `trim()` or `strlen()`.
- `strftime()` and `"${prefix}"`.
- The Composer package.
- One surprise: for `money($amount, $currency = 'USD', $decimals)` it gave `$decimals` a default of `null` rather than reordering. Callers all pass 2, so behavior is the same, but read Rector's diffs, don't just accept them.

### 5. Manual fixes, one kind per commit

- **5a: fatal errors and deprecated functions.** `Auth`'s methods never used `$this`, so they became `static`. `strftime('%d %b %Y')` became `date('d M Y')`, which prints the same English dates without depending on the server's locale. `FILTER_SANITIZE_STRING` became a small `post_text()` helper that only strips tags. The old filter also turned quotes into `&#39;` before saving, so "O'Brien" was stored as "O&#39;Brien"; that bug ends here. Tests go green.
- **5b: dynamic properties.** `Order` now declares `customer_name`, `customer`, `lines`, `total` and `notes`.
- **5c: return types.** `current(): Order`, `key(): int`, `next(): void`, `rewind(): void`, `valid(): bool`, `count(): int`. This comes before null handling on purpose: once deprecations are visible, these six fire on every page and bury everything else.
- **5d: null handling, with deprecations switched on.** The app and the tests now report `E_ALL`. That surfaced two kinds of problem. The ones php8-check had already flagged (`trim($_POST['email'])` when the field is missing, `strlen()` on a missing search term) got `?? ''` or a `(string)` cast, plus a test that posts an empty login form. And one that **no static tool found**: `h()` passed `NULL` database columns (a customer's company, an order's notes) to `htmlspecialchars()` inside the escaper library. A scan can't see what's in the database; the tests could.
- **5e: Composer.** `laminas/laminas-escaper` is the same library under a new name, so the change is one line: `new Laminas\Escaper\Escaper`. Composer resolves against PHP 8.3 (`config.platform`), and PHPUnit moves from the end-of-life 8.5 line to 9.6.

### 6. The N+1 query

`orders.php` ran one query for the list, then one for the customer and one for
the line totals of each order: 10,001 queries for 5,000 orders, and each line
lookup read the whole `order_lines` table because `order_id` had no index. It
now runs one query with two joins, and
[`db/migrations/001_index_order_lines_order_id.sql`](legacy-app/db/migrations/001_index_order_lines_order_id.sql)
adds the index. `php db/migrate.php` applies it to an existing database. The
tests confirm every total is unchanged.

This isn't a PHP 8 fix, and it's in its own commit for that reason. The benchmark
below keeps the two apart.

### 7. Switch to PHP 8.3

Docker builds one PHP 8.3 image. Production settings: report everything, show
nothing, log to the container output. The app no longer forces `display_errors`
on. [`reports/02-after.md`](reports/02-after.md): **0 fatal, 0 deprecated, 0
behavior changes** for PHP 8.3. PHPCompatibility is clean
([`reports/07-phpcompatibility.txt`](reports/07-phpcompatibility.txt)). PHPStan
level 2 now runs and reports 8 "variable might not be defined" notes about
variables set in included files
([`reports/07-phpstan.txt`](reports/07-phpstan.txt)), a habit of the old code
rather than a PHP 8 problem, left for a separate cleanup.

## Who found what

| Problem | php8-check | PHPCompatibility | Rector fixed it | Showed up in the tests |
|---|---|---|---|---|
| `each()`, `create_function()`, `$name{0}`, `(real)` | yes | yes | yes | yes: the first one stopped every page |
| PHP 4 constructor | yes | no | yes | no, Rector fixed it first |
| `Auth::check()` called statically (5) | yes, heuristic | no | no | yes, after Rector |
| Optional parameter before a required one | yes | yes | changed it | no |
| `get_class()` without arguments | yes | yes | yes | no |
| `strftime()`, `"${prefix}"`, `FILTER_SANITIZE_STRING` (4) | yes | yes | no | no (hidden as deprecations until 5d) |
| `Iterator`/`Countable` return types (6) | yes | no | no | yes, once deprecations were on |
| Dynamic properties (6 assignments) | yes, heuristic | no | no | no, fixed in 5b before deprecations were on |
| `null` from request input to `trim()`/`strlen()` (4) | yes, heuristic | no | no | 1 of 4; a test now covers the login form |
| `NULL` database values to `htmlspecialchars()` | no | no | no | **yes, and only the tests** |
| Composer package that only allows PHP 7 | yes | no | no | n/a |

No single tool found everything, which is the real lesson. Scanners are fast and
cover the code paths your tests miss. Tests cover the values your scanners can't
see.

## Benchmark

[`bench.sh`](bench.sh) times the orders page at three points, so the PHP 8 gain
and the query fix don't get mixed up. These are the numbers it produced on my
machine; rerun it to get yours.

Generated by `walkthrough/bench.sh` on 2026-11-01 04:57 UTC. Rerun it to get your own numbers.

| Point | Code | PHP | SQL statements per request (MySQL counter) | Median | Fastest | Slowest | Orders value shown |
|---|---|---|---|---|---|---|---|
| Before: original code, PHP 7.4 | `v0-php72-original` | 7.4.33 | 10002 | 13.287 s | 12.173 s | 14.120 s | $31,575,751.05 |
| PHP 8.3, N+1 query not fixed yet | `v5e-composer` | 8.3.36 | 10002 | 12.817 s | 12.207 s | 14.064 s | $31,575,751.05 |
| After: finished upgrade, PHP 8.3 | `v7-php83` | 8.3.36 | 2 | 0.081 s | 0.064 s | 0.105 s | $31,575,751.05 |

Each row: 20 timed requests to `/orders.php` (5,000 orders, 17,500 order lines), after 3 warm-up requests, signed in, one request at a time.

Machine: MINGW64_NT-10.0-26300 3.4.10-bc1f6498.x86_64 x86_64; CPU: 13th Gen Intel(R) Core(TM) i5-1334U; RAM: 8 GB; database: 10.4.32-MariaDB.
Server: PHP's built-in web server (`php -S`), OPcache off, display_errors off. Not PHP-FPM, so absolute times differ from production.

What the numbers say:

- **PHP 7.4 to 8.3 alone** (rows 1 and 2, same code path, same 10,002 statements): 13.3 s to 12.8 s, about 4%. The fastest and slowest requests of the two rows overlap, so on this machine the PHP version barely matters for this page. Its time goes to the database round trips.
- **The query fix** (rows 2 and 3): 10,002 statements down to 2, and 12.8 s down to 0.08 s.
- Every row shows the same orders value, $31,575,751.05, so the faster page shows the same totals.
- An earlier run on the same laptop gave a 7.4 median of 30.0 s, with requests between 12.8 s and 30.1 s. Laptop timings move around; the statement counts don't. Run `bench.sh` on your own hardware before quoting a number.

The MySQL counter includes one statement per request beyond the page's own queries (10,001 and 1 in the code), most likely from opening the connection.

## Common things that break on shared hosting after a PHP upgrade

**A white page, or "This page isn't working".** PHP hit a fatal error and the
host hides error messages (as it should). Find the error log: on cPanel it's
**Metrics > Errors**, or a file called `error_log` in the folder of the page that
failed (often `public_html/`). On Plesk, look under **Logs** for the domain. If
you can't find it, ask the host where PHP logs errors. Don't turn
`display_errors` on for the live site: error messages can show visitors file
paths and database details. Use a staging copy.

**"Call to undefined function mysqli_connect()" (or `mb_strlen()`, `imagecreatetruecolor()`, `curl_init()`).**
Each PHP version has its own list of enabled extensions, and the new version
started with the defaults. In cPanel, open **Select PHP Version** (CloudLinux) or
**MultiPHP INI Editor** and enable what you had before. Common ones: `mysqli`,
`pdo_mysql`, `mbstring`, `intl`, `gd`, `curl`, `zip`, `soap`, `sodium`. Compare
with the old version's `phpinfo()` page if you still have it.

**A 500 error right after switching, or the browser downloads `.php` files.**
Look in `.htaccess` (in `public_html/`) for lines that pin an old PHP version.
cPanel writes a block like this:

```apache
# php -- BEGIN cPanel-generated handler, do not edit
<IfModule mime_module>
  AddHandler application/x-httpd-ea-php72 .php .php7 .phtml
</IfModule>
# php -- END cPanel-generated handler, do not edit
```

If the host removed PHP 7.2, that line points to nothing. Set the version again in
**MultiPHP Manager** (which rewrites the block) or change `ea-php72` to the new
version. Also look for `php_value` or `php_flag` lines: on hosts that run PHP as
PHP-FPM they cause a 500, and the settings belong in a `.user.ini` file instead.

**"Your Composer dependencies require a PHP version ..." or `composer install` fails.**
A package in `vendor/` doesn't allow the new PHP. That was step 5e above. The
[php8-check](https://hassan.im/php8-check/?utm_source=github&utm_medium=walkthrough)
Composer check names the package and the lowest version that supports your target.

**Cron jobs still fail after the site works.** Scheduled tasks often call a
different PHP binary than the website, for example `/usr/local/bin/php` instead of
`/opt/cpanel/ea-php83/root/usr/bin/php`. Check the command in **Cron Jobs**.

**The site works, but the error log grows fast.** Those are usually deprecation
notices, like step 5c and 5d here. They don't break anything today. Fix them
before the next major version, where many become errors.

## Run it yourself

With Docker, from this folder: `docker compose up`.

Without Docker you need PHP (7.4 for the starting tags, 8.3 for the rest) with
`pdo_mysql`, and a MySQL or MariaDB server:

```sh
cd legacy-app
composer install
DB_HOST=127.0.0.1 DB_USER=root DB_PASS= vendor/bin/phpunit       # tests build their own invoicer_test database
DB_HOST=127.0.0.1 DB_USER=root DB_PASS= php db/setup.php          # the 5,000-order demo database
php -S 127.0.0.1:8000 -t public
```

To look at any step: `git checkout v4-rector -- walkthrough` (then
`git checkout main -- walkthrough` to come back).

Reports: `scripts/check.sh` (php8-check) and `scripts/static-analysis.sh`
(PHPCompatibility and PHPStan, needs PHP 8.1+).
