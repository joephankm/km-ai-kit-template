# About This Template

**KM AI Kit** is a template repo — a personal starting point for collecting and developing your own AI items
(skills, agents, rules, prompts, etc.) across any AI tool that supports them.

The repo ships empty of items by design. You bring the content: write your own items, or collect useful ones from
public repos and communities. The built-in scripts handle the boring part — linking or copying items to wherever
your AI tool expects to find them.

---

## What are "AI items"?

AI tools like Claude, Cursor, Copilot, and others let you extend their behavior through custom instructions,
slash commands, agents, and more. These are what we call "items" here. Examples of what people build:

- A **coding skill** that enforces your team's code review checklist
- An **email skill** that drafts replies in your tone and style
- A **budget agent** that categorizes expenses and flags anomalies
- A **writing rule** that keeps your docs concise and consistent
- A **planning prompt** that breaks goals into weekly tasks

This toolkit isn't limited to developers. Anyone who uses an AI tool regularly can benefit from having a personal
library of well-crafted items they've built up over time.

---

## How it works

```
Your library (this repo)
  └── skills/, agents/, ...
        │
        ├── Flow 1: load into active/ namespace → link namespace to AI tool
        └── Flow 2: load directly into AI tool directory
```

You store everything here. When you want an item active in an AI tool, you either:

- **Stage it** into a local namespace (`active/`), then link the whole namespace to the tool's directory — best
  for managing a curated selection that stays in sync automatically.
- **Load it directly** into the tool's directory — best for one-off additions.

See [README.md](../README.md) for the full workflow and command reference.

---

## Tooling — pnpm & Node.js

The scripts in this repo are written in TypeScript and run via [Node.js](https://nodejs.org). The package manager
used is [pnpm](https://pnpm.io) — a fast, disk-efficient alternative to npm.

If you've never used these before, here's how to get set up:

### 1. Install Node.js

The recommended way is via a version manager so you can switch versions easily:

- **macOS / Linux** — [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  nvm install --lts
  ```
- **Windows** — [nvm-windows](https://github.com/coreybutler/nvm-windows) or download the installer from
  [nodejs.org](https://nodejs.org).

Alternatively, download the LTS installer directly from [nodejs.org](https://nodejs.org) — that works on any OS.

### 2. Install pnpm

Once Node.js is installed:

```bash
npm install -g pnpm
```

Verify both are working:

```bash
node --version   # v20.x or higher recommended
pnpm --version
```

### 3. Install dependencies

In the repo directory:

```bash
pnpm install
```

That's it — you're ready to use the scripts.
