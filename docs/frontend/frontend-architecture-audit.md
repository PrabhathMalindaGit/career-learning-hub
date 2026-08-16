# Career Learning Hub — Frontend Architecture Audit

## Purpose

This document summarizes the current frontend architecture and the presentation/interaction boundaries that matter for final university evaluation, maintenance, and viva preparation.

It describes the current Career Learning Hub frontend directly. The executable implementation remains authoritative.

## Application structure

The frontend is implemented with React 19, TypeScript, Vite, React Router, Vitest, and Testing Library.

Key boundaries:

- `frontend/src/main.tsx` mounts the application.
- `frontend/src/routing/router.tsx` owns the route tree and public/protected/resource routes.
- `frontend/src/AppShell.tsx` owns authenticated shell/navigation behavior.
- `frontend/src/features/auth/` owns authentication presentation and session bootstrap integration.
- `frontend/src/features/dashboard/` owns Dashboard presentation.
- `frontend/src/features/resumes/` owns Resume Studio presentation and interactions.
- `frontend/src/features/interviews/` owns Interview Coach presentation and interactions.
- `frontend/src/features/learning/` owns Learning Workspace presentation and interactions.
- shared presentation patterns live in the common component/style layer where reuse has been proven.

The frontend remains feature-oriented. Domain API calls, polling, ownership-safe errors, resource-specific copy, and domain data remain inside their owning feature boundaries.

## Route families

Current route families include:

- `/login`
- `/register`
- `/dashboard`
- `/resumes`
- `/resumes/:resumeId`
- `/interviews`
- `/interviews/:sessionId`
- `/learning`
- Learning document, conversation, flashcard, quiz, and quiz-attempt routes
- `/settings`
- safe route/resource not-found states

Protected routes use the current authentication boundary and do not expose owned resources across users.

## Shared application shell

The current shell provides:

- desktop sidebar navigation;
- responsive mobile navigation drawer;
- authenticated account identity;
- logout behavior;
- main/skip-navigation landmarks;
- responsive layout foundations;
- contextual breadcrumbs on deeper routes;
- keyboard Escape/focus-return behavior where applicable.

The product uses one application shell. A second shell/navigation framework is not justified.

## Shared UI patterns

Current shared patterns include:

- PageHeader;
- Breadcrumbs;
- Dialog behavior;
- Pager behavior;
- loading, empty, error, retry, and safe-not-found surfaces;
- Request-ID technical details with bounded disclosure;
- common primary/secondary/destructive action treatment;
- common form and disabled-state foundations;
- focus-visible behavior and keyboard handling.

Feature-specific controls remain local where their semantics differ materially.

## Authentication presentation

Frontend authentication preserves:

- in-memory access tokens;
- HttpOnly refresh-cookie sessions;
- refresh-based bootstrap;
- one shared API client for authenticated requests;
- single bounded unauthorized retry after successful refresh;
- deduplicated simultaneous refresh attempts;
- intended-route restoration;
- safe session-expiry and API failure messaging;
- responsive Login and Registration layouts.

Access and refresh tokens must not be stored in localStorage, sessionStorage, or IndexedDB.

## Resume Studio presentation

The current Resume experience includes:

- Resume collection and creation flows;
- Guided Setup, blank creation, and PDF import;
- section-based editing;
- live preview;
- immutable saved versions;
- A4/Letter print-to-PDF workflow;
- three current templates;
- bounded font, palette, and appearance controls;
- candidate-photo controls;
- Gemini-assisted assessment and suggestion review;
- explicit selection/confirmation before AI suggestions change Resume content;
- dirty-draft, recovery, stale-result, and navigation protections.

Save remains the primary action; AI assessment is visually secondary.

## Interview Coach presentation

The current Interview experience includes:

- session collection and creation;
- career-area/role guidance;
- Multiple Choice, Short Answer, Coding, Behavioral, Scenario-Based, and Technical Explanation question types;
- manual and Gemini-assisted question creation;
- structured response forms;
- saved attempt history;
- deterministic Multiple Choice result presentation;
- answer-key secrecy before submission;
- feedback, notes, pinning, filtering, pagination, archive/restore, and deletion states;
- progress, retry, cancel, and stale-response handling for background AI work.

Coding responses are text-only; no browser compiler or code-execution sandbox is part of the current UI.

## Learning Workspace presentation

The current Learning experience includes:

- document library/upload states;
- document workspace;
- grounded conversation with source/page references;
- flashcard generation and study;
- quiz generation, completion, and saved-attempt review;
- safe loading, empty, failure, retry, and background-job progress states;
- deletion confirmations and active-job safeguards;
- responsive document, conversation, flashcard, quiz, and review layouts.

## Settings presentation

Settings exposes the current Gemini connection boundary only:

- administrator-managed Gemini when explicitly available;
- personal encrypted Gemini credential;
- disconnected state.

The active model is fixed to `gemini-3.6-flash`. The UI does not expose another active provider choice or silent fallback.

## Responsive and accessibility boundary

The final frontend has been exercised across desktop, tablet, and mobile presentation through automated and human QA campaigns.

Current interaction expectations include:

- keyboard-reachable interactive controls;
- visible focus treatment;
- dialog focus containment/return where applicable;
- sensible action wrapping at narrow widths;
- purposeful loading/empty/error states;
- semantic status/error communication;
- reduced dependence on pointer-only interaction.

The project does not claim formal independent WCAG certification.

## Testing boundary

The final Phase 20A evidence records:

- frontend TypeScript typecheck — PASS;
- complete frontend suite — 123/123 files, 1,170/1,170 tests PASS;
- frontend production build — PASS;
- root workspace typecheck/build — PASS.

The final integrated evidence chain also includes authenticated live/browser QA and focused human visual approval for the final Resume assessment-action presentation change.

## Current non-blocking frontend diagnostics

The final evidence records the following successful-test/build advisories:

- duplicate React-key warning from a synthetic Resume-version fixture;
- dependency-level React Router `use client` directives ignored during bundling;
- mixed static/dynamic import advisory for current Resume API code;
- a Vite JavaScript bundle-size advisory above 500 kB.

These are recorded quality observations, not hidden failures.

## Architecture conclusion

The current frontend architecture is appropriate for the university-project scope:

- one React/Vite application;
- one authenticated shell;
- feature-oriented modules;
- shared UI only where reuse is established;
- server-authoritative security/ownership;
- no second design system or state-management architecture;
- no unnecessary enterprise abstraction.

Future final-stage work should focus on evaluation evidence, screenshots, report support, and viva preparation rather than frontend expansion unless a verified defect requires repair.
