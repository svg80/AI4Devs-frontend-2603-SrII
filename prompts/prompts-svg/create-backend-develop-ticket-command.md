Create an opencode custom command in `.opencode/commands/develop-backend-ticket.md`.

This command must delegate to the existing sub-agent at `.opencode/agents/backend-dev.md`.

## Frontmatter

```markdown
---
description: Develops a backend ticket/subtask via the backend-dev agent and generates a PR description in task/pr_description.md.
agent: backend-dev
---
```

- The filename `develop-backend-ticket.md` becomes the command name — users will run `/develop-backend-ticket` in the TUI.
- `description` is shown in the TUI autocomplete. It must clearly state that the command develops tickets and generates PR descriptions.
- `agent: backend-dev` routes execution to the `backend-dev` sub-agent, which in turn loads the `backend-senior` skill.
- Do NOT set `subtask` — let the sub-agent handle the work in its own context.

## Command template (body) requirements

The markdown body (the `template`) must instruct the agent to develop a backend ticket and produce a PR description. Cover these domains exhaustively:

1. **Read the incoming ticket** — Locate the ticket file (passed as `$ARGUMENTS` or `$1`). If no path is given, list the contents of `task/` and ask the user which ticket to develop. Support both `.md` and `.enriched.md` variants — prefer the enriched version if it exists (e.g., `002.5-extend-response-get-position-id-candidates.enriched.md` over `002.5-extend-response-get-position-id-candidates.md`).

2. **Load the project context** — Before developing, read:
   - `.opencode/rules/` — all project rules (language, DDD architecture, Prisma ORM, Express patterns, Swagger API docs).
   - `AGENTS.md` — repo conventions and available commands.
   - `backend/api-spec.yaml` — canonical OpenAPI 3.0 spec for all endpoint contracts.
   - `backend/prisma/schema.prisma` — database schema.
   - Existing code in `backend/src/` — understand current DDD patterns (services, controllers, routes, models).

3. **Develop the ticket** — Implement the solution following the ticket's acceptance criteria. Delegate all backend implementation to the `backend-dev` agent (which loads the `backend-senior` skill). Ensure:
   - All acceptance criteria are met.
   - The implementation follows the existing DDD architecture (application services, domain models, infrastructure, presentation controllers, routes).
   - Tests are written following TDD (Red-Green-Refactor) and passing (`cd backend && npm test`).
   - Lint passes (`cd backend && npx eslint src/`).
   - TypeScript compiles without errors (`cd backend && npx tsc --noEmit`).
   - `backend/api-spec.yaml` is updated if the endpoint response shapes change.
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

5. **Preserve existing PR description** — If `task/pr_description.md` already exists and the new ticket is an addition to an ongoing PR, append the new changes to the existing file rather than overwriting it. Add a new section under the existing structure (e.g., a new "Changes" table and "Acceptance criteria" list) with clear visual separation.

6. **Verification** — Before finishing:
   - Confirm all acceptance criteria are addressed in the code and reflected in the PR description.
   - Run `cd backend && npm test` — all tests must pass.
   - Run `cd backend && npx eslint src/` — no errors.
   - Run `cd backend && npx tsc --noEmit` — no type errors.
   - Ensure `task/pr_description.md` is present, properly formatted, and contains the new ticket's changes.

## Output

Create the full file `.opencode/commands/develop-backend-ticket.md` with complete frontmatter and markdown body. The command must be self-contained and ready for immediate use in the TUI via `/develop-backend-ticket`.
