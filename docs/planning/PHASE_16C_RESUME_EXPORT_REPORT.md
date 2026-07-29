# Phase 16C Resume Export and Print Report

## Result

- Phase: 16C - Resume PDF Export and Print
- Result: `COMPLETED / APPROVED`
- Branch: `phase-12-unified-frontend`
- Implementation baseline and handoff full HEAD:
  `f63f9f488f7c2288795d69f37cf8effe9c3dce78`
- Baseline subject: `Build responsive application shell and breadcrumbs`
- Accepted approval token:
  `PHASE_16C_RESUME_EXPORT_VISUAL_APPROVED`
- Approval token accepted: yes
- Implementation handoff staged, committed, or pushed: no

Phase 16 remains active. Phase 16D through Phase 16G and Phase 17 remain
planned and inactive.

## Skills and assumptions

The requested `using-superpowers`, `karpathy-guidelines`, `define-goal`,
`frontend-design`, `frontend-skill`, `test-driven-development`,
`systematic-debugging`, `playwright`, `technical-writing`,
`verification-before-completion`, and `finishing-a-development-branch`
skills were available and applied. The exact
`build-web-apps:react-best-practices` skill was unavailable;
`vercel-react-best-practices` was available and applied. The
repository-required `brainstorming` and `modern-web-guidance` skills were
also available and applied. The PDF skill was applied for temporary artifact
rendering and inspection. No skill was installed.

The approved DEC-012 architecture and this activation prompt supplied the
controlling design. Standard/Narrow margins were omitted because they are
conditional session-only scope. A page-sized screen preview was omitted
because browser print settings prevent an honest pagination guarantee.

## Architecture and source rules

The workspace selects one saved source:

- the canonical current `ResumeVersion`; or
- a historical owned `ResumeVersion` only after its read-only snapshot loads
  successfully.

The mutable editor draft never supplies the print surface. Any dirty draft
disables printing and directs the user to Save New Version or Discard. The
existing save, discard, route-blocking, before-unload, immutable-version, and
conflict behavior remains in place. Starting another historical load clears
the prior snapshot immediately, and route changes or newer snapshot requests
abort stale snapshot work.

The controls identify the current or historical saved version number without
showing database IDs. Historical content uses the Resume's current design
because design settings are Resume-level and are not version-snapshotted.

## Page-size persistence

The controls expose only A4 and Letter. A change sends the complete current
design to the existing authenticated, owner-scoped
`PATCH /resumes/:resumeId/design` endpoint. The frontend strictly parses the
returned `{ resume }` envelope, confirms route identity, and reconciles only
the canonical response.

The previous selected value remains visible while saving and after failure.
Duplicate requests are disabled. Safe errors use the existing fallback
language and retain a request ID when supplied. A design-only update does not
create a ResumeVersion or change Resume content. No backend or shared
contract change was required.

## Print utility

`resumePrint.ts` creates a deterministic lowercase title hint from the Resume
title, version number, and paper size. It removes trailing PDF extensions,
normalizes unsafe characters, collapses separators, trims separators, uses
`resume` as the empty-title fallback, and bounds the full hint to 96
characters. It does not use a database ID, filesystem path, storage, or a
filename dependency.

Before printing, the utility captures the original document title, applies
the temporary hint, activates print state, and waits for two animation
frames. It calls `window.print()` once. An `afterprint` listener restores the
title and state; a four-second fallback covers inconsistent browser
`afterprint` behavior. A module-local guard rejects a duplicate print call
while preparation or printing is active. The UI states that the browser
controls the final filename and PDF settings.

The browser, not the application, creates or saves the final PDF. Embedded
PDF metadata and an exact filename remain deferred and are not promised.

## ATS Classic print surface

The implementation reuses `ResumePreview` for both screen and print
rendering. A separate in-place print-only instance receives only the selected
saved version. It keeps the ATS Classic structure and attaches the selected
A4 or Letter page rule.

Print CSS removes the AppShell sidebar, mobile header, breadcrumbs, editor,
print controls, history, analysis, alerts, dialogs, account controls,
request IDs, and other application chrome. The selected surface uses a white
background, dark text, grayscale-safe hierarchy, visible borders, selectable
text, and visible overflow. Headings avoid separating from following
content, compact entries avoid breaks when practical, overlong content can
split, and widow/orphan hints remain bounded.

Email and phone values use safe `mailto:` and `tel:` links. Resume and
project URLs allow only `http:` and `https:` anchors with safe external-link
attributes. Unsupported schemes render as text and never become anchors.
No HTML injection or provider HTML is used.

## Test-driven implementation

Initial RED evidence covered six focused files. Before production behavior
existed, the run recorded 18 passing tests and five failing tests, with three
new suites unable to load their missing modules. This confirmed the intended
print utility, controls, preview, API, contract, and workspace boundaries.

Final focused result:

- six files;
- 43/43 tests passed.

The focused coverage verifies canonical current and historical sources,
dirty blocking, stale snapshot cancellation, A4/Letter controls, canonical
design reconciliation, safe failure/request-ID handling, title lifecycle,
duplicate print prevention, safe links, unsafe-link rejection, and print
surface attributes.

One compile-only repair initialized an optional `useRef` explicitly and kept
two test fixture page-size values as string literals. No runtime behavior
changed.

## Complete frontend and build verification

- Complete frontend:
  `npm run test --workspace @career-learning-hub/web`
  - 45 files passed
  - 608/608 tests passed
- Root typecheck: `npm run typecheck`
  - frontend passed
  - backend passed
  - shared types passed
- Production build:
  `VITE_API_URL=https://api.example.test/api/v1 npm run build`
  - frontend and backend passed
  - generated output was removed
- Build advisory:
  - JavaScript chunk: 571.09 kB
  - gzip: 157.76 kB
  - retained as a Phase 16F measurement candidate

## Full Application Browser Testing

The configured complete suite was executed once with the existing
machine-bundled Playwright runtime, `tests/browser/playwright.config.cjs`,
one worker, zero retries, and all 21 configured workflows.

- Complete configured run: 18/21 passed.
- Desktop: 6/7 passed in the complete run.
- Tablet: 6/7 passed in the complete run.
- Mobile: 6/7 passed in the complete run.
- The only failures were the three copies of the Resume workflow. They first
  stopped on a strict text locator after the new dirty-print guidance added
  a second "Unsaved changes" match.
- Authentication, ownership isolation, private PDF, Quiz secrecy, console,
  page-error, and non-Resume horizontal-overflow coverage passed in the
  complete run.

The complete command was not run a second time because the activation
requires one complete-suite execution. Repairs were verified through the
Resume specification alone across all three projects.

Distinct bounded browser-spec repairs were:

1. make the existing dirty-state locator exact;
2. locate an anchor structurally while the print-only surface is hidden in
   screen media;
3. keep the completeness marker within the existing 5,000-character field
   limit; and
4. fill the same bounded field to its limit so the multi-page fixture
   actually spans two pages.

These were separate failing results, not repeated attempts for one root
failure. The final targeted Resume result was 3/3 in 26.1 seconds:

- desktop 1/1;
- tablet 1/1;
- mobile 1/1.

Together, the complete run and final targeted run provide fresh passing
evidence for every configured workflow after the test-only corrections.
The browser spec preserves its original create, edit, version, validation,
dirty-navigation, and page-health coverage.

## Responsive and print QA

Standalone Chrome QA used synthetic data only.

Control results:

| Size | Overflow | Controls fit | Paper-size height | Print-button height |
| --- | ---: | --- | ---: | ---: |
| 1440x900 | 0 px | yes | 44 px | 44 px |
| 1024x768 | 0 px | yes | 44 px | 44 px |
| 768x1024 | 0 px | yes | 44 px | 44 px |
| 390x844 | 0 px | yes | 44 px | 44 px |
| 320x720 | 0 px | yes | 44 px | 44 px |

A faithfully represented 200% layout also had zero horizontal overflow and
kept the controls inside the viewport. The operator later approved actual
browser 200% zoom during visual review.

The desktop sidebar remained visible at 1024 px and wider. The existing
mobile header remained active below the 980 px boundary. Breadcrumbs
remained visible in screen media. The dirty state disabled print and kept
the Save New Version and Discard guidance visible.

Print-media checks confirmed the effective exclusion of sidebar, mobile
header, breadcrumbs, editor, controls, history, and analysis through the
hidden non-print parent. Only the print surface appeared. The paper computed
visible overflow, `rgb(17, 17, 17)` text, and a white background. A safe
synthetic HTTPS link remained present. No console warning/error, page error,
horizontal overflow, provider call, or export/PDF API request occurred.

## Temporary PDF inspection

Headless Chrome created temporary QA PDFs. This was test evidence, not
production PDF generation.

| Artifact | Pages | Verified size | Extracted characters | Link annotations |
| --- | ---: | --- | ---: | ---: |
| A4 one-page | 1 | A4 | 168 | 2 |
| A4 multi-page | 2 | A4 | 5,107 | 2 |
| Letter one-page | 1 | Letter | 168 | 2 |
| Letter multi-page | 2 | Letter | 5,107 | 2 |

Text extraction found the synthetic candidate, portfolio link, and
multi-page completeness marker. Rendered first and final pages showed no
clipping, overlap, hidden trailing section, or blank page. Pixel inspection
confirmed white backgrounds and dark text. Grayscale renders retained
heading, rule, link, and body-text readability.

All temporary PDFs, PNG renders, the temporary QA script, browser reports,
test results, screenshots, traces, videos, runtime files, build output, and
repository-local TypeScript cache were removed.

## Security, privacy, and cleanup

- Phase 15 controls and P15-001 restrictions remain unchanged.
- Authentication, ownership, immutable versions, save conflicts, private
  PDF access, Quiz secrecy, request IDs, and response validation remain
  unchanged.
- Backend production/tests, shared types, routes, models, and migrations are
  unchanged.
- Package manifests and `package-lock.json` are unchanged.
- No dependency was installed or changed.
- No `.env` file was read or modified.
- No provider, Gemini, Atlas, cloud storage, deployment, production data, or
  legacy project was used.
- Repeated browser teardown evidence: `users=0`, `owned=0`.
- Temporary frontend, backend, and isolated MongoDB services were stopped.
- Ports 4173 and 8000 were closed at handoff.

## Exact changed paths

Production:

1. `frontend/src/features/resumes/ResumeWorkspace.tsx`
2. `frontend/src/features/resumes/ResumePreview.tsx`
3. `frontend/src/features/resumes/ResumePrintControls.tsx`
4. `frontend/src/features/resumes/resumePrint.ts`
5. `frontend/src/features/resumes/resumeApi.ts`
6. `frontend/src/features/resumes/resumeContracts.ts`
7. `frontend/src/features/resumes/resumeWorkspace.css`

Tests:

8. `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
9. `frontend/src/features/resumes/ResumePreview.test.tsx`
10. `frontend/src/features/resumes/ResumePrintControls.test.tsx`
11. `frontend/src/features/resumes/resumePrint.test.ts`
12. `frontend/src/features/resumes/resumeApi.test.ts`
13. `frontend/src/features/resumes/resumeContracts.test.ts`
14. `tests/browser/specs/resume.spec.cjs`

Governance:

15. `docs/planning/CURRENT_PHASE.md`
16. `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
17. `docs/planning/PHASE_16C_RESUME_EXPORT_REPORT.md`

At implementation handoff, nothing was staged, committed, or pushed.

## Approval closeout

The operator accepted Phase 16C with:

`PHASE_16C_RESUME_EXPORT_VISUAL_APPROVED`

Human review approved the current canonical saved Resume in A4 and Letter,
an explicitly loaded historical saved Resume, dirty-draft print blocking,
Save New Version and Discard remediation, one-page and multipage output,
grayscale readability, useful links, and the absence of clipping or an
unexpected blank final page.

The print output excluded the sidebar, mobile header, breadcrumbs, editor,
controls, analysis, dialogs, request IDs, and account UI. Responsive controls
were approved at 1440x900, 1024x768, 768x1024, 390x844, 320x720, and actual
200% browser zoom. Manual browser Print / Save as PDF was approved with
synthetic data, and the generated synthetic PDF was deleted after review.

No implementation change was required during closeout. Standard/Narrow
margins and a page-sized screen preview remain omitted conditional scope.
Exact filenames and embedded PDF metadata remain unguaranteed. No backend,
shared-contract, dependency, or deployment expansion occurred. The
571.09 kB build advisory remains a Phase 16F measurement candidate.

The complete browser-run evidence remains 18/21 before test-only corrections,
and the corrected targeted Resume evidence remains 3/3. Phase 16G must run a
fresh complete integrated Full Application Browser Testing suite.

While this approval wording is being edited, the closeout commit has not yet
been created. Push remains prohibited and has not occurred. Phase 16D remains
inactive and requires a separate activation prompt.

## Accepted limitations

- The operating-system print dialog is not fully automatable.
- Browser print settings can override application hints.
- The document title is only a best-effort filename hint.
- Exact filenames and embedded PDF metadata are not guaranteed.
- Standard/Narrow margins and a page-sized screen preview remain omitted
  conditional scope.
- One complete 21-test command recorded 18/21 before test-only locator
  corrections; final Resume evidence is the separate 3/3 responsive run.
