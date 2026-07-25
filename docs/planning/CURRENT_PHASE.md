# Current Execution Phase

- Phase: 9
- Name: Interview Legacy Inspection
- Status: ACTIVE
- Controlling skill: `karpathy-guidelines`

## Required skills

- `karpathy-guidelines`
- `brainstorming`
- `frontend-design`
- `frontend-skill`
- `technical-writing`
- `subagent-driven-development`
- `security-best-practices`

## Objective

- Conduct a bounded, evidence-based, read-only inspection of the approved
  Interview Prep legacy reference.
- Inventory and classify every material legacy feature.
- Map useful product ideas to current active Interview Coach contracts.
- Produce the smallest safe Phase 10 migration plan without implementing it.

## Approved external reference

- Symbolic reference: `LEGACY_INTERVIEW_PREP`
- Scope: the exact operator-approved `Interview Prep Ai` folder only.
- Access: temporary and read-only for this phase.
- No other legacy folder, sibling project, or external path is approved.

## Read-only constraints

- Keep the active workspace at `Career Learning Hub`.
- The approved reference may be listed and read as safe source and public-asset
  metadata evidence only.
- Do not modify, copy, execute, build, test, serve, format, install, migrate, or
  connect the legacy project to a database, provider, or network.
- Do not follow symbolic links or imports outside the approved reference.
- Enclose inspection in matching safe metadata manifests stored under `/tmp`.

## Inputs

- `AGENTS.md`
- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/DECISION_LOG.md`
- `docs/planning/PHASE_EXECUTION_TEMPLATE.md`
- `docs/frontend/frontend-architecture-audit.md`
- relevant historical Interview Coach documentation under `docs/phases/`
- current frontend routing, shell, auth, shared client, interview scaffold, and
  styles
- current backend interview, ownership, validation, AI, job, and test evidence
- current shared API envelope types
- safe source evidence under `LEGACY_INTERVIEW_PREP/`

## In-scope work

- Record legacy routes, screens, components, data flow, AI flow, assets, tests,
  states, accessibility, responsive behavior, and dead or placeholder paths.
- Classify each material feature as `PORT`, `REBUILD`, `REFERENCE ONLY`, or
  `REJECT`.
- Classify active support as `SUPPORTED`, `PARTIALLY SUPPORTED`,
  `NOT SUPPORTED`, `REQUIRES VERIFICATION`, or `NOT APPLICABLE`.
- Map proposed journeys to exact current routes, schemas, ownership, jobs,
  idempotency, validation, pagination, caching, and response behavior.
- Record Phase 10 gaps, operator decisions, tests, security controls,
  accessibility requirements, and stop conditions.

## Out-of-scope work

- Interview Coach implementation or application-source changes.
- Legacy code, styles, assets, prompts, infrastructure, dependencies,
  configuration, authentication, backend, API client, models, or database
  migration.
- Another router, API client, state library, form library, schema dependency,
  design system, backend, database, authentication provider, or AI provider.
- Application tests, builds, servers, package managers, migrations, browser
  automation, deployment, or Lighthouse.
- Phase 10 activation, staging, committing, branch changes, or remote
  operations.

## Classifications

- `PORT`: a small source or asset candidate with verified provenance, licence,
  compatibility, security, privacy, accessibility, and architecture fit.
- `REBUILD`: a useful user-facing capability to implement from scratch inside
  current active contracts.
- `REFERENCE ONLY`: evidence that may inform product or visual decisions but
  must not be copied.
- `REJECT`: insecure, incompatible, unsupported, fabricated, duplicative,
  inaccessible, unproven, privacy-invasive, dead, or prohibited material.
- Unknown provenance cannot receive `PORT`.

## Evidence rules

- Every material claim must cite current source, normalized legacy evidence, or
  an explicit evidence gap.
- Current backend implementation and tests control contracts.
- Accepted decisions control architecture and security.
- Current frontend architecture controls integration.
- Legacy behavior is evidence only.
- Source-backed does not mean runtime-verified.
- Use stable sequential `IP-` identifiers and reconcile all classification
  totals.

## Security and privacy controls

- Treat roles, company and job context, questions, answers, attempts, notes,
  feedback, scores, recordings, transcripts, prompts, provider results, and
  session history as private.
- Do not read environment contents, credentials, tokens, cookies, browser
  storage exports, databases, uploads, recordings, private reports, raw
  provider responses, production logs, user answers, or private notes.
- Do not reproduce prompts, provider output, personal data, source code,
  secrets, environment values, or unlicensed assets.
- Reject persistent browser tokens, client ownership IDs, weak IDOR, mass
  assignment, raw AI rendering, personal-data logging, fabricated scores,
  automatic submission, automatic mutation, and unsupported outcome claims.
- Preserve server-derived ownership, safe owned-resource 404 behavior, private
  no-store caching, request IDs, memory-only access tokens, the HttpOnly
  refresh cookie, strict validation, validated AI output, owned jobs,
  idempotency, bounded retries, and explicit user actions.

## Exact deliverables

Create:

- `docs/legacy-analysis/interview-prep-inventory.md`
- `docs/legacy-analysis/interview-migration-plan.md`

Modify:

- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/CURRENT_PHASE.md`

No other path may change.

## Success criteria

- The inventory contains every required section and at least 60 unique,
  sequential, fully classified feature rows.
- The migration plan contains every required section, an exact backend
  capability map, explicit proposed journeys, gaps, and operator decisions.
- No unsupported journey or backend expansion is authorized.
- The before and after safe legacy manifests are exactly equal.
- Exactly two planning files are modified and two legacy-analysis documents
  are untracked; protected diffs are empty and nothing is staged.
- Phase 8 is `COMPLETED`, Phase 9 is `ACTIVE`, and Phase 10 and later phases
  remain `PLANNED`.

## Verification requirements

- Validate sequential unique `IP-` identifiers, allowed status values, one
  classification per row, evidence for every row, and reconciled totals.
- Check both documents for absolute legacy paths, personal data, environment
  values, secrets, prompts, copied source or assets, and unsupported claims.
- Record final line counts, SHA-256 values, classification totals, evidence
  limits, and the exact legacy manifest comparison.
- Run Git status, name, stat, whitespace, cached, and protected-path reviews.
- Do not run application, runtime, browser, build, package, migration, or
  legacy execution checks.
- Human visual QA is not applicable because this phase changes documentation
  only.

## Expected write scope

Modified:

- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/CURRENT_PHASE.md`

Created:

- `docs/legacy-analysis/interview-prep-inventory.md`
- `docs/legacy-analysis/interview-migration-plan.md`

Protected:

- all application and test source
- `packages/**`
- all manifests and lockfiles
- environment files and migrations
- assets and generated output
- `docs/planning/DECISION_LOG.md`
- `docs/planning/PHASE_EXECUTION_TEMPLATE.md`
- every legacy file

## Human approval gate

- Stop with all work unstaged and uncommitted.
- Required token: `PHASE_9_LEGACY_ANALYSIS_APPROVED`
- Approval authorizes later commit review only.
- It does not authorize Phase 10 implementation.

## Next phase

- Execution Phase 10: Interview Coach Implementation.
- Keep Phase 10 and all later phases `PLANNED`.
- Do not activate Phase 10 automatically.
