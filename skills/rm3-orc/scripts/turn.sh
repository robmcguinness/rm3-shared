#!/usr/bin/env bash
# turn.sh [--dry-run] <agent-name> <tag> <template> [KEY=VALUE ...]
# turn.sh --resume        <agent-name> <tag> <template> [KEY=VALUE ...]
#
# One worker turn, atomically: render assets/prompts/<template>.md (every
# {{KEY}} replaced; {{TAG}} is filled for you), submit it with `herdr agent
# prompt --wait` (never a separate `agent wait`, which can miss the transition
# and hang), then read the agent and print the sentinel line carrying <tag>
# followed by the post-turn facts (see below). --dry-run prints the rendered
# prompt and sends nothing.
#
# --resume sends nothing: it waits for the same tag on the agent's pane with
# `pane wait-output` (which also matches output that already scrolled past),
# then prints the same lines. Use it after exit 3 `timeout` or exit 4, as many
# times as needed, always in the foreground.
#
# Output on exit 0:
#   RM3-ORC[<tag>]: SUCCESS|FAIL|NOTHING-TO-REVIEW|REVIEW-BLOCKED — ...   (joined if the pane wrapped it)
#   HEAD=<short hash>
#   TREE=clean | TREE=<N> paths   (porcelain lines follow, indented)
#   CHECKLIST=<count-tasks.sh output>   (when PLANS_DIR, CODENAME and UNIT were given)
#
# Exit codes:
#   0  sentinel with this tag found
#   1  usage error, an unfilled {{SLOT}}, or PLANS_DIR is not the codename
#      folder (no <PLANS_DIR>/<CODENAME>-description.md; checked in every mode,
#      so --dry-run catches it before a worker is prompted)
#   3  herdr refused or lost the wait; the error code is on stdout
#      (agent_blocked, agent_prompt_stalled, timeout, or another herdr code)
#   4  the wait settled but no sentinel carries this tag
#
# TIMEOUT (ms) overrides the default 540000 (9 min): under the 10 min cap of a
# foreground tool call, so the call returns instead of being killed.
set -uo pipefail
MODE=send
case "${1:-}" in
  --dry-run) MODE=dry; shift ;;
  --resume)  MODE=resume; shift ;;
esac
[ $# -ge 3 ] || { echo "usage: turn.sh [--dry-run|--resume] <agent> <tag> <template> [KEY=VALUE ...]" >&2; exit 1; }
AGENT=$1; TAG=$2; TPL=$3; shift 3
DIR=$(cd "$(dirname "$0")/.." && pwd)
FILE="$DIR/assets/prompts/$TPL.md"
[ -f "$FILE" ] || { echo "no template $FILE" >&2; exit 1; }
TIMEOUT=${TIMEOUT:-540000}

TEXT=$(cat "$FILE")
TEXT=${TEXT//"{{TAG}}"/$TAG}
PLANS_DIR=""; CODENAME=""; UNIT=""
for kv in "$@"; do
  KEY=${kv%%=*}; VAL=${kv#*=}
  TEXT=${TEXT//"{{$KEY}}"/$VAL}
  case "$KEY" in PLANS_DIR) PLANS_DIR=$VAL ;; CODENAME) CODENAME=$VAL ;; UNIT) UNIT=$VAL ;; esac
done
if [ "$MODE" != resume ]; then
  if MISSING=$(grep -o '{{[A-Z_]*}}' <<<"$TEXT" | head -1) && [ -n "$MISSING" ]; then
    echo "unfilled slot $MISSING in $TPL" >&2; exit 1
  fi
fi
# PLANS_DIR must be the codename folder: the templates append
# <CODENAME>-description.md to it. A plan-root PLANS_DIR renders a prompt with
# paths that do not exist and the worker blocks on them.
if [ -n "$PLANS_DIR" ] && [ -n "$CODENAME" ]; then
  for f in "$PLANS_DIR/$CODENAME-description.md" ${UNIT:+"$PLANS_DIR/$CODENAME-unit-$UNIT.md"}; do
    if [ ! -f "$f" ]; then
      echo "PLANS_DIR must be the codename folder: no $f" >&2
      [ -f "$PLANS_DIR/$CODENAME/$CODENAME-description.md" ] && echo "did you mean PLANS_DIR=$PLANS_DIR/$CODENAME" >&2
      exit 1
    fi
  done
fi
[ "$MODE" = dry ] && { printf '%s\n' "$TEXT"; exit 0; }

PATTERN="RM3-ORC\[$TAG\]: (SUCCESS|FAIL|NOTHING-TO-REVIEW|REVIEW-BLOCKED)"
if [ "$MODE" = send ]; then
  OUT=$(herdr agent prompt "$AGENT" "$TEXT" --wait --timeout "$TIMEOUT" 2>&1); RC=$?
else
  PANE=$(herdr agent get "$AGENT" 2>/dev/null | jq -r '.result.agent.pane_id // .result.pane_id // empty')
  [ -n "$PANE" ] || { echo "cannot resolve the pane of $AGENT"; exit 3; }
  OUT=$(herdr pane wait-output --regex "$PATTERN" --source recent-unwrapped --timeout "$TIMEOUT" "$PANE" 2>&1); RC=$?
fi
if [ "$RC" -ne 0 ]; then
  CODE=$(jq -r '.error.code // empty' <<<"$OUT" 2>/dev/null)
  echo "${CODE:-herdr_error: $OUT}"; exit 3
fi

# The last field each template's sentinel must carry. A TUI can hard-wrap the
# sentinel over two or three rows; recent-unwrapped joins soft wraps only.
case "$TPL" in
  review) LAST='nits:|blocking|NOTHING-TO-REVIEW|REVIEW-BLOCKED' ;;
  commit) LAST='committed|FAIL' ;;
  *)      LAST='lint:|NOTHING-TO-REVIEW|REVIEW-BLOCKED' ;;
esac
LINE=""
for n in 40 200; do   # widen only when the tag is missing from the short tail
  LINE=$(herdr agent read "$AGENT" --source recent-unwrapped --lines "$n" \
    | PAT="$PATTERN" LAST="$LAST" awk '
        BEGIN { pat=ENVIRON["PAT"]; last=ENVIRON["LAST"] }   # ENVIRON: -v would eat the backslashes
        $0 ~ pat { line=$0; joins=0; found=1; next }
        found && joins < 2 && $0 !~ /^[[:space:]]*$/ && line !~ last { line=line " " $0; joins++; next }
        { found=0 }
        END { if (line != "") print line }')
  [ -n "$LINE" ] && break
done
[ -n "$LINE" ] || exit 4
printf '%s\n' "$LINE"

# Post-turn facts, so the orchestrator needs no separate git or count call.
echo "HEAD=$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
PORC=$(git status --porcelain 2>/dev/null)
if [ -z "$PORC" ]; then echo "TREE=clean"
else echo "TREE=$(printf '%s\n' "$PORC" | grep -c .) paths"; printf '%s\n' "$PORC" | sed 's/^/  /'; fi
if [ -n "$PLANS_DIR" ] && [ -n "$CODENAME" ] && [ -n "$UNIT" ]; then
  UF="$PLANS_DIR/$CODENAME-unit-$UNIT.md"
  [ -f "$UF" ] && echo "CHECKLIST=$("$DIR/scripts/count-tasks.sh" "$UF")"
fi
exit 0
