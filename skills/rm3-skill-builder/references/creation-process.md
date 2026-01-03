# Creating New Skills

## Contents
- [Skill Locations](#skill-locations) - Personal vs project skills
- [1. Gather Requirements](#1-gather-requirements) - Questions to ask
- [2. Design the Skill](#2-design-the-skill) - Name, description, degrees of freedom
- [3. Leverage CLI and Node.js](#3-leverage-cli-and-nodejs) - Modern tooling patterns
- [4. Create the Skill](#4-create-the-skill) - Writing SKILL.md and supporting files
- [5. Validate](#5-validate) - Constraint checklist
- [Editing Skills](#editing-skills) - Common improvements
- [Advanced Patterns](#advanced-patterns) - Script best practices
- [Testing and Evaluation](#testing-and-evaluation) - Verifying skill effectiveness

---

## Skill Locations

- **Personal Skills**: `~/.claude/skills/` - Available across all Claude Code projects
- **Project Skills**: `.claude/skills/` - Project-specific, shared with team

When a user wants to create a new skill, use this interactive process:

## 1. Gather Requirements

Ask the user:
- What task or workflow should this skill handle?
- When should Claude invoke this skill? (be specific)
- Should this be personal (global) or project-specific?
- Are there similar patterns in the official docs to reference?

## 2. Design the Skill

Based on requirements:
- Choose a name following team conventions: `prop-library-*` for library wrappers, `prop-domain-*` for domain knowledge, `prop-*` for workflows. For general-purpose skills, gerund-form names work well (e.g., `analyzing-csv-data`)
- Draft a compelling description in third person that clearly indicates when to invoke
- Plan the instruction structure focusing on CLI and Node.js workflows
- Consider what supporting files need intention-revealing names

### Degrees of Freedom

Match instruction specificity to task fragility:

| Freedom Level | When to Use | Example |
|---------------|-------------|---------|
| **High** (text instructions) | Multiple approaches valid, context-dependent | Code review guidelines |
| **Medium** (scripts with params) | Preferred pattern exists, some variation OK | Report generator with format options |
| **Low** (exact scripts) | Fragile operations, consistency critical | Database migrations, deployments |

Think of it as: narrow bridge (low freedom) vs. open field (high freedom).

## 3. Leverage CLI and Node.js

**Emphasize Modern Tooling:**
- Use CLI tools liberally (gh, aws, npm, etc.)
- Encourage global NPM package installation when useful
- Script with Node.js (v24+) using:
  - `.ts` files
  - ESM imports (`import`/`export`)
  - Modern JavaScript features
- Provide complete, runnable commands
- Show how to chain CLI operations

Example Node.js script pattern:

```typescript
#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Your implementation here
```

## 4. Create the Skill

- Create the skill directory in the appropriate location
- Write the SKILL.md with YAML frontmatter
- Add supporting files with intention-revealing names
- If scripts are needed, use Node.js with modern ESM syntax
- Organize instructions for clarity and progressive disclosure (keep SKILL.md under 500 lines; see [skill-requirements.md](./skill-requirements.md) for details)

## 5. Validate

Check:
- Name follows conventions: prefixed (`prop-library-*`, `prop-domain-*`, `prop-*`) or gerund form (max 64 chars, lowercase/numbers/hyphens only)
- Name doesn't contain reserved words ("anthropic", "claude") or XML tags
- Description is clear, concise, trigger-focused, and in third person (max 1024 chars)
- Description doesn't contain XML tags
- YAML frontmatter is properly formatted (no allowed-tools field)
- Instructions are actionable and complete
- SKILL.md body is under 500 lines
- Supporting files have intention-revealing names
- Reference files >100 lines have a table of contents
- All references are one level deep (no nested references)
- CLI and Node.js approaches are emphasized
- No Python scripts (use Node.js instead)

# Editing Skills

When refining existing skills:

## Common Improvements

1. **Refine Description**: Most critical for better invocation   - Add missing trigger keywords
   - Clarify use cases
   - Ensure third person voice
   - Test if description matches typical user queries

2. **Improve Organization**: Use progressive disclosure
   - Move detailed content to separate files with intention-revealing names
   - Keep SKILL.md focused on core instructions (under 500 lines)
   - Reference files with relative paths (e.g., [./processing-details.md](./processing-details.md))

3. **Add Supporting Files**:
   - Templates for common patterns
   - Node.js scripts for complex operations
   - Reference docs with descriptive names for detailed info

4. **Modernize Tooling**:
   - Replace Python scripts with Node.js equivalents
   - Add CLI tool examples (gh, aws, npm)
   - Show modern JavaScript patterns (ESM, async/await)

---

# Advanced Patterns

## Script Best Practices: Solve, Don't Punt

Scripts should handle errors explicitly rather than failing:

```javascript
// ✅ Good: Handle the error
async function processFile(path) {
  try {
    return await readFile(path, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`File ${path} not found, creating default`);
      await writeFile(path, '');
      return '';
    }
    throw err;
  }
}

// ❌ Bad: Just let it fail
async function processFile(path) {
  return await readFile(path, 'utf-8'); // throws if missing
}
```

**Avoid "voodoo constants"** - justify all magic numbers:

```javascript
// ✅ Good: Self-documenting
const REQUEST_TIMEOUT = 30_000; // HTTP requests typically complete within 30s
const MAX_RETRIES = 3; // Most intermittent failures resolve by second retry

// ❌ Bad: Magic numbers
const TIMEOUT = 47000; // Why 47?
const RETRIES = 5; // Why 5?
```

---

# Testing and Evaluation

## Test with Multiple Models

Skills behave differently across models. Test with all models you plan to use:

| Model | Consideration |
|-------|--------------|
| **Haiku** (fast, economical) | Does the skill provide enough guidance? May need more detail. |
| **Sonnet** (balanced) | Is the skill clear and efficient? Good baseline for testing. |
| **Opus** (powerful reasoning) | Does the skill avoid over-explaining? Can handle less structure. |

## Evaluation-Driven Development

Build evaluations BEFORE writing extensive documentation:

1. **Identify gaps**: Run Claude on tasks without the skill. Note failures.
2. **Create test scenarios**: Build 3+ scenarios that test these gaps.
3. **Establish baseline**: Measure performance without the skill.
4. **Write minimal instructions**: Just enough to pass evaluations.
5. **Iterate**: Execute evaluations, compare to baseline, refine.

## Feedback Loop

After creating a skill, use this validation loop:

1. **Test the skill** in a real conversation
2. **Observe behavior**: Does it trigger when expected? Are instructions followed?
3. **Note issues**: What's missing? What's confusing?
4. **Refine the skill** based on observations
5. **Repeat** until consistent

## Verification Checklist

After testing, verify:
- [ ] Skill triggers for expected user queries
- [ ] Description keywords match common user language
- [ ] Instructions are clear enough for the task complexity
- [ ] Supporting files are discovered and read when needed
- [ ] No unnecessary token usage from overly verbose content