The review passed. Commit all current changes as one commit.
If your harness can load the rm3-commit-message skill, load it and follow it
for the message. If it cannot, or the skill is missing, use its format anyway:
  <scope>: <Imperative subject, capitalized, no period, under 50 chars>
  <blank line>
  <body wrapped at 72 chars explaining WHY>
The scope is the subsystem this unit touched. The WHY is the goal stated in
{{PLANS_DIR}}/{{CODENAME}}-unit-{{UNIT}}.md — not a restatement of the diff.
Do not push. End with exactly one line, echoing the tag exactly:
RM3-ORC[{{TAG}}]: SUCCESS — committed <short-hash> — <one line the next unit's coder must know, or "no handoff">
