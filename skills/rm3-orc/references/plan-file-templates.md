# Plan File Templates

Plans live in `~/.agents/plans/<repo>/<codename>/`. Never git-track them. The orchestrator
owns both files; the coder ticks boxes in the unit file and touches nothing else.

## Contents
- Description file template
- Unit file template
- Resume detection rules

## Description file template

`<codename>-description.md`:

```markdown
# <Plan title>

Status: in-progress          <!-- set to `completed <YYYY-MM-DD>` in Phase 3 -->
Repo: <absolute repo root>
Created: <YYYY-MM-DD>

## Goal

<What the user wants and why, distilled from the grilling interview.>

## Constraints and decisions

- <Decisions the user made during grilling, with the reason.>
- Reset: coder=<cmd>, reviewer=<cmd>   <!-- only when find-siblings.sh left a *_RESET empty
                                            and the user supplied the command; outranks the
                                            script value on resume -->

## Decisions log

<!-- One line per committed unit: what the next coder must know (new helper, changed
     API, moved path). Workers start every unit with fresh context; this is their memory. -->
- unit 01: <decision>

## Units of work

<!-- Every unit file MUST be listed. The unit file is the source of truth; this table
     mirrors it. Refresh a row whenever that unit's checklist or State changes. -->
| # | File | Title | Checklist | Status |
|---|------|-------|-----------|--------|
| 01 | <codename>-unit-01.md | <title> | 5/5 — done | committed <hash> |
| 02 | <codename>-unit-02.md | <title> | 2/4 — writing unit tests | implementing |
| 03 | <codename>-unit-03.md | <title> | 0/3 | pending |
```

`Checklist` is the output of `scripts/count-tasks.sh <unit-file>`, pasted verbatim. Recount
from the file every time; never increment a remembered number or infer one from a sentinel.
`Status` mirrors the unit file's `State` line. When the two disagree, the unit file wins:
recount and rewrite the row. Never make a decision from the table alone.

## Unit file template

`<codename>-unit-NN.md`:

````markdown
# Unit NN — <title>

Depends on: <none | unit NN>
Commit scope: <one sentence: what this commit delivers on its own>
State: pending      <!-- pending | implementing | needs-review | needs-fix | ready-to-commit | committed <hash> -->
Base: none          <!-- short HEAD hash when implementing began; the orchestrator sets it -->

## Tasks

<!-- The coder ticks these as it completes each task. Only boxes under this heading count. -->
- [ ] <task 1>
- [ ] <task 2>
- [ ] Unit tests: <what they must cover>        <!-- when warranted -->
- [ ] Integration tests: <what they must cover> <!-- when warranted -->
- [ ] Run the commands under ## Validation; all exit 0

## Validation

<!-- Commands the coder must run for THIS unit, each expected to exit 0. `pnpm check`
     (format, lint, typecheck, tests) comes first when the repo defines it. Add targeted
     commands for the paths this unit touches. The reviewer never runs these; the coder does. -->
- `pnpm check`
- `pnpm test -- <path>`   <!-- optional targeted extras -->


## Proposed changes

<!-- Diff markdown with inline comments explaining WHY, not what. -->

```diff
 function handle(input) {
+  // Guard: upstream callers pass undefined on cold start (see unit goal)
+  if (input == null) return defaultResult()
   return compute(input)
 }
```

## Review cycles

<!-- Orchestrator appends one line per review: cycle N — pass|fail — note -->
````

Checkboxes say how far the **coder** got. `State` says which step of the **loop** the unit
is in; SKILL.md Phase 2 sets it at every transition. The coder ticks every box before the
review starts, so `N/N` alone cannot tell "implemented" from "committed". `Base` is the
commit the unit builds on: it lets a resume prove a dirty tree is this unit's work
(`git diff --stat <Base>`) and detect a commit nobody reviewed (`git log <Base>..HEAD`).

## Resume detection rules

A plan is **unfinished** when its description `Status` is not `completed`, or any unit
file's `State` is not `committed <hash>`. Decide from the **unit files**, not the table.

On resume, recount every unit and rewrite the whole table first, so the user sees a true
picture. Then take the first non-committed unit and enter the loop from this table.
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

If a worker may still be busy on the outstanding tag, recover with the tagged
`pane wait-output` from the command reference; never re-send the prompt while it is busy.
