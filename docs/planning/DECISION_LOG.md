# Decision log

## Log rules

- Record one architectural or governance decision per entry.
- Use sequential decision IDs.
- Preserve accepted decisions; supersede them with a new entry instead of silently rewriting history.
- Each entry must include a decision ID, date, status, decision, rationale, consequences, and revisit conditions.
- A code-changing repair loop is limited to three attempts for the same root failure. After the third unsuccessful attempt, stop modifying files, report the command, error, attempts, and likely cause, then wait for human direction.

## DEC-001: Preserve the existing architecture

- Decision ID: `DEC-001`
- Date: 2026-07-24
- Status: ACCEPTED
- Decision:
  - Keep React and Vite in `frontend/`.
  - Keep Express and TypeScript in `backend/`.
  - Keep MongoDB.
  - Keep `packages/shared-types/`.
  - Do not create another app structure.
- Rationale:
  - The inspected manifests and architecture documentation define this as the current active repository structure.
  - Preserving it limits risk and avoids unsupported rewrites.
- Consequences:
  - New work must fit the existing workspace boundaries.
  - Architectural changes require a separate approved decision.
- Revisit conditions:
  - Verified technical evidence shows the current structure cannot meet an approved requirement.
  - The user grants explicit architectural approval.

## DEC-002: Preserve the existing authentication system

- Decision ID: `DEC-002`
- Date: 2026-07-24
- Status: ACCEPTED
- Decision:
  - Access tokens remain in React memory.
  - Refresh tokens remain in the existing HttpOnly cookie.
  - Do not introduce another authentication provider without explicit architectural approval.
- Rationale:
  - One authentication model avoids competing token lifecycles and storage rules.
  - In-memory access tokens and HttpOnly refresh cookies preserve the approved client boundary.
- Consequences:
  - Frontend authentication must bootstrap through the existing refresh flow.
  - Persistent browser storage must not hold access tokens.
- Revisit conditions:
  - A verified requirement cannot be met by the existing system.
  - A security review supports a change and the user grants explicit architectural approval.

## DEC-003: Keep legacy projects outside the repository

- Decision ID: `DEC-003`
- Date: 2026-07-24
- Status: ACCEPTED
- Decision:
  - Legacy projects remain sibling folders.
  - They are external read-only legacy references.
  - Access is granted only during approved legacy-inspection phases.
  - Actual implementation occurs only inside Career Learning Hub.
- Rationale:
  - Isolation prevents accidental modification, dependency mixing, secret exposure, and unsupported code reuse.
- Consequences:
  - Codex must not inspect, modify, copy, or run commands in a legacy project without phase-specific approval.
  - Approved inspections classify features before implementation.
- Revisit conditions:
  - The user changes the repository boundary and records a replacement decision.

## DEC-004: Make karpathy-guidelines mandatory

- Decision ID: `DEC-004`
- Date: 2026-07-24
- Status: ACCEPTED
- Decision:
  - Inspect before coding.
  - State assumptions.
  - Prefer simplicity.
  - Make surgical changes.
  - Define and verify measurable goals.
- Rationale:
  - These rules reduce hidden assumptions, excess scope, and unverifiable work.
- Consequences:
  - Every phase prompt must name `karpathy-guidelines` as the controlling discipline.
  - Each implementation must begin with bounded inspection and measurable success criteria.
- Revisit conditions:
  - The user explicitly replaces the controlling discipline through a recorded decision.

## DEC-005: Limit repeated repair attempts

- Decision ID: `DEC-005`
- Date: 2026-07-24
- Status: ACCEPTED
- Decision:
  - A root failure is one underlying cause that produces the same failing result.
  - Allow a maximum of three code-changing repair attempts for the same root failure.
  - Stop and request human review after the third unsuccessful attempt.
- Rationale:
  - A bounded loop prevents repeated speculative edits and protects working behavior.
- Consequences:
  - After the third unsuccessful attempt, Codex stops modifying files.
  - Codex does not skip or weaken tests or security controls.
  - Codex reports the exact command, error, attempts, and likely cause, then waits for human direction.
- Revisit conditions:
  - Human review identifies a different root failure.
  - The user authorizes a new bounded repair approach.

## DEC-006: Require human visual QA

- Decision ID: `DEC-006`
- Date: 2026-07-24
- Status: ACCEPTED
- Decision:
  - Visible React changes require browser checks and human approval before commit.
- Rationale:
  - Automated browser checks cannot judge every layout, content, interaction, or regression concern.
- Consequences:
  - Codex provides a local URL and inspection checklist.
  - Browser automation does not replace human visual review.
  - Codex stops before commit until the required visual approval token is provided.
- Revisit conditions:
  - The user records a replacement visual-review policy.

## DEC-007: Control Codex context

- Decision ID: `DEC-007`
- Date: 2026-07-24
- Status: ACCEPTED
- Decision:
  - Store the complete roadmap in the master plan.
  - Give Codex only `CURRENT_PHASE.md` and relevant files during normal execution.
- Rationale:
  - A bounded context keeps each phase focused and reduces accidental cross-phase work.
- Consequences:
  - `CURRENT_PHASE.md` contains one active execution phase.
  - Future phase details remain in the master plan until activated.
- Revisit conditions:
  - A phase requires a specific cross-phase dependency that cannot be represented in its current-phase input list.

## DEC-008: Protect migration privacy

- Decision ID: `DEC-008`
- Date: 2026-07-24
- Status: ACCEPTED
- Decision:
  - Never expose raw production exports to Codex.
  - Use sanitized representative fixtures for schema and migration work.
  - Remove or replace PII, secrets, tokens, sessions, plaintext passwords, and password hashes.
- Rationale:
  - Migration planning does not require raw personal or authentication data.
- Consequences:
  - Sanitization and privacy review occur before Codex receives migration fixtures.
  - Migration validation, dry runs, and execution occur against staging first.
- Revisit conditions:
  - A privacy reviewer approves a stricter replacement process.
  - Never revisit this decision to permit raw production exports in Codex context.

## DEC-009: Require human review before commits

- Decision ID: `DEC-009`
- Date: 2026-07-24
- Status: ACCEPTED
- Decision:
  - Codex must show status and diff.
  - Codex must stop before committing.
  - The user authorizes commits.
- Rationale:
  - Human review is the final check for scope, correctness, secrets, and unintended changes.
- Consequences:
  - Phase completion does not authorize a commit.
  - Codex does not stage or commit unless the user explicitly authorizes it.
- Revisit conditions:
  - The user records a replacement commit-authorization policy.

## DEC-010: Avoid unapproved architectural additions

- Decision ID: `DEC-010`
- Date: 2026-07-24
- Status: ACCEPTED
- Decision:
  - Do not introduce Next.js, Supabase, a new database, a new authentication provider, or a second design system without explicit approval.
  - Do not install shadcn without an approved design-system impact review.
- Rationale:
  - Unapproved platform additions expand maintenance, security, migration, and design scope.
- Consequences:
  - Implementation phases use the existing architecture and approved design patterns.
  - Proposed additions require evidence, impact analysis, and a new accepted decision.
- Revisit conditions:
  - A verified requirement cannot be met by the approved architecture.
  - The user approves the documented impact and records a replacement or supplemental decision.
