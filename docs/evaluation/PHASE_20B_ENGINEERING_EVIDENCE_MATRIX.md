# Phase 20B-2 — Engineering Evidence Matrix

## 1. Purpose

This document maps the engineering evidence already available for Career Learning Hub to the **functionality/technical-reliability component of Objective O7**.

Objective O7 evaluates four different areas:

1. functionality;
2. usability;
3. accessibility;
4. AI-assisted output quality.

This matrix covers **engineering functionality evidence only**. It does not convert automated tests, builds, security regressions, browser checks, or human engineering QA into participant usability evidence, a SUS score, full accessibility conformance, or AI factual-quality evidence.

No new application test, participant study, accessibility campaign, or AI-quality campaign is performed by this document.

---

## 2. Current artefact identity

### Current repository baseline for Phase 20B-2

Phase 20B-2 is branched from:

`main @ c64a37828e6175b122115199d8849b42faa7ca9d`

PR #35 changed evaluation/planning documentation only. PR #34 also changed documentation only.

The **current qualified executable checkpoint** therefore remains:

`6b80f91d7016971d58ed9628e8818fabf00d1cd2`

### Fresh qualification at the current executable checkpoint

The post-PR-33 qualification record establishes:

| Check | Result |
|---|---|
| Root workspace production typecheck | PASS |
| Backend test-source typecheck | PASS |
| Backend unit suite | 223/223 PASS |
| Backend integration suite | 249/249 PASS |
| Backend security regression suite | 43/43 PASS |
| Complete backend suite | 515/515 PASS |
| Complete frontend suite | 1,170/1,170 PASS |
| Frontend/backend production builds | PASS |
| Non-overlapping complete-suite total | **1,685 PASS** |
| Initial/final worktree at qualification | CLEAN |

The backend unit, integration, and security commands are subsets of the 515-test complete backend suite and must not be added again when reporting the non-overlapping total.

### Qualification environment recorded at that checkpoint

- Node.js: `v26.5.0`
- npm: `11.17.0`
- repository minimums: Node.js `>=20.0.0`, npm `>=10.0.0`

---

## 3. Evidence-source hierarchy

The matrix uses the following repository evidence sources.

### E1 — Current executable qualification

`docs/planning/POST_PR33_EXECUTABLE_QUALIFICATION_CHECKPOINT.md`

Use this as the **authoritative current automated qualification record** for the executable tree at `6b80f91d7016971d58ed9628e8818fabf00d1cd2`.

### E2 — Phase 20A release/evidence freeze

`docs/planning/PHASE_20A_FINAL_RELEASE_BASELINE_EVIDENCE_FREEZE.md`

Use this for:

- broader feature-by-feature implementation evidence;
- the final pre-PR33 automated evidence chain;
- human/live verification provenance;
- known limitations and warning boundaries;
- historical deployment evidence boundaries.

The original Phase 20A executable identity was superseded for current-tree qualification by E1 after PR #33 touched source-file paths with comment-only annotations. Its broader evidence/provenance remains useful historical support.

### E3 — Earlier integrated UI/browser QA records

Representative historical engineering records include:

- `docs/planning/PHASE_18A_UI_QA_INTEGRATED_PRE_DEPLOYMENT_UI_QUALITY_ASSURANCE.md`;
- the later integrated Phase 19G live-verification provenance summarized in the Phase 20A evidence freeze.

These are supplementary human/browser engineering evidence. They do not replace the fresh E1 automated qualification and must be read with their recorded limitations.

---

## 4. Evidence-strength labels

The following labels are used below.

| Label | Meaning |
|---|---|
| **CURRENT-AUTO** | Fresh automated evidence against the current qualified executable checkpoint. |
| **HUMAN/LIVE** | Recorded manual/live-browser or visual engineering verification. |
| **HISTORICAL-AUTO** | Earlier automated evidence still useful for provenance but not the sole current qualification. |
| **IMPLEMENTATION** | Implemented feature/control documented in the frozen/current application records. |
| **LIMITATION** | Evidence boundary that prevents a broader academic claim. |

A row may use several labels because one functionality claim can be supported by both automated and human evidence.

---

## 5. O7 engineering evidence matrix

| ID | Functionality / technical claim supported | Engineering evidence | Source / identity | Status | Academically safe statement | Boundary / what this does **not** establish |
|---|---|---|---|---|---|---|
| ENG-01 | The monorepo is type-correct and production-buildable under the qualified configuration. | Root production typecheck PASS; backend test-source typecheck PASS; frontend/backend production builds PASS. | **E1**, executable `6b80f91...` | **CURRENT-AUTO / ACHIEVED** | “The qualified Career Learning Hub executable passed the repository production typechecks and production builds.” | Does not prove browser usability, production scalability, uptime, or absence of all defects. |
| ENG-02 | The backend's tested behaviour passes its complete automated suite. | Complete backend suite **515/515 PASS**. Unit **223/223**, integration **249/249**, security **43/43** are subsets. | **E1**, executable `6b80f91...` | **CURRENT-AUTO / ACHIEVED** | “The complete backend automated suite passed 515/515 tests at the current qualified executable checkpoint.” | Do not report 223 + 249 + 43 + 515 as unique tests. Does not prove every possible backend behaviour. |
| ENG-03 | The frontend's tested component/workflow behaviour passes its complete automated suite. | Complete frontend suite **1,170/1,170 PASS**. | **E1**, executable `6b80f91...` | **CURRENT-AUTO / ACHIEVED** | “The complete frontend automated suite passed 1,170/1,170 tests at the current qualified executable checkpoint.” | Component/regression success is not a participant usability score or full browser-compatibility certification. |
| ENG-04 | The qualified executable has a non-overlapping automated test total of 1,685 passing tests. | Backend 515 + frontend 1,170 = **1,685**. | **E1** | **CURRENT-AUTO / ACHIEVED** | “The non-overlapping complete-suite total is 1,685 passing automated tests.” | This is a test count, not an “accuracy”, “quality percentage”, coverage percentage, or usability score. |
| ENG-05 | Authentication/session workflows are implemented and were covered by automated plus live engineering verification. | Registration, login/logout, protected routes, refresh bootstrap/session handling, expiry messaging, safe return-route behaviour; full suites PASS; integrated human QA provenance covers Authentication. | **E1 + E2** | **CURRENT-AUTO + HUMAN/LIVE / ACHIEVED** | “Authentication/session functionality is implemented and covered by the final automated qualification plus recorded integrated live QA.” | Does not prove every security attack class or participant ease-of-use. |
| ENG-06 | Dashboard aggregation/continuation behaviour is implemented and tested. | Dashboard progress/outcome presentation, continuation/fallback actions, recent activity, period controls, stale-request protection; full frontend/backend suites PASS; integrated human QA provenance covers Dashboard. | **E1 + E2** | **CURRENT-AUTO + HUMAN/LIVE / ACHIEVED** | “Dashboard functionality is implemented and included in automated and recorded live verification.” | Does not establish that users understand the Dashboard without participant testing. |
| ENG-07 | Resume Studio core editing/versioning/recovery/export behaviour is implemented and tested. | Resume collection/create/import, editor/live preview, immutable versions, Save new version, dirty/recovery/navigation protection, design, photo, print/PDF, deletion; final suites PASS. | **E1 + E2** | **CURRENT-AUTO + IMPLEMENTATION / ACHIEVED** | “Resume Studio’s core workflows are implemented and covered by the final automated qualification.” | Does not establish hiring outcomes, employer ATS equivalence, or participant usability. |
| ENG-08 | Resume AI assessment is attached to controlled saved-version workflows and user-confirmed application of suggestions. | Role-aware assessment, structured-result validation, stale/version conflict protections, explicit suggestion selection/confirmation; final suites PASS; post-19G assessment-action polish received 64/64 focused tests and explicit human visual approval before final qualification. | **E1 + E2** | **CURRENT-AUTO + HUMAN/LIVE / ACHIEVED** | “The Resume AI workflow’s application behaviour, version binding, validation and user-control paths are engineering-verified.” | This does **not** establish factual quality of recommendations, ATS accuracy, hiring probability, or employment benefit. Those belong to Stream D. |
| ENG-09 | Interview Coach session/question/attempt lifecycle and type-aware practice behaviour are implemented and tested. | Session lifecycle, AI/manual questions, six modern question types, immutable attempts, MCQ evaluation/secrecy, notes, pinning, explanation/feedback jobs, archive/restore/delete, resilience controls; final suites PASS; integrated human QA provenance covers Interview Coach. | **E1 + E2** | **CURRENT-AUTO + HUMAN/LIVE / ACHIEVED** | “Interview Coach’s implemented practice workflows passed the final automated qualification and have recorded live verification provenance.” | Does not establish interview-feedback quality, hiring prediction, or employment suitability. Coding responses are text-only and not executed. |
| ENG-10 | Learning Workspace document, grounded-chat, flashcard and quiz workflows are implemented and tested. | Private upload/processing/library, page-aware content, grounded conversations/sources, flashcards, quizzes, saved attempts, source review, deletion/job safeguards; final suites PASS; integrated human QA provenance covers Learning Workspace. | **E1 + E2** | **CURRENT-AUTO + HUMAN/LIVE / ACHIEVED** | “The implemented Learning Workspace workflows are covered by the final automated qualification and recorded integrated live QA.” | Does not establish that generated answers are factually correct or that learning outcomes improve. Grounded AI quality belongs to Stream D. |
| ENG-11 | Gemini connection/credential-management behaviour is implemented with a fixed active release model. | Gemini Direct active path, fixed `gemini-3.6-flash`, app-managed/personal/disconnected states, test-before-write, encrypted personal credential storage, no plaintext credential return, controlled server-side provider use; final suites PASS. | **E1 + E2** | **CURRENT-AUTO + IMPLEMENTATION / ACHIEVED** | “The current release’s Gemini connection and credential-management paths are implemented and engineering-verified.” | Does not establish external Gemini availability, model factual quality, cost accuracy, or future model behaviour. |
| ENG-12 | Owner-scoped authorization/private-resource controls are represented in the implementation and regression evidence. | Owner-scoped backend access, server-derived ownership identity, cross-user/IDOR tests, protected child-resource relationships, destructive-operation ownership controls. | **E1 + E2** | **CURRENT-AUTO + IMPLEMENTATION / ACHIEVED** | “Owner-scoped authorization behaviours are covered by the project’s backend/integration/security regression evidence.” | Does not equal an independent penetration test or formal security certification. |
| ENG-13 | Private-file handling has bounded engineering controls. | Private asset abstraction, MIME/size/purpose validation, owner-scoped access, short-lived Learning PDF access, candidate-photo validation, deletion/cleanup paths. | **E1 + E2** | **CURRENT-AUTO + IMPLEMENTATION / ACHIEVED** | “Private-file workflows are implemented behind owner-scoped asset controls and included in regression evidence.” | Does not prove resistance to every storage/cloud threat or certify the deployment provider. |
| ENG-14 | Long-running AI/document operations use durable background-job controls rather than blocking HTTP requests. | In-process worker, progress polling, retry, cancellation, timeout, execution lease/fencing, idempotency/duplicate suppression, validated/atomic persistence; final suites PASS. | **E1 + E2** | **CURRENT-AUTO + IMPLEMENTATION / ACHIEVED** | “Background-job resilience and persistence controls are part of the qualified implementation.” | Does not establish enterprise queue durability, high availability, multi-region failover, SSE/WebSockets, or token streaming. |
| ENG-15 | Request/result validation and diagnostic error handling are engineering controls in the qualified application. | Zod/request validation, structured-output validation before persistence, normalized errors, bounded Request IDs, logging/redaction rules; final suites PASS. | **E1 + E2** | **CURRENT-AUTO + IMPLEMENTATION / ACHIEVED** | “The qualified implementation includes server-side validation and bounded Request-ID diagnostics covered by regression evidence.” | Does not prove that every malformed or adversarial input has been tested. |
| ENG-16 | Backend security regression scenarios pass at the current executable checkpoint. | **43/43 backend security tests PASS**. Recorded examples include cross-user access controls, rate-limit/adversarial handling, private-data/secrecy boundaries and related security contracts. | **E1 + E2** | **CURRENT-AUTO / ACHIEVED** | “The backend security regression suite passed 43/43 tests.” | **No separate dedicated external/repository-wide security-scanner pass, penetration test or security certification is claimed.** |
| ENG-17 | Responsive/accessibility-oriented behaviours have engineering evidence. | Shared responsive shell/mobile drawer, focus/keyboard/dialog semantics and component tests; integrated QA included responsive shell and keyboard/runtime sanity; earlier UI-QA/browser work provides supplementary viewport evidence. | **E2 + E3** | **HUMAN/LIVE + HISTORICAL-AUTO / PARTIAL FOR O7 ACCESSIBILITY** | “Responsive and accessibility-oriented behaviours have implementation, test and prior human/browser engineering evidence.” | This is **not** a complete accessibility evaluation and must not be reported as WCAG conformance. Stream C remains required. |
| ENG-18 | The integrated application has recorded human/live engineering QA provenance. | Phase 20A records the immediately preceding Phase 19G integrated live-browser verification across Authentication, Dashboard, Resume Studio, Interview Coach, Learning Workspace, responsive shell and keyboard/runtime sanity, with no reproducible Phase 19G product defect found. The only later visible Resume assessment polish received explicit human visual approval. | **E2** | **HUMAN/LIVE / ACHIEVED AS ENGINEERING QA** | “The final evidence chain includes integrated live-browser QA plus focused visual approval for the only subsequent visible Resume change.” | Human engineering QA is not a controlled participant usability study and must not be presented as SUS/usability evidence. |
| ENG-19 | The application architecture has historical cloud deployment evidence. | Earlier staging used Vercel frontend, Render backend, MongoDB Atlas and Gemini-backed cloud smoke verification. | **E2** | **HISTORICAL / SUPPLEMENTARY** | “The architecture has previously been deployed and exercised in a staging/cloud environment.” | Phase 20A/20B do not claim the exact current qualified executable was deliberately redeployed. Deployment remains a separate activity. |
| ENG-20 | Current known qualification warnings are disclosed rather than hidden. | `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` during deliberate rate-limit test; duplicate React-key warning in `ResumeVersionTimeline.test.tsx`; Vite module/import/chunk advisories; all associated suites/builds passed. | **E1** | **LIMITATION / DISCLOSED** | “The current qualification passed but was not warning-free; the recorded non-blocking diagnostics remain disclosed.” | Do not claim warning-free builds/tests or perfect code quality. |

---

## 6. Feature-area summary for O7 functionality

| Product area | Current automated evidence | Human/live engineering evidence | Functionality status for Phase 20B Stream A |
|---|---|---|---|
| Authentication / session | Final backend/frontend suites PASS | Recorded integrated live QA | **SUPPORTED** |
| Dashboard | Final backend/frontend suites PASS | Recorded integrated live QA | **SUPPORTED** |
| Resume Studio | Final backend/frontend suites PASS | Recorded integrated live QA + focused post-19G visual approval | **SUPPORTED** |
| Interview Coach | Final backend/frontend suites PASS | Recorded integrated live QA | **SUPPORTED** |
| Learning Workspace | Final backend/frontend suites PASS | Recorded integrated live QA | **SUPPORTED** |
| Settings / Gemini | Final backend/frontend suites PASS | Implementation/previous verification evidence | **SUPPORTED** |
| Ownership / private assets | Integration/security/full-suite evidence | Supplementary browser/engineering evidence | **SUPPORTED WITH SECURITY CLAIM BOUNDARY** |
| Background jobs / polling / retry / cancel | Backend/frontend regression evidence | Observed through feature QA where applicable | **SUPPORTED** |
| Responsive/accessibility-oriented behaviour | Component/regression + historical browser evidence | Recorded human QA | **ENGINEERING SUPPORT ONLY — STREAM C STILL REQUIRED** |
| AI output factual/usefulness quality | Structural/job/schema/user-control tests only | Feature QA confirms workflow, not content truth | **NOT ESTABLISHED BY STREAM A — STREAM D REQUIRED** |
| Participant usability | Not an engineering-test question | No controlled participant study claimed | **NOT ESTABLISHED — STREAM B REQUIRED** |

---

## 7. Report-ready engineering statements

The following statements are supported by the recorded evidence if their boundaries are preserved.

### Safe summary statement

> Career Learning Hub’s current qualified executable checkpoint passed the complete backend and frontend automated suites, production/test typechecks and production builds. The non-overlapping complete-suite total was 1,685 passing tests: 515 backend and 1,170 frontend. The backend security regression subset passed 43/43 tests. Earlier integrated live-browser QA and focused visual verification provide additional human engineering evidence for the major application workflows.

### Safe security statement

> The implemented backend security regression suite passed 43/43 tests at the current qualified executable checkpoint. No separate dedicated external/repository-wide security scanner, penetration test or independent security certification is claimed.

### Safe human-QA statement

> Human engineering verification supplements the automated evidence, but it is not treated as participant usability research.

### Safe accessibility statement

> The application contains tested responsive and accessibility-oriented behaviours, but a separate selected accessibility evaluation is still required for Objective O7 and no formal WCAG conformance claim is made.

### Safe AI statement

> Automated tests verify AI workflow control, validation, job resilience and persistence behaviour; they do not establish the factual quality or usefulness of generated outputs. Feature-specific AI-quality evaluation remains a separate Objective O7 evidence stream.

---

## 8. Claims explicitly prohibited by this matrix

Do not derive any of the following from the engineering evidence above:

- “The application is 100% correct.”
- “1,685 tests means 100% coverage.”
- “1,685 tests means the AI is accurate.”
- “The system is WCAG compliant.”
- “The system passed a penetration test.”
- “The system is production secure.”
- “The system has no vulnerabilities.”
- “The system is enterprise-ready.”
- “The Resume score is equivalent to an employer ATS.”
- “The application improves hiring chances.”
- “Interview feedback predicts job success.”
- “Grounded answers are guaranteed true.”
- “Engineering QA proves participant usability.”
- “The staging deployment proves the exact current executable is deployed.”

---

## 9. Stream A conclusion

For Phase 20B, **Stream A — Engineering functionality evidence is mapped and supported** by the existing repository evidence.

The strongest current automated identity is:

`6b80f91d7016971d58ed9628e8818fabf00d1cd2`

with:

`1,685 PASSING TESTS — 515 BACKEND + 1,170 FRONTEND`

plus passing typechecks/builds and a 43/43 backend security regression subset.

This is sufficient to support the **engineering functionality component** of Objective O7 at the level actually tested. It does not close Objective O7 as a whole because the following evidence streams remain separate:

- Stream B — participant usability;
- Stream C — selected accessibility evaluation;
- Stream D — feature-specific AI-output-quality evaluation.

The participant ethics/module gate remains blocked until authoritative guidance is recorded. Phase 20B-2 does not change or bypass that gate.
