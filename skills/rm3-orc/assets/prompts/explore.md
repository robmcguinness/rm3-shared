Explore {{REPO}} for this request and report ONLY what a diff author needs.
Question: {{QUESTION}}

Report, per file the change will touch or copy from, in this order:
1. Path.
2. The exact current excerpt, with line numbers, that the change will replace or
   extend. Quote it verbatim; do not paraphrase. Include just enough surrounding
   lines that a diff against it applies cleanly.
3. The one neighbouring pattern to copy: an existing function, test, or config
   block that the new code should look like. Quote it verbatim with line numbers.
4. The constraint that binds here, if any: a type it must satisfy, a lint rule
   the repo enforces, the import style, the test harness in use.

Rules: no summaries of unrelated code, no recommendations, no alternatives, no
restating the request. If a file you expected does not exist, say so in one
line. Keep the whole report under 150 lines.
