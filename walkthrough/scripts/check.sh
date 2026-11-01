#!/usr/bin/env bash
# Run php8-check (from tool/) against the legacy app and write a report.
#   walkthrough/scripts/check.sh reports/01-before.md "Before the upgrade"
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
out="$here/${1:?usage: check.sh <report.md> [title]}"
title="${2:-PHP 8.3 upgrade report}"
cd "$here/../tool"
[ -d node_modules ] || npm ci --silent
npx tsx src/cli.ts "$here/legacy-app" --target 8.3 --composer --title "$title" --out "$out"
