#!/usr/bin/env bash
# Time the orders page (5,000 orders) at three points in the walkthrough:
#
#   v0-php72-original on PHP 7.4   the app as it was
#   v5e-composer      on PHP 8.3   every compatibility fix, N+1 query still there
#   v7-php83          on PHP 8.3   the finished upgrade
#
# For each one it checks out the tag into a temporary git worktree, installs
# Composer packages, loads the same deterministic demo database, starts PHP's
# built-in web server, signs in, makes 3 warm-up requests and then RUNS timed
# requests, and reports the median. It also counts the SQL queries one request
# makes, from MySQL's own "Questions" counter.
#
# Usage (from anywhere in the repo):
#   PHP74_BIN=/path/to/php7.4 PHP83_BIN=/path/to/php8.3 walkthrough/bench.sh
#
# Settings (environment variables):
#   PHP74_BIN, PHP83_BIN   PHP binaries with pdo_mysql (default: php7.4, php8.3)
#   COMPOSER_PHAR          composer.phar to run with each PHP (default: found on PATH)
#   DB_HOST DB_PORT DB_USER DB_PASS   MySQL or MariaDB server (default: 127.0.0.1 3306 root "")
#   RUNS                   timed requests per point (default: 20)
#   OUT                    result file (default: walkthrough/bench/results.md)
#
# Needs: git, curl, awk. The built-in server is not PHP-FPM behind nginx, and
# OPcache is off, so absolute numbers will differ from a real server. All three
# points use the same server, database and machine, so they compare fairly.
set -euo pipefail

repo="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
here="$repo/walkthrough"
work="$here/bench/.work"
out="${OUT:-$here/bench/results.md}"
runs="${RUNS:-20}"
php74="${PHP74_BIN:-php7.4}"
php83="${PHP83_BIN:-php8.3}"
composer="${COMPOSER_PHAR:-$(command -v composer.phar || command -v composer)}"
export DB_HOST="${DB_HOST:-127.0.0.1}" DB_PORT="${DB_PORT:-3306}" DB_USER="${DB_USER:-root}" DB_PASS="${DB_PASS:-}"
export DB_NAME=invoicer_bench
port=8900

mkdir -p "$work" "$(dirname "$out")"
cleanup() {
  [ -n "${server_pid:-}" ] && kill "$server_pid" 2>/dev/null || true
  for d in "$work"/*/; do [ -d "$d" ] && git -C "$repo" worktree remove --force "$d" 2>/dev/null || true; done
}
trap cleanup EXIT

# Run SQL through PHP's PDO, so the script needs no mysql client.
sql() {
  "$php83" -r '
    $p = new PDO("mysql:host=" . getenv("DB_HOST") . ";port=" . getenv("DB_PORT"), getenv("DB_USER"), getenv("DB_PASS"));
    echo $p->query($argv[1])->fetchColumn(1 === (int) ($argv[2] ?? 0) ? 1 : 0);
  ' "$1" "${2:-0}"
}
questions() { sql "SHOW GLOBAL STATUS LIKE 'Questions'" 1; }

median() { sort -n | awk '{a[NR]=$1} END {if (NR%2) printf "%.3f", a[(NR+1)/2]; else printf "%.3f", (a[NR/2]+a[NR/2+1])/2}'; }

declare -a rows
measure() {
  local tag="$1" php="$2" label="$3"
  port=$((port + 1)) # a fresh port per point, so a server that is still shutting down can not get in the way
  local dir="$work/$tag" jar="$work/$tag.cookies" base="http://127.0.0.1:$port"
  echo "== $label ($tag)" >&2
  git -C "$repo" worktree add --force --detach "$dir" "$tag" >/dev/null 2>&1
  local app="$dir/walkthrough/legacy-app"
  (cd "$app" && "$php" "$composer" install --no-interaction --no-progress --quiet)
  (cd "$app" && "$php" db/setup.php) 2>&1 | sed 's/^/   /' >&2

  "$php" -d display_errors=0 -d error_reporting=0 -S "127.0.0.1:$port" -t "$app/public" >/dev/null 2>&1 &
  server_pid=$!
  local up=
  for _ in $(seq 100); do curl -s -o /dev/null "$base/login.php" && { up=1; break; }; sleep 0.1; done
  [ -n "$up" ] || { echo "PHP server for $tag did not start on port $port" >&2; exit 1; }
  curl -s -c "$jar" -b "$jar" -o /dev/null -d 'email=admin@example.com&password=secret' "$base/login.php"

  # Check the page really works before timing it.
  local body
  body="$(curl -s -c "$jar" -b "$jar" "$base/orders.php")"
  grep -q 'id="order-total">5000<' <<<"$body" || { echo "orders page did not list 5000 orders for $tag" >&2; exit 1; }
  local total
  total="$(grep -o 'id="orders-value">[^<]*' <<<"$body" | sed 's/.*>//')"

  # Reading the counter costs queries too (its own connection), so measure that first and subtract it.
  local before after overhead
  before="$(questions)"; after="$(questions)"; overhead=$((after - before))
  before="$(questions)"
  curl -s -c "$jar" -b "$jar" -o /dev/null "$base/orders.php"
  after="$(questions)"
  local queries=$((after - before - overhead))

  for _ in 1 2 3; do curl -s -c "$jar" -b "$jar" -o /dev/null "$base/orders.php"; done
  local times
  times="$(for _ in $(seq "$runs"); do curl -s -c "$jar" -b "$jar" -o /dev/null -w '%{time_total}\n' "$base/orders.php"; done)"
  local med min max
  med="$(median <<<"$times")"
  min="$(sort -n <<<"$times" | head -1)"
  max="$(sort -n <<<"$times" | tail -1)"
  echo "   median ${med}s over $runs requests, $queries queries" >&2

  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true
  server_pid=
  rows+=("| $label | \`$tag\` | $("$php" -r 'echo PHP_VERSION;') | $queries | $med s | $(printf '%.3f' "$min") s | $(printf '%.3f' "$max") s | $total |")
}

measure v0-php72-original "$php74" "Before: original code, PHP 7.4"
measure v5e-composer "$php83" "PHP 8.3, N+1 query not fixed yet"
measure v7-php83 "$php83" "After: finished upgrade, PHP 8.3"

os="$(uname -srm)"
cpu="$( (grep -m1 'model name' /proc/cpuinfo 2>/dev/null | cut -d: -f2) || true)"
[ -n "$cpu" ] || cpu="$(powershell.exe -NoProfile -Command '(Get-CimInstance Win32_Processor).Name' 2>/dev/null | tr -d '\r' || true)"
[ -n "$cpu" ] || cpu="$(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo unknown)"
mem="$( (awk '/MemTotal/ {printf "%.0f GB", $2/1048576}' /proc/meminfo 2>/dev/null) || true)"
[ -n "$mem" ] || mem="$(powershell.exe -NoProfile -Command '[math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB)' 2>/dev/null | tr -d '\r' | sed 's/$/ GB/' || echo unknown)"
db="$(sql 'SELECT VERSION()')"

{
  echo "# Orders page benchmark"
  echo
  echo "Generated by \`walkthrough/bench.sh\` on $(date -u '+%Y-%m-%d %H:%M UTC'). Rerun it to get your own numbers."
  echo
  echo "| Point | Code | PHP | SQL statements per request (MySQL counter) | Median | Fastest | Slowest | Orders value shown |"
  echo "|---|---|---|---|---|---|---|---|"
  printf '%s\n' "${rows[@]}"
  echo
  echo "Each row: $runs timed requests to \`/orders.php\` (5,000 orders, 17,500 order lines), after 3 warm-up requests, signed in, one request at a time."
  echo
  echo "Machine: $os; CPU: ${cpu# }; RAM: $mem; database: $db."
  echo "Server: PHP's built-in web server (\`php -S\`), OPcache off, display_errors off. Not PHP-FPM, so absolute times differ from production."
} > "$out"
cat "$out"
