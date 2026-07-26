# Current Execution Phase

- Phase: 12
- Name: Learning Workspace Implementation
- Status: ACTIVE
- Most recently completed phase: Phase 11, Learning Legacy Inspection
- Active implementation phase: Phase 12, Learning Workspace Implementation
- Next planned phase: Phase 13, Shared Design and UX Hardening (`PLANNED`)
- Current workflow state:
  `PHASE 12 ACTIVE — PASS A COMPLETED, PASS B PLANNED, NOT ACTIVATED`
- Controlling skills: `karpathy-guidelines`, `test-driven-development`,
  `security-best-practices`

## Objective

- Implement only approved OD-001 Option B: an authenticated owner may obtain a
  bounded, short-lived private viewing or download target for the original PDF
  associated with an owned Learning Document.
- Preserve existing authentication, ownership, safe owned-404, private
  `no-store`, request-ID, Asset, storage, and Learning Document DTO behavior.
- Keep page-aware extracted chunks authoritative for citations and grounding.

## Phase status controls

- Phase 11 remains `COMPLETED`.
- Phase 12 is `ACTIVE`.
- Phase 13 remains `PLANNED`.
- Pass A — Private-PDF Contract is `COMPLETED`.
- Pass A review was approved with
  `PHASE_12A_PRIVATE_PDF_CONTRACT_REVIEW_APPROVED`.
- Pass B is `PLANNED` and not activated.
- Later Learning Workspace passes require separate bounded instructions.
- Phase 12 is not completed.

## Pass A completion record

- Approved OD-001 Option B was implemented at
  `GET /api/v1/learning-documents/:documentId/source`.
- The response exposes only `url`, `expiresAt`, and `contentType`.
- Access is authenticated, owner-scoped, short-lived, and private.
- Page-aware extracted chunks remain authoritative for grounding and citations.

## Authorized implementation scope

- The smallest relevant private Asset and Learning backend paths.
- Relevant backend tests.
- Shared or non-visible frontend contract foundations only when required to
  represent the response safely.
- The Phase 12 status records in the master plan and this file.

## Explicit exclusions

- Document library, upload, extracted-content, chat, flashcard, quiz,
  cascade-deletion, browser PDF viewer, routing, CSS, or other visible frontend
  work.
- New storage mechanisms, public URLs, unrelated API or data-model changes,
  dependency changes, migrations, and legacy access.
- Exposure of storage keys, provider names, checksums, internal paths, Asset
  metadata, owner IDs, credentials, or arbitrary headers.

## Verification

- Add focused failing tests before implementation and record RED evidence.
- Reach focused GREEN without weakening existing security or tests.
- Run the required affected backend, complete backend, typecheck, build,
  dependency-tree, and diff checks once after focused tests pass.
- Perform bounded MongoDB-backed runtime ownership verification when the local
  services are safely available.
- Review only the changed diff for ownership, IDOR, association, expiry,
  traversal, filename, metadata, logging, `no-store`, request-ID, and error
  equivalence risks.
- Leave all changes unstaged, uncommitted, and unpushed.

## Human approval gate

- No visual QA is required because Pass A includes no visible frontend change.
- Pass A review was approved with
  `PHASE_12A_PRIVATE_PDF_CONTRACT_REVIEW_APPROVED`.
- Pass B requires separate bounded activation instructions.
