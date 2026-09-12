#!/usr/bin/env bash
# set-state.sh <unit-file> <state> [hash] [--review "<line>"]
#
# One bookkeeping call per transition. Writes the unit file's State line (and
# Base when the state is `implementing`), recounts the checklist, rewrites the
# unit's row in the description table, and optionally appends one line under
# ## Review cycles. Prints the rewritten row: that is the confirmation, do not
# re-read the files afterwards.
#
# States: pending implementing needs-review needs-fix ready-to-commit committed
# `committed` needs the short hash as the third argument.
set -euo pipefail
usage() { echo "usage: set-state.sh <unit-file> <state> [hash] [--review \"<line>\"]" >&2; exit 1; }
[ $# -ge 2 ] || usage
UNIT_FILE=$1; STATE=$2; shift 2
HASH=""; REVIEW=""
while [ $# -gt 0 ]; do
  case "$1" in
    --review) REVIEW=${2:?--review needs a line}; shift 2 ;;
    *) HASH=$1; shift ;;
  esac
done
case "$STATE" in
  pending|implementing|needs-review|needs-fix|ready-to-commit) ;;
  committed) [ -n "$HASH" ] || { echo "committed needs a hash" >&2; exit 1; } ;;
  *) echo "unknown state $STATE" >&2; exit 1 ;;
esac
[ -f "$UNIT_FILE" ] || { echo "no unit file $UNIT_FILE" >&2; exit 1; }
grep -q '^State:' "$UNIT_FILE" || { echo "$UNIT_FILE has no State: line" >&2; exit 1; }

DIR=$(cd "$(dirname "$UNIT_FILE")" && pwd)
NAME=$(basename "$UNIT_FILE")
CODENAME=${NAME%-unit-*}
NN=${NAME##*-unit-}; NN=${NN%.md}
DESC="$DIR/$CODENAME-description.md"
[ -f "$DESC" ] || { echo "no description file $DESC" >&2; exit 1; }
grep -q "^| $NN |" "$DESC" || { echo "$DESC has no table row for unit $NN" >&2; exit 1; }

STATUS=$STATE
[ "$STATE" = committed ] && STATUS="committed $HASH"

# Unit file: State (keep a trailing <!-- --> comment if one is there), Base.
# perl, not sed -i: BSD and GNU sed disagree on -i, and the cells hold em dashes.
S="$STATUS" perl -pi -e 's/^State:\s*\S.*?(?=(\s*<!--.*)?$)/State: $ENV{S}/' "$UNIT_FILE"
if [ "$STATE" = implementing ]; then
  B=$(git rev-parse --short HEAD)
  B="$B" perl -pi -e 's/^Base:\s*\S.*?(?=(\s*<!--.*)?$)/Base: $ENV{B}/' "$UNIT_FILE"
fi
if [ -n "$REVIEW" ]; then
  # ## Review cycles is the last section of the template, so appending is enough.
  grep -q '^## Review cycles' "$UNIT_FILE" || printf '\n## Review cycles\n' >> "$UNIT_FILE"
  [ -z "$(tail -c1 "$UNIT_FILE")" ] || echo >> "$UNIT_FILE"
  printf '%s\n' "$REVIEW" >> "$UNIT_FILE"
fi

# Description row: | NN | file | title | checklist | status |
CHECK=$("$(dirname "$0")/count-tasks.sh" "$UNIT_FILE")
NN="$NN" CHECK="$CHECK" STATUS="$STATUS" perl -pi -e '
  if (/^\| $ENV{NN} \|/) {
    my @c = split /\|/, $_, -1;            # "", " NN ", " file ", " title ", " check ", " status ", "\n"
    $c[4] = " $ENV{CHECK} "; $c[5] = " $ENV{STATUS} ";
    $_ = join "|", @c;
  }' "$DESC"
grep "^| $NN |" "$DESC"
