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
- Pager preserving caller-owned button availability while reporting `aria-busy`.

The connector cannot execute tests. These tests are written before their production corrections where possible, but RED/GREEN status must remain grounded in executable local evidence.

The first full regression run at Phase 19F head `917eb6b5ed8b0820373a4fec4a6e0f5896fd199a` supplied real RED evidence for Pager semantics: `MainDashboard.test.tsx` failed because automatically disabling Pager controls while busy prevented an in-flight Dashboard activity request from being superseded and aborted.

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

## Task 4 — Pager busy-state semantics

Keep shared Pager routing, fetching and disabled policy caller-owned.

- `busy` sets `aria-busy` on the paging landmark.
- `previousDisabled` and `nextDisabled` remain the only native disabled inputs.
- Do not automatically disable paging just because `busy` is true.
- This preserves flows such as Dashboard activity where a new page action intentionally supersedes and aborts an obsolete request.
- A caller that needs to block paging while loading may explicitly fold loading state into its own disabled flags.

Do not add page-number routing, data fetching or a pagination framework.

## Task 5 — Shared disabled form presentation

Add minimal disabled styling for shared `.form-field` controls and `.field-control`. Do not change feature validation rules or form data flow.

## Task 6 — Focused qualification

Run locally from repository root:

```bash
npm run test --workspace @career-learning-hub/web -- src/components/AccountSummary.test.tsx src/components/TechnicalDetails.test.tsx src/components/Pager.test.tsx src/components/StateSurface.test.tsx src/components/Dialog.test.tsx src/components/PageHeader.test.tsx src/features/auth/authenticationPhase19e.test.tsx src/features/auth/logoutPhase19e.test.tsx src/features/dashboard/MainDashboard.test.tsx src/routing/router.test.tsx
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
- Pager shows loading state without unexpectedly overriding caller-owned paging availability;
- Dashboard activity can supersede an obsolete in-flight page request without showing stale results;
- disabled form fields remain legible;
- no regressions in Resume, Interview, Learning, Dashboard and Authentication shell entry points.

## Completion gate

Do not call Phase 19F qualified until focused tests, typecheck, build, diff check, full frontend regression and human browser QA are all green at the exact same head SHA.

Do not merge, deploy or delete the branch without separate explicit approval.
