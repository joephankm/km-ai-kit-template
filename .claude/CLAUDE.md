# km-ai-kit

A personal AI toolkit — centralized library for Claude Code skills (slash commands), subagents, MCP server configs, and reusable prompts.

## Commands

```bash
pnpm typecheck      # type-check only (noEmit), no test suite exists
pnpm format         # prettier

# Run any script directly for quick testing
tsx scripts/active/loadItem.ts skills <args>
pnpm skill:load --help    # see usage for any pnpm script
```

## Repo structure

```
km-ai-kit/
├── .claude/
│   ├── CLAUDE.md        # This file
│   └── settings.json    # MCP server configs (committed, no secrets)
├── skills/              # Skill library, grouped by field → category (3 levels)
│   └── <field>/         # e.g. code, office, cv
│       └── <category>/  # e.g. makefile, git
│           └── <skill>.md
├── agents/              # Subagent library
│   └── <agent>.md
└── active/              # Gitignored — machine-local staging area (see workflow)
    └── <namespace>/     # Named namespace, e.g. "main" for your default
        ├── skills/      # Soft-links to selected skills
        └── agents/      # Soft-links to selected agents
```

## Architecture

Two distinct layers:

**1. Library layer** (`skills/`, `agents/`) — pure `.md` files, no code. Skills use `kebab-case` filenames. The `description:` frontmatter is the sole source of truth for what each file does.

**2. CLI tooling** (`src/`, `scripts/`) — TypeScript-only, runs via `tsx`, never compiled. Path alias `@/` maps to `src/`.

### `src/` layout

```
src/
├── configs/namespace.ts      # COMPONENTS, DEFAULT_NAMESPACE, COMPONENT_ENUM — constants only, no functions
├── helpers/
│   ├── claude.ts             # resolveClaudeTarget, isFolderItem
│   ├── items.ts              # collectItems, expandGlob (category expansion logic)
│   └── namespace.ts          # normalizeComponent (accepts singular or plural)
└── utils/
    ├── fs.ts                 # ROOT, ensureDir, relPath, removePath
    ├── prompt.ts             # confirm() — interactive y/n prompt
    ├── inflection/           # word inflection utilities (singular/plural, etc.)
    │   └── inflect.ts        # singularOf
    ├── shellLogger/          # logger (info/success/warn/error) + commandLog (usage/options/example display)
    └── shellCommand/         # parseCommandArgv + supporting utilities
        ├── detectCommand.ts  # auto-detects pnpm/npm/yarn/tsx/node from env — used as default `command`
        ├── objectUtils.ts    # mapValues, pickValues
        ├── parseCommandArgv.ts
        └── types/parseCommandArgv.ts
```

### Scripts

`scripts/active/` — operate on a namespace inside `active/<ns>/<component>/` (symlink staging area).
`scripts/direct/` — operate on an arbitrary Claude target directory (e.g. `~/.claude/skills`).

Each pnpm script pre-fills the `component` positional from the script definition, so the user only provides item names/paths. Example: `pnpm skill:load` → `tsx scripts/active/loadItem skills`.

### `parseCommandArgv` pattern

Every script parses CLI arguments through `parseCommandArgv`. The function:

- Auto-detects the display command name (`detectCommand`) unless `command:` is supplied
- Scans for `--help` early (before `parseArgs`) to handle package-manager-injected positionals
- `args` — ordered record; key = return property name and default placeholder; `rest: true` collects all remaining positionals as an array
- `options` — wraps Node's `util.parseArgs` + adds description/value/required for display
- Returns `{ args, options }` with inferred types via `ParsedArgs<Arg>` / `ParsedOptions<Opt>`

### Item formats

Skills support two formats detected by `isFolderItem`:

- **Flat**: `skills/<field>/<category>/<skill>.md`
- **Folder**: `skills/<field>/<category>/<skill>/SKILL.md` (entry file defined in `COMPONENT_FOLDER_ENTRY`)

`expandGlob` resolves a raw input to library-relative paths: trailing `/` forces category expansion; without it, prefers the item over the category when both share a name.

## File formats

### Skill (`skills/<field>/<category>/<skill>.md`)

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

## Usage — two options

### Option 1: Copy

```bash
# Global (available in all projects)
cp skills/<field>/<category>/<skill>.md ~/.claude/commands/

# Project-specific
cp skills/<field>/<category>/<skill>.md <project>/.claude/commands/
```

### Option 2: Soft-link (live sync)

**Step 1 — Create a namespace and stage your selection**

```bash
pnpm ns:init          # creates active/main/
pnpm ns:init work     # creates active/work/

ln -s $(pwd)/skills/<field>/<category>/<skill>.md active/main/skills/<skill>.md
ln -s $(pwd)/agents/planner.md                    active/main/agents/planner.md
```

**Step 2 — Link the namespace to the usage place**

```bash
# Global — available across all projects
ln -s $(pwd)/active/main/skills ~/.claude/commands
ln -s $(pwd)/active/main/agents ~/.claude/agents

# Project-specific
ln -s $(pwd)/active/main/skills <project>/.claude/commands
ln -s $(pwd)/active/main/agents <project>/.claude/agents
```

> `active/` is gitignored — machine-local, never pushed. Each machine maintains its own namespaces and selection.

## Conventions

- `configs/` files contain **constants only** — no functions, no logic. Move any computation to `utils/`.
- `src/` and `scripts/` use `camelCase` for all file and folder names.
- Skill/agent `.md` files use `kebab-case`.
- `export default` for utility files; `index.ts` re-exports with named exports.
- `description:` frontmatter is the single source of truth for what something does.
- No test suite — use `pnpm typecheck` to validate; run scripts directly to test behavior.
- MCP configs go in `.claude/settings.json`; keep secrets out of it (use `settings.local.json` which is gitignored).