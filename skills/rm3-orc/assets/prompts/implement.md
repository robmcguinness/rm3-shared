Read the plan first:
- High-level context, including its Decisions log: {{PLANS_DIR}}/{{CODENAME}}-description.md
- Your unit: {{PLANS_DIR}}/{{CODENAME}}-unit-{{UNIT}}.md

Implement ONLY this unit. Rules:
1. Tick each checkbox under ## Tasks in the unit file as you complete the task.
2. Write the unit/integration tests the checklist names.
3. After your code changes, run `pnpm check` (the repo's format, lint, typecheck
   and test group). If the repo has no `check` script, run the equivalent
   scripts directly. Then run every command under the unit file's ## Validation
   heading. Fix what fails, re-run until clean, and report each command's exit
   code in your summary. A failure in a file you did
   not touch is pre-existing ONLY if your unit changed no tooling or config file
   (lint, format, test, tsconfig, package.json, CI). If it did change one, that
   failure is yours: fix it. A true pre-existing failure: name it in the summary,
   do not fix it, and do not let it turn your sentinel into FAIL.
4. Do NOT commit. Do not touch other units. Do not edit the description file.
5. End your reply with exactly one line, echoing the tag exactly — it is how the
   orchestrator matches this reply:
   RM3-ORC[{{TAG}}]: SUCCESS — <one-line summary> — tests: <passed>/<total>, lint: <clean|N issues>
   or, if you could not finish:
   RM3-ORC[{{TAG}}]: FAIL — <one-line reason> — tests: <passed>/<total>, lint: <clean|N issues>
