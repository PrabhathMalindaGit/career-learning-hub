# Career & Learning Hub — Frontend and Backend Structure

The Phase 9 monorepo has been reorganized from the previous nested
web/API application directories to:

```text
frontend
backend
```

## Final layout

```text
career-learning-hub/
├── frontend/              React + Vite application
├── backend/               Express + TypeScript API
├── packages/
│   └── shared-types/
├── package.json
├── README.md
└── PHASE_2...PHASE_9 documentation
```

The internal npm package names remain:

```text
@career-learning-hub/web
@career-learning-hub/api
```

Keeping those package names avoids unnecessary changes to package identity
while allowing the filesystem to use the simpler names.

## Preferred development commands

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

Compatibility aliases remain available:

```bash
npm run dev:api
npm run dev:web
```

## Environment file

Create the backend environment file with:

```bash
cp backend/.env.example backend/.env
```

## Workspace configuration

The root `package.json` now uses:

```json
{
  "workspaces": [
    "frontend",
    "backend",
    "packages/*"
  ]
}
```

## Validation commands

```bash
npm install
npm run typecheck
npm run test:ci
npm run build
```

No stale nested application directory or outdated path reference remains in
the current project.
