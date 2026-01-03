---
name: rm3-skill-builder
description: Creates and edits Claude Code skills from scratch, converts sub-agents to skills, and designs skill workflows. Triggers when users ask about skill structure, SKILL.md files, skill best practices, organizing skill directories, or converting agents to skills. Also triggers on "make a skill", "turn this into a skill", "skill template", writing reusable instructions for Claude, or anything involving skill frontmatter, bundled resources, or progressive disclosure patterns. Covers YAML frontmatter, progressive disclosure, bundled resources, and validation.
---

# Skill Creator

Skills are modular packages that extend Claude's capabilities with specialized knowledge, workflows, and tools. They transform Claude from a general-purpose agent into a domain specialist.

## Skill Creation Checklist

Copy this checklist and track your progress:

```
Skill Creation Progress:
- [ ] Step 1: Gather requirements (purpose, triggers, location)
- [ ] Step 2: Design skill (prefixed or gerund name, third-person description)
- [ ] Step 3: Write SKILL.md (<500 lines, YAML frontmatter)
- [ ] Step 4: Add supporting files (intention-revealing names)
- [ ] Step 5: Validate against constraints
- [ ] Step 6: Test the skill in a conversation
```

## Key Constraints

| Field | Constraint |
|-------|-----------|
| `name` | Max 64 chars, lowercase/numbers/hyphens only, no "anthropic"/"claude" |
| `description` | Max 1024 chars, non-empty, **third person**, no XML tags |
| SKILL.md body | Under 500 lines |
| Reference files >100 lines | Must have table of contents at top |
| Reference depth | One level deep from SKILL.md (no nested refs) |
| File paths | Unix-style forward slashes only |

## Example: Good vs Bad

**Good descriptions (third person, trigger-aggressive):**

Library skill:
```yaml
description: Creates structured JSON loggers using @cebroker/pino with environment auto-detection for Lambda, Fargate, and default deployments. Triggers when setting up logging, creating loggers, configuring pino, or troubleshooting log output in Node.js services.
```

Workflow skill:
```yaml
description: Plans and implements Jira tickets through structured brainstorming. Explores codebases, asks clarifying questions about ticket requirements, and creates implementation plans. Triggers when implementing Jira stories, bugs, tasks, or when user invokes /prop:jira command.
```

Domain knowledge skill:
```yaml
description: Provides CEBroker Oracle database schema documentation for the Rules Engine compliance system. Triggers when queries involve CEBroker database, CE compliance, license periods, roster processing, employer tracking, or Oracle schema lookups.
```

**Bad description (second person, no triggers):**
```yaml
description: Use this skill when you need to work with PDFs. I can help you extract text and fill forms.
```

## Progressive Disclosure

Skills use three-level loading:

1. **Metadata** (~100 words) - Always in context, determines activation
2. **SKILL.md body** (<500 lines) - Loaded when skill triggers
3. **Bundled resources** (unlimited) - Loaded as needed by Claude

## Quick Reference

| Topic | Reference |
|-------|-----------|
| Directory structure, SKILL.md format, bundled resources | [references/skill-requirements.md](./references/skill-requirements.md) |
| Step-by-step creation process, editing skills, advanced patterns | [references/creation-process.md](./references/creation-process.md) |

## Anti-Patterns to Avoid

- **Vague descriptions**: "Helps with documents" - be specific
- **Nested references**: `SKILL.md → advanced.md → details.md` - keep flat
- **Windows paths**: Use `scripts/helper.py` not `scripts\helper.py`
- **Time-sensitive info**: Don't include dates that will become stale
- **Too many options**: Provide a default, mention alternatives only if needed

## Naming Convention

Use prefixed names to organize skills by category:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `rm3-library-*` | Wraps an internal library | `rm3-library-axios`, `rm3-library-pino` |
| `rm3-domain-*` | Domain knowledge (schemas, business rules) | `rm3-domain-cebroker-oracle` |
| `rm3-*` | Workflows and tooling | `rm3-jira-implement`, `rm3-create-plan` |

For general-purpose skills outside a team context, gerund-form names work well (e.g., `analyzing-csv-data`).

## Skill Template

```yaml
---
name: rm3-skill-name
description: What this skill does in one sentence. Triggers when [specific conditions — tasks, file types, libraries, or user phrases that signal this skill is relevant].
metadata:
  tags: keyword1, keyword2, keyword3
---
## Key concepts
Brief essential knowledge — 3-5 bullets covering the most critical rules or constraints.

- **Concept one** — one-line explanation. See [references/concept-one.md](references/concept-one.md) for details.
- **Concept two** — one-line explanation.
- **Concept three** — one-line explanation.

## Reference
Read individual files on demand — only open what the current task requires:

- [references/topic-a.md](references/topic-a.md) — what it covers
- [references/topic-b.md](references/topic-b.md) — what it covers
```