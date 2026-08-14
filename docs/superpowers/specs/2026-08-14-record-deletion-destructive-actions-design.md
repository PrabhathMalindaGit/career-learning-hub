# Record Deletion & Destructive Actions — Design Specification

**Date:** 2026-08-14
**Status:** Design approved by the user; written specification awaiting user approval
**Task branch:** `task/record-deletion-destructive-actions`
**Base branch:** `main`
**Base commit:** `91f911f013fa35b4288f4299237b19c14a07d187`

## 1. Purpose

Career Learning Hub currently lets users create persistent Resume, Interview, and Learning records, but deletion is inconsistent:

- Learning already has a secure permanent-deletion workflow, but the delete action is only visible after opening a document workspace.
- Resume Studio has no whole-Resume delete API or UI.
- Interview Coach supports archive/restore lifecycle behavior but has no permanent session delete API or UI.

This task adds the smallest secure and consistent record-lifecycle behavior needed for a university project. It does not introduce a Trash system, retention service, soft-delete framework, generic deletion platform, or unrelated product work.

## 2. Controlling project constraint

Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

For this task, that means:

- reuse the existing Learning deletion implementation rather than replacing it;
- add bounded owner-scoped cascades for Resume and Interview only;
- preserve Interview archive/restore as the normal non-destructive lifecycle path;
- use explicit permanent-delete confirmation in the UI;
- block permanent deletion while related AI work is actively queued or processing instead of adding a new deletion-job architecture;
- avoid broad shared-framework refactors.

## 3. Verified current state

### 3.1 Learning

The backend already exposes authenticated `DELETE /learning-documents/:documentId` with parameter validation and `requireOwnedLearningDocument` ownership enforcement.

The existing Learning deletion service already:

- fences/cancels relevant Learning work;
- removes the backing document asset;
- deletes owned messages, conversations, flashcards, flashcard sets, quiz attempts, quiz questions, quizzes, document chunks, and the LearningDocument record;
- records a deletion activity event.

The existing frontend `LearningDocumentDeletion` component already provides:

- permanent-action warning;
- exact document-title confirmation;
- queued/processing deletion observation;
- polling pause/reconciliation/failure handling;
- navigation after canonical deletion.

The current Learning library card renders only `Open workspace`; the delete control is rendered inside `LearningDocumentWorkspace`.

### 3.2 Resume

The Resume router currently supports creation, listing, workspace fetch, design updates, immutable version creation/listing/fetching, and Candidate Photo operations. It does not expose `DELETE /resumes/:resumeId`.

A Resume owns or is referenced by the following current records:

- `Resume` — root user-owned record;
- `ResumeVersion` — `resumeId`, with optional `sourceAssetId` for imported PDF provenance;
- `ResumeAnalysis` — `resumeId` and `resumeVersionId`;
- Candidate Photo Asset — referenced by `Resume.candidatePhotoAssetId`, with `metadata.resumeId` on the Asset;
- imported Resume source Assets — referenced by `ResumeVersion.sourceAssetId` and promoted with Resume metadata after confirmed import;
- Resume analysis jobs — `resume.analyze` payload includes `resumeId` and optional version context;
- confirmed Resume import jobs — after adoption, the terminal `resume.import-pdf` result records the adopted `resumeId`/version identity.

An in-flight import job that has not yet been confirmed does not yet own an existing Resume and therefore is not treated as an active job of a Resume that is being deleted.

The existing Asset service prevents deleting an attached active Resume Photo directly, which means whole-Resume deletion must perform a deliberate cascade rather than calling the public photo-delete route blindly.

### 3.3 Interview

The Interview router currently supports session creation/listing/fetching, status changes, questions, attempts, explanations, and feedback. It does not expose `DELETE /interview-sessions/:sessionId`.

An Interview session owns:

- `InterviewSession` — root user-owned record;
- `InterviewQuestion` — `sessionId`;
- `InterviewAttempt` — `sessionId` and `questionId`;
- Interview AI jobs — all current Interview job payloads include `sessionId`.

No inspected Interview Session, Question, or Attempt model contains an interview-audio Asset reference. This task must not invent audio-asset cleanup without repository evidence.

### 3.4 Activity history

The application uses a lightweight ActivityEvent ledger. Existing Learning deletion records a deletion event rather than purging historical activity. Resume and Interview deletion will follow that established pattern: historical activity may retain opaque deleted resource IDs and ordinary event metadata, but no deleted domain record should remain accessible through its feature API.

## 4. Approaches considered

### Approach A — Bounded permanent deletion with existing Learning reuse — SELECTED

- Keep Learning's existing deletion backend and state machine.
- Expose Learning deletion from the library in a discoverable secondary destructive action.
- Add owner-scoped Resume and Interview permanent-delete endpoints.
- Delete only verified dependent records/assets/jobs.
- Block Resume/Interview deletion while a related job is queued or processing.
- Keep archive/restore for Interview.

Why selected: it satisfies the user's lifecycle need while preserving existing architecture and avoiding new infrastructure.

### Approach B — Archive/soft-delete everything — REJECTED

This would add status semantics and filtering without actually giving the user a permanent deletion path. It also creates more retention and restore rules. Interview already has archive/restore; extending that pattern to Resume and Learning would not solve the stated problem.

### Approach C — Universal asynchronous deletion jobs / Trash framework — REJECTED

A generic deletion worker, tombstones, undo windows, retention schedules, and shared orchestration would be significantly more complex than the current academic MVP requires. Learning already needs async deletion because of its broader stored-document workload; Resume and Interview do not need that architecture for ordinary deletion.

## 5. User-visible behavior

### 5.1 Resume Studio

Each Resume card gains a compact secondary destructive action, visually subordinate to `Open Resume`.

Selecting `Delete resume` opens an accessible confirmation dialog that:

- identifies the Resume by title;
- states that versions, analyses, attached Candidate Photo, and associated imported source files will be removed;
- states that deletion cannot be undone;
- requires typing the exact Resume title before the destructive submit button is enabled;
- prevents duplicate submit while busy;
- preserves/focuses an accessible error surface if deletion fails.

On success:

- the deleted card disappears from the current collection;
- pagination/list state is refreshed from the server;
- if deletion is later exposed from the Resume workspace as part of this same bounded task, successful deletion navigates back to `/resumes`.

The minimum acceptance surface is the collection card because that is the user-visible gap reported here. Workspace exposure is permitted only if it reuses the same API/dialog behavior without creating a second deletion implementation.

### 5.2 Interview Coach

Archive remains the ordinary lifecycle action. Permanent deletion is a separate secondary destructive action.

Each session card gains `Delete permanently` through a compact destructive action area that does not compete visually with `Open session`, `Restore session`, or lifecycle status.

The confirmation dialog:

- identifies the session by title/role;
- explains that questions and Saved Attempts/Attempt History will be permanently removed;
- states that deletion cannot be undone;
- requires typing the exact stored session title;
- prevents duplicate submission;
- exposes server/request errors accessibly.

On success the session is removed from the current filtered list and the list/pagination are refreshed.

Deletion is available for active, completed, and archived sessions. Archive is not a prerequisite for permanent deletion.

### 5.3 Learning Workspace

The existing workspace `Delete document` action remains available and keeps its current confirmation/polling behavior.

The Learning library gains a clear secondary `Delete document` action on each deletable document card. The implementation must reuse the existing Learning deletion behavior rather than create a second deletion API/state machine.

If the existing deletion component is rendered more than once on the library page, dialog IDs and labels must remain unique and accessible per document. Library deletion must refresh the canonical document list after acceptance/completion and must not expose private storage identifiers.

Documents already in `deleting` state must not show a fresh duplicate delete trigger.

## 6. API design

### 6.1 Resume

Add:

`DELETE /api/v1/resumes/:resumeId`

Requirements:

- authenticated request;
- existing Resume ID validation;
- owner-scoped lookup; another user's Resume must remain indistinguishable from an absent resource under existing ownership conventions;
- no title is trusted from the client for authorization or cascade selection;
- successful canonical deletion returns `204 No Content`; the existing frontend API client already handles 204 responses;
- repeated deletion after canonical removal returns the existing not-found behavior rather than silently targeting another record.

### 6.2 Interview

Add:

`DELETE /api/v1/interview-sessions/:sessionId`

Requirements:

- authenticated request;
- validated params;
- `requireOwnedInterviewSession` or an equivalent owner-scoped service check;
- no client-supplied cascade IDs;
- successful canonical deletion returns `204 No Content`;
- repeated/foreign deletion receives established not-found behavior.

### 6.3 Learning

Do not create a new Learning deletion endpoint. Reuse the existing authenticated owner-scoped route and existing frontend API helpers.

## 7. Resume cascade contract

The Resume deletion service must use only server-derived IDs from the owned Resume and its owned dependent records.

The cascade must remove:

1. the owned `Resume`;
2. all owned `ResumeVersion` records with that `resumeId`;
3. all owned `ResumeAnalysis` records with that `resumeId`;
4. the current Candidate Photo Asset referenced by `candidatePhotoAssetId`, if present and owned;
5. owned imported source Assets referenced by the deleted Resume's `ResumeVersion.sourceAssetId` values;
6. terminal/cancelled `resume.analyze` JobRecords whose typed payload contains this `resumeId`;
7. terminal confirmed `resume.import-pdf` JobRecords whose typed adopted result identifies this `resumeId`.

The cascade must not delete:

- another user's record or Asset;
- Assets merely because they share a generic purpose;
- unrelated Resume exports/thumbnails unless a direct current Resume association is proven by repository fields/metadata during implementation;
- unconfirmed import jobs that do not yet belong to an existing Resume;
- historical ActivityEvents.

### 7.1 Resume asset handling

Candidate Photo and imported source Assets are private user data and must become inaccessible when the Resume is deleted.

Implementation should reuse the current Asset storage/provider abstractions. Because object storage and MongoDB cannot share one atomic transaction, the implementation plan must preserve a clear ordering and failure contract:

- never report successful Resume deletion while the canonical Resume/dependent database records still exist;
- never use client-provided Asset IDs for cascade selection;
- collect only owned server-derived Asset identity/provider/storage metadata needed for cleanup;
- ensure any Asset record included in the canonical database cascade is marked `deleted` with `deletedAt` and is no longer eligible for signed access;
- after canonical database deletion, attempt physical object removal through the existing storage provider using only the previously verified server-derived storage identity;
- if physical cleanup fails after canonical database deletion, retain enough deleted Asset metadata for diagnosis/manual cleanup and log only sanitized identifiers/error information. Do not restore the deleted Resume merely to compensate for an external storage failure.

This bounded best-effort physical cleanup is acceptable for the academic MVP; a durable object-deletion retry subsystem is explicitly out of scope.

## 8. Interview cascade contract

The Interview deletion service must remove, for the owned session:

1. all owned `InterviewAttempt` records with the session ID;
2. all owned `InterviewQuestion` records with the session ID;
3. the owned `InterviewSession` record;
4. terminal/cancelled Interview JobRecords whose typed payload contains that session ID.

The operation must not modify source Resume records referenced by `sourceResumeId` or `sourceResumeVersionId`. Those are optional source references, not children of the Interview session.

Historical ActivityEvents remain as lightweight history; record a new deletion event after successful canonical deletion.

## 9. Active-job and race policy

Resume and Interview use AI jobs that can persist results back into feature records. Permanent deletion must therefore define a bounded race rule.

### Selected policy

Before the destructive database cascade, query only jobs owned by the same user and directly associated with the target resource through typed current job fields:

- Resume: active `resume.analyze` jobs whose payload contains the target `resumeId`;
- Interview: active Interview jobs whose payload contains the target `sessionId`.

If any matching job is currently `queued` or `processing`:

- do not partially delete the feature record;
- return HTTP `409` with a feature-specific safe error: `RESUME_DELETE_BLOCKED_BY_ACTIVE_JOB` or `INTERVIEW_DELETE_BLOCKED_BY_ACTIVE_JOB`;
- tell the frontend that AI work must finish or be cancelled before permanent deletion;
- preserve the record unchanged.

Why: this reuses the application's existing job lifecycle and avoids introducing deletion tombstones or a second asynchronous deletion system.

After the active-job check passes, the cascade deletes matching terminal/cancelled JobRecords as defined above. Confirmed Resume import history is matched by its typed terminal adopted result, not by broad free-form payload inspection.

### Race invariant

A late or concurrently racing worker must not recreate a deleted Resume/Interview parent. Existing job execution persistence fences and service-level owner/resource checks must remain authoritative. Integration tests must cover the relevant no-resurrection behavior for any race that can be reproduced deterministically with the current worker architecture.

Do not weaken existing job fencing, retries, lease/deadline behavior, or single-flight protections to make deletion tests pass.

## 10. Database consistency

Resume and Interview record cascades must use the existing MongoDB transaction helper for related database mutations where supported by the current architecture.

Expected transactional database scope:

### Resume

- verify owned Resume still exists;
- re-check/block matching active `resume.analyze` jobs as close as practical to mutation;
- collect server-derived associated Asset IDs and cleanup metadata;
- delete ResumeAnalysis records;
- delete ResumeVersion records;
- delete matching terminal/cancelled Resume JobRecords;
- delete the Resume;
- mark directly associated Asset records deleted/inaccessible.

After commit, perform bounded best-effort physical cleanup of the previously verified Asset storage objects.

### Interview

- verify owned InterviewSession still exists;
- re-check/block matching active Interview jobs;
- delete InterviewAttempts;
- delete InterviewQuestions;
- delete matching terminal/cancelled Interview JobRecords;
- delete InterviewSession.

If the Mongo transaction fails, the API must fail without claiming successful canonical deletion.

## 11. Security and privacy invariants

The implementation must preserve:

- authentication on every destructive route;
- owner scoping on root and dependent records;
- no IDOR through child/Asset/job IDs;
- generic not-found behavior for missing/foreign root resources according to existing conventions;
- no private file path/storage key in API responses;
- no document/Resume content, answers, job descriptions, or other sensitive payloads in deletion logs;
- request IDs/error envelopes according to existing middleware behavior;
- Quiz answer secrecy and unrelated Learning behavior;
- immutable ResumeVersion semantics before deletion;
- Interview Saved Attempts immutability before deletion;
- Gemini-only provider policy; deletion itself must make no Gemini call.

Deletion confirmation text in the frontend is an accidental-action guard, not an authorization mechanism. Backend ownership remains authoritative.

## 12. Error behavior

Required user-facing cases:

- `404`/established absent-resource behavior: record does not exist or is not owned;
- `409` active-job block: wait for or cancel current AI work before deleting;
- network/5xx failure before canonical success: keep the dialog/error surface actionable and do not optimistically claim deletion;
- physical Asset cleanup failure after canonical Resume deletion: the Resume remains deleted, the affected Asset record remains marked deleted/inaccessible, and only sanitized cleanup diagnostics are logged;
- duplicate clicks: one request at a time from each UI control;
- after uncertain network failure, reloading the canonical collection is the authority for whether the record still exists.

No automatic destructive retry loop and no durable storage-cleanup retry subsystem are authorized.

## 13. Frontend implementation boundaries

Expected touched areas are bounded to existing feature/API/test/style files, for example:

- Resume: `ResumeListPage`, `resumeApi`, Resume contracts/tests/styles and a small feature-local delete-confirmation component if needed;
- Interview: `InterviewSessionCard`, `InterviewSessionListPage`, `interviewApi`, Interview contracts/tests/styles and a small feature-local delete-confirmation component if needed;
- Learning: `LearningDashboard`, existing `LearningDocumentDeletion`, relevant tests/styles/API only if required for library reuse;
- backend Resume/Interview routes/controllers/services/tests;
- Job/Asset helpers only if a narrowly scoped helper is required for resource-safe cascade behavior.

Do not create a new global form framework, global state store, deletion framework, design system, router architecture, or generic resource repository.

A tiny shared confirmation primitive is allowed only if repository inspection during implementation proves it reduces duplication without forcing Learning's existing specialized async deletion flow into an unsuitable abstraction. Default preference is feature-local, surgical changes.

## 14. Testing strategy

Implementation must be test-driven for new behavior.

### 14.1 Backend Resume tests

Cover at minimum:

- owner can delete Resume;
- Resume disappears from get/list;
- all ResumeVersions removed;
- all ResumeAnalyses removed;
- directly associated Candidate Photo/import Assets become deleted/inaccessible and physical delete is invoked through the storage abstraction where testable;
- unrelated user/Resume/assets remain untouched;
- foreign/missing Resume cannot be deleted;
- active related queued/processing `resume.analyze` job returns `409` and no partial cascade occurs;
- matching terminal/cancelled analysis jobs and confirmed adopted import job history are removed as specified;
- unconfirmed import job not associated with the Resume is untouched;
- transaction failure does not report success;
- no deleted record can be resurrected by the tested worker/persistence path.

### 14.2 Backend Interview tests

Cover at minimum:

- owner can permanently delete active/completed/archived session;
- questions and attempts are removed;
- unrelated/foreign session data remains untouched;
- source Resume references are not deleted;
- active related job returns `409` with no partial cascade;
- terminal/cancelled related jobs are removed;
- missing/foreign session follows established not-found behavior;
- tested late worker/persistence path cannot recreate the deleted parent.

### 14.3 Learning regression tests

Cover:

- library exposes one accessible delete action per deletable card;
- confirmation still requires exact title;
- existing workspace deletion still works;
- no duplicate accessible dialog IDs/labels when multiple documents are listed;
- accepted deletion refreshes/removes the library record;
- `deleting` documents do not create a second delete request;
- existing polling/reconciliation tests remain green.

### 14.4 Frontend Resume/Interview tests

Cover:

- destructive action is discoverable but secondary;
- exact-title confirmation;
- destructive submit disabled until confirmation is exact;
- duplicate submit blocked;
- success removes/refreshes record;
- active-job `409` message is clear;
- generic/request-ID errors remain accessible;
- keyboard Escape/Tab/focus restoration behavior for dialogs;
- archive/restore Interview behavior remains unchanged.

## 15. Verification gates

After implementation, the user will run the exact commands provided by ChatGPT from the task branch and paste complete output.

Minimum expected gates:

- focused backend Resume/Interview deletion tests;
- focused frontend Resume/Interview/Learning deletion tests;
- relevant ownership/security/integration regressions;
- backend production + test typecheck;
- frontend typecheck;
- production builds;
- `git diff --check origin/main...HEAD`;
- exact changed-file review;
- clean worktree;
- human browser QA at desktop, tablet, and mobile widths for the three collection surfaces and confirmation dialogs.

A full repository regression suite may be required before final merge if the implementation touches shared Job/Asset helpers used outside these features.

No live Gemini call is required for deletion acceptance unless a regression specifically requires verifying job interaction; deletion itself must never call Gemini.

## 16. Browser QA acceptance

Human QA must verify:

- Resume: card delete → confirmation → cancel → confirm → removal;
- Interview: archive/restore remains intact; permanent delete is visibly distinct and works for at least one session;
- Learning: library delete is discoverable without first opening the workspace; workspace delete remains intact;
- confirmation dialogs fit without horizontal overflow at desktop/tablet/mobile widths;
- keyboard focus enters the dialog, remains contained where required, Escape/cancel restores focus, and final destructive action has clear focus state;
- destructive actions are not color-only and do not visually overpower primary `Open` actions.

## 17. Explicitly out of scope

Do not add:

- Trash / recycle bin;
- undo or restore for permanent deletion;
- 30-day retention;
- scheduled deletion;
- account-wide bulk deletion;
- multi-select deletion;
- generic resource-deletion framework;
- new worker solely for Resume/Interview deletion;
- new database migration unless implementation proves one is strictly required;
- unrelated Phase 19C Learning refinements;
- Dashboard/Auth/Shell work;
- new AI providers;
- deployment changes.

Do not deploy, delete branches, or activate Phase 19C or any later phase through this task.

## 18. Git and PR governance

- Work only on `task/record-deletion-destructive-actions`.
- Base is `main` at `91f911f013fa35b4288f4299237b19c14a07d187`.
- The written specification must be reviewed and approved by the user before implementation planning/code changes.
- After spec approval, create the implementation plan under `docs/superpowers/plans/` and obtain separate plan + inline-execution approval.
- Use a draft PR targeting `main` for the task.
- User-run local verification is required before implementation acceptance.
- Implementation approval does not equal merge approval.
- Merge requires a separate explicit user approval after final review.
- No deployment is authorized.
- No branch deletion is authorized.

## 19. Success state

The task is successful when:

- a user can permanently delete an owned Resume from Resume Studio with explicit confirmation;
- a user can permanently delete an owned Interview session while archive/restore remains the normal reversible lifecycle path;
- a user can discover and invoke existing Learning document deletion directly from the document library as well as the workspace;
- verified dependent records are removed without touching another user's data;
- directly associated private Resume Assets become inaccessible and are physically cleaned up on a bounded best-effort basis;
- active AI work blocks Resume/Interview deletion safely instead of racing the cascade;
- no deleted parent can be recreated by the tested job persistence path;
- existing Learning deletion resilience remains intact;
- no Trash/soft-delete/deletion-framework overengineering is introduced;
- all focused, ownership/security, typecheck/build, diff, and human UI gates pass before merge.
