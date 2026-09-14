#!/usr/bin/env bash
# after-commit.sh <unit-file> "<commit sentinel line>"
#
# Everything that follows a coder commit, in one call:
#   1. parse `committed <hash> — <handoff>` from the commit turn's sentinel
#   2. verify: clean tree, HEAD == <hash>, HEAD != the unit's Base
#   3. set-state.sh <unit> committed <hash>   (unit State + table row)
#   4. append `- unit NN: <handoff>` to the description's ## Decisions log
#   5. hunk session comment clear, then reset the coder and the reviewer
# Siblings come from the env file find-siblings.sh wrote
# (~/.agents/plans/<repo>/.siblings.env). A `Reset:` line under the
# description's ## Constraints and decisions outranks the env file.
#
# Exit 1 on any failed check, before any state is written. Prints one line.
set -euo pipefail
[ $# -eq 2 ] || { echo 'usage: after-commit.sh <unit-file> "<commit sentinel line>"' >&2; exit 1; }
UNIT_FILE=$1; SENTINEL=$2
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$UNIT_FILE" ] || { echo "no unit file $UNIT_FILE" >&2; exit 1; }

# 1. parse the sentinel: RM3-ORC[tag]: SUCCESS — <handoff> — committed <hash>
#    The hash is last on purpose: turn.sh joins a wrapped sentinel until it sees
#    "committed", so free text after the hash would be cut off.
HASH=$(printf '%s' "$SENTINEL" | grep -oE 'committed [0-9a-f]{7,40}' | head -1 | cut -d' ' -f2 || true)
[ -n "$HASH" ] || { echo "sentinel carries no 'committed <hash>': $SENTINEL" >&2; exit 1; }
HANDOFF=$(printf '%s' "$SENTINEL" | perl -ne 'print $1 if /SUCCESS\s*[—-]+\s*(.*?)\s*[—-]+\s*committed [0-9a-f]+/')
HANDOFF=${HANDOFF:-no handoff}
case "$HANDOFF" in "no handoff"*|"none"|"") HANDOFF="no handoff" ;; esac

# 2. verify against git
ROOT=$(git rev-parse --show-toplevel)
if [ -n "$(git status --porcelain)" ]; then
  echo "tree is dirty after the commit turn:" >&2; git status --porcelain >&2; exit 1
fi
HEAD=$(git rev-parse --short HEAD)
git merge-base --is-ancestor "$HASH" HEAD 2>/dev/null && [ "$(git rev-parse --short "$HASH")" = "$HEAD" ] \
  || { echo "HEAD is $HEAD but the sentinel says committed $HASH" >&2; exit 1; }
BASE=$(grep -m1 '^Base:' "$UNIT_FILE" | sed -E 's/^Base:[[:space:]]*//; s/[[:space:]]*<!--.*//; s/[[:space:]]*$//')
if [ -n "$BASE" ] && [ "$BASE" != none ] && [ "$(git rev-parse --short "$BASE" 2>/dev/null || echo "$BASE")" = "$HEAD" ]; then
  echo "HEAD ($HEAD) still equals Base: nothing was committed" >&2; exit 1
fi

# 3. state + row
"$HERE/set-state.sh" "$UNIT_FILE" committed "$HEAD" >/dev/null

# 4. decisions log
NAME=$(basename "$UNIT_FILE"); CODENAME=${NAME%-unit-*}; NN=${NAME##*-unit-}; NN=${NN%.md}
DESC="$(cd "$(dirname "$UNIT_FILE")" && pwd)/$CODENAME-description.md"
grep -q '^## Decisions log' "$DESC" || { echo "$DESC has no ## Decisions log" >&2; exit 1; }
NN="$NN" H="$HANDOFF" perl -0pi -e '
  s/(## Decisions log\n(?:(?!## )[^\n]*\n)*?)(\n*)(?=## )/$1 . "- unit $ENV{NN}: $ENV{H}\n" . $2/e
    or s/(## Decisions log\n(?:[^\n]*\n)*)\s*\z/$1 . "- unit $ENV{NN}: $ENV{H}\n"/e' "$DESC"

# 5. clear notes, reset workers
ENV_FILE="$HOME/.agents/plans/$(basename "$ROOT")/.siblings.env"
[ -f "$ENV_FILE" ] || { echo "no $ENV_FILE: run find-siblings.sh first" >&2; exit 1; }
# shellcheck disable=SC1090
. "$ENV_FILE"
RESET_LINE=$(grep -m1 -E '^- Reset:' "$DESC" || true)
if [ -n "$RESET_LINE" ]; then
  C=$(printf '%s' "$RESET_LINE" | grep -oE 'coder=[^,]+' | cut -d= -f2- | sed 's/[[:space:]]*$//' || true)
  R=$(printf '%s' "$RESET_LINE" | grep -oE 'reviewer=.*' | cut -d= -f2- | sed 's/[[:space:]]*$//' || true)
  [ -n "$C" ] && CODER_RESET=$C
  [ -n "$R" ] && REVIEWER_RESET=$R
fi
hunk session comment clear "$SESSION" --yes >/dev/null
NOTE=""
for role in CODER REVIEWER; do
  n="${role}_NAME"; r="${role}_RESET"
  if [ -n "${!r:-}" ]; then herdr agent prompt "${!n}" "${!r}" >/dev/null
  else NOTE="$NOTE; $(printf %s "$role" | tr A-Z a-z) not reset (no reset command: ask the user, record a Reset: line)"; fi
done
echo "unit $NN committed $HEAD; notes cleared; coder and reviewer reset$NOTE"
