# Phase 14 End-to-End Browser Testing Implementation Plan

## 1. Document control

- Prompt: `CLH-PHASE-14-ACTIVATE-AND-BUILD-E2E-COVERAGE-01`
- Status: COMPLETED
- Human approval token:
  `PHASE_14_E2E_BROWSER_TESTING_APPROVED` (`APPROVED`)
- Authorized closeout commit:
  `Add end-to-end application coverage`

## 2. Baseline

- Branch: `phase-12-unified-frontend`
- Full HEAD: `d32e584702eceae6383bb88e7411bba6e482ebdd`
- Subject: `Complete Phase 13 integrated QA closeout`
- Phase 13: COMPLETED
- Phase 14: COMPLETED
- Phase 15: PLANNED / INACTIVE

## 3. Existing E2E infrastructure

- The repository did not contain Playwright configuration, browser specs,
  E2E scripts, global setup or teardown, storage-state helpers, or artifact
  rules.
- The Codex local runtime supplies `playwright` and `playwright-core`
  `1.61.1`, including the `playwright/test` runner export.
- `@playwright/test` is not separately installed or declared.
- Installed Google Chrome `150.0.7871.187` passed an escalated headless
  Playwright launch check.
- No dependency or browser installation is required or authorized.

## 4. Architecture decision

- Keep all browser-test code under `e2e/`.
- Use CommonJS configuration and specs so the explicit local `NODE_PATH`
  resolves the bundled Playwright test runner without package changes.
- A bounded service controller starts one isolated `MongoMemoryReplSet`, the
  existing Express server, and the existing Vite frontend.
- Tests use the real browser, frontend, API, authentication cookies, database,
  and private local storage. No production endpoint is mocked.
- Workers are limited to one to keep fixture ownership and cleanup
  deterministic.

## 5. Browser-project matrix

| Project | Engine | Viewport |
| --- | --- | --- |
| desktop | Installed Chrome through Playwright Chromium | 1440 × 900 |
| tablet | Installed Chrome through Playwright Chromium | 768 × 1024 |
| mobile | Installed Chrome through Playwright Chromium | 390 × 844 |

Chrome's normal user agent is retained. No branded device emulation or
cross-browser installation is used.

## 6. Fixture model

- Every identity uses a unique `phase14-*.test` email.
- Passwords and signing secrets are generated at runtime and are not written
  to tracked files or test output.
- User A owns populated Resume, Interview, and Learning records.
- User B owns separate or empty state and is used for ownership denials.
- Explicit registration scenarios create users through the UI and real
  registration endpoint. Other setup-only users are inserted directly with
  bcrypt-hashed runtime passwords so the three-project fixture matrix does
  not weaken or exhaust the real per-IP registration limiter.
- UI workflows create primary records where required. Targeted database
  helpers seed only setup identities, stored provider results, and
  deterministic pagination volume that the product cannot create without a
  prohibited provider call.
- The committed PDF is synthetic, contains no personal data, and is used only
  with the isolated test storage.

## 7. Authentication strategy

- Registration and sign-in assertions run through the browser UI.
- Other workflows still sign in through the UI so access-token handling,
  refresh-cookie behavior, route guards, and bootstrap reloads remain real.
- No storage-state file is committed or retained.
- Tokens, cookies, passwords, and session material are not logged.

## 8. Cleanup strategy

- Each test records its created user IDs.
- Cleanup deletes only records owned by those IDs and the tagged users.
- The private runtime directory is removed when the service controller stops.
- Global teardown performs a final tagged-user and tagged-record audit.
- The isolated replica set is stopped after the suite, including failure
  paths.

## 9. Domain workflow matrix

- Authentication: registration and sign-in validation, successful
  registration/sign-in, protected/public-only redirects, refresh bootstrap,
  sign-out, and return to sign-in.
- Dashboard: empty and populated states, progress windows, real synthetic
  metrics, activity pagination, route navigation, and containment.
- Resume: empty state, UI creation, canonical workspace, edit, immutable
  version save/history, validation, unsaved-navigation dialog, and ownership
  denial.
- Interview: empty state, UI session creation, manual question, filters,
  pinning, notes, written attempt, provider-unavailable state, Pager
  boundaries, repaired controls, and ownership denial.
- Learning: empty state, upload validation, synthetic PDF upload, ready
  document, private source, stored conversation, provider-unavailable chat,
  Flashcards, Quiz secrecy/submission/review, safe missing state, ownership
  denial, and disposable deletion.
- Settings and route state: public/protected redirect behavior, settings,
  logout, and unknown route.

## 10. Ownership-boundary matrix

User B must receive a neutral unavailable state for User A's Resume,
Interview session, Learning document, conversation, Flashcard set, Quiz, and
Quiz attempt. Assertions exclude User A titles and private content.

## 11. Private-data boundaries

- Private PDFs remain in isolated local storage.
- Browser source access is asserted through the authenticated application
  control and an in-memory blob URL.
- Test names, logs, screenshots, traces, and reports exclude secrets and
  document bodies.

## 12. Quiz-secrecy boundaries

- Before submission, no correct-answer marker, explanation, or answer key may
  appear.
- After real submission, the stored score and explanation must appear on the
  attempt review route.

## 13. Provider-unavailable strategy

- No Gemini, OpenAI, OpenRouter, or other remote provider credential is
  configured.
- Job workers remain disabled.
- Provider-dependent data is seeded as stored completed or failed synthetic
  state; browser assertions require truthful queued, paused, or unavailable
  language.

## 14. Failure-artifact strategy

- Screenshots: only on failure.
- Traces: retained only on failure.
- Videos: disabled.
- Retries: zero.
- Output root:
  `/private/tmp/career-learning-hub-phase14/`.
- HTML report, screenshots, traces, runtime metadata, and any session
  material stay outside the repository and are removed after a passing run.

## 15. Authorized files

- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/PHASE_14_E2E_IMPLEMENTATION_PLAN.md`
- `docs/planning/PHASE_14_E2E_VERIFICATION_REPORT.md`
- `e2e/**`
- Separately authorized repair:
  `backend/src/modules/learning/learningChat.service.ts`
- Separately authorized regression:
  `backend/src/tests/integration/learningDocumentDeletionConcurrency.integration.test.ts`

## 16. Protected files

- Frontend production source
- Backend production and tests other than the two separately authorized files
- Shared types
- Existing unit, integration, and security tests
- Package manifests and lockfiles
- Environment files
- Database models and migrations
- Deployment files and legacy projects

## 17. Test command

The suite uses the bundled runtime explicitly:

```text
NODE_PATH=<Codex runtime node_modules> <Codex runtime node> <Playwright CLI> test --config=e2e/playwright.config.cjs
```

The verification report records the resolved absolute command used locally.

## 18. Verification commands

- Desktop smoke project with `@smoke`
- Complete Playwright suite across desktop, tablet, and mobile exactly once
- `npm run test --workspace @career-learning-hub/web`
- `npm run typecheck --workspace @career-learning-hub/web`
- `npm run typecheck`
- `npm run build`
- Git scope, artifact, and whitespace checks

## 19. Stop conditions

- Missing or unusable local Playwright/browser infrastructure
- Product defect requiring production code
- Fixture or environment blocker that cannot be repaired within three
  evidence-backed E2E-harness attempts
- Any unresolved Critical, Important, product, fixture, environment, or
  verification blocker
- Unauthorized file-scope change

The desktop smoke gate initially reached the Learning chat product-defect stop
condition. A separate prompt authorized the bounded repair. The successful
transaction callback now returns an explicit sentinel, the real replica-set
regression passes, the corrected desktop smoke passes 6/6, and the complete
desktop/tablet/mobile matrix passes 21/21. Downstream frontend, typecheck,
build, cleanup, and scope gates pass. Human review approved the result, and
Phase 14 is completed with no unresolved blocker.

## 20. Human review gate

Human review approved the Learning repair, backend regression, six-spec
architecture, desktop/tablet/mobile projects, assertion quality, synthetic
fixture safety, ownership checks, private-data controls, Quiz secrecy,
failure-only artifact policy, cleanup, and clean repository scope. The
approval token is recorded once in Document control.

Phase 15 remains planned and inactive and requires a separate
operator-approved activation prompt.

## 21. Expected commit boundary

Authorized by `CLH-PHASE-14-CLOSEOUT-AND-COMMIT-01`:
`Add end-to-end application coverage`.
