# Herdr and Hunk Command Patterns

Only what the **herdr** skill does not say and the scripts do not do. The installed
`herdr` binary is the authority; every command here was checked against herdr 0.8.2. If
herdr rejects a flag, run the subcommand with `--help` and adapt. Never guess a replacement.

## Contents
- Siblings and sessions
- When a wait is lost
- Context resets
- Hunk session commands
- Sentinel contract

## Siblings and sessions

`scripts/find-siblings.sh` resolves the roles. The rules it enforces, in case you must
reason about its output:

- Filter by `workspace_id`, never `tab_id`: each role sits in its own tab by default.
- Each role is resolved on its own, and only **exactly one** candidate is safe. `orc`
  numbers roles independently, so a matching suffix is not evidence of the same run.
  Zero or two candidates: ask the user, do not guess.
- Several runs share the `<base>-hunk` label. Any match is fine: the differ is a passive
  display nobody prompts.
- Pass hunk the `SESSION` id, never `--repo <root>`: two `orc` runs on one repository make
  `--repo` ambiguous and hunk refuses the command.

## When a wait is lost

If `turn.sh` exits 4, a wait died, or you are picking up an agent you did not prompt:
**do not** run `herdr agent wait`. It is edge-triggered and hangs on an agent that has
already settled. Wait on the sentinel with `pane wait-output`, which searches the existing
snapshot first, so it matches a line that already scrolled past.

That same property is a trap: an untagged pattern matches the **previous** turn's sentinel.
Anchor the regex on the tag of the outstanding prompt, and include `REVIEW-BLOCKED` so a
blocked reviewer returns now instead of at the timeout:

```bash
herdr pane wait-output \
  --regex 'RM3-ORC\[u02-fix-1\]: (SUCCESS|FAIL|NOTHING-TO-REVIEW|REVIEW-BLOCKED)' \
  --source recent-unwrapped --timeout 1800000 <pane-id>
herdr agent get <agent-name>
herdr pane read --source recent-unwrapped --lines 200 <pane-id>
```

`pane read` and `pane wait-output` take the pane id **last**; `agent read` takes the
target first. On a resume, the outstanding tag is `<unit>-<phase>-<attempt>` for the unit
file's current `State`. If you cannot reconstruct it, treat the turn as lost and re-enter
from the resume table; never re-send a prompt while the agent is busy.

## Context resets

Only after a unit is committed and its notes are cleared. These prompts need no `--wait`.
herdr has no reset command of its own, so the reset is the slash command the worker's
CLI understands. `find-siblings.sh` reads each worker's kind from herdr and emits the
matching command as `CODER_RESET` and `REVIEWER_RESET`; never pick one from a name.

| kind | reset command |
|---|---|
| `claude` | `/clear` |
| `codex` | `/new` |
| anything else | empty: ask the user once, record it as a `Reset:` line in the description |

```bash
hunk session comment clear "$SESSION" --yes    # unit N's notes must not leak into N+1
herdr agent prompt "$CODER_NAME" "$CODER_RESET"
herdr agent prompt "$REVIEWER_NAME" "$REVIEWER_RESET"
```

## Hunk session commands

`hunk session *` is not a file read: it finds the daemon through
`$TMPDIR/hunk-mcp/daemon-*.json` and talks to it over loopback HTTP. A sandbox that denies
network denies loopback too, and the CLI then prints:

```
hunk: No active Hunk sessions are registered with the daemon. Open Hunk and wait for it to connect.
```

**That means "unreachable", not "no changes".** There is no app to open; the session lives
in the `<base>-hunk` pane. Any worker whose sandbox denies network hits this, whatever
its kind. The known case is Codex, which denies network by default: `orc` launches a Codex
role with `-c sandbox_workspace_write.network_access=true`. For another kind, allow
loopback in that CLI's sandbox settings.

```bash
hunk session review "$SESSION" --json --include-patch      # diff TEXT; without the flag, structure only
hunk session comment add "$SESSION" --file src/foo.ts --new-line 42 \
  --summary "[blocking] Guard against empty input; task 3's edge case was skipped"
hunk session comment list "$SESSION" --type agent           # keep --type agent: the bare form is a legacy view
hunk session comment rm "$SESSION" <comment-id>             # reviewer drops a note the new diff resolved
hunk session comment clear "$SESSION" --yes                 # orchestrator, after commit
```

The severity prefix is part of the contract: `[blocking]` must be fixed, `[nit]` is optional.

## Sentinel contract

Workers end every turn with exactly one line carrying the tag from the prompt:

```
RM3-ORC[<tag>]: SUCCESS — <one-line summary> — tests: <passed>/<total>, lint: <clean|N issues>
RM3-ORC[<tag>]: FAIL — <one-line reason> — tests: <passed>/<total>, lint: <clean|N issues>
RM3-ORC[<tag>]: NOTHING-TO-REVIEW
RM3-ORC[<tag>]: REVIEW-BLOCKED — <the exact hunk error>
```

`<tag>` is `<unit>-<phase>-<attempt>`: unit `uNN` (or `all`), phase one of `impl`, `review`,
`fix`, `commit`, `gate`, attempt from 1. One tag per prompt, never reused within a plan. A
sentinel with any other tag is a stale line from an earlier turn. `turn.sh` matches only
your tag; no match after a settled wait is a FAIL for that turn.
