#!/usr/bin/env bash
# count-tasks.sh <unit-file>
# Prints the Checklist cell for a unit file: "0/M", "N/M — <first unticked task>",
# or "M/M — done". Counts only the boxes under "## Tasks"; a box inside
# "## Proposed changes" is not a task. Run it every time; never reuse a number.
set -euo pipefail
FILE="${1:?usage: count-tasks.sh <unit-file>}"
tasks() { awk '/^## Tasks/{f=1;next} /^## /{f=0} f' "$FILE"; }
TICKED=$(tasks | grep -c '^- \[x\]' || true)
TOTAL=$(tasks | grep -c '^- \[[ x]\]' || true)
if [ "$TOTAL" -gt 0 ] && [ "$TICKED" -eq "$TOTAL" ]; then
  echo "$TICKED/$TOTAL — done"
elif [ "$TICKED" -eq 0 ]; then
  echo "0/$TOTAL"
else
  NEXT=$(tasks | grep -m1 '^- \[ \]' | sed 's/^- \[ \] //' | cut -c1-40)
  echo "$TICKED/$TOTAL — $NEXT"
fi
