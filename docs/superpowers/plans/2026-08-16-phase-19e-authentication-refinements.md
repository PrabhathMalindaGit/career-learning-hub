# Phase 19E — Authentication Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the existing Career Learning Hub email/password authentication and session experience with accessible password visibility, clearer validation/API diagnostics, explicit runtime session-expiry UX, deterministic logout feedback, and bounded visual polish without adding new authentication products or changing the established backend security architecture.

**Architecture:** Keep all product work on `phase-19e-authentication-refinements` / PR #27. Reuse the existing `AuthProvider`, `AuthRoute`, `LoginPage`, `RegisterPage`, central API client, and `AppShell`; add only the smallest state needed to distinguish an already-authenticated session that later becomes unusable from an ordinary anonymous bootstrap. Preserve existing routing and backend session semantics, with frontend-only behavior/presentation changes unless a concrete regression proves otherwise.

**Tech Stack:** React 19, TypeScript 5.8, React Router 7, Vitest 4, Testing Library, existing Career Learning Hub authentication APIs and CSS.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Baseline: `main @ 8887a10be6283b8ea551e160f662cadcd7fe11f4`.
- Branch: `phase-19e-authentication-refinements`.
- PR: `#27`.
- Design spec: `docs/superpowers/specs/2026-08-16-phase-19e-authentication-refinements-design.md`.
- Keep exactly email/password registration, email/password login, the existing refresh-session mechanism, the existing logout/session-revocation mechanism, and the existing protected/public-only routing model.
- Do not add Forgot Password/password reset, email verification, OAuth/social login, Remember Me, MFA/OTP/passkeys/magic links, CAPTCHA, a new session-management screen, email infrastructure, or a new identity provider.
- Preserve access tokens in memory and the refresh token in the existing HTTP-only cookie.
- Preserve existing backend refresh-token rotation, reuse detection, logout revocation, account-status checks, cookie flags/path, and authentication response validation.
- Expected backend production changes: **none**.
- Do not change Gemini/provider routing, AI prompts/models, Resume, Interview, Learning, Dashboard product behavior, MongoDB schemas/migrations, durable jobs, storage, Candidate Photo, or deployment configuration.
- Preserve `safeInternalRedirect()` as the authoritative return-path trust boundary.
- Preserve the existing `Restoring your session` bootstrap and no-login-flash behavior.
- Preserve existing user-scoped Resume recovery isolation during logout/session transitions.
- No passwords, access tokens, refresh tokens, stack traces, raw request/response bodies, prompts, generated content, or private application data may be surfaced in authentication diagnostics.
- Product behavior changes follow test-first ordering. The GitHub connector cannot execute the local toolchain, so RED/GREEN ordering is preserved by committing test-contract changes before implementation changes; executable verification is obtained on the user's Mac after the implementation head is available.
- ChatGPT uses the GitHub connector for repository mutations. The user pulls the branch and performs local automated/browser qualification.
- Do not merge, deploy, or delete the feature branch without separate explicit user approval.

---

## File Structure

### Modify

- `frontend/src/features/auth/AuthProvider.tsx` — represent a bounded anonymous reason for genuine runtime session loss while preserving existing in-memory token/session and Resume-recovery cleanup behavior.
- `frontend/src/features/auth/AuthProvider.test.tsx` — cover ordinary bootstrap anonymity versus previously-authenticated runtime session loss and cleanup invariants.
- `frontend/src/features/auth/AuthRoute.tsx` — carry the bounded session-expired reason through existing protected-route state while preserving safe return paths.
- `frontend/src/features/auth/LoginPage.tsx` — session-expired notice, password visibility, backend-aligned max lengths, post-submit field recovery, stale API-error clearing, API-error focus, and collapsed Request-ID diagnostics.
- `frontend/src/features/auth/RegisterPage.tsx` — password visibility, post-submit field recovery, stale API-error clearing, and collapsed Request-ID diagnostics while preserving current registration rules.
- `frontend/src/features/auth/auth.css` — password-toggle geometry, informational session notice, compact technical-details styling, focus/disabled states, narrow-layout wrapping, and modest Login balance polish only.
- `frontend/src/AppShell.tsx` — shared desktop/mobile logout busy state and duplicate-call fence.
- `frontend/src/routing/router.test.tsx` — integrated Login/Register/routing/logout behavioral coverage, including safe return after session expiry.

### Keep unchanged unless a failing contract proves a need

- `frontend/src/features/auth/authApi.ts`
- `frontend/src/api/apiClient.ts`
- all backend production files under `backend/src/modules/auth/**`

No new shared form framework is planned. Keep Login/Register logic local unless a repeated block becomes materially safer/smaller as one focused helper during implementation.

---

### Task 1: Define the runtime session-expiry state contract

**Files:**
- Modify: `frontend/src/features/auth/AuthProvider.test.tsx`
- Modify: `frontend/src/routing/router.test.tsx`

**Interfaces:**
- Produces the required observable contract for `AuthProvider`/`AuthRoute`: ordinary anonymous bootstrap has no expiry reason; a previously authenticated refresh loss has `anonymousReason: "session-expired"`; explicit logout returns to ordinary anonymous state.
- Consumes the current `AuthProvider`, `AuthRoute`, `ApiError`, and router test helpers.

- [ ] **Step 1: Add failing provider tests for anonymous-reason classification**

Extend the existing auth probe to expose `anonymousReason`:

```tsx
<p data-testid="anonymous-reason">
  {auth.anonymousReason ?? "none"}
</p>
```

Add coverage equivalent to:

```ts
it("does not label ordinary anonymous bootstrap as session-expired", async () => {
  vi.mocked(authApi.refreshSession).mockRejectedValue(
    new ApiError(401, "REFRESH_TOKEN_REQUIRED", "A refresh token is required."),
  );

  renderProvider();

  await waitFor(() => {
    expect(screen.getByTestId("status").textContent).toBe("anonymous");
  });
  expect(screen.getByTestId("anonymous-reason").textContent).toBe("none");
});
```

Add a runtime-loss test that first restores `restoredSession`, then triggers a protected API request whose refresh returns a 401 `INVALID_SESSION`; expect `status === "anonymous"` and `anonymousReason === "session-expired"`.

Add an explicit-logout test proving logout ends with `anonymousReason === null` even when the user had previously been authenticated.

- [ ] **Step 2: Add failing router tests for expiry notice and intended destination preservation**

Use an authenticated protected initial entry such as `/settings`. After the restored session is established, make a protected request return 401 and the refresh fail with `ApiError(401, "INVALID_SESSION", ...)`.

Assert the router ultimately reaches `/login`, the Login page shows exactly:

```text
Your session expired. Sign in again to continue.
```

Then resolve a successful Login and assert the router returns to `/settings`.

Also add controls proving:

```ts
expect(screen.queryByText("Your session expired. Sign in again to continue.")).toBeNull();
```

for:
- ordinary anonymous `/login` bootstrap;
- explicit logout.

Keep the existing unsafe-return-path tests and add one expiry-state case confirming an unsafe `from` still lands on `/dashboard`.

- [ ] **Step 3: Commit the RED session-expiry contract**

Commit only the test changes:

```text
test: define Phase 19E session expiry contract
```

Expected at this commit: the new tests fail because `anonymousReason` and the expiry notice/state transport do not exist yet.

---

### Task 2: Implement the smallest session-expiry state and route transport

**Files:**
- Modify: `frontend/src/features/auth/AuthProvider.tsx`
- Modify: `frontend/src/features/auth/AuthRoute.tsx`
- Modify: `frontend/src/features/auth/LoginPage.tsx`
- Test: `frontend/src/features/auth/AuthProvider.test.tsx`
- Test: `frontend/src/routing/router.test.tsx`

**Interfaces:**
- Produces: `AuthenticationAnonymousReason = "session-expired" | null` and `AuthContextValue.anonymousReason`.
- Produces: `authenticationReasonFromState(state: unknown): AuthenticationAnonymousReason` in `AuthRoute.tsx` for Login to read from router state.
- Preserves: `intendedLocationFromState(state)` and `safeInternalRedirect(value)` behavior.

- [ ] **Step 1: Extend the provider state shape**

Use the smallest explicit reason type:

```ts
export type AuthenticationAnonymousReason = "session-expired" | null;

type AuthenticationState = {
  status: AuthenticationStatus;
  user: PublicUser | null;
  anonymousReason: AuthenticationAnonymousReason;
};
```

Initialize with:

```ts
{
  status: "bootstrapping",
  user: null,
  anonymousReason: null,
}
```

Authenticated state always sets `anonymousReason: null`.

- [ ] **Step 2: Classify genuine runtime refresh loss without changing API-client semantics**

Keep the existing API-client adapter unchanged. In `AuthProvider.refreshSession`, catch the refresh failure before rethrowing and set a ref only when both conditions hold:

```ts
const wasAuthenticated = knownUserIdRef.current !== null;
const sessionIsUnavailable = error instanceof ApiError && error.status === 401;
```

When both are true, set a private pending reason ref to `"session-expired"`; otherwise leave it `null`.

Do not treat initial bootstrap 401 as expired because `knownUserIdRef.current` is still null.

Do not classify 5xx/network/invalid-response failures as a session-expired notice.

- [ ] **Step 3: Apply and consume the pending reason when authentication clears**

When the central refresh coordinator calls `clearAuthentication`, read the pending reason once, then reset it.

For a genuine outgoing authenticated user, preserve user isolation before clearing the known-user marker:

```ts
const outgoingUserId = knownUserIdRef.current;
if (outgoingUserId) {
  cleanupOutgoingUserRecovery(outgoingUserId);
  knownUserIdRef.current = null;
}
```

Then clear the access token and set:

```ts
setState({
  status: "anonymous",
  user: null,
  anonymousReason: pendingReason,
});
```

Explicit `logout()` must force the pending reason to null before its final local clear so Logout never produces the expiry notice.

- [ ] **Step 4: Carry the reason through protected-route state**

Add:

```ts
export function authenticationReasonFromState(
  state: unknown,
): AuthenticationAnonymousReason {
  return (
    typeof state === "object" &&
    state !== null &&
    "authReason" in state &&
    state.authReason === "session-expired"
  )
    ? "session-expired"
    : null;
}
```

When `AuthRoute` redirects an anonymous user from a protected route, preserve the existing safe `from` and include `authReason: "session-expired"` only when the provider exposes that reason.

Do not put this marker in query strings, browser storage, cookies, or the backend.

- [ ] **Step 5: Render the Login informational notice**

In `LoginPage`, use `authenticationReasonFromState(location.state)` and render, between `.auth-intro` and the form:

```tsx
{authenticationReasonFromState(location.state) === "session-expired" ? (
  <div className="authentication-session-notice" role="status">
    <strong>Your session expired.</strong>{" "}
    <span>Sign in again to continue.</span>
  </div>
) : null}
```

The resulting readable text must be exactly:

```text
Your session expired. Sign in again to continue.
```

- [ ] **Step 6: Run the focused session tests after implementation**

On the user's Mac after the implementation head is available:

```bash
npm --prefix frontend test -- \
  src/features/auth/AuthProvider.test.tsx \
  src/routing/router.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit the session implementation**

```text
feat: clarify expired authentication sessions
```

---

### Task 3: Define Login and Registration refinement contracts

**Files:**
- Modify: `frontend/src/routing/router.test.tsx`

**Interfaces:**
- Defines observable contracts for the existing `LoginPage` and `RegisterPage` without adding new auth endpoints.

- [ ] **Step 1: Add failing password visibility tests for Login**

After rendering anonymous `/login`, assert the password input starts masked:

```ts
const password = screen.getByLabelText("Password");
expect((password as HTMLInputElement).type).toBe("password");
```

Enter `SyntheticPassword1`, activate `Show password`, then assert:

```ts
expect((password as HTMLInputElement).type).toBe("text");
expect((password as HTMLInputElement).value).toBe("SyntheticPassword1");
expect(screen.getByRole("button", { name: "Hide password" })).not.toBeNull();
```

Activate again and assert it returns to `type="password"` without changing the value.

- [ ] **Step 2: Add the same failing visibility contract for Registration**

Repeat against `/register`, preserving the existing registration password requirements and `autoComplete="new-password"`.

- [ ] **Step 3: Add failing max-length parity tests for Login**

Assert:

```ts
expect((email as HTMLInputElement).maxLength).toBe(320);
expect((password as HTMLInputElement).maxLength).toBe(128);
```

Registration already carries these limits; preserve its current assertions/behavior.

- [ ] **Step 4: Add failing post-submit field-recovery tests**

For Login:
1. submit invalid email + empty password;
2. verify both errors exist and summary has focus;
3. correct only the email;
4. verify the email error disappears while `Enter your password.` remains;
5. type a password and verify the password error disappears.

For Registration, repeat with display name/email/password so correcting one field removes only its own existing error.

Also assert no validation errors are shown before the first submit attempt.

- [ ] **Step 5: Add failing stale API-error cleanup tests**

Cause Login to receive:

```ts
new ApiError(
  401,
  "INVALID_CREDENTIALS",
  "Email or password is incorrect.",
  "login-request-id-0001",
)
```

After the error renders, edit email or password and assert the stale API error disappears immediately.

Repeat for Registration with the existing safe registration error message.

- [ ] **Step 6: Add failing API-error focus and Technical-details tests**

Assert the API error container receives focus for both Login and Registration.

Assert `Technical details` exists only when `requestId` exists, is closed by default, and reveals:

```text
Request ID: login-request-id-0001
```

only after disclosure expansion.

Assert the document text never includes the submitted password or any synthetic access/refresh token string.

- [ ] **Step 7: Add failing busy-state toggle tests**

Use deferred Login/Register promises. While submission is pending:

```ts
expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
```

or the equivalent current visibility action.

Preserve existing submit labels `Signing in…` and `Creating account…` and the existing submit `aria-busy` behavior.

- [ ] **Step 8: Preserve explicit non-feature coverage**

Keep/add assertions that Login/Register still contain no:

```text
Forgot password / Reset password
Remember me
Continue with Google / OAuth
MFA / verification-code controls
```

Do not create new tests that require nonexistent auth capabilities.

- [ ] **Step 9: Commit the RED form-refinement contract**

```text
test: define Phase 19E authentication form contract
```

Expected at this commit: the new tests fail until the form refinements are implemented.

---

### Task 4: Implement Login and Registration interaction refinements

**Files:**
- Modify: `frontend/src/features/auth/LoginPage.tsx`
- Modify: `frontend/src/features/auth/RegisterPage.tsx`
- Modify: `frontend/src/features/auth/auth.css`
- Test: `frontend/src/routing/router.test.tsx`

**Interfaces:**
- Consumes existing `validateLogin(...)`, `validateRegistration(...)`, `ApiError`, `useAuth()`, and router state helpers.
- Produces no new backend/API contract.

- [ ] **Step 1: Add local password-visibility state to Login**

Add:

```ts
const [showPassword, setShowPassword] = useState(false);
```

Render the password input inside a positioned wrapper and set:

```tsx
type={showPassword ? "text" : "password"}
maxLength={128}
```

Add a sibling button:

```tsx
<button
  className="password-visibility-toggle"
  type="button"
  aria-pressed={showPassword}
  disabled={busy}
  onClick={() => setShowPassword((visible) => !visible)}
>
  {showPassword ? "Hide password" : "Show password"}
</button>
```

Add `maxLength={320}` to Login email.

- [ ] **Step 2: Add the same password-visibility behavior to Registration**

Keep:

```tsx
autoComplete="new-password"
maxLength={128}
```

and the existing password requirements `aria-describedby` chain.

- [ ] **Step 3: Clear/revalidate only fields that already have submit errors**

For each controlled input, use a small local change handler that:
1. stores the new value;
2. clears `apiError` because credentials/form data changed;
3. only revalidates that field if it currently has an error;
4. removes that field key when it becomes valid;
5. leaves unrelated error keys unchanged.

For Login email, for example:

```ts
function handleEmailChange(nextEmail: string) {
  setEmail(nextEmail);
  setApiError(null);
  setErrors((current) => {
    if (!current.email) return current;
    const nextError = validateLogin(nextEmail, password).email;
    if (nextError) return { ...current, email: nextError };
    const { email: _removed, ...rest } = current;
    return rest;
  });
}
```

Use equivalent handlers for Login password and Registration display name/email/password. Do not globally revalidate untouched fields on every keystroke.

- [ ] **Step 4: Align Login API-error focus with Registration**

Add:

```ts
const apiErrorRef = useRef<HTMLDivElement>(null);
```

and:

```ts
useEffect(() => {
  if (apiError) {
    apiErrorRef.current?.focus();
  }
}, [apiError]);
```

Keep Registration's existing focus behavior.

- [ ] **Step 5: Move Request ID into native Technical details on both pages**

Replace the directly visible Request ID with:

```tsx
{apiError.requestId ? (
  <details className="authentication-technical-details">
    <summary>Technical details</summary>
    <p className="request-id">Request ID: {apiError.requestId}</p>
  </details>
) : null}
```

Keep the user-facing error message outside the disclosure and primary.

- [ ] **Step 6: Add bounded authentication CSS for the new states**

In `auth.css`, add only auth-local selectors:

```css
.password-input-wrap {
  position: relative;
}

.password-input-wrap input {
  width: 100%;
  padding-inline-end: 7.75rem;
}

.password-visibility-toggle {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  min-height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--auth-deep-forest);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 760;
}
```

Add visible `:focus-visible`, disabled opacity/cursor, narrow-width handling, `.authentication-session-notice`, and `.authentication-technical-details` styles using the existing green/sage palette.

For the session notice use a restrained light sage/neutral surface, not the red error treatment.

For Login vertical balance, make only a modest desktop adjustment using the existing `authentication-shell--login` mode selector; do not redesign the panel or alter Registration density materially.

Keep submit button dimensions unchanged between idle and busy labels.

- [ ] **Step 7: Preserve responsive and reduced-motion behavior**

At `max-width: 620px`, ensure the password toggle remains inside the field without horizontal overflow. Long Request IDs must wrap with `overflow-wrap: anywhere`.

Add any new animated selector to the existing `prefers-reduced-motion: reduce` block only if an animation is introduced; otherwise add no animation.

- [ ] **Step 8: Run focused form tests after implementation**

```bash
npm --prefix frontend test -- src/routing/router.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit the form implementation**

```text
feat: refine authentication form experience
```

---

### Task 5: Define deterministic logout behavior

**Files:**
- Modify: `frontend/src/routing/router.test.tsx`

**Interfaces:**
- Defines observable AppShell behavior while keeping `AuthContextValue.logout(): Promise<void>` unchanged.

- [ ] **Step 1: Add a failing desktop logout-busy test**

Restore an authenticated session and make `authApi.logout` return a deferred Promise.

Click the desktop `Log out` control and immediately assert:

```ts
expect(screen.getByRole("button", { name: "Logging out…" })).toBeDisabled();
expect(authApi.logout).toHaveBeenCalledTimes(1);
```

Attempt another activation and confirm call count remains 1.

Resolve the logout and assert routing reaches ordinary `/login` without the session-expired notice.

- [ ] **Step 2: Add a failing server-failure logout test**

Reject the deferred server logout. Assert local authentication still clears and Login is reached, preserving the existing provider guarantee.

- [ ] **Step 3: Add a failing mobile logout test**

Open the mobile Navigation dialog, activate its `Log out`, and assert the shared busy state is reflected consistently while the logout Promise is pending.

If both logout controls are present in the DOM, assert both are disabled and use `Logging out…`.

- [ ] **Step 4: Preserve Resume recovery/logout coverage**

Do not remove or weaken existing `AuthProvider.test.tsx` assertions proving outgoing-user recovery cleanup and writer invalidation during logout.

- [ ] **Step 5: Commit the RED logout contract**

```text
test: define Phase 19E logout interaction contract
```

---

### Task 6: Implement one shared AppShell logout-in-progress state

**Files:**
- Modify: `frontend/src/AppShell.tsx`
- Test: `frontend/src/routing/router.test.tsx`

**Interfaces:**
- Consumes existing `logout(): Promise<void>` from `useAuth()`.
- Produces AppShell-local `logoutBusy` state only; no provider/API contract change.

- [ ] **Step 1: Add a synchronous duplicate-call fence**

Use both state and a ref so rapid repeat activation cannot beat React state scheduling:

```ts
const [logoutBusy, setLogoutBusy] = useState(false);
const logoutPendingRef = useRef(false);
```

Add one shared handler:

```ts
function handleLogout() {
  if (logoutPendingRef.current) return;

  logoutPendingRef.current = true;
  setLogoutBusy(true);
  void logout()
    .catch(() => undefined)
    .finally(() => {
      logoutPendingRef.current = false;
      setLogoutBusy(false);
    });
}
```

The provider remains authoritative for clearing local auth even when server logout fails.

- [ ] **Step 2: Wire both desktop and mobile controls to the same handler/state**

For both controls:

```tsx
disabled={logoutBusy}
onClick={handleLogout}
```

and label:

```tsx
{logoutBusy ? "Logging out…" : "Log out"}
```

The mobile handler should still close the mobile drawer before starting logout, but must call the same shared logout function rather than issuing a second independent request.

- [ ] **Step 3: Run the focused routing/logout tests**

```bash
npm --prefix frontend test -- src/routing/router.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit the logout implementation**

```text
feat: make logout interaction deterministic
```

---

### Task 7: Add final Phase 19E regression/accessibility contract

**Files:**
- Modify: `frontend/src/routing/router.test.tsx`
- Modify only if required by new behavior: `frontend/src/features/auth/AuthProvider.test.tsx`

**Interfaces:**
- Locks the completed Phase 19E behavior without introducing a separate product abstraction.

- [ ] **Step 1: Add/retain integrated accessibility assertions**

Prove:
- password toggle is a real button and keyboard-operable;
- toggle `aria-pressed` tracks visibility;
- password field retains existing label and `aria-describedby` relationships;
- API errors are focusable alert regions;
- session-expired notice uses informational semantics and is not rendered as a field validation error;
- busy submit/logout controls are disabled;
- existing validation summary focus rules remain.

- [ ] **Step 2: Add privacy/non-leak assertions**

Using synthetic password/token strings, assert the rendered document never contains:

```text
SyntheticPassword1
synthetic-access-token
synthetic-refresh-token
```

except the password input's own `.value` when deliberately revealed; do not assert against the input value itself when checking DOM text leakage.

- [ ] **Step 3: Lock the scope exclusions**

Assert authentication screens still do not expose controls matching:

```text
forgot password
reset password
remember me
continue with google
multi-factor
verification code
passkey
```

- [ ] **Step 4: Run the focused Phase 19E suite**

```bash
npm --prefix frontend test -- \
  src/features/auth/AuthProvider.test.tsx \
  src/routing/router.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the final contract adjustments if this task changed tests**

```text
test: lock Phase 19E authentication refinements
```

If no new test edit is needed after earlier tasks, do not create an empty commit.

---

### Task 8: Exact-head local qualification

**Files:**
- No product changes unless a verification failure identifies a concrete regression.

**Interfaces:**
- Qualifies the exact final PR #27 head before browser QA and merge approval.

- [ ] **Step 1: User pulls the exact branch head**

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"

git checkout phase-19e-authentication-refinements
git pull origin phase-19e-authentication-refinements

git rev-parse HEAD
git status --short
```

Record the exact SHA. `git status --short` must be empty.

- [ ] **Step 2: Run focused Phase 19E tests**

```bash
npm --prefix frontend test -- \
  src/features/auth/AuthProvider.test.tsx \
  src/routing/router.test.tsx
echo "PHASE19E_FOCUSED_EXIT=$?"
```

Expected: exit 0.

- [ ] **Step 3: Run frontend typecheck**

```bash
npm --prefix frontend run typecheck
echo "PHASE19E_TYPECHECK_EXIT=$?"
```

Expected: exit 0.

- [ ] **Step 4: Run frontend production build**

```bash
npm --prefix frontend run build
echo "PHASE19E_BUILD_EXIT=$?"
```

Expected: exit 0. Existing unrelated Vite warnings are non-blocking if the command exits 0.

- [ ] **Step 5: Run diff hygiene**

```bash
git diff --check origin/main...HEAD
echo "PHASE19E_DIFF_CHECK_EXIT=$?"
```

Expected: exit 0.

- [ ] **Step 6: Run the full frontend regression suite**

```bash
npm --prefix frontend test
echo "PHASE19E_FULL_FRONTEND_EXIT=$?"
```

Expected: exit 0.

- [ ] **Step 7: Backend gate only if backend production files changed unexpectedly**

First inspect:

```bash
git diff --name-only origin/main...HEAD
```

If no backend production file changed, do not run a redundant backend campaign solely for Phase 19E.

If any backend production auth file changed, stop and re-review scope before qualification; backend changes were not authorized by this plan.

---

### Task 9: Browser QA and visual acceptance

**Files:**
- No code changes unless QA exposes a bounded defect. Any repair stays on PR #27 and requires requalification of the affected gates.

- [ ] **Step 1: Login QA**

Verify on desktop and a narrow/mobile viewport:
- normal Login;
- invalid email + missing password summary/focus;
- per-field error disappears when corrected while unrelated errors remain;
- Show/Hide Password preserves the typed value and focus;
- wrong-password API error focuses correctly;
- Request ID is hidden behind collapsed `Technical details` and reveals correctly;
- editing credentials removes the stale API error;
- `Signing in…` keeps button geometry stable;
- no horizontal overflow.

- [ ] **Step 2: Registration QA**

Verify:
- invalid display name/email/password behavior;
- per-field recovery;
- existing 12–128 uppercase/lowercase/number guidance;
- Show/Hide Password;
- API error + Technical details;
- `Creating account…` stable geometry;
- successful account creation;
- narrow/mobile layout.

- [ ] **Step 3: Session-expiry QA**

Using a real local authenticated session, make the refresh session unavailable/expired and verify:

```text
protected page
→ /login
→ Your session expired. Sign in again to continue.
→ successful sign-in
→ original safe protected page
```

Confirm an ordinary fresh anonymous Login does not show the notice.

- [ ] **Step 4: Logout QA**

Verify desktop and mobile:
- first activation immediately shows `Logging out…`;
- control is disabled while pending;
- duplicate submission does not occur;
- logout returns to ordinary Login;
- no expired-session notice appears;
- no stale authenticated shell remains.

- [ ] **Step 5: Visual acceptance against the approved screenshots**

Confirm the existing split-screen design remains recognizable and strong:
- white form panel preserved;
- dark green brand panel preserved;
- logo/brand lockup preserved;
- `Build momentum from learning to opportunity.` preserved;
- pathway/open-book illustration preserved;
- four capability cards preserved;
- Login receives only modest balance improvement;
- Registration density remains close to baseline;
- new notice/toggle/diagnostics look native to the existing green design language rather than bolted on.

---

## Final Merge Gate

Only after Tasks 8 and 9 are GREEN:

1. Re-pin PR #27 through GitHub.
2. Confirm PR base is still `main` and the head SHA exactly matches the locally qualified SHA.
3. Confirm the final diff contains no unexpected backend/auth-infrastructure/provider/deployment changes.
4. Record automated and browser evidence in the PR description.
5. Keep PR #27 unmerged until the user explicitly authorizes that exact qualified head.
6. Do not deploy or delete the feature branch as part of the merge unless separately authorized.

## Expected Phase 19E Result

At completion the application retains the existing secure authentication architecture while providing:

- accessible Show/Hide Password on Login and Registration;
- Login max-length parity with backend limits;
- submit-triggered validation with per-field recovery;
- stale authentication API-error cleanup after input changes;
- focused, user-first API failures with Request IDs behind `Technical details`;
- a clear runtime-only session-expired notice;
- safe return to the intended protected page after re-login;
- deterministic one-request logout behavior with `Logging out…` across desktop/mobile;
- preserved Resume-recovery isolation and local-auth clearing semantics;
- restrained visual/responsive/accessibility polish;
- no new authentication products, backend rewrite, or unrelated platform complexity.
