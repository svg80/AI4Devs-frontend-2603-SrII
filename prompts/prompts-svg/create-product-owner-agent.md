Create an opencode sub-agent in `.opencode/agents/product-owner/agent.md`.

This agent must load and delegate to the existing skill at `.opencode/skills/product-owner/SKILL.md`.

## Frontmatter

```markdown
---
name: product-owner
description: Product Owner Manager sub-agent — delegates all epic decomposition and task breakdown work to the product-owner skill.
mode: agent
skills:
  - product-owner
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

- `name` must match the directory name `product-owner` (lowercase, hyphens only).
- `mode: agent` tells opencode this is a runnable sub-agent.
- `skills` must list `product-owner` — the name of the skill under `.opencode/skills/`.
- `allowed-tools` must list every tool the agent may delegate to the skill — match exactly the skill's own `allowed-tools`.

## Agent content requirements

The markdown body must instruct the agent to:

1. **Load the skill** via the `skill` tool at the start of every task.
2. **Read the skill file** (`.opencode/skills/product-owner/SKILL.md`) to understand the full Product Owner Manager workflow (INVEST decomposition, MoSCoW prioritization, task file templates, dependency mapping).
3. **Delegate work to the skill** — the agent acts as a thin orchestrator, not a product owner expert itself.
4. **Ask clarifying questions** if the incoming epic is ambiguous, incomplete, or lacks sufficient business context before delegating.
5. **Review skill output** — verify that:
   - The `task/<epic-name>/` subfolder and all files exist.
   - Each task file follows the required template (Epic, Description, Acceptance Criteria, Technical Notes, Dependencies, Priority, Effort, DoD).
   - The `index.md` summary file is present with ordered tasks and MoSCoW labels.
   - No task exceeds 1-2 days of effort (XS–S–M per the skill's estimation scale).
6. **Report back** to the parent agent with:
   - Number of tasks created and their filenames.
   - Dependency graph summary (which tasks block which).
   - Any assumptions or open questions documented during decomposition.

## Output

Create the full directory `.opencode/agents/product-owner/` and write `agent.md` with complete frontmatter and markdown content. The agent must be self-contained and ready for immediate use.
