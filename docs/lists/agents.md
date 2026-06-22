# Agents

A catalog of all agents (subagents) in this library. Use this as a reference when looking for an agent to activate
in your AI tool. Agents are more autonomous than skills — they are given a specific role, set of tools, and system
prompt, and can be invoked to handle a focused task end-to-end.

Agents are stored under `agents/<category>/` as a single `.md` file per agent.

> **This is a template.** The categories and entries below are examples only — they don't exist in the repo yet.
> Replace them with your real agents as you build up your library.

---

## Coding

| Name | File | Description | Use when |
|------|------|-------------|----------|
| Code Reviewer | [code-reviewer.md](../../agents/coding/code-reviewer.md) | Reviews code changes for correctness, style, and simplification with inline findings | You want an independent review pass on a branch or diff |
| PR Summarizer | [pr-summarizer.md](../../agents/coding/pr-summarizer.md) | Reads a pull request and produces a structured summary of what changed and why | You need a quick understanding of a PR without reading every file |

## Email

| Name | File | Description | Use when |
|------|------|-------------|----------|
| Email Triage | [email-triage.md](../../agents/email/email-triage.md) | Scans an inbox snapshot and categorizes emails by urgency and required action | You're returning from time off and need to prioritize your inbox |

## Research

| Name | File | Description | Use when |
|------|------|-------------|----------|
| Research Assistant | [research-assistant.md](../../agents/research/research-assistant.md) | Searches, reads, and synthesizes information on a given topic | You need a summary of an unfamiliar subject before making a decision |
