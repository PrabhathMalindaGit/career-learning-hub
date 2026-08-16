# Phase 19F — Application Shell and Shared UI Patterns Design

## Status

Implementation-authorized as one bounded Phase 19F campaign. This design records the audited scope before production changes and the regression correction discovered during qualification.

## Baseline

- Repository: `PrabhathMalindaGit/career-learning-hub`
- Baseline: `main @ 937603fad6aad4dfbf4d31e75b7c3c7ec2a8cd07`
- Branch: `phase-19f-app-shell-shared-ui`
- Predecessor: Phase 19E Authentication Refinements

## Controlling principle

Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless necessary for correctness or security.

## Audit findings

The application already has strong shared primitives:

- `Dialog` provides native modal semantics, focus containment, Escape/backdrop policy and focus return.
- `Pager` provides a shared labelled paging landmark.
- `StateSurface` provides static/status/alert state semantics.
- `PageHeader` provides caller-owned page-heading composition.
- global `.form-field`, `.field-shell`, `.field-control`, button, focus and validation styles already provide the beginning of a shared control language.

Phase 19F therefore must strengthen these foundations rather than create a second design system.

The remaining high-value inconsistencies are:

1. AppShell duplicates account identity markup in desktop and mobile navigation.
2. The complete email is visually truncated by shell CSS without a reusable account presentation primitive.
3. Phase 19E authentication correctly places Request IDs under collapsed `Technical details`, while `StateSurface` exposes Request IDs directly.
4. Login and Registration duplicate the same Technical-details markup.
5. `Pager` exposes `aria-busy`; paging availability must remain caller-owned because some pages intentionally allow a new paging action to supersede and abort an obsolete in-flight request.
6. shared field styles cover validation but do not provide one consistent disabled presentation.

## Approved design

### 1. AccountSummary

Create a small presentation-only `AccountSummary` component and use it in both desktop and mobile AppShell session areas.

- Show the display name.
- Keep the complete account email in the DOM so assistive technology receives the complete address.
- Preserve visual ellipsis for narrow shell layouts.
- Add the complete email as the element title for deliberate pointer inspection.
- Keep all account/session behavior in AppShell/AuthProvider; this component owns no authentication logic.
- Do not add avatars, profile menus, account-management features or new personal data.

### 2. TechnicalDetails

Create a small shared `TechnicalDetails` component for safe diagnostic metadata.

- Default summary: `Technical details`.
- Keep details collapsed by default.
- Render only the already-safe Request ID supplied by callers.
- Do not accept or expose raw payloads, stack traces, tokens, passwords or secrets.
- Reuse it from Login, Registration and StateSurface.
- Preserve the Phase 19E auth-specific visual class so authentication appearance does not regress.

### 3. StateSurface consistency

Keep caller-owned state copy/actions and existing static/status/alert semantics. Only move Request ID presentation behind shared collapsed Technical details.

### 4. Pager busy-state semantics

Keep routing, fetching and disabled-state policy with callers.

- `busy` communicates the current loading state through `aria-busy`.
- `previousDisabled` and `nextDisabled` remain the sole source of native button disabled state.
- The shared Pager must not automatically disable paging solely because `busy` is true.
- This preserves pages such as Dashboard activity, where a new page choice intentionally supersedes an obsolete in-flight request and aborts its `AbortController`.
- Callers that need to block paging while loading may include their loading state in their own disabled flags.

Conditional pagination remains caller-owned; existing feature pages already render Pager only when multiple pages exist.

### 5. Shared form-control state

Keep existing form markup and feature-local validation logic. Add one global disabled presentation for `.form-field` inputs and `.field-control` so disabled controls are visually consistent with existing buttons.

Do not introduce a generic form framework or migrate every feature form.

### 6. Existing Dialog and PageHeader

No production redesign is required. Their existing semantics are already appropriate and tested. Phase 19F treats them as the shared standards and verifies them during focused regression.

## Accessibility requirements

- Preserve the global visible focus ring.
- Account email must remain complete in accessible text even when visually ellipsized.
- Technical details must be keyboard-operable and collapsed by default.
- StateSurface must retain explicit status/alert semantics only when requested.
- Pager must expose `aria-busy` without overriding caller-owned disabled semantics.
- Existing mobile navigation focus containment, Escape handling and exact focus restoration must remain unchanged.

## Responsive requirements

- Desktop sidebar account summary must fit the 256px shell without horizontal overflow.
- Mobile drawer account summary must wrap/ellipsis safely within the drawer.
- No change to the current 980px shell breakpoint.
- Existing feature layouts remain feature-local.

## Non-goals

- no backend/API/schema/provider changes;
- no Gemini changes;
- no new dependency or icon library;
- no new state-management framework;
- no enterprise design system;
- no broad CSS rewrite;
- no redesign of Resume, Interview, Learning, Dashboard or Authentication;
- no new auth/account-management features;
- no deployment or branch deletion.

## Expected production files

- `frontend/src/AppShell.tsx`
- `frontend/src/components/AccountSummary.tsx` (new)
- `frontend/src/components/TechnicalDetails.tsx` (new)
- `frontend/src/components/Pager.tsx`
- `frontend/src/components/StateSurface.tsx`
- `frontend/src/features/auth/LoginPage.tsx`
- `frontend/src/features/auth/RegisterPage.tsx`
- shared component CSS imported by the frontend entry point

## Qualification

Focused component/auth/router tests, frontend typecheck, production build, `git diff --check`, full frontend regression, then human browser QA at desktop/tablet/mobile widths. No merge until the exact branch head has fresh qualification evidence and explicit merge approval.

During the first full regression run at head `917eb6b5ed8b0820373a4fec4a6e0f5896fd199a`, 1 of 1,167 frontend tests failed: Dashboard activity could no longer supersede and abort an in-flight page request because Pager automatically disabled both buttons while busy. The correction preserves caller-owned disabled policy and adds focused Pager regression coverage. The corrected head requires fresh qualification before Phase 19F can be called GREEN.
