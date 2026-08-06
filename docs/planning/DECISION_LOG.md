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

## DEC-011: Name and locate full application browser testing

- Decision ID: `DEC-011`
- Date: 2026-07-29
- Status: ACCEPTED
- Decision:
  - Use Full Application Browser Testing as the primary human-facing name.
  - Keep executable Playwright browser workflow tests under `tests/browser/`.
  - Keep browser-testing plans, instructions, coverage descriptions, and
    reports under `docs/testing/` or the applicable planning directory.
  - Add `npm run test:browser` and retain `npm run test:e2e` only when a
    portable repository-local Playwright dependency or runner exists.
- Rationale:
  - The executable suite belongs with repository tests, not documentation.
  - The new name states the suite's purpose without erasing valid historical
    uses of end-to-end or E2E terminology.
  - A package script must not depend on an undeclared package, a download, or
    a user-specific runtime path.
- Consequences:
  - Live operational references use `tests/browser/`.
  - Historical Phase 14 and Phase 15 evidence keeps its original commands,
    paths, and terminology.
  - The current repository has no declared or repository-local Playwright
    runner, so Phase 16A-1 leaves `package.json` unchanged and documents the
    existing authorized bundled-runtime command.
  - The operator approved the migration with
    `PHASE_16A1_BROWSER_TEST_MIGRATION_APPROVED` after 21/21 browser workflows
    passed from `tests/browser/`.
  - No production source, browser-test behavior, or visible UI changed, so no
    manual visual QA was required.
  - The closeout commit had not yet been created while this decision entry was
    updated. Push remains prohibited and has not occurred.
- Revisit conditions:
  - A separately approved dependency or portable-runner change makes
    repository-local Playwright execution available.
  - The temporary `test:e2e` compatibility alias reaches an approved removal
    point after it has been introduced.

## DEC-012: Bound the Phase 16 academic-MVP architecture

- Decision ID: `DEC-012`
- Date: 2026-07-29
- Status: ACCEPTED
- Decision:
  - Enhance the existing `AppShell` rather than introduce a second shell or
    navigation system.
  - Use component-session state for desktop sidebar collapse and the existing
    accessible `Dialog` foundation for the mobile navigation drawer.
  - Add contextual breadcrumbs only on deep routes and source dynamic labels
    from canonical data already loaded by the owning route; never expose raw
    database IDs as labels.
  - Export saved canonical Resume versions through an in-place, print-first
    ATS Classic surface using browser Print / Save as PDF. Do not add a PDF
    dependency for a download-button abstraction.
  - Block printing while the current draft is dirty. Support A4 and Letter
    through the existing Resume design field; keep Standard/Narrow margins
    temporary and defer embedded PDF metadata.
  - Render original-versus-suggested Resume text from the existing validated
    analysis contract with a small deterministic in-repository word diff and
    accessible `del`/`ins` semantics. Preserve stored IDs, explicit selection,
    confirmation, stale/version checks, and immutable version creation.
  - Keep ATS Classic mandatory. Treat additional templates, bounded font and
    palette controls, and line-spacing choices as conditional. Reuse the
    canonical Resume model and existing design endpoint; do not add a second
    design system or silently add persistence fields.
  - Make Phase 16F evidence-first: establish reproducible accessibility and
    performance baselines, repair only confirmed findings, and treat the
    documented single-chunk advisory and static route imports as a measured
    candidate rather than permission for speculative memoization.
- Rationale:
  - The current React/Vite application already has one protected shell, one
    route tree, one tested native-dialog wrapper, canonical Resume versions,
    a mutable Resume-level design record, validated AI suggestion provenance,
    and established browser coverage.
  - These choices satisfy the academic-MVP requirements with the smallest
    architecture and no new dependency, provider, storage, authentication, or
    database boundary.
  - Phase 13's historical breadcrumb rejection reflected the scope at that
    time. Phase 16 introduces an explicit new mandatory requirement, so the
    earlier record is preserved rather than rewritten.
- Consequences:
  - Phase 16B through Phase 16G remain inactive until separately authorized.
  - Visible Phase 16B through Phase 16E work requires desktop, tablet, and
    mobile human visual QA and a phase-specific approval token before commit.
  - Backend and shared-contract changes are disallowed by default. A missing
    persistence field or verified backend defect requires a separately
    bounded decision instead of a frontend workaround.
  - P15-001 controlled-academic-MVP operating restrictions remain binding,
    and no Phase 16 feature expands the deployment boundary.
  - The operator accepted this architecture with
    `PHASE_16A2_ROADMAP_ARCHITECTURE_AUDIT_APPROVED`.
  - The approval closeout changed no production or test code and used no
    browser, runtime service, provider, Atlas resource, or deployment.
- Revisit conditions:
  - Repository evidence disproves one of the inspected contracts.
  - Print-preview fidelity cannot meet the bounded browser matrix without a
    different architecture.
  - A conditional design control requires persistence not present in the
    current Resume design contract.
  - Phase 16F measurements demonstrate that a different bounded performance
    repair is necessary.

## DEC-013: Direct legacy frontend port and adaptation policy

- Decision ID: `DEC-013`
- Date: 2026-07-30
- Status: ACCEPTED
- Decision:
  - The Resume Builder and AI Resume Analyser legacy frontends are approved
    component and visual sources for Career Learning Hub.
  - Relevant presentational code, layouts, CSS, microinteractions, animations,
    visual hierarchy, and suitable assets may be directly ported or faithfully
    recreated rather than merely used as inspiration.
  - Ported frontend work must be adapted to:
    - the current React and TypeScript architecture;
    - current APIs and DTOs;
    - current security and ownership controls;
    - Career Learning Hub branding;
    - responsive layouts;
    - keyboard accessibility;
    - reduced-motion preferences;
    - native 200% zoom;
    - equal or improved functionality.
  - The following must not be copied:
    - legacy authentication;
    - legacy backend or database models;
    - legacy API clients;
    - legacy secrets or environment files;
    - legacy provider configuration;
    - old branding;
    - fake testimonials;
    - fake activity or statistics;
    - unsupported ATS or employment guarantees;
    - automatic application of AI changes.
- Rationale:
  - Directly reusing approved presentational patterns preserves the strongest
    legacy visual work while the current architecture and contracts remain
    authoritative.
  - Explicit exclusions prevent obsolete branding, unsupported claims, and
    legacy security or data boundaries from entering Career Learning Hub.
- Consequences:
  - UI-LR1 — Legacy Resume Visual Port is the first completed implementation
    of this decision in commit
    `011a36e423ad2432d2dc283c457015c644a9335f`.
  - UI-LR1 was human-approved with
    `PHASE_18A_UI_LR1_LEGACY_RESUME_VISUAL_PORT_APPROVED`.
  - The implementation commit passed the read-only integrity audit with
    `ACCEPTABLE_EXTERNAL_IMPLEMENTATION_COMMIT`; no history rewrite was
    required.
  - Future legacy UI ports remain separately scoped and require current
    contract, accessibility, responsive, and human-review verification.
- Revisit conditions:
  - A separately accepted decision replaces this legacy frontend reuse policy.
  - Current architecture, security, accessibility, or accuracy requirements
    make a specific legacy presentational pattern unsuitable.

## DEC-014: Extend direct legacy frontend port and adaptation policy

- Decision ID: `DEC-014`
- Date: 2026-07-31
- Status: ACCEPTED
- Decision:
  - Interview Prep Ai and AI Learning Assistant are added as approved component
    and visual sources for Career Learning Hub under the direct legacy frontend
    port and adaptation policy established by DEC-013.
  - Relevant presentational code, layouts, CSS, microinteractions, animations,
    visual hierarchy, and suitable assets may be directly ported, adapted, or
    faithfully recreated only after a source-to-source audit of the specific
    legacy application.
  - Each legacy application requires its own source-to-source audit before its
    Career Learning Hub coverage can be declared complete.
  - The current Career Learning Hub React and TypeScript architecture, APIs,
    DTOs, authentication, ownership controls, private storage, routes,
    branding, accessibility, responsive behavior, native 200% capability, and
    real functionality remain authoritative.
  - All DEC-013 exclusions remain binding. In particular, no legacy
    authentication, backend or database model, API client, secret or
    environment file, provider configuration, old branding, fake testimonial,
    fake activity or statistic, unsupported ATS or employment guarantee, or
    automatic application of AI changes may be copied.
  - The extension also excludes unsupported global libraries or routes,
    fabricated scores or progress, unsafe raw HTML, unsanitized Markdown,
    arbitrary external links, inaccessible interaction, and contract expansion
    hidden inside a visual-port phase.
- Rationale:
  - Interview Prep Ai and AI Learning Assistant contain useful presentational
    patterns, but their legacy data, security, accessibility, and application
    boundaries are not authoritative.
  - Mandatory source-to-source audits prevent visual reuse from silently
    introducing unsupported behavior and allow an application to be declared
    complete when the current implementation is already equal or better.
- Consequences:
  - The Phase 18A Interview and Learning Legacy Comparative Audit is the first
    audit governed by this extension.
  - Interview Prep Ai requires no additional implementation when the accepted
    audit verdict is `A. COMPLETE — NO ADDITIONAL INTERVIEW IMPLEMENTATION
    REQUIRED`.
  - AI Learning Assistant work remains separately phased, test-first,
    human-reviewed, and inactive until explicitly authorized.
  - Integrated UI-QA remains after all approved legacy-port work.
- Revisit conditions:
  - A separately accepted decision replaces DEC-013 or DEC-014.
  - Current architecture, contract, security, accessibility, accuracy, or
    product requirements make a specific legacy pattern unsuitable.

## DEC-015: Use a dedicated Atlas project for Career Learning Hub staging

- Decision ID: `DEC-015`
- Date: 2026-08-02
- Status: ACCEPTED
- Decision:
  - Do not reuse the existing Interview Prep AI Atlas project or Cluster0.
  - Create a separate Atlas project named Career Learning Hub Staging only in
    a later authorized provisioning task.
  - Use a separately scoped staging cluster, database user, network controls,
    credentials, indexes, synthetic data, cleanup, and rollback boundary.
  - Leave the Interview Prep AI project and Cluster0 unchanged.
- Rationale:
  - Prevent cross-project data mixing.
  - Prevent accidental modification of legacy application data.
  - Isolate credentials, access rules, indexes, retention, cleanup, cost, and
    rollback.
  - Preserve a clear staging resource boundary.
- Consequences:
  - A new Atlas project and free-eligible cluster must be provisioned later.
  - No existing Interview Prep AI connection string may be reused.
  - Career Learning Hub staging secrets must be newly generated and separately
    stored.
  - The old project requires no data inspection for this deployment.
- Revisit conditions:
  - A separately reviewed migration requirement proves specific legacy data
    must be imported through sanitized fixtures and an approved migration
    process.
  - The operator explicitly accepts a replacement architecture decision.

## DEC-016: Verify the direct Gemini baseline before provider expansion

- Decision ID: `DEC-016`
- Date: 2026-08-03
- Status: ACCEPTED
- Decision:
  - AI-1 documents and verifies the existing direct Gemini implementation at
    merged baseline commit `54aacb62bb1371fa16d32c3311c07dfa7bdbcbab`.
  - Preserve `gemini-2.5-flash` unless a verified incompatibility requires a
    separately reviewed change.
  - Do not add another provider, provider switching, cross-provider fallback,
    credential storage, a Settings provider UI, or cloud configuration in
    AI-1.
  - Live verification uses only a privately configured backend key, synthetic
    content, and the existing embedded worker.
- Rationale:
  - The current backend registers only the Gemini adapter, while Resume,
    Interview, and Learning workflows share the same gateway and durable job
    system.
  - Establishing call paths, validation, retry behavior, and current failures
    before adding routing prevents existing uncertainty from being multiplied
    across providers.
- Consequences:
  - `docs/planning/PHASE_AI_1_GEMINI_BASELINE.md` is the baseline evidence
    record.
  - Missing live credentials, unverified retry behavior, and test gaps are
    reported as limitations rather than bypassed with production changes.
  - AI-2 readiness depends on review of the AI-1 findings and blockers.
- Revisit conditions:
  - AI-1 live verification establishes a different model compatibility fact.
  - A separately authorized and accepted AI-2 architecture supersedes the
    Gemini-only implementation boundary.

## DEC-017: Transport structural JSON Schema while retaining authoritative validation

- Decision ID: `DEC-017`
- Date: 2026-08-03
- Status: ACCEPTED
- Decision:
  - The existing provider gateway request carries a provider-neutral
    `responseJsonSchema` generated from each feature's Zod output schema.
  - The direct Gemini adapter transports the Gemini-compatible structural
    subset of that schema alongside `application/json` response handling.
  - Strict post-response Zod parsing and all feature-specific semantic,
    ownership, fencing, and secrecy checks remain authoritative.
  - Deterministic provider and output-contract errors are explicitly
    non-retryable at both gateway and worker boundaries; transient failures
    retain the existing bounded retry policies.
  - Failed provider calls release estimated token reservations while retaining
    the auditable request-attempt count and sanitized failure UsageEvent.
- Rationale:
  - MIME-only JSON generation did not tell Gemini the object contract and
    caused valid JSON with invalid feature shapes.
  - The installed Zod schemas are the single existing application contract;
    deriving the provider constraint avoids a second hand-maintained schema.
  - The tested Gemini 3.6 endpoint accepted the preserved structural schema but
    rejected the larger annotation-bearing conversion with
    `INVALID_ARGUMENT`, so Zod remains the correct enforcement boundary for
    annotations and refinements.
  - Retrying authentication, invalid-request, missing-model, or invalid-output
    failures wastes worker attempts, while token estimates from failed calls
    should not remain permanently reserved.
- Consequences:
  - Resume, Interview, Learning summary/chat, Flashcard, and Quiz live outputs
    satisfy their existing schema and semantic contracts with the locally
    configured `gemini-3.6-flash` model.
  - `gemini-2.5-flash` is recorded only as returning `NOT_FOUND` for the tested
    key/account; no global retirement claim is made.
  - The provider-neutral contract does not introduce provider selection,
    fallback, credentials, or another provider implementation.
  - Future adapters must translate this contract without weakening the
    authoritative post-response validation boundary.
- Revisit conditions:
  - Authoritative Gemini compatibility documentation or tests support safely
    transporting additional JSON Schema annotations.
  - A separately authorized AI-2 routing architecture defines a replacement
    provider contract while preserving equivalent validation and accounting.

## DEC-018: Isolate one active AI provider with encrypted credentials and frozen routing

- Decision ID: `DEC-018`
- Date: 2026-08-03
- Status: ACCEPTED
- Decision:
  - Each user has one authoritative `AiProviderPreference` document whose
    scalar `activeProvider` is `openrouter`, one direct-provider identity, or
    `disabled`. Credential documents do not carry competing active flags.
  - User-owned provider credentials are stored only as AES-256-GCM
    ciphertext, nonce, and authentication tag under versioned server-only
    `BYOK_ENCRYPTION_KEY` material. Plaintext never persists, returns after
    save, or enters jobs, usage, audit, errors, or logs.
  - OpenRouter mode may use a ranked, task-specific approved free-model list
    and an optional separately requested paid model, but both attempts stay
    inside OpenRouter. Paid fallback requires explicit permission, trusted
    pricing, an exact approved model, and atomic request/token/spend limits.
  - A direct-provider mode calls only that direct provider. It has no
    OpenRouter or cross-direct-provider fallback; verified transient failures
    may receive only a bounded same-provider retry.
  - AI jobs store an immutable, secret-free routing snapshot at enqueue time.
    The worker resolves the referenced credential only at execution and must
    reject the job when current active-provider state, credential secret
    version, paid permission, model safety, or execution deadline invalidates
    the snapshot.
  - DEC-017 remains authoritative: provider-side structural JSON Schema is a
    generation constraint, while strict post-response Zod parsing, feature
    semantic validation, ownership, fencing, persistence, and secrecy checks
    remain enforcement boundaries.
- Rationale:
  - One preference row and revision compare-and-set provide a simpler atomic
    invariant than coordinating active flags across several credentials.
  - Separating credentials from active routing lets users configure providers
    without allowing inactive credentials to receive requests.
  - Free and paid OpenRouter attempts require different authorization and
    budget gates; a separate paid request prevents a paid model from entering
    the free candidate array.
  - Enqueue-time snapshots preserve user intent, cost ceilings, and audit
    context, while the execution-time revocation gate prevents stale consent
    from calling an inactive or replaced credential.
  - Provider diversity must not weaken validated feature contracts or expose
    the same private content to unselected providers.
- Consequences:
  - The architecture, data/API contracts, migration, threat model, and phased
    implementation order are defined in the AI-2 documents.
  - Provider switching cancels or fails queued jobs for the former provider;
    jobs never silently reroute or adopt a replacement credential.
  - OpenRouter model IDs and pricing remain validated catalogue data rather
    than volatile application constants.
  - Paid fallback and browser streaming remain disabled until their dedicated
    accounting, interruption, privacy, and verification phases pass.
  - Existing environment Gemini behavior is unchanged in AI-2. Later
    migration may retain a clearly labeled administrator-managed source only
    through explicit server policy and per-user authorization.
- Rejected alternatives:
  - multiple active providers, direct cross-fallback, worker-time-only routing,
    credentials in browser storage or jobs, plaintext MongoDB keys,
    unrestricted automatic routers, hardcoded free models, unbounded paid
    fallback, raw provider errors, and replacing Zod with provider schemas.
- Revisit conditions:
  - A verified provider contract cannot preserve the required structural and
    semantic validation boundary.
  - Deployment topology cannot support the required transactional preference,
    execution-lease, and cost-reservation invariants.
  - Human review changes the administrator-managed credential policy, paid
    ceilings, retention policy, or AI-3 boundary.

## DEC-019: Use progress-only polling for durable Gemini workflows

- Decision ID: `DEC-019`
- Date: 2026-08-06
- Status: ACCEPTED
- Decision:
  - Every durable AI workflow delivers only safe job phases through the
    existing authenticated owned-job polling route.
  - Cancellation is accepted only before the execution atomically enters
    `persisting`; Retry creates a new owned, idempotent, linked job and never
    revives a terminal job.
  - The durable worker is the only retry owner. One worker attempt makes at
    most one Gemini provider attempt.
  - Final structured results remain fully buffered, strictly validated,
    execution-fenced, and atomically persisted.
  - Token streaming, SSE, and WebSockets are intentionally not implemented.
  - Gemini Direct remains the only active G-4 provider. OpenRouter remains
    disabled with no fallback.
- Rationale:
  - Token streaming would complicate citation validation, cancellation races,
    duplicate suppression, and the guarantee that users see only an atomic
    validated final result.
  - Progress-only polling preserves the existing authentication, ownership,
    request-ID, error-normalization, and bounded cleanup architecture.
  - A database execution fence plus active abort propagation protects
    cancellation, lease-loss, timeout, and late-provider-response races across
    worker instances.
- Consequences:
  - Public progress is limited to the allowlisted phases documented in the
    approved G-4 design; provider bodies, provisional tokens, prompts, routing
    snapshots, credentials, and execution internals remain private.
  - Polling is bounded and single-flight per mounted workflow, and navigation,
    unmount, replacement, cancellation, and terminal state stop timers and
    in-flight requests.
  - Existing future streaming sections in the multi-provider roadmap are not
    active implementation authority for G-4.
- Revisit conditions:
  - A separately approved design proves citation-safe incremental validation,
    durable cancellation linearization, duplicate suppression, privacy, and
    browser cleanup without weakening atomic final-result guarantees.

## DEC-020: Release Gemini-only credential settings on the routing foundation

- Decision ID: `DEC-020`
- Date: 2026-08-06
- Status: ACCEPTED
- Decision:
  - Gemini Direct is the only provider available to G-5 Settings and runtime
    execution, with fixed model `gemini-3.6-flash`.
  - Each user explicitly selects an administrator-managed Gemini credential,
    a personal AES-256-GCM encrypted Gemini credential, or disconnected state.
    Disconnected users never inherit the environment credential implicitly.
  - Personal candidates are tested once with fixed synthetic content before
    credential persistence. Successful active-key replacement increments the
    secret version and updates the active preference in the same transaction;
    failed candidates leave the existing credential and routing state intact.
  - Durable AI jobs use the existing immutable routing snapshot and the shared
    execution-time credential resolver. Replaced or deleted versions fail
    closed, while already authorized leases retain their existing lifecycle.
  - The existing OpenRouter code and data contracts remain in the repository
    but are unavailable through the G-5 API, Settings UI, snapshot compiler,
    execution authorizer, and gateway registry. No provider fallback exists.
- Rationale:
  - Reusing the AI-3 routing, vault, preference, lease, and audit foundation is
    the smallest design that gives Resume, Interview, and Learning the same
    revocation and secret-handling guarantees.
  - Explicit administrator-managed consent prevents a disconnected preference
    from silently becoming a provider authorization.
  - A fixed release provider/model keeps G-4 retry ownership and one
    provider-attempt-per-worker-attempt behavior testable.
- Consequences:
  - The Settings page exposes one bounded Gemini section and no provider or
    model selector.
  - Plaintext personal keys exist only in transient authenticated request and
    backend adapter memory and never enter responses, browser storage, URLs,
    jobs, usage events, audit records, errors, or logs.
  - OpenRouter can be reconsidered only through a separately approved release
    boundary that restores its APIs and runtime registration deliberately.
- Revisit conditions:
  - A separately approved phase authorizes another provider or model and
    re-verifies routing, privacy, cost, cancellation, and fallback policy.
