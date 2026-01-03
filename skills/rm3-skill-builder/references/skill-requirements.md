# Skill Structure

## Contents
- [Hard Constraints](#hard-constraints) - Name, description, and file limits
- [Directory Structure](#directory-structure) - How to organize skill files
- [SKILL.md Format](#skillmd-format) - YAML frontmatter and markdown body
- [SKILL.md Requirements](#skillmd-requirements) - Metadata and description guidelines
- [Bundled Resources](#bundled-resources) - Scripts, references, and assets
- [Progressive Disclosure](#progressive-disclosure) - Three-level loading system

---

## Hard Constraints

### Name Field
- Maximum **64 characters**
- Only lowercase letters, numbers, and hyphens allowed
- Cannot contain XML tags
- Cannot contain reserved words: "anthropic", "claude"

### Description Field
- Maximum **1024 characters**
- Cannot contain XML tags
- Must be non-empty
- Write in **third person** (not "I can help you..." or "You can use this...")

### File Structure
- SKILL.md body: **Under 500 lines** (use progressive disclosure for more)
- Reference files >100 lines: Include table of contents at top
- Reference depth: Keep **one level deep** from SKILL.md (no nested references)
- Paths: Use forward slashes only (Unix-style, not Windows backslashes)

---

## Directory Structure

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Node.js/TypeScript/Bash)
    ├── references/       - Documentation loaded into context as needed
    └── assets/           - Files used in output (templates, icons, fonts)
```

## SKILL.md Format

```yaml
---
name: skill-name
description: Clear description of what this Skill does and when to use it (max 1024 chars)
---

# Main Instructions

Clear, detailed instructions for Claude to follow when this skill is invoked.

## Step-by-Step Guidance

1. First step
2. Second step
3. Third step

## Examples

Concrete examples showing how to use this skill.

## Best Practices

Tips for optimal results.
```

## SKILL.md Requirements

- **File name:** `SKILL.md` (uppercase)
- **File size:** Under 500 lines; split to `references/` if needed
- **Metadata:** `name` and `description` in YAML frontmatter determine activation
- **Style:** Use third-person ("This skill should be used when...")
- **description**: THE MOST CRITICAL field - determines when Claude invokes the skill
  - Must clearly describe the skill's purpose AND when to use it
  - Include trigger keywords and use cases
  - Write in third person
  - Think from Claude's perspective: "When would I need this?"
  - Keep under 1024 characters
- **NO allowed-tools field**: Skills inherit all Claude Code CLI capabilities; the field is not supported and will be ignored

## Bundled Resources

### Scripts (`scripts/`)

Executable code for tasks requiring deterministic reliability or repeatedly rewritten.

- **When to include**: Same code rewritten repeatedly, deterministic reliability needed
- **Example**: `scripts/rotate-pdf.ts` for PDF rotation
- **Benefits**: Token efficient, deterministic, executed without loading into context
- **Note**: May still be read for patching or environment adjustments

### References (`references/`)

Documentation loaded as needed into context.

- **When to include**: Documentation Claude should reference while working
- **Use cases**: Database schemas, API docs, domain knowledge, company policies, workflow guides
- **Benefits**: Keeps SKILL.md lean, loaded only when needed
- **Best practice**: For large files (>10k words), include grep patterns in SKILL.md
- **Avoid duplication**: Info lives in SKILL.md OR references, not both
- **Important File Naming Conventions:**
    - Use intention-revealing names for all supporting files
    - Examples: `./converting-sub-agents.md`, `./aws-deployment-patterns.md`, `./github-workflow-examples.md`
    - NOT: `./reference.md`, `./helpers.md`, `./utils.md`
    - Reference files with relative paths like `./filename.md` in SKILL.md

### Assets (`assets/`)

Files used in output, not loaded into context.

- **When to include**: Files used in final output
- **Examples**: `assets/logo.png`, `assets/slides.pptx`, `assets/frontend-template/`
- **Use cases**: Templates, images, icons, boilerplate, fonts, sample documents
- **Benefits**: Separates output resources from documentation
## Progressive Disclosure

Three-level loading system:

1. **Metadata** (~100 words) - Always in context
2. **SKILL.md body** (<5k words) - When skill triggers
3. **Bundled resources** (Unlimited) - As needed by Claude

### Best Practices for Progressive Disclosure

**Keep references one level deep:**
- All reference files should link directly from SKILL.md
- Bad: `SKILL.md → advanced.md → details.md` (too deep)
- Good: `SKILL.md → advanced.md`, `SKILL.md → details.md` (flat)

**Table of contents for large files:**
For reference files >100 lines, include a table of contents:

```markdown
# API Reference

## Contents
- Authentication and setup
- Core methods (create, read, update, delete)
- Error handling patterns
- Code examples

## Authentication and setup
...
```

**Organize by domain:**
```
reference/
├── finance.md (revenue, billing metrics)
├── sales.md (opportunities, pipeline)
└── product.md (API usage, features)
```

**Use intention-revealing names:**
- Good: `./converting-sub-agents.md`, `./aws-deployment-patterns.md`
- Bad: `./reference.md`, `./helpers.md`, `./doc1.md`