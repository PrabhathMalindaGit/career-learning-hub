# Career Learning Hub — Current Gemini Threat Model

## Purpose

This document records the security and privacy threat model for the current Career Learning Hub release. It describes the active product boundary only.

Career Learning Hub is a multi-user React/Vite and Express/TypeScript application backed by MongoDB, private asset storage, an in-process background worker, and Google Gemini-assisted workflows. The current release uses Gemini Direct only with fixed model `gemini-3.6-flash`.

This document is not a security scan and does not claim vulnerability-free operation. The final Phase 20A evidence separately records the automated backend security regression result of 43/43 passing tests.

## Protected assets

The product must protect:

- authentication sessions and access tokens;
- Resume content, job descriptions, Interview answers and notes;
- Learning PDFs, extracted document text, conversations, Flashcards and Quizzes;
- private asset identifiers and signed-access material;
- Gemini API credentials and encrypted personal Gemini credentials;
- background-job payloads, results, leases and progress state;
- quiz and deterministic Interview answer keys before successful submission;
- usage, request, audit and operational records;
- MongoDB data, private object storage and deployment secrets.

## Trust boundaries

Primary trust boundaries are:

1. **Browser → Express API** — all browser input is untrusted. Authentication, validation, ownership and rate limiting remain server-authoritative.
2. **Express API → MongoDB/private storage** — all reads and writes must remain owner-scoped and validated.
3. **API → background job system** — queued work must remain owner-bound, secret-minimized and idempotent.
4. **Worker → Gemini** — only the explicitly authorized server-side credential may be used; prompts and model outputs are treated as sensitive external-provider data.
5. **Gemini → worker/application** — model output is untrusted until structural and semantic validation succeeds.
6. **Deployment environment → application** — signing keys, encryption keys, database credentials, storage credentials and Gemini credentials must remain outside tracked source and client-visible state.

## Principal threats and controls

| Threat | Required control |
| --- | --- |
| Cross-user resource access | Derive ownership from authenticated server state and use owner-scoped queries; fail closed for mismatched ownership |
| Token/session disclosure | Keep access tokens in memory, refresh tokens in HttpOnly cookies, avoid credential logging and browser persistence |
| IDOR | Never trust client-supplied ownership identifiers; enforce ownership on every protected resource lookup |
| Private file exposure | Keep Resume/Learning assets private, validate uploads and use owner-scoped signed access |
| Gemini credential disclosure | Keep credentials server-side; encrypt personal credentials with AES-256-GCM; never return plaintext after save |
| Silent provider substitution | Gemini Direct is the only active release path; no silent provider fallback is permitted |
| Untrusted AI output | Require structural validation, feature-specific semantic checks, ownership/fencing checks and atomic persistence |
| Prompt/content leakage | Minimize provider payloads and never log prompts, Resume text, Interview answers, document text or personal content |
| Duplicate AI side effects | Preserve idempotency, duplicate suppression, execution fencing and transactional persistence |
| Stale/late provider response | Preserve cancellation, timeout, lease and execution-fence checks before persistence |
| Retry amplification | The worker owns bounded retry; one worker attempt makes at most one provider attempt |
| Quiz/answer disclosure | Do not expose answer keys before successful owned submission |
| Malicious/oversized upload | Validate type, size and ownership; keep private storage quotas and upload limits enforced |
| Rate-limit bypass | Preserve proxy configuration, global/route limits and exact origin policy |
| Secret exposure through diagnostics | Sanitize errors, logs and Request-ID diagnostics; never emit secret values or private payloads |
| Unsafe deployment configuration | Use exact CORS origins, HTTPS in deployed environments, scoped secrets, private storage and explicit provider configuration |

## Gemini credential states

The current Settings boundary supports:

- administrator-managed Gemini access when explicitly enabled;
- a personal Gemini API credential encrypted server-side;
- disconnected state.

A personal candidate credential is tested with bounded synthetic content before successful persistence. Failed candidates must not replace a working credential. Plaintext credentials must not enter browser storage, URLs, jobs, usage events, audit records, logs or API responses.

## Background-job integrity

Resume, Interview and Learning AI work uses durable background jobs. Security-sensitive invariants include:

- authenticated ownership at enqueue and status access;
- immutable job ownership and request identity;
- bounded progress-only polling;
- idempotent enqueue/retry behavior;
- cancellation only while persistence is still safely preventable;
- bounded retry and deadline handling;
- execution fencing against stale workers and late provider responses;
- validated final output before atomic persistence;
- no token streaming, SSE or WebSocket path in the current release.

## Data and privacy boundary

The application should retain only data required for product functionality and evidence. Reports, logs and screenshots must use sanitized information and must not expose passwords, tokens, cookies, API keys, Resume content, Interview answers, document text or private uploads.

Provider-backed operations necessarily transmit the minimum required task content to Gemini. The UI and final report should describe this accurately rather than implying that AI-assisted content never leaves the application server.

## Verification boundary

Evidence supporting this threat model includes:

- backend production and test-source type checking;
- backend unit, integration and security regression suites;
- frontend unit/integration-style component coverage;
- full application browser workflow testing;
- human integrated QA and focused visual QA;
- server-side ownership, validation, private asset, credential and job-lifecycle controls recorded in the Phase 20A evidence freeze.

The final release evidence records 43/43 backend security regression tests passing. This is not equivalent to an external penetration test, formal security certification or repository-wide scanner pass.

## Current release conclusion

Career Learning Hub uses a bounded academic-project security model: authenticated ownership, private storage, validation at trust boundaries, encrypted personal Gemini credentials, server-only provider use, validated AI output, durable fenced background work, sanitized diagnostics and explicit release limitations. Future changes must preserve these controls or introduce a separately reviewed security decision.
