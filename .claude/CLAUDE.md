# km-ai-kit

A personal AI toolkit — centralized library for Claude Code skills (slash commands), subagents, MCP server configs, and reusable prompts. No code lives here, only AI configuration.

## Repo structure

```
km-ai-kit/
├── .claude/
│   ├── CLAUDE.md        # This file
│   └── settings.json    # MCP server configs (committed, no secrets)
├── skills/              # Skill library, grouped by category (2 levels)
│   └── <category>/
│       └── <skill>.md
├── agents/              # Subagent library
│   └── <agent>.md
└── active/               # Gitignored — machine-local staging area (see workflow)
    └── <namespace>/     # Named namespace, e.g. "main" for your default
        ├── skills/      # Soft-links to selected skills
        └── agents/      # Soft-links to selected agents
```

## File formats

### Skill (`skills/<category>/<skill>.md`)

```markdown
---
description: One-line summary shown in /help
---

Your prompt instructions here.
```

### Subagent (`agents/<agent>.md`)

```markdown
---
name: my-agent
description: What this agent does and when to use it
model: sonnet # optional: sonnet | opus | haiku | fable
tools:
  - Read
  - Bash
---

System prompt / instructions for this agent.
```

---

## Usage — two options

### Option 1: Copy

Copy the desired files directly into the target location.

```bash
# Global (available in all projects)
cp skills/<category>/<skill>.md ~/.claude/commands/

# Project-specific
cp skills/<category>/<skill>.md <project>/.claude/commands/
```

Use this when you need a stable snapshot that won't change with the repo.

---

### Option 2: Soft-link (live sync)

Changes to this repo reflect immediately at the usage place — no re-copying needed.

**Step 1 — Create a namespace and stage your selection**

Create a namespace (use `main` for your default) and soft-link the skills/agents you want:

```bash
pnpm ns:init          # creates active/main/
pnpm ns:init work     # creates active/work/

ln -s $(pwd)/skills/<category>/<skill>.md active/main/skills/<skill>.md
ln -s $(pwd)/agents/planner.md            active/main/agents/planner.md
```

**Step 2 — Link the namespace to the usage place**

Soft-link `active/<namespace>/skills` (or `agents`) to the target.
Note: Claude Code expects the folder to be named `commands`, so link accordingly:

```bash
# Global — available across all projects
ln -s $(pwd)/active/main/skills ~/.claude/commands
ln -s $(pwd)/active/main/agents ~/.claude/agents

# Project-specific
ln -s $(pwd)/active/main/skills <project>/.claude/commands
ln -s $(pwd)/active/main/agents <project>/.claude/agents
```

> `active/` is gitignored — machine-local, never pushed. Each machine maintains its own namespaces and selection.

---

## Conventions

- Name files in `kebab-case`.
- Keep each skill/agent focused on one job.
- `description:` frontmatter is the single source of truth for what something does.
- MCP configs go in `.claude/settings.json`; keep secrets out of it (use `settings.local.json` which is gitignored).
