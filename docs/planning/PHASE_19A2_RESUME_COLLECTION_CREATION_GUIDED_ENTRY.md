# Phase 19A-2 — Resume Collection, Creation & Guided Entry Closeout

## Identity and final status

- Phase: `19A-2 — Resume Collection, Creation & Guided Entry`.
- Branch: `phase-19a-2-resume-creation-guided-entry`.
- Baseline HEAD: `643b7e6451b2b14472bf7019e531dae4a8134f42`.
- Baseline predecessor:
  `PHASE 19A-1 — RESUME EDITOR WORKSPACE REFINEMENT / HUMAN-APPROVED / MERGED`.
- Final status:
  `COMPLETED / HUMAN-APPROVED / READY FOR MANUAL GIT PUBLICATION`.
- Git publication remains operator-controlled. This closeout does not stage,
  commit, push, create a PR, merge, or deploy.

## Approval tokens

1. `PHASE_19A2_RESUME_COLLECTION_CREATION_GUIDED_ENTRY_DESIGN_APPROVED` —
   `ACCEPTED / YES`.
2. `PHASE_19A2_HUMAN_VISUAL_POLISH_REPAIR_DESIGN_APPROVED` —
   `ACCEPTED / YES`.
3. `PHASE_19A2G_CAREER_GUIDANCE_GENERALIZATION_APPROVED` —
   `ACCEPTED / YES`.
4. `PHASE_19A2_DISABLED_ACTION_VISUAL_REPAIR_APPROVED` —
   `ACCEPTED / YES`.
5. `PHASE_19A2_RESUME_COLLECTION_CREATION_GUIDED_ENTRY_VISUAL_APPROVED` —
   `ACCEPTED / YES`.

## Completed product scope

- The Resume collection uses a cleaner responsive card grid, stronger card
  hierarchy, unobstructed design-derived previews, and server-owned pagination
  that is hidden when one page is sufficient.
- One Create Resume chooser provides Guided setup, Start blank, and Import PDF.
  Existing global and Dashboard create intents continue to use the canonical
  `/resumes?action=create` route.
- Guided Setup provides deterministic target-role and skill guidance while
  retaining custom roles, custom skills, and custom groups. Suggested sections
  remain guidance-only. Suggested skills and the target-role headline opt-in
  start unchecked, and changing role never removes explicitly selected skills.
- Guided skill selection maps catalogue category to canonical skill-group name
  and selected skill to a keyword. Browse all skills is searchable, and the
  existing `{ clientKey, id?, name, keywords }` draft contract is preserved.
- The editor provides Experience action starters, a deterministic editable
  Achievement Builder, qualification guidance, language proficiency guidance,
  manual certification entry, and optional interest guidance. User action or
  user-entered facts remain required before content enters the Resume.
- PDF import uses one accessible private-file selector with choose/drop,
  filename, validation, replace, and remove behavior. Parsed canonical content
  is staged in an owned, bounded job result and shown in read-only Import Review.
  No Resume or ResumeVersion is created until explicit confirmation.
- Import confirmation uses the existing atomic Resume plus Version 1 creation,
  is idempotent for repeated or concurrent confirmation, promotes/links the
  private source asset, and replaces staged candidate content with the small
  adopted identity result. Earlier temporary Asset/job expiry remains bounded.
- Phase 19A-1 progressive disclosure, responsive editor navigation, all nine
  editor destinations, validation, preview, history, print, ownership, and
  privacy behavior remain the governing workspace contract.
- Approved visual-polish work refined chooser, Guided Setup, Skill Picker,
  upload, collection cards, nine-section navigation, compact item actions, and
  assessment completion-state presentation.
- The final disabled-action repair made disabled Resume primary actions visibly
  muted while preserving the enabled primary appearance and native disabled
  semantics.

## Career-guidance generalization

- Original role count: `16`; final role count: `60`.
- Represented career families: `12`.
- Original skill-category count: `8`; final skill-category count: `19`.
- Final globally unique curated skills: `120`.
- Exact role mappings: `19`.
- Custom role entry remains first-class. Role matching is deterministic,
  whitespace-normalized, case-insensitive, and exact only.
- No fuzzy, semantic, or AI occupation inference was added. Suggestions remain
  optional and unchecked, and no legacy Resume data was migrated.

## Final data-integrity repair

- The suspected Guided Skill mapping defect was not reproduced in current
  source. Strengthened regression evidence verified canonical category-to-group
  and skill-to-keyword mapping through persisted Version 1.
- `NO VERSION DATA-LOSS REPRODUCED`: Save New Version preserves untouched
  canonical content; Apply AI Suggestions preserves unrelated sections;
  assessment loads the selected complete saved version; and historical
  snapshots render stored sections.
- A candidate-visible internal assessment identifier leak was reproduced. The
  provider could echo canonical stable IDs from provider-facing Resume JSON
  into free-form guidance prose.
- A bounded backend service sanitizer now replaces only internal identifiers
  known to the analysed Resume in user-visible guidance. Structured machine
  rewrite-targeting IDs remain intact, unrelated UUID-like factual strings are
  untouched, and no global UUID stripping was introduced.

## Final disabled-action visual repair

- `Apply selected suggestions` was already functionally disabled when no valid
  selection could be applied.
- Its CSS context left a saturated primary surface under an opacity-only
  disabled treatment, so it could resemble an enabled action.
- `.resume-primary-button:disabled` now uses an explicit muted border,
  background, and readable text surface. Native `disabled` behavior and the
  enabled primary style are unchanged.
- Final human Chrome review confirmed that the disabled action is visibly
  muted and that selecting a valid suggestion restores the strong enabled
  primary appearance.

## AI, security, and privacy boundary

- Release AI policy remains Gemini Direct only with fixed
  `gemini-3.6-flash`; OpenRouter remains dormant.
- No automatic/background Gemini call, fallback, or new AI provider was added.
- Imported candidate content remains private, owned, time-bounded, and scrubbed
  from confirmed job results. Ownership and cross-user protections remain in
  place.
- No secrets, provider bodies, private storage keys, or raw Resume content are
  logged by this phase.

## Legacy data and exclusions

- Existing user-owned Resume organization and old skill-group data remain
  untouched. New Guided Setup creation uses canonical grouping; no legacy
  migration was performed.
- `PHASE 19A-3 — RESUME SAVE, RECOVERY & EXPORT WORKFLOW` remains
  `PLANNED / INACTIVE`. Phase 19A-2 did not add Cmd/Ctrl+S, temporary reload
  recovery, a final save-state redesign, export preflight, export filename
  workflow, or expand A4/Letter behavior beyond the existing contract.
- `PHASE 19A-4 — CANDIDATE PHOTO SUPPORT` remains `PLANNED / INACTIVE`.
  Candidate Photo was not implemented.
- No external occupation API, remote career taxonomy, fuzzy role matching,
  certification fabrication, automatic skill insertion, legacy-data migration,
  or new career-guidance dependency was added.

## Automated verification evidence

Different bounded repairs ran different suites; their results remain recorded
separately rather than being combined into one invented historic total.

### Final data-integrity repair

- Focused Track A frontend: `19/19`.
- Resume creation integration: `3/3`.
- ResumeWorkspace: `30/30`.
- Track B backend integration: `20/20`.
- Track C after repair: `15/15`.
- Combined affected frontend: `147/147`.
- Combined affected backend: `70/70`.
- Complete frontend at that point: `802/802`.
- Backend unit: `186/186`; backend integration: `189/189`; backend security:
  `36/36`.
- Frontend, backend, shared, and test typechecks passed; production build
  passed.

### Career-guidance generalization

- Focused guidance: `15/15`; Guided Setup: `3/3`; Skill Picker: `6/6`.
- Affected frontend regression: `194/194`.
- Complete frontend: `807/807` across 62 files.
- Frontend typecheck, root typecheck, and production build passed.

### Final disabled-action repair

- ResumeWorkspace: `30/30`; assessment component: `6/6`.
- Affected Resume regression: `200/200` across 11 files.
- Complete frontend: `807/807` across 62 files.
- Frontend typecheck, root typecheck, production build, and
  `git diff --check` passed.

Codex Browser was not used and no Playwright/browser campaign was run for the
Phase 19A-2 final repairs. Human Chrome review supplied the final visual
evidence. No live Gemini request was made during those repairs.

## Exact manual publication manifest

### Production — 20 files

Tracked modified:

- `backend/src/jobs/job.queue.ts`
- `backend/src/jobs/job.worker.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.controller.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.jobs.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.routes.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.schemas.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- `frontend/src/features/resumes/ResumeEditor.tsx`
- `frontend/src/features/resumes/ResumeListPage.tsx`
- `frontend/src/features/resumes/ResumeWorkspace.tsx`
- `frontend/src/features/resumes/resumeApi.ts`
- `frontend/src/features/resumes/resumeContracts.ts`
- `frontend/src/features/resumes/resumeWorkspace.css`
- `frontend/src/features/resumes/types.ts`

Untracked new:

- `frontend/src/features/resumes/ResumeAchievementBuilder.tsx`
- `frontend/src/features/resumes/ResumeCreateDialog.tsx`
- `frontend/src/features/resumes/ResumeGuidedSetup.tsx`
- `frontend/src/features/resumes/ResumePdfUpload.tsx`
- `frontend/src/features/resumes/ResumeSkillPicker.tsx`
- `frontend/src/features/resumes/resumeGuidance.ts`

### Tests — 21 files

Tracked modified:

- `backend/src/tests/integration/aiRetryAndPersistence.integration.test.ts`
- `backend/src/tests/integration/crossUserAccess.integration.test.ts`
- `backend/src/tests/integration/jobExecutionFence.integration.test.ts`
- `backend/src/tests/integration/jobResponse.integration.test.ts`
- `backend/src/tests/integration/resumeJobIdempotency.integration.test.ts`
- `backend/src/tests/integration/resumePdfImport.integration.test.ts`
- `backend/src/tests/integration/resumeVersionPersistence.integration.test.ts`
- `frontend/src/features/resumes/ResumeEditor.test.tsx`
- `frontend/src/features/resumes/ResumeListPage.test.tsx`
- `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- `frontend/src/features/resumes/resumeApi.test.ts`
- `frontend/src/features/resumes/resumeContracts.test.ts`
- `frontend/src/features/resumes/resumePolling.test.ts`
- `frontend/src/routing/router.test.tsx`

Untracked new:

- `backend/src/tests/integration/resumeCreation.integration.test.ts`
- `frontend/src/features/resumes/ResumeAchievementBuilder.test.tsx`
- `frontend/src/features/resumes/ResumeCreateDialog.test.tsx`
- `frontend/src/features/resumes/ResumeGuidedSetup.test.tsx`
- `frontend/src/features/resumes/ResumePdfUpload.test.tsx`
- `frontend/src/features/resumes/ResumeSkillPicker.test.tsx`
- `frontend/src/features/resumes/resumeGuidance.test.ts`

### Documentation — 7 files

Tracked modified:

- `docs/planning/CURRENT_PHASE.md`

Untracked new:

- `docs/planning/PHASE_19A2_RESUME_COLLECTION_CREATION_GUIDED_ENTRY.md`
- `docs/superpowers/plans/2026-08-10-resume-collection-creation-guided-entry.md`
- `docs/superpowers/plans/2026-08-10-resume-final-data-integrity-repair.md`
- `docs/superpowers/plans/2026-08-10-resume-human-visual-polish-repair.md`
- `docs/superpowers/plans/2026-08-11-resume-career-guidance-generalization.md`
- `docs/superpowers/specs/2026-08-10-resume-collection-creation-guided-entry-design.md`

Total publication manifest: `48 files`.

Generated outputs, screenshots, PDFs, temporary evidence, environment files,
package/lockfiles, and unrelated user files are excluded. None appears in the
dirty worktree. The staging area must remain empty until the operator performs
manual publication.
