# Phase 19A-2G Career Guidance Catalogue Generalization

> **Execution boundary:** Extend the existing frontend-only deterministic
> guidance data in the current dirty Phase 19A-2 worktree. Do not stage,
> commit, reset, clean, use a browser, call Gemini, or change backend/shared
> contracts.

**Approval:** `PHASE_19A2G_CAREER_GUIDANCE_GENERALIZATION_APPROVED` —
`ACCEPTED / YES`

**Goal:** Make Guided Setup useful across a bounded range of common careers
without changing its UI, canonical Resume shape, or opt-in truthfulness rules.

## Audited current architecture

- `JOB_TITLE_SUGGESTIONS` is a flat readonly array consumed by native
  datalists in Guided Setup and the existing editor. It currently contains 16
  roles, all technology/product/design adjacent.
- `SKILL_CATEGORIES` is a readonly array of `{ name, skills }` entries. It
  currently contains 8 categories and 46 globally unique skills.
- `ROLE_SKILL_SUGGESTIONS` is a normalized-key record. Lookup trims/collapses
  whitespace and compares case-insensitively, but remains exact; only Software
  Engineer currently has a mapping.
- The native role input accepts arbitrary text. A custom role is never
  validated against the datalist and an unmapped role returns no suggestions.
- The picker reconstructs selected catalogue items from `SKILL_CATEGORIES`:
  category name becomes the canonical Resume skill-group name and the selected
  label becomes a keyword. Suggested and full-catalogue checkboxes share one
  normalized selected-key set.
- Custom skill/group input uses the same merge utility. Existing group identity
  and order are preserved; group and keyword comparison is case-insensitive,
  and keywords are deduplicated globally.
- The exact software-only catalogue fixture in `resumeGuidance.test.ts` is the
  only test assumption that must be replaced. Component behavior is already
  generic.

## Bounded catalogue change

- [x] Expand the flat role list from 16 to exactly 60 unique titles across 12
  conceptual families: Software/Data/IT; Business/Management;
  Finance/Accounting; Marketing/Sales/Communications; HR/Administration;
  Engineering/Technical; Design/Creative; Education/Research;
  Healthcare/Community Services; Customer Service/Hospitality;
  Logistics/Procurement/Supply Chain; and General Early-Career.
- [x] Preserve all 16 existing role strings and custom free-text role entry.
- [x] Replace the eight technology-heavy skill groups with 19 auditable broad
  categories containing exactly 120 globally unique curated skills. Retain
  core technology guidance while adding business, finance, marketing, HR,
  engineering, design, research, administration, customer-service,
  supply-chain, communication, leadership, and transferable skills.
- [x] Add exactly 19 exact role mappings, with 5–8 unchecked suggestions each,
  covering every family. Healthcare guidance is limited to transferable,
  non-credential claims.
- [x] Keep normalization limited to existing bounded whitespace and
  case-insensitive exact lookup. No substring, fuzzy, semantic, or AI matching.

## Test-first tasks

- [x] RED: replace the exact narrow catalogue fixture with table-driven family
  coverage, exact counts, uniqueness, non-empty data, and representative skill
  coverage assertions.
- [x] RED: prove representative exact cross-career mappings, unmapped/custom
  behavior, and non-technical canonical category-to-group mapping.
- [x] RED: prove Accountant, Digital Marketing Executive, and Civil Engineer
  suggestions remain unchecked and role changes preserve explicitly selected
  skills; preserve custom role, skill, and group behavior.
- [x] GREEN: modify only `resumeGuidance.ts` with the minimum readonly data
  expansion needed to satisfy those tests.
- [x] Run focused guidance, Guided Setup, Skill Picker, combined Phase 19A-2,
  affected Resume frontend, complete frontend, typecheck, root typecheck, and
  build gates in the approved order.
- [x] Run data-quality, privacy, generated-output cleanup, `git diff --check`,
  status/stat, and empty-staging checks; then update the current phase record.

## Expected changed files

- Production: `frontend/src/features/resumes/resumeGuidance.ts`
- Tests: `frontend/src/features/resumes/resumeGuidance.test.ts`,
  `frontend/src/features/resumes/ResumeGuidedSetup.test.tsx`, and
  `frontend/src/features/resumes/ResumeSkillPicker.test.tsx`
- Documentation: this record and `docs/planning/CURRENT_PHASE.md`

## Exclusions

- No Guided Setup or Skill Picker redesign, CSS change, migration, backend,
  schema, shared-type, provider, API, package, lockfile, Phase 19A-3, or Phase
  19A-4 change.
- No occupation taxonomy/service, external catalogue, fuzzy-search library,
  automatic skill selection, credential inference, or live Gemini request.
- Legacy/manual Resume skill groups remain user-owned and unchanged.

## Verification results

- RED reproduced only the missing catalogue behavior: guidance 4 failed/11
  passed, Guided Setup 2 failed/1 passed, and Skill Picker 3 failed/3 passed.
- GREEN: guidance 15/15, Guided Setup 3/3, Skill Picker 6/6, combined Phase
  19A-2 guidance 41/41, and affected Resume frontend 194/194.
- Complete frontend passed 807/807 across 62 files. Frontend typecheck, root
  typecheck, and production build passed; the build emitted only the existing
  React Router directive and chunk-size warnings.
- Data review confirmed 60 case-insensitively unique roles across 12 families,
  19 unique non-empty categories, 120 globally unique non-empty skills, and 19
  exact mappings whose 5–8 suggestions all exist in the catalogue.
- No component, CSS, backend, database/schema, shared-type, provider,
  package/lockfile, or legacy Resume-data change was made. Generated build
  outputs were removed, no sensitive logging or network/provider call was
  introduced, and staging remains empty.
