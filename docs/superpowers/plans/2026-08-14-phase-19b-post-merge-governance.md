# Phase 19B Post-Merge Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile the authoritative Phase 19B governance records so they accurately record the completed PR #16 merge to `main` without changing application behavior or activating the next phase.

**Architecture:** This is a documentation-only governance correction on `task/phase-19b-post-merge-governance`, based on `main` commit `469c27f35011fb9b51e7d501d9f759fae757efb5`. Update only the controlling current-state portions of `CURRENT_PHASE.md` and the Phase 19B closeout record, while preserving historical pre-merge evidence and chronology. Verify the final PR by exact changed-file inventory, whitespace/diff checks, and a clean worktree; do not rerun executable suites unless an executable file unexpectedly changes.

**Tech Stack:** Git, GitHub pull requests, Markdown governance documents.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Work only on `task/phase-19b-post-merge-governance`.
- Base branch is `main` at `469c27f35011fb9b51e7d501d9f759fae757efb5`.
- Phase 19B integration PR is `#16 — MERGED / CLOSED`.
- Final Phase 19B branch head merged to `main` is `ea4acb059ba18f0db9d55baff7ed183b0b14a286`.
- Final Phase 19B `main` merge commit is `469c27f35011fb9b51e7d501d9f759fae757efb5`.
- Implementation targets are exactly `docs/planning/CURRENT_PHASE.md` and `docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md`.
- `docs/superpowers/specs/2026-08-14-phase-19b-post-merge-governance-design.md` and this plan are allowed process artifacts.
- Do not modify production source, test source, package manifests, lockfiles, environment/configuration files, migrations, deployment configuration, shared types, authentication, or Gemini/provider configuration.
- Do not deploy.
- Do not delete branches.
- Do not activate Phase 19C or any later phase.
- Preserve accepted Phase 19B test counts, QA results, security invariants, commit SHAs, and PR identities unless direct repository evidence requires a correction.
- No full backend/frontend regression rerun is required unless an unexpected executable-file change is introduced.

---

## File Structure

### Existing files to modify

- `docs/planning/CURRENT_PHASE.md`
  - Responsibility: current authoritative phase and release-control state.
  - Change only the controlling Phase 19B authority block above the stable historical marker `## Completed predecessor: G-5 and staging closeout`.
  - Preserve the historical tail unchanged.

- `docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md`
  - Responsibility: durable Phase 19B acceptance and release chronology.
  - Add/reconcile the post-main integration state while preserving historically correct pre-main statements as explicitly historical context.

### Process artifacts already allowed

- `docs/superpowers/specs/2026-08-14-phase-19b-post-merge-governance-design.md`
- `docs/superpowers/plans/2026-08-14-phase-19b-post-merge-governance.md`

No new production or test files are created.

---

### Task 1: Reconcile the `CURRENT_PHASE.md` Authority Block

**Files:**
- Modify: `docs/planning/CURRENT_PHASE.md`

**Interfaces:**
- Consumes: verified PR #16 merge facts and the existing Phase 19B Task 8 acceptance evidence already recorded in the file.
- Produces: a top-level authority block stating that Phase 19B is complete, merged to `main`, and closed, while leaving Phase 19C+ inactive.

- [ ] **Step 1: Confirm the stale current-state claims and stable historical marker**

Read the top of `docs/planning/CURRENT_PHASE.md` and confirm that it currently contains all of these stale present-state claims:

```text
Status: COMPLETED / FINAL ACCEPTANCE PASSED / READY FOR MAIN INTEGRATION
Main integration: NOT YET MERGED / REQUIRES SEPARATE EXPLICIT APPROVAL
Next gate: MERGE THIS CLOSEOUT DOCUMENTATION ... CREATE / REVIEW THE SEPARATE PHASE 19B-TO-MAIN INTEGRATION PR
```

Also confirm the stable historical marker exists exactly as:

```text
## Completed predecessor: G-5 and staging closeout
```

Expected: the stale claims and marker are present before editing.

- [ ] **Step 2: Preserve the historical tail before editing**

When editing locally, split the file at the exact historical marker and compute a SHA-256 hash of the marker plus all content below it. If editing through GitHub, fetch the complete file before replacement and ensure the patch stops before the marker.

Local verification pattern:

```bash
python3 - <<'PY'
from pathlib import Path
import hashlib

path = Path('docs/planning/CURRENT_PHASE.md')
text = path.read_text(encoding='utf-8')
marker = '## Completed predecessor: G-5 and staging closeout'
if marker not in text:
    raise RuntimeError('Historical marker missing')
_, tail = text.split(marker, 1)
preserved = marker + tail
print(hashlib.sha256(preserved.encode('utf-8')).hexdigest())
PY
```

Expected: one SHA-256 value is recorded for comparison after the edit.

- [ ] **Step 3: Replace only the controlling Phase 19B authority block**

The updated current-state block must retain the existing accepted Task 8 evidence and include at minimum these facts:

```text
Current execution phase: PHASE 19B
Name: Interview Coach Refinements
Status: COMPLETED / MERGED TO MAIN / CLOSED
Phase integration branch: phase-19b-interview-coach-refinements
Final Phase 19B branch head: ea4acb059ba18f0db9d55baff7ed183b0b14a286
Phase 19B integration pull request: PR #16 — MERGED / CLOSED
Main merge commit: 469c27f35011fb9b51e7d501d9f759fae757efb5
Main integration: COMPLETE
Task 8 final accepted head: 7c740e19db3fb834f0cbde609c2c503f8f22de66
Task 8 merge commit: 5da65534e1f07f7905310d70272af068c71c4d42
Final live Gemini acceptance: PASSED
Final human browser/responsive QA: PASSED / USER APPROVED
Manual deployment: NOT AUTHORIZED / NOT PERFORMED BY THIS INTEGRATION WORKFLOW
Branch deletion: NOT AUTHORIZED / NOT PERFORMED
Phase 19C through Phase 19H status: PLANNED / INACTIVE
Phase 20 and Phase 21 status: PLANNED / INACTIVE
Next gate: SEPARATELY REVIEW AND AUTHORIZE THE NEXT PHASE; NO NEXT PHASE IS ACTIVE YET
```

Preserve the existing automated acceptance evidence verbatim:

```text
FOCUSED BACKEND 34/34 PASS / FOCUSED FRONTEND 235/235 PASS /
SECURITY-OWNERSHIP-RESILIENCE BACKEND 54/54 PASS /
SECURITY-OWNERSHIP-RESILIENCE FRONTEND 77/77 PASS /
FULL BACKEND 479/479 PASS / FULL FRONTEND 1044/1044 PASS /
BACKEND+FRONTEND TYPECHECKS PASS /
BACKEND+FRONTEND PRODUCTION BUILDS PASS /
FINAL DIFF CHECK PASS / FINAL WORKTREE CLEAN
```

Do not add any statement that Phase 19C is active or that a deployment occurred.

- [ ] **Step 4: Verify historical-tail preservation and whitespace**

If edited locally, rerun the SHA-256 script from Step 2 and compare the before/after values.

Expected:

```text
HISTORICAL_TAIL_PRESERVED=PASS
```

Then run:

```bash
git diff --check -- docs/planning/CURRENT_PHASE.md
git --no-pager diff -- docs/planning/CURRENT_PHASE.md
```

Expected: `git diff --check` produces no output; the patch contains only the bounded top authority block.

- [ ] **Step 5: Commit the authority reconciliation**

```bash
git add docs/planning/CURRENT_PHASE.md
git diff --cached --check
git commit -m "docs: record Phase 19B main integration"
```

Expected: one documentation-only commit containing only `CURRENT_PHASE.md`.

---

### Task 2: Reconcile the Phase 19B Closeout Record

**Files:**
- Modify: `docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md`

**Interfaces:**
- Consumes: the existing immutable Phase 19B acceptance chronology plus PR #16 final merge facts.
- Produces: a closeout record that clearly distinguishes historical pre-main state from current post-main state.

- [ ] **Step 1: Identify current-state statements that became stale after PR #16**

Confirm the file contains present-state wording equivalent to:

```text
COMPLETED / FINAL ACCEPTANCE PASSED / READY FOR MAIN INTEGRATION
Phase 19B is not yet merged to main
Main integration: NOT YET PERFORMED
Phase 19B is READY FOR MAIN INTEGRATION
The next governance action is a separate PR ... to main
```

Expected: these statements are present and were historically correct before PR #16.

- [ ] **Step 2: Add a clear post-main integration section near the top**

Add a section immediately after the title/status area named:

```markdown
## Post-main integration state
```

It must record exactly these verified facts:

```text
Status: COMPLETED / MERGED TO MAIN / CLOSED
Integration PR: #16 — MERGED / CLOSED
Merged Phase 19B branch head: ea4acb059ba18f0db9d55baff7ed183b0b14a286
Main merge commit: 469c27f35011fb9b51e7d501d9f759fae757efb5
Integration review: PASS
Manual deployment: NOT AUTHORIZED / NOT PERFORMED BY THIS INTEGRATION WORKFLOW
Branch deletion: NOT AUTHORIZED / NOT PERFORMED
Phase 19C and later phases: PLANNED / INACTIVE
Next governance gate: separately review and authorize the next phase
```

Also state that the pre-main closeout material below remains preserved as historical acceptance evidence and should be read in its original temporal context.

- [ ] **Step 3: Reconcile present-tense status and identity fields without erasing history**

Update the top current-status wording and identity/release-control fields so a reader cannot interpret the document as currently awaiting main integration.

Use temporal qualifiers for historical statements. For example:

```text
At the time of the pre-main closeout, Phase 19B had not yet been merged to main.
```

Do not rewrite accepted test evidence, Task 8 repair commits, security invariants, or human QA results merely because the merge later occurred.

- [ ] **Step 4: Reconcile the final Release control section**

The final release-control section must now state:

```text
Phase 19B: COMPLETED / MERGED TO MAIN / CLOSED
PR #16: MERGED / CLOSED
Main merge commit: 469c27f35011fb9b51e7d501d9f759fae757efb5
Manual deployment: NOT AUTHORIZED / NOT PERFORMED BY THIS INTEGRATION WORKFLOW
Branch deletion: NOT AUTHORIZED / NOT PERFORMED
Phase 19C and later phases: PLANNED / INACTIVE
Next governance action: separate review and authorization of the next phase
```

Remove only stale present-tense claims that the next action is to create the already-completed Phase 19B-to-main PR.

- [ ] **Step 5: Verify the closeout patch and commit**

Run:

```bash
git diff --check -- docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md
git --no-pager diff -- docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md
```

Expected: no whitespace errors; only governance-state/temporal wording changes; all accepted evidence remains present.

Then commit:

```bash
git add docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md
git diff --cached --check
git commit -m "docs: finalize Phase 19B closeout on main"
```

Expected: one documentation-only commit containing only the closeout record.

---

### Task 3: Final Documentation-Only Verification and PR Review

**Files:**
- Verify: `docs/planning/CURRENT_PHASE.md`
- Verify: `docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md`
- Verify: `docs/superpowers/specs/2026-08-14-phase-19b-post-merge-governance-design.md`
- Verify: `docs/superpowers/plans/2026-08-14-phase-19b-post-merge-governance.md`

**Interfaces:**
- Consumes: completed Task 1 and Task 2 documentation commits.
- Produces: a merge-ready documentation-only PR with explicit evidence that no executable scope was introduced.

- [ ] **Step 1: Synchronize and verify branch identity**

```bash
git fetch origin
git switch task/phase-19b-post-merge-governance
git pull --ff-only

git branch --show-current
git rev-parse HEAD
git status --short
```

Expected: correct task branch and clean working tree.

- [ ] **Step 2: Run the complete docs-only diff gate**

```bash
git diff --check origin/main...HEAD
git diff --name-only origin/main...HEAD
```

Expected changed files are exactly:

```text
docs/planning/CURRENT_PHASE.md
docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md
docs/superpowers/plans/2026-08-14-phase-19b-post-merge-governance.md
docs/superpowers/specs/2026-08-14-phase-19b-post-merge-governance-design.md
```

If any production, test, configuration, dependency, migration, or deployment file appears, stop and treat it as a scope violation.

- [ ] **Step 3: Verify required post-main facts are present**

Run:

```bash
grep -n "469c27f35011fb9b51e7d501d9f759fae757efb5" \
  docs/planning/CURRENT_PHASE.md \
  docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md

grep -n "PR #16\|#16" \
  docs/planning/CURRENT_PHASE.md \
  docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md
```

Expected: both governance files record the final main merge SHA and PR #16.

- [ ] **Step 4: Verify prohibited current-state claims are absent from authority/release-control sections**

Inspect the relevant current-state sections and verify they do not claim:

```text
READY FOR MAIN INTEGRATION
Main integration: NOT YET MERGED
Main integration: NOT YET PERFORMED
Next action: create Phase 19B-to-main PR
Phase 19C active
Deployment performed by this workflow
Branch deletion performed
```

Historical pre-main wording may remain only where explicitly qualified as historical context.

- [ ] **Step 5: Confirm no executable test rerun is necessary**

Because the final changed-file list is Markdown-only, do not rerun backend/frontend suites, typechecks, or production builds.

If the changed-file list includes any executable/test/config/dependency file, stop and require a new verification decision before proceeding.

- [ ] **Step 6: Push and perform final PR review**

```bash
git push origin task/phase-19b-post-merge-governance
git status --short
```

Expected: push succeeds; worktree remains clean.

On GitHub, verify PR #17:

```text
Base: main
Head: task/phase-19b-post-merge-governance
Draft: true until user-run final verification is green
Mergeable: true
Changed files: exactly the four approved Markdown files
Unresolved review threads: none
No submitted review requiring action
```

Update the PR evidence with the final docs-only verification result. Mark Ready for review only after the user-run local gate passes. Do not merge until the user separately approves the PR merge.

---

## Final Acceptance Criteria

The implementation is ready for merge approval only when all of the following are true:

- `CURRENT_PHASE.md` states `COMPLETED / MERGED TO MAIN / CLOSED` for Phase 19B.
- `CURRENT_PHASE.md` records PR #16 and main merge commit `469c27f35011fb9b51e7d501d9f759fae757efb5`.
- `CURRENT_PHASE.md` preserves the accepted Task 8 evidence and historical tail.
- The Phase 19B closeout record contains a clear post-main integration state.
- The closeout record preserves historically accurate pre-main chronology as explicitly historical context.
- Both files state that no manual deployment or branch deletion was performed by this workflow.
- Phase 19C and later phases remain planned/inactive.
- The next gate is a separate decision to review/authorize the next phase.
- `git diff --check origin/main...HEAD` is clean.
- The PR changes exactly the two governance files plus the approved spec/plan process artifacts.
- No executable test rerun is needed because no executable file changed.
- PR #17 remains unmerged until separate explicit user merge approval.
