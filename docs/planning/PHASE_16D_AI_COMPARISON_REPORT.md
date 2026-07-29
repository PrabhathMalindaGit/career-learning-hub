# Phase 16D AI Comparison Report

## Result and baseline

- Phase: 16D — Original-versus-Suggested AI Comparison
- Result: `COMPLETED / APPROVED`
- Branch: `phase-12-unified-frontend`
- Baseline and final HEAD:
  `ed07be20a856ca7e40f2043e1e0ef743e6755aee`
- Subject: `Add saved Resume printing`
- Starting worktree: clean; no staged or untracked paths; no active Git
  operation
- Accepted visual approval token:
  `PHASE_16D_AI_COMPARISON_VISUAL_APPROVED`
- Approval token accepted: yes

## Skills, assumptions, and boundary

All requested skills were available and applied: `using-superpowers`,
`karpathy-guidelines`, `define-goal`, `frontend-design`, `frontend-skill`,
`test-driven-development`, `systematic-debugging`, `playwright`,
`technical-writing`, `verification-before-completion`, and
`finishing-a-development-branch`. The exact
`build-web-apps:react-best-practices` skill was unavailable; the requested
`vercel-react-best-practices` fallback was available and applied. The
repository-required `brainstorming` and `modern-web-guidance` skills were
loaded. Modern guidance's download-capable `npx` search was not run because
dependency download was prohibited. No skill was installed.

DEC-012 and the activation prompt resolved the component, interaction,
responsive, and semantic design. The implementation assumes the existing
validated `ResumeAnalysis` is the only renderable source and retains its
suggestion UUID, bullet UUID, original text, rewritten text, rationale,
verification flag, analysis ID, Resume ID, and source Resume-version ID.
Invalid or partial analysis continues to fail at the runtime parser before
anything renders.

## Implementation

`ResumeSuggestionComparison` is a presentation-only boundary. It receives one
validated suggestion, ordinal position, selected/disabled state, and a toggle
callback. It performs no fetch, mutation, payload construction, or HTML
interpretation. DOM and screen-reader order is:

1. Original;
2. Suggested rewrite;
3. Reason;
4. conditional verification warning; and
5. selection.

The pure `diffResumeText` utility tokenizes Unicode letters/numbers,
hyphenated words, apostrophes, and punctuation. A deterministic
longest-common-subsequence table aligns tokens, with stable removal-first
tie-breaking. It normalizes whitespace, attaches punctuation readably,
coalesces contiguous segment types, mutates no input, uses no browser/React
global, and remains practical for the existing 2,000-character field bound.
Tests cover unchanged, addition, removal, replacement, contiguous changes,
repeated words, whitespace, punctuation-only changes, adjacency, apostrophes,
Unicode, empty pure-utility inputs, determinism, non-mutation, and the
contract bound.

Original removed segments use semantic `del`; suggested additions use
semantic `ins`. Visible Removed/Added pills, distinct borders, line-through
and double-underline decoration provide non-color meaning. Text wraps with
`overflow-wrap` and `word-break`; provider-like markup renders as React text.
At 1200 CSS pixels and above the comparison is two columns. Below that it
stacks Original before Suggested, including the represented 200% layout.
Phase 16C's print surface is unchanged, and non-print workspace content
remains excluded from print.

`AiRecommendations` changed only its suggestion renderer. Caller-owned
selected IDs, no automatic selection/application, apply disabling, busy and
stale states, existing confirmation dialog, cancel preservation, and action
copy remain intact. Apply still sends only the analysis ID and deduplicated
stored suggestion IDs. Workspace regressions prove safe 409 presentation with
a request ID and retained selection. Successful browser application used the
real backend path and adopted immutable version 5 after backend ownership,
source-version, bullet, and exact-original checks.

## Test-driven evidence

Initial RED:

- the diff and comparison suites failed to load because their production
  modules did not yet exist;
- two new `AiRecommendations` expectations failed against the old
  insufficient presentation.

Final focused command covered `AiRecommendations`,
`ResumeSuggestionComparison`, `resumeWordDiff`, `ResumeWorkspace`,
`resumeContracts`, and `resumeApi`:

- six files passed;
- 45/45 tests passed.

One test-only correction changed a whitespace-only invalid fixture to an
empty value because the existing contract rejects empty stored text but does
not define whitespace-only text as empty. No production validator changed.

Complete frontend:

- 47 files passed;
- 619/619 tests passed.

Root `npm run typecheck` passed for frontend, backend, and shared types.
`VITE_API_URL=https://api.example.test/api/v1 npm run build` passed for the
frontend and backend. The measured frontend assets were:

- CSS: 73.46 kB, 13.48 kB gzip;
- JavaScript: 573.56 kB, 158.58 kB gzip.

The existing large-chunk advisory remains a Phase 16F measurement candidate;
no speculative optimization was performed.

## Browser verification

The Resume browser workflow now seeds a stored synthetic analysis and
completed job directly in the isolated local database, intercepting only the
provider-triggering queue request. It verifies Original, Suggested rewrite,
Reason, warning, Removed/Added, `del`/`ins`, unchanged behavior, markup as
text, no raw IDs, no automatic selection, keyboard Space selection,
confirmation, cancel preservation, ID-only payload, real immutable-version
adoption, stale blocking, print regression, no provider call, page health,
console/page errors, and horizontal overflow.

The first targeted run exposed two independent test-fixture issues: a sticky
preview intercepted a pointer click after very long content, and trailing
fixture whitespace differed from the backend's normalized source text. The
spec now uses the keyboard for the apply action and trims the synthetic
stored source. No application code, assertion strength, or security control
changed.

- Final targeted Resume: 3/3 in 20.1 seconds.
- Complete configured suite: 21/21 in 47.6 seconds.
- Desktop: 7/7.
- Tablet: 7/7.
- Mobile: 7/7.
- Workers: one.
- Retries: zero.

Authentication, ownership isolation, private PDF, Quiz secrecy, sidebar and
drawer, breadcrumbs, Resume print/export, console, page-error, and
horizontal-overflow coverage passed. Phase 16G still requires a separate
fresh complete integrated run.

Standalone provider-free responsive/accessibility measurement passed 6/6 at
1440×900, 1024×768, 768×1024, 390×844, 320×720, and 720×450 as a faithful
200% reflow representation. It confirmed two columns only at 1440, stacked
Original-before-Suggested elsewhere, long-content containment, no document
overflow, semantic changes, explicit labels, plain-text markup, no IDs,
keyboard selection, dialog initial focus/Escape/focus return, preserved
selection, and no provider request. Two initial measurement runs failed only
on ambiguous temporary locators; exact/first locators passed without product
changes.

## Exact repository manifest

Production:

1. `frontend/src/features/resumes/AiRecommendations.tsx`
2. `frontend/src/features/resumes/ResumeSuggestionComparison.tsx`
3. `frontend/src/features/resumes/resumeWordDiff.ts`
4. `frontend/src/features/resumes/resumeWorkspace.css`

Tests:

5. `frontend/src/features/resumes/AiRecommendations.test.tsx`
6. `frontend/src/features/resumes/ResumeSuggestionComparison.test.tsx`
7. `frontend/src/features/resumes/resumeWordDiff.test.ts`
8. `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
9. `frontend/src/features/resumes/resumeContracts.test.ts`
10. `frontend/src/features/resumes/resumeApi.test.ts`
11. `tests/browser/specs/resume.spec.cjs`

Governance:

12. `docs/planning/CURRENT_PHASE.md`
13. `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
14. `docs/planning/PHASE_16D_AI_COMPARISON_REPORT.md`

No backend, shared contract, production Resume API/contract, router, print
source/utility, package, lockfile, dependency, environment file, provider,
Atlas, deployment, or legacy project changed or was used. Phase 15 controls
and P15-001 supervised academic-MVP restrictions remain binding.

## Cleanup, limitations, and human review

Every browser teardown reported `users=0, owned=0`. Temporary frontend,
backend, and isolated MongoDB services stopped. Ports 4173 and 8000 are
closed. Browser reports, results, screenshots, traces, videos, runtime data,
build output, TypeScript caches, and the temporary QA matrix are removed at
handoff. No Resume text remains in an artifact.

Known limitations:

- the word diff is intentionally local and bounded, not a general diff
  framework;
- whitespace is normalized for review readability;
- represented 200% automated reflow does not replace actual human browser
  zoom review;
- human judgment is still required for visual hierarchy, punctuation noise,
  long-content readability, and focus appearance.

Before approval, human review was required to inspect content, non-color diff
meaning, all five required viewports, actual 200% zoom, keyboard selection,
focus, dialog cancellation, immutable apply, stale/conflict safety,
markup-as-text, raw-ID absence, and provider-free behavior.

At the implementation handoff before human approval, Phase 16D was not yet
completed or approved, and nothing was staged, committed, or pushed. Phase
16E remained `PLANNED` / `INACTIVE`.

## Approval closeout

- Accepted token: `PHASE_16D_AI_COMPARISON_VISUAL_APPROVED`.
- The operator approved the Original region, Suggested rewrite region,
  Reason, conditional verification warning, and selection association.
- Removed and Added meanings were approved without color dependence.
- Punctuation and replacement readability, long-content readability, and
  visible focus were approved.
- Keyboard checkbox selection, confirmation, cancellation with focus return,
  immutable-version application, and stale/conflict safety were approved.
- Provider-like markup rendering as text, raw-ID absence, and provider-free
  behavior were approved.
- Human visual approval covered 1440×900, 1024×768, 768×1024, 390×844,
  320×720, and actual 200% browser zoom.
- No implementation change was required during closeout.
- The JavaScript advisory remains a Phase 16F measurement candidate. No
  speculative performance repair was authorized.
- Phase 16G still requires its own fresh complete integrated Full Application
  Browser Testing run.
- No backend, shared-contract, dependency, or deployment expansion occurred.
- The closeout commit had not yet been created while this documentation was
  being edited. Push remains prohibited and has not occurred.
- Phase 16D is `COMPLETED` / `APPROVED`.
- Phase 16E remains `PLANNED` / `INACTIVE` and requires a separate activation
  prompt.
