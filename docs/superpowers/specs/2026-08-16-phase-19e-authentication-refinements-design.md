# Phase 19E — Authentication Refinements Design

**Status:** Approved design, awaiting written-spec review
**Date:** 2026-08-16
**Baseline:** `main @ 8887a10be6283b8ea551e160f662cadcd7fe11f4`
**Branch:** `phase-19e-authentication-refinements`

## Goal

Refine the existing Career Learning Hub authentication and session experience into a polished, accessible, predictable university-project-quality flow without adding new authentication products or replacing the established security architecture.

Controlling instruction:

> Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

## Current baseline

The application already has a sound authentication foundation:

- email/password registration and login;
- frontend validation and accessible error summaries;
- in-memory access tokens;
- HTTP-only refresh cookies;
- refresh-token rotation and reuse detection;
- logout/session revocation;
- protected and public-only route guards;
- safe internal return-path validation;
- authentication bootstrap that avoids flashing Login before session restoration completes;
- responsive split-screen Login/Register presentation with reduced-motion handling.

Phase 19E is therefore a refinement campaign, not an authentication rewrite.

## Scope freeze

Phase 19E continues to support exactly:

1. email/password registration;
2. email/password login;
3. the existing refresh-session mechanism;
4. the existing logout/session-revocation mechanism;
5. the existing protected/public-only routing model.

Phase 19E will **not** add:

- Forgot Password or password reset;
- email verification;
- Google OAuth or other social login;
- Remember Me;
- MFA, OTP, passkeys or magic links;
- CAPTCHA;
- a new session-management screen;
- email-delivery infrastructure;
- a new identity provider.

## Selected approach

Use one bounded authentication UX/session refinement across the existing architecture.

Rejected alternatives:

- **Cosmetic-only polish:** too narrow because it would leave session-expiry communication, logout feedback and stale-error behavior unresolved.
- **Authentication expansion:** unnecessary backend/infrastructure/security scope for the university project.

## 1. Login refinement

Keep the existing Login layout, route, copy hierarchy and authentication API contract.

### Password visibility

Add an accessible password visibility control to Login.

Requirements:

- user-facing actions are `Show password` and `Hide password`;
- the control is `type="button"` and never submits the form;
- switching visibility changes only the input type between `password` and `text`;
- the current password value is preserved;
- keyboard interaction works normally;
- accessible name and toggle state reflect the current mode;
- the control is disabled while the form is submitting;
- the password input reserves enough inline space so typed text cannot render beneath the control;
- no password value is copied into storage, diagnostics or another DOM region.

### Frontend/backend input parity

Login should explicitly preserve the existing backend limits:

- email: maximum 320 characters;
- password: maximum 128 characters.

No login password policy is added beyond the existing requirement that a password be present.

### Validation recovery

Validation remains submit-triggered initially. Untouched fields do not begin showing validation errors merely because the user types.

After a failed submission:

- editing a field revalidates that field only;
- once that field becomes valid, its existing field error disappears immediately;
- other invalid-field errors remain until those fields are corrected;
- changing credentials clears any stale API authentication failure because that failure no longer describes the current credentials;
- editing one field must not manufacture new errors on untouched fields.

Existing validation-summary focus behavior remains: one invalid field focuses that field; multiple invalid fields focus the validation summary.

## 2. Registration refinement

Registration receives the same interaction model while preserving the existing registration contract.

Current requirements remain authoritative:

- display name: 2–100 characters;
- email: valid address, maximum 320 characters;
- password: 12–128 characters with uppercase, lowercase and a number.

No password-strength meter and no new password rules are introduced.

Registration changes:

- accessible Show/Hide Password control;
- post-submit per-field validation recovery;
- stale API-error cleanup when relevant form values change;
- existing password-requirements guidance remains visible;
- existing autocomplete, required-state and validation-summary behavior remains.

## 3. Authentication API-error presentation

User-facing API errors remain primary and readable. Raw Request IDs move behind a collapsed native disclosure.

Presentation:

```text
Email or password is incorrect.

▸ Technical details
```

When expanded:

```text
Request ID: <canonical request id>
```

Rules:

- use a small native `<details>` / `<summary>` disclosure unless implementation evidence shows a problem;
- disclosure is closed by default;
- Request ID appears only when one exists;
- normal field-validation errors do not show Technical details;
- API-error regions remain accessible alert/focus targets;
- Login API-error focus behavior is aligned with Registration.

Never expose in this UI:

- passwords;
- access tokens;
- refresh tokens;
- stack traces;
- raw request or response bodies;
- prompts, generated content or private application data;
- internal validation payloads.

## 4. Session-expired experience

When an already-authenticated user loses the refresh session while using a protected area, the application should communicate that state explicitly.

Required flow:

```text
Protected page
→ authenticated refresh can no longer be completed
→ local authenticated state is cleared
→ redirect to /login
→ show: “Your session expired. Sign in again to continue.”
→ successful sign-in
→ return to the original safe internal destination
```

### Session notice

Exact primary copy:

> **Your session expired. Sign in again to continue.**

The notice is informational rather than a red validation/error box. It appears between the Login introduction and form.

### Distinguish runtime expiry from ordinary anonymous startup

An ordinary anonymous visitor opening the app or `/login` must not see the expired-session notice.

The application must distinguish:

- initial bootstrap with no valid refresh session → ordinary anonymous Login;
- a previously authenticated session later becoming invalid/expired → session-expired Login notice;
- explicit logout → ordinary Login without an expired-session notice.

The smallest implementation should derive this distinction from existing in-memory authentication state/ref information. Do not persist a session-expired flag in `localStorage`, new cookies, URL query parameters or MongoDB.

### Auth-state cleanup

When an authenticated session is cleared because refresh can no longer be completed:

- the access token is removed from memory;
- authenticated user state becomes anonymous;
- any in-memory marker used only to identify the outgoing authenticated user is cleared after it has served the transition;
- existing user-scoped Resume recovery isolation must remain safe.

Do not alter refresh-token backend semantics solely to implement the notice.

## 5. Safe return-to-page behavior

The existing safe-internal-redirect boundary remains authoritative.

Examples that remain valid:

```text
/resumes/<id>
/interviews/<id>
/learning/documents/<id>
/settings
/dashboard
```

Unsafe or non-internal redirect values continue to fall back to `/dashboard`.

Do not weaken or replace `safeInternalRedirect()`.

After a session-expired redirect, the Login route carries the existing safe `from` destination together with a bounded session-expired reason in router state. Successful Login reuses `intendedLocationFromState(...)` to return to the original page.

## 6. Logout refinement

Preserve the current provider guarantee that local authentication clears even when the server logout request fails.

Add one shared AppShell logout-in-progress state:

```text
Log out
→ Logging out…
```

Requirements:

- first click begins the existing logout operation;
- both desktop and mobile logout controls become disabled immediately;
- both controls show `Logging out…` while the operation is in progress;
- duplicate logout submissions are ignored;
- existing outgoing-user Resume recovery cleanup continues;
- the server logout request is attempted once;
- local authentication is cleared whether the server request succeeds or fails;
- protected routing then returns the user to ordinary Login;
- explicit logout does not show the session-expired notice.

No logout confirmation dialog and no logout-success toast are required.

## 7. Security architecture preserved

Phase 19E must preserve the existing security design unless a concrete regression proves a repair is necessary:

- access token remains in memory;
- refresh token remains in the existing HTTP-only cookie;
- production cookie remains `Secure`;
- cookie remains `SameSite=Lax`;
- refresh cookie path remains scoped to `/api/v1/auth`;
- refresh-token rotation remains;
- refresh-token reuse detection remains;
- session expiration remains enforced;
- logout revocation remains;
- account-status checks remain;
- authentication API responses remain strictly validated by the frontend;
- Authorization headers continue to be constructed by the central API client rather than accepted from callers.

Expected backend production changes: **none**.

## 8. Authentication bootstrap

Keep the existing `Restoring your session` state and stable AuthenticationShell frame.

Do not introduce a new spinner framework, skeleton system or loading dependency.

Minor copy/spacing changes are allowed only if browser QA shows a real visual problem.

## 9. Visual refinement

The current Login and Registration screenshots reviewed on 2026-08-16 are already strong and should be polished rather than redesigned.

Preserve:

- the split-screen authentication architecture;
- the white form panel;
- the dark green brand panel;
- Career Learning Hub branding and logo treatment;
- the large `Build momentum from learning to opportunity.` brand headline;
- the pathway/open-book illustration;
- the four capability cards;
- the established typography and green palette.

### Bounded visual changes

- integrate Show/Hide Password neatly inside the password-field geometry;
- slightly improve the shorter Login form’s vertical balance within the left panel without making Login and Registration visually inconsistent;
- keep Registration density close to the current baseline;
- render the session-expired notice as a restrained sage/neutral information panel;
- keep API-error presentation compact with Technical details visually secondary;
- avoid unnecessary layout jumping when validation messages appear/disappear;
- keep submit-button dimensions stable between idle and busy labels;
- give password toggle, disclosure, links and inputs a consistent visible green focus treatment;
- allow long Request IDs to wrap safely;
- preserve reduced-motion behavior;
- preserve the right-side brand panel unless only small spacing/scaling adjustments are required during QA.

### Responsive behavior

At tablet/mobile widths:

- authentication form content has priority;
- password visibility control must remain usable without crushing the input;
- notice/error/disclosure content wraps without horizontal overflow;
- no new horizontal scrolling is introduced;
- existing mobile simplification of the brand panel remains acceptable.

## 10. Accessibility requirements

Preserve or improve:

- explicit form labels;
- `aria-invalid`;
- `aria-describedby`;
- required-state semantics;
- validation-summary links and focus movement;
- keyboard-operable password visibility controls;
- accessible password-toggle state;
- visible focus indicators;
- disabled/busy states;
- `aria-busy` for authentication submission;
- accessible API error region;
- accessible session-expired notice;
- no color-only meaning;
- no password-toggle focus loss when visibility changes;
- reduced-motion support.

## 11. Error behavior

### Local validation failure

Keep concise field-level messages and current focus rules.

### Credential failure

Example:

> Email or password is incorrect.

Focus the API-error region. Request ID, when available, is behind Technical details.

### Registration failure

Continue using the existing safe server message. Do not expose whether a specific email already exists beyond the existing registration contract.

### Session expired

Use the informational session notice rather than a validation error.

### Unknown/network failure

Retain generic safe wording such as:

> Sign in could not be completed. Please try again.

Do not manufacture low-level network diagnostics.

## 12. Component boundaries

Do not create a generic enterprise form framework.

Small focused reuse is appropriate when it clearly reduces duplicate Login/Register behavior. Preferred candidates:

- `PasswordField` or `PasswordVisibilityControl` — password input/toggle presentation only;
- `AuthenticationApiError` — user-facing API error plus optional Technical details disclosure only.

Either may remain inline if extracting it would add more complexity than it removes.

Do not refactor unrelated forms elsewhere in the application.

## 13. Expected files

Likely modifications:

- `frontend/src/features/auth/LoginPage.tsx`
- `frontend/src/features/auth/RegisterPage.tsx`
- `frontend/src/features/auth/AuthProvider.tsx`
- `frontend/src/features/auth/AuthRoute.tsx`
- `frontend/src/features/auth/auth.css`
- `frontend/src/AppShell.tsx`
- `frontend/src/routing/router.test.tsx`
- `frontend/src/features/auth/AuthProvider.test.tsx`

Potential focused additions only if justified:

- `frontend/src/features/auth/PasswordField.tsx`
- `frontend/src/features/auth/AuthenticationApiError.tsx`
- focused tests for those components.

A small API-client adapter typing/notification change is acceptable only if required to represent runtime session loss cleanly without changing refresh semantics.

Expected backend production files: **none**.

## 14. Test-first contract

Product behavior changes must be defined by tests before implementation.

Focused coverage should prove at minimum:

1. Login Show/Hide Password;
2. Registration Show/Hide Password;
3. typed password survives visibility switching;
4. password toggle disables while busy;
5. Login email/password maximum lengths align with backend limits;
6. validation remains quiet before the first submit attempt;
7. correcting one invalid field removes only that field’s error;
8. stale API error clears after relevant credential editing;
9. Login and Registration API error regions receive focus consistently;
10. Technical details is closed by default;
11. Technical details reveals Request ID when present;
12. authentication diagnostics never echo passwords/tokens;
13. session-expired notice appears after a previously authenticated session is lost;
14. an ordinary anonymous first visit does not show that notice;
15. explicit logout does not show that notice;
16. intended internal destination survives session expiry;
17. successful re-login returns to the safe intended destination;
18. unsafe redirect remains rejected;
19. logout label changes to `Logging out…`;
20. duplicate logout is blocked;
21. desktop and mobile logout controls share the busy state;
22. logout server failure still clears local authentication;
23. existing Resume recovery cleanup behavior remains safe;
24. authentication bootstrap still does not flash Login before refresh resolution;
25. Forgot Password, OAuth, Remember Me and MFA controls remain absent.

## 15. Local qualification gate

After implementation, qualify the exact final feature-branch head on the user’s Mac.

Required frontend evidence:

1. focused Phase 19E authentication/router tests;
2. frontend typecheck;
3. frontend production build;
4. `git diff --check origin/main...HEAD`;
5. full frontend regression suite.

Backend qualification is required only if the final diff unexpectedly changes backend production code. Backend changes are not planned.

Any failure is repaired on the same Phase 19E branch/PR before qualification continues.

## 16. Browser QA

### Login

Verify:

- normal sign-in;
- invalid email;
- missing password;
- Show/Hide Password;
- wrong-password API failure;
- Technical details disclosure;
- busy state;
- narrow viewport.

### Registration

Verify:

- invalid display name;
- invalid email;
- invalid password;
- Show/Hide Password;
- API failure;
- successful account creation;
- narrow viewport.

### Session expiry

Verify the complete protected-page flow:

```text
protected page
→ session no longer refreshable
→ Login with session-expired notice
→ successful sign-in
→ original safe page restored
```

### Logout

Verify:

- desktop logout;
- immediate `Logging out…` state;
- duplicate submission prevention;
- ordinary Login after completion;
- mobile-drawer logout;
- no stale authenticated UI after logout.

## 17. Explicit non-goals

Phase 19E does not change:

- Gemini/provider routing;
- AI prompts or models;
- Resume product behavior;
- Interview product behavior;
- Learning product behavior;
- Dashboard product behavior;
- MongoDB schemas or migrations;
- durable AI jobs/polling/cancellation/idempotency;
- file storage or Candidate Photo behavior;
- deployment configuration.

## 18. Execution and approval boundaries

Execution remains one branch and one PR:

```text
main @ 8887a10...
→ phase-19e-authentication-refinements
→ approved design spec
→ approved implementation plan
→ test-first product implementation
→ local qualification
→ browser QA
→ same-PR repairs if needed
→ explicit merge approval
→ main
```

Rules:

- never mutate `main` directly;
- ChatGPT uses the GitHub connector for repository changes;
- user pulls the branch and runs local toolchain/browser qualification;
- no merge without explicit user approval;
- no deployment without separate explicit approval;
- no feature-branch deletion without separate explicit approval.

## Acceptance summary

Phase 19E is complete when the existing authentication architecture remains secure and compatible while the user experience provides:

- accessible Show/Hide Password controls;
- backend-aligned input constraints;
- post-submit field-error recovery;
- stale API-error cleanup;
- user-first API error messaging with collapsed Request ID details;
- explicit session-expired communication and safe destination restoration;
- deterministic logout busy/duplicate-prevention behavior;
- polished Login/Register visual balance and responsive behavior;
- green focused tests, typecheck, production build, full frontend regression and browser QA at the exact final head.
