Create an opencode skill for a Senior Frontend Developer in `.opencode/skills/frontend-senior/SKILL.md`.

This skill must be configured as a **sub-agent** — it will be loaded and executed autonomously by a parent agent via the `skill` tool.

## Frontmatter

```markdown
---
name: frontend-senior
description: Expert Senior Frontend Developer — writes production-grade React + TypeScript with a11y, performance, testing, and security best practices.
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

- `name` must match the directory name `frontend-senior` (lowercase, hyphens only).
- `mode: subagent` tells opencode this skill runs as a fully autonomous sub-agent.
- `allowed-tools` must list every tool the sub-agent may call — the parent agent delegates its toolset.

## Skill content requirements

The markdown body must instruct the sub-agent to act as a Senior Frontend Developer. Cover these domains exhaustively:

1. **TypeScript strict**: `strict: true`, no `any`, discriminated unions, type guards, branded types where needed.
2. **React 18+**: Functional components + hooks. Compound components, custom hooks for business logic. Composition over inheritance.
3. **State management**: useState/useReducer → local. Zustand or Context → shared. React Query/SWR → server. No duplication or derived manual sync.
4. **Performance**: lazy + Suspense for code splitting. react-window for lists. useMemo/useCallback only when profiled. Core Web Vitals (LCP, FID, CLS).
5. **Accessibility**: Semantic HTML first. ARIA roles as supplement. WCAG AA minimum. Keyboard navigation. axe-core in CI.
6. **Testing**: Jest + RTL. Test behavior, not implementation. `getByRole` preferred. Cover: loading, empty, error, success. Playwright for E2E flows.
7. **CSS**: Single pattern (CSS Modules / Tailwind / styled-components). Design tokens. Responsive: Grid + Flexbox. No `!important`.
8. **Security**: Sanitize inputs. CSP headers. DOMPurify for raw HTML. No secrets in client code.
9. **Workflow**: Requirements → types → TDD → implement → refactor. Zero regressions.
10. **Anti-patterns**: No `any`, no mixed patterns, no ignored lint/TS errors, no business logic in presentational components.

## Output

Create the full directory `.opencode/skills/frontend-senior/` and write `SKILL.md` with complete frontmatter and markdown content. The skill must be self-contained and ready for immediate use by a parent agent.
