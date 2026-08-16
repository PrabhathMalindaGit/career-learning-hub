# Career Learning Hub

Career Learning Hub is a unified academic MVP for career preparation and document-based learning. It is implemented as a single npm-workspace monorepo with a React/Vite frontend, an Express/TypeScript backend, shared TypeScript contracts, MongoDB persistence, private asset storage, and Google Gemini-assisted workflows.

## Current capabilities

- Secure account registration, login, logout, protected routes, refresh-based session bootstrap, and HttpOnly refresh-cookie handling.
- A private Dashboard summarizing owned Resume, Interview, Learning, performance, and recent-activity data.
- Resume Studio with guided creation, PDF import, immutable saved versions, live preview, A4/Letter print-to-PDF, three resume templates, appearance controls, candidate-photo support, and Gemini-assisted resume assessment.
- Interview Coach with session management, multiple question types, manual and AI-assisted question creation, saved attempts, deterministic multiple-choice evaluation, structured feedback, notes, filtering, archive/restore, and safe deletion.
- Learning Workspace with private PDF upload, grounded document conversations, flashcards, quizzes, saved attempts, source/page references, background-job progress, retry/cancel behavior, and safe destructive operations.
- Gemini-only Settings and runtime behavior using the fixed `gemini-3.6-flash` model, supporting administrator-managed, personal encrypted, or disconnected credential states.
- Responsive authenticated navigation, breadcrumbs, shared dialogs, pagers, loading/empty/error surfaces, keyboard handling, and desktop/tablet/mobile coverage.

The application preserves strict ownership checks, private asset access, request validation, request IDs, rate limits, CORS controls, answer-key secrecy, encrypted personal Gemini credentials, and sensitive-data logging restrictions.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- MongoDB for local application development

## Install

From the repository root:

```bash
npm install
```

## Configure the API

Create a local environment file from the tracked example:

```bash
cp backend/.env.example backend/.env
```

Set a local MongoDB URI and replace every example signing/JWT secret with a distinct secure value. Keep `.env` files untracked. Gemini credentials are required only when provider-backed workflows are intentionally enabled.

## Run locally

Start the backend:

```bash
npm run dev:backend
```

Start the frontend in a second terminal:

```bash
npm run dev:frontend
```

Default local endpoints:

- Frontend: `http://localhost:5173`
- API: `http://localhost:8000`
- API health: `http://localhost:8000/api/v1/health`

Compatibility aliases `npm run dev:web` and `npm run dev:api` remain available.

## Verify the repository

Run the root verification commands as required by the active task:

```bash
npm run typecheck
npm run typecheck:tests
npm run test:unit
npm run test:integration
npm run test:security
npm run test:coverage
npm run test:ci
npm run build
```

Frontend tests and coverage are available through:

```bash
npm run test --workspace @career-learning-hub/web
npm run test:coverage --workspace @career-learning-hub/web
```

Full Application Browser Testing uses the repository's approved browser-testing workflow. See [Full Application Browser Testing](docs/testing/FULL_APPLICATION_BROWSER_TESTING.md) for the current execution boundary and browser matrix.

## Workspace layout

```text
frontend/               React and Vite frontend
backend/                Express and TypeScript API
packages/shared-types/  Shared API and domain contracts
tests/browser/          Full application browser workflow tests
docs/                   Architecture, planning, security, testing, deployment, and evidence records
```

## Documentation

- [Repository architecture](docs/architecture/frontend-backend-structure.md)
- [Authentication](docs/phases/phase-02-authentication.md)
- [Shared infrastructure](docs/phases/phase-03-infrastructure.md)
- [Resume Studio](docs/phases/phase-04-resume-studio.md)
- [Interview Coach](docs/phases/phase-05-interview-coach.md)
- [Learning Workspace](docs/phases/phase-06-learning-workspace.md)
- [Unified Dashboard](docs/phases/phase-07-dashboard.md)
- [Production hardening](docs/phases/phase-09-hardening.md)
- [Current execution scope](docs/planning/CURRENT_PHASE.md)
- [Current decision register](docs/planning/DECISION_LOG.md)
- [Final release evidence](docs/planning/PHASE_20A_FINAL_RELEASE_BASELINE_EVIDENCE_FREEZE.md)

Before changing implementation, read [AGENTS.md](AGENTS.md) and the current execution-scope record.
