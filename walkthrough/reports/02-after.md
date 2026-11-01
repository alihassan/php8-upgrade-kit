# Invoicer: PHP 8.3 check after the upgrade

**0 fatal, 0 deprecated, 0 behavior changes for PHP 8.3** across 28 files.

Rough effort: **None** (0 points). Points = 3 × fatal + 2 × behavior change + 1 × deprecated. Small: up to 25 points. Medium: 26 to 120. Large: over 120. It counts findings, not how hard each fix is, so treat it as a first guess.

Findings marked *(heuristic)* come from a best guess and can be wrong. Check them by hand.

## Composer packages

composer.json requires `php: ^8.1`, which allows PHP 8.3.

| Package | Current | PHP constraint | Supports 8.3? | Lowest version that does | Abandoned |
|---|---|---|---|---|---|
| laminas/laminas-escaper | 2.18.0 | `~8.2.0 \|\| ~8.3.0 \|\| ~8.4.0 \|\| ~8.5.0` | yes | 2.18.0 | no |
| doctrine/instantiator (dev) | 2.0.0 | `^8.1` | yes | 2.0.0 | no |
| myclabs/deep-copy (dev) | 1.14.0 | `^8.0` | yes | 1.14.0 | no |
| nikic/php-parser (dev) | v5.9.0 | `>=7.4` | yes | v5.9.0 | no |
| phar-io/manifest (dev) | 2.0.4 | `^7.2 \|\| ^8.0` | yes | 2.0.4 | no |
| phar-io/version (dev) | 3.2.1 | `^7.2 \|\| ^8.0` | yes | 3.2.1 | no |
| phpunit/php-code-coverage (dev) | 9.2.32 | `>=7.3` | yes | 9.2.32 | no |
| phpunit/php-file-iterator (dev) | 3.0.6 | `>=7.3` | yes | 3.0.6 | no |
| phpunit/php-invoker (dev) | 3.1.1 | `>=7.3` | yes | 3.1.1 | no |
| phpunit/php-text-template (dev) | 2.0.4 | `>=7.3` | yes | 2.0.4 | no |
| phpunit/php-timer (dev) | 5.0.3 | `>=7.3` | yes | 5.0.3 | no |
| phpunit/phpunit (dev) | 9.6.38 | `>=7.3` | yes | 9.6.38 | no |
| sebastian/cli-parser (dev) | 1.0.2 | `>=7.3` | yes | 1.0.2 | no |
| sebastian/code-unit (dev) | 1.0.8 | `>=7.3` | yes | 1.0.8 | no |
| sebastian/code-unit-reverse-lookup (dev) | 2.0.3 | `>=7.3` | yes | 2.0.3 | no |
| sebastian/comparator (dev) | 4.0.10 | `>=7.3` | yes | 4.0.10 | no |
| sebastian/complexity (dev) | 2.0.3 | `>=7.3` | yes | 2.0.3 | no |
| sebastian/diff (dev) | 4.0.6 | `>=7.3` | yes | 4.0.6 | no |
| sebastian/environment (dev) | 5.1.5 | `>=7.3` | yes | 5.1.5 | no |
| sebastian/exporter (dev) | 4.0.9 | `>=7.3` | yes | 4.0.9 | no |
| sebastian/global-state (dev) | 5.0.8 | `>=7.3` | yes | 5.0.8 | no |
| sebastian/lines-of-code (dev) | 1.0.4 | `>=7.3` | yes | 1.0.4 | no |
| sebastian/object-enumerator (dev) | 4.0.4 | `>=7.3` | yes | 4.0.4 | no |
| sebastian/object-reflector (dev) | 2.0.4 | `>=7.3` | yes | 2.0.4 | no |
| sebastian/recursion-context (dev) | 4.0.7 | `>=7.3` | yes | 4.0.7 | no |
| sebastian/resource-operations (dev) | 3.0.4 | `>=7.3` | yes | 3.0.4 | no |
| sebastian/type (dev) | 3.2.1 | `>=7.3` | yes | 3.2.1 | no |
| sebastian/version (dev) | 3.0.2 | `>=7.3` | yes | 3.0.2 | no |
| theseer/tokenizer (dev) | 1.3.1 | `^7.2 \|\| ^8.0` | yes | 1.3.1 | no |

