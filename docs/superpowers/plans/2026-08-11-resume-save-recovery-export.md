# Phase 19A-3 — Resume Save, Recovery & Export Workflow Implementation Plan

**Feature:** Phase 19A-3 — Resume Save, Recovery & Export Workflow.

**Goal:** Add bounded, tab-scoped recovery for meaningful unsaved Resume
content; make canonical save state and keyboard saving explicit and truthful;
and refine the existing native browser print workflow without changing the
server-authoritative immutable ResumeVersion architecture.

**Architecture:** Keep the current Resume workspace response and immutable
ResumeVersion as the only canonical content authority. Add one strict local
recovery contract and storage helper, one independently testable debounced
writer/controller, and one focused read-only stale-review component. Integrate
those boundaries surgically into the existing ResumeWorkspace, AuthProvider,
route blocker, Dialog, print controls, and print helper. Recovery uses one
versioned `sessionStorage` entry per authenticated user and Resume; it never
becomes a second save system.

**Tech stack:** React 19, React Router 7, TypeScript 5.8, Vite 6, Vitest 4,
Testing Library, native `sessionStorage`, native `pagehide`, native
`window.print()`, and the existing Express/Mongoose Resume API as an unchanged
read-only contract.

**Design-spec authority:**
`docs/superpowers/specs/2026-08-11-resume-save-recovery-export-design.md` is
`APPROVED / HUMAN-APPROVED / FROZEN`. Its accepted authority token is
`PHASE_19A3_RESUME_SAVE_RECOVERY_EXPORT_DESIGN_APPROVED`.

**TDD:** Implementation must follow the task-local RED → GREEN → focused
regression sequence below. Do not write a production change before its named
test has failed for the expected missing behavior.

**Manual Git policy:** Git publication steps are intentionally omitted because
the operator controls Git manually. Each task ends with a verification
checkpoint instead of a publication step.

## Global constraints

- Phase 19A-3 implementation remains inactive until the operator accepts
  `PHASE_19A3_IMPLEMENTATION_PLAN_APPROVED` in a later task.
- Preserve the existing authenticated API client, server response parsers,
  immutable ResumeVersion append flow, ownership checks,
  `expectedCurrentVersionId` conflict guard, request IDs, and safe errors.
- The four canonical save states are exactly `SAVED`, `DIRTY`, `SAVING`, and
  `SAVE_FAILED`, shown respectively as `Version N saved`, `Unsaved changes`,
  `Saving…`, and `Save failed`.
- Recovery workspace classifications are distinct from canonical save state:
  `INVALID`, `CLEAN / OBSOLETE`, `RECOVERY AVAILABLE`,
  `STALE / CONFLICTED RECOVERY`, and `STALE RECOVERY REVIEW`.
- Recovery writes only canonical unsaved Resume content. The source model calls
  that representation `ResumeContentInput`: unlike the server-returned
  `ResumeContent`, it permits missing IDs for newly entered rows and excludes
  every `ResumeDraft.clientKey`. This is the existing-project representation
  of the specification's “canonical ResumeContent draft,” not a design change.
- Recovery structural validation remains weaker than
  `validateResumeDraft()` save readiness while remaining closed-shape,
  bounded, non-coercing, and whole-payload.
- Use an approximately 500 ms debounce, 24-hour expiry, and the approved
  five-minute future-clock-skew allowance.
- Do not add backend drafts, endpoints, database fields, autosave,
  `localStorage`, IndexedDB, cookies, a storage index, a worker, a tombstone,
  a diff/merge engine, a PDF engine, AI behavior, or a dependency.
- Do not store or log tokens, credentials, Resume content, recovery content,
  prompts, AI responses, or other candidate data.
- Gemini remains direct-only on fixed `gemini-3.6-flash`, but Phase 19A-3
  makes no Gemini request.
- Candidate Photo remains Phase 19A-4 and is excluded.
- Browser automation is outside this plan. Human Chrome QA begins only after
  implementation and automated verification receive separate authorization.
- Apply the repository's three-attempt rule to one repeated root failure.

## Source-grounded file map

### CREATE

| File | Responsibility |
| --- | --- |
| `frontend/src/features/resumes/resumeRecovery.ts` | Recovery constants, exact key/prefix construction, strict envelope parsing, canonical-content classification, exact verified removal, obsolete-entry retry protection, and bounded outgoing-user prefix cleanup. |
| `frontend/src/features/resumes/resumeRecovery.test.ts` | Pure trust-boundary, identity, expiry, classification, and cleanup tests. |
| `frontend/src/features/resumes/resumeRecoveryWriter.ts` | One per-workspace 500 ms latest-draft writer/controller, generation invalidation, best-effort flush, failure-episode signaling, and in-memory outgoing-user writer registry. |
| `frontend/src/features/resumes/resumeRecoveryWriter.test.ts` | Fake-timer debounce, latest-wins, race, flush, failure, and invalidation tests. |
| `frontend/src/features/resumes/ResumeRecoveryReview.tsx` | Accessible, single-column, selectable, read-only stale recovery review using the existing ResumePreview. |
| `frontend/src/features/resumes/ResumeRecoveryReview.test.tsx` | Stale warning, version context, read-only/selectable content, action, and no-save/export assertions. |

### MODIFY

| File | Responsibility |
| --- | --- |
| `frontend/src/features/resumes/resumeDraft.ts` | Convert strict recoverable `ResumeContentInput` back to a `ResumeDraft` without persisting client keys and expose the same normalized fingerprint semantics used by dirty state. |
| `frontend/src/features/resumes/resumeDraft.test.ts` | Prove optional persisted IDs, generated client identity, no content loss, and fingerprint equivalence. |
| `frontend/src/features/resumes/resumeContracts.ts` | Reuse the existing bounded parsing primitives to expose a strict recovery-content parser that allows incomplete values without weakening canonical server-response parsing. |
| `frontend/src/features/resumes/resumeContracts.test.ts` | Distinguish structurally safe incomplete input from save-invalid and malformed input while retaining canonical parser regressions. |
| `frontend/src/features/resumes/ResumeWorkspace.tsx` | Canonical save-state derivation, guarded save operation, shortcut, recovery lookup/gates, writer lifecycle, cleanup policies, navigation discard, account identity safety, and export-readiness orchestration. |
| `frontend/src/features/resumes/ResumeWorkspace.test.tsx` | Integrated save, shortcut, recovery, navigation, account-visibility, print-source, focus, and status behavior. |
| `frontend/src/features/resumes/ResumePrintControls.tsx` | Compact source/readiness/page-size/browser guidance/suggested-filename presentation with deterministic blockers. |
| `frontend/src/features/resumes/ResumePrintControls.test.tsx` | Export state matrix, accessible blocker association, source labels, page sizes, and filename hint. |
| `frontend/src/features/resumes/resumePrint.ts` | Retain guarded native print/title cleanup and expose the `.pdf` suggested filename derived from the existing bounded title slug. |
| `frontend/src/features/resumes/resumePrint.test.ts` | Current/historical names, fallback, bounds, duplicate prevention, cancellation/failure cleanup, and title restoration. |
| `frontend/src/features/resumes/resumeWorkspace.css` | Secondary save status, compact recovery/readiness surfaces, stale-review layout, failure emphasis, wrapping, narrow-screen, reduced-motion, and print exclusions. |
| `frontend/src/features/auth/AuthProvider.tsx` | Invoke best-effort outgoing-user v1 recovery cleanup on explicit logout and genuine known user-ID transition without changing auth authority. |
| `frontend/src/features/auth/AuthProvider.test.tsx` | Logout, identity-transition, same-user refresh, temporary anonymous transition, and cleanup-failure auth behavior. |
| `docs/planning/CURRENT_PHASE.md` | Planning governance only: plan written and awaiting human approval while implementation remains inactive. |
| `docs/superpowers/plans/2026-08-11-resume-save-recovery-export.md` | This source-grounded implementation plan. |

### TEST

The six newly created or modified focused test surfaces are
`resumeRecovery.test.ts`, `resumeRecoveryWriter.test.ts`,
`ResumeRecoveryReview.test.tsx`, `resumeDraft.test.ts`,
`resumeContracts.test.ts`, and `ResumeWorkspace.test.tsx`. Existing print and
auth tests are also extended in place. No backend or browser test file changes
are planned.

### READ-ONLY / REUSED

| File | Reused boundary |
| --- | --- |
| `frontend/src/components/Dialog.tsx` and `Dialog.test.tsx` | Native accessible modal, focus containment/return, and caller-owned Escape/backdrop policy. |
| `frontend/src/features/resumes/ResumeEditor.tsx` | Existing draft editor, disabled state, validation reveal, and focus contract. |
| `frontend/src/features/resumes/ResumePreview.tsx` | Current, historical, print-only, and stale-review rendering. |
| `frontend/src/features/resumes/ResumeVersionTimeline.tsx` | Immutable history metadata and selection; parent gates interaction. |
| `frontend/src/features/resumes/ResumeDesignControls.tsx` | Independently persisted Resume-level design settings; parent recovery gate blocks access. |
| `frontend/src/features/resumes/resumeApi.ts` | The sole authenticated Resume API path; no endpoint or payload change. |
| `frontend/src/features/resumes/types.ts` | Existing `ResumeContent`, `ResumeContentInput`, `ResumeDraft`, design, workspace, and version contracts. |
| `frontend/src/routing/router.tsx`, `frontend/src/features/auth/AuthRoute.tsx`, and `frontend/src/AppShell.tsx` | Existing protected route ownership and logout invocation. |
| `backend/src/modules/resumes/resume.controller.ts`, `resume.service.ts`, `resume.validation.ts`, and `resumeVersion.model.ts` | Existing owner-scoped immutable version creation, transaction, validation, and 409 conflict behavior. |
| `packages/shared-types/src/index.ts` | Existing public authenticated-user contract. |
| Root/frontend package manifests and lockfiles | No dependency or script change. |

## Source-backed assumptions and test harness adaptations

- The current backend guarantees every usable Resume workspace has an atomic
  Version 1, and `ResumeWorkspaceData.version` is mandatory. The export model
  still handles “no canonical version” defensively at its presentation boundary,
  but no backend change is planned to manufacture that state.
- No authorized Resume-deletion action exists in the inspected frontend/API.
  Therefore Phase 19A-3 adds no delete UI or endpoint. The exact-key deletion
  hook required by the design remains a future caller responsibility if an
  authorized Resume deletion flow is introduced later.
- `ResumeWorkspace.test.tsx` currently renders the route without AuthProvider.
  Extend its existing module-mock harness so `useAuth()` returns one synthetic
  authenticated user; vary that synthetic ID only in account-boundary cases.
  Never bootstrap real authentication in Resume unit tests.
- Pure storage tests inject a `Storage` test double. Workspace integration tests
  use jsdom `sessionStorage`, remove only the keys they create during teardown,
  restore fake timers after each case, and never depend on execution order.
- Existing `ResumePreview` text is naturally selectable and current Dialog
  already supports `canDismissOnEscape={false}` with non-dismissible backdrop
  defaults. Reuse those capabilities instead of modifying the components.
- Existing `createResumePrintTitle()` intentionally returns a title slug without
  `.pdf`; the new suggested-filename helper appends the display extension while
  preserving current document-title behavior and cleanup.

## Shared implementation contracts

Use these names consistently. Keep recovery-only types local to the Resume
feature rather than expanding shared server contracts.

```ts
export const RESUME_RECOVERY_SCHEMA_VERSION = 1 as const;
export const RESUME_RECOVERY_DEBOUNCE_MS = 500;
export const RESUME_RECOVERY_MAX_AGE_MS = 24 * 60 * 60 * 1_000;
export const RESUME_RECOVERY_FUTURE_SKEW_MS = 5 * 60 * 1_000;
export const RESUME_RECOVERY_NAMESPACE =
  "career-learning-hub:resume-recovery:v1:";

export type CanonicalSaveState =
  | "SAVED"
  | "DIRTY"
  | "SAVING"
  | "SAVE_FAILED";

export interface ResumeRecoveryEnvelope {
  schemaVersion: 1;
  userId: string;
  resumeId: string;
  baselineVersionId: string;
  baselineVersionNumber: number;
  content: ResumeContentInput;
  writtenAt: number;
}

export type ResumeRecoveryClassification =
  | { kind: "INVALID" }
  | { kind: "CLEAN_OBSOLETE"; payload: ResumeRecoveryEnvelope }
  | { kind: "RECOVERY_AVAILABLE"; payload: ResumeRecoveryEnvelope }
  | {
      kind: "STALE_CONFLICTED_RECOVERY";
      payload: ResumeRecoveryEnvelope;
    };

export type RecoveryWorkspaceGate =
  | { kind: "RECOVERY_AVAILABLE"; payload: ResumeRecoveryEnvelope }
  | {
      kind: "STALE_CONFLICTED_RECOVERY";
      payload: ResumeRecoveryEnvelope;
    }
  | {
      kind: "STALE_RECOVERY_REVIEW";
      payload: ResumeRecoveryEnvelope;
    };
```

Exact key construction uses encoded non-secret identifiers so delimiters
cannot become ambiguous:

```ts
export function createResumeRecoveryKey(
  userId: string,
  resumeId: string,
): string {
  return `${RESUME_RECOVERY_NAMESPACE}${encodeURIComponent(userId)}:${encodeURIComponent(resumeId)}`;
}

export function createResumeRecoveryUserPrefix(userId: string): string {
  return `${RESUME_RECOVERY_NAMESPACE}${encodeURIComponent(userId)}:`;
}
```

The mutable writer API remains separate from parsing and storage
classification:

```ts
export interface ResumeRecoveryWriteCandidate {
  fingerprint: string; // runtime-only; never serialized
  payload: Omit<ResumeRecoveryEnvelope, "writtenAt">;
}

export interface ResumeRecoveryWriter {
  schedule(candidate: ResumeRecoveryWriteCandidate): void;
  cancelPending(): void;
  flush(options?: { reportFailure?: boolean }): boolean;
  dispose(): void;
}
```

`cancelPending()` increments an in-memory generation and clears the scheduled
callback but does not permanently disable future legitimate edits. `dispose()`
also unregisters the writer. A successful write marks that exact candidate as
persisted so a later navigation-only `pagehide` cannot refresh `writtenAt`.

---

### Task 1: Recoverable canonical content conversion and structural contract

**Files:**

- Modify: `frontend/src/features/resumes/resumeDraft.ts`
- Modify: `frontend/src/features/resumes/resumeDraft.test.ts`
- Modify: `frontend/src/features/resumes/resumeContracts.ts`
- Modify: `frontend/src/features/resumes/resumeContracts.test.ts`

**Behavior introduced:** Reconstruct a `ResumeDraft` from canonical unsaved
`ResumeContentInput`, assigning client keys only in memory, and parse that
content with exact keys/types/bounds while allowing temporary save-invalid
values and optional IDs.

**RED — write these tests first:**

- `resumeContentInputToDraft preserves existing IDs and creates only client keys for unsaved rows`
- `recovery round-trip excludes client keys and keeps incomplete Experience and Education values`
- `recovery fingerprints use the existing normalized draft comparison`
- `parseResumeRecoveryContent accepts bounded incomplete canonical input`
- `parseResumeRecoveryContent rejects unknown top-level and nested keys without stripping`
- `parseResumeRecoveryContent rejects wrong primitives, arrays, nesting, IDs, and oversized values without coercion`
- `parseResumeContent remains strict for canonical server responses`

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeDraft.test.ts src/features/resumes/resumeContracts.test.ts
```

Expected RED: the recovery conversion and structural parser exports do not yet
exist; canonical response tests continue to show the current stricter behavior.

**GREEN — minimal production change:**

Refactor the current `loaded()` conversion into an optional-ID-safe helper and
keep the existing canonical entry point:

```ts
export function resumeContentInputToDraft(
  content: ResumeContentInput,
): ResumeDraft;

export function resumeContentToDraft(
  content: ResumeContent,
): ResumeDraft {
  return resumeContentInputToDraft(content);
}
```

In `resumeContracts.ts`, reuse `exactKeys`, `array`, `text`, `boolean`, and UUID
checks with a recovery policy that changes only business minima/URL/email
syntax and ID presence. It must return `ResumeContentInput`, require all
supported collections, allow optional IDs, allow empty or mid-edit bounded
strings, and reject the entire value on any unknown key/type/shape. Do not
alter `parseResumeContent()` semantics.

Run GREEN:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeDraft.test.ts src/features/resumes/resumeContracts.test.ts
```

Expected GREEN: both focused files pass; canonical response validation still
rejects incomplete server content while recovery structural parsing accepts it.

**Focused regression checkpoint:**

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeEditor.test.tsx src/features/resumes/ResumePreview.test.tsx src/features/resumes/resumeApi.test.ts
```

---

### Task 2: Recovery envelope, key, validation, classification, and cleanup helpers

**Files:**

- Create: `frontend/src/features/resumes/resumeRecovery.ts`
- Create: `frontend/src/features/resumes/resumeRecovery.test.ts`
- Reuse: `frontend/src/features/resumes/resumeContracts.ts`
- Reuse: `frontend/src/features/resumes/resumeDraft.ts`

**Behavior introduced:** One deterministic v1 key per user/Resume, an exact
minimal envelope, guarded JSON parsing, identity and timestamp validation,
canonical-equivalence-first classification, exact verified removal, safe
obsolete retry, and collect-then-remove outgoing-user cleanup.

**RED — representative tests/assertions:**

- `creates exact encoded keys and exact outgoing-user prefixes`
- `accepts only the seven-field schemaVersion 1 envelope`
- `rejects malformed JSON, extra envelope fields, unknown schemas, mismatched user or Resume, invalid baseline metadata, and malformed content`
- `expires after 24 hours and rejects timestamps more than five minutes in the future`
- `accepts the five-minute future skew boundary`
- `classifies identical content as CLEAN_OBSOLETE before comparing baseline IDs`
- `classifies different content with the current ID as RECOVERY_AVAILABLE`
- `classifies different content with an older ID as STALE_CONFLICTED_RECOVERY`
- `baselineVersionNumber never authorizes classification`
- `reading, prompting, and classifying never call setItem or refresh writtenAt`
- `verified exact removal succeeds only when getItem confirms absence`
- `obsolete cleanup retry never deletes a newer-baseline payload at the same key`
- `outgoing-user cleanup collects keys first, touches only the exact v1 prefix, preserves other users, v2, and unrelated keys, and never clears all storage`

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeRecovery.test.ts
```

Expected RED: the new module is absent.

**GREEN — minimal production change:**

Implement explicit result types rather than exposing storage exceptions:

```ts
export type ResumeRecoveryReadResult =
  | { kind: "NONE" }
  | { kind: "INVALID" }
  | { kind: "VALID"; payload: ResumeRecoveryEnvelope };

export function readResumeRecovery(input: {
  storage: Storage;
  userId: string;
  resumeId: string;
  now: number;
}): ResumeRecoveryReadResult;

export function classifyResumeRecovery(input: {
  payload: ResumeRecoveryEnvelope;
  canonicalVersionId: string;
  canonicalFingerprint: string;
}): Exclude<ResumeRecoveryClassification, { kind: "INVALID" }>;

export function removeResumeRecoveryExact(
  storage: Storage,
  key: string,
): boolean;

export function removeObsoleteResumeRecovery(input: {
  storage: Storage;
  key: string;
  obsoleteBaselineVersionId: string;
}): boolean;

export function removeResumeRecoveriesForUser(
  storage: Storage,
  userId: string,
): { removed: number; failed: boolean };
```

`readResumeRecovery()` must attempt best-effort removal for invalid/expired
data but return `INVALID` even when removal fails. It never returns raw content
or an exception in a notice/log. `classifyResumeRecovery()` compares the
recovered fingerprint produced through the Task 1 draft conversion with the
workspace's existing baseline fingerprint before comparing version IDs.

Run GREEN:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeRecovery.test.ts
```

**Focused regression checkpoint:**

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeContracts.test.ts src/features/resumes/resumeDraft.test.ts
```

---

### Task 3: Debounced latest-draft writer and race invalidation

**Files:**

- Create: `frontend/src/features/resumes/resumeRecoveryWriter.ts`
- Create: `frontend/src/features/resumes/resumeRecoveryWriter.test.ts`
- Reuse: `frontend/src/features/resumes/resumeRecovery.ts`

**Behavior introduced:** Deterministic fake-timer-friendly writes after 500 ms,
latest candidate wins, no history accumulation, generation checks for stale
callbacks, a synchronous best-effort flush only for unpersisted eligible
content, and per-user in-memory invalidation.

**RED — representative tests/assertions:**

- `rapid edits collapse into one write after 500 milliseconds`
- `the timer reads the latest candidate instead of a captured older draft`
- `a successful write stores one envelope and sets writtenAt from the actual write time`
- `a successful debounce leaves no pending pagehide write and does not refresh expiry on navigation`
- `flush writes the latest still-pending candidate synchronously`
- `cancelPending prevents an old timer and lifecycle flush from recreating discarded data`
- `a future schedule after cancellation uses a new generation normally`
- `dispose unregisters and prevents route-switch callbacks without deleting storage`
- `outgoing-user invalidation cancels every matching writer but not another user`
- `failed serialization or setItem reports one failed result without throwing`
- `a later successful legitimate write reports recovery availability again`
- `successful save, explicit discard, Resume switch, and outgoing-user invalidation reset only the relevant failure episode`

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeRecoveryWriter.test.ts
```

Expected RED: the controller module is absent.

**GREEN — minimal production change:**

```ts
export function createResumeRecoveryWriter(input: {
  storage: Storage;
  userId: string;
  resumeId: string;
  now?: () => number;
  delayMs?: number;
  onWriteResult(result: "success" | "failure"): void;
}): ResumeRecoveryWriter;

export function invalidateResumeRecoveryWritersForUser(
  userId: string,
): void;
```

Maintain only `latestCandidate`, `pendingFingerprint`, `persistedFingerprint`,
`timer`, and `generation`. Serialize a fresh envelope inside the executing
callback. Advance `writtenAt` only inside that attempted legitimate write.
After success, clear pending work; after failure, retain the latest candidate
for a later meaningful retry. Never retry on an interval.

Run GREEN:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeRecoveryWriter.test.ts
```

**Focused regression checkpoint:**

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeRecovery.test.ts src/features/resumes/resumeRecoveryWriter.test.ts
```

---

### Task 4: Outgoing-user cleanup at the authentication boundary

**Files:**

- Modify: `frontend/src/features/auth/AuthProvider.tsx`
- Modify: `frontend/src/features/auth/AuthProvider.test.tsx`
- Reuse: `frontend/src/features/resumes/resumeRecovery.ts`
- Reuse: `frontend/src/features/resumes/resumeRecoveryWriter.ts`

**Behavior introduced:** Explicit logout and genuine known A→B user-ID changes
invalidate outgoing writers and best-effort remove every outgoing-user v1 key
before the new identity becomes active, while authentication always proceeds.

**RED — representative tests/assertions:**

- `explicit logout invalidates writers and removes all outgoing-user Resume recovery keys before clearing auth`
- `logout cleanup failure does not prevent server logout or local anonymous state`
- `User A to User B cleans A before applying B`
- `same user refresh and StrictMode bootstrap do not clean recovery`
- `a temporary anonymous or refresh-failure state does not erase the remembered known identity`
- `a later User B login after User A session loss cleans A and never exposes A data`

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/auth/AuthProvider.test.tsx
```

Expected RED: AuthProvider has no recovery boundary calls or outgoing identity
ref.

**GREEN — minimal production change:**

Keep a `knownUserIdRef`. On `applyAuthentication(response)`, compare the known
non-null ID before applying the new response. On difference, call
`invalidateResumeRecoveryWritersForUser(outgoingId)` and
`removeResumeRecoveriesForUser(sessionStorage, outgoingId)` inside a guarded
best-effort helper. On explicit `logout()`, perform the same cleanup while the
ID is known, then call the existing logout request and clear authentication in
`finally`. Do not reset the known identity merely because coordinated refresh
temporarily clears UI authentication; this distinguishes bootstrap/refresh
from explicit logout and still detects a later A→B transition.

Run GREEN:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/auth/AuthProvider.test.tsx
```

**Focused regression checkpoint:**

```bash
npm run test --workspace @career-learning-hub/web -- src/features/auth
```

---

### Task 5: Canonical save-state derivation and one guarded Save New Version flow

**Files:**

- Modify: `frontend/src/features/resumes/ResumeWorkspace.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- Reuse: `frontend/src/features/resumes/resumeApi.ts`
- Reuse: `frontend/src/features/resumes/resumeDraft.ts`

**Behavior introduced:** The four approved canonical states, clean no-op,
save-readiness preflight, one synchronous single-flight path, server response
adoption, failure fingerprinting, explicit retry, and post-save local-cleanup
debt that never changes canonical success.

**RED — representative tests/assertions:**

- `canonical load presents Version 1 saved`
- `the first meaningful content edit presents Unsaved changes while UI-only and design changes do not`
- `button activation while clean sends no request`
- `save-invalid dirty content focuses validation and sends no request`
- `save-ready dirty content enters Saving and disables content editing`
- `button collisions create at most one request and the guard releases after success, normalized failure, response failure, and unexpected exception`
- `success adopts the returned version and baseline without optimistic numbering`
- `failure preserves the draft and shows Save failed`
- `retry without an edit uses the same operation`
- `the first meaningful edit after failure shows Unsaved changes and does not repeatedly announce dirty`
- `a 409 conflict remains a blocking domain condition after the compact state becomes DIRTY`
- `canonical success plus cleanup failure remains Version N saved, exposes one Retry local cleanup action, and never resends Save New Version`
- `post-save cleanup failure does not block editing, history, navigation, or canonical saved-version export`
- `cleanup retry leaves a newer-baseline recovery payload intact`

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeWorkspace.test.tsx
```

Expected RED: current failure UI remains `Unsaved changes`, the clean guard
lives only on button disabled state, and post-save cleanup does not exist.

**GREEN — minimal production change:**

Derive state from facts rather than a presentation flag:

```ts
type FailedSaveAttempt = {
  fingerprint: string;
  notice: Notice;
  conflict: boolean;
};

const currentFingerprint = draft ? draftFingerprint(draft) : "";
const dirty = currentFingerprint !== baselineFingerprint;
const saveState: CanonicalSaveState = saving
  ? "SAVING"
  : dirty && failedSave?.fingerprint === currentFingerprint
    ? "SAVE_FAILED"
    : dirty
      ? "DIRTY"
      : "SAVED";
```

Move all button/retry callers through `handleSaveNewVersion()`. Its preflight
checks active user/Resume/current editable context, recovery gate, snapshot,
print state, conflict remediation, single flight, dirty state, and existing
`validateResumeDraft()`. Acquire `saveMutationRef` before asynchronous work and
release it in `finally` on every terminal path. Continue sending
`draftToInput(draft)` and `workspace.version.id` as
`expectedCurrentVersionId` through `saveResumeVersion()`.

On success, adopt the validated server response, cancel old recovery work,
attempt exact-key cleanup, refresh history, and show the returned version. If
cleanup is unconfirmed, retain canonical `SAVED`, record only the old baseline
as cleanup debt, and expose `Retry local cleanup`. The retry calls
`removeObsoleteResumeRecovery()` and never `saveResumeVersion()`. On failure,
store the submitted fingerprint and safe notice; retain conflict remediation
independently from compact presentation.

When the draft fingerprint changes after a non-conflict failed attempt, clear
or demote that attempt's detailed notice as well as deriving `DIRTY`. When the
failed attempt was a 409, retain its reload/remediation condition even though
the compact status becomes `Unsaved changes`; block another request until the
canonical baseline is re-established. If a new legitimate recovery write later
replaces a post-save obsolete entry at the same key, clear the old cleanup-debt
action so it cannot delete the new payload.

Render one compact text status in the existing header action area and one
restrained polite announcement surface for `Saving`, `Save completed`, and
`Save failed`. Announce the transition into DIRTY once, not every input event.

Run GREEN:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeWorkspace.test.tsx
```

**Focused regression checkpoint:**

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeApi.test.ts src/features/resumes/resumeDraft.test.ts src/features/resumes/ResumeEditor.test.tsx
```

---

### Task 6: Workspace-owned Cmd/Ctrl+S accelerator

**Files:**

- Modify: `frontend/src/features/resumes/ResumeWorkspace.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.test.tsx`

**Behavior introduced:** A workspace-lifetime document listener intercepts the
recognized desktop save chord, works inside ordinary fields, and routes only
to Task 5's guarded save operation.

**RED — representative tests/assertions:**

- `Meta+S and Control+S inside Full name prevent browser default and call the same guarded save once`
- `plain S, Alt+S, composing input, and event.repeat do not save`
- `clean shortcut is an intercepted no-op`
- `held shortcut, rapid shortcuts, and button-plus-shortcut collision create at most one request`
- `shortcut while SAVING does nothing`
- `SAVE_FAILED shortcut retries the same draft`
- `historical view and print preparation block hidden saving and provide restrained guidance`
- `the listener is removed after the workspace unmounts and unrelated routes retain browser behavior`
- `the visible save button exposes aria-keyshortcuts and concise platform-aware guidance`

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeWorkspace.test.tsx
```

Expected RED: no key listener or shortcut metadata exists.

**GREEN — minimal production change:**

Register one `keydown` listener in a `useEffect` owned by ResumeWorkspace and
remove it in cleanup. Recognize `S` with Meta or Control and without Alt,
ignore `event.repeat` and `event.isComposing`, call `preventDefault()` whenever
the active workspace owns the chord, and then call
`handleSaveNewVersion("shortcut")`. The shared preflight remains authoritative
for clean, invalid, saving, recovery, historical, and print contexts. Expose
`aria-keyshortcuts="Meta+S Control+S"`; derive the compact visible hint from
the current platform without creating a mobile-only control.

Run GREEN:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeWorkspace.test.tsx
```

**Focused regression checkpoint:**

```bash
npm run test --workspace @career-learning-hub/web -- src/components/Dialog.test.tsx src/features/resumes/ResumeWorkspace.test.tsx
```

---

### Task 7: Workspace recovery persistence lifecycle

**Files:**

- Modify: `frontend/src/features/resumes/ResumeWorkspace.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- Reuse: `frontend/src/features/auth/AuthProvider.tsx`
- Reuse: `frontend/src/features/resumes/resumeRecoveryWriter.ts`

**Behavior introduced:** Instantiate one writer for the active authenticated
user and Resume, schedule only meaningful structurally safe dirty canonical
content, cancel/remove on clean transition, flush pending work on `pagehide`,
and show one non-blocking write-failure warning per episode.

**RED — representative tests/assertions:**

- `rapid editor changes write one exact user-and-Resume payload after 500 milliseconds`
- `the stored envelope contains only approved metadata and draftToInput content`
- `temporarily save-invalid Experience and Education remain recoverable`
- `tabs, sections, dialogs, history selection, design preview, assessment, and export interaction do not schedule writes or refresh writtenAt`
- `editing back to the canonical fingerprint cancels pending work and attempts exact cleanup`
- `pagehide flushes the latest unpersisted eligible draft and never means discard`
- `pagehide after a completed debounce does not refresh writtenAt`
- `route Resume A to Resume B disposes A's writer, prevents A callbacks from writing into B, and does not delete A's valid payload`
- `the first setItem failure shows one recovery warning while editing and Save remain enabled`
- `repeated failures do not duplicate the warning; a later successful write resets the episode`
- `serialization and storage-denied failures do not crash the editor and never fall back to another store`

Run with fake timers:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeWorkspace.test.tsx
```

Expected RED: Workspace has no authenticated-user recovery writer or pagehide
flush.

**GREEN — minimal production change:**

Read `user.id` through the existing `useAuth()`. Create/dispose a writer in an
effect keyed by `user.id` and `resumeId`. The cleanup calls `dispose()` only;
it never removes the old Resume key. A separate effect schedules this
candidate only when the canonical workspace is loaded, the recovery gate is
resolved, the draft is meaningfully dirty, and Task 1 structural parsing
succeeds:

```ts
{
  fingerprint: currentFingerprint,
  payload: {
    schemaVersion: 1,
    userId: user.id,
    resumeId: workspace.resume.id,
    baselineVersionId: workspace.version.id,
    baselineVersionNumber: workspace.version.versionNumber,
    content: draftToInput(draft),
  },
}
```

When clean, cancel pending work and attempt exact cleanup without changing
canonical save state. Register `pagehide` only for the current writer and call
`flush({ reportFailure: false })`; keep existing `beforeunload` warning
separate. Store write-failure episode state in Workspace and derive one warning
through the existing notice surface. A successful actual write resets the
episode but never shows SAVED.

Run GREEN:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeWorkspace.test.tsx
```

**Focused regression checkpoint:**

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeRecoveryWriter.test.ts src/features/resumes/ResumeWorkspace.test.tsx
```

---

### Task 8: Canonical-first classification and same-baseline recovery decision

**Files:**

- Modify: `frontend/src/features/resumes/ResumeWorkspace.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- Reuse: `frontend/src/components/Dialog.tsx`
- Reuse: `frontend/src/features/resumes/resumeRecovery.ts`

**Behavior introduced:** After canonical load, inspect only the exact active
key, suppress invalid/obsolete recovery, and present a non-dismissible blocking
Restore/Discard choice only for different-content same-baseline recovery.

**RED — representative tests/assertions:**

- `canonical server Resume loads before recovery is classified`
- `malformed, unknown-schema, wrong-user, wrong-Resume, invalid-baseline, future-invalid, and expired entries never reach recovery UI`
- `same- and old-baseline identical content are CLEAN_OBSOLETE, attempt cleanup, keep Version N saved, and remain export eligible`
- `different content on the current baseline opens RECOVERY AVAILABLE with Restore and Discard`
- `Escape, backdrop, history, design, editor, Save, shortcut, assessment, AI apply, and export cannot bypass the decision`
- `Restore adopts only recovered content, retains canonical baseline, shows Unsaved changes, sends no backend/AI request, and remains export blocked`
- `a restored save-invalid draft remains editable/recoverable but canonical validation blocks Save`
- `Discard cancels queued work, verifies exact removal, and returns to Version N saved`
- `failed removal keeps the dialog/focus active, shows a restrained error, and permits retry`

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeWorkspace.test.tsx
```

Expected RED: stored recovery is not read and no recovery gate exists.

**GREEN — minimal production change:**

After `fetchResume()` resolves and its response is adopted, synchronously call
`readResumeRecovery()` and then `classifyResumeRecovery()` using the just
returned canonical ID/content fingerprint. Set loading false only after this
classification. Keep `INVALID` and `CLEAN_OBSOLETE` logically ineligible even
when their best-effort cleanup fails.

Render the existing Dialog for `RECOVERY_AVAILABLE` with
`canDismissOnEscape={false}`, default non-dismissible backdrop, no close button,
safe initial focus on `Restore recovered draft`, and exactly the approved two
actions. While the gate exists, the native modal makes the background inert
and every handler preflight rejects programmatic invocation. Restore converts
payload content with `resumeContentInputToDraft()`, keeps
`baselineFingerprint`, clears the gate, restores editor focus, and lets Task 7
schedule normal recovery. Discard calls `cancelPending()`, verified exact
removal, and clears the gate only on confirmation.

Track the user ID that owns the adopted workspace. If authenticated identity
changes, render the loading state immediately rather than one frame of the old
user's Resume, clear old recovery gates, and refetch under the new identity.

Run GREEN:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeWorkspace.test.tsx
```

**Focused regression checkpoint:**

```bash
npm run test --workspace @career-learning-hub/web -- src/components/Dialog.test.tsx src/features/resumes/resumeRecovery.test.ts src/features/resumes/ResumeWorkspace.test.tsx
```

---

### Task 9: Two-stage stale/conflicted read-only recovery review

**Files:**

- Create: `frontend/src/features/resumes/ResumeRecoveryReview.tsx`
- Create: `frontend/src/features/resumes/ResumeRecoveryReview.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- Modify: `frontend/src/features/resumes/resumeWorkspace.css`
- Reuse: `frontend/src/features/resumes/ResumePreview.tsx`
- Reuse: `frontend/src/components/Dialog.tsx`

**Behavior introduced:** A stale conflict Dialog with Review/Discard followed
by a normal, single-column, read-only selectable recovery review that can only
discard and return.

**RED — representative tests/assertions:**

- `different content on an older baseline opens STALE_CONFLICTED_RECOVERY after canonical load`
- `the conflict Dialog explains earlier-version work and offers only Review recovered draft and Discard recovery`
- `Escape, backdrop, current editing, Save, shortcut, history, design, assessment, AI, and export remain blocked`
- `Review opens STALE_RECOVERY_REVIEW with baseline and current display version numbers`
- `stale content renders through ResumePreview with current design, is selectable, and exposes no editor controls`
- `stale review exposes no save, export, merge, apply, restore-anyway, AI, or history action`
- `review and selection do not write storage or refresh writtenAt`
- `Discard recovery and return to current Resume fails closed and preserves canonical content on failure`
- `successful discard restores the clean current canonical workspace and meaningful focus`
- `an account change immediately removes old-user recovery content from the rendered tree`

Run component RED:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeRecoveryReview.test.tsx src/features/resumes/ResumeWorkspace.test.tsx
```

Expected RED: the component and stale gate transition are absent.

**GREEN — minimal production change:**

Create a presentation-only component with props for payload content,
baseline/current version numbers, current design, discard busy/error, and
`onDiscard`. It renders a heading, persistent text warning, normal
`ResumePreview`, and one discard/return button. It never receives save, edit,
history, design, print, API, or AI callbacks.

In Workspace, the stale Dialog moves only from
`STALE_CONFLICTED_RECOVERY` to `STALE_RECOVERY_REVIEW`; it does not alter draft
or baseline. Stage 2 replaces the normal workspace body rather than trapping a
long Resume in a modal. Revalidate expiry at the decision/review boundary
without a timer and discard invalid data best effort. The only exit is verified
exact removal; there is no Back action in the approved final design. If an
existing supported canonical adoption boundary changes the current version
while stale state is retained, reclassify against that new canonical response
at the boundary and never apply the stale content automatically.

Run GREEN:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeRecoveryReview.test.tsx src/features/resumes/ResumeWorkspace.test.tsx
```

**Focused regression checkpoint:**

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumePreview.test.tsx src/components/Dialog.test.tsx src/features/resumes/ResumeRecoveryReview.test.tsx
```

---

### Task 10: Explicit draft discard and unsaved-navigation cleanup

**Files:**

- Modify: `frontend/src/features/resumes/ResumeWorkspace.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- Reuse: `frontend/src/components/Dialog.tsx`
- Reuse: `frontend/src/features/resumes/resumeRecovery.ts`

**Behavior introduced:** Header draft discard and in-app Leave without saving
become exact-key, generation-safe, fail-closed abandonment actions; Keep editing
retains/resumes recovery; browser lifecycle remains recovery-preserving.

**RED — representative tests/assertions:**

- `Discard draft changes removes the exact key before adopting the canonical draft`
- `failed draft-discard removal preserves the dirty draft and exposes retryable error`
- `Keep editing retains the key, draft, and normal debounced recovery`
- `Leave without saving cancels pending work, confirms exact absence, then proceeds`
- `failed Leave without saving keeps the blocker and draft active and never navigates`
- `retry after failed removal may proceed when the key is confirmed absent`
- `restored recovery and save-failed drafts follow the same Leave behavior`
- `pagehide, refresh-style beforeunload, snapshot selection, and snapshot return never imply discard`
- `successful discard cannot be undone by an old debounce or pagehide callback`

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeWorkspace.test.tsx
```

Expected RED: current discard resets React state directly and current Leave
calls `blocker.proceed()` without storage verification.

**GREEN — minimal production change:**

Replace inline handlers with `handleDiscardDraft()`, `handleKeepEditing()`, and
`handleLeaveWithoutSaving()`. Both abandonment handlers cancel the current
writer generation, call `removeResumeRecoveryExact()`, and transition only on
`true`. Failure updates the one existing decision/notice surface without moving
focus behind the Dialog. `handleKeepEditing()` resets the blocker and, if the
draft remains eligible and the latest payload was not already written,
reschedules the current candidate. Preserve the current `beforeunload` effect;
do not connect removal to `pagehide` or ordinary route-parameter cleanup.

Run GREEN:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeWorkspace.test.tsx
```

**Focused regression checkpoint:**

```bash
npm run test --workspace @career-learning-hub/web -- src/components/Dialog.test.tsx src/features/resumes/ResumeWorkspace.test.tsx
```

---

### Task 11: Export readiness, saved-source selection, page size, and filename hint

**Files:**

- Modify: `frontend/src/features/resumes/ResumePrintControls.tsx`
- Modify: `frontend/src/features/resumes/ResumePrintControls.test.tsx`
- Modify: `frontend/src/features/resumes/resumePrint.ts`
- Modify: `frontend/src/features/resumes/resumePrint.test.ts`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- Modify: `frontend/src/features/resumes/resumeWorkspace.css`

**Behavior introduced:** The existing panel truthfully names the saved source,
shows compact readiness and deterministic blockers, shares A4/Letter design
state, displays a best-effort `.pdf` filename, and preserves native guarded
printing.

**RED — representative tests/assertions:**

- `clean current saved version is ready and identifies Current saved version — Version N`
- `dirty, SAVING, SAVE_FAILED, restored recovery, unresolved recovery, stale review, no canonical version, source loading, design saving, and print preparation have exact nearby blockers`
- `historical Version N is eligible even while the retained current draft is dirty`
- `post-save cleanup debt does not block the newly saved canonical source`
- `historical content and current design are used without mutating either source`
- `A4 and Letter in the panel call the existing Resume-level design mutation only`
- `readiness states the browser Save as PDF mechanism without promising a generated file`
- `suggested filenames use canonical title, selected source version, page size, sanitization, length bound, and resume fallback`
- `historical filename uses its own version rather than the current version`
- `duplicate print activation invokes window.print once`
- `afterprint, cancellation/fallback, duplicate prevention, and thrown print preparation restore document.title`
- `the disabled print button references its textual blocker programmatically`

Run RED:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumePrintControls.test.tsx src/features/resumes/resumePrint.test.ts src/features/resumes/ResumeWorkspace.test.tsx
```

Expected RED: the panel has only a `dirty` boolean, no filename/readiness model,
and dirty current state blocks an explicitly selected historical source.

**GREEN — minimal production change:**

Introduce a local presentation contract, not a second persistence state:

```ts
export type ResumeExportReadiness =
  | { eligible: true; message: "Ready to print / save as PDF" }
  | { eligible: false; reasonId: string; message: string };
```

Workspace derives readiness from canonical save facts, recovery gate, selected
saved source, source/design/print activity, and canonical-version presence.
Current source is blocked whenever its editable draft is dirty; an explicitly
selected historical saved source ignores that separate draft's dirty flag but
still respects recovery gates and temporary print/source blockers.

Keep `createResumePrintTitle()` as the current bounded document-title slug and
add:

```ts
export function createResumeSuggestedFilename(input: {
  resumeTitle: string;
  versionNumber: number;
  pageSize: ResumeDesign["pageSize"];
}): string {
  return `${createResumePrintTitle(input)}.pdf`;
}
```

The panel displays `Suggested filename: …` and says the browser may use it.
`handlePrint()` selects `(snapshot ?? workspace.version)` only after readiness
is eligible and retains `openResumePrint()`, the print-only saved-content
surface, two-frame preparation, duplicate guard, fallback cleanup, and
`afterprint` restoration.

Run GREEN:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumePrintControls.test.tsx src/features/resumes/resumePrint.test.ts src/features/resumes/ResumeWorkspace.test.tsx
```

**Focused regression checkpoint:**

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumePreview.test.tsx src/features/resumes/ResumeDesignControls.test.tsx src/features/resumes/ResumeVersionTimeline.test.tsx src/features/resumes/ResumePrintControls.test.tsx src/features/resumes/resumePrint.test.ts
```

---

### Task 12: Integrated accessibility and responsive behavior

**Files:**

- Modify: `frontend/src/features/resumes/resumeWorkspace.css`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- Modify: `frontend/src/features/resumes/ResumePrintControls.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeRecoveryReview.test.tsx`
- Reuse: `frontend/src/components/Dialog.tsx`

**Behavior introduced:** The new status, warnings, Dialog content, recovery
review, and export readiness remain text-first, keyboard-operable, restrained
for assistive technology, and usable in current desktop/tablet/mobile layouts
and at actual 200% zoom.

**RED — representative tests/static assertions:**

- `one compact save status uses visible text and wraps in the existing action area`
- `one polite save announcement reports meaningful transitions without repeating per keystroke`
- `recovery write and cleanup warnings reuse one notice surface and never expose raw exceptions`
- `same-baseline and stale decision Dialogs start on the non-destructive action, contain focus, reject Escape/backdrop dismissal, and return focus meaningfully`
- `stale review has a programmatic heading/warning, keyboard-reachable discard action, and selectable content`
- `export source, blocker, page size, and filename are textually accessible`
- `narrow CSS stacks header actions, Dialog actions, readiness controls, and stale review without fixed-width overflow`
- `recovery review remains single-column and print CSS excludes all non-print recovery UI`
- `reduced-motion rules cover any newly reused transition class`

Run RED:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeWorkspace.test.tsx src/features/resumes/ResumePrintControls.test.tsx src/features/resumes/ResumeRecoveryReview.test.tsx
```

Expected RED: new semantic hooks/classes and wrapping rules are absent until
Tasks 5–11 land.

**GREEN — minimal production change:**

Extend existing `.resume-workspace-actions`, `.resume-dialog`,
`.resume-print-controls`, mobile breakpoints, and print media blocks. Allow
status text to wrap (`white-space: normal` where needed), keep actions at the
existing minimum target size, stack controls under existing 720/420 px rules,
and give stale review a normal single-column flow. Do not add a banner, sticky
surface, focus trap, custom modal, horizontal comparison, or color-only state.
Keep exactly one effective live/notice announcement at a time by prioritizing
the current actionable notice rather than rendering competing live regions.

Run GREEN:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeWorkspace.test.tsx src/features/resumes/ResumePrintControls.test.tsx src/features/resumes/ResumeRecoveryReview.test.tsx
```

**Focused regression checkpoint:**

```bash
npm run test --workspace @career-learning-hub/web -- src/components/Dialog.test.tsx src/features/resumes
```

---

### Task 13: Complete automated verification and privacy review checkpoint

**Files:** No production or test edits are expected in this checkpoint. If a
gate fails, return to the owning task's RED/GREEN cycle and apply the
three-attempt rule.

Run in this order and record exact counts/results:

1. Pure helpers:

   ```bash
   npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeDraft.test.ts src/features/resumes/resumeContracts.test.ts src/features/resumes/resumeRecovery.test.ts src/features/resumes/resumeRecoveryWriter.test.ts src/features/resumes/resumePrint.test.ts
   ```

2. Focused Resume components and fake-timer lifecycle:

   ```bash
   npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeRecoveryReview.test.tsx src/features/resumes/ResumePrintControls.test.tsx src/features/resumes/ResumeWorkspace.test.tsx
   ```

3. Auth/account cleanup:

   ```bash
   npm run test --workspace @career-learning-hub/web -- src/features/auth/AuthProvider.test.tsx
   ```

4. Complete affected Resume frontend tests:

   ```bash
   npm run test --workspace @career-learning-hub/web -- src/features/resumes
   ```

5. Complete frontend suite:

   ```bash
   npm run test --workspace @career-learning-hub/web
   ```

6. Frontend and workspace typechecks:

   ```bash
   npm run typecheck --workspace @career-learning-hub/web
   npm run typecheck
   ```

7. Production build:

   ```bash
   npm run build
   ```

8. Static architecture/privacy scan. Review every match; expected permitted
   matches are the v1 recovery module, explicit native session-storage calls,
   tests, and frozen docs. Production must contain no fallback store, recovery
   content logging, new AI call, storage-wide clear, or Candidate Photo change:

   ```bash
   rg -n "localStorage|indexedDB|sessionStorage\.clear|console\.|Gemini|openrouter|showProfilePhoto" frontend/src/features/resumes frontend/src/features/auth/AuthProvider.tsx
   rg -n "ResumeRecovery|resume-recovery" frontend/src
   ```

9. Review the scoped diff and whitespace:

   ```bash
   git diff --check
   git diff --stat
   git status --short
   git diff --cached --name-only
   ```

The staged-path command must remain empty. Do not run backend regression merely
for this frontend-only implementation; run it only if an unexpected backend or
shared-contract change is separately authorized. Do not use a browser or
Playwright in this checkpoint.

## Approved-design coverage matrix

| Design section | Implementation/verification coverage |
| --- | --- |
| 1. Scope and exclusions | Global constraints, file map, Task 13 static scan. |
| 2. Existing architecture retained | Read-only/reused map; Tasks 5, 11, 13. |
| 3. Save state machine | Task 5 and Task 12. |
| 4. Save New Version flow | Task 5. |
| 5. Cmd/Ctrl+S | Task 6. |
| 6. Save failure and retry | Task 5, including conflict independence. |
| 7. Recovery envelope/key | Tasks 1–2. |
| 8. Recovery write lifecycle | Tasks 3 and 7. |
| 9. Validation/classification | Tasks 1–2 and 8. |
| 10. Same-baseline recovery | Task 8. |
| 11. Stale/conflicted recovery | Task 9. |
| 12. Recovery cleanup | Tasks 2–3, 5, 7–10; ordinary Resume switching explicitly cancels writers without deleting valid recovery. |
| 13. Account-change cleanup | Task 4 and Task 8 old-user visibility guard. |
| 14. Storage failure handling | Tasks 2–5, 7–10. |
| 15. Unsaved navigation | Task 10. |
| 16. Design preferences | Tasks 7–9 and 11; design remains outside recovery. |
| 17. Export readiness | Task 11. |
| 18. Current export | Task 11. |
| 19. Historical export | Task 11, including dirty retained current draft. |
| 20. A4/Letter | Task 11. |
| 21. Filename | Task 11. |
| 22. Accessibility | Tasks 5–12. |
| 23. Responsive/mobile/200% | Task 12 and human QA handoff. |
| 24. Security/privacy | Tasks 1–4, 7–10, Task 13 scan. |
| 25. Error handling | Tasks 4–5, 7–11. |
| 26. Future TDD | Every implementation task's RED/GREEN/regression cycle. |
| 27. Future human QA | The handoff below. |
| 28. Phase 19A-4 boundary | Global constraints, static scan, and handoff. |

This matrix also covers clean no-op saving, server-authoritative version
adoption, guard release, SAVE_FAILED→DIRTY, shortcut collision/composition,
strict identity, future skew/expiry, latest-draft generation safety,
pagehide, fail-closed abandonment, post-save cleanup debt, no
`sessionStorage.clear()`, independent design, current/historical saved-source
printing, title restoration, live-region restraint, privacy, and Candidate
Photo exclusion.

## Future human Chrome QA handoff

After Task 13 passes, stop before any visual approval claim. Give the operator:

### Startup and synthetic data

- Required services: local MongoDB, backend, and frontend only. No worker,
  Gemini, Vercel, or Render service is required for Phase 19A-3 QA.
- Commands, each in its own terminal from repository root:

  ```bash
  npm run dev:backend
  npm run dev:frontend
  ```

- Local URL: the exact Vite URL printed by the frontend command (normally
  `http://localhost:5173`).
- Use synthetic accounts and synthetic Resume text only. Prepare one current
  Resume with at least two saved versions, A4/Letter design access, and no
  real candidate data. To exercise stale recovery manually, create a dirty
  recovery, then create/adopt a newer canonical version through another
  authorized application context before reloading the original tab.

### Manual inspection checklist

1. Desktop at 1440×900, tablet at 768×1024, and mobile at 390×844.
2. Actual browser zoom at 200%, checking no horizontal page overflow, clipped
   status, overlapping controls, or unusable Dialog/review action.
3. Keyboard-only traversal: save button, shortcut guidance, editor, recovery
   Dialog focus containment, stale review, blocker Dialog, history, page-size,
   and print action.
4. First meaningful edit shows `Unsaved changes` once; UI/design-only actions
   do not alter canonical state.
5. Cmd+S on macOS or Ctrl+S on Windows/Linux inside input/textarea; clean no-op,
   invalid validation, held-key protection, button collision, and in-flight
   single-flight behavior.
6. Save success shows the returned `Version N saved`; save failure preserves
   content and shows `Save failed`; retry works; a later edit shows
   `Unsaved changes` without hiding unresolved conflict remediation.
7. Reload recovery: partially entered Experience/Education survives; canonical
   loads before the blocking Restore/Discard Dialog; Escape and outside click
   do not dismiss; Restore stays dirty and export-blocked; Discard returns clean.
8. Stale recovery: Review/Discard conflict Dialog, single-column selectable
   read-only content, correct old/current version context, no save/export/edit,
   and fail-closed discard messaging where a storage failure can be safely
   simulated.
9. Navigation: Keep editing retains work; Leave without saving removes recovery
   before route transition; refresh/tab-close behavior remains recovery
   preserving rather than explicit discard.
10. Ordinary Resume A→B switching: no delayed A write appears under B and A's
    valid recovery remains available when returning to A.
11. Logout and synthetic A→B account transition: outgoing recovery UI/content
    disappears; unrelated session keys and the new user's scoped recovery are
    unaffected.
12. Current Print / Save as PDF: clean source enabled; dirty/saving/failed and
    restored recovery blocked with readable reason.
13. Historical Print / Save as PDF: selected historical content and historical
    version number, current design, retained dirty current draft permitted,
    and no hidden shortcut save.
14. A4 and Letter from the shared Resume-level control; browser guidance stays
    truthful; print layout uses the selected size.
15. Suggested filename for current/historical, unsafe-title sanitization,
    fallback, version number, and page-size suffix; cancel print and confirm the
    browser tab title returns.
16. Screen-reader spot check: dialog titles/descriptions, visible text status,
    restrained Saving/completed/failed announcements, blocker association, and
    no color-only meaning.
17. Privacy check in DevTools storage/network: exactly one approved v1 key per
    dirty Resume; minimal envelope only; no token/design/UI/AI data; no
    `localStorage`/IndexedDB fallback; no recovery/AI/backend request while
    reviewing stale content.
18. Confirm Candidate Photo remains inactive and no Phase 19A-4 or Phase 19B+
    behavior appears.

Codex must report the local URL and this checklist, then wait. Human visual and
functional approval cannot be self-issued and browser automation cannot replace
it.

## Completion boundary

Completing this plan implements only Phase 19A-3. It does not start Candidate
Photo (Phase 19A-4), Phase 19B+, deployment, or Git publication. Automated
passing results authorize only the human-QA handoff; they do not authorize a
commit, merge, push, or release.
