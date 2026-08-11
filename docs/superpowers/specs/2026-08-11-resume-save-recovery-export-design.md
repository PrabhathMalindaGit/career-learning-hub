# Phase 19A-3 — Resume Save, Recovery & Export Workflow Design

## Status and authority

- Phase: `19A-3 — Resume Save, Recovery & Export Workflow`.
- Date: 2026-08-11.
- Status: `DESIGN APPROVED / HUMAN-APPROVED`.
- Branch: `phase-19a-3-resume-save-recovery-export`.
- Baseline HEAD: `7effc4e3897797f472c88f8f17d98524ba364a7d`.
- Completed predecessor:
  `PHASE 19A-2 — RESUME COLLECTION, CREATION & GUIDED ENTRY /
  HUMAN-APPROVED / MERGED AS PR #6`.
- Design authority:
  `docs/superpowers/specs/2026-08-11-resume-save-recovery-export-design.md`.
- Accepted repository design approval token:
  `PHASE_19A3_RESUME_SAVE_RECOVERY_EXPORT_DESIGN_APPROVED` —
  `ACCEPTED / YES`.
- Conversational and repository designs:
  `APPROVED / HUMAN-APPROVED / FROZEN`.
- Implementation: `INACTIVE / NOT AUTHORIZED`.
- Implementation planning:
  `INACTIVE / NOT AUTHORIZED / NO IMPLEMENTATION PLAN CREATED`.
- Phase 19A-4 and Phase 19B through Phase 19H remain `PLANNED / INACTIVE`.
- This document changes no production code, test, API, database contract,
  dependency, authentication behavior, or provider behavior. It performs no
  Git staging, commit, push, merge, rebase, stash, reset, or clean action.

## Approved architecture

The selected architecture is:

`APPROACH A — BOUNDED SESSION RECOVERY INTEGRATED WITH THE EXISTING RESUME
WORKSPACE`.

The server-backed immutable ResumeVersion is canonical. Save New Version is
explicit. One user-and-Resume-scoped `sessionStorage` payload provides
best-effort, tab-scoped accidental-reload recovery for at most 24 hours. The
existing native browser print architecture remains the only PDF-export path.

Rejected alternatives are:

- warnings without recovery, because they do not protect accidental reloads;
- `localStorage`, IndexedDB, backend/cloud drafts, or autosave, because they
  exceed the privacy, persistence, reconciliation, and backend scope;
- diff, merge, AI reconciliation, and a new PDF-generation subsystem, because
  they are unnecessary for the approved bounded workflow.

## Assumptions and bounded implementation details

1. Every usable Resume workspace has an atomically created canonical Version 1.
   Phase 19A-3 therefore requires no local-only first-draft recovery mode.
2. Recovery timestamps allow at most five minutes of future clock skew. A
   timestamp farther in the future is invalid. This is the approved small
   implementation assumption; it is not clock-synchronization infrastructure.
3. Storage identifiers use a deterministic shared key helper. If existing ID
   syntax needs delimiter-safe encoding, use the smallest stable encoding
   already compatible with frontend conventions; do not hash identifiers.
4. The stale read-only review does not require a `Back` action. The minimum
   workflow provides `Discard recovery and return to current Resume`. A Back
   action is permitted only if direct reuse of the existing view-state pattern
   makes it smaller, and it must preserve payload, timestamp, and canonical
   state exactly.
5. `pagehide` is the selected best-effort lifecycle flush boundary unless
   implementation inspection proves an existing equivalent lifecycle hook is
   already authoritative. No additional lifecycle subsystem is authorized.

## Measurable design success criteria

Future implementation is successful only when evidence proves that:

- one guarded pipeline serves button save, keyboard save, and retry;
- clean save is a no-op and one dirty save creates at most one adopted version;
- the four canonical save states remain truthful and recovery gates remain
  separate;
- recovery is exact-key scoped, strictly validated, time-bounded, race-safe,
  and never stores credentials, design, UI state, or unrelated data;
- same-baseline recovery is explicitly restored or discarded;
- stale recovery is review-only and can never be saved or exported directly;
- identical recovered and canonical content produces no recovery UI;
- explicit abandonment fails closed when exact-key removal cannot be confirmed;
- canonical save success remains successful when local cleanup fails;
- outgoing-user cleanup touches only matching v1 recovery keys and never calls
  `sessionStorage.clear()`;
- dirty current content is never presented as a saved export source;
- current and historical saved export sources, A4/Letter, filename hints, and
  document-title restoration remain truthful;
- accessibility, responsive, privacy, static, automated, and later human QA
  gates pass without adding a dependency or backend draft contract.

## Evidence inspected

The audit inspected the controlling planning and phase records plus the active
Resume frontend and backend contracts, including:

- `frontend/src/features/resumes/ResumeWorkspace.tsx` and its tests;
- Resume editor, preview, design, print, history, draft, API, contract, type,
  and CSS modules under `frontend/src/features/resumes/`;
- the existing accessible `frontend/src/components/Dialog.tsx`;
- authentication state and routing/navigation ownership;
- Resume routes, controller, service, models, validation, and integration tests
  under `backend/src/modules/resumes/` and `backend/src/tests/`;
- shared Resume contracts and the Phase 19A-1/19A-2 design and closeout records;
- the historical Phase 16 print/export and template records as supporting,
  non-controlling evidence.

No browser, Playwright, application service, database, provider, or live Gemini
request was used for this design task.

## 1. Scope and exclusions

Phase 19A-3 adds bounded, explicit save, accidental-reload recovery, and
browser-export behavior around the existing Resume Studio.

In scope:

- four-state canonical save presentation;
- explicit Save New Version and guarded retry;
- workspace-scoped Cmd/Ctrl+S;
- user-and-Resume-scoped `sessionStorage` recovery;
- approximately 500 ms debounced writes and best-effort lifecycle flush;
- structural recovery validation distinct from save readiness;
- same-baseline Restore/Discard;
- two-stage stale/conflicted read-only review;
- deterministic 24-hour expiry and cleanup;
- existing navigation and departure protection;
- refinement of the existing Print / Save as PDF panel;
- current and historical saved-version export;
- A4/Letter and deterministic filename hints;
- accessibility, responsive behavior, privacy, error handling, future tests,
  and later human QA.

Explicitly excluded:

- autosave or silent ResumeVersion creation;
- backend/cloud drafts or cross-device synchronization;
- `localStorage`, IndexedDB, cookies, or service-worker recovery;
- automatic restore, merge, diffing, reconciliation, or stale adoption;
- AI-assisted recovery, repair, merging, filenames, or export readiness;
- a new PDF engine, export route, modal, drawer, page, or dependency;
- export of dirty or recovered-unsaved content;
- historical-version mutation;
- recovery of design preferences or transient UI state;
- Candidate Photo and Phase 19A-4 work;
- implementation or implementation planning during this design stage.

The immutable server ResumeVersion remains canonical. Recovery is secondary,
explicit, best effort, tab-scoped, and privacy-bounded.

## 2. Existing architecture retained

The existing server architecture remains authoritative:

- `Resume` remains the owned aggregate containing title, status, current
  version identity, latest version number, and Resume-level design preferences.
- `ResumeVersion` remains an immutable append-only `ResumeContent` snapshot.
- Resume creation continues to atomically create Version 1.
- Save New Version continues to transactionally advance `currentVersionId` and
  `latestVersionNumber`.
- `expectedCurrentVersionId` remains the stale-version authority.
- Existing authentication, ownership, validation, request-ID, no-store, and
  safe-error behavior remains unchanged.
- Recovery remains entirely frontend/browser-local.

The existing frontend architecture remains:

- the validated server workspace response is canonical;
- the editable draft compares against the adopted normalized content baseline;
- canonical success adopts the returned server response;
- failure preserves the editable draft;
- the synchronous single-flight guard remains;
- Resume content editing remains disabled during `SAVING`;
- the authenticated API client remains the only Resume API path;
- access tokens remain in React memory and credentials never enter recovery.

Historical ResumeVersions remain immutable, server-backed, and read-only.
Opening history never replaces or mutates the current editable draft. Historical
saved content remains a legitimate export source after recovery is resolved.

Template, palette, font, A4/Letter page size, and the inactive photo flag remain
Resume-level preferences on the existing independent design-persistence path.
Recovery contains `ResumeContent` only. Historical content continues to render
with current Resume-level design preferences.

The existing Print / Save as PDF panel, saved-content print surface,
`window.print()`, duplicate-print guard, print CSS, temporary document-title
hint, and title restoration remain. Existing route blocking, `beforeunload`,
Dialog, notice/error, focus, responsive, and validation patterns are reused
surgically.

## 3. Save state machine

The editable current Resume uses four canonical save states:

| State | Visible text | Meaning |
| --- | --- | --- |
| `SAVED` | `Version N saved` | The active baseline is canonical server Version N and the draft is clean. |
| `DIRTY` | `Unsaved changes` | Canonical Resume content differs meaningfully from the adopted baseline. |
| `SAVING` | `Saving…` | One explicit canonical save request is in flight. |
| `SAVE_FAILED` | `Save failed` | The latest explicit save attempt failed and that submitted draft remains dirty. |

The state derives from adopted canonical server state, normalized
`ResumeContent` comparison, the active request, and the latest relevant save
result. It is not a loosely synchronized presentation flag.

```text
Canonical load + resolved recovery → SAVED
SAVED + meaningful content edit → DIRTY
DIRTY + save-ready explicit save → SAVING
DIRTY + save-invalid explicit save → DIRTY, validation only
SAVING + validated canonical success → SAVED
SAVING + failure → SAVE_FAILED
SAVE_FAILED + explicit retry → SAVING
SAVE_FAILED + next meaningful content edit → DIRTY
DIRTY/SAVE_FAILED + successful discard or reload → SAVED
Valid same-baseline recovery Restore → DIRTY
```

Clean save activation is an intentional no-op. UI-only interaction and
independently persisted design state do not affect canonical save state.
Recovery writes or cleanup never establish `SAVED`; only validated canonical
response adoption does. No persistent saved-at timestamp is added.

`RECOVERY AVAILABLE`, `STALE / CONFLICTED RECOVERY`, and
`STALE RECOVERY REVIEW` are separate blocking workspace gates. They are not
additional canonical save states and must not display `Version N saved` in a
way that describes recovered content.

## 4. Save New Version flow

Save is authorized only from the current editable Resume after recovery gates
are resolved.

Preflight:

1. Require the authenticated workspace and adopted canonical baseline.
2. Reject historical, stale-review, recovery-decision, print, and other
   read-only contexts.
3. Return if another save is in flight.
4. Perform the existing normalized dirty comparison.
5. Treat clean state as a no-op with no request or version.
6. Run existing canonical save-readiness validation.
7. On validation failure, preserve draft and recovery, show existing errors,
   focus the first relevant invalid field, remain `DIRTY`, and send no request.

Request:

1. Acquire the synchronous single-flight guard before asynchronous work.
2. Enter `SAVING` and disable editing and duplicate submission.
3. Submit complete normalized `ResumeContent` with the adopted
   `expectedCurrentVersionId` through the existing API.
4. Do not optimistically increment a version or automatically retry.

Canonical success:

1. Validate the response through the existing frontend contract boundary.
2. Adopt the returned Resume and ResumeVersion.
3. Replace draft and dirty baseline with returned canonical content.
4. Display the returned `Version N saved`.
5. Refresh relevant history and existing analysis-staleness state.
6. Cancel and invalidate pending recovery writes.
7. Remove the exact recovery key and prevent delayed recreation.
8. If cleanup fails, keep canonical success and report cleanup separately.

Failure:

- release the guard and restore editing;
- preserve draft, baseline, and recovery eligibility;
- enter `SAVE_FAILED`;
- reuse existing normalized errors, request IDs, field mapping, and conflict
  remediation;
- never weaken `expectedCurrentVersionId` or retry automatically.

The single-flight guard must be released on every terminal path through a
`finally`-equivalent boundary, including success, normalized backend failure,
response-contract failure, abort, and handled unexpected exception.

```text
One explicit meaningful dirty save
→ at most one in-flight frontend request
→ at most one newly adopted canonical ResumeVersion
```

## 5. Cmd/Ctrl+S behavior

Register one workspace-owned `keydown` listener and remove it on unmount or
loss of ownership.

- macOS uses `Meta+S`.
- Other desktop platforms use `Control+S`.
- Plain `S`, `Alt+S`, unrelated combinations, composition events, and
  `event.repeat` do not initiate saving.
- The shortcut remains available inside normal inputs and textareas.
- Resume Studio calls `preventDefault()` whenever it owns the recognized chord.
- Unrelated routes retain normal browser behavior.

```text
Clean → intercepted no-op
Dirty + save-ready → normal Save New Version
Dirty + save-invalid → normal validation, no request
SAVE_FAILED → guarded explicit retry
SAVING or repeat → no additional request
```

Recovery decisions, stale review, historical view, print preparation, and
other read-only contexts intercept the chord but never save stale or hidden
content. After explicit Restore, the recovered dirty draft may use the normal
pipeline once save-readiness validation passes.

The visible Save New Version control remains primary and exposes concise
platform-aware guidance plus accessible shortcut metadata. Touch-only mobile
requires no shortcut behavior or instructional UI.

## 6. Save failure and retry behavior

Canonical failure preserves the active dirty draft, baseline, and recovery
eligibility. The compact status becomes `Save failed`; actionable detail and
the failed request ID remain in the existing notice surface.

- Backend validation errors continue to map to supported field errors.
- `RESUME_VERSION_CONFLICT` retains canonical reload/remediation requirements.
- Failure never triggers automatic retry, optimistic adoption, or a version
  increment.
- Retry is user-initiated and uses the same guarded operation.
- Retry is permitted only in the editable current context, with no active
  request or recovery gate, and after normal validation and conflict guards.

The first later meaningful content edit causes:

```text
SAVE_FAILED → DIRTY → Unsaved changes
```

The previous error is cleared, demoted, or superseded where appropriate. A
persistent domain condition, especially version conflict, remains independently
enforced. An old request ID never becomes associated with the modified draft or
a later request.

## 7. Recovery envelope and storage key

One entry exists per user + Resume under a shared deterministic helper.

```text
career-learning-hub:resume-recovery:v1:<userId>:<resumeId>
```

Requirements:

- application-owned, feature-specific, explicitly versioned namespace;
- deterministic user and Resume identity encoding;
- exact-key lookup for the active Resume;
- exact outgoing-user prefix scan only for logout/account change;
- no user index, aggregate payload, cosmetic hash, or
  `sessionStorage.clear()`;
- unknown future namespace versions are never interpreted as v1.

Payload:

```ts
{
  schemaVersion: 1,
  userId,
  resumeId,
  baselineVersionId,
  baselineVersionNumber,
  content,
  writtenAt
}
```

`baselineVersionId` is authoritative for conflict classification.
`baselineVersionNumber` is validated display metadata only. `content` is
canonical structurally valid `ResumeContent`. `writtenAt` is a numeric epoch
timestamp for expiry.

The payload excludes baseline content, fingerprints, design preferences,
photos, UI state, history, analysis, AI data, export state, credentials,
tokens, secrets, provider data, and unrelated application state.

## 8. Recovery write lifecycle

Recovery is eligible only when:

- the draft differs meaningfully from its canonical baseline;
- active authenticated user and Resume identities are known;
- a valid canonical baseline version exists;
- content passes structural recovery validation.

Normal writes use approximately a 500 ms debounce:

- reset after meaningful content edits;
- serialize the latest eligible draft rather than stale captured state;
- update only the exact active key;
- overwrite the single payload rather than accumulating history;
- advance `writtenAt` only after legitimate content is actually persisted.

A local generation/invalidation guard prevents old callbacks from writing after
save, discard, explicit abandonment, Resume change, or account change.

When the draft becomes clean, cancel pending writes, invalidate queued work,
and remove the exact entry. Do not clear recovery when save starts; retain it
until canonical success. Save failure preserves or refreshes eligible recovery.

The debounce remains primary. A synchronous best-effort `pagehide` flush uses
the latest eligible draft. It is not guaranteed and does not replace
`beforeunload`. Restore alone does not refresh expiry; later legitimate edits
may. Stale review, reads, prompts, scrolling, history, design, and export never
refresh the timestamp. No worker, polling loop, interval, or fallback storage
is added.

## 9. Recovery validation and classification

Canonical server state must be loaded and validated before any recovery choice
is presented.

Validation and classification:

1. Establish authenticated user and active Resume identity.
2. Load and validate the canonical server workspace.
3. Construct and read the exact v1 key.
4. Parse JSON defensively.
5. Enforce the exact closed-shape envelope and `schemaVersion: 1`.
6. Validate agreement among key identity, payload identity, active user, and
   active Resume.
7. Validate baseline ID and positive integer display version.
8. Validate finite numeric `writtenAt`.
9. Reject timestamps more than five minutes in the future.
10. Reject payloads older than 24 hours.
11. Validate `ResumeContent` through a closed-shape structural schema.
12. Compare recovered and canonical content using existing normalized dirty
    semantics.
13. If content differs, compare authoritative baseline IDs.

Structural validation accepts supported, correctly typed but incomplete work,
including empty required strings and partially completed entries. It enforces
existing safe string, array, object, and nesting bounds without imposing
business save completeness.

It rejects unknown fields, wrong types, unsupported nesting, incompatible
shapes, unknown schemas, and structurally unsafe content. It performs no
coercion, stripping, migration, repair, or partial restoration. Prefer a shared
or extracted existing structural contract; do not weaken save validation or add
a dependency.

```text
Malformed, mismatched, incompatible, unsafe, or expired
→ INVALID
→ remove where possible
→ canonical workspace continues

Valid + recovered content equals canonical content
→ CLEAN / OBSOLETE
→ cleanup only

Valid + different content + same baselineVersionId
→ RECOVERY AVAILABLE

Valid + different content + different baselineVersionId
→ STALE / CONFLICTED RECOVERY
```

Content equivalence precedes baseline conflict UX. Design preferences do not
participate. No stored content hash is required.

## 10. Same-baseline recovery

A valid different-content payload whose baseline matches the canonical current
version enters `RECOVERY AVAILABLE`.

Use the existing accessible blocking Dialog with exactly:

- `Restore recovered draft`;
- `Discard recovery`.

The dialog explains that unsaved browser-session work was found after the saved
server version loaded. It does not expose storage implementation terminology.

While unresolved, the underlying workspace is inert. Editing, save, shortcut,
history, export, design mutation, and Resume mutation are unavailable. Escape,
backdrop click, and a generic close control cannot dismiss the decision. Normal
compact save presentation is suspended or contextualized.

Restore:

- places recovered content into the editable draft;
- retains the server version as baseline;
- enters `DIRTY / Unsaved changes`;
- creates no version, backend request, AI action, or export;
- preserves canonical save-readiness validation;
- remains export-blocked until canonical save succeeds;
- continues normal recovery writes after later meaningful edits.

Discard invalidates pending writes, removes and verifies absence of the exact
key, and returns to the clean canonical Resume only after removal succeeds. It
fails closed if removal cannot be confirmed.

## 11. Stale/conflicted recovery

Different content with a different baseline enters a two-stage blocking flow.

### Stage 1 — conflict decision

Use the existing Dialog with:

- `Review recovered draft`;
- `Discard recovery`.

Explain that unsaved work came from an earlier saved version and cannot be
restored automatically. Editing, save, shortcut, history, export, design
mutation, Escape dismissal, outside dismissal, and generic close remain
blocked.

### Stage 2 — read-only recovered draft review

Use a normal accessible read-only workspace state, not a giant modal,
side-by-side comparison, diff, or merge canvas.

Provide:

- a clear heading and persistent stale warning;
- `Recovered draft based on Version X`;
- `Current saved Resume: Version Y`;
- a statement that the content is not current, cannot be saved or exported,
  and may be copied manually;
- normally selectable text;
- `Discard recovery and return to current Resume`.

Do not provide editing, reordering, field application, Restore anyway, merge,
AI reconciliation, save, export, history, or design mutation. The existing
preview may render the recovered content with current design preferences for
readability, but those preferences are not recovered or mutated.

The intended manual workflow is: inspect and select useful text, copy it with
normal browser/OS behavior, discard the stale recovery, return to the current
canonical Resume, and explicitly paste or re-enter only the information the
user chooses. No special clipboard, field-copy, or merge control is required.

Discard uses exact-key, race-safe, fail-closed behavior. Review never refreshes
expiry. Boundary revalidation may remove an entry that expires while open.
If canonical version identity changes at a later supported canonical boundary,
re-evaluate the recovery relationship without applying it. There is deliberately
no transition from stale recovery to an editable recovered draft.

## 12. Recovery cleanup

Exact-key cleanup occurs after:

- successful Save New Version;
- explicit recovery or draft discard;
- Leave without saving;
- clean/obsolete equivalence;
- malformed, incompatible, or expired detection;
- Resume deletion where an authorized deletion flow exists;
- transition away from the owning Resume only where an already approved
  explicit abandonment action requires recovery removal.

Ordinary Resume switching does not authorize recovery deletion. When the
active workspace changes from Resume A to Resume B, cancel Resume A's pending
debounce, invalidate queued and lifecycle writers belonging to Resume A, and
prevent old callbacks from writing into the new workspace. Do not delete
Resume A's otherwise valid recovery payload solely because Resume B became
active. Each Resume retains its independent user-and-Resume-scoped entry until
an approved cleanup boundary applies.

Race-safe order:

1. Cancel the matching debounce.
2. Invalidate queued and lifecycle writers.
3. Remove the exact key.
4. Confirm `getItem(exactKey) === null` where storage access permits.
5. Complete the associated transition only under its approved failure policy.

No tombstone or second persistent marker is created.

- Explicit Discard or Leave without saving fails closed.
- Canonical save success remains saved and reports cleanup separately.
- Invalid or obsolete content remains logically ineligible even if physical
  cleanup fails.
- Logout/account change permits authentication to continue.

A later legitimate edit after canonical save may write a new envelope to the
same key using the newly adopted baseline ID and number.

## 13. Account-change cleanup

On explicit logout or a genuine known `user.id` transition:

1. Cancel and invalidate every pending writer belonging to the outgoing user.
2. Collect keys matching the exact v1 outgoing-user prefix.
3. Remove the collected keys without mutating storage during enumeration.
4. Invalidate any active recovery dialog or stale review.
5. Prevent outgoing-user content from remaining visible.
6. Allow authentication to proceed even if storage cleanup fails.

Do not trigger this cleanup for ordinary authentication bootstrap, token
refresh, a temporary loading state that resolves to the same user, or ordinary
re-rendering.

Only exact Phase 19A-3 v1 keys for the outgoing user are touched. Unrelated
keys, other users' keys, and unknown future namespace versions remain. Cleanup
occurs while the outgoing identity is still known. User B looks up only User B
keys. Payload ownership validation remains mandatory even if cleanup failed.

## 14. Storage failure handling

Three failure classes remain distinct.

### Dirty recovery write failure

- Editing, Save, shortcut, and canonical state remain available.
- Show one warning per failure episode:
  `Local recovery is unavailable. Save a new version to protect your changes.`
- Suppress repeats while later writes continue failing.
- Reset after a successful legitimate write or lifecycle reset.
- Do not claim success after scheduling or serialization alone.

### Explicit abandonment removal failure

- Keep the recovery or navigation decision unresolved.
- Do not navigate or claim discard success.
- Show:
  `Local recovery could not be discarded. Please try again.`
- Permit user retry or the non-destructive alternative.
- A deterministically absent exact key satisfies the requirement.

### Post-save cleanup failure

- Canonical save remains `Version N saved`.
- Editing, history, navigation, and eligible export remain available.
- Show:
  `Your new version was saved, but local recovery data could not be cleared.
  Please retry cleanup.`
- Provide bounded `Retry local cleanup` for only the exact key.
- Never retry Save New Version.
- Permit low-frequency opportunistic cleanup at appropriate boundaries.
- A surviving entry is stale against the new version and never restores
  automatically.

Storage read or enumeration failure never exposes unvalidated content.
Lifecycle-flush failure does not attempt unload-time UI. No failure activates
fallback persistence, a retry library, polling, or a new dependency.

## 15. Unsaved-navigation behavior

Existing route blocking and `beforeunload` remain.

For dirty in-app navigation:

- `Keep editing` cancels navigation and retains draft and recovery.
- `Leave without saving` is explicit abandonment.

Leave order:

1. Cancel matching pending writes.
2. Invalidate debounce and lifecycle callbacks.
3. Remove and verify absence of the exact recovery key.
4. Continue navigation only after successful removal.

If removal fails, navigation remains blocked, the draft remains intact, the
dialog remains available, and the user may retry or keep editing.

Browser refresh, tab close, window close, shutdown, and `pagehide` are not
explicit discard. They preserve native warning and best-effort recovery flush.
Opening or leaving a historical snapshot does not itself discard the retained
current draft.

## 16. Design preference interaction

The existing Resume-level design contract remains:

- template;
- palette;
- font;
- A4/Letter page size;
- inactive photo flag.

Design preferences remain independently persisted, create no ResumeVersion, do
not participate in `ResumeContent` dirty comparison, do not enter recovery, and
do not refresh recovery expiry. They continue to render current and historical
saved content.

Design-preview-only interaction does not create recovery. Design mutation is
blocked while recovery identity is unresolved or stale review is active.
Existing design-save status and error handling remain separate from canonical
content-save state.

## 17. Export readiness

The existing Print / Save as PDF panel remains the only export entry point.

Its compact readiness area identifies:

- selected source and version;
- eligibility or deterministic blocker;
- current A4/Letter preference;
- browser Print / Save as PDF mechanism;
- best-effort suggested filename when eligible.

| Context | Export |
| --- | --- |
| Clean current saved version | Allowed |
| Dirty current draft | Blocked |
| Saving | Blocked |
| Save failed with dirty draft | Blocked |
| Historical saved version | Allowed |
| No canonical saved version | Blocked |
| Restored unsaved recovery | Blocked |
| Stale recovery review | Blocked |
| Unresolved recovery decision | Blocked |

Source loading, design/page-size persistence, and print preparation are also
deterministic temporary blockers. Disabled actions have a nearby textual reason
associated programmatically where practical. Readiness does not include ATS
quality, AI assessment, recommendations, or speculative scoring.

## 18. Current saved-version export

Current export is eligible only when:

- recovery is resolved;
- a canonical current ResumeVersion exists;
- the active editable draft is clean;
- no canonical save or relevant design mutation is in progress;
- print preparation is not already active.

The panel identifies `Current saved version — Version N`. The dedicated print
surface receives canonical saved content, never an unsaved draft. Dirty,
failed, saving, and restored recovery states instruct the user to save
successfully first.

Enabled activation uses the existing guarded preparation and `window.print()`
flow without another confirmation modal.

## 19. Historical saved-version export

A selected historical ResumeVersion is a legitimate saved source.

The panel identifies `Historical Version N`.

- Content comes from the selected stored historical version.
- Design comes from current Resume-level preferences.
- Filename version is the selected historical version number.
- The snapshot remains read-only and never becomes current.
- Export creates no ResumeVersion.
- Cmd/Ctrl+S never saves the retained draft invisibly.
- Source loading or stale snapshot state blocks print until resolved.
- Existing request abort and stale-source cleanup remain.

A historical source may be exported while a separate retained current draft is
dirty because the visible source is explicit, saved, and read-only. Unresolved
recovery gates block entry into history and therefore block historical export.

## 20. A4 and Letter behavior

Exactly two page sizes remain:

- `A4`;
- `LETTER`, displayed as `Letter`.

Design and export controls share one canonical Resume-level setting. No
export-only page-size state exists.

- Existing design persistence remains authoritative.
- Readiness displays the active size.
- Current and historical rendering use the current setting.
- Existing print CSS for both sizes remains.
- Filename hints use `a4` or `letter`.
- The browser print dialog may override native print settings.
- Print remains blocked while page-size persistence is unresolved.

## 21. Filename behavior

The suggested filename pattern remains:

```text
<sanitized-canonical-resume-title>-v<source-version>-<page-size>.pdf
```

Examples:

```text
software-engineer-resume-v3-a4.pdf
software-engineer-resume-v3-letter.pdf
software-engineer-resume-v2-a4.pdf
```

Use canonical Resume title, selected saved version, and current page size.
Historical export uses its own version number. Never derive the name from
candidate identity or unsaved content.

Preserve the existing lowercase readable slug convention: trim and collapse
whitespace, normalize separators, remove control/path-hostile characters,
avoid separator noise, and retain the existing reasonable length bound. Use
`resume-vN-size.pdf` when the sanitized title is empty. Preserve existing safe
Unicode behavior; add no transliteration dependency.

Present the result as `Suggested filename` or `Your browser may use`, never a
guarantee. Keep preparation inside the guarded print flow. Restore the original
document title after completion, cancellation, preparation failure, and
fallback cleanup. Generate no hint for dirty or stale-recovery content.

## 22. Accessibility

Save and recovery meaning uses visible text, not color alone.

Reuse one restrained existing status/live-region pattern for meaningful
transitions:

- Saving;
- save completed with canonical version;
- save failed;
- transition into Unsaved changes once, not on every keystroke.

Blocking recovery dialogs retain accessible title/description, focus
containment, keyboard operation, safe initial focus, focus restoration, and
responsive behavior. Escape, backdrop click, and generic close cannot dismiss
required decisions. Underlying editing is functionally inert.

Stale review has an accessible heading, persistent warning, readable version
context, selectable content, keyboard-accessible discard/return, and meaningful
focus movement. Export blockers are textually explained and associated with the
disabled action where practical. Shortcut metadata appears on the visible Save
control. Storage and save errors reuse existing alert/status semantics without
repeated announcements.

## 23. Responsive, mobile, and 200%-zoom behavior

The compact status remains secondary to Resume title and primary action.

- Header actions and status may wrap or reposition.
- Controls must not overlap, clip, or force page-level horizontal scrolling.
- Dialog text and actions may wrap or stack.
- Stale review remains single-column.
- No side-by-side merge canvas is introduced.
- Export readiness remains compact and flexible.
- Existing touch-target and focus-visibility conventions remain.
- Touch-only mobile requires no shortcut UI.
- Long recovered content remains readable and selectable.
- Reuse the existing responsive Resume preview rather than a fixed-width
  review surface.
- Do not add a sticky save or full-width recovery banner merely for reflow.

Future human QA covers desktop, tablet, mobile, and actual browser 200% zoom.

## 24. Security and privacy

Recovery contains private candidate content and follows data minimization.

- One entry is scoped to authenticated user + Resume.
- Key identity, payload identity, active user, and active Resume must agree.
- Recovery never authorizes backend ownership, saving, history, or export.
- Server ownership remains authoritative.
- Access tokens, refresh tokens, cookies, credentials, secrets, Gemini data,
  and provider data are excluded.
- Recovery content is never logged, sent to Gemini, uploaded, included in
  analytics, or exposed in diagnostics.
- Technical errors use bounded non-content metadata only.
- `sessionStorage` is same-origin browser storage, not encrypted persistence;
  this design does not claim otherwise.
- Retention is limited to the tab/session and 24 hours from the last legitimate
  write.
- Logout/account transition is an immediate cleanup boundary.
- No `localStorage`, IndexedDB, backend fallback, cross-user migration, or cloud
  synchronization exists.
- Strict structural validation prevents arbitrary local data from reaching
  rendering or editing.
- Existing XSS protections remain a prerequisite because same-origin scripts
  can access `sessionStorage`.

## 25. Error handling

Error behavior is deterministic by category:

- Canonical load failure: show existing load failure, never present recovery as
  authoritative, and allow supported retry.
- Malformed, incompatible, wrong-owner, wrong-Resume, or expired payload:
  never render or restore; attempt removal; continue canonical access.
- Invalid-entry cleanup failure: keep content logically ineligible and use a
  restrained cleanup warning/retry only when materially useful.
- Recovery read/access failure: continue canonical access and warn
  non-blockingly when protection is materially unavailable.
- Dirty recovery write failure: one warning per episode; canonical save remains
  available.
- Explicit discard failure: fail closed for abandonment.
- Post-save cleanup failure: canonical success remains authoritative; exact-key
  retry stays separate.
- Canonical save failure: preserve draft and use existing normalized errors and
  request IDs.
- Version conflict: preserve authoritative remediation.
- Print preparation failure: prevent duplicate print, clear stale print source,
  and restore document title.
- Aborted obsolete requests: produce no noisy user error.

If canonical save failure and recovery unavailability coexist, the existing
notice surface communicates both truths without changing the compact canonical
state or adding a competing notification system. Raw browser exceptions and
private Resume content never appear in user messages or logs.

## 26. Future TDD strategy

Future implementation begins with targeted failing tests before production
changes. This section is a verification strategy, not an implementation plan.

1. Pure helper tests:
   - exact key and prefix construction;
   - strict envelope parsing;
   - timestamp and expiry;
   - closed-shape structural validation;
   - canonical equivalence and baseline classification;
   - filename generation.
2. Recovery lifecycle tests with fake timers:
   - rapid edits collapse into one write;
   - latest content wins;
   - clean state cancels/removes;
   - save/discard invalidation prevents delayed recreation;
   - lifecycle flush uses latest eligible content;
   - Restore resumes persistence;
   - stale review writes nothing;
   - failure-episode suppression and reset.
3. Workspace component tests:
   - save-state transitions;
   - button/shortcut single-flight collision;
   - validation and conflict behavior;
   - same-baseline Dialog;
   - stale decision and read-only review;
   - focus and dismissal guards;
   - navigation and account cleanup;
   - export readiness and source identity.
4. Print regression tests:
   - A4/Letter;
   - current/historical content selection;
   - filename sanitization and fallback;
   - duplicate-print protection and title restoration.
5. Backend regression:
   - retain immutable-version, ownership, transaction, validation, and conflict
     tests;
   - add no backend test unless future implementation changes a backend
     contract.

Use existing Vitest/testing infrastructure, fake timers, and native storage
stubs. Add no dependency. Future authorized work runs targeted checks first,
then required frontend tests, typecheck, and production build. This design task
does not modify or run production tests.

## 27. Future human QA

Visible implementation requires later human QA before commit approval. It is
not performed during this design task.

The bounded matrix covers:

- edit to Unsaved changes;
- button and keyboard save;
- clean no-op, save validation, saving lock, and duplicate prevention;
- returned version, failed save, edit-after-failure, and retry;
- same-baseline Restore and Discard;
- reload recovery;
- stale conflict and selectable read-only review;
- expired, malformed, wrong-user, and obsolete recovery;
- write, discard, and post-save cleanup failures;
- Keep editing, Leave without saving, and account cleanup;
- current clean export and dirty/recovered-current blockers;
- historical export and explicit source identity;
- A4, Letter, filename hint, and document-title restoration;
- keyboard-only operation and focus behavior;
- desktop, tablet, mobile, and actual 200% zoom.

Use targeted evidence rather than a large screenshot campaign. Browser
automation does not replace human review and is not authorized during this
design task. A future implementation handoff must provide a local URL,
inspection checklist, limitations, and required human approval request.

## 28. Explicit Phase 19A-4 boundary

`PHASE 19A-4 — CANDIDATE PHOTO SUPPORT` remains planned and inactive.

Phase 19A-3 does not:

- activate `showProfilePhoto`;
- recover candidate photos;
- upload, crop, transform, or store images;
- change private asset ownership;
- render new photo layouts;
- add AI image behavior;
- alter export for photo support.

The existing inactive Resume-level photo flag may remain in the design model
but is excluded from recovery and new Phase 19A-3 behavior.

Phase 19B through Phase 19H also remain planned and inactive. No Interview
Coach, Learning Workspace, Dashboard, authentication, shared-shell, migration,
or production-release work begins here.

The operator reviewed this corrected written specification and explicitly
provided:

`PHASE_19A3_RESUME_SAVE_RECOVERY_EXPORT_DESIGN_APPROVED`.

The token is `ACCEPTED / YES`. The conversational and repository designs are
human-approved and frozen. This approval authorizes documentation closeout
only; production implementation remains inactive, no implementation plan has
been created, and implementation planning is the next separately authorized
activity.

## Documentation completion boundary

This specification is the only new design document authorized by the current
task. `docs/planning/CURRENT_PHASE.md` records its human-approved design state
and inactive implementation boundary. No production source, tests,
package/lockfile, backend contract, database, environment, plan, generated
output, browser evidence, or provider state is changed. Git staging, commit,
push, merge, PR, and deployment remain operator-controlled and unperformed.
