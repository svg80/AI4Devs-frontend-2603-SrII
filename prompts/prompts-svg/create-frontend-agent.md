Create an opencode sub-agent in `.opencode/agents/frontend-dev/agent.md`.

This agent must load and delegate to the existing skill at `.opencode/skills/frontend-senior/SKILL.md`.

## Frontmatter

```markdown
---
name: frontend-dev
description: Senior Frontend Developer sub-agent — delegates all frontend work to the frontend-senior skill.
mode: agent
skills:
  - frontend-senior
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - WebSearch
  - WebFetch
---
```

- `name` must match the directory name `frontend-dev` (lowercase, hyphens only).
- `mode: agent` tells opencode this is a runnable sub-agent.
- `skills` must list `frontend-senior` — the name of the skill under `.opencode/skills/`.
- `allowed-tools` must list every tool the agent may delegate to the skill — match the skill's own `allowed-tools`.

## Agent content requirements

The markdown body must instruct the agent to:

1. **Load the skill** via the `skill` tool at the start of every task.
2. **Read the skill file** (`.opencode/skills/frontend-senior/SKILL.md`) to understand the Senior Frontend Developer practices it enforces.
3. **Delegate frontend work** to the skill — the agent acts as a thin orchestrator, not a frontend expert itself.
4. **Ask clarifying questions** if the task is ambiguous before delegating.
5. **Review skill output** against the project's existing code conventions (check `AGENTS.md`, `tsconfig.json`, existing components).
6. **Run lint and typecheck** after any code changes produced by the skill (`npm run lint`, `npm run typecheck` in `frontend/`).
7. **Report back** to the parent agent with a summary of changes and any issues found.

## Output

Create the full directory `.opencode/agents/frontend-dev/` and write `agent.md` with complete frontmatter and markdown content. The agent must be self-contained and ready for immediate use.
