# @rm3/lefthook-config

Shared `pre-commit` jobs and an on-demand `check` group for rm3 repos.
Peer tool: `lefthook@^2.1.12`.

## Feedback during refactoring

Add this script to the consuming repository's `package.json`:

```json
{
    "scripts": {
        "check": "lefthook run check --no-tty"
    }
}
```

Run `pnpm check` after editing code. The `check` group runs formatting checks,
linting, typechecks, and tests in parallel and returns a nonzero exit code if any
job fails. All four jobs run even when one fails, so AI tools get feedback from
each check in one invocation.

Consumers must define these scripts; missing scripts fail the check:

| Job            | Consumer script | Requirement                                                   |
| -------------- | --------------- | ------------------------------------------------------------- |
| `check-format` | `format:check`  | Check formatting without rewriting files                      |
| `check-lint`   | `lint`          | Check lint without fixing; accept `--max-warnings 0` (Oxlint) |
| `check-types`  | `typecheck`     | Check the project's types                                     |
| `check-tests`  | `test`          | Run tests once and exit, without watch mode                   |

The jobs use the scripts' full scope, including unstaged edits, without staged-file
filters or re-staging. Keep these scripts safe to run concurrently and avoid calling
`check` from them. Typecheck caches can be retained between runs.

To get focused feedback, select jobs directly:

```sh
pnpm exec lefthook run check --job check-types --job check-tests --no-tty
```

## Pre-commit jobs

| job                | glob              | what it does                                                   |
| ------------------ | ----------------- | -------------------------------------------------------------- |
| `oxfmt`            | JS/TS/JSON        | `oxfmt` on the staged files, re-staged                         |
| `oxlint`           | JS/TS             | `oxlint --fix --max-warnings 0` on the staged files, re-staged |
| `no-focused-tests` | `*.test.{ts,tsx}` | fails on `describe.only` / `test.only` / `it.only`             |

`no-focused-tests` exists because oxlint's jest and vitest plugins only recognise their own
imports, so neither sees a focused `node:test` case.

The two fixing jobs run one after the other (`parallel: false`) because both rewrite files.

## How a consumer extends it

```yml
# lefthook.yml
extends:
    - node_modules/@rm3/lefthook-config/lefthook.yml
```

**An extended file overrides a same-named local job.** Do not reuse the names `oxfmt`, `oxlint`
or `no-focused-tests` for your own pre-commit jobs, or the four `check-*` names for
your own check jobs — pick a different name, or the shared definition wins.

To skip one of the three locally, add a gitignored `lefthook-local.yml`:

```yml
# lefthook-local.yml (gitignored)
pre-commit:
    jobs:
        - name: oxlint
          skip: true
```

Install the hooks with `pnpm lefthook install`.
