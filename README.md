# Career Learning Hub

Career Learning Hub is a unified academic-MVP application for career
preparation and document-based learning. The monorepo contains a React/Vite
frontend, an Express/TypeScript API, shared TypeScript contracts, and a
MongoDB data layer.

## Current capabilities

- In-memory frontend access tokens with HttpOnly refresh-cookie sessions.
- A private Dashboard derived from owned Resume, Interview, Learning, AI
  usage, and activity records.
- Resume creation, immutable versions, private PDF import, readiness analysis,
  explicit AI rewrite comparison, saved-version printing, and bounded design
  controls.
- Interview session creation, question practice, notes, attempt history,
  resume-aware generation, and structured feedback.
- Private PDF Learning workspaces with grounded conversations, Flashcards,
  Quizzes, answer-key secrecy, and asynchronous cascade deletion.
- Responsive authenticated navigation, contextual breadcrumbs, accessible
  dialogs and states, and desktop/tablet/mobile browser workflow coverage.
- Dry-run-first migration tooling for approved, sanitized legacy data.

The application preserves strict ownership checks, private asset access,
request validation, request IDs, rate limits, CORS controls, and sensitive-data
logging restrictions. Provider-backed AI work and staging deployment require
separate configuration and approval.

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

Set a local MongoDB URI and replace every example signing/JWT secret with a
distinct secure value. Keep `.env` files untracked. Provider credentials are
optional unless provider-backed jobs are intentionally enabled.

## Run locally

Start the API:

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

The compatibility aliases `npm run dev:web` and `npm run dev:api` remain
available.

## Verify the repository

Run the verified root commands:

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

The frontend has its own unit and coverage commands:

```bash
npm run test --workspace @career-learning-hub/web
npm run test:coverage --workspace @career-learning-hub/web
```

The Full Application Browser Testing suite uses an authorized bundled
Playwright runtime until a portable repository-local runner is approved. See
[Full Application Browser Testing](docs/testing/FULL_APPLICATION_BROWSER_TESTING.md)
for the current command, synthetic-data boundary, browser matrix, and cleanup
requirements.

## Workspace layout

```text
frontend/               React and Vite frontend
backend/                Express and TypeScript API
packages/shared-types/  Shared API and domain contracts
tests/browser/          Full application browser workflow tests
docs/                   Architecture, phase, security, testing, and planning records
```

## Documentation

- [Repository architecture](docs/architecture/frontend-backend-structure.md)
- [Authentication](docs/phases/phase-02-authentication.md)
- [Shared infrastructure](docs/phases/phase-03-infrastructure.md)
- [Resume Studio](docs/phases/phase-04-resume-studio.md)
- [Interview Coach](docs/phases/phase-05-interview-coach.md)
- [Learning Workspace](docs/phases/phase-06-learning-workspace.md)
- [Unified Dashboard](docs/phases/phase-07-dashboard.md)
- [Data migration](docs/phases/phase-08-migration.md)
- [Production hardening](docs/phases/phase-09-hardening.md)
- [Current execution phase](docs/planning/CURRENT_PHASE.md)
- [Accepted decisions](docs/planning/DECISION_LOG.md)
- [Phase 17 release-candidate review](docs/planning/PHASE_17_RELEASE_CANDIDATE_REVIEW_REPORT.md)

Before changing implementation or running a migration, read
[AGENTS.md](AGENTS.md) and the current-phase record.
