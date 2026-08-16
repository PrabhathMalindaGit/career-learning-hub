# Phase 19D Dashboard + Settings Polish Design

## Status

Approved direction from the user on 2026-08-16 for the existing `phase-19d-dashboard-refinements` branch and draft PR #26.

## Goal

Polish the already-refined Dashboard without redesigning it again, and relocate detailed AI usage/diagnostic information from the main Dashboard into Settings where the user explicitly expects account/AI/system information.

## Controlling constraint

Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

## Baseline

Product-code baseline for this polish pass:

`phase-19d-dashboard-refinements @ 5a8793afb3ef5d518bb85f8c26605ab9b131ba32`

This exact head already passed focused Dashboard/router tests, frontend typecheck, frontend production build, the full frontend regression suite, and `git diff --check` on the user's Mac. The polish pass invalidates that head as the final merge candidate and requires fresh qualification afterward.

## Scope

### 1. Enrich Continue your work cards

Keep the current three-card Continue your work composition and existing destination rules. Add concise context from data already present in `DashboardProgress`:

- Resume: show the target role and latest readiness score when a Resume analysis exists.
- Interview: show the latest scored feedback percentage when a recent scored attempt exists; active-session fallback remains a generic continuation action because the Dashboard summary does not expose an exact active session ID.
- Learning: show the recent document title and its current status.
- Empty categories continue to use the existing Create Resume / Start Interview Session / Upload Learning Document fallbacks.

No recommendation engine and no backend expansion.

### 2. Add semantic score interpretation

The three top outcome cards remain Resume performance, Interview feedback, and Quiz performance. When a numeric score exists, add a small interpretation using the same score thresholds already used by Learning quiz result presentation:

- `< 50`: `Needs review`
- `50–74.999…`: `Developing`
- `>= 75`: `Strong result`

The raw score remains primary. Semantic text is secondary and must not replace the factual percentage or turn the cards into traffic-light-only UI.

Null scores keep purposeful empty-state text and must not receive a performance label.

### 3. Improve Recent Activity disclosure

Keep the collapsed Dashboard summary at 5 recent events.

Collapsed state:

- header chip shows `5 recent` (or the actual returned count when fewer than 5 are available), not the all-time total;
- no pager is shown;
- `View all activity` remains the disclosure action.

Expanded state:

- fetch 10 events per page;
- header may show the true all-time total;
- existing Previous/Next pagination remains authoritative;
- collapsing returns to page 1 and the 5-event summary request.

Changing between collapsed and expanded modes must abort/replace obsolete requests using the existing request-identity pattern.

No new `/activity` route and no new activity API.

### 4. Minor Dashboard spacing polish

Keep the current Phase 19D visual architecture. Only make small spacing adjustments where they improve rhythm after the richer card copy. Do not alter the sidebar, global shell, page-width architecture, primary colors, or overall section order.

### 5. Add AI usage & diagnostics to Settings

The current Settings information architecture is already `Account, AI, and session`. Add a new bounded section named `AI usage & diagnostics`.

The section reuses the existing authenticated `fetchProgressSnapshot` Dashboard API with a fixed 30-day window. It does not add a backend route. Use the minimum existing bounded list values needed by that API (`trendLimit: 3`, `recentDocumentLimit: 1`) and consume only `progress.aiUsage` in the Settings UI.

The primary Settings summary shows:

- period: last 30 days;
- requests;
- successful requests;
- failed requests;
- input tokens;
- output tokens;
- total tokens;
- average response time, derived from `averageLatencyMs` with a user-friendly seconds display where appropriate;
- estimated usage cost;
- cost-coverage note based on `estimatedCostEventCount` versus `requestCount` so the estimate is not presented as an invoice or as complete when it is partial.

### 6. Technical details disclosure

Inside `AI usage & diagnostics`, use a native accessible `<details>` disclosure labelled `Show technical details` / standard summary wording.

The expanded technical details show feature-level rows from `aiUsage.byFeature` with:

- a user-facing feature label where the identifier is recognized;
- the raw operation identifier in secondary code styling;
- request count;
- input/output token counts;
- estimated cost.

Known identifiers should map to user-facing names without changing the raw backend value. Unknown identifiers remain visible as safe technical identifiers because this disclosure is intentionally diagnostic.

No API keys, credential values, auth tokens, prompts, user content, or private model payloads are displayed.

### 7. Loading, empty, and error behavior in Settings

The Settings diagnostics section owns its own async state so Gemini connection/account/session content remains usable if telemetry fails.

- Loading: compact status surface or equivalent bounded loading text.
- Empty usage: factual `No AI usage recorded in the last 30 days` state with zero values not fabricated.
- Error: safe API message and Request ID when present, plus Retry.
- Retry affects only AI diagnostics.
- Abort the request on unmount.

## Architecture

### Existing code reused

- `frontend/src/features/dashboard/dashboardApi.ts`
  - `fetchProgressSnapshot(...)`
  - existing validation of `DashboardProgress.aiUsage`
- `frontend/src/features/dashboard/types.ts`
  - `DashboardProgress["aiUsage"]`
- `frontend/src/features/dashboard/MainDashboard.tsx`
  - existing independent request identity/abort pattern
- `frontend/src/features/dashboard/ActivityFeed.tsx`
  - existing safe activity label map and pager
- `frontend/src/features/auth/SettingsPage.tsx`
  - existing Settings layout
- existing global `.settings-panel` styles

### New focused Settings unit

Create:

- `frontend/src/features/auth/AiUsageDiagnosticsSettings.tsx`
- `frontend/src/features/auth/AiUsageDiagnosticsSettings.test.tsx`
- `frontend/src/features/auth/aiUsageDiagnostics.css`

`SettingsPage.tsx` only composes this new section; it does not own telemetry-fetching logic.

### Dashboard files changed

- `frontend/src/features/dashboard/MainDashboard.tsx`
- `frontend/src/features/dashboard/ProgressWidgets.tsx`
- `frontend/src/features/dashboard/ActivityFeed.tsx`
- `frontend/src/features/dashboard/dashboardPhase19d.css`
- Dashboard tests as required

No backend, MongoDB, provider, Gemini prompt/model, job worker, auth, ownership, or routing changes.

## Data flow

### Dashboard

`fetchProgressSnapshot(window)` -> existing `DashboardProgress` -> richer Continue cards + semantic metric labels.

Collapsed activity -> `fetchDashboardActivity({ page: 1, limit: 5 })`.

Expanded activity -> `fetchDashboardActivity({ page, limit: 10 })`.

### Settings

`SettingsPage` -> `AiUsageDiagnosticsSettingsSection` -> `fetchProgressSnapshot({ windowDays: 30, trendLimit: 3, recentDocumentLimit: 1 })` -> consume `aiUsage` only -> summary + optional technical disclosure.

## Security and privacy boundaries

- Existing authenticated/user-scoped Dashboard progress endpoint remains authoritative.
- No credentials or credential metadata are added to diagnostics.
- No prompts, generated content, Resume data, Interview answers, Learning document content, or raw user data are shown in AI diagnostics.
- No provider expansion.
- No new telemetry persistence.
- No new browser storage.
- No new route or API endpoint.

## Accessibility

- Existing score percentages remain textual; semantic labels are supplementary.
- `View all activity` / collapse controls remain native buttons.
- Technical details use native `<details>/<summary>`.
- Settings loading/error states use existing accessible status/alert conventions.
- Focus behavior is not changed globally.
- Responsive layout must remain usable at narrow/mobile widths without horizontal scrolling.

## Testing requirements

Use TDD for product behavior changes.

Dashboard tests must cover:

- enriched Resume/Interview/Learning continuation context;
- semantic score thresholds including 49/50/74/75 boundaries;
- collapsed activity requests 5 and displays recent-count chip;
- expansion resets/fetches page 1 with limit 10;
- paging while expanded keeps limit 10;
- collapse returns to page 1 and limit 5;
- stale activity requests are aborted/ignored across mode changes;
- existing no-AI-diagnostics Dashboard contract remains true.

Settings tests must cover:

- `AI usage & diagnostics` region appears in Settings;
- fixed 30-day bounded progress request;
- request/success/failure/token/latency/cost values render from canonical response;
- full/partial/no cost-estimate wording is truthful;
- technical details are collapsed by default and expose user label + raw identifier when opened;
- unknown feature identifiers are handled safely;
- loading/empty/error/retry behavior;
- Request ID appears only on error evidence;
- unmount aborts the telemetry request;
- existing Gemini/account/session tests remain valid.

## Qualification after implementation

Because product code will change from the previously qualified head, run fresh qualification at the new exact head:

1. focused Dashboard + Settings + router tests;
2. frontend typecheck;
3. frontend production build;
4. full frontend regression;
5. `git diff --check origin/main...HEAD`;
6. browser QA for Dashboard desktop/narrow layouts;
7. browser QA for Settings AI usage summary + technical disclosure;
8. verify Dashboard still contains no token/latency/cost/raw-operation diagnostics;
9. pin exact PR head before separate merge approval.

## Explicit non-goals

- no new backend endpoint solely for Settings telemetry;
- no telemetry export/download;
- no charts for token/cost history;
- no billing system or invoice semantics;
- no provider-management redesign;
- no Dashboard redesign;
- no new Activity page;
- no database changes;
- no AI/model/provider/job changes.
