#!/usr/bin/env bash
# Resolve the orc siblings of the calling orchestrator pane.
# Prints KEY=VALUE lines on success. Exits 2 with a reason on stderr when a role
# is missing or ambiguous, so the orchestrator asks the user instead of guessing.
#
# Roles carry no model. `orc` names them <base>-orch, <base>-coder,
# <base>-reviewer and <base>-hunk, and any role may run on any agent kind that
# herdr supports. The kind is read from herdr here and emitted as *_KIND, and the
# context-reset command that kind understands is emitted as *_RESET (empty when
# the kind is not in the table below: the orchestrator then asks the user once).
#
# Why each filter exists:
# - workspace, not tab: orc puts each role in its own tab by default.
# - base prefix: a workspace can hold several repos (openmint-coder next to
#   dotfiles-coder).
# - no kind filter: the same role name can run on claude today and codex
#   tomorrow; the name is the identity, the kind is a property.
# - one role per query, "exactly one candidate" only: orc numbers roles
#   independently, so the coder can be <base>-coder-2 while the reviewer is
#   plain <base>-reviewer. A matching suffix is NOT evidence of the same run.
# - name may be null for agents herdr detected but nobody named; skip them.
set -euo pipefail
WS="${HERDR_WORKSPACE_ID:?not inside herdr}"
ROOT=$(git rev-parse --show-toplevel)

# Base name: from the own pane label when orc named it, else derived from the
# repo the same way orc derives it. Two orc runs on one repo still stop below,
# because the coder query then finds two candidates.
SELF=$(herdr pane current | jq -r '.result.pane.label // empty')
BASE="${SELF%-orch*}"
if [ -z "$BASE" ] || [ "$BASE" = "$SELF" ]; then
  BASE=$(basename "$ROOT" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9_-]/-/g; s/-+/-/g; s/^-+//; s/-+$//')
  case "$BASE" in [a-z]*) ;; *) BASE="r-$BASE" ;; esac
  BASE=$(printf '%s' "$BASE" | cut -c1-20 | sed -E 's/-+$//')
fi

resolve() {  # resolve <role> -> "<name>\t<pane_id>\t<kind>" per candidate
  herdr agent list | jq -r --arg ws "$WS" --arg base "$BASE" --arg role "$1" '
    .result.agents[]
    | select(.workspace_id == $ws and .name != null)
    | select(.name | test("^" + $base + "-" + $role + "(-[0-9]+)?$"))
    | "\(.name)\t\(.pane_id)\t\(.agent)"'
}
pick() {  # pick <role> <candidates>: exactly one, or stop
  local n; n=$(printf '%s' "$2" | grep -c . || true)
  if [ "$n" -ne 1 ]; then
    echo "$1: expected exactly one agent named $BASE-$1[-N] in workspace $WS, found $n. Ask the user which to use, or tell them to run orc." >&2
    [ "$n" -gt 0 ] && printf '  %s\n' "$2" >&2
    exit 2
  fi
}
reset_for() {  # reset_for <kind> -> the slash command that starts a fresh context
  case "$1" in
    claude) echo "/clear" ;;
    codex)  echo "/new" ;;
    *)      echo "" ;;   # unknown: the orchestrator asks the user once
  esac
}
field() { printf '%s' "$1" | cut -f"$2"; }

CODER=$(resolve coder);       pick coder    "$CODER"
REVIEWER=$(resolve reviewer); pick reviewer "$REVIEWER"

# orc does not suffix the hunk pane; several runs share the label. The differ is
# a passive display that is never prompted, so any match is fine.
HUNK=$(herdr pane list --workspace "$WS" \
  | jq -r --arg h "$BASE-hunk" '.result.panes[] | select(.label == $h) | .pane_id' | head -1)
[ -n "$HUNK" ] || { echo "no pane labelled $BASE-hunk in workspace $WS" >&2; exit 2; }

# Session id, not --repo: --repo is ambiguous when two orc runs share a repo.
SESSION=$(hunk session get --repo "$ROOT" --json 2>/dev/null | jq -r '.session.sessionId // empty' || true)
[ -n "$SESSION" ] || { echo "hunk session get --repo $ROOT returned no sessionId (is $BASE-hunk running hunk diff --watch?)" >&2; exit 2; }

CODER_KIND=$(field "$CODER" 3); REVIEWER_KIND=$(field "$REVIEWER" 3)
printf 'BASE=%s\n' "$BASE"
printf 'CODER_NAME=%s\nCODER_PANE=%s\nCODER_KIND=%s\nCODER_RESET=%s\n' \
  "$(field "$CODER" 1)" "$(field "$CODER" 2)" "$CODER_KIND" "$(reset_for "$CODER_KIND")"
printf 'REVIEWER_NAME=%s\nREVIEWER_PANE=%s\nREVIEWER_KIND=%s\nREVIEWER_RESET=%s\n' \
  "$(field "$REVIEWER" 1)" "$(field "$REVIEWER" 2)" "$REVIEWER_KIND" "$(reset_for "$REVIEWER_KIND")"
printf 'HUNK_PANE=%s\nSESSION=%s\nREPO=%s\n' "$HUNK" "$SESSION" "$ROOT"
