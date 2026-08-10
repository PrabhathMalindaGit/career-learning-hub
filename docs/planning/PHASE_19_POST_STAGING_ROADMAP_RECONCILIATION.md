# Phase 19 Post-Staging Roadmap Reconciliation

## 1. Status and authority

- Follow-up prompt ID:
  `CLH-PHASE-19-0-50-ITEM-REGISTER-RECONCILIATION-02`
- Original activation prompt ID:
  `CLH-PHASE-19-0-POST-STAGING-ROADMAP-RECONCILIATION-01`
- Phase: Phase 19-0 — Post-Staging Roadmap Reconciliation and Activation
- Status: `COMPLETED / HUMAN-APPROVED`
- Approval token: `PHASE_19_0_ROADMAP_RECONCILIATION_APPROVED`
- Approval token accepted: `YES`
- Date: 2026-08-10
- Authority: this record is the authoritative definition of Phase 19A through
  Phase 19H. The master plan summarizes it; `CURRENT_PHASE.md` controls the
  active execution boundary.
- Active scope: documentation and governance reconciliation only.
- Implementation status: Phase 19A through Phase 19H are `PLANNED / INACTIVE`.
- Next proposed task: `PHASE 19A-1 — RESUME EDITOR WORKSPACE`; its
  audit/implementation-preparation work requires a separate operator-approved
  prompt.

## 2. Baseline Git identity

- Repository: Career Learning Hub
- Branch: `main`
- HEAD: `00eb481af7495208af379dc0b0550e387c710cf7`
- Subject:
  `Merge pull request #3 from PrabhathMalindaGit/docs/g5-staging-closeout`
- `origin/main`: the same commit at preflight.
- Starting worktree: clean; no staged, unstaged, or untracked paths.
- This task authorizes no branch switch, stage, commit, push, pull, rebase,
  merge, PR, tag, deployment, or external-service action.

## 3. Reason for reconciliation

The original master plan named Phase 19 **Legacy Data Migration Preparation**.
A later approved post-staging product-refinement roadmap used Phase 19A through
Phase 19G for feature refinement and integrated verification. Leaving both
definitions in force would make Phase 19 ambiguous and could either skip the
product backlog or lose the migration privacy requirements.

This reconciliation establishes one sequence: product refinements in 19A-19F,
integrated verification in 19G, and the preserved migration-preparation work
in 19H. Production Release remains Phase 20, and Post-Release Monitoring and
Maintenance remains Phase 21.

## 4. Evidence inspected

Repository inspection was local and read-only before documentation edits. No
browser, provider, cloud, database, service, application server, or secret was
opened.

Controlling and status evidence:

- `AGENTS.md`
- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/DECISION_LOG.md`, especially DEC-008 and DEC-020
- `docs/planning/PHASE_G_5_GEMINI_SETTINGS_CREDENTIAL_INTEGRATION.md`
- `docs/deployment/PHASE_18A_STAGING_ARCHITECTURE_AUDIT.md`
- `docs/planning/PHASE_17_RELEASE_CANDIDATE_REVIEW_REPORT.md`

Product, UX, legacy, and verification evidence:

- operator-supplied authoritative external/handoff 50-item register received
  during human review; it was not present in Git before this reconciliation;
- `docs/planning/PHASE_13_SHARED_DESIGN_UX_AUDIT.md`
- `docs/planning/PHASE_18A_INTERVIEW_LEARNING_LEGACY_COMPARATIVE_AUDIT.md`
- `docs/planning/PHASE_18A_UI_LA1_LEARNING_DOCUMENTS_WORKSPACE_CONVERSATIONS_LEGACY_VISUAL_PORT.md`
- `docs/planning/PHASE_18A_UI_LA2_LEARNING_FLASHCARDS_QUIZZES_REVIEW_LEGACY_VISUAL_PORT.md`
- `docs/planning/PHASE_18A_UI_QA_INTEGRATED_PRE_DEPLOYMENT_UI_QUALITY_ASSURANCE.md`
- `docs/legacy-analysis/resume-builder-inventory.md`
- `docs/legacy-analysis/resume-analyser-inventory.md`
- `docs/legacy-analysis/resume-migration-plan.md`
- `docs/legacy-analysis/interview-prep-inventory.md`
- `docs/legacy-analysis/interview-migration-plan.md`
- `docs/legacy-analysis/learning-assistant-inventory.md`
- `docs/legacy-analysis/learning-migration-plan.md`
- `docs/security/PHASE_15_FINDING_REGISTER.md`

Git evidence:

- reachable commit and branch history;
- commit `4678572a491292b0eaf417c1d1e04365c201f1a8`, **Stabilize Gemini Resume import and version saving**;
- merge `8418f53dd1ab520d6383018a7366a57ef94b46e4`, G-5 implementation PR #2;
- merge `00eb481af7495208af379dc0b0550e387c710cf7`, G-5 staging-closeout PR #3.

## 5. Staging and G-5 baseline

- G-5 Gemini-only Settings and Credential Integration is complete, merged,
  deployed to staging, and cloud-smoke-tested.
- Gemini Direct with fixed model `gemini-3.6-flash` is the active release
  provider.
- OpenRouter is dormant and unavailable in the active Settings UI and runtime
  path. No OpenRouter activation or fallback is authorized.
- The Render backend and Vercel frontend are live; Atlas connectivity,
  registration/login, personal Gemini credential save/test, Resume PDF
  processing, Learning PDF processing, corrected exact staging CORS, and the
  enabled job worker were verified during the recorded staging closeout.
- Render uses `ASSET_STORAGE_DRIVER=local`. This is accepted for staging only.
  Persistent S3-compatible private storage is required before production and
  is an explicit Phase 20 blocker.
- Phase 19 product implementation has not started.

## 6. Authoritative roadmap

| Order | Phase | Name | Current status |
| ---: | --- | --- | --- |
| 0 | 19-0 | Post-Staging Roadmap Reconciliation and Activation | Completed / human-approved |
| 1 | 19A | Resume Studio refinements | Planned / inactive |
| 2 | 19B | Interview Coach refinements | Planned / inactive |
| 3 | 19C | Learning Workspace refinements | Planned / inactive |
| 4 | 19D | Dashboard refinements | Planned / inactive |
| 5 | 19E | Authentication refinements | Planned / inactive |
| 6 | 19F | Application shell and shared patterns | Planned / inactive |
| 7 | 19G | Integrated post-refinement verification | Planned / inactive |
| 8 | 19H | Legacy Data Migration Preparation | Planned / inactive |
| 9 | 20 | Production Release | Planned / inactive |
| 10 | 21 | Post-Release Monitoring and Maintenance | Planned / inactive |

Subphases run in this order unless a separately approved governance update
changes it. Completion of Phase 19-0 does not activate Phase 19A.

## 7. Phase 19A — Resume Studio refinements

Expected audit and implementation areas:

- Resume editor workspace;
- desktop editor/live-preview layout only when the current architecture and
  human visual review support it;
- mobile single-column preservation;
- browser spellcheck preservation;
- Resume collection/card hierarchy;
- creation/import workflow;
- conditional pagination;
- disabled-state guidance; and
- accessible upload interaction.

Completed urgent Resume behavior in section 15 is excluded. Phase 19A must not
reimplement PDF-import persistence, immutable version saving, duplicate-save
protection, draft preservation, or the completed validation feedback during
the planned workspace refinements.

## 8. Phase 19B — Interview Coach refinements

Expected audit and implementation areas:

- session-list and creation-flow improvements;
- conditional pagination;
- structured focus topics and skill gaps;
- improved session-card hierarchy;
- reduced visual noise; and
- user-friendly attempt-history terminology.

Question-type support is not pre-authorized. Any expansion requires a separate
audit of the current schema, shared contracts, Gemini structured-output
contract, persistence, scoring/feedback behavior, and safe migration impact.

## 9. Phase 19C — Learning Workspace refinements

Expected audit and implementation areas:

- library/upload workflow;
- document navigation and tabs;
- source-link affordances;
- grounded-chat presentation;
- Flashcard study stability;
- Quiz experience;
- attempt-history presentation; and
- user-facing terminology cleanup.

All work must preserve source grounding, answer-key secrecy, authenticated
ownership, deletion fencing, durable Gemini jobs, cancellation/retry behavior,
and background processing. No refinement may expose private storage keys,
answers before successful submission, document content in logs, or stale job
results.

## 10. Phase 19D — Dashboard refinements

Expected audit and implementation areas:

- reduce excessive page length;
- improve information hierarchy;
- make Quick Start contextual only from real owned data;
- improve empty states and Recent Activity presentation;
- remove or relocate developer-facing AI diagnostics; and
- compact responsive layouts.

Do not fabricate metrics, recommendations, progress, scores, or activity.

## 11. Phase 19E — Authentication refinements

Expected audit and implementation areas:

- login/registration panel balance;
- duplicate-branding cleanup;
- password visibility controls;
- real-time password-rule feedback;
- required-label presentation;
- button-state clarity; and
- typography consistency.

OAuth is optional, outside this roadmap authority, and requires a separate
authentication/security decision and implementation prompt.

## 12. Phase 19F — Application shell and shared patterns

Cross-feature work is allowed only when repository inspection demonstrates
genuine duplication. Candidate areas are create-intent consistency,
sidebar/account accessibility, conditional pagination, upload presentation
where justified, field/error presentation, common job-state language,
responsive shell details, and destructive-confirmation consistency.

Phase 19F explicitly prohibits a new design system, global-state rewrite,
generic form framework, command palette, global search, dark mode, new router
architecture, and broad speculative refactoring.

## 13. Phase 19G — Integrated post-refinement verification

Phase 19G is primarily verification. Its planned final gates are:

- root typecheck and backend test typecheck;
- frontend, backend, and security tests;
- production build;
- `git diff --check` and secret-pattern inspection;
- desktop, tablet, and mobile browser matrix;
- actual 200% zoom and keyboard testing;
- ownership isolation;
- fresh registration/login;
- Resume, Interview, Learning, Dashboard, and Settings/Gemini workflows;
- logout and account switching;
- minimal live Gemini verification; and
- zero OpenRouter execution.

Any defect discovered here requires a separate bounded diagnostic/repair. The
verification phase is not standing authority for unbounded repairs.

## 14. Phase 19H — Legacy Data Migration Preparation

The original Phase 19 requirements are preserved here:

- use sanitized representative fixtures only;
- never expose raw production exports to Codex;
- remove or replace PII;
- include no plaintext passwords, password hashes, sessions, tokens, secrets,
  raw personal content, or private uploads;
- produce a migration inventory and source-to-destination mapping;
- validate inputs and outputs;
- support dry runs and idempotent reruns;
- rehearse against staging only;
- require human privacy review; and
- perform no production migration without separate explicit approval.

No migration execution is authorized by Phase 19-0.

## 15. Product-backlog reconciliation

### Provenance correction

The operator-confirmed product register contains 50 findings overall. Searches
of the current repository and reachable Git history for `CLH-BUG-`, `CLH-UX-`,
`CLH-FEATURE-`, the known urgent Resume identifier, “50 findings,” “product
backlog,” “post-staging,” and “refinement” did not locate that authoritative
register or a deleted/reachable historical copy.

During human review, the operator supplied the authoritative external/handoff
register containing exactly 50 findings numbered continuously from 001 through
050. That handoff is authoritative planning provenance, not executable
repository code. The complete register has now been reviewed and reconciled
below, with every item assigned exactly one disposition.

The Phase 15 register uses `P15-*` identifiers and is a separate security and
privacy workflow. Legacy inventories use `RB-*`, `RA-*`, `IP-*`, and other
capability identifiers. Neither is silently relabeled as the missing 50-item
product register.

### Classification contract

Every canonical product finding has exactly one disposition:

- `COMPLETED`
- `PHASE_19A`
- `PHASE_19B`
- `PHASE_19C`
- `PHASE_19D`
- `PHASE_19E`
- `PHASE_19F`
- `DEFERRED`
- `REJECTED`

No item may appear in multiple categories. `PHASE_19G` is not a backlog
implementation category because it verifies the integrated result, and
`PHASE_19H` preserves migration governance rather than product refinement.

### Canonical 50-item mapping

| No. | Canonical ID | Disposition | Reconciled scope or gate |
| ---: | --- | --- | --- |
| 001 | `CLH-BUG-AI-RESUME-PDF-001` | `COMPLETED` | Gemini Resume PDF structured-output/import failure; repaired and excluded from Phase 19A. |
| 002 | `CLH-BUG-RESUME-EDITOR-002` | `COMPLETED` | Save-new-version and immutable-version persistence workflow; repaired and excluded from Phase 19A. |
| 003 | `CLH-UX-RESUME-EDITOR-003` | `COMPLETED` | Inline validation, URL normalization, first-invalid-field focus/scroll, and accessible field errors; completed and excluded from Phase 19A. |
| 004 | `CLH-UX-RESUME-EDITOR-004` | `PHASE_19A` | Evaluate a desktop editor-left/live-preview-right workspace, appropriate sticky saved-version actions, and responsive single-column fallback. |
| 005 | `CLH-UX-RESUME-EDITOR-005` | `PHASE_19A` | Preserve browser spellcheck and permit only bounded, non-destructive typo guidance. |
| 006 | `CLH-UX-INTERVIEW-006` | `PHASE_19B` | Improve session creation while keeping the session list primary. |
| 007 | `CLH-UX-INTERVIEW-007` | `PHASE_19B` | Hide pagination when all sessions fit on one page. |
| 008 | `CLH-UX-INTERVIEW-008` | `PHASE_19B` | Add accessible structured focus-topic/skill-gap entry mapped to existing arrays. |
| 009 | `CLH-UX-INTERVIEW-009` | `PHASE_19B` | Improve metadata grouping, heading punctuation, and card hierarchy. |
| 010 | `CLH-UX-INTERVIEW-010` | `PHASE_19B` | Reduce excessive uppercase eyebrow labels and visual noise. |
| 011 | `CLH-FEATURE-INTERVIEW-011` | `PHASE_19B` | Selectable question types/mixed sessions remain separately gated behind schema, shared-contract, Gemini structured-output, persistence, and compatibility audit; mapping does not authorize implementation. |
| 012 | `CLH-UX-INTERVIEW-012` | `PHASE_19B` | Replace developer-facing immutable-record terminology with Attempt History/Saved Attempts language. |
| 013 | `CLH-UX-RESUME-013` | `PHASE_19A` | Use a responsive Resume-card grid and improve creation/import placement. |
| 014 | `CLH-UX-RESUME-014` | `PHASE_19A` | Consolidate blank Resume and PDF import under one clear creation entry while preserving global + Create. |
| 015 | `CLH-UX-RESUME-015` | `PHASE_19A` | Improve Resume-card hierarchy, Open Resume action, Draft placement, metadata, and preview. |
| 016 | `CLH-UX-RESUME-016` | `PHASE_19A` | Show pagination only when total pages exceed one. |
| 017 | `CLH-UX-RESUME-017` | `PHASE_19A` | Explain why PDF import is disabled. |
| 018 | `CLH-UX-RESUME-018` | `PHASE_19A` | Provide one accessible click/justified-drag-and-drop upload interaction with filename, validation, and removal, without duplicate native controls. |
| 019 | `CLH-UX-LEARNING-019` | `PHASE_19C` | Remove duplicate Learning upload triggers while preserving global + Create. |
| 020 | `CLH-UX-LEARNING-020` | `PHASE_19C` | Move upload into a less dominant bounded workflow where appropriate and keep the document collection primary. |
| 021 | `CLH-UX-LEARNING-021` | `PHASE_19C` | Move Refresh documents beside relevant list/filter controls. |
| 022 | `CLH-UX-LEARNING-022` | `PHASE_19C` | Make the upload form more compact and task-focused. |
| 023 | `CLH-UX-LEARNING-023` | `PHASE_19C` | Replace implementation jargon with concise user-facing guidance while preserving server-authoritative behavior. |
| 024 | `CLH-UX-LEARNING-024` | `PHASE_19C` | Reduce Cancel upload visual weight so Upload document remains primary. |
| 025 | `CLH-UX-SHELL-025` | `PHASE_19F` | Make truncated account email accessible through a tooltip, focus state, or account panel while preserving privacy. |
| 026 | `CLH-UX-LEARNING-026` | `PHASE_19C` | Prevent Flashcard layout shifts when revealing answers. |
| 027 | `CLH-UX-LEARNING-027` | `PHASE_19C` | Hide/collapse Attempt History during an active Quiz and restore it after submission or on the launcher. |
| 028 | `CLH-UX-LEARNING-028` | `PHASE_19C` | Use score-aware semantic styling and textual performance labels without color-only meaning. |
| 029 | `CLH-UX-LEARNING-029` | `PHASE_19C` | Move large Flashcard/Quiz generation forms into bounded workflows where appropriate. |
| 030 | `CLH-UX-LEARNING-030` | `PHASE_19C` | Use more compact generation-form proportions. |
| 031 | `CLH-UX-LEARNING-031` | `PHASE_19C` | Use user-facing Official Results, Attempt History, Document-Based Quiz/Flashcards, and Verified Sources terminology. |
| 032 | `CLH-UX-LEARNING-032` | `PHASE_19C` | Allow study-set title rename/inline edit only when safely supported; trim accidents without rewriting meaningful text. |
| 033 | `CLH-UX-LEARNING-033` | `PHASE_19C` | Improve six-tab responsive behavior and active-state visibility. |
| 034 | `CLH-UX-LEARNING-034` | `PHASE_19C` | Make source-page citations visibly actionable with clear labels and focus/hover states. |
| 035 | `CLH-UX-LEARNING-035` | `PHASE_19C` | Use consistent but distinct user/assistant message containers and keep sources attached to assistant responses. |
| 036 | `CLH-UX-DASHBOARD-036` | `PHASE_19D` | Reduce hero height and place progress-window filters above affected metrics. |
| 037 | `CLH-UX-DASHBOARD-037` | `PHASE_19D` | Make Quick Start contextual using only real owned data. |
| 038 | `CLH-UX-DASHBOARD-038` | `PHASE_19D` | Standardize top metric-card dimensions, spacing, typography, and empty states. |
| 039 | `CLH-UX-DASHBOARD-039` | `PHASE_19D` | Replace large unavailable Interview Feedback text with a helpful empty state. |
| 040 | `CLH-UX-DASHBOARD-040` | `PHASE_19D` | Remove raw user-irrelevant AI diagnostics from the main Dashboard and place them only in a supported appropriate surface. |
| 041 | `CLH-UX-DASHBOARD-041` | `PHASE_19D` | Reduce excessive page length through bounded responsive grouping. |
| 042 | `CLH-UX-DASHBOARD-042` | `PHASE_19D` | Limit Recent Activity, add View all when appropriate, group repetition, and remove internal terminology. |
| 043 | `CLH-UX-AUTH-043` | `PHASE_19E` | Rebalance authentication form and promotional-panel proportions. |
| 044 | `CLH-UX-AUTH-044` | `PHASE_19E` | Reduce duplicate logo/wordmark presentation. |
| 045 | `CLH-UX-AUTH-045` | `PHASE_19E` | Add accessible hidden-by-default Show/Hide password controls that preserve focus and cursor behavior. |
| 046 | `CLH-UX-AUTH-046` | `PHASE_19E` | Show non-color-only real-time indicators for existing server password rules while keeping server validation authoritative. |
| 047 | `CLH-UX-AUTH-047` | `PHASE_19E` | Reduce repeated “required” label noise while preserving semantic required state. |
| 048 | `CLH-UX-AUTH-048` | `PHASE_19E` | Distinguish primary-button interaction/loading/disabled states and prevent duplicate submission. |
| 049 | `CLH-FEATURE-AUTH-049` | `DEFERRED` | Optional Google/GitHub OAuth is excluded from ordinary Phase 19E and requires separate authentication/security design and explicit approval. |
| 050 | `CLH-UX-AUTH-050` | `PHASE_19E` | Review hero typography for consistency while preserving the approved visual identity. |

### Mapping count

| Disposition | Items |
| --- | ---: |
| `COMPLETED` | 3 |
| `PHASE_19A` | 8 |
| `PHASE_19B` | 7 |
| `PHASE_19C` | 16 |
| `PHASE_19D` | 7 |
| `PHASE_19E` | 7 |
| `PHASE_19F` | 1 |
| `DEFERRED` | 1 |
| `REJECTED` | 0 |
| **Classified exactly once** | **50** |

The arithmetic is `3 + 8 + 7 + 16 + 7 + 7 + 1 + 1 + 0 = 50`.

## 16. Completed urgent Resume findings excluded from future work

Commit `4678572a491292b0eaf417c1d1e04365c201f1a8` records the following repaired
behavior:

- Gemini Resume PDF parsing reconciled with canonical Resume validation and
  persisted without partial records;
- immutable Resume version saving repaired, including active-version
  advancement and conflict/ownership safety; and
- duplicate save submissions blocked while drafts, structured field errors,
  request IDs, and the refreshed version list are preserved correctly.

The operator-supplied handoff establishes the canonical IDs and completed
dispositions for findings 001, 002, and 003. Repository commit
`4678572a491292b0eaf417c1d1e04365c201f1a8` and current tests independently
corroborate their completed behaviors, but those canonical finding IDs did not
exist in Git before this reconciliation. All three remain excluded from Phase
19A implementation.

## 17. Deferred, rejected, and separately gated items

- Finding 049 is `DEFERRED`. Optional Google/GitHub OAuth is not ordinary Phase
  19E work and requires a separate authentication/security design and explicit
  approval.
- Finding 011 is mapped to `PHASE_19B`, but this mapping does not pre-authorize
  question-type implementation. Schema, shared-contract, Gemini
  structured-output, persistence, and compatibility auditing must occur first.
- No product finding is `REJECTED`.
- P15-001 remains a technically unresolved, formally deferred security risk
  under controlled academic-MVP restrictions. It is not silently counted as
  one of the 50 product findings and remains binding for production readiness.

## 18. Separate tracks

### Other AI providers

Gemini-only remains the development and release policy. OpenRouter remains
dormant. OpenAI, Anthropic, DeepSeek, provider selection, fallback routing, or
any other provider is outside Phase 19 and requires a separate approved
decision and verification boundary.

### Custom Resume ML

The custom Resume ML track remains separate. Phase 19 authorizes no model
training, inference integration, FastAPI integration, ML deployment, or
product coupling to that track.

## 19. Phase 20 and Phase 21 preservation

Phase 20 remains **Production Release**. Its readiness gate includes completed
staging verification, persistent private storage, backup readiness, production
secrets, HTTPS/domain, exact CORS, worker configuration, monitoring, rollback,
the governance-required deep security review/scan, a release candidate,
explicit human deployment approval, production smoke testing, and separate
approval for any production data migration. No Phase 20 work is authorized
here.

Phase 21 remains **Post-Release Monitoring and Maintenance**. It covers
API/runtime errors, jobs, authentication, database health, Gemini quota/errors,
uploads, storage, small reviewed hotfixes, and incident/release records. No
Phase 21 work is authorized here.

## 20. Verification, Git, and release gates

Phase 19-0 verification is documentation-only:

- verify the baseline branch, HEAD, and worktree;
- inspect the exact changed planning files;
- run `git diff --check`;
- search for stale authoritative Phase 19 conflicts;
- confirm no non-documentation path changed; and
- leave all changes unstaged.

No install, typecheck, unit/integration/security test, build, browser test,
server, provider call, cloud action, migration, stage, commit, push, merge, PR,
tag, or deployment is required or authorized.

## 21. Human approval closeout

- Approval token: `PHASE_19_0_ROADMAP_RECONCILIATION_APPROVED`
- Approval token accepted: `YES`
- Final Phase 19-0 status: `COMPLETED / HUMAN-APPROVED`

Human review approved:

- the 19A-19H ordering and boundaries;
- the external/handoff register provenance and exactly-once 50-item mapping;
- the completed urgent Resume exclusions;
- the Gemini-only/OpenRouter-dormant policy;
- the persistent-storage production blocker;
- Phase 19H privacy and migration controls; and
- the preserved Phase 20/21 gates.

This approval does not activate Phase 19A-1. That task requires
a separate operator-approved prompt. Git staging, commit, push, PR, merge, and
deployment also remain separate manual actions.
