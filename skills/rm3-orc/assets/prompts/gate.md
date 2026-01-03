Every unit of {{PLANS_DIR}}/{{CODENAME}}-description.md is committed. Run
`pnpm check` once for the whole repository (or, if there is no `check` script,
the full test suite and every linter). Change nothing. Report each command and
its exit code, then end with exactly one line, echoing the tag:
RM3-ORC[{{TAG}}]: SUCCESS — <one-line summary> — tests: <passed>/<total>, lint: <clean|N issues>
or
RM3-ORC[{{TAG}}]: FAIL — <which command failed and how> — tests: <passed>/<total>, lint: <clean|N issues>
