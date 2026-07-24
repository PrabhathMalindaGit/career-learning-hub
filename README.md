# Career & Learning Hub

Phase 1 foundation for a unified MERN-stack platform.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Install

```bash
npm install
```

## Run the API

```bash
cp backend/.env.example backend/.env
npm run dev:backend
```

API health check:

```text
http://localhost:8000/api/v1/health
```

## Run the web application

Open a second terminal:

```bash
npm run dev:frontend
```

The Vite application will normally run at:

```text
http://localhost:5173
```

## Workspace layout

- `frontend` — React and Vite frontend
- `backend` — Express and TypeScript API
- `packages/shared-types` — shared API and domain types

## Simplified project directories

The application now uses:

```text
frontend/   React and Vite application
backend/    Express and TypeScript API
packages/   Shared workspace packages
```

Use `npm run dev:frontend` and `npm run dev:backend`. The older `dev:web` and
`dev:api` commands remain as compatibility aliases.

See `FRONTEND_BACKEND_STRUCTURE.md` for the conversion details.

## Phase 2 authentication

The API now includes unified authentication and user management. See
`PHASE_2_AUTHENTICATION.md` for environment variables, routes, and client usage.

Before starting the API:

```bash
cp backend/.env.example backend/.env
```

Add MongoDB and secure JWT secrets, then run:

```bash
npm install
npm run dev:backend
```

## Phase 3 shared infrastructure

The API now includes:

- Private local/S3 asset storage
- Signed asset downloads and account quotas
- Structured Gemini AI gateway with quotas and usage logs
- Shared activity events
- Durable MongoDB-backed jobs with retries and worker leases

See `PHASE_3_INFRASTRUCTURE.md` for configuration and test commands.

## Phase 4 Resume Studio

The platform now includes canonical resumes and immutable versions, private PDF
import, queued AI readiness analysis, stable-ID rewrite application, and a
React Resume Workspace scaffold.

See `PHASE_4_RESUME_STUDIO.md` for routes and test instructions.

## Phase 5 Interview Coach

The platform now includes strictly owned interview sessions, paginated
questions, pins, private notes, written attempt history, resume-aware question
generation, question explanations, duplicate detection, and structured AI
feedback.

See `PHASE_5_INTERVIEW_COACH.md` for the route contract and test workflow.

## Phase 6 Learning Workspace

The platform now includes private PDF learning documents, page-preserving
chunks, grounded document chat, flashcard and quiz generation, strict quiz
submission, real activity events, and asynchronous cascading deletion.

See `PHASE_6_LEARNING_WORKSPACE.md` for routes and test instructions.

## Phase 7 Unified Dashboard

The platform now includes a private cross-domain dashboard for recorded resume
readiness, interview feedback trends, learning documents, quiz performance, AI
usage, and chronological ActivityEvent history.

All metrics are derived from owned database records. See
`PHASE_7_DASHBOARD.md` for route contracts and metric definitions.

## Phase 8 Existing Data Migration

The monorepo now includes dry-run-first, checksum-verified migration tooling
for users, resumes, interview questions, flashcards, and quizzes from the four
legacy projects.

See `PHASE_8_MIGRATION.md` before running any migration.

## Phase 9 Testing and Production Hardening

The final backend phase adds strict CORS and proxy controls, layered rate
limiting, structured request-ID logging with sensitive-data redaction,
centralized errors, dependency-aware readiness checks, hardened graceful
shutdown, and Vitest unit, integration, and security suites.

See `PHASE_9_HARDENING.md` before production deployment.


## Documentation

- [Repository architecture](docs/architecture/frontend-backend-structure.md)
- [Phase 2 — Authentication](docs/phases/phase-02-authentication.md)
- [Phase 3 — Infrastructure](docs/phases/phase-03-infrastructure.md)
- [Phase 4 — Resume Studio](docs/phases/phase-04-resume-studio.md)
- [Phase 5 — Interview Coach](docs/phases/phase-05-interview-coach.md)
- [Phase 6 — Learning Workspace](docs/phases/phase-06-learning-workspace.md)
- [Phase 7 — Dashboard](docs/phases/phase-07-dashboard.md)
- [Phase 8 — Data Migration](docs/phases/phase-08-migration.md)
- [Phase 9 — Production Hardening](docs/phases/phase-09-hardening.md)