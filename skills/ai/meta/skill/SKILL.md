---
name: metamind-skill
description: This skill should be used when the user asks to "create a skill", "write a new skill", "make a skill for X", "add a skill to ~/.claude/skills", "improve a skill description", "package a skill", or needs guidance on skill structure, progressive disclosure, or trigger-description quality for Claude Code skills.
---

# Skill Creator

Guidance for designing and building new Claude Code skills — standalone skills that live in
`~/.claude/skills/<name>/` (personal, all projects) or `<repo>/.claude/skills/<name>/`
(project-scoped, checked into git).

## About Skills

A skill is a modular package that extends Claude with specialized knowledge, workflows, or tool
integrations it would not reliably have otherwise — think of it as an onboarding guide for a
specific domain or repeated task, not a place to restate general programming knowledge.

### Anatomy

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter — name, description (required)
│   └── Markdown instructions
└── Bundled resources (optional)
    ├── scripts/     - executable code for deterministic, repeatable steps
    ├── references/  - docs loaded into context only when the skill triggers and Claude needs them
    └── assets/      - templates/files copied into output, never loaded into context
```

Only create the subdirectories actually needed — do not scaffold empty `references/`, `scripts/`,
or `assets/` folders "just in case."

### Progressive disclosure

Three loading tiers, in order of when Claude sees them:

1. **Frontmatter (name + description)** — always resident in context, so it must be self-sufficient
   for Claude to decide whether to trigger. Keep to roughly 100 words.
2. **SKILL.md body** — loaded only once the skill triggers. Target 1,500–2,000 words, hard cap ~3,000.
3. **references/ and scripts/** — loaded or executed only as needed, effectively unlimited size.

If SKILL.md is growing past ~3,000 words, that is the signal to move detail into
`references/*.md` and leave a pointer behind.

## Creation process

### 1. Nail down concrete trigger examples

Before writing anything, get 2-4 concrete phrases a user would actually say that should trigger
this skill (e.g. "rotate this PDF", "add a hook for PreToolUse"). If the user's request is vague,
ask this first — a skill with a fuzzy trigger either never fires or fires on the wrong things.
Skip this step only if the usage pattern is already unambiguous.

### 2. Decide what's reusable vs. what belongs in the body

For each concrete example, ask: if executed from scratch with no skill, what would be
re-derived or re-written every time? That's what belongs in a bundled resource instead of prose:

- Same code rewritten each time → `scripts/do_thing.sh` (or `.py`)
- Same schema/domain facts re-discovered each time → `references/schema.md`
- Same boilerplate/template copied each time → `assets/template/`

Everything else — the actual step-by-step procedure — stays in the SKILL.md body.

### 3. Scaffold the directory

Use `scripts/init_skill.sh` to generate the skeleton and template frontmatter:

```bash
~/.claude/skills/skill-creator/scripts/init_skill.sh <skill-name>            # personal skill
~/.claude/skills/skill-creator/scripts/init_skill.sh <skill-name> --project  # project skill (./.claude/skills)
```

This only creates `SKILL.md` with placeholders — add `references/`, `scripts/`, `assets/`
subdirectories by hand, only the ones actually needed.

### 4. Write the frontmatter description first

This is the highest-leverage part of the whole skill — it is the only thing always in context,
and it is entirely what determines whether the skill ever fires. Rules:

- **Third person**, not second: `"This skill should be used when..."`, never `"Use this when you..."`.
- **Concrete trigger phrases in quotes**, not abstract categories: `"rotate this PDF"` beats
  `"handles PDF manipulation"`.
- List 3-6 distinct phrasings/scenarios, covering the different ways the same intent gets phrased.
- No filler like "provides guidance for" with nothing after it — every clause should be a trigger
  or a scope boundary.

Bad: `description: Use this skill when working with hooks.`
Good: `description: This skill should be used when the user asks to "create a hook", "add a PreToolUse hook", "validate tool use", or mentions hook events (PreToolUse, PostToolUse, Stop).`

### 5. Write the body in imperative/infinitive form

Verb-first instructions, not narrated second-person advice:

- Correct: `To rotate a PDF, call scripts/rotate_pdf.py with the angle and file path.`
- Incorrect: `You should call the script when you want to rotate a PDF.`

Structure the body as: purpose (1-2 sentences) → when it applies (brief, detail already lives in
frontmatter) → the actual procedure, referencing bundled resources by path as they come up. End
with an "Additional Resources" section listing every `references/` and `scripts/` file and one
line on when to open each — see `references/checklist.md` for the exact pattern and a full
pre-ship checklist.

### 6. Validate before considering it done

Run through `references/checklist.md`. In short: frontmatter has both required fields, description
is third-person with concrete triggers, body is imperative and under ~3,000 words, every path
mentioned in the body actually exists on disk, and no information is duplicated between SKILL.md
and a references file.

### 7. Ship it, then iterate from real use

A skill's first draft is a hypothesis about how it'll be used. After using it for real, the
biggest gains come from noticing exactly where Claude hesitated, missed the trigger, or reached
for the wrong resource, and fixing that specific thing — not from proactively expanding scope.

## Personal vs. project skills

- **Personal** (`~/.claude/skills/<name>/`): available in every project, not version-controlled
  with any repo. Right default for cross-project workflows (this skill included).
- **Project** (`<repo>/.claude/skills/<name>/`): checked into the repo, available to anyone who
  clones it, travels with the codebase's conventions. Use when the skill only makes sense in the
  context of that specific repo (its schemas, its scripts, its domain).

## Additional Resources

### Reference Files

- **`references/checklist.md`** — full pre-ship validation checklist, common mistakes with
  before/after examples, and the "Additional Resources" section template to close out a SKILL.md.

### Scripts

- **`scripts/init_skill.sh`** — scaffolds a new `SKILL.md` with frontmatter placeholders, either
  under `~/.claude/skills/` or the current repo's `.claude/skills/`.
