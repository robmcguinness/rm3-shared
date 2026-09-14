# Recovery and Resume

Read this only when `turn.sh` returns something other than exit 0 or a `timeout`, or when
Phase 0 found an unfinished plan. The normal loop never needs it. Every command was checked
against herdr 0.8.2; if herdr rejects a flag, run the subcommand with `--help` and adapt.

## Contents
- herdr error codes
- Resume table
- Hunk daemon errors
- Sentinel contract

## herdr error codes

`turn.sh` exit 3 prints the herdr error code on stdout.

| code | meaning | do |
|---|---|---|
| `agent_blocked` | the worker sits at an approval or question dialog; nothing was sent | `herdr agent read <name> --source recent-unwrapped --lines 120`, show the dialog to the user, clear it as they decide, then rerun `turn.sh` with the **same** tag |
| `agent_prompt_stalled` | the prompt was submitted but no activity followed within 5 s; the turn may still run or may already be done | `herdr agent get <name>`, then read the pane. Sentinel present: take it. Worker `working`: `turn.sh --resume`. Idle with no sentinel: rerun with the same tag |
| `timeout` | the worker is still working past `TIMEOUT` | `turn.sh --resume`, same tag and slots, foreground, repeat until it settles |
| exit 4 | the wait settled but no line carries your tag | `turn.sh --resume` once; still nothing: treat the turn as FAIL |

Never run a bare `herdr agent wait`: it is edge-triggered and hangs on an agent that already
settled. `turn.sh --resume` uses `pane wait-output`, which searches the existing snapshot
first and so matches a sentinel that already scrolled past. A timeout or stall does not
prove the prompt never arrived; never resubmit while `agent get` says `working`.

The pane a resume needs comes from `herdr agent get <name>` (`.result.agent.pane_id`).
`pane read` and `pane wait-output` take the pane id **last**; `agent read` takes the target
first.

## Resume table

A plan is **unfinished** when its description `Status` is not `completed`, or any unit
file's `State` is not `committed <hash>`. Decide from the **unit files**, not the table.

On resume, run `find-siblings.sh` (add `--no-probe` only if the reviewer was already probed
in this session), then `set-state.sh <unit-file> <its current state>` for every unit so the
table is true. Take the first non-committed unit and enter the loop from this table.
`Tree` is `git status --porcelain`; `Base` is the unit file's `Base` line.

| `State` | Tree | Action |
|---|---|---|
| `pending` | clean | start the unit normally |
| `pending` | dirty | stop and ask the user (the hard rule) |
| `implementing` | any | **ask the user**: the coder may have stopped mid-edit. Show `git diff --stat <Base>` and let them choose: re-send implement (attempt 2), or hand-fix |
| `needs-review` | dirty | confirm `git diff --stat <Base>` looks like this unit's work, then go to the review step |
| `needs-fix` | dirty | go to the fix-cycle step; the notes still live in hunk |
| `ready-to-commit` | dirty | go to the commit step |
| any non-committed | clean, and `HEAD != Base` | the coder may have committed unreviewed. Show `git log <Base>..HEAD --oneline` and **ask the user** whether to review that range or revert |
| any non-committed | clean, and `HEAD == Base` | no work exists. Treat as `pending` |

The outstanding tag is `<unit>-<phase>-<attempt>` for the unit's current `State`. If a worker
may still be busy on it, `turn.sh --resume` with that tag; if you cannot reconstruct it, treat
the turn as lost and re-enter from the table above. Never re-send a prompt while the agent is
busy.

## Hunk daemon errors

`hunk session *` is not a file read: it finds the daemon through
`$TMPDIR/hunk-mcp/daemon-*.json` and talks to it over loopback HTTP. A sandbox that denies
network denies loopback too, and the CLI then prints:

```
hunk: No active Hunk sessions are registered with the daemon. Open Hunk and wait for it to connect.
```

**That means "unreachable", not "no changes".** There is no app to open; the session lives
in the `<base>-hunk` pane. `find-siblings.sh` probes the reviewer for this at preflight. If
it shows up mid-plan, the reviewer answers `REVIEW-BLOCKED`: stop and tell the user. Codex
needs `-c sandbox_workspace_write.network_access=true` (an up-to-date `orc` passes it); another
kind needs loopback allowed in its sandbox settings.

Pass hunk the `SESSION` id, never `--repo <root>`: two `orc` runs on one repository make
`--repo` ambiguous and hunk refuses the command.

## Sentinel contract

Workers end every turn with exactly one line carrying the tag from the prompt:

```
RM3-ORC[<tag>]: SUCCESS — <one-line summary> — tests: <passed>/<total>, lint: <clean|N issues>
RM3-ORC[<tag>]: FAIL — <one-line reason> — tests: <passed>/<total>, lint: <clean|N issues>
RM3-ORC[<tag>]: NOTHING-TO-REVIEW
RM3-ORC[<tag>]: REVIEW-BLOCKED — <the exact hunk error>
RM3-ORC[<tag>]: SUCCESS — <handoff, or "no handoff"> — committed <short-hash>    (commit turns)
```

The commit form ends with the hash so `turn.sh` knows where a wrapped line stops; a handoff
placed after the hash would be truncated.

`<tag>` is `<unit>-<phase>-<attempt>`: unit `uNN` (or `all`), phase one of `impl`, `review`,
`fix`, `commit`, `gate`, attempt from 1. One tag per prompt, never reused within a plan. A
sentinel with any other tag is a stale line from an earlier turn. `turn.sh` matches only
your tag and re-joins a sentinel the terminal wrapped over two or three rows.
