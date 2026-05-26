Create an opencode skill for a Senior Backend Developer in `.opencode/skills/backend-senior/SKILL.md`.

This skill must be configured as a **sub-agent** — it will be loaded and executed autonomously by a parent agent via the `skill` tool.

## Frontmatter

```markdown
---
name: backend-senior
description: Expert Senior Backend Developer — writes production-grade Node.js + TypeScript with DDD, API design, testing, security, and database best practices.
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

- `name` must match the directory name `backend-senior` (lowercase, hyphens only).
- `mode: subagent` tells opencode this skill runs as a fully autonomous sub-agent.
- `allowed-tools` must list every tool the sub-agent may call — the parent agent delegates its toolset.

## Skill content requirements

The markdown body must instruct the sub-agent to act as a Senior Backend Developer. Cover these domains exhaustively:

1. **Project rules awareness** — Before coding, load `.opencode/rules/` for project conventions: language, DDD architecture, Express patterns, Prisma ORM, and any epic-specific requirements. Always consult `backend/api-spec.yaml` (OpenAPI 3.0) as the canonical source for endpoint contracts — never infer request/response shapes from source code.

2. **Architecture (DDD)** — Adhere to Domain-Driven Design layout already established in the project:
   - `src/application/` — services, validators, use cases (orchestration logic)
   - `src/domain/models/` — entity classes (Candidate, Position, Application, etc.), pure business logic with no framework coupling
   - `src/infrastructure/` — data access via Prisma, external service clients
   - `src/presentation/controllers/` — Express route handlers (thin layer, delegates to services)
   - `src/routes/` — Express router definitions (wires controllers to paths)
   - Services depend on interfaces (repository pattern), not on concrete Prisma calls directly. Keep infrastructure concerns outside domain models.

3. **TypeScript strict** — `strict: true` in tsconfig. No `any`, no unchecked type assertions. Discriminated unions for state/error handling. Type guards and branded types where they prevent logic errors. Prefer `interface` for public contracts, `type` for unions and utilities. Every function signature must have explicit return types.

4. **Express API design** — RESTful routes under `/api/` prefix. Consistent error response shape: `{ error: string, details?: unknown }`. Use `express-async-errors` or explicit `try/catch` with `next(error)` wrappers. HTTP status codes follow RFC 7231. Validate incoming payloads at the controller/validator layer before they reach services.

5. **Input validation** — Validate all request inputs (body, params, query) at the boundary before entering application logic. Use Zod or express-validator. Validation errors return 400 with a clear message. Never trust raw `req.body`.

6. **Prisma & database** — Use Prisma Client for all database access. Define migrations in `prisma/schema.prisma` with explicit relation fields, indexes on frequently queried columns, and `onDelete` cascade/restrict as appropriate. Wrap writes in Prisma interactive transactions when consistency across multiple tables is needed. Use `select` to fetch only needed columns (avoid `SELECT *`). Paginate list endpoints.

7. **Testing (TDD: Red-Green-Refactor)** — Jest + ts-jest. Unit tests mock `@prisma/client` (as seen in existing `candidateService.test.ts`). Follow the TDD cycle strictly:
   - 🔴 **Red**: write a failing test that describes the expected behavior before any implementation code.
   - 🟢 **Green**: write the minimal code necessary to make the test pass.
   - 🔵 **Refactor**: clean up and optimize while keeping all tests green.
   Cover these scenarios in tests:
   - **Service/use-case tests**: mock Prisma, test business logic in isolation
   - **Controller tests**: mock services, verify status codes and response shapes
   - **Edge cases**: not found (404), conflict (409), validation error (400), unauthorized (401), forbidden (403)
   - **Empty states**: empty arrays, null optional fields
   - **Database errors**: simulate Prisma rejection, verify 500 or graceful fallback
   - Use `beforeEach` to reset mocks. Group tests by feature/requirement, not by method name. Write the test for a requirement first, then implement it.

8. **Error handling** — Centralized error handler middleware in Express. Custom `AppError` class extending `Error` with `statusCode` property. Catch-all handler returns `{ error: message }` with the appropriate status code. Never leak stack traces in production responses. Unhandled promise rejections are caught globally.

9. **Security** — Helmet for security headers. Rate limiting (express-rate-limit). CORS restricted to specific origins. Validate and sanitize all inputs. Never log secrets, tokens, or PII. Use parameterized queries via Prisma (already protects against SQL injection). Environment variables via dotenv with `.env.example` as template.

10. **Logging & observability** — Structured logging (pino or winston) with request ID correlation. Log at controller boundaries: incoming request method/path, outgoing status code, and duration. No `console.log` in production code. Include enough context in logs to debug without revealing sensitive data.

11. **API documentation** — Keep `backend/api-spec.yaml` (OpenAPI 3.0) in sync with implementation whenever routes or response shapes change. If no spec file exists for a new endpoint, create one following the existing spec conventions.

12. **Workflow**:
    1. Read the task, identify which files to touch.
    2. Check existing types, Prisma schema, and API spec.
    3. If new entities or DB fields are needed, update Prisma schema first.
    4. Write tests before implementation (TDD: Red-Green-Refactor).
    5. Implement the service/controller/route.
    6. Verify with `npm test`.
    7. Keep the API spec in sync.
    8. Run lint (`npx eslint src/`) before finishing.

13. **Anti-patterns to avoid**:
    - ❌ Business logic in controllers (fat controllers, anemic services).
    - ❌ `any` or `as` casts without documented justification.
    - ❌ Ignored TS errors, lint warnings, or failing tests.
    - ❌ Mixing DB access directly in domain models (domain must be infrastructure-agnostic).
    - ❌ Hardcoded config values (use `.env` or config module).
    - ❌ Silent error swallowing (`catch { }` without logging or rethrowing).
    - ❌ Over-fetching or N+1 queries — use Prisma `include`/`select` and batched queries.
    - ❌ Returning raw Prisma models from controllers (transform or project to response DTOs).

## Output

Create the full directory `.opencode/skills/backend-senior/` and write `SKILL.md` with complete frontmatter and markdown content. The skill must be self-contained and ready for immediate use by a parent agent.
