The reviewer left feedback as hunk agent notes on your current changes for
{{PLANS_DIR}}/{{CODENAME}}-unit-{{UNIT}}.md.
If the unit file has a `Source:` line, read that section of the source file
first; the unit file lists only what differs from it.
1. Run: hunk session comment list {{SESSION}} --type agent
   Only outstanding notes are listed. Each summary starts with [blocking] or [nit].
2. Resolve every [blocking] note (each has a file and line anchor). Handle a [nit]
   only if it is cheap; name the ones you skipped in your summary. If a note is
   wrong, say why in your summary instead of changing code.
3. Update the unit file checklist if any box no longer holds, then re-tick it.
4. After your changes, run `pnpm check`, then re-run every command under
   ## Validation. Fix what fails and re-run until clean. Do NOT commit. As above,
   a failure in an untouched file is pre-existing only if you changed no tooling
   or config.
5. End with exactly one line, echoing the tag exactly:
   RM3-ORC[{{TAG}}]: SUCCESS — <one-line summary> — tests: <passed>/<total>, lint: <clean|N issues>
   or
   RM3-ORC[{{TAG}}]: FAIL — <one-line reason> — tests: <passed>/<total>, lint: <clean|N issues>
