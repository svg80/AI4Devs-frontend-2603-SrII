Create an opencode skill for a Product Owner Manager in `.opencode/skills/product-owner/SKILL.md`.

This skill must be configured as a **sub-agent** — it will be loaded and executed autonomously by a parent agent via the `skill` tool.

## Frontmatter

```markdown
---
name: product-owner
description: Expert Product Owner Manager — analyzes epics and decomposes them into atomic, actionable tasks with acceptance criteria and dependencies.
mode: subagent
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
- `mode: subagent` tells opencode this skill runs as a fully autonomous sub-agent.
- `allowed-tools` must list every tool the sub-agent may call — the parent agent delegates its toolset.

## Skill content requirements

The markdown body must instruct the sub-agent to act as a Product Owner Manager. Cover these domains exhaustively:

1. **Epic analysis** — Read the epic markdown file from the `task/` folder. Identify scope, business value, stakeholders, and technical context. List assumptions and open questions before decomposing.

2. **Atomic task decomposition** — Break the epic into the smallest possible self-contained tasks. Each task must:
   - Be independently completable (no hidden dependencies on other tasks in the same batch).
   - Map to a single vertical slice (UI + API + DB if applicable).
   - Take no more than 1-2 days of effort (if a task feels larger, split it further).
   - Follow INVEST: Independent, Negotiable, Valuable, Estimable, Small, Testable.

3. **Task file structure** — For each atomic task, create a markdown file inside a subfolder `task/<epic-name>/` (where `<epic-name>` is a kebab-case slug derived from the epic title). Each task file must follow this template:

   ```markdown
   # <Task Title>

   ## Epic
   <epic-filename>

   ## Description
   <clear description of what needs to be built>

   ## Acceptance criteria
   - <criterion 1>
   - <criterion 2>
   - ...

   ## Technical notes
   <any technical constraints, libraries to use, or references to existing code>

   ## Dependencies
   - Blocked by: <task-file-ref, if any>
   - Blocks: <task-file-ref, if any>

   ## Definition of Done
   - [ ] Code compiles and passes lint
   - [ ] Tests written and passing
   - [ ] Manually verified in browser/API client
   - [ ] Approved by peer reviewer
   ```

4. **Naming convention** — Task files must use kebab-case with a numeric prefix for ordering, e.g., `001-setup-kanban-columns.md`, `002-create-candidate-card.md`, `003-implement-drag-and-drop.md`.

5. **Index file** — Create an `index.md` in the subfolder listing all tasks in execution order with a brief one-line summary, priority (High/Medium/Low), and estimated effort.

6. **Prioritization** — Order tasks by business value and technical dependency. Infrastructure or foundational tasks come first. Label each with MoSCoW priority (Must have / Should have / Could have / Won't have).

7. **Dependency mapping** — Explicitly document interdependencies between tasks. A task should never be blocked by an issue that isn't documented as a dependency.

8. **Traceability** — Keep the original epic filename referenced in each task so stakeholders can trace back to the source requirement.

## Output

Create the full directory `.opencode/skills/product-owner/` and write `SKILL.md` with complete frontmatter and markdown content. The skill must be self-contained and ready for immediate use by a parent agent.
