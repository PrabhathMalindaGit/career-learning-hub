# Learning Workspace Migration Plan

## 1. Executive Decision

Build Phase 12 as a production frontend integration over the existing Career
Learning Hub learning, asset, authentication, and job architecture. Do not
reuse legacy authentication, routes, models, storage, provider calls, parsing,
or client state.

The active backend has a READY-family capability for 16 of 19 assessed areas:
1 is `READY` and 15 are `READY WITH FRONTEND WORK`. One contract area is a
`GAP`, and two optional legacy behaviors are `UNSUPPORTED`. The operator
approved the smallest bounded Phase 12 backend/shared-contract extension for
the original private PDF gap.

## 2. Governing Principles

- The active repository architecture is authoritative.
- Authenticated ownership is mandatory.
- Private learning documents remain private.
- Page references must be factual and come from validated server data.
- AI output must be structured, validated, bounded, and allowlisted.
- Quiz answer keys remain secret before successful submission.
- Destructive deletion must be explicitly confirmed, retryable, and complete.
- The UI must not imply OCR support.
- Legacy infrastructure, authentication, storage, APIs, provider coupling,
  models, and parsing are not reused.
- Access tokens stay in React memory; refresh tokens stay in the existing
  HttpOnly cookie.
- Private drafts, document content, jobs, messages, answers, and identifiers
  are not persisted in browser storage or logs.

## 3. Legacy-to-Active Architecture Mapping

| Legacy responsibility | Active destination | Decision |
|---|---|---|
| React/Vite screens | Existing `frontend/` shell, router, and `features/learning/` | Rebuild presentation and integration; reference selected workflows. |
| Hard-coded Axios client | `frontend/src/api/apiClient.ts` | Use existing client only. |
| `localStorage` JWT | Existing auth provider and refresh flow | Reject legacy behavior. |
| Express JavaScript routes | Existing TypeScript `/api/v1` routes | Active contracts are authoritative. |
| Local public upload folder | Active private Asset service/storage | Reject public paths. |
| In-process PDF promise | `learning.document.process` job | Use durable owned job and polling. |
| Whole-text page-zero chunks | `DocumentChunk` with `pageStart/pageEnd` | Use active page-preserving chunks. |
| Embedded chat message array | `Conversation` and `Message` collections | Use separate paginated records. |
| Direct Gemini calls | Active AI gateway and learning job handlers | Use server-only structured output. |
| Embedded flashcards/questions | `FlashcardSet`, `Flashcard`, `Quiz`, `QuizQuestion` | Use separate owned collections and pagination. |
| Mutable quiz result | Immutable `QuizAttempt` records | Use server-authoritative submission and history. |
| Parent-only delete | `learning.document.delete` cascade job | Use the active transactional cascade. |

## 4. Approved Product Capabilities

- Owned document library with upload, pagination, status filter, and canonical
  processing state.
- PDF-only upload with clear local guidance and server-authoritative
  validation.
- Document workspace with validated metadata, summary, key points, and
  page-aware extracted content.
- Multiple owned conversations per document with paginated history.
- Explicit grounded questions, owned asynchronous response jobs, and factual
  source pages.
- Explicit flashcard-set generation with bounded count, title, optional focus,
  idempotency, job progress, set listing, card pagination, and accessible study.
- Explicit quiz generation with bounded question count, title, optional focus,
  idempotency, job progress, quiz listing, answer selection, submission,
  immutable attempt history, and authorized review.
- Explicit document deletion confirmation with dependent-data disclosure and
  job progress.
- Loading, empty, validation, unavailable, failed, stale, paused, and success
  states.

## 5. Rejected Legacy Behaviors

- Public upload URLs or static upload directories.
- Persistent browser bearer tokens or user records.
- Client-supplied user IDs.
- Full document records containing private storage or infrastructure fields.
- Page `0`, inferred pages, or unverified citations.
- Raw Markdown/HTML rendering of AI output.
- Direct provider/model selection from the client.
- Delimiter-based provider parsing.
- Synchronous or in-process background AI/PDF work.
- Answer keys or explanations in quiz lists, generation responses, or
  pre-submission detail.
- Client-authoritative scoring.
- Mutable single-result quizzes.
- Parent-only document deletion or ignored asset deletion failures.
- Random streaks, mock metrics, sample document content, or fabricated scores.
- Private content, prompts, answers, or provider errors in logs.

## 6. Active Backend Contract Readiness

`READY WITH FRONTEND WORK` means source evidence shows the backend
responsibility exists, while the current production route still renders a
deferred page and the frontend needs validators, state, and views. No status in
this table is a runtime verification claim.

| ID | Capability | Status | Active evidence | Phase 12 work or gap |
|---|---|---|---|---|
| AB-001 | Private PDF validation/storage | READY | `asset.policy.ts:validateAssetFile`; `learningDocument.service.ts:createLearningDocumentUpload` | Build upload UI and validate the response. |
| AB-002 | Processing and owned job polling | READY WITH FRONTEND WORK | `learning.controller.ts:uploadLearningDocumentController`; `learning.jobs.ts`; `jobs/job.routes.ts` | Add bounded poller, job type/result identity checks, pause/retry UI. |
| AB-003 | Document list/detail/status | READY WITH FRONTEND WORK | Learning document GET routes and `serializeLearningDocument` | Add list/detail wrappers, filters, pagination, validators, and routes. |
| AB-004 | Original private PDF viewing | GAP | Active document DTO omits `assetId`; no learning route returns a download target | Implement the approved smallest bounded owner-authorized, short-lived viewing/download target without exposing asset internals. |
| AB-005 | Page-preserving chunks | READY WITH FRONTEND WORK | `documentProcessing.service.ts:extractPdfPages/buildChunks`; chunks route | Validate page ranges and paginate page-aware text. |
| AB-006 | Stored structured summary | READY WITH FRONTEND WORK | `documentSummaryResultSchema`; `serializeLearningDocument` | Render summary/key points as text; no new generation call. |
| AB-007 | Conversation list and message history | READY WITH FRONTEND WORK | Conversation create/list and message list routes | Add missing list-conversation wrapper, validators, pagination, and selection. |
| AB-008 | Grounded chat | READY WITH FRONTEND WORK | `learningChat.service.ts:generateDocumentChatResponse` | Send explicit request ID, poll, validate, refetch canonical messages. |
| AB-009 | Source pages and grounding identity | READY WITH FRONTEND WORK | Verified cited chunks become stored `sourceChunkIds/sourcePages` | Render only validated server pages and bind them to the current document. |
| AB-010 | Flashcard generation | READY WITH FRONTEND WORK | Flashcard-set POST route and `generateFlashcards` | Add form, UUID lifecycle, job polling, status handling. |
| AB-011 | Flashcard set/card reads | READY WITH FRONTEND WORK | `/api/v1/flashcard-sets` routes; `listFlashcards` | Add missing set list/detail wrappers, validators, pagination, and study view. |
| AB-012 | Persisted card review/star state | UNSUPPORTED | No active review or star route/model fields | Keep study transient or require a separately approved backend change. |
| AB-013 | Quiz generation | READY WITH FRONTEND WORK | Quiz POST route and `generateQuiz` | Add form, UUID lifecycle, job polling, canonical reload. |
| AB-014 | Quiz list and safe taking detail | READY WITH FRONTEND WORK | Quiz list route; `getQuizForTaking` selects prompt/choices/pages only | Validate explicit allowlist and reject all key-like fields. |
| AB-015 | Submission, scoring, and review | READY WITH FRONTEND WORK | `submitQuizAttempt`; exact answer checks; server score and review | Gate submission, preserve drafts on failure, adopt canonical review. |
| AB-016 | Immutable attempt history/detail | READY WITH FRONTEND WORK | Quiz history/list/detail routes and `QuizAttempt` model | Add missing account/detail wrappers, validators, pagination, and route binding. |
| AB-017 | Document cascade deletion | READY WITH FRONTEND WORK | `cascadeDeleteLearningDocument`; owned deletion job | Confirm, enqueue once, poll, and remove UI only after canonical success. |
| AB-018 | Standalone set/quiz deletion | UNSUPPORTED | No DELETE route for active sets or quizzes | Exclude from Phase 12. |
| AB-019 | Private no-store and owned 404 boundaries | READY WITH FRONTEND WORK | `app.ts` private no-store middleware; learning ownership middleware | Preserve request IDs, safe errors, and nested identity validation. |

Readiness totals:

- `READY`: 1
- `READY WITH FRONTEND WORK`: 15
- READY-family total: 16
- `GAP`: 1
- `UNSUPPORTED`: 2
- `REQUIRES VERIFICATION`: 0 as a contract classification; all 19 remain
  runtime-unverified in this documentation phase.

## 7. Phase 12 Frontend Scope

### Document library

- Replace the deferred `/learning` page with an owned paginated document list.
- Support canonical status filtering and clear uploaded, processing, ready,
  failed, and deleting labels.
- Provide explicit upload and deletion entry points.

### Upload flow

- Collect bounded title and one PDF.
- Show the active 15 MB policy as guidance without treating client checks as
  authoritative.
- Preserve the selected file/title after recoverable failure.
- On `202`, validate both document and processing job before updating state.

### Processing status and job progress

- Poll the owned job endpoint after upload, chat, flashcard generation, quiz
  generation, and deletion.
- Stop on completion, failure, cancellation, auth failure, owned 404, malformed
  data, wrong type, identity mismatch, route change, or unmount.
- A client timeout pauses polling and does not claim backend cancellation.

### Document detail and page-aware content

- Load the route-owned document and paginated chunks.
- Render stored summary and key points only after validation.
- Display factual page ranges from server chunks.
- Do not label scanned/image-only files as supported; surface the canonical OCR
  limitation.
- Original-PDF display uses the approved OD-001 Option B extension. Extracted
  chunks remain authoritative for grounded page references.

### Grounded chat and conversation history

- Create, list, and select conversations under the current document.
- Paginate messages and maintain canonical order.
- Keep the draft in component memory.
- Send one UUID per unresolved message intent, poll the returned job, then
  refetch messages.
- Render assistant content as escaped text and show server source-page controls.

### Flashcard sets and study

- List owned sets by current document and open a set route.
- Generate with bounded count, title, optional focus, and one UUID per intent.
- Poll generation, then load canonical set/card records.
- Study by keyboard-accessible reveal and navigation. Do not persist stars,
  review counts, or local copies.

### Quizzes, submission, and review

- List owned quizzes and generate from a ready document.
- Load the safe quiz-taking DTO.
- Keep answer drafts in memory and bind them to quiz/question identities.
- Require every question to have one answer before submission.
- Submit once, preserve the draft on failure, and show answer keys only from a
  validated successful response or owned completed-attempt detail.
- Provide paginated attempt history and immutable review.

### Deletion confirmation

- Name the document and dependent conversations, messages, chunks, flashcards,
  quizzes, attempts, and source asset in the confirmation.
- Disable duplicate writes, enqueue once, poll the exact deletion job, and
  navigate only after validated success or canonical owned 404.

### Operational states

- Every list and workspace supports loading, empty, error, success, retry, and
  stale-response handling.
- AI actions also support unavailable, queued, processing, paused, failed,
  cancelled, and completed states.

## 8. Proposed Frontend Route Map

These are frontend routes over existing backend contracts. They do not define
new API endpoints.

| Frontend route | Purpose |
|---|---|
| `/learning` | Document library, status filter, upload, deletion entry |
| `/learning/documents/:documentId` | Metadata, summary, page-aware chunks, study overview |
| `/learning/documents/:documentId/conversations/:conversationId` | Grounded chat and paginated history |
| `/learning/documents/:documentId/flashcards/:setId` | Owned flashcard set and study |
| `/learning/documents/:documentId/quizzes/:quizId` | Quiz taking or completed-state handoff |
| `/learning/documents/:documentId/quizzes/:quizId/attempts/:attemptId` | Immutable answer review |

The router must preserve the authenticated shell and existing public-only/auth
redirect behavior.

## 9. Proposed Feature/Component Boundaries

Keep all new production code within the existing learning feature unless a
separate scope change is approved.

```text
frontend/src/features/learning/
├── api/
│   ├── learningApi.ts
│   ├── learningContracts.ts
│   └── learningValidators.ts
├── documents/
│   ├── LearningDocumentListPage.tsx
│   ├── LearningDocumentWorkspace.tsx
│   ├── LearningDocumentUpload.tsx
│   ├── LearningDocumentSummary.tsx
│   ├── LearningDocumentChunks.tsx
│   └── LearningDocumentDeleteDialog.tsx
├── chat/
│   ├── ConversationList.tsx
│   ├── ConversationWorkspace.tsx
│   └── GroundedMessage.tsx
├── flashcards/
│   ├── FlashcardSetList.tsx
│   ├── FlashcardGenerationForm.tsx
│   └── FlashcardStudy.tsx
├── quizzes/
│   ├── QuizList.tsx
│   ├── QuizGenerationForm.tsx
│   ├── QuizTaker.tsx
│   ├── QuizAttemptHistory.tsx
│   └── QuizAttemptReview.tsx
├── jobs/
│   └── useLearningJob.ts
└── learningWorkspace.css
```

This is a responsibility map, not authorization to create all files
unconditionally. Phase 12 should keep existing components where they meet the
contract after tests and remove only placeholder data made obsolete by the
integration.

## 10. Runtime Contract and Validator Requirements

- Every API result enters the feature as `unknown`.
- Validate success/error envelopes and preserve request IDs.
- Allowlist identifiers, statuses, timestamps, pagination, counts, and optional
  processing/generation errors.
- Validate route identity against returned document, conversation, set, quiz,
  attempt, and job identities.
- Validate job type, status, progress, attempts, error, and type-specific result.
- Reject unknown key-like quiz fields in list and pre-submission taking DTOs,
  including `correctAnswer`, `correctChoiceIndex`, `answerKey`, and
  `explanation`.
- Validate page ranges as positive integers with `pageStart <= pageEnd` and
  pages bounded by the document page count where available.
- Validate contiguous unique card/question indexes, unique quiz choices, exact
  answer count, score bounds, and review identity.
- Strip unknown fields before React receives the value.
- Use `AbortController`, monotonic request sequencing, route/resource checks,
  canonical response adoption, and canonical reload after mutations.
- Extend the existing shared client. Do not add a second client or state
  library.

## 11. Ownership and IDOR Requirements

- Never send a user ID.
- Require authenticated server-derived ownership for every resource.
- Preserve these nested bindings:
  - `documentId + userId`
  - `conversationId + documentId + userId`
  - `setId + userId`, with returned `documentId` matched in the client
  - `quizId + userId`, with returned `documentId` matched in the client
  - `attemptId + quizId + userId`
  - `jobId + userId`
- A foreign ID must remain indistinguishable from a missing ID.
- Never add client diagnostics that reveal whether a foreign resource exists.
- On route changes, abort reads and ignore any response for the previous
  document/conversation/set/quiz/attempt.

## 12. Private Asset Requirements

- Use only active private asset storage.
- Never show `storageKey`, provider, checksum, internal asset metadata, or a
  permanent public URL.
- Do not persist signed URLs in browser storage or logs.
- Expired signed/download state must require a fresh authorized request.
- Render the source PDF only through the OD-001 Option B owner-authorized,
  short-lived target.
- The contract must expose no permanent public URL, storage key, provider,
  checksum, internal asset metadata, cookie, authorization header, or arbitrary
  response header.
- The target must expire after a bounded duration, require fresh authorization
  after expiry, preserve safe owned-404 behavior, and never appear in browser
  storage, logs, analytics, or route query parameters.
- Chunk text remains private and must not be copied to analytics or console.
- The upload UI must not claim OCR, malware scanning, or file formats the
  backend does not support.

## 13. Grounded Chat and Source Requirements

- Chat must be document- and conversation-owned.
- One UUID represents one unresolved send intent. Reuse it only for the same
  uncertain in-flight result, never for a distinct message.
- Do not automatically resend provider work after terminal failure.
- Assistant messages must come from canonical message history after job
  completion.
- Render content as text. Do not render raw Markdown or HTML.
- Treat `sourcePages` as references, not proof beyond the cited page.
- Page controls must keep the current document identity and reject pages
  outside its validated range.
- If the backend returns no source pages or states insufficient evidence, the
  UI must not invent a citation or present the answer as document fact.

## 14. Flashcard Requirements

- Generate only from a ready owned document.
- Enforce client guidance within the server's 1 through 100 bound; the server
  remains authoritative.
- Preserve title, count, optional focus, UUID, set ID, and job ID identities.
- Accept only ready sets with the expected document and validated contiguous
  cards.
- Show source pages when present.
- Reveal uses a button or equivalent keyboard-operable control, announces
  question/answer state, preserves focus, and respects reduced motion.
- Do not fabricate mastery, spaced-repetition quality, progress, stars, or
  review counts.
- Do not persist card content or study position outside React memory.

## 15. Quiz Answer-Key Secrecy Requirements

- No answer keys appear in list, generation, job, or pre-submission detail
  responses.
- No client-authoritative scoring.
- Correct answers and explanations are revealed only through an authorized
  successful-submission review or an owned completed-attempt detail.
- Validate quiz and attempt ownership and nested identities.
- Submitted attempts are immutable.
- A submission contains exactly one bounded selected choice for every expected
  question index.
- Preserve drafts after validation, network, auth, conflict, or server failure.
- Clear a draft only after validated canonical success.
- Retry and refresh must not expose answers early or create an accidental
  duplicate attempt.
- Errors, request IDs, logs, telemetry, and job results must not contain answer
  keys.
- React state containing review keys exists only after the authorized response
  and must be discarded on quiz/account change and logout.

## 16. AI Job and Idempotency Requirements

- Use the returned owned job ID and expected type for every async operation.
- The client UUID belongs to one unresolved message/generation intent.
- Disable duplicate writes while the canonical outcome is known to be pending.
- Poll after 1, 2, 3, and 5 seconds, then every 8 seconds.
- Pause after five minutes from enqueue or three consecutive transient polling
  failures.
- Stop on completed, failed, cancelled, unmount, route/resource change, auth
  failure, owned 404, malformed response, wrong type, or result identity
  mismatch.
- A local timeout means paused, not backend failure or cancellation.
- Polling reads can retry within the bound. Provider work must not retry
  automatically from the browser.
- Job IDs and UUIDs stay in memory.

## 17. Deletion and Cascade Requirements

- Require explicit confirmation that names the selected document.
- Explain that deletion includes the private PDF, chunks, summary container,
  conversations, messages, flashcards, sets, quiz questions, quizzes, and
  attempts.
- Submit the owned delete once and validate the exact
  `learning.document.delete` job.
- Keep the document in a factual deleting state while the job runs.
- On transient poll failure, offer resume. Do not enqueue another delete when
  the backend already owns one.
- Success requires a completed matching job or a canonical owned 404 after the
  known deletion intent.
- Partial/failure state must not claim that data was removed.

## 18. Accessibility and Responsive Requirements

- Support 320px, 390px, tablet, desktop, and native 200% zoom without
  horizontal page overflow.
- Use one clear page heading and ordered subheadings.
- Label file, title, focus, count, chat, and quiz controls.
- Provide visible focus, logical tab order, keyboard-operable tabs/reveal,
  dialogs with focus trap/return, and Escape where safe.
- Announce upload, processing, generation, submission, and deletion status
  changes without repeated noise.
- Do not depend on color alone for document, job, answer, or error state.
- Respect reduced motion for card reveal, progress, and panel transitions.
- Keep source-page controls, long filenames, AI text, quiz choices, and error
  messages wrapping at narrow widths.

## 19. Phase 12 Test Strategy

### Contracts and validators

- Exact methods, paths, query/body omission, credentials, access token
  handling, abort signal, envelopes, request IDs, pagination, bounds, and
  unknown-field stripping.
- Malformed document, chunk, conversation, message, set, card, quiz, attempt,
  review, job, and error responses.

### Ownership and IDOR

- User A versus User B for every resource and job.
- Cross-document conversation IDs.
- Set/quiz IDs whose returned document differs from the route.
- Attempt IDs from another quiz.
- Safe owned 404 wording.

### Upload and processing

- Missing file/title, wrong declared type, signature mismatch response, size
  limit, quota response, duplicate click, cancellation, processing success,
  failed extraction, page limit, and explicit unsupported OCR.
- Job polling timing, pause, resume, terminal failure, wrong job type, wrong
  result document, unmount, and route change.

### Page/source integrity

- Positive ordered page ranges.
- Page/source identity bound to the loaded document.
- Empty sources and insufficient-evidence responses.
- Malformed or out-of-range pages rejected.

### Chat and AI output

- Conversation loading/empty/history pagination.
- One UUID per intent and canonical message refetch.
- Malformed AI output and unknown cited chunks represented as failure.
- Stale route/resource responses ignored.
- No Markdown/HTML execution.

### Flashcards

- Bounded generation, duplicate writes, generation statuses, exact/contiguous
  cards, pagination, empty sets, reveal, previous/next, keyboard, focus, and
  reduced motion.
- No persistent star/progress state and no browser storage.

### Quizzes and answer-key secrecy

- Generated/list DTOs contain no keys.
- Pre-submission detail rejects any key/explanation field.
- Submission stays disabled until every question has one answer.
- Missing, duplicate, invalid, and stale answers preserve drafts.
- Successful submission alone reveals validated review.
- Refresh loads only an owned completed attempt.
- Multiple attempts follow OD-004.
- No key leakage through errors, logs, jobs, or request URLs.

### Deletion

- Confirmation copy, duplicate click, queued/processing/paused/failed/success
  states, owned 404, and exact job identity.
- Backend verification for asset, chunks, conversations, messages, sets, cards,
  questions, quizzes, attempts, and document cascade.

### Responsive and accessibility

- 320px layout, 390px, tablet, desktop, native 200% zoom.
- Keyboard and focus behavior for navigation, dialogs, cards, quiz answers,
  pagination, source pages, retry, and destructive confirmation.

Run focused tests first, then the phase-required frontend, backend, typecheck,
security, build, and diff gates. This Phase 11 inspection did not run them.

## 20. Operator Decisions Required

All Phase 11 operator decisions were resolved on 2026-07-26.

| Decision ID | Approved decision | Phase 12 effect | Status |
|---|---|---|---|
| OD-001 | Option B | Add the smallest bounded backend/shared-contract extension for an authenticated owner to obtain a short-lived private PDF viewing/download target. Preserve safe owned 404s, fresh authorization after expiry, and all stated non-exposure/non-persistence constraints. Extracted chunks remain authoritative for citations. | RESOLVED |
| OD-002 | Option A | Keep flashcard study state transient. Add no persisted stars, review counts, mastery, or spaced repetition. | RESOLVED |
| OD-003 | Option A | Support document cascade deletion only. Add no standalone flashcard-set or quiz deletion. | RESOLVED |
| OD-004 | Option A | Allow multiple explicit immutable quiz attempts. | RESOLVED |
| OD-005 | Bounded provider QA when safely available | Do not block implementation when the provider is unavailable; report provider-success paths as unverified when they cannot be run safely. | RESOLVED |

Phase 12 blocking decisions: 0.

## 21. Phase 12 Blockers

- A Phase 12 prompt defining exact write scope, required checks, and visual
  approval token.
- OD-001 supplies bounded backend/shared-contract authorization for only the
  private PDF target described in this plan. Any broader backend or contract
  change still requires separate approval.

The lack of dedicated active Learning backend tests is a verification risk, not
permission to weaken or bypass the implementation. Phase 12 must inspect and
add the smallest authorized coverage needed for its accepted scope.

## 22. Explicit Non-Goals

- Legacy code copying or dependency reuse.
- New frontend/backend roots, Next.js, Supabase, new auth, database, state
  library, form library, design system, component library, provider SDK, or
  router.
- OCR, scanned-image extraction, annotations, highlighting, full-text search,
  exports, sharing, public documents, collaborative study, audio/video, timers,
  streaks, leaderboards, badges, predictive scores, mastery claims, or
  guaranteed outcomes.
- Persistent browser drafts, offline document copies, stars, review counts, or
  spaced-repetition scheduling.
- Standalone set/quiz deletion unless OD-003 is changed with backend approval.
- On-demand summary regeneration or a separate concept-explanation endpoint.
- Client provider/model selection or automatic provider retries.

## 23. Phase 12 Acceptance Criteria

1. `/learning` and all approved learning routes use canonical owned backend
   records and contain no placeholder/sample production data.
2. Upload validates the canonical `202` response, tracks the exact processing
   job, preserves failure input, and exposes factual PDF/OCR limits.
3. Document list/detail/chunks support pagination, status, loading, empty,
   failed, deleting, stale, and success states.
4. Summary and source pages come only from validated server fields.
5. An authenticated document owner can obtain a bounded short-lived private PDF
   target without exposure of a permanent URL, storage/provider/checksum
   internals, credentials, or arbitrary headers; expiry requires fresh
   authorization and the target is never persisted or placed in route queries.
6. Conversations and messages are nested, paginated, owned, idempotent, and
   stale-safe.
7. AI content renders as text and insufficient evidence remains explicit.
8. Flashcard generation and study use validated jobs, sets, cards, pages,
   keyboard controls, and no fabricated progress.
9. Quiz lists and taking DTOs contain no answer keys or explanations.
10. Server submission validates all answers, scores authoritatively, creates an
   immutable attempt, and only then returns review fields.
11. Attempt history/detail remain owned and nested; refresh never reveals
    another user's or pre-submission answers.
12. Deletion confirmation names the cascade, polls the owned deletion job, and
    never claims partial work succeeded.
13. User A/User B and cross-document/quiz/attempt/job IDs return safe owned
    404s.
14. Access tokens, private content, drafts, messages, jobs, answers, and source
    data never enter browser persistence or logs.
15. External responses are allowlisted from `unknown`, preserve request IDs,
    support cancellation, and reject identity mismatch.
16. 320px, tablet, desktop, 200% zoom, keyboard, focus, announcements, and
    reduced motion pass the approved QA checklist.
17. Required focused and broad test/typecheck/build/security/diff commands pass
    with exact results recorded.

## 24. Recommended Phase 12 Execution Order

1. Freeze the OD-001 bounded private-PDF contract and the remaining approved
   frontend contracts.
2. Define validators and contract tests for documents, jobs, pages, errors, and
   identity.
3. Connect document library, upload, processing, and deletion.
4. Connect route-owned document detail, summary, and chunks.
5. Connect conversations, messages, grounded send, polling, and sources.
6. Connect flashcard set generation, list/detail, pagination, and study.
7. Connect quiz generation, list, taking, submission, history, and review with
   answer-key tests before UI polish.
8. Add stale-operation, cancellation, privacy, IDOR, accessibility, and
   responsive coverage.
9. Run targeted checks, then complete phase gates and bounded browser QA.
10. Stop before commit for the required human approvals.

## 25. Human Approval Gate

The operator resolved OD-001 through OD-005 and provided
`PHASE_11_ANALYSIS_REVIEW_APPROVED` on 2026-07-26.

The Phase 11 analysis review gate is satisfied. Phase 12 remains `PLANNED` and
must not begin without a separate operator-approved Phase 12 execution prompt.
