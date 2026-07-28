# Phase 15 Security and Privacy Review Plan

## 1. Document control

- Activation prompt: `CLH-PHASE-15A-ACTIVATE-AND-AUDIT-01`
- Phase: 15, Security and Privacy Review
- Active pass: Phase 15A, Threat Model, Ownership Map, and Validated Audit
- Pass status: ACTIVE
- Required review token: `PHASE_15A_SECURITY_PRIVACY_AUDIT_APPROVED`
- Production and tests: read-only
- Finding repairs: require separate operator authorization
- Staging and commit: not authorized
- Push: prohibited

## 2. Baseline

- Repository: `Career Learning Hub`
- Branch: `phase-12-unified-frontend`
- Full HEAD: `da3deb50cdfd2f9130ca0e3ce4fbea1cc08d8a51`
- Subject: `Add end-to-end application coverage`
- Phase 14: COMPLETED
- Phase 15: ACTIVE
- Phase 15A: ACTIVE
- Phase 16: PLANNED / INACTIVE
- Starting worktree: clean, with nothing staged or untracked

## 3. Goal and completion evidence

Account for the current repository's security-sensitive production,
configuration, test, and E2E surfaces; trace every owned resource and
high-risk boundary; validate each candidate against source and existing tests;
and produce only the approved planning and security documents.

Evidence required before review handoff:

1. Threat model with repository anchors, actors, assets, boundaries, abuse
   paths, mitigations, assumptions, and residual risk.
2. Owned-resource map covering creation, list, read, update, delete, nested
   ownership, private assets, jobs, and safe missing or foreign behavior.
3. Candidate ledger with confirmed, rejected, accepted, and deferred
   classifications.
4. Bounded repair batches for validated findings only.
5. Explicit scan, runtime, contributor-ownership, and deployment limitations.
6. Synthetic/runtime cleanup when any runtime validation occurs.
7. A final unstaged Git diff containing only approved documentation paths.

## 4. Skill and workspace routing

Available requested skills:

- `using-superpowers`
- `karpathy-guidelines`
- `define-goal`
- `security-best-practices`
- `privacy`
- `security-ownership-map`
- `requesting-code-review`
- `receiving-code-review`
- `systematic-debugging`
- `technical-writing`
- `verification-before-completion`

Unavailable requested skills:

- `codex-security:security-scan`
- `codex-security:security-diff-scan`
- `codex-security:threat-model`
- `codex-security:finding-discovery`
- `codex-security:validation`
- `codex-security:attack-path-analysis`

`security-threat-model` is available under a different name and controls the
repository-grounded threat-model document.

No Codex Security app workspace or callable scan tool is exposed by this
host. The audit therefore uses a prompt-only, read-only terminal review. It
does not invent a scan ID, external scan directory, canonical manifest,
coverage ledger, SARIF, or generated report.

The `security-ownership-map` skill is loaded, but its required `networkx`
module is not installed. Installation is prohibited. Domain-resource
ownership is mapped by tracing code; contributor bus-factor and co-change
automation are recorded as unavailable.

## 5. Repository scan scope

Included:

- backend Express application, middleware, routes, services, models, jobs,
  storage, AI boundaries, migrations, and configuration;
- frontend React authentication, routing, API clients, private file
  presentation, polling, and answer presentation;
- shared contracts;
- root and workspace manifests and the lockfile;
- backend unit, integration, and security suites;
- frontend tests;
- Phase 14 E2E configuration, fixtures, support, and specifications;
- tracked architecture, phase, governance, and example-environment
  documentation;
- Git branch, ancestry, and history evidence.

Excluded:

- `.git` internals except read-only topology and history queries;
- dependency/vendor trees such as `node_modules`;
- generated build, coverage, browser, trace, screenshot, and log output;
- the byte content of the synthetic binary PDF, while its path, origin, and
  artifact policy remain in scope;
- real `.env` files and secret values;
- production data, raw exports, private uploads, and credentials;
- the prohibited legacy sibling project;
- external AI-provider execution.

## 6. Distinct diff-scan decision

The current branch has an authoritative merge base with `main` at
`92066731b57abc27a392fb35cf009100568d39dd`. The candidate integrated range is:

`92066731b57abc27a392fb35cf009100568d39dd..da3deb50cdfd2f9130ca0e3ce4fbea1cc08d8a51`

That range spans the integrated frontend, Learning workspace, design,
browser, and supporting backend changes. A canonical diff scan is not
performed because `codex-security:security-diff-scan` is unavailable. The
repository-wide snapshot review remains authoritative for current behavior;
manual history review is supporting evidence only and is not labeled as a
Codex Security diff scan.

## 7. Audit matrix

| Area | Entry points and boundaries | Controls to trace | Sensitive data and failure modes | Evidence |
| --- | --- | --- | --- | --- |
| Authentication and session | register, login, refresh, logout, protected API bootstrap | password hashing, token signing, cookie flags, rotation, revocation, rate limits, in-memory access token | credentials, refresh tokens, access tokens, session IDs, account isolation | routes, services, models, middleware, frontend auth, auth tests |
| Request boundaries | Express app, CORS, parsers, request IDs, errors, proxy trust | allowlists, limits, validation, safe errors, cache headers, security headers, rate limits | body/query confusion, spoofed IP/origin, error or log disclosure, resource exhaustion | app/config/middleware, security tests |
| Authorization and ownership | every owned list/read/update/delete route | authenticated user derivation, owner fields, parent joins, nested guards, neutral missing behavior | cross-user reads or writes, IDOR, mass assignment, parent/child mismatch | routes, controllers, services, models, ownership and E2E tests |
| Files and private assets | Resume and Learning PDF upload, source retrieval, local/S3 storage | MIME/signature checks, size/page/text limits, server-generated keys, owner-scoped retrieval, signed URL expiry, deletion | parser abuse, path traversal, active content, private document disclosure, orphaned files | upload routes, parsers, storage drivers, asset policy, source tests |
| AI and jobs | analysis, interview, chat, flashcard, quiz generation; job polling | provider configuration, prompt bounds, structured-output schemas, quotas, idempotency, leases, owner-scoped jobs, deletion fences, transactions | prompt/private content leakage, malformed output, duplicate work, stale writes, answer-key exposure | AI gateway, job system, domain services, concurrency and response tests |
| Data and privacy | database models, logs, usage/activity events, E2E fixtures and artifacts | minimization, redaction, private no-store responses, retention, cleanup | passwords, notes, messages, document text, answers, telemetry, screenshots/traces | models, logger, errors, E2E setup/teardown, reports |

## 8. Candidate validation rules

Each candidate must record:

1. exact source and entry point;
2. broken or absent control;
3. sink or affected asset;
4. reachable source-to-sink path;
5. authentication and attacker prerequisites;
6. middleware, service, model, and transaction guards;
7. validation or sanitization;
8. relevant positive and negative-control tests;
9. safe reproduction only when static evidence is insufficient;
10. impact, likelihood, confidence, and rejected-candidate evidence.

No candidate becomes a finding solely because a best-practice header,
deployment control, or defense-in-depth layer is absent from tracked source.

## 9. Severity calibration

- Critical: low-privilege or unauthenticated account takeover, remote code
  execution, broad secret exposure, destructive cross-user action, or broad
  private-data disclosure.
- High: exploitable IDOR, serious token/session failure, private-asset
  disclosure, sensitive mass assignment, or high-impact upload/path defect.
- Medium: bounded disclosure, realistic incomplete rate limiting,
  privacy-sensitive logging, or a reachable defense failure with meaningful
  impact.
- Low: demonstrated, low-impact hardening or bounded lifecycle weakness.
- Informational: accepted risk, configuration assumption, documentation gap,
  or test gap without a demonstrated broken product control.

## 10. Protected paths and stop conditions

Only these paths are writable:

- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/PHASE_15_SECURITY_PRIVACY_PLAN.md`
- `docs/planning/PHASE_15_SECURITY_PRIVACY_REPORT.md`
- `docs/security/PHASE_15_THREAT_MODEL.md`
- `docs/security/PHASE_15_FINDING_REGISTER.md`
- `docs/security/OWNERSHIP_MAP.md`

Stop and report when:

- the baseline or Git scope changes unexpectedly;
- a required validation would expose real secrets or personal data;
- a Critical or High candidate cannot be bounded safely;
- runtime cleanup cannot be proven;
- production or test code changes;
- an unavailable capability would have to be fabricated.

## 11. Human review gate

Phase 15A remains active while the operator reviews the threat model, ownership
map, findings, rejected candidates, accepted risks, coverage limitations,
repair batches, cleanup, and Git diff. The approval token is:

`PHASE_15A_SECURITY_PRIVACY_AUDIT_APPROVED`

The token is not requested by this audit because canonical scan coverage and
current online dependency-advisory coverage are incomplete. The operator must
first provide the missing capabilities or explicitly accept those limitations.

Phase 15A and Phase 15 are not completed by this audit. Phase 16 remains
planned and inactive.

## 12. Completed evidence

- Repository scope accounted: 317 tracked files.
- Deep boundary review: 74 HTTP handlers across 14 backend routers plus their
  middleware, owner guards, services, models, storage adapters, jobs, frontend
  trust boundaries, and E2E support.
- Threat model:
  `docs/security/PHASE_15_THREAT_MODEL.md`.
- Ownership map:
  `docs/security/OWNERSHIP_MAP.md`.
- Finding register:
  `docs/security/PHASE_15_FINDING_REGISTER.md`.
- Audit report:
  `docs/planning/PHASE_15_SECURITY_PRIVACY_REPORT.md`.
- Confirmed findings:
  - 0 Critical;
  - 0 High;
  - 3 Medium;
  - 2 Low.
- Additional classifications:
  - 5 informational observations;
  - 7 rejected candidates;
  - 3 deferred candidates;
  - 2 accepted risks.
- Runtime validation:
  - security: 4/4 files, 7/7 tests passed;
  - integration: 5/5 files, 40/40 tests passed;
  - backend focused unit: 4/4 files, 14/14 tests passed;
  - frontend focused: 5/5 files, 128/128 tests passed.
- External provider calls: none.
- Production and test changes: none.
- Runtime state and artifacts: cleaned/absent.

## 13. Proposed repair authorization boundaries

- Phase 15B-1: atomic per-user asset quota enforcement for `P15-001`.
- Phase 15B-2: access-token revocation and atomic refresh rotation semantics
  for `P15-002` and `P15-003`.
- Phase 15B-3: fail-closed production frontend API and backend public-origin
  configuration for `P15-004`.
- Phase 15B-4: neutral public registration account-existence behavior for
  `P15-005`.
- Evidence prerequisites outside repair batches: approved dependency evidence
  and deployment decisions for
  distributed rate limiting, per-claim worker fencing, edge controls,
  private-domain and telemetry retention, E2E artifact retention, and
  security ownership.

No repair is authorized by this plan or audit pass.

## 14. Pre-approval decision

- Decision: `BLOCKED`.
- Blocking coverage limitations:
  1. canonical repository and diff security scans cannot run because all six
     required `codex-security:*` capabilities and the app workspace are
     unavailable; and
  2. the current online npm advisory query could not run without an external
     dependency-inventory disclosure that was not explicitly approved.
- An offline audit reported zero advisories, but this does not establish
  current advisory coverage.
- Phase 15 and Phase 15A remain `ACTIVE`.
- Phase 16 remains `PLANNED` / `INACTIVE`.
