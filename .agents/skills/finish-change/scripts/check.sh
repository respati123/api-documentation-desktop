#!/usr/bin/env bash
# Runs every handoff check from AGENTS.md, keeps going after a failure, and prints one summary.
# Usage: bash .agents/skills/finish-change/scripts/check.sh [--quick]
#   --quick skips the production build.

set -u
cd "$(dirname "$0")/../../../.." || exit 1

QUICK=0
[ "${1:-}" = "--quick" ] && QUICK=1

LOG_DIR="$(mktemp -d)"
NAMES=()
RESULTS=()

run_check() {
  local name="$1"
  shift
  local log="$LOG_DIR/$name.log"
  printf '%-12s ... ' "$name"
  if "$@" >"$log" 2>&1; then
    echo "pass"
    RESULTS+=("pass")
  else
    echo "FAIL"
    RESULTS+=("FAIL")
  fi
  NAMES+=("$name")
}

has_script() {
  grep -q "\"$1\"[[:space:]]*:" package.json
}

run_check typecheck bun run typecheck
run_check lint bun run lint
run_check test bun run test
if has_script i18n-check; then
  run_check i18n-check bun run i18n-check
else
  NAMES+=("i18n-check"); RESULTS+=("missing"); printf '%-12s ... missing script\n' i18n-check
fi
if [ "$QUICK" -eq 0 ]; then
  run_check build bun run build
fi

CHANGED_UI=""
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  CHANGED_UI="$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null \
    | grep -E '^src/renderer/src/.*\.tsx$' | grep -vE '\.test\.tsx$' | sort -u)"
fi

DETECTOR=".agents/skills/impeccable/scripts/impeccable"
if [ -n "$CHANGED_UI" ] && [ -x "$DETECTOR" ]; then
  # shellcheck disable=SC2086
  run_check impeccable "$DETECTOR" detect --json $CHANGED_UI
fi

echo
echo "Summary"
FAILED=0
for i in "${!NAMES[@]}"; do
  printf '  %-12s %s\n' "${NAMES[$i]}" "${RESULTS[$i]}"
  [ "${RESULTS[$i]}" = "FAIL" ] && FAILED=1
done

if [ -n "$CHANGED_UI" ]; then
  echo
  echo "Changed UI files (check at minimum and wide window width, in id and en):"
  echo "$CHANGED_UI" | sed 's/^/  /'
fi

if [ "$FAILED" -eq 1 ]; then
  echo
  echo "Failure logs:"
  for i in "${!NAMES[@]}"; do
    if [ "${RESULTS[$i]}" = "FAIL" ]; then
      echo "----- ${NAMES[$i]} (last 40 lines) -----"
      tail -n 40 "$LOG_DIR/${NAMES[$i]}.log"
    fi
  done
fi

exit "$FAILED"
