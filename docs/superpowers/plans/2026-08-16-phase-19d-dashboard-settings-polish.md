# Phase 19D Dashboard + Settings Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved final Phase 19D polish to the existing Dashboard and add a bounded `AI usage & diagnostics` section to Settings without introducing backend, schema, provider, routing, or telemetry-persistence changes.

**Architecture:** Keep PR #26 on the existing `phase-19d-dashboard-refinements` branch. Reuse `fetchProgressSnapshot(...)` and the existing validated `DashboardProgress.aiUsage` contract. Dashboard changes remain presentation/state changes only; Settings receives one focused diagnostics component that owns its own loading/error/retry/abort lifecycle. Activity remains the existing endpoint, with 5 items in collapsed mode and 10 items per page only after explicit expansion.

**Tech Stack:** React 19, TypeScript 5.8, React Router 7, Vitest 4, Testing Library, existing Career Learning Hub Dashboard/Settings APIs and CSS.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Existing PR: `#26` on `phase-19d-dashboard-refinements`.
- Product-code baseline for this polish: `5a8793afb3ef5d518bb85f8c26605ab9b131ba32`.
- Approved design commit: `3fc60d8e6ed565d73e3beac300f00da28c7d10ee`.
- No backend production changes.
- No MongoDB schema/model/migration changes.
- No Gemini model/prompt/provider changes.
- No durable-job, polling, retry, cancellation, or idempotency changes.
- No auth/ownership/private-asset changes.
- No new `/activity` route and no new Settings telemetry endpoint.
- No API keys, credentials, auth tokens, prompts, generated content, Resume contents, Interview answers, or Learning document contents in AI diagnostics.
- Preserve the existing `/dashboard` route heading contract `Unified dashboard`.
- Preserve the Dashboard rule that normal user-facing Dashboard content does not expose token/latency/cost/raw-operation diagnostics.
- All product behavior changes follow test-first ordering. Because the GitHub connector cannot execute the local toolchain, tests are committed before implementation and executable RED/GREEN evidence is obtained on the user's Mac after the implementation head is available.

---

## File Structure

### Create

- `frontend/src/features/dashboard/dashboardScorePresentation.ts` — pure Dashboard score-to-semantic-label helper using the approved 50/75 thresholds.
- `frontend/src/features/dashboard/dashboardScorePresentation.test.ts` — exact 49/50/74/75 boundary tests.
- `frontend/src/features/auth/AiUsageDiagnosticsSettings.tsx` — self-contained Settings diagnostics region and async lifecycle.
- `frontend/src/features/auth/AiUsageDiagnosticsSettings.test.tsx` — Settings diagnostics contract tests.
- `frontend/src/features/auth/aiUsageDiagnostics.css` — diagnostics-only responsive styling.

### Modify

- `frontend/src/features/dashboard/MainDashboard.tsx` — richer continuation context and activity 5/10 request-mode state.
- `frontend/src/features/dashboard/ProgressWidgets.tsx` — semantic score labels beneath raw percentages.
- `frontend/src/features/dashboard/ActivityFeed.tsx` — recent-count chip when collapsed and all-time total when expanded.
- `frontend/src/features/dashboard/dashboardPhase19d.css` — small spacing/context-text polish only.
- `frontend/src/features/dashboard/dashboardPhase19d.test.tsx` — final Dashboard source/behavior contract.
- `frontend/src/features/dashboard/MainDashboard.test.tsx` — request limits, continuation context, activity mode transitions, stale-request behavior.
- `frontend/src/features/auth/SettingsPage.tsx` — compose the new diagnostics section.
- `frontend/src/features/auth/SettingsPage.test.tsx` — retain existing Settings hierarchy and prove diagnostics composition does not break Gemini/account/session behavior.
- `frontend/src/routing/router.test.tsx` — only if the new Settings async child requires an explicit route-level mock/expectation; do not otherwise modify routing behavior.

---

### Task 1: Dashboard semantic scores and richer continuation context

**Files:**
- Create: `frontend/src/features/dashboard/dashboardScorePresentation.ts`
- Create: `frontend/src/features/dashboard/dashboardScorePresentation.test.ts`
- Modify: `frontend/src/features/dashboard/ProgressWidgets.tsx`
- Modify: `frontend/src/features/dashboard/MainDashboard.tsx`
- Modify: `frontend/src/features/dashboard/MainDashboard.test.tsx`
- Modify: `frontend/src/features/dashboard/dashboardPhase19d.test.tsx`

**Interfaces:**
- Produces: `dashboardScorePresentation(score: number): { level: "needs-review" | "developing" | "strong"; label: "Needs review" | "Developing" | "Strong result" }`.
- Consumes: existing `DashboardProgress.resumeReadiness`, `.interviews`, and `.learning` data only.

- [ ] **Step 1: Add boundary tests for score interpretation**

Create tests that assert:

```ts
expect(dashboardScorePresentation(49).label).toBe("Needs review");
expect(dashboardScorePresentation(50).label).toBe("Developing");
expect(dashboardScorePresentation(74).label).toBe("Developing");
expect(dashboardScorePresentation(75).label).toBe("Strong result");
```

Also assert the corresponding `level` values.

- [ ] **Step 2: Extend Dashboard UI tests before implementation**

Add test fixtures/assertions proving:

```text
Continue Resume
QA Engineer
63% readiness

Continue Interview
Latest feedback 88%

Open Learning Document
Learning Test 1
Ready
```

When no owned item exists, preserve the existing Create Resume / Start Interview Session / Upload Learning Document fallbacks.

For outcome cards, assert the raw percentage remains visible and the correct semantic label appears only when a numeric score exists. Null score fixtures must continue to render purposeful empty-state copy and no semantic label.

- [ ] **Step 3: Implement the pure score helper**

Use exactly:

```ts
export function dashboardScorePresentation(score: number) {
  if (score < 50) {
    return { level: "needs-review" as const, label: "Needs review" as const };
  }
  if (score < 75) {
    return { level: "developing" as const, label: "Developing" as const };
  }
  return { level: "strong" as const, label: "Strong result" as const };
}
```

Do not import Learning UI components and do not refactor the Learning quiz helper in this phase.

- [ ] **Step 4: Enrich continuation descriptions from existing canonical data**

Use existing data only:

```ts
Resume: latest.targetRole + latest.score
Interview: latest scored trend point score when present
Learning: recentDocuments[0].title + status
```

Keep existing destination rules unchanged.

- [ ] **Step 5: Add semantic labels to the three outcome cards**

Keep percentage/value as the primary `<strong>` content. Add a small secondary semantic label with a class such as:

```text
dashboard-metric__interpretation
dashboard-metric__interpretation--needs-review
dashboard-metric__interpretation--developing
dashboard-metric__interpretation--strong
```

Do not use semantic color alone to convey meaning.

- [ ] **Step 6: Local focused RED/GREEN verification command**

Run after the implementation commit exists:

```bash
npm --prefix frontend test -- \
  src/features/dashboard/dashboardScorePresentation.test.ts \
  src/features/dashboard/dashboardPhase19d.test.tsx \
  src/features/dashboard/MainDashboard.test.tsx
```

Expected final state: all listed tests PASS.

---

### Task 2: Recent Activity summary/expanded request modes

**Files:**
- Modify: `frontend/src/features/dashboard/MainDashboard.tsx`
- Modify: `frontend/src/features/dashboard/ActivityFeed.tsx`
- Modify: `frontend/src/features/dashboard/MainDashboard.test.tsx`
- Modify: `frontend/src/features/dashboard/dashboardPhase19d.test.tsx`

**Interfaces:**
- Collapsed request: `fetchDashboardActivity({ page: 1, limit: 5 }, signal)`.
- Expanded request: `fetchDashboardActivity({ page: activityPage, limit: 10 }, signal)`.
- Existing request ID + `AbortController` pattern remains authoritative.

- [ ] **Step 1: Add tests for collapsed activity**

Assert initial request:

```ts
expect(fetchDashboardActivity).toHaveBeenCalledWith(
  { page: 1, limit: 5 },
  expect.any(AbortSignal),
);
```

Assert the collapsed chip reads `5 recent` when five events are returned, or `${events.length} recent` when fewer are returned. Assert no pager is visible.

- [ ] **Step 2: Add tests for expansion, pagination, collapse, and stale requests**

After `View all activity`:

```ts
expect(fetchDashboardActivity).toHaveBeenLastCalledWith(
  { page: 1, limit: 10 },
  expect.any(AbortSignal),
);
```

Then prove Next requests page 2 with limit 10. Collapse must reset to page 1 and request limit 5 again. Capture obsolete signals and assert they are aborted or their late responses cannot replace the newer mode/page response.

- [ ] **Step 3: Implement mode-derived activity limit**

Use one derived value:

```ts
const activityLimit = activityExpanded ? 10 : 5;
```

Include `activityExpanded` in the activity effect dependencies and use `activityLimit` in the request and fallback pagination object. `onExpand` must set page 1 before/with expansion. `onCollapse` must set page 1 and collapse.

- [ ] **Step 4: Update ActivityFeed chip semantics**

Collapsed:

```text
N recent
```

Expanded:

```text
TOTAL total
```

Do not hide the all-time total from expanded history.

- [ ] **Step 5: Local focused verification command**

```bash
npm --prefix frontend test -- \
  src/features/dashboard/dashboardPhase19d.test.tsx \
  src/features/dashboard/MainDashboard.test.tsx
```

Expected final state: all listed tests PASS.

---

### Task 3: Settings AI usage & diagnostics

**Files:**
- Create: `frontend/src/features/auth/AiUsageDiagnosticsSettings.tsx`
- Create: `frontend/src/features/auth/AiUsageDiagnosticsSettings.test.tsx`
- Create: `frontend/src/features/auth/aiUsageDiagnostics.css`
- Modify: `frontend/src/features/auth/SettingsPage.tsx`
- Modify: `frontend/src/features/auth/SettingsPage.test.tsx`

**Interfaces:**
- Calls:

```ts
fetchProgressSnapshot({
  windowDays: 30,
  trendLimit: 3,
  recentDocumentLimit: 1,
}, signal)
```

- Consumes only `DashboardProgress["aiUsage"]` from the response.
- Does not persist anything and does not write to browser storage.

- [ ] **Step 1: Add test-first canonical AI-usage fixtures**

Use a response with explicit values such as:

```ts
aiUsage: {
  requestCount: 82,
  successCount: 80,
  failureCount: 2,
  inputTokens: 60511,
  outputTokens: 36299,
  totalTokens: 96810,
  estimatedCostUsd: 1.2345,
  estimatedCostEventCount: 82,
  averageLatencyMs: 11846,
  byFeature: [
    {
      feature: "resume.analysis",
      requestCount: 12,
      successCount: 12,
      failureCount: 0,
      inputTokens: 10000,
      outputTokens: 4000,
      estimatedCostUsd: 0.2,
    },
    {
      feature: "learning.document.chat",
      requestCount: 16,
      successCount: 15,
      failureCount: 1,
      inputTokens: 12000,
      outputTokens: 7000,
      estimatedCostUsd: 0.3,
    },
  ],
  daily: [],
}
```

Assert the section calls the exact fixed 30-day bounded query above.

- [ ] **Step 2: Add tests for summary rendering and truthful cost coverage**

Assert visible summary values for requests, successful, failed, input/output/total tokens, average response time, and estimated cost.

Cost wording rules:

```text
estimatedCostEventCount === requestCount && requestCount > 0
→ "Estimated across all recorded requests. Not an invoice."

0 < estimatedCostEventCount < requestCount
→ "Estimate covers X of Y recorded requests. Not an invoice."

estimatedCostEventCount === 0
→ "No cost estimate is available for these requests."
```

For `averageLatencyMs === null`, render `Not recorded` rather than `0`.

- [ ] **Step 3: Add tests for technical disclosure**

The `<details>` element is collapsed by default. After opening, recognized mappings must show both friendly name and raw identifier:

```text
Resume analysis
resume.analysis

Learning chat
learning.document.chat
```

Use a bounded label map for known operations, including the operation names currently produced by the app where available. Unknown identifiers remain displayed as technical identifiers with a generic friendly label such as `Other AI operation`; never evaluate or inject identifier content as markup.

- [ ] **Step 4: Add tests for loading, empty, error, retry, Request ID, and abort**

Loading uses `role="status"`.

When `requestCount === 0`, show:

```text
No AI usage recorded in the last 30 days
```

For `ApiError`, render the safe message plus `Request ID: ...` when present and a `Retry AI usage` button. Retry must call only the diagnostics request again. Unmount must abort the in-flight request.

- [ ] **Step 5: Implement `AiUsageDiagnosticsSettingsSection`**

Use internal component state:

```ts
type DisplayError = { message: string; requestId?: string };
const [usage, setUsage] = useState<DashboardProgress["aiUsage"]>();
const [loading, setLoading] = useState(true);
const [error, setError] = useState<DisplayError>();
const [retryVersion, setRetryVersion] = useState(0);
```

Use an `AbortController` in `useEffect`; clear only diagnostics state. Do not affect Gemini connection/account/session rendering.

Format latency so values >= 1000 ms are presented in seconds with one decimal place, e.g. `11.8 s`; otherwise display rounded milliseconds. Format cost with a bounded USD precision suitable for small estimates, but always retain the estimate disclaimer.

- [ ] **Step 6: Compose the section in Settings**

`SettingsPage.tsx` imports and renders:

```tsx
<AiUsageDiagnosticsSettingsSection />
```

Place it immediately after `GeminiConnectionSettingsSection` so the page order is:

```text
Gemini connection
AI usage & diagnostics
Account information
Current session
```

Update the Settings description to include AI usage only if needed for clarity; keep the existing `Account, AI, and session` information architecture.

- [ ] **Step 7: Add responsive diagnostics CSS**

Use existing `.settings-panel` visual language. Add only diagnostics-specific classes for a compact summary grid, cost note, and technical rows. At narrow widths, stack summary items and technical rows without horizontal scrolling. Use `<code>` styling for raw operation identifiers.

- [ ] **Step 8: Local focused verification command**

```bash
npm --prefix frontend test -- \
  src/features/auth/AiUsageDiagnosticsSettings.test.tsx \
  src/features/auth/SettingsPage.test.tsx \
  src/features/dashboard/dashboardApi.test.ts
```

Expected final state: all listed tests PASS.

---

### Task 4: Final Dashboard/Settings integration and qualification

**Files:**
- Modify: `frontend/src/features/dashboard/dashboardPhase19d.css`
- Modify tests only as required by actual integration findings; do not broaden scope.
- Modify PR #26 body after fresh qualification evidence is available.

**Interfaces:**
- No new application interfaces.
- Final exact commit SHA becomes the only merge candidate after fresh local qualification.

- [ ] **Step 1: Apply minor Dashboard spacing polish**

Limit CSS changes to richer Continue-card copy, metric interpretation spacing, and compact section rhythm. Do not alter global shell/sidebar architecture, primary palette, section order, or page width.

- [ ] **Step 2: Run focused Dashboard + Settings + router tests**

```bash
npm --prefix frontend test -- \
  src/features/dashboard/dashboardScorePresentation.test.ts \
  src/features/dashboard/dashboardPhase19d.test.tsx \
  src/features/dashboard/MainDashboard.test.tsx \
  src/features/auth/AiUsageDiagnosticsSettings.test.tsx \
  src/features/auth/SettingsPage.test.tsx \
  src/routing/router.test.tsx
```

Expected: all test files PASS.

- [ ] **Step 3: Run frontend typecheck**

```bash
npm --prefix frontend run typecheck
```

Expected exit code: `0`.

- [ ] **Step 4: Run frontend production build**

```bash
npm --prefix frontend run build
```

Expected exit code: `0`. Existing non-failing Vite/react-router, mixed import, and bundle-size warnings do not block qualification if unchanged.

- [ ] **Step 5: Run full frontend regression**

```bash
npm --prefix frontend test
```

Expected: all test files and tests PASS. Do not predict exact counts before the new test files are present.

- [ ] **Step 6: Run diff check**

```bash
git diff --check origin/main...HEAD
```

Expected exit code: `0`.

- [ ] **Step 7: Browser QA — Dashboard desktop and narrow widths**

Verify:

```text
Continue Resume shows role + readiness context and opens the correct Resume.
Continue Interview shows latest feedback context and opens the intended Interview/session route.
Open Learning Document shows title + status and opens the correct document.
Outcome cards retain raw scores and add correct semantic interpretation.
Dashboard itself still exposes no tokens, latency, cost, or raw AI operation identifiers.
Collapsed Recent Activity shows at most 5 events and an N recent chip.
View all activity reloads page 1 at 10 events/page and exposes pagination.
Next/Previous use 10 events/page.
Collapse returns to the 5-event summary.
No horizontal overflow at narrow/mobile width.
```

- [ ] **Step 8: Browser QA — Settings diagnostics**

Verify:

```text
AI usage & diagnostics appears directly after Gemini connection.
30-day summary values match the account's existing telemetry.
Latency/cost wording is understandable and explicitly estimated.
Technical details are collapsed by default.
Opening technical details shows friendly feature names plus raw operation identifiers.
No credentials, API keys, prompts, user content, or private payloads appear.
Settings remains usable if diagnostics fail.
Narrow/mobile layout remains readable without horizontal overflow.
```

- [ ] **Step 9: Pin the exact final PR head**

After all local/browser evidence is green, re-fetch PR #26 and confirm:

```text
state: OPEN
draft: true
merged: false
head SHA: exact locally qualified SHA
base: main
```

Update the PR body with the exact fresh qualification evidence. Do not merge, deploy, or delete the branch.

---

## Execution Notes for This GitHub-Only Workflow

The user does not use Codex for Career Learning Hub implementation. ChatGPT performs repository changes through the GitHub connector; the user pulls the exact branch head to the local Mac and supplies executable test/build/browser evidence.

Therefore implementation execution will use this sequence:

```text
Approved plan
→ test-first GitHub commit(s)
→ minimal product implementation commit(s)
→ static diff review through GitHub
→ user pulls exact head
→ focused tests/typecheck/build/full regression/diff-check
→ same-branch repair if anything fails
→ browser QA
→ exact-head pin
→ separate explicit merge approval
```

No merge, deployment, or branch deletion is authorized by approval of this implementation plan.

## Self-Review

- Spec coverage: all seven design areas are mapped to Tasks 1–4.
- Security/privacy: no credential/content exposure and no new persistence/API surface.
- Type consistency: Dashboard uses existing `DashboardProgress`; Settings consumes only `DashboardProgress["aiUsage"]`.
- Activity semantics: collapsed 5, expanded 10, page reset and stale-request protection are explicit.
- Score thresholds: exact 49/50/74/75 boundaries are test-pinned.
- No placeholders/TODOs remain.
- No backend or schema work is required.
