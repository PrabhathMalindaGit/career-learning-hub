# Phase 19A-2 Final Data-Integrity Repair Plan

> **For agentic workers:** Execute this evidence-led plan inline in the existing
> dirty Phase 19A-2 worktree. Do not create a worktree, stage, commit, reset,
> clean, restore, or use a browser.

**Goal:** Prove or repair canonical Guided Skill mapping, immutable-version
section preservation, and candidate-facing internal-identifier handling.

**Architecture:** Preserve the existing Resume content schema and immutable
version boundaries. Trace each symptom to its writer or presentation boundary,
add the smallest focused regression evidence, and change production code only
for a reproduced root cause.

**Tech stack:** React, TypeScript, Vitest, Express, Mongoose, MongoMemoryServer.

## Global constraints

- Branch: `phase-19a-2-resume-creation-guided-entry`.
- Baseline: `643b7e6451b2b14472bf7019e531dae4a8134f42`.
- Preserve the complete unstaged Phase 19A-2 implementation and visual repair.
- No schema migration, dependency, package/lockfile, provider, model, browser,
  Phase 19A-3, or Phase 19A-4 change.
- Gemini Direct remains fixed to `gemini-3.6-flash`; no live Gemini request.
- Maximum three code-changing attempts for one repeated root failure.
- Final visual approval token remains pending.

## Initial inventory and assumptions

- [x] Confirm branch and baseline HEAD.
- [x] Confirm `git diff --check` passes and staging is empty.
- [x] Confirm the complete expected dirty Phase 19A-2 worktree is present.
- [x] Inspect current phase, approved design/implementation plan, and visual
  repair record.
- [x] Baseline frontend guidance/picker/setup tests pass: 17/17.
- [x] Baseline Resume creation integration tests pass: 3/3 after granting the
  existing MongoMemoryServer harness permission to open its local listener.

Assumptions bounded by source evidence:

- Current Track A source already maps catalogue category to group name and
  selected values to keywords. The screenshot symptom must not be patched at
  the editor; stronger multi-category and persistence evidence will determine
  whether current code reproduces it.
- Track B is an investigation. Existing save and rewrite writers both receive
  complete canonical content, but full-section preservation is not covered by
  one explicit regression test.
- Track C is likely provider-output echo: the provider receives canonical JSON
  containing stable IDs, the result schema permits free-form visible prose,
  and the frontend correctly renders that prose. Tests must prove this before
  the service is changed.

## Track A — Guided Skill canonical mapping

**Investigate/test files:**

- `frontend/src/features/resumes/resumeGuidance.ts`
- `frontend/src/features/resumes/ResumeSkillPicker.tsx`
- `frontend/src/features/resumes/ResumeGuidedSetup.tsx`
- `frontend/src/features/resumes/resumeGuidance.test.ts`
- `frontend/src/features/resumes/ResumeSkillPicker.test.tsx`
- `frontend/src/features/resumes/ResumeGuidedSetup.test.tsx`
- `backend/src/tests/integration/resumeCreation.integration.test.ts`

- [x] Trace catalogue → checked keys → `SkillSelection` →
  `mergeSkillSelections` → Guided content → create payload → normalized Version
  1 → draft/editor.
- [x] Add focused coverage for Programming Languages, Frontend, Backend, and
  Databases; role/catalogue deduplication; custom Backend merge; no empty
  group; role-change preservation; and persisted Version 1 round-trip.
- [x] Run the focused command and record whether it is RED or already GREEN.
- [x] If RED, state one root-cause hypothesis and implement only the source fix.
  Not applicable: the new exact regression evidence passed immediately, so no
  product RED or current-code defect was reproduced.
- [x] Run focused Track A GREEN and nearby regressions.

**Track A finding:** `NOT REPRODUCED / CURRENT CODE PRESERVES DATA`.
`ResumeSkillPicker.apply` reconstructs selected entries from
`SKILL_CATEGORIES`, `mergeSkillSelections` merges category-name groups with
case-insensitive keyword deduplication, `buildGuidedResumeContent` preserves
that shape, and server normalization adds IDs without changing names/keywords.
The strengthened frontend evidence passed 19/19 and the persisted Version 1
integration evidence passed 3/3. No Track A production file was changed.

## Track B — Resume-version untouched-section preservation

**Investigate/test files:**

- `frontend/src/features/resumes/ResumeWorkspace.tsx`
- `frontend/src/features/resumes/resumeDraft.ts`
- `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- `backend/src/modules/resumes/resume.service.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- `backend/src/tests/integration/resumeVersionPersistence.integration.test.ts`
- `backend/src/tests/integration/aiRetryAndPersistence.integration.test.ts`

- [x] Trace manual save from full draft through `draftToInput`, the API, server
  normalization, Version N+1 persistence, workspace adoption, and snapshot.
- [x] Trace selected rewrite from the analysed source Version through cloned
  canonical content, one bullet update, Version N+1, and workspace adoption.
- [x] Verify analysis queue submits the current workspace Version ID and the
  backend loads that exact owned full Version.
- [x] Verify snapshots fetch a complete stored Version and pass its complete
  content to the unchanged Resume preview.
- [x] Add full nine-section preservation evidence for manual save.
- [x] Add one experience-bullet and one project-bullet rewrite preservation
  case using mocked/stored analysis data only.
- [x] Add assessment-input evidence for Experience and Education in the exact
  saved Version sent to the provider adapter.
- [x] Strengthen snapshot evidence for stored Experience and Education.
- [x] Run focused Track B tests. If all pass, record exactly
  `NO VERSION DATA-LOSS REPRODUCED` and do not modify save/version code.
- [x] If a test reproduces loss, fix only the proven writer/renderer and rerun.
  Not applicable: no writer, assessment-source, or renderer loss reproduced.

**Track B finding:** `NO VERSION DATA-LOSS REPRODUCED`. Manual save preserved
all untouched sections and the original historical Version; experience and
project rewrite cases each changed only their selected bullet; assessment
loaded and sent the explicitly selected current saved Version containing both
Experience and Education; the historical snapshot rendered both sections.
Focused evidence passed 30/30 frontend tests and 20/20 backend integration
tests. No Track B production file was changed.

## Track C — Internal identifier sanitization

**Investigate/production files:**

- `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`

**Test file:**

- `backend/src/tests/integration/aiRetryAndPersistence.integration.test.ts`

- [x] Trace the opaque bullet ID into canonical provider input, through
  free-form `issues.message`/`strengths`/rewrite `rationale`, persistence, API
  parsing, and direct frontend rendering.
- [x] Add a failing integration test in which a mocked provider echoes a known
  project bullet ID into visible review/rewrite prose.
- [x] Assert the structured suggestion retains its real `bulletId`, applying
  the selected rewrite still targets the correct bullet, meaningful
  project/ordinal context replaces the visible ID, generic known context has a
  safe fallback, and an unrelated UUID-like factual string is untouched.
- [x] Run RED and verify failure is the known-ID echo, not infrastructure.
- [x] Implement one narrow deterministic service-boundary sanitizer using only
  IDs known from the analysed canonical Resume; do not globally strip UUIDs.
- [x] Run focused Track C GREEN and assessment regressions.

**Track C finding:** Canonical stable IDs are required in the provider-facing
Resume JSON so structured rewrite suggestions can target a real bullet. The
provider can echo those IDs into free-form issue, strength, missing-keyword,
or rationale prose; the service previously persisted that prose unchanged and
the frontend rendered it truthfully. RED reproduced the exact raw
`Bullet <UUID>` message (1 failed, 14 passed). The service now replaces only
identifiers collected from that analysed Resume with deterministic human
context before persistence. Structured `bulletId`, original/rewrite content,
and unrelated UUID-like strings are untouched. GREEN passed 15/15.

## Integrated verification and closeout

- [x] Run combined affected Resume frontend tests.
- [x] Run affected Resume creation/import/version/assessment/backend security
  tests required by changed paths.
- [x] Run the complete frontend suite and frontend typecheck.
- [x] If backend production changes, run backend unit, integration, security,
  production typecheck, and test typecheck gates.
- [x] Run root typecheck and production build.
- [x] Remove generated verification-only `dist` and TypeScript build caches.
- [x] Inspect repair changes for secrets, tokens, provider bodies/logging,
  private paths, raw Resume logging, cross-user exposure, and visible internal
  IDs.
- [x] Confirm package and lockfiles are unchanged.
- [x] Run `git diff --check`, `git status --short`, `git diff --stat`, and
  `git diff --cached --name-only`; staging must remain empty.
- [x] Update this record with exact findings/results and mark completed items.
- [x] Update `docs/planning/CURRENT_PHASE.md` only after all automated gates
  pass; keep Phase 19A-2 incomplete and the final visual token pending.

**Integrated results:** The affected frontend regression passed 147/147 across
14 files. The affected backend regression passed 70/70 across 9 files. The
complete frontend suite passed 802/802 across 62 files, and frontend typecheck
passed. Backend unit passed 186/186, integration passed 189/189, and security
passed 36/36; backend production and test typechecks passed. Root typecheck and
the production build passed with only the existing Vite directive/chunk-size
warnings. Generated `frontend/dist`, `frontend/tsconfig.tsbuildinfo`, and
`backend/dist` outputs were removed. The scoped privacy review found no added
secret, private-content logging, provider-body logging, cross-user exposure,
or retained candidate content; test-only bearer tokens remain synthetic and
in memory. Package and lockfiles are unchanged. Final repository checks pass,
and the staging area remains empty. No browser campaign or live Gemini request
was made.
