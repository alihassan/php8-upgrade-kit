#!/usr/bin/env bash
# Run PHPCompatibility (PHP_CodeSniffer) and PHPStan against the legacy app.
#   walkthrough/scripts/static-analysis.sh 03
# writes reports/03-phpcompatibility.txt and reports/03-phpstan.txt
# PHP_BIN picks the PHP binary (default: php). The tools need PHP 8.1+.
set -uo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
prefix="${1:?usage: static-analysis.sh <report prefix>}"
php="${PHP_BIN:-php}"
compat="$here/reports/$prefix-phpcompatibility.txt"
stan="$here/reports/$prefix-phpstan.txt"

cd "$here/tools"
[ -d vendor ] || composer install --no-interaction --no-progress

"$php" vendor/bin/phpcs --standard=phpcs.xml --report-width=120 --no-colors --basepath="$here/legacy-app" > "$compat"
echo "PHPCompatibility exit code: $?" >> "$compat"

"$php" vendor/bin/phpstan analyse -c phpstan.neon --no-progress --no-ansi --error-format=table --memory-limit=1G > "$stan" 2>&1
echo "PHPStan exit code: $?" >> "$stan"

# Same paths on Windows and Linux, so reports diff cleanly.
sed -i -e '/^FILE: /s#\\#/#g' -e '/legacy-app/s#\\#/#g' "$compat" "$stan"
tail -n 3 "$compat" "$stan"
