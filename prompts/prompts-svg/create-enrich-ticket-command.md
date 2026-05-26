Create an opencode custom command in `.opencode/commands/enrich-ticket.md`.

This command must delegate to the existing sub-agent at `.opencode/agents/product-owner/agent.md`.

## Frontmatter

```markdown
---
description: Enriches a ticket/subtask with TDD-driven context, acceptance criteria, and implementation notes — delegates to the product-owner agent.
agent: product-owner
---
```

- The filename `enrich-ticket.md` becomes the command name — users will run `/enrich-ticket` in the TUI.
- `description` is shown in the TUI autocomplete. It must clearly state the command's purpose.
- `agent: product-owner` routes execution to the `product-owner` sub-agent, which in turn loads the `product-owner` skill.
- Do NOT set `subtask` — let the sub-agent handle the work in its own context.

## Command template (body) requirements

The markdown body (the `template`) must instruct the agent to enrich a ticket or subtask following TDD best practices. Cover these domains exhaustively:

1. **Read the incoming ticket** — Locate the ticket file (passed as `$ARGUMENTS` or `$1`). If no path is given, list the contents of `task/` and ask the user which ticket to enrich.

2. **Analyze and enrich** — For the given ticket, produce the following enriched output:
   - **Refined description**: Clarify scope, edge cases, and the problem being solved.
   - **TDD test plan**: List the test cases (unit + integration) that should be written **before** implementation. Follow the Red-Green-Refactor cycle:
     - Red: write a failing test that describes the expected behaviour.
     - Green: write the minimum code to make the test pass.
     - Refactor: clean up while keeping tests green.
   - **Expanded acceptance criteria**: Break vague criteria into concrete, verifiable checkboxes.
   - **Implementation notes**: Suggested approach, files to touch, libraries to use, and patterns to follow (based on the project's existing code conventions).
   - **Edge cases and error states**: Document inputs, boundary conditions, and error handling that must be covered.
   - **Test scenarios**: For each acceptance criterion, define the corresponding test (happy path, validation, error, empty state).

3. **Preserve original content** — Do not overwrite the ticket file. Create a new file alongside it named `<original-name>.enriched.md` (e.g., `001-setup-kanban-columns.enriched.md`). Or, if the user prefers, output the enrichment directly in the response.

4. **Reference the skill's workflow** — Use the decomposition and prioritization principles defined in the `product-owner` skill (INVEST, MoSCoW) to ensure the enriched ticket remains atomic, valuable, and correctly scoped.

5. **Ask clarifying questions** — If the ticket is ambiguous, lacks acceptance criteria, or references nonexistent files, ask the user for clarification before proceeding.

6. **Verification** — After enrichment, verify that:
   - Each acceptance criterion has a corresponding test scenario.
   - The ticket still satisfies INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable).
   - Estimated effort does not exceed 1-2 days (XS–S–M). If it does, suggest splitting the ticket.

## Output

Create the full file `.opencode/commands/enrich-ticket.md` with complete frontmatter and markdown body. The command must be self-contained and ready for immediate use in the TUI via `/enrich-ticket`.
