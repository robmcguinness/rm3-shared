---
name: rm3-orc
description: Orchestrates a multi-agent coding workflow across herdr tabs created by the `orc` fish command — one agent per tab by default, or a single 2x2 grid tab via `orc --layout grid`. The current session orchestrates, a coder agent implements, a reviewer agent reviews through hunk agent notes, and a hunk pane shows a live diff. Each role runs whatever model `orc --select` chose; the skill never assumes one. Needs only the `herdr` binary on PATH, not the herdr skill. Triggers when the user invokes the rm3-orc skill, asks to orchestrate a plan across herdr panes, or mentions the orc workflow, coder/reviewer panes, or unit-of-work plans in ~/.agents/plans. Plans with a short interview by default and uses the grilling skill only when the user asks to be grilled.
metadata:
  tags: orchestration, herdr, hunk, planning
---

# rm3-orc — Herdr Orchestration Workflow

You are the **orchestrator** in a herdr workspace built by `orc`. You never write application code and never commit. You plan, delegate, verify, and decide.

| Role | herdr name | What it is |
|---|---|---|
| orchestrator (you) | `<base>-orch` | this session |
| coder | `<base>-coder` | an agent that edits, runs `pnpm check`, tests and commits on your instruction. The only role that runs lint, format, typecheck or tests |
| reviewer | `<base>-reviewer` | an agent that reads the hunk diff and plan files, judges logic, edge cases and accuracy to the spec, and leaves hunk agent notes. It runs no lint, test, or check commands |
| differ | `<base>-hunk` | `hunk diff --watch` (passive display, no agent) |

Roles carry no model. `orc --select` picks a model per role, and any role may run on any agent kind herdr supports. Identify roles by **name**, never by screen position. A worker's kind decides only its reset command, and `find-siblings.sh` reports both.

Set `ORC` to this skill's directory: `${CLAUDE_PLUGIN_ROOT}/skills/rm3-orc` when that variable exists, otherwise the directory this SKILL.md was loaded from. The scripts in `$ORC/scripts/` do the mechanical work: run them, do not re-derive them, and do not re-read a plan file to confirm what a script printed.

| Script | Does |
|---|---|
| `find-siblings.sh [--no-probe]` | resolves the roles, probes the reviewer's hunk access, writes `~/.agents/plans/<repo>/.siblings.env` |
| `turn.sh <agent> <tag> <template> KEY=VALUE…` | one worker turn: render, prompt, wait, print the sentinel plus `HEAD=`, `TREE=`, `CHECKLIST=`. Exits 1 before sending when `PLANS_DIR/CODENAME-description.md` does not exist |
| `turn.sh --resume <agent> <tag> <template> KEY=VALUE…` | wait again on the same tag after a `timeout` or a lost sentinel; sends nothing |
| `set-state.sh <unit-file> <state> [hash] [--review "<line>"]` | writes the unit's `State` (and `Base` on `implementing`), recounts, rewrites the table row, prints it |
| `after-commit.sh <unit-file> "<commit sentinel>"` | verifies the commit, marks the unit committed, appends the handoff to the Decisions log, clears hunk notes, resets both workers |
| `count-tasks.sh <unit-file>` | the Checklist cell; used by the scripts above and in Phase 3 |

Do not load the herdr skill or run `herdr --skill`; the scripts wrap every herdr command the loop needs. The only direct calls you make:

```bash
herdr agent read <name> --source recent-unwrapped --lines 120     # inspect a worker's screen
herdr agent get <name>                                            # its state
herdr agent prompt <name> "<reset command>"                       # manual reset, no --wait
herdr pane read --source recent-unwrapped --lines 120 <pane-id>   # the differ pane
```

## Phase 0 — Preflight

1. Require `HERDR_ENV` and `herdr` on PATH. If either is missing, stop: the user must run `orc` inside herdr and invoke this skill in the `<base>-orch` pane.
2. Run `$ORC/scripts/find-siblings.sh` and keep every line it prints: `CODER_NAME`, `CODER_PANE`, `CODER_KIND`, `CODER_RESET`, `REVIEWER_NAME`, `REVIEWER_PANE`, `REVIEWER_KIND`, `REVIEWER_RESET`, `REVIEWER_HUNK`, `HUNK_PANE`, `SESSION`, `REPO`. Exit 2 means a role is missing or ambiguous, or the reviewer cannot reach hunk over loopback: show its message and stop. Never guess between candidates and never build panes; tell the user to run `orc`.
3. Plan root: `~/.agents/plans/<repo>/`, where `<repo>` is the basename of `REPO`. Each plan lives in its own folder under it, `<plan root>/<codename>/`, and that folder, not the root, is the `PLANS_DIR` every worker prompt takes. Never git-track plan files.
4. Scan the plan root for unfinished plans: any unit file whose `State` is not `committed <hash>`, or a description not marked completed. If one exists, ask the user: **resume** or **start new**. On resume, read [references/recovery.md](references/recovery.md) and follow its resume table.

## Phase 1 — Plan

1. Explore the codebase from the user's prompt **before** the interview. Use at most **two** subagents, each with a distinct question, on the cheapest or fastest model your harness offers, prompted with `assets/prompts/explore.md` (`turn.sh --dry-run x x explore REPO=… QUESTION=…` renders it). They return the exact excerpts the unit diffs will replace; write the diffs from their report, and re-read a file only when an excerpt is missing or two contradict. Use zero when the scope is a file or two you already know.
2. Interview the user about the goal, grounded in what step 1 found. Two modes; the user's words pick the mode, never the code:
   - **Lightweight (default).** One round, at most **three** questions, each with a recommended answer. Ask only what the code cannot answer: acceptance criteria, a choice between two valid designs, or a constraint the request left out. When step 1 answered everything, skip the round and state the assumptions under the description's **Constraints and decisions**.
   - **Deep.** Load the **grilling** skill and run it to completion. Use this mode only when the user asks for it: any `grill` phrase (`grill me`, `grilling`, `grill this`), or a request for a deep discussion or a stress test of the plan. The request can come in the original prompt or as an answer during the lightweight round; in that case, switch to deep before writing plan files.
   Never pick deep on your own. Ambiguity you find in lightweight mode is a question in the round, not a reason to escalate.
3. Pick a codename: a short kebab-case description of the goal.
4. Write the plan files in `~/.agents/plans/<repo>/<codename>/` from [references/plan-file-templates.md](references/plan-file-templates.md). This folder is `PLANS_DIR` for every `turn.sh` call; set it once here. The files: `<codename>-description.md` with the units table listing every unit file (seed `Checklist` as `0/<N>`, `Status` as `pending`), and one `<codename>-unit-NN.md` per unit. When the user handed you a plan file, put `Source plan:` in the description and `Source: <path>#<heading>` in each unit, and list only the deltas from that section under Proposed changes.
5. Each unit is independently committable, has a task checklist, and has a `## Validation` section with the exact commands the coder runs: `pnpm check` first when the repo defines a `check` script (its format, lint, typecheck and test group), then any targeted commands for the paths the unit touches. Include unit and integration tests when warranted. Show proposed changes as markdown diffs with inline comments that explain **why**.
6. Show the user the description and the units table. **Wait for approval** before executing.

## Phase 2 — Execute (per unit, in order)

Every worker prompt is one **foreground** `turn.sh` call with the tool's 10 minute timeout (`timeout: 600000`). Tags are `<unit>-<phase>-<attempt>` (`u02-impl-1`, `u02-review-2`, `all-gate-1`); never reuse one. Workers have no memory between units: the description's **Decisions log** is their only handoff. Slots: `PLANS_DIR` (the codename folder `~/.agents/plans/<repo>/<codename>`, never the plan root: the templates append `<codename>-description.md` to it), `CODENAME`, `UNIT` (`NN`), `SESSION` (never `--repo`), and for `review` also `REREVIEW` (empty, or `This is a re-review.`).

| `turn.sh` result | Do |
|---|---|
| exit 0 | act on the sentinel; `CHECKLIST=` and `TREE=` are on the following lines |
| exit 3 `timeout`, or exit 4 | `turn.sh --resume` with the same tag and slots, foreground, as often as needed |
| any other exit 3 | read [references/recovery.md](references/recovery.md) before touching the worker |

Before each `pending` unit, `TREE=` from the previous call (or `git status --porcelain` for the first unit) must be clean. If not, **stop and ask the user**; never stash or discard.

1. **Implement.** `set-state.sh <unit-file> implementing`, then `turn.sh $CODER_NAME uNN-impl-1 implement …`.
2. **Verify** from the same output: `CHECKLIST=` must read `N/N — done` and the sentinel `SUCCESS`. Otherwise one more `implement` turn (attempt 2); a second failure escalates to the user. On success `set-state.sh <unit-file> needs-review`.
3. **Review.** `turn.sh $REVIEWER_NAME uNN-review-<n> review … SESSION=$SESSION REREVIEW=`. The reviewer judges only the diff and the plan files: accuracy to the unit's tasks and the description's intent, logic errors, missed edge cases, and improvements. It writes findings as hunk agent notes prefixed `[blocking]` or `[nit]`, and FAILs only when a blocking note remains. Record it: `set-state.sh <unit-file> <current state> --review "cycle <n> — pass|fail — <note>"`.
4. **On FAIL:** `set-state.sh <unit-file> needs-fix`, `turn.sh $CODER_NAME uNN-fix-<n> fix … SESSION=$SESSION`, check `CHECKLIST=`, then re-review with the next review tag and `REREVIEW="This is a re-review."`. Maximum **two** fix cycles per unit; after the second failure, stop and ask the user.
5. **On `REVIEW-BLOCKED`:** the unit was never reviewed. Stop and ask the user, quoting the hunk error verbatim. No commit, no fix cycle, `State` unchanged. A dead daemon must never read as a clean review.
6. **On `NOTHING-TO-REVIEW`:** an empty diff after a coder SUCCESS is a contradiction, never a pass. Reconcile against `TREE=` and `HEAD=`, and never commit from here:
   - tree dirty: hunk watches the wrong tree or is stale. Treat as `REVIEW-BLOCKED`.
   - tree clean and `HEAD != Base`: the coder committed unreviewed. Show `git log <Base>..HEAD --oneline`, `set-state.sh … needs-review`, ask the user whether to review that range or revert it.
   - tree clean and `HEAD == Base`: nothing was produced. Accept only if `Commit scope` says the unit is verification-only; otherwise send one `fix` turn quoting the empty diff, then escalate.
7. **On SUCCESS:** `set-state.sh <unit-file> ready-to-commit`, then `turn.sh $CODER_NAME uNN-commit-1 commit …`. The coder writes the message in the **rm3-commit-message** format; you draft nothing and commit nothing. Then `after-commit.sh <unit-file> "<the sentinel line>"`. It exits 1 with the reason when the tree is dirty, the hash does not match `HEAD`, or `HEAD` still equals `Base`; show the reason and ask the user. It warns when a worker has no reset command: ask the user once for that CLI's new-context command, record it as `- Reset: coder=<cmd>, reviewer=<cmd>` under the description's **Constraints and decisions**, and send it by hand this once.
8. **Report** one line: unit name, review result, fix cycles used, commit hash. Continue to the next unit.

Decisions you cannot make from the plan, the code, or the review: ask the user. Everything else, decide yourself.

## Phase 3 — Complete

1. **Final gate.** The last unit's coder ran `pnpm check` on the tree that became its commit. If `HEAD` still equals that commit and the tree is clean, skip the gate and say so in the summary. Otherwise run `turn.sh $CODER_NAME all-gate-1 gate …`: full test suite and every linter, no changes. FAIL: stop and ask the user.
2. Set the description's `Status` line to `completed <date>`. Keep the plan folder as a record.
3. Recount every unit file with `count-tasks.sh` and confirm each row reads `N/N — done` with `committed <hash>` and each unit file's `State` says `committed`. The unit file wins over the table: correct the row with `set-state.sh`, and if a unit is genuinely short, stop and tell the user which one. Print the table as the final summary.

## Hard rules

- You never edit application code or commit; the coder does both on your instruction.
- The coder is the only role that runs `pnpm check`, lint, format, typecheck or tests. The reviewer judges the hand-written diff against the plan and never runs them; the gate is the coder's, and only when HEAD moved after the last unit.
- A dirty tree at a unit boundary stops the loop for a user decision.
- `REVIEW-BLOCKED` and `NOTHING-TO-REVIEW` never commit. A review you could not run, or an empty diff, is not a pass.
- A sentinel without the tag you issued is not a result. Never reuse a tag.
- The unit file's `State` line, not its checkboxes, says where the loop is. `set-state.sh` writes it at every transition; never edit plan state by hand, and never re-read a plan file to confirm a script edit.
- Every `turn.sh` call runs in the foreground. A `timeout` is resumed with `--resume`, never backgrounded, and never followed by a bare `herdr agent wait` or a re-sent prompt.
- Two fix cycles per unit, then escalate. Two explorer subagents at most, planning only.
- The interview is lightweight unless the user asks to be grilled. Never load the grilling skill on your own judgment.
- Roles are names. A worker's kind decides only its reset command; never infer a kind from a name, and never send a reset command the script or the user did not give you.
