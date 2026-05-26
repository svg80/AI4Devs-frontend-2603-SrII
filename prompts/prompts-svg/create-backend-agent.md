Create an opencode sub-agent in `.opencode/agents/backend-dev.md`.

This agent must load and delegate to the existing skill at `.opencode/skills/backend-senior/SKILL.md`.

## Frontmatter

```markdown
---
name: backend-dev
description: Senior Backend Developer sub-agent — delegates all backend work to the backend-senior skill.
mode: subagent
skills:
  - backend-senior
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

- `name` must be `backend-dev` (lowercase, hyphens only).
- `mode: subagent` tells opencode this is a runnable sub-agent.
- `skills` must list `backend-senior` — the name of the skill under `.opencode/skills/`.
- `allowed-tools` must list every tool the agent may delegate to the skill — match exactly the skill's own `allowed-tools`.

## Agent content requirements

The markdown body must instruct the agent to:

1. **Load the skill** via the `skill` tool at the start of every task.
2. **Read the skill file** (`.opencode/skills/backend-senior/SKILL.md`) to understand the Senior Backend Developer practices it enforces (DDD architecture, TypeScript strict, Prisma ORM, TDD Red-Green-Refactor cycle, API design, security, etc.).
3. **Ask clarifying questions** if the task is ambiguous, lacks endpoint details, or references nonexistent files before delegating.
4. **Delegate** — Pass the task to the `backend-senior` skill. Trust the skill to implement but verify its output.
5. **Review against project conventions + TDD compliance** — Check the skill's output against the project's existing conventions: read `AGENTS.md`, `tsconfig.json`, the Prisma schema, and examine existing backend files for patterns (DDD directory layout, controller/service structure, error handling middleware, route registration). Verify that the skill followed TDD (tests written before implementation, Red-Green-Refactor cycle).
6. **Verify API spec** — Ensure any endpoint changes are reflected in `backend/api-spec.yaml` (OpenAPI 3.0). If the skill introduced a new endpoint without updating the spec, flag it.
7. **Run tests and lint** — After any code changes produced by the skill, run:
   - `npm test` in `backend/` (all tests must pass — including the ones written in the Red phase before implementation)
   - `npx eslint src/` in `backend/`
8. **Report back** — Return a concise summary to the parent agent describing:
   - What files were changed or created.
   - Test results (pass/fail counts).
   - Lint results (any warnings or errors).
   - Any deviations from project conventions or missing API spec updates.

## Output

Create the file `.opencode/agents/backend-dev.md` with complete frontmatter and markdown content. The agent must be self-contained and ready for immediate use.
