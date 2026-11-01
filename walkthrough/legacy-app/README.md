# Invoicer (the legacy app)

A small order and invoice app: customers, products, orders, printable HTML
invoices and an admin login. It is written the way plenty of PHP 7 apps were
written around 2017: plain PHP pages, PDO and MySQL, a few helper classes, and
`require_once` instead of an autoloader.

It runs on PHP 7.2 to 7.4. At tag `v0-php72-original` it does **not** run on
PHP 8, on purpose. The [walkthrough](../README.md) upgrades it to PHP 8.3 one
commit at a time.

## Run it

With Docker (from the `walkthrough/` folder):

```sh
docker compose up
```

Then open <http://localhost:8074> (PHP 7.4) or <http://localhost:8083> (PHP 8.3)
and sign in with `admin@example.com` / `secret`.

Without Docker, you need PHP with `pdo_mysql` and a MySQL or MariaDB server:

```sh
composer install
DB_HOST=127.0.0.1 DB_USER=root DB_PASS= php db/setup.php   # 5,000 demo orders
php -S 127.0.0.1:8000 -t public
```

## Settings

`config/config.php` reads `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` and
`DB_PASS` from the environment. A `config/local.php` file (not committed) can
override any value.

All code and data here were written for this repo. Names in the demo data are
made up.
