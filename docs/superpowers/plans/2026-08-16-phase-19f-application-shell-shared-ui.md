# Phase 19F — Application Shell and Shared UI Patterns Implementation Plan

> Execute as one bounded campaign on `phase-19f-app-shell-shared-ui`. Keep all repairs on this branch. Do not merge or deploy without separate approval.

## Baseline and scope

Baseline: `937603fad6aad4dfbf4d31e75b7c3c7ec2a8cd07`.

The plan implements only the audited Phase 19F shell/shared-pattern improvements. Existing Dialog and PageHeader behavior remains authoritative.

## Task 1 — Regression tests first

Create focused tests for:

- complete accessible account email and visual-inspection title in `AccountSummary`;
- collapsed shared Request-ID disclosure in `TechnicalDetails`;
- StateSurface using collapsed Technical details without changing its live-region semantics;
- Pager disabling both paging actions while busy.

The connector cannot execute tests. These tests are written before production code, but RED/GREEN status must remain unclaimed until the user runs them locally or another executable environment supplies fresh evidence.

## Task 2 — Shared account presentation

Create `AccountSummary.tsx` as a presentation-only component.

Update `AppShell.tsx` to replace duplicated desktop/mobile account text markup with the component. Preserve logout busy state, navigation behavior, focus behavior and auth architecture.

Reuse the existing shell truncation styles so long names/emails safely ellipsize inside desktop and mobile shell containers while the complete email remains in the DOM and `title`.

## Task 3 — Shared technical diagnostics

Create `TechnicalDetails.tsx`.

Migrate:

- `LoginPage.tsx`;
- `RegisterPage.tsx`;
- `StateSurface.tsx`.

Keep the Phase 19E `authentication-technical-details` class on auth screens. Add restrained generic Technical-details styling for non-auth StateSurface use.

## Task 4 — Pager busy-state safety

Change shared Pager buttons to be disabled when either the caller says they are disabled or `busy` is true. Keep labels, callbacks, page text and routing/data ownership caller-controlled.

Do not add page-number routing, data fetching or a pagination framework.

## Task 5 — Shared disabled form presentation

Add minimal disabled styling for shared `.form-field` controls and `.field-control`. Do not change feature validation rules or form data flow.

## Task 6 — Focused qualification

Run locally from repository root:

```bash
npm run test --workspace @career-learning-hub/web -- src/components/AccountSummary.test.tsx src/components/TechnicalDetails.test.tsx src/components/Pager.test.tsx src/components/StateSurface.test.tsx src/components/Dialog.test.tsx src/components/PageHeader.test.tsx src/features/auth/authenticationPhase19e.test.tsx src/features/auth/logoutPhase19e.test.tsx src/routing/router.test.tsx
npm run typecheck --workspace @career-learning-hub/web
npm run build --workspace @career-learning-hub/web
git diff --check origin/main...HEAD
npm run test --workspace @career-learning-hub/web
```

If repository scripts differ after pulling the branch, use the equivalent existing workspace commands and report the exact commands/output.

## Task 7 — Human browser QA

Verify at representative desktop, tablet and mobile widths:

- sidebar/header/drawer alignment;
- complete account identity is available without horizontal overflow;
- desktop and mobile logout still show `Logging out…` and prevent duplicates;
- mobile navigation opens/closes, traps focus and restores focus correctly;
- Request IDs are hidden behind collapsed Technical details in auth and feature error states;
- Pager controls become unavailable while loading;
- disabled form fields remain legible;
- no regressions in Resume, Interview, Learning, Dashboard and Authentication shell entry points.

## Completion gate

Do not call Phase 19F qualified until focused tests, typecheck, build, diff check, full frontend regression and human browser QA are all green at the exact same head SHA.

Do not merge, deploy or delete the branch without separate explicit approval.
