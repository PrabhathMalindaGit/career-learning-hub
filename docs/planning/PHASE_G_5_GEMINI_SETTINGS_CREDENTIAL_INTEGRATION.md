# G-5 — Gemini-only Settings and Credential Integration

## Status and boundary

- Branch: `feature/multi-provider-ai-routing`
- Starting commit: `8e6ba33de1aa6b49ac2cf78133c1b683823ff481`
- Starting subject: `Harden Gemini job resilience and progress delivery`
- Authorization: approved by the G-5 implementation prompt on 2026-08-06
- Status: completed and human-approved locally; pull-request merge and
  staging deployment verification remain pending
- Implementation commit: `c7b3a0979783e4a8dff3ba27f4ccb82627d7d0c7`

G-5 releases only Gemini Direct with fixed model `gemini-3.6-flash`. It does
not activate OpenRouter, provider/model selection, fallback, streaming, SSE,
WebSockets, deployment, Phase 19, or any Git publication action.

## Assumptions and smallest complete design

1. `AiCredential`, `AiProviderPreference`, the AES-256-GCM credential vault,
   routing profiles/snapshots, execution leases, and the execution-time
   resolver remain authoritative. G-5 adds no parallel security or routing
   subsystem.
2. Administrator-managed Gemini is available only when the existing explicit
   server policy is enabled and a server-side Gemini key exists. A disabled
   preference never falls through to that key.
3. Personal credential save and replacement test fixed synthetic content once
   with `gemini-3.6-flash` before encrypting or persisting the candidate.
4. Replacing an active personal key updates the credential secret version and
   active preference revision/version in one MongoDB transaction. Deletion
   reuses the existing lease-drain lifecycle and moves an active user to the
   disconnected state without selecting another source.
5. Resume, Interview, Learning summary/grounded chat, Flashcards, and Quiz keep
   their existing gateway integration; job enqueue now always compiles the
   authoritative secret-free snapshot and the gateway always authorizes it.

## Security contract

- Vault fields remain ciphertext, 96-bit nonce, 128-bit authentication tag,
  encryption-key version, and AAD version. AES-GCM additional authenticated
  data remains the existing canonical sequence: `clh`, `ai-credential`,
  `aad-v1`, credential ID, user ID, provider ID, credential secret version,
  and encryption-key version.
- Encryption-key rotation continues to use the current write key and bounded
  previous decrypt-only key ring configured by `BYOK_ENCRYPTION_KEY` and
  `BYOK_ENCRYPTION_KEY_PREVIOUS`.
- The Gemini API key is sent in the server-side `x-goog-api-key` header, not a
  URL. API responses expose only safe connection state, model, masked suffix,
  revisions, secret version, and validation time.
- The password field is never prefilled and candidate text is cleared after
  success, completed failure, or cancellation. No browser-storage API is used.
- OpenRouter remains unavailable at credential, activation, snapshot,
  authorization, gateway-registry, and Settings boundaries. Its dormant
  implementation is retained for a separately authorized future phase.

## Testable success criteria

- Invalid candidates create no credential; failed replacements preserve the
  prior encrypted secret and routing preference.
- Successful active replacement increments credential secret version and both
  credential/preference revisions atomically.
- Deleted or replaced versions cannot authorize queued work; disconnected
  users cannot use the environment key; administrator-managed use is explicit.
- Resume, Interview, and Learning durable jobs use the same snapshot resolver,
  retain one Gemini attempt per worker attempt, and preserve G-4 cancellation,
  fencing, polling, timeout, retry ownership, and atomic persistence.
- No plaintext key appears in API responses, URLs, jobs, usage events, audit
  events, logs, or browser storage; no OpenRouter request or fallback occurs.
- Focused and full automated gates pass before desktop, tablet, and mobile
  Settings verification. Controlled live verification uses at most three
  synthetic Gemini operations and leaves no temporary records.

## Initial Codex verification record

Executed on 2026-08-06:

- `git diff --check`: passed (exit 0).
- `npm run typecheck`: passed (exit 0).
- `npm run typecheck:tests`: passed (exit 0).
- `npm run test --workspace @career-learning-hub/web`: 56 files and 758 tests
  passed (exit 0).
- Focused backend slices passed before the final gate: vault 6/6, provider API
  22/22, retry/job-response 21/21, combined provider/retry/logger 36/36.
- An earlier complete backend run reached 380 passes and 8 fixture-integration
  failures after routing became authoritative. The affected Resume, Interview,
  Learning, and retry fixtures were corrected and their focused rerun passed
  21/21. A fresh `npm run test` rerun could not collect tests because the
  sandbox denied MongoMemoryServer's `0.0.0.0` listener with `EPERM`.
- The required escalation for the same backend command was rejected because
  this Codex environment's escalation allowance was exhausted until
  2026-08-13. This is not recorded as a backend test pass or code failure.
- `npm run test:security` was not run because it uses the same blocked local
  MongoMemoryServer setup.
- `npm run build`: passed (exit 0); Vite reported its pre-existing large-chunk
  advisory and React Router module-directive warnings.
- Browser verification was not started because the required automated gate did
  not complete. Controlled live verification was also not started. The local
  Gemini environment credential is configured, but the local BYOK write key is
  absent; no secret value was read or printed.
- Worktree remains unstaged with 30 G-5 paths and no active Git operation.

No browser, live, security-suite, or complete-backend success is inferred from
these partial results. Human review remains pending.

## Final local verification closeout

The initial Codex sandbox listener restriction was superseded by successful
execution on the developer workstation.

Final verified results:

- Complete backend suite: 34 files and 389 tests passed.
- Security suite: 4 files and 36 tests passed.
- Frontend suite: 56 files and 758 tests passed.
- Workspace typecheck: passed.
- Backend test typecheck: passed.
- Production build: passed.
- `git diff --check`: passed.
- Focused Gemini Settings desktop and responsive review: passed.
- Personal Gemini credential save, encryption, masking, and stored-connection
  test: passed.
- Failed candidate replacement preserved the existing valid credential.
- No plaintext Gemini credential was found in browser storage, URLs, Git, or
  API responses.
- OpenRouter remained unavailable in the active Settings UI and runtime path.
- Human visual approval was granted.
- Implementation commit:
  `c7b3a0979783e4a8dff3ba27f4ccb82627d7d0c7`.
- GitHub PR #2 remains draft and unmerged.
- Render staging variables required by G-5 have been configured separately
  from Git.
- Main-branch Render and Vercel deployment verification completed after PR #2
  merged as `8418f53dd1ab520d6383018a7366a57ef94b46e4`.

## Staging deployment closeout

Final staging verification completed on 2026-08-06:

- GitHub PR #2 was merged into `main`.
- Merge commit: `8418f53dd1ab520d6383018a7366a57ef94b46e4`.
- Render backend deployment completed successfully.
- Vercel frontend production deployment completed successfully.
- The Vercel staging origin was added to Render `CLIENT_ORIGINS`.
- `JOB_WORKER_ENABLED=true` was applied so queued Resume and Learning jobs run.
- Account registration and authenticated access were verified.
- Personal Gemini credential save, encryption, masking, and connection testing
  were verified in the deployed application.
- Learning PDF upload and background processing were verified.
- Resume PDF import and background processing were verified.
- Gemini-backed workflows completed successfully using the fixed
  `gemini-3.6-flash` model.
- OpenRouter remained unavailable in the active Settings UI and runtime path.
- MongoDB Atlas connectivity and persisted application records were verified.
- Render currently uses `ASSET_STORAGE_DRIVER=local`. This is accepted only as
  a staging limitation because local uploaded files may not survive service
  restarts, redeployments, or instance replacement.
- Persistent S3-compatible private file storage remains future deployment work.
- Phase 19 remains planned and inactive pending separate authorization.
