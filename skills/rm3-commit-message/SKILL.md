---
name: rm3-commit-message
description: Writes clear, well-formatted git commit messages following a scope-first convention built on the seven rules of a great commit message. Triggers when users ask to commit changes, write a commit message, or say "git commit". Also handles casual phrasing like "commit this" or "what should my commit say", and questions about commit conventions, subject line style, imperative mood, or how to write a commit body.
metadata:
  tags: git, commit, version-control, workflow
---

# Git Commit Messages

A diff tells you *what* changed. Only the commit message can tell you *why*.
Write for the person who runs `git blame` on this line in two years — often you.

## Format

```
<scope>: <description>

<body>

<footer>
```

- `<scope>` — the subsystem, area, or module the commit touches (e.g. `auth`, `api`, `data-loader`)
- `<description>` — a short summary of the change

## The seven rules

1. Separate subject from body with a blank line
2. Limit the subject line to 50 characters
3. Capitalize the subject line
4. Do not end the subject line with a period
5. Use the imperative mood in the subject line
6. Wrap the body at 72 characters
7. Use the body to explain what and why, not how

Rule 1 is the one tools depend on: `log`, `shortlog`, `rebase`, and
`format-patch` all treat the text up to the first blank line as the title. Run
the subject and body together and they get confused.

50 characters is a target, not a hard limit — 72 is the hard limit, because
GitHub truncates past it. The `<scope>:` prefix counts against that budget. A
long scope means a shorter description; pick the shorter scope, not a longer
subject line.

## The imperative test

A correct subject line completes this sentence:

> If applied, this commit will **<subject line>**

| Subject line | Reads as | Verdict |
|---|---|---|
| Remove deprecated methods | …will *remove deprecated methods* | correct |
| Fixed bug with Y | …will *fixed bug with Y* | wrong — past tense |
| Changing behavior of X | …will *changing behavior of X* | wrong — gerund |
| Sweet new API methods | …will *sweet new API methods* | wrong — not a verb |

Git itself writes in the imperative when it commits on your behalf (`Merge
branch 'myfeature'`, `Revert "Add the thing"`). Following the same mood keeps
your messages consistent with the ones Git generates for you.

The imperative matters only in the subject line. Relax it in the body.

## Scope

The scope is the most important part of the subject — it lets contributors,
debuggers, and incident responders scan the log and immediately know what area
was touched.

- Use the subsystem, module, or area affected: `auth`, `api`, `cache`, `docs`, `ci`
- If a commit touches multiple scopes, use a more general one, list both separated by a comma, or use `treewide`
- If no clear scope exists, omit it and write a plain description

## Body

Skip the body for simple changes — a subject line alone is correct when the
change needs no context. `docs: Fix typo in user guide` says everything; if the
reader wants the typo, `git show` has it.

Add a body when a future reader would ask "why?".

- Separate it from the subject with a blank line
- Wrap lines at 72 characters — Git never wraps for you
- Cover three things: how it worked before and what was wrong with that, how it
  works now, and why you solved it this way
- Leave out *how*. The diff shows that. If the code is complex enough to need
  prose, that belongs in a source comment, not the log
- Note side effects and non-obvious consequences here — this is the only place
  they get recorded
- Bullet points are fine: a hyphen, one space, a blank line between items

## Footer

- Reference issues: `Fixes #123`, `Closes #456`, `Refs #789` — GitHub auto-closes issues on merge
- Non-closing references go at the bottom too: `Resolves: #123`, `See also: #456, #789`
- Breaking changes: `BREAKING CHANGE:` followed by what broke and how to migrate
- Ticket numbers: include in the footer — `TICKET-123`

## Anti-patterns

| Bad | Why | Better |
|---|---|---|
| `Fixed bug with Y` | past tense | `parser: Fix crash on empty input` |
| `Changing behavior of X` | gerund | `api: Return 404 for missing users` |
| `More fixes for broken stuff` | says nothing | name the thing that was broken |
| `polishing` | says nothing | name what you polished, or squash it away |
| `Tweaks to package-info.java files` | describes contents, not intent | say what the tweak achieves |
| `Add caching and fix the retry bug and bump deps` | three commits in one | split into three |
| A full paragraph as the subject line | no body, unreadable in `--oneline` | 50-char subject, rest in the body |

A subject line that needs "and" is a commit that needs splitting. If summarizing
is hard, you are committing too many changes at once.

## Examples

```
cache: Add Redis caching for API responses

API response times were hitting 2-3 seconds for repeated queries.
Added Redis with 5-minute TTL. This drops response time to ~50ms
for cached queries.

Considered in-memory cache but Redis allows horizontal scaling.
```

```
preprocessing: Handle NaN values in feature engineering

The pipeline crashed on NaN values in the 'age' column. Added
fillna() with median imputation before scaling.
```

```
data-loader: Split into separate modules

Moved dataset classes to datasets.py, transformations to
transforms.py, and utilities to utils.py. Original file was
800+ lines and hard to navigate.

No behavior changes — all tests still pass.
```

```
batch: Prevent memory leak in processing

Large datasets caused memory to grow unbounded. The issue was
holding references to processed batches in the results list.

Changed to yield results instead of accumulating them.

Fixes #247
```

```
docs: Add examples for custom loss functions
```

## Workflow

1. Run `git diff` to review what changed
2. Identify the single logical change. If the subject line is hard to write
   because the diff does several unrelated things, split it into separate
   commits before writing anything
3. Identify the scope — what area of the codebase does this touch?
4. Write the description, then run the imperative test on it
5. Add a body if the why isn't obvious
6. Reference any related issues in the footer
7. Run the commit using a heredoc to preserve formatting:
   ```bash
   git commit -m "$(cat <<'EOF'
   scope: Description here

   Body here if needed.

   Footer here if needed.
   EOF
   )"
   ```
8. Commit to current branch unless specified by the user
