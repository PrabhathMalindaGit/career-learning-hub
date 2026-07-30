# Career Learning Hub — Codex Instructions

## 1. Instruction priority

Follow instructions in this order:

1. The current user task.
2. This root `AGENTS.md`.
3. `docs/planning/CURRENT_PHASE.md`.
4. Accepted decisions in `docs/planning/DECISION_LOG.md`.
5. Relevant architecture and phase documentation.
6. Existing implementation conventions.

- `CURRENT_PHASE.md` controls the active execution scope.
- Do not load or act on unrelated future phases. The complete roadmap remains in `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`.
- Stop when instructions conflict in a way that changes scope, security, architecture, or verification requirements.

## 2. Controlling coding discipline

- Use `karpathy-guidelines` for every implementation, debugging, refactoring, testing, and review task.
- Inspect before editing.
- State assumptions and ambiguities.
- Define measurable success criteria and propose the smallest valid plan.
- Make surgical changes. Preserve existing style and architecture.
- Avoid speculative abstractions and unrelated cleanup.
- Verify before reporting completion.

## 3. Repository architecture

- `frontend/`: React and Vite frontend.
- `backend/`: Express and TypeScript API.
- `packages/shared-types/`: shared contracts.
- `docs/`: architecture, historical phases, planning, and reports.
- Do not create another frontend, backend, API, web, apps, or monorepo structure, or move the active applications into new top-level directories.
- Do not replace React/Vite, Express/TypeScript, or MongoDB without an accepted architectural decision.
- Do not convert the application to Next.js.
- Do not introduce Supabase, another database, another authentication provider, or a second design system without approval.
- Do not install shadcn without an approved impact review.

## 4. Verified repository commands

Run these from the repository root unless a script explicitly requires another directory:

- Install workspace dependencies: `npm install`.
- Frontend development: `npm run dev:frontend`.
- Backend development: `npm run dev:backend`.
- Compatibility aliases: `npm run dev:web` and `npm run dev:api`.
- Type checking: `npm run typecheck`.
- Unit tests: `npm run test:unit`.
- Integration tests: `npm run test:integration`.
- Security tests: `npm run test:security`.
- Backend test suite: `npm run test`.
- Complete backend CI gate: `npm run test:ci`.
- Production build: `npm run build`.
- Test coverage: `npm run test:coverage`.

The root test and coverage scripts target the backend. Frontend unit tests are
available through `npm run test --workspace @career-learning-hub/web`, and
frontend coverage is available through
`npm run test:coverage --workspace @career-learning-hub/web`. The portable
`npm run test:browser` and `npm run test:e2e` scripts remain undeclared; Full
Application Browser Testing currently uses the authorized bundled Playwright
runtime directly. Adding a portable browser runner dependency or package
script requires separate approval. Record exact command results. Never claim
an unrun command passed.

## 5. General implementation rules

- Use strict TypeScript. Avoid `any` unless a narrowly justified boundary requires it, and avoid unsafe assertions.
- Reuse existing types and modules. Extend existing modules instead of recreating them.
- Keep presentation components separate from domain and API logic.
- Do not introduce mock production data or invent backend endpoints.
- Do not silently change API contracts or database schemas.
- Add dependencies only when the approved task requires them. Explain the impact before adding a substantial library.
- Preserve existing naming and folder conventions.
- Modify only files relevant to the active task.

## 6. Frontend authentication rules

- Keep access tokens in React memory only.
- Never store access tokens or refresh tokens in `localStorage`, `sessionStorage`, or IndexedDB.
- Keep refresh tokens in the existing HttpOnly cookie.
- Bootstrap authentication through the existing refresh endpoint.
- Use credentials for cookie-based authentication requests.
- Attach Bearer access tokens centrally through one shared API client.
- Retry an unauthorized request at most once after a successful refresh.
- Deduplicate simultaneous refresh attempts and clear authentication state when refresh fails.
- Protect authenticated routes and redirect authenticated users away from public-only authentication pages.
- Never print tokens in logs, reports, screenshots, or terminal output.
- Do not invent authentication behavior unsupported by the backend.

## 7. Frontend API and data rules

- Use one shared frontend API client and the configured Vite API base URL.
- Preserve backend request IDs in frontend errors.
- Support cancellation for obsolete requests where appropriate.
- Validate external data at trust boundaries.
- Provide loading, empty, error, and success states.
- Do not fabricate dashboard metrics, progress, activity, or scores.
- Do not expose quiz answers before successful submission.
- Do not expose private asset storage keys or signed secrets.
- Do not log resume content, document text, answers, job descriptions, prompts, or personal data.

## 8. Backend and security rules

- Preserve authentication and ownership controls.
- Derive owned-resource user IDs from authenticated server state, not client-supplied user IDs.
- Preserve CORS allowlists, rate limits, request validation, error normalization, request IDs, and private `no-store` caching where implemented.
- Preserve secure file-upload validation, private asset access controls, AI structured-output validation, and quiz answer-key secrecy.
- Preserve graceful shutdown and health-check behavior.
- Never weaken security controls to make a test pass.
- Never weaken ownership queries or IDOR protections.
- Never expose safe internal 404 ownership behavior through diagnostic messages.

## 9. Privacy and logging rules

- Do not log request bodies containing personal or user-generated content.
- Do not log passwords, tokens, cookies, secrets, API keys, resume content, interview answers, or document text.
- Do not expose personal data in reports.
- Do not use raw production database exports in Codex context.
- Use sanitized representative fixtures for migration development.
- Never commit `.env` files, secrets, tokens, sessions, raw exports, private uploads, or production personal data.

## 10. Legacy-project policy

- Legacy projects live outside the active repository and are not active workspaces.
- Do not access a legacy project unless `CURRENT_PHASE.md` explicitly grants access to that exact folder.
- Approved legacy access is read-only. Do not modify, rename, delete, or create files there.
- Do not run `npm install` or application commands in legacy folders, or add them to npm workspaces.
- Do not copy legacy authentication, backends, database models, API clients, environment files, package configuration, `node_modules`, or old ownership or security logic.
- First classify relevant legacy features as `PORT`, `REBUILD`, `REFERENCE ONLY`, or `REJECT`.
- Implement approved work only inside Career Learning Hub.

## 11. Testing and verification rules

- Define tests before declaring success.
- Run targeted checks first, then broader checks when the active phase requires them.
- Run the production build when applicable.
- Do not skip, delete, or weaken a failing test.
- Do not reduce TypeScript strictness to obtain a pass.
- Do not modify unrelated code to satisfy one failing check.
- Report unverified behavior honestly.

## 12. Three-attempt failure-loop rule

- A root failure is one underlying cause that produces the same failing result.
- Make at most three code-changing repair attempts for the same root failure.
- After the third unsuccessful attempt:
  - Stop modifying files and preserve the current diff.
  - Do not attempt another speculative repair.
  - Do not weaken tests or security controls.
  - Report the exact failing command and exact error.
  - Summarize all three attempts and state the likely unresolved cause.
  - Wait for human direction.

## 13. Human visual-QA gate

For visible React changes:

- Start the relevant local servers and provide the local URL.
- Provide an inspection checklist.
- Check desktop, tablet, and mobile layouts when applicable.
- Check loading, empty, error, success, and validation states when applicable.
- Use browser automation where useful; it does not replace human review.
- Stop before commit until the user provides the required visual approval token.

No visual QA is required for documentation-only or invisible changes, but report that explicitly.

## 14. Git and commit rules

- Inspect Git status before editing and do not overwrite unrelated work.
- Show `git status --short`, `git diff --stat`, and the scoped relevant diff.
- Check changed files for secrets, generated output, and unrelated edits.
- Do not stage or commit unless the user explicitly authorizes it.
- Do not push unless the user explicitly requests it.
- Do not rewrite history or use destructive Git commands against unrelated work.
- Keep commits phase-scoped and reviewable.

## 15. Completion report

Before reporting completion, include:

- Requested outcome, assumptions, and ambiguities.
- Files created and modified.
- Commands run with exact pass/fail results.
- Tests not run and why.
- Remaining risks and unverified behavior.
- Git status and diff summary.
- Required human approval token.

## 16. Prohibited shortcuts

- Disabling tests or commenting out failing behavior.
- Weakening validation, authentication, or authorization.
- Fabricating test results, metrics, or user data.
- Replacing working architecture for convenience.
- Broad unrelated refactors or silent dependency upgrades.
- Editing legacy projects.
- Printing secret contents.
- Committing without approval.
