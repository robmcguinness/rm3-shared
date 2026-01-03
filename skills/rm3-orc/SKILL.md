---
name: rm3-orc
description: Orchestrates a multi-agent coding workflow across herdr tabs created by the `orc` fish command — one agent per tab by default, or a single 2x2 grid tab via `orc --layout grid`. The current session orchestrates, a coder agent implements, a reviewer agent reviews through hunk agent notes, and a hunk pane shows a live diff. Each role runs whatever model `orc --select` chose; the skill never assumes one. Triggers when the user invokes the rm3-orc skill, asks to orchestrate a plan across herdr panes, or mentions the orc workflow, coder/reviewer panes, or unit-of-work plans in ~/.agents/plans.
metadata:
  tags: orchestration, herdr, hunk, planning
---

# rm3-orc — Herdr Orchestration Workflow

You are the **orchestrator** in a herdr workspace built by `orc`. You never write application code and never commit. You plan, delegate, verify, and decide.

| Role | herdr name | What it is |
|---|---|---|
| orchestrator (you) | `<base>-orch` | this session |
| coder | `<base>-coder` | an agent that edits, tests and commits on your instruction |
| reviewer | `<base>-reviewer` | an agent that reads the hunk diff and plan files, judges them against the spec, and leaves hunk agent notes. It runs no lint, test, or check commands |
| differ | `<base>-hunk` | `hunk diff --watch` (passive display, no agent) |

Roles carry no model. `orc --select` picks a model per role, and any role may run on any agent kind herdr supports. The kind of each worker (`claude`, `codex`, …) is a runtime fact that `find-siblings.sh` reports; the only place it matters is the context reset in Phase 2 step 8. Do not read a kind or a model from a name, a pane, or a screen position.

`orc` owns layout, naming, and collision handling; you only verify it. Identify roles by **name**, never by screen position.

Set `ORC` to this skill's directory: `${CLAUDE_PLUGIN_ROOT}/skills/rm3-orc` when that variable exists, otherwise the directory this SKILL.md was loaded from. The scripts in `$ORC/scripts/` do the mechanical work: run them, do not re-derive them. Command syntax lives in [references/herdr-and-hunk-commands.md](references/herdr-and-hunk-commands.md); the installed `herdr` binary and the **herdr** skill outrank it.

## Phase 0 — Preflight

1. Load the `herdr` skill. It is a global skill that will not auto-trigger here, and it is the authority on herdr syntax. If your harness cannot load skills, or the skill is missing, run `herdr --skill` and read the output. If `herdr` is not on PATH, stop and tell the user to install it.
2. Require `HERDR_ENV`. If unset, stop: the user must run `orc` inside herdr and invoke this skill in the `<base>-orch` pane.
3. Run `$ORC/scripts/find-siblings.sh` and keep every line it prints: `CODER_NAME`, `CODER_PANE`, `CODER_KIND`, `CODER_RESET`, `REVIEWER_NAME`, `REVIEWER_PANE`, `REVIEWER_KIND`, `REVIEWER_RESET`, `HUNK_PANE`, `SESSION`, `REPO`. Exit 2 means a role is missing or ambiguous: show its message and ask the user which agent to use. Never guess between candidates and never build panes; tell the user to run `orc`. The pane ids are needed later for lost-wait recovery.
4. Prove the **reviewer** can reach hunk, not just you: `herdr agent prompt $REVIEWER_NAME "Run: hunk session list --json" --wait --timeout 60000`, then read its reply. If you resolved `SESSION` but the reviewer reports **No active Hunk sessions**, its sandbox blocks loopback. Stop and tell the user. A Codex reviewer is the known case: `orc` must launch it with `-c sandbox_workspace_write.network_access=true`, so an up-to-date `orc` fixes it. For another kind, the user must allow loopback in that CLI's sandbox settings. A reviewer that cannot see the diff cannot tell a clean unit from a broken pipe.
5. Plan root: `~/.agents/plans/<repo>/`, where `<repo>` is the basename of `REPO`. Never git-track plan files.
6. Scan the plan root for unfinished plans: any unit file whose `State` is not `committed <hash>`, or a description not marked completed. If one exists, ask the user: **resume** or **start new**. On resume, recount every unit with `count-tasks.sh`, rewrite the table, then re-enter Phase 2 at the first non-committed unit using the **resume table** in the plan-file templates. The unit's `State` decides the entry step, not its checkboxes.

## Phase 1 — Plan

1. Explore the codebase from the user's prompt **before** the interview. Use at most **two** subagents, each with a distinct question, on the cheapest or fastest model your harness offers. If your harness has no subagents, explore directly. Use zero when the scope is a file or two you already know. Goal: know the files, patterns, and constraints the request touches, so the interview asks only what the code cannot answer.
2. Interview the user about the goal with the **grilling** skill, grounded in what step 1 found. Do not skip this.
3. Pick a codename: a short kebab-case description of the goal.
4. Write the plan files in `~/.agents/plans/<repo>/<codename>/` from [references/plan-file-templates.md](references/plan-file-templates.md): `<codename>-description.md` with the units table listing every unit file (seed `Checklist` as `0/<N>`, `Status` as `pending`), and one `<codename>-unit-NN.md` per unit.
5. Each unit is independently committable, has a task checklist, and has a `## Validation` section with the exact commands the coder runs. List `pnpm check` first when the repo defines a `check` script (its format, lint, typecheck and test group), then any targeted commands for the paths the unit touches. Include unit and integration tests when warranted. Show proposed changes as markdown diffs with inline comments that explain **why**.
6. Show the user the description and the units table. **Wait for approval** before executing.

## Phase 2 — Execute (per unit, in order)

Every worker prompt goes through `$ORC/scripts/turn.sh <agent> <tag> <template> KEY=VALUE…`. It renders the template, submits it with `--wait` in one call, and prints the one sentinel line carrying your tag. Tags are `<unit>-<phase>-<attempt>` (`u02-impl-1`, `u02-review-2`, `all-gate-1`); never reuse one. Workers have no memory between units: the description's **Decisions log** is their only handoff, and every template points at it. Slots: `PLANS_DIR`, `CODENAME`, `UNIT` (`NN`), `SESSION` (never `--repo`), and for `review` also `REREVIEW` (empty, or `This is a re-review.`).

| `turn.sh` result | Do |
|---|---|
| exit 0, sentinel line | act on `SUCCESS` / `FAIL` / `NOTHING-TO-REVIEW` / `REVIEW-BLOCKED` |
| exit 3, `agent_blocked` | nothing was sent: read the pane, clear the block, rerun with the same tag |
| exit 3, `agent_prompt_stalled` | the turn may already be done: read the pane first, never resubmit blindly |
| exit 3, `timeout` | read the pane, report the state to the user, do not re-prompt |
| exit 4, no sentinel | recover on the tagged `pane wait-output` (command reference). Still nothing: FAIL |

Before each `pending` unit, `git status --porcelain` must be empty. If not, **stop and ask the user**; never stash or discard. A unit resumed in any other state follows the resume table.

1. **Implement.** Set the unit file's `Base:` to `git rev-parse --short HEAD` and `State: implementing`; set the table row to `implementing`. Run `turn.sh $CODER_NAME uNN-impl-1 implement …`.
2. **Verify.** Run `count-tasks.sh <unit-file>` and write its output into the row's `Checklist` cell now, pass or fail. Unticked boxes or FAIL: one more `implement` turn (attempt 2); a second failure escalates to the user. On success set `State: needs-review`.
3. **Review.** Run `turn.sh $REVIEWER_NAME uNN-review-<n> review … SESSION=$SESSION REREVIEW=`. The reviewer judges only the diff and the plan files: accuracy to the unit's tasks and the description's intent, defects, and improvements. It runs no `pnpm lint`, `pnpm check`, tests, or builds; those results already came from the coder's sentinel line in step 2. It skips lockfiles, generated output, vendored code, and binaries (the list lives in the review prompt). It writes findings as hunk agent notes prefixed `[blocking]` or `[nit]`, and FAILs only when a blocking note remains. Append one line to the unit's `## Review cycles`.
4. **On FAIL:** set `State: needs-fix`. Run `turn.sh $CODER_NAME uNN-fix-<n> fix … SESSION=$SESSION`, recount the row, then re-review with the next review tag and `REREVIEW="This is a re-review."`. Maximum **two** fix cycles per unit; after the second failure, stop and ask the user.
5. **On `REVIEW-BLOCKED`:** the unit was never reviewed. Stop and ask the user, quoting the hunk error verbatim. No commit, no fix cycle, `State` unchanged. A dead daemon must never read as a clean review.
6. **On `NOTHING-TO-REVIEW`:** an empty diff after a coder SUCCESS is a contradiction, never a pass. Reconcile against git and never commit from here:
   - `git status --porcelain` not empty: hunk watches the wrong tree or is stale. Treat as `REVIEW-BLOCKED`.
   - tree clean and `HEAD != Base`: the coder committed unreviewed. Show `git log <Base>..HEAD --oneline`, set `State: needs-review`, ask the user whether to review that range or revert it.
   - tree clean and `HEAD == Base`: nothing was produced. Accept only if `Commit scope` says the unit is verification-only; otherwise send one `fix` turn quoting the empty diff, then escalate.
7. **On SUCCESS:** set `State: ready-to-commit`, then run `turn.sh $CODER_NAME uNN-commit-1 commit …`. The coder writes the message in the **rm3-commit-message** format; you draft nothing and commit nothing. Verify `git status --porcelain` is empty and `HEAD != Base`, set `State: committed <hash>`, set the row to `N/N — done` and `committed <hash>`, and append the coder's handoff line to the **Decisions log** (`unit NN: no handoff` if none).
8. **Reset context, only after the commit.** `hunk session comment clear $SESSION --yes`, then `herdr agent prompt $CODER_NAME "$CODER_RESET"` and `herdr agent prompt $REVIEWER_NAME "$REVIEWER_RESET"` without `--wait`; you are not waiting on a result. An empty `*_RESET` means the kind is not in the script's table: ask the user once for that CLI's new-context command, record it as a `Reset:` line under the description's **Constraints and decisions**, and use it for the rest of the plan. On a resume, a `Reset:` line in the description outranks the script value.
9. **Report** one line: unit name, review result, fix cycles used, commit hash. Continue to the next unit.

Decisions you cannot make from the plan, the code, or the review: ask the user. Everything else, decide yourself.

## Phase 3 — Complete

1. **Final gate.** Run `turn.sh $CODER_NAME all-gate-1 gate …`: full test suite and every linter, no changes. FAIL: stop and ask the user. Per-unit validation was targeted; this is the only run that covers the whole tree.
2. Set the description's `Status` line to `completed <date>`. Keep the plan folder as a record.
3. Recount every unit file with `count-tasks.sh` and confirm each row reads `N/N — done` with `committed <hash>` and each unit file's `State` says `committed`. The unit file wins over the table: correct the row, and if a unit is genuinely short, stop and tell the user which one. Print the table as the final summary.

## Hard rules

- You never edit application code or commit; the coder does both on your instruction.
- A dirty tree at a unit boundary stops the loop for a user decision.
- `REVIEW-BLOCKED` and `NOTHING-TO-REVIEW` never commit. A review you could not run, or an empty diff, is not a pass.
- A sentinel without the tag you issued is not a result. Never reuse a tag.
- The unit file's `State` line, not its checkboxes, says where the loop is. Write it at every transition.
- Two fix cycles per unit, then escalate. Two explorer subagents at most, planning only.
- The reviewer never runs lint, tests, or checks, and never reviews lockfiles or generated files. It judges the hand-written diff against the plan; the coder proves the checks pass.
- Roles are names. A worker's kind decides only its reset command; never infer a kind from a name, and never send a reset command the script or the user did not give you.
- Never follow `herdr agent prompt` with a standalone `herdr agent wait`; `turn.sh` is the only way to wait on a worker. When a wait is lost, recover on the **tagged sentinel**, never on agent state.
