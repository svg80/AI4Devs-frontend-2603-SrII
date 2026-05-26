Create an opencode custom command in `.opencode/commands/develop-ticket.md`.

This command must delegate to the existing sub-agent at `.opencode/agents/frontend-dev/agent.md`.

## Frontmatter

```markdown
---
description: Develops a ticket/subtask via the frontend-dev agent and generates a PR description in task/pr_description.md.
agent: frontend-dev
---
```

- The filename `develop-ticket.md` becomes the command name — users will run `/develop-ticket` in the TUI.
- `description` is shown in the TUI autocomplete. It must clearly state that the command develops tickets and generates PR descriptions.
- `agent: frontend-dev` routes execution to the `frontend-dev` sub-agent, which in turn loads the `frontend-senior` skill.
- Do NOT set `subtask` — let the sub-agent handle the work in its own context.

## Command template (body) requirements

The markdown body (the `template`) must instruct the agent to develop a ticket and produce a PR description. Cover these domains exhaustively:

1. **Read the incoming ticket** — Locate the ticket file (passed as `$ARGUMENTS` or `$1`). If no path is given, list the contents of `task/` and ask the user which ticket to develop.

2. **Load the project context** — Before developing, read:
   - `.opencode/rules/` — all project rules (language, LTI epic spec, Swagger API docs).
   - `AGENTS.md` — repo conventions and available commands.
   - Existing components in `frontend/src/` — understand current patterns.

3. **Develop the ticket** — Implement the solution following the ticket's acceptance criteria. Delegate all frontend implementation to the `frontend-senior` skill via the `skill` tool. Ensure:
   - All acceptance criteria are met.
   - Tests are written and passing.
   - Lint and typecheck pass (`cd frontend && npm run lint && npx tsc --noEmit`).
   - Existing functionality is not broken.

4. **Generate PR description** — After development, write or update `task/pr_description.md` with the following structure:

   ```markdown
   # PR: <Ticket Title>

   ## Summary
   <one-paragraph description of what was implemented and why>

   ## Changes
   | File | Description |
   |---|---|
   | `<path>` | <what changed and why> |
   | `<path>` | <what changed and why> |

   ## Acceptance criteria
   - [ ] <criterion 1> — <how it was met or evidence>
   - [ ] <criterion 2> — <how it was met or evidence>

   ## Testing
   - <test framework used>
   - <test coverage highlights>
   - <how to run tests>

   ## Notes for reviewers
   <anything reviewers should pay attention to>
   ```

5. **Preserve existing PR description** — If `task/pr_description.md` already exists and the new ticket is an addition to an ongoing PR, append the new changes to the existing file rather than overwriting it.

6. **Verification** — Before finishing:
   - Confirm all acceptance criteria are addressed in the code and reflected in the PR description.
   - Run lint and typecheck one final time.
   - Ensure `task/pr_description.md` is present and properly formatted.

## Output

Create the full file `.opencode/commands/develop-ticket.md` with complete frontmatter and markdown body. The command must be self-contained and ready for immediate use in the TUI via `/develop-ticket`.
