#!/usr/bin/env bash
# turn.sh [--dry-run] <agent-name> <tag> <template> [KEY=VALUE ...]
#
# One worker turn, atomically: render assets/prompts/<template>.md (every
# {{KEY}} replaced; {{TAG}} is filled for you), submit it with `herdr agent
# prompt --wait` (never a separate `agent wait`, which can miss the transition
# and hang), then read the agent and print the single sentinel line that carries
# <tag>. --dry-run prints the rendered prompt and sends nothing.
#
# Exit codes:
#   0  sentinel with this tag found; the line is on stdout
#   1  usage error or an unfilled {{SLOT}}
#   3  herdr refused or lost the wait; the error code is on stdout
#      (agent_blocked, agent_prompt_stalled, timeout, or another herdr code)
#   4  the wait settled but no sentinel carries this tag; recover with the
#      tagged `herdr pane wait-output` from the command reference
#
# TIMEOUT (ms) overrides the default 1800000.
set -uo pipefail
DRY=0; [ "${1:-}" = "--dry-run" ] && { DRY=1; shift; }
[ $# -ge 3 ] || { echo "usage: turn.sh [--dry-run] <agent> <tag> <template> [KEY=VALUE ...]" >&2; exit 1; }
AGENT=$1; TAG=$2; TPL=$3; shift 3
DIR=$(cd "$(dirname "$0")/.." && pwd)
FILE="$DIR/assets/prompts/$TPL.md"
[ -f "$FILE" ] || { echo "no template $FILE" >&2; exit 1; }

TEXT=$(cat "$FILE")
TEXT=${TEXT//"{{TAG}}"/$TAG}
for kv in "$@"; do
  KEY=${kv%%=*}; VAL=${kv#*=}
  TEXT=${TEXT//"{{$KEY}}"/$VAL}
done
if MISSING=$(grep -o '{{[A-Z_]*}}' <<<"$TEXT" | head -1) && [ -n "$MISSING" ]; then
  echo "unfilled slot $MISSING in $TPL" >&2; exit 1
fi
[ "$DRY" -eq 1 ] && { printf '%s\n' "$TEXT"; exit 0; }

OUT=$(herdr agent prompt "$AGENT" "$TEXT" --wait --timeout "${TIMEOUT:-1800000}" 2>&1); RC=$?
if [ "$RC" -ne 0 ]; then
  CODE=$(jq -r '.error.code // empty' <<<"$OUT" 2>/dev/null)
  echo "${CODE:-herdr_error: $OUT}"; exit 3
fi

PATTERN="RM3-ORC\[$TAG\]: (SUCCESS|FAIL|NOTHING-TO-REVIEW|REVIEW-BLOCKED)"
for n in 40 200; do   # widen only when the tag is missing from the short tail
  LINE=$(herdr agent read "$AGENT" --source recent-unwrapped --lines "$n" | grep -E "$PATTERN" | tail -1)
  [ -n "$LINE" ] && { printf '%s\n' "$LINE"; exit 0; }
done
exit 4
