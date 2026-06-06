---
name: agents-md-maintainer
description: Maintain AGENTS.md for Codex App automations. Use when a user or recurring Codex automation asks to sync AGENTS.md with local .agents/skills, newly installed skills, package.json scripts, repo workflows, hooks, or auto-invoke routing. Always use for AGENTS.md maintenance automations; this is for Codex automations, not Windows Task Scheduler or OS-level scheduled tasks.
---

# AGENTS.md Maintainer

## Purpose

Keep `AGENTS.md` aligned with the actual repository. The main goal is to make recurring Codex App automations faster and safer by giving them a repeatable workflow for skills, commands, and auto-invoke rules.

## Workflow

### 1. Confirm Codex automation scope

- Treat automations as Codex App automations. Do not create Windows scheduled tasks, PowerShell background jobs, cron files, or OS-level watchers.
- If the task is to create or update an automation, use the Codex automation capability and put `$agents-md-maintainer` in the automation prompt.
- For multi-repo prompts, process each repo independently and keep each report grouped by repo.

### 2. Gather local evidence first

Read only what is needed:

- `AGENTS.md`
- `.agents/skills/*/SKILL.md`
- `skills-lock.json`, when present
- `package.json`
- hook/config files such as `.husky/*`, `lefthook.yml`, `lint-staged.config.*`, formatter/linter configs

Use `.agents/skills` as the source of truth for local skills. Do not trust install logs or memory if the folder is missing.

### 3. Sync skills and auto-invoke

- Every folder directly under `.agents/skills` should be visible in `AGENTS.md`.
- Add a narrow auto-invoke rule only after reading the skill description in `SKILL.md`.
- If the correct trigger is unclear, add `PENDIENTE: revisar disparador para <skill>` instead of inventing behavior.
- If `AGENTS.md` references a skill folder that no longer exists, mark it stale or remove it when doing so is clearly safe.

### 4. Sync commands and workflows

- Document commands exactly as they appear in `package.json`.
- Remove or replace stale commands only when local evidence proves they are wrong.
- If a dependency exists but no script exists for it, use a short `PENDIENTE` note instead of inventing a command.
- Keep workflow notes grounded in actual repo files, not generic boilerplate.

### 5. Edit conservatively

- Preserve generated blocks, especially Next.js docs blocks.
- Preserve repo-specific rules, language preferences, security notes, and user constraints.
- Do not reformat unrelated sections.
- Do not edit generated files or lockfiles for this task.

### 6. Verify and report

Before finishing, verify:

- every local skill folder appears in `AGENTS.md`;
- documented commands still exist in `package.json`, or are explicitly marked `PENDIENTE`;
- only intended `AGENTS.md` and local skill files changed.

Report:

- repos changed;
- new skills added to `AGENTS.md`;
- command/workflow corrections;
- checks run;
- any `PENDIENTE` left intentionally.
