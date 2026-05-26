# AGENTS.md — LTI Talent Tracking System

## Repo structure

Two independent packages in `frontend/` and `backend/` (not a workspace monorepo). Each has its own `package.json`, `node_modules`, and build output. Root `package.json` only declares `prisma.schema` path.

## Setup & dev

```sh
# PostgreSQL (required before backend)
docker-compose up -d

# Install separately in each package
(cd frontend && npm install)
(cd backend && npm install)

# Prisma (run from backend/)
cd backend
npx prisma generate
npx prisma migrate dev
ts-node seed.ts
```

## Commands

### Backend (`backend/`)
| Action | Command |
|---|---|
| Dev server (with hot reload) | `npm run dev` |
| Build (tsc → dist/) | `npm run build` |
| Production start | `npm start` (runs `node dist/index.js`) |
| Test (Jest + ts-jest) | `npm test` |
| Lint | `npx eslint src/` |

### Frontend (`frontend/`)
| Action | Command |
|---|---|
| Dev server (localhost:3000) | `npm start` |
| Build (react-scripts → build/) | `npm run build` |
| Test (Jest via react-scripts) | `npm test` |

Ports: frontend `:3000`, backend `:3010`. CORS configured for `http://localhost:3000` only.

## Architecture

- **Backend**: Express + TypeScript, DDD-inspired layout:
  - `src/application/` — services, validators
  - `src/domain/models/` — entity classes (Candidate, Position, Application, etc.)
  - `src/infrastructure/` — DB access (Prisma)
  - `src/presentation/controllers/` — Express route handlers
  - `src/routes/` — Express router definitions
- **Frontend**: Create React App (react-scripts 5), TypeScript + React Router + Bootstrap.
- **Database**: PostgreSQL via Prisma ORM. Schema at `backend/prisma/schema.prisma`.

## Key details

- `.env` at repo root holds `DB_*` vars and `DATABASE_URL`.
- Backend unit tests mock `@prisma/client` (see `candidateService.test.ts`).
- `db` env relies on `${DB_USER}`, `${DB_PASSWORD}` etc. from `.env` — these also feed `docker-compose.yml`.
- Backend dev server uses `ts-node-dev` with `--respawn --transpile-only` (no `tsc` needed for dev).
- Prisma client binary targets include `debian-openssl-3.0.x` for Docker compatibility.
- `promtps/` and `backend/src/prompts/` contain prompt reference files (Spanish).
- Useful reference docs: `backend/api-spec.yaml` (API), `backend/ModeloDatos.md` (ERD).
