# Career Learning Hub — Development Instructions

## 1. Instruction priority

Follow instructions in this order:

1. The current user task.
2. This root `AGENTS.md`.
3. `docs/planning/CURRENT_PHASE.md`.
4. Current accepted decisions in `docs/planning/DECISION_LOG.md`.
5. Relevant architecture, testing, deployment, and evidence documentation.
6. Existing implementation conventions.

- `CURRENT_PHASE.md` controls the active execution scope unless the current user task explicitly overrides it.
- Do not activate unrelated future work automatically.
- Stop when instructions conflict in a way that changes scope, security, architecture, or verification requirements.

## 2. Controlling development discipline

- Build the smallest secure and functional solution suitable for a university project.
- Reuse existing code and architecture.
- Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Inspect before editing.
- State assumptions and material ambiguities.
- Define measurable success criteria and propose the smallest valid plan.
- Make surgical changes and preserve established style and architecture.
- Avoid speculative abstractions and unrelated cleanup.
- Verify before reporting completion.

## 3. Repository architecture

- `frontend/`: React and Vite frontend.
- `backend/`: Express and TypeScript API and in-process background worker.
- `packages/shared-types/`: shared TypeScript contracts.
- `tests/browser/`: full-application browser workflow tests.
- `docs/`: architecture, planning, security, testing, deployment, and evidence records.
- Do not create a second frontend, backend, API, application shell, design system, or monorepo structure.
- Do not replace React/Vite, Express/TypeScript, or MongoDB without explicit architectural approval.
- Do not convert the application to Next.js.
- Do not introduce Supabase, another database, another authentication provider, or shadcn without explicit approval and impact review.

## 4. Verified repository commands

Run commands from the repository root unless a script explicitly requires another directory.

- Install workspace dependencies: `npm install`.
- Frontend development: `npm run dev:frontend`.
- Backend development: `npm run dev:backend`.
- Compatibility aliases: `npm run dev:web` and `npm run dev:api`.
- Root type checking: `npm run typecheck`.
- Backend test-source type checking: `npm run typecheck:tests`.
- Unit tests: `npm run test:unit`.
- Integration tests: `npm run test:integration`.
- Security tests: `npm run test:security`.
- Complete backend suite: `npm run test`.
- Complete backend CI gate: `npm run test:ci`.
- Production build: `npm run build`.
- Coverage: `npm run test:coverage`.
- Frontend tests: `npm run test --workspace @career-learning-hub/web`.
- Frontend coverage: `npm run test:coverage --workspace @career-learning-hub/web`.

The portable `npm run test:browser` and `npm run test:e2e` scripts remain undeclared. Full Application Browser Testing uses the separately approved bundled Playwright runtime until a repository-local runner is explicitly approved. Record exact command results and never claim an unrun command passed.

## 5. General implementation rules

- Use strict TypeScript.
- Avoid `any` unless a narrowly justified trust boundary requires it.
- Reuse existing types, modules, contracts, routes, and utilities before creating new ones.
- Keep presentation components separate from domain and API logic.
- Do not introduce production mock data or invent backend endpoints.
- Do not silently change API contracts or database schemas.
- Add dependencies only when the approved task requires them.
- Preserve existing naming and folder conventions.
- Modify only files relevant to the active task.

## 6. Authentication rules

- Keep access tokens in React memory only.
- Never store access or refresh tokens in `localStorage`, `sessionStorage`, or IndexedDB.
- Keep refresh tokens in the existing HttpOnly cookie.
- Bootstrap authentication through the existing refresh endpoint.
- Use credentials for cookie-based authentication requests.
- Attach Bearer access tokens centrally through the shared API client.
- Retry an unauthorized request at most once after a successful refresh.
- Deduplicate simultaneous refresh attempts and clear authentication state when refresh fails.
- Protect authenticated routes and redirect authenticated users away from public-only authentication pages.
- Never print tokens in logs, reports, screenshots, or terminal output.
- Do not invent authentication behavior unsupported by the backend.

## 7. Frontend API and data rules

- Use the shared frontend API client and configured Vite API base URL.
- Preserve backend request IDs in frontend errors.
- Support cancellation for obsolete requests where appropriate.
- Validate external data at trust boundaries.
- Provide purposeful loading, empty, error, and success states.
- Do not fabricate dashboard metrics, progress, activity, or scores.
- Do not expose quiz or interview answer keys before successful submission.
- Do not expose private asset storage keys or signed secrets.
- Do not log resume content, document text, answers, job descriptions, prompts, or personal data.

## 8. Backend and security rules

- Preserve authentication and ownership controls.
- Derive owned-resource user IDs from authenticated server state, not client-supplied user IDs.
- Preserve CORS allowlists, rate limits, request validation, error normalization, request IDs, and private `no-store` caching where implemented.
- Preserve secure upload validation, private asset access controls, AI structured-output validation, answer-key secrecy, graceful shutdown, and health-check behavior.
- Never weaken security controls, ownership queries, or IDOR protections to make a test pass.
- Never expose safe internal ownership behavior through diagnostic messages.

## 9. AI and Gemini rules

- The active release path is Gemini Direct only with fixed model `gemini-3.6-flash`.
- Preserve administrator-managed, personal encrypted, and disconnected credential states.
- Personal Gemini credentials remain AES-256-GCM encrypted server-side and must never be returned in plaintext after save.
- Keep provider credentials server-side; never expose them to browser storage, URLs, logs, jobs, usage events, or error payloads.
- Preserve test-before-write, routing-version checks, durable background jobs, progress polling, bounded retry, cancellation, timeout handling, execution fencing, idempotency, duplicate suppression, and validated atomic persistence.
- Do not silently activate another provider, provider fallback, token streaming, SSE, or WebSockets.

## 10. Privacy and logging rules

- Do not log request bodies containing personal or user-generated content.
- Do not log passwords, tokens, cookies, secrets, API keys, resume content, interview answers, prompts, or document text.
- Do not expose personal data in reports.
- Do not use raw production database exports in development context.
- Use sanitized representative fixtures for data-import, testing, and verification work.
- Never commit `.env` files, secrets, tokens, sessions, raw exports, private uploads, or production personal data.

## 11. Testing and verification rules

- Define tests before declaring success.
- Run targeted checks first, then broader checks when the active task requires them.
- Run the production build when applicable.
- Do not skip, delete, or weaken a failing test.
- Do not reduce TypeScript strictness to obtain a pass.
- Do not modify unrelated code to satisfy one failing check.
- Report unverified behavior honestly.
- Documentation-only changes do not require application test reruns unless they alter executable configuration, package metadata, scripts, or runtime behavior.

## 12. Three-attempt failure-loop rule

- A root failure is one underlying cause that produces the same failing result.
- Make at most three code-changing repair attempts for the same root failure.
- After the third unsuccessful attempt:
  - stop modifying files and preserve the current diff;
  - do not attempt another speculative repair;
  - do not weaken tests or security controls;
  - report the exact failing command and exact error;
  - summarize the attempts and likely unresolved cause;
  - wait for human direction.

## 13. Human visual-QA gate

For visible React changes:

- start the relevant local servers and provide the local URL;
- provide an inspection checklist;
- check desktop, tablet, and mobile layouts when applicable;
- check loading, empty, error, success, and validation states when applicable;
- use browser automation where useful, but do not treat it as a replacement for human review;
- stop before merge until the required human visual approval is provided.

No visual QA is required for documentation-only or invisible changes; state that explicitly.

## 14. Git, branch, merge, and deployment rules

- Never perform feature work directly on `main`.
- Inspect Git status before editing and do not overwrite unrelated work.
- Keep one bounded branch/PR per task unless a repair must remain on the same branch.
- Show the exact changed-file set and scoped diff before final approval.
- Check changed files for secrets, generated output, and unrelated edits.
- Do not merge without explicit user approval of the exact qualified head SHA.
- Deployment requires separate explicit approval.
- Branch deletion requires separate explicit approval.
- Do not rewrite history or use destructive Git commands against unrelated work.

## 15. Completion report

Before reporting completion, include:

- requested outcome and scope boundary;
- files created, modified, and deleted;
- commands or checks actually run with exact pass/fail results;
- tests not run and why;
- remaining risks and unverified behavior;
- Git/branch status and diff summary;
- the exact approval required for the next gated action.

## 16. Prohibited shortcuts

- Disabling tests or commenting out failing behavior.
- Weakening validation, authentication, authorization, or privacy controls.
- Fabricating test results, metrics, or user data.
- Replacing working architecture for convenience.
- Broad unrelated refactors or silent dependency upgrades.
- Printing secret contents.
- Merging, deploying, or deleting branches without the required approval.
