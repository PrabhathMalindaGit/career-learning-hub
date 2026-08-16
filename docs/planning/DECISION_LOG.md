# Career Learning Hub — Current Decision Register

## Register rules

This register contains the decisions that still govern the current Career Learning Hub product and final university-project stage.

- The current user task has highest priority.
- `AGENTS.md` and `CURRENT_PHASE.md` define the active execution boundary.
- A decision may be superseded or retired when it no longer describes the current product or workflow.
- Git history remains the audit source for earlier decision text that has been removed from the current tree.
- Security, privacy, ownership, test, and explicit approval boundaries must never be weakened merely to simplify implementation.

## DEC-001 — Preserve the existing application architecture

- Status: `ACCEPTED / CURRENT`
- Decision:
  - Keep React and Vite in `frontend/`.
  - Keep Express and TypeScript in `backend/`.
  - Keep MongoDB/Mongoose persistence.
  - Keep shared contracts in `packages/shared-types/`.
  - Keep one application shell and one integrated product structure.
- Rationale:
  - The current architecture is implemented, qualified, and sufficient for the academic MVP.
  - Replacing it would add risk without a demonstrated requirement.
- Revisit only when:
  - verified technical evidence shows the current architecture cannot satisfy an approved requirement; and
  - the user explicitly approves an architectural change.

## DEC-002 — Preserve the existing authentication model

- Status: `ACCEPTED / CURRENT`
- Decision:
  - Access tokens remain in React memory.
  - Refresh tokens remain in the existing HttpOnly cookie.
  - Authentication bootstraps through the existing refresh flow.
  - Do not introduce another authentication provider without explicit architectural approval.
- Consequences:
  - persistent browser storage must not contain access or refresh tokens;
  - protected-route and ownership behavior must remain server-authoritative.

## DEC-004 — Use the smallest secure university-project solution

- Status: `ACCEPTED / CURRENT`
- Decision:
  - inspect before editing;
  - state assumptions and material ambiguities;
  - prefer the smallest valid solution;
  - reuse existing modules and architecture;
  - avoid speculative abstractions and enterprise-grade complexity that is not required for correctness or security;
  - define verifiable success criteria before claiming completion.

## DEC-005 — Bound repeated repair attempts

- Status: `ACCEPTED / CURRENT`
- Decision:
  - a root failure is one underlying cause producing the same failing result;
  - make at most three code-changing attempts for the same root failure;
  - after the third unsuccessful attempt, stop modifying files and request human direction.
- Consequences:
  - never weaken tests or security controls to obtain a pass;
  - preserve the failing evidence and report the exact command/error/attempts.

## DEC-006 — Require human visual QA for visible UI changes

- Status: `ACCEPTED / CURRENT`
- Decision:
  - visible React changes require human visual review before merge approval;
  - browser automation may support the review but does not replace it.
- Documentation-only and invisible changes do not require visual QA.

## DEC-007 — Keep active execution context bounded

- Status: `ACCEPTED / CURRENT`
- Decision:
  - `CURRENT_PHASE.md` contains the current execution boundary;
  - the master plan contains the remaining roadmap;
  - do not activate unrelated future work automatically.

## DEC-008 — Protect personal data and test-fixture privacy

- Status: `ACCEPTED / CURRENT`
- Decision:
  - do not expose raw production exports, credentials, tokens, sessions, password hashes, or private uploads in development context;
  - use sanitized representative fixtures for data-import, testing, evaluation, and verification work;
  - do not print personal or user-generated content in logs or evidence unless explicitly required and safely sanitized.

## DEC-009 — Require explicit review before gated Git actions

- Status: `ACCEPTED / CURRENT`
- Decision:
  - feature/fix/documentation work occurs on a separate branch, not directly on `main`;
  - the exact changed-file set and diff must be reviewed;
  - merge requires explicit user approval of the exact qualified head SHA;
  - deployment and branch deletion require separate explicit approval.

## DEC-010 — Avoid unapproved platform additions

- Status: `ACCEPTED / CURRENT`
- Decision:
  - do not introduce Next.js, Supabase, another database, another authentication provider, or a second design system without explicit approval;
  - do not install shadcn without an approved design-system impact review;
  - add dependencies only when a bounded approved task genuinely requires them.

## DEC-011 — Use Full Application Browser Testing as the current name

- Status: `ACCEPTED / CURRENT`
- Decision:
  - executable browser workflows live under `tests/browser/`;
  - browser-testing plans/reports live under `docs/testing/` or the applicable planning/evidence location;
  - a portable repository-local Playwright script is not claimed while no approved repository-local runner exists;
  - current browser execution may use the separately approved bundled runtime.

## DEC-012 — Preserve the bounded academic-MVP architecture

- Status: `ACCEPTED / CURRENT`
- Decision:
  - enhance the existing application shell rather than create a second navigation system;
  - use contextual breadcrumbs only where useful and never expose raw database IDs as user-facing labels;
  - export saved Resume versions using the existing print-first A4/Letter workflow rather than adding a second PDF-generation architecture;
  - preserve explicit user selection/confirmation before AI Resume suggestions are applied;
  - keep additional design controls bounded to the existing Resume model and design contract;
  - require evidence before performance/accessibility changes rather than speculative optimization.

## DEC-015 — Keep staging resources isolated and project-scoped

- Status: `ACCEPTED / CURRENT`
- Decision:
  - Career Learning Hub staging uses its own project-scoped database, credentials, network controls, storage, indexes, cleanup, and rollback boundaries;
  - staging resources must not share unrelated application data or credentials;
  - staging provisioning/deployment remains a separately authorized activity.

## DEC-017 — Keep application validation authoritative for AI structured output

- Status: `ACCEPTED / CURRENT`
- Decision:
  - feature Zod schemas remain the authoritative application contracts;
  - provider-side structural JSON Schema is a generation constraint only;
  - strict post-response parsing, feature-specific semantic validation, ownership, fencing, secrecy, and persistence checks remain authoritative;
  - deterministic provider/output-contract failures are not retried as transient failures.

## DEC-019 — Use progress-only polling for durable AI workflows

- Status: `ACCEPTED / CURRENT`
- Decision:
  - durable AI workflows expose safe progress through the authenticated owned-job polling route;
  - the backend worker is the only retry owner;
  - one worker attempt makes at most one Gemini provider attempt;
  - final results remain buffered, validated, execution-fenced, and atomically persisted;
  - token streaming, SSE, and WebSockets are not part of the current product.

## DEC-020 — Release Gemini-only credential settings and runtime behavior

- Status: `ACCEPTED / CURRENT`
- Decision:
  - Gemini Direct is the only active release provider;
  - the fixed release model is `gemini-3.6-flash`;
  - users may be administrator-managed, use a personal AES-256-GCM encrypted Gemini credential, or be disconnected;
  - personal candidates are tested before persistence;
  - plaintext personal keys never enter normal responses, browser storage, URLs, jobs, usage events, audit records, logs, or persisted application fields;
  - durable jobs retain immutable secret-free routing state and execution-time authorization checks;
  - no silent provider fallback exists.

## DEC-021 — Preserve the final release evidence boundary

- Status: `ACCEPTED / CURRENT`
- Decision:
  - the executable product baseline qualified by Phase 20A remains `a2a3aa0ef5b9cf9583ce4aeae2d676f5f568a790` unless a later executable change is explicitly authorized and requalified;
  - documentation-only commits may advance `main` without changing that executable identity;
  - the final non-overlapping complete-suite evidence is 1,685 passing tests: 515 backend + 1,170 frontend;
  - the backend security regression suite passed 43/43 tests;
  - no separate external/repository-wide security-scanner pass is claimed by Phase 20A;
  - prior human/live QA plus focused final visual approval and fresh Phase 20A automated qualification form the final evidence chain.

## DEC-022 — Present the current repository around the finished Career Learning Hub product

- Status: `ACCEPTED / CURRENT`
- Date: 2026-08-16
- Decision:
  - current repository documentation should describe the implemented Career Learning Hub product, its architecture, security, AI behavior, tests, limitations, and university-evaluation evidence directly;
  - obsolete development-source inventories, migration/comparison artifacts, and superseded governance material do not belong in the current documentation tree;
  - Git history remains unchanged and continues to provide the technical audit trail;
  - this documentation policy does not authorize any executable product change or any rewriting of Git history.
- Rationale:
  - the project is now in final university evaluation/report/viva preparation;
  - current-tree documentation should be concise, accurate, and aligned with the product being assessed.

## Retired or superseded decision IDs

The following IDs are retained only so references in older retained evidence are not ambiguous. Their earlier text is available in Git history and is not current execution authority.

| Decision ID | Current state |
| --- | --- |
| `DEC-003` | `RETIRED — repository-boundary setup policy is no longer part of current product governance` |
| `DEC-013` | `RETIRED — development-source reuse policy removed from current product governance` |
| `DEC-014` | `RETIRED — development-source extension policy removed from current product governance` |
| `DEC-016` | `SUPERSEDED — current Gemini release behavior is governed by DEC-020` |
| `DEC-018` | `SUPERSEDED FOR CURRENT RELEASE — active Gemini-only behavior is governed by DEC-020` |

## Current authority

For new work, apply the current user task, `AGENTS.md`, `CURRENT_PHASE.md`, and the current decisions above. Historical decision text does not override a newer current decision or an explicit user instruction.
