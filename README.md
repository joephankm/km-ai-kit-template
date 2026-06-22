# KM AI Kit

A personal toolkit for collecting and developing AI items (skills, agents, rules, prompts, etc.) across AI tools.

→ [What is this? / Getting set up for the first time](docs/about-this.md)  
→ Browse: [Skills](docs/lists/skills.md) · [Agents](docs/lists/agents.md)

---

## 🚀 Getting Started

> **New here?** See [docs/about-this.md](docs/about-this.md) for an introduction and a guide to installing Node.js and pnpm.

```bash
git clone <this-repo> km-ai-kit
cd km-ai-kit
pnpm install
```

Add your skills under `skills/<category>/` and agents under `agents/`. Then choose a workflow below to activate them.

---

## 📖 How to Use

There are two workflows depending on how much control you need.

### Flow 1 — Via namespace (recommended)

Stage items into a local namespace (`active/`), then link the whole namespace to your AI tool's directory at once.
This is the right choice when you want a curated selection of items active at a time and want updates to propagate
automatically via symlinks.

**Step 1 — Initialize a namespace**

```bash
pnpm ns:init           # creates active/main/ (default namespace)
pnpm ns:init work      # creates active/work/ (named namespace)
```

**Step 2 — Load items into the namespace**

```bash
pnpm skill:load category/my-skill              # symlink (default)
pnpm skill:load category/my-skill --copy       # copy instead
pnpm skill:load category/                      # load entire category
pnpm skill:load category/a category/b          # multiple items
```

**Step 3 — Link the namespace to the target directory**

```bash
pnpm skill:link                  # links skills → ~/.claude/commands (global, e.g. Claude Code)
pnpm skill:link ~/myproject      # links skills → ~/myproject/.claude/commands (project-scoped)
pnpm agent:link                  # links agents → ~/.claude/agents
pnpm agent:link ~/myproject      # links agents → ~/myproject/.claude/agents
```

After linking, `active/<namespace>/skills` becomes a live symlink target — any items you add or remove from the
namespace are immediately visible to the AI tool without re-linking.

**Other namespace commands**

```bash
pnpm skill:unload my-skill       # remove a skill from the namespace
pnpm skill:persist my-skill      # convert a symlinked skill to a real file (detach from source)
pnpm skill:unlink                # remove the link to the target directory
pnpm ns:clean                    # remove the namespace entirely
```

---

### Flow 2 — Direct

Load items straight into the target directory without staging. Use this for one-off additions or when you don't need
namespace management.

```bash
pnpm direct:skill:load ~ category/my-skill              # symlink into ~/<tool-dir> (e.g. ~/.claude)
pnpm direct:skill:load ~/myproject category/my-skill    # symlink into a project directory
pnpm direct:skill:load ~ category/ --copy               # copy entire category globally
pnpm direct:skill:load ~ category/my-skill --force      # overwrite existing

pnpm direct:skill:unload ~ my-skill                     # remove from target directory
pnpm direct:skill:persist ~ my-skill                    # detach symlink → real file
```

Same pattern applies for agents (`direct:agent:*`).

---

## 🛠️ Commands

### Namespace management

| Command                                | Description                            |
|----------------------------------------|----------------------------------------|
| `pnpm ns:init [namespace] [component]` | Initialize namespace (default: `main`) |
| `pnpm ns:clean [namespace]`            | Remove a namespace                     |

### Namespace workflow — skills

| Command                      | Description                                   |
|------------------------------|-----------------------------------------------|
| `pnpm skill:load <items...>` | Load skills into active namespace             |
| `pnpm skill:unload <item>`   | Remove a skill from active namespace          |
| `pnpm skill:persist <item>`  | Detach a symlinked skill into a real file     |
| `pnpm skill:link [target]`   | Link namespace skills to the target directory |
| `pnpm skill:unlink [target]` | Remove the link from the target directory     |

### Namespace workflow — agents

| Command                      | Description                                   |
|------------------------------|-----------------------------------------------|
| `pnpm agent:load <items...>` | Load agents into active namespace             |
| `pnpm agent:unload <item>`   | Remove an agent from active namespace         |
| `pnpm agent:persist <item>`  | Detach a symlinked agent into a real file     |
| `pnpm agent:link [target]`   | Link namespace agents to the target directory |
| `pnpm agent:unlink [target]` | Remove the link from the target directory     |

### Direct workflow

| Command                                      | Description                                  |
|----------------------------------------------|----------------------------------------------|
| `pnpm direct:skill:load <target> <items...>` | Load skills directly to the target directory |
| `pnpm direct:skill:unload <target> <item>`   | Remove a skill from the target directory     |
| `pnpm direct:skill:persist <target> <item>`  | Detach a symlinked skill into a real file    |
| `pnpm direct:agent:load <target> <items...>` | Load agents directly to the target directory |
| `pnpm direct:agent:unload <target> <item>`   | Remove an agent from the target directory    |
| `pnpm direct:agent:persist <target> <item>`  | Detach a symlinked agent into a real file    |

### Utilities

| Command          | Description                           |
|------------------|---------------------------------------|
| `pnpm typecheck` | Type-check TypeScript (no test suite) |
| `pnpm format`    | Format with Prettier                  |

All commands accept `--help` for usage details.

---

## 📁 Structure

```
km-ai-kit/
├── skills/                  # Skill library, grouped by category
│   └── <category>/
│       ├── <skill>.md       # Flat skill
│       └── <skill>/         # Folder skill
│           └── SKILL.md
├── agents/                  # Subagent library, grouped by category
│   └── <category>/
│       └── <agent>.md
├── scripts/
│   ├── active/              # Namespace workflow scripts
│   └── direct/              # Direct workflow scripts
├── src/                     # Shared TypeScript utilities (used by scripts)
│   ├── configs/             # Constants (namespace, component names)
│   ├── helpers/             # Item resolution, Claude target helpers
│   └── utils/               # fs, prompt, shell logger, arg parser
└── active/                  # Gitignored — machine-local staging area
    └── <namespace>/
        ├── skills/          # Symlinks or copies of selected skills
        └── agents/          # Symlinks or copies of selected agents
```

### Item file formats

**Skill** (`skills/<category>/<skill>.md`)
```markdown
---
description: One-line summary shown in /help
---

Prompt instructions here.
```

**Agent** (`agents/<category>/<agent>.md`)
```markdown
---
name: my-agent
description: What this agent does and when to use it
model: sonnet
tools:
  - Read
  - Bash
---

System prompt for this agent.
```

### Notes

- `active/` is gitignored — each machine maintains its own namespaces and selections.
- Symlinks let source edits propagate to the usage place instantly; use `--copy` or `:persist` when you need
  a stable snapshot.
- `target` defaults to `~` — the scripts resolve this to the AI tool's home directory (e.g. `~/.claude` for Claude
  Code); pass a project path to scope it to a specific project.
