// One-off generator for test/fixtures/<rule-id>/{match,ok}.php.
// The fixtures are committed; edit them directly from now on.
import fs from 'node:fs';

const F = {
  'removed-each': [`<?php\nwhile (list($k, $v) = each($items)) { echo $k; }`, `<?php\nforeach ($items as $k => $v) { echo $k; }\n$it->each();`],
  'removed-create-function': [`<?php\n$f = create_function('$a', 'return $a * 2;');`, `<?php\n$f = function ($a) { return $a * 2; };`],
  'removed-money-format': [`<?php\necho money_format('%.2n', $total);`, `<?php\necho number_format($total, 2);`],
  'removed-ereg': [`<?php\nif (ereg('^[0-9]+$', $zip)) {}\n$p = split(',', $csv);`, `<?php\nif (preg_match('/^[0-9]+$/', $zip)) {}\n$p = explode(',', $csv);`],
  'removed-mysql': [`<?php\n$r = mysql_query('SELECT 1');`, `<?php\n$r = mysqli_query($db, 'SELECT 1');`],
  'removed-magic-quotes': [`<?php\nif (get_magic_quotes_gpc()) { $n = stripslashes($n); }`, `<?php\n$n = $_POST['n'] ?? '';`],
  'removed-restore-include-path': [`<?php\nrestore_include_path();`, `<?php\n$old = set_include_path('/lib');\nset_include_path($old);`],
  'removed-fgetss': [`<?php\n$line = fgetss($h);`, `<?php\n$line = strip_tags(fgets($h));`],
  'removed-filter-magic-quotes': [`<?php\n$x = filter_var($in, FILTER_SANITIZE_MAGIC_QUOTES);`, `<?php\n$x = filter_var($in, FILTER_SANITIZE_ADD_SLASHES);`],
  'removed-autoload': [`<?php\nfunction __autoload($c) { require "$c.php"; }`, `<?php\nspl_autoload_register(function ($c) { require "$c.php"; });`],
  'removed-real-cast': [`<?php\n$p = (real) $price;`, `<?php\n$p = (float) $price;`],
  'removed-unset-cast': [`<?php\n$t = (unset) $t;`, `<?php\n$t = null;\nunset($u);`],
  'curly-offset': [`<?php\n$first = $name{0};`, `<?php\n$first = $name[0];\n$s = "{$name[0]}";`],
  'nested-ternary': [`<?php\n$l = $s == 1 ? 'a' : $s == 2 ? 'b' : 'c';`, `<?php\n$l = $s == 1 ? 'a' : ($s == 2 ? 'b' : 'c');\n$m = $a ?: $b ?: $c;\n$n = ($a ? 1 : 2) ? 3 : 4;`],
  'static-call-non-static': [
    `<?php\nclass Auth { function check() { return true; } }\nif (Auth::check()) {}`,
    `<?php\nclass Auth { static function check() { return true; } function user() { return 1; } }\nif (Auth::check()) {}\nclass Admin extends Auth { function user() { return Auth::user(); } }\nVendorThing::run();`,
  ],
  'implode-reverse-order': [`<?php\necho implode($tags, ', ');`, `<?php\necho implode(', ', $tags);\necho implode($tags);`],
  'define-case-insensitive': [`<?php\ndefine('SITE', 'Acme', true);`, `<?php\ndefine('SITE', 'Acme');\ndefine('X', 1, false);`],
  'php-errormsg': [`<?php\nif (!$ok) echo $php_errormsg;`, `<?php\nif (!$ok) echo error_get_last()['message'];`],
  'php4-constructor': [
    `<?php\nclass Invoice { function Invoice($o) { $this->o = $o; } }`,
    `<?php\nclass Invoice { function __construct($o) {} function Invoice() {} }\nnamespace App;\nclass Report { function report() {} }`,
  ],
  'reserved-match': [`<?php\nfunction match($a, $b) { return $a === $b; }`, `<?php\n$r = match ($x) { 1 => 'one', default => 'other' };\nclass P { public function match($a) {} }\n$p->match(1);`],
  'reserved-mixed': [`<?php\nclass Mixed {}`, `<?php\nclass MixedValue {}\nfunction f(mixed $x) {}`],
  'reserved-never': [`<?php\nclass Never {}`, `<?php\nfunction stop(): never { exit; }`],
  'reserved-legacy-type-names': [`<?php\nclass Object {}`, `<?php\nclass BaseObject {}\nfunction f(object $o) {}`],
  'string-number-comparison': [
    `<?php\nif ($status == 0 && 0 == "abc") {}\nif ($_GET['page'] == 0) {}`,
    `<?php\nif ($count == 0) {}\nif (42 == " 42") {}\nif ($a === "abc") {}\nif (1 == "1.0") {}`,
  ],
  'required-after-optional': [`<?php\nfunction price($amount, $currency = 'USD', $decimals) {}`, `<?php\nfunction price($amount, $decimals, $currency = 'USD') {}\nfunction g(Foo $x = null, $y) {}\nfunction h($a = 1, ...$rest) {}`],
  'null-to-internal': [
    `<?php\n$e = trim($_POST['email']);\n$q = $_GET['q'] ?? null;\necho strlen($q);\nfunction f($x = null) { return strtolower($x); }\necho htmlspecialchars(null);`,
    `<?php\n$e = trim($_POST['email'] ?? '');\n$q = $_GET['q'] ?? '';\necho strlen($q);\n$n = null;\n$n = 'x';\necho trim($n);\nfunction f(?string $x = null) { return strtolower((string) $x); }`,
  ],
  'tentative-return-types': [
    `<?php\nclass L implements Iterator, Countable {\n  public function current() {}\n  public function key() {}\n  public function next() {}\n  public function rewind() {}\n  public function valid() {}\n  public function count() {}\n}`,
    `<?php\nclass L implements Countable, JsonSerializable {\n  public function count(): int { return 0; }\n  #[\\ReturnTypeWillChange]\n  public function jsonSerialize() { return []; }\n}\nclass M { public function count() {} }`,
  ],
  'serializable-interface': [
    `<?php\nclass Cart implements Serializable { public function serialize() {} public function unserialize($d) {} }`,
    `<?php\nclass Cart implements Serializable {\n  public function serialize() {} public function unserialize($d) {}\n  public function __serialize(): array { return []; } public function __unserialize(array $d): void {}\n}`,
  ],
  'filter-sanitize-string': [`<?php\n$n = filter_input(INPUT_POST, 'n', FILTER_SANITIZE_STRING);`, `<?php\n$n = filter_input(INPUT_POST, 'n', FILTER_SANITIZE_SPECIAL_CHARS);`],
  strftime: [`<?php\necho strftime('%d %B %Y', $ts);`, `<?php\necho date('d F Y', $ts);`],
  'date-sunrise-sunset': [`<?php\n$r = date_sunrise(time(), SUNFUNCS_RET_TIMESTAMP, 1.0, 2.0);`, `<?php\n$r = date_sun_info(time(), 1.0, 2.0)['sunrise'];`],
  mhash: [`<?php\n$h = mhash(MHASH_MD5, $data);`, `<?php\n$h = hash('md5', $data, true);`],
  'file-binary-text': [`<?php\nfile_put_contents($p, $d, FILE_APPEND | FILE_BINARY);`, `<?php\nfile_put_contents($p, $d, FILE_APPEND);`],
  'dynamic-properties': [
    `<?php\nclass Order { public $id; function load() { $this->total = 5; } }\n$o = new Order();\n$o->customer = 'x';`,
    `<?php\nclass Order { public $id; public $total; function load() { $this->total = 5; } }\n$o = new Order();\n$o->id = 1;\n#[\\AllowDynamicProperties]\nclass Bag { function f() { $this->x = 1; } }\nclass Magic { function __set($k, $v) {} function f() { $this->y = 1; } }\nclass Child extends VendorBase { function f() { $this->z = 1; } }\n$s = new stdClass();\n$s->any = 1;\nclass P { function __construct(private int $a) { $this->a = 2; } }`,
  ],
  'utf8-encode-decode': [`<?php\n$n = utf8_encode($name);`, `<?php\n$n = mb_convert_encoding($name, 'UTF-8', 'ISO-8859-1');`],
  'dollar-brace-interpolation': [`<?php\necho "Invoice \${number} for \${c['name']}";`, `<?php\necho "Invoice {$number} for {$c['name']} and $plain";`],
  'mbstring-pseudo-encodings': [`<?php\n$h = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');`, `<?php\n$h = mb_convert_encoding($html, 'UTF-8', 'ISO-8859-1');`],
  'get-class-no-args': [`<?php\nclass A { function n() { return get_class(); } }`, `<?php\nclass A { function n() { return get_class($this) . self::class; } }`],
  'assert-options': [`<?php\nassert_options(ASSERT_ACTIVE, 1);`, `<?php\nassert($x > 0);`],
  'implicitly-nullable': [`<?php\nfunction send(Mailer $m = null) {}`, `<?php\nfunction send(?Mailer $m = null) {}\nfunction b(Mailer|null $m = null) {}\nfunction c(mixed $m = null) {}\nfunction d($m = null) {}`],
  'e-strict': [`<?php\nerror_reporting(E_ALL | E_STRICT);`, `<?php\nerror_reporting(E_ALL);`],
  'trigger-error-user-error': [`<?php\ntrigger_error('bad', E_USER_ERROR);`, `<?php\ntrigger_error('meh', E_USER_WARNING);\nthrow new RuntimeException('bad');`],
  'lcg-value': [`<?php\n$r = lcg_value();`, `<?php\n$r = mt_rand() / mt_getrandmax();`],
  'underscore-class-name': [`<?php\nclass _ {}`, `<?php\nclass Translate {}`],
};

for (const [id, [match, ok]] of Object.entries(F)) {
  const dir = `test/fixtures/${id}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/match.php`, match + '\n');
  fs.writeFileSync(`${dir}/ok.php`, ok + '\n');
}
console.log(Object.keys(F).length, 'fixture pairs');
