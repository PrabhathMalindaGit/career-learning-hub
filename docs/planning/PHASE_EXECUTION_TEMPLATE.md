# Execution phase prompt template

## Prompt metadata

- Prompt ID: `<PROMPT_ID>`
- Mode: `<MODE>`
- Phase number: `<EXECUTION_PHASE_NUMBER>`
- Phase name: `<EXECUTION_PHASE_NAME>`
- Controlling skill: `karpathy-guidelines`
- Required skills:
  - `<REQUIRED_SKILL_1>`
  - `<REQUIRED_SKILL_2>`
- Active repository: `Career Learning Hub`
- Approved external read-only references:
  - `<NONE_OR_EXPLICITLY_APPROVED_REFERENCE>`
- Human approval token: `<PHASE_APPROVAL_TOKEN>`
- Next phase: `<NEXT_EXECUTION_PHASE_NUMBER_AND_NAME>`

## Objective

- Primary outcome: `<CONCRETE_OUTCOME>`
- Completion evidence: `<BINARY_OR_MEASURABLE_EVIDENCE>`
- Stop condition: `<CONDITION_REQUIRING_HUMAN_DIRECTION>`

## Relevant files to inspect

- `<FILE_OR_DIRECTORY_1>`
- `<FILE_OR_DIRECTORY_2>`
- Inspect only what is needed for this phase.
- Do not inspect an external read-only legacy reference unless this phase grants explicit access to that exact reference.

## In scope

- `<IN_SCOPE_ITEM_1>`
- `<IN_SCOPE_ITEM_2>`

## Out of scope

- `<OUT_OF_SCOPE_ITEM_1>`
- `<OUT_OF_SCOPE_ITEM_2>`
- Unrelated cleanup, speculative abstraction, or architecture changes.
- Any external read-only legacy reference not explicitly approved above.

## Assumptions

- `<ASSUMPTION_1>`
- `<ASSUMPTION_2>`
- Mark any repository statement that lacks verification as unverified.

## Ambiguities

- `<AMBIGUITY_OR_NONE>`
- Stop before editing if an ambiguity changes the intended outcome, verification, security boundary, or allowed write scope.

## Security and privacy risks

- `<RISK_1_AND_CONTROL>`
- `<RISK_2_AND_CONTROL>`
- Never commit secrets, personal data, environment values, raw production exports, tokens, sessions, plaintext passwords, or password hashes.
- Never weaken a test or security control to obtain a passing result.

## Success criteria

- `<MEASURABLE_CRITERION_1>`
- `<MEASURABLE_CRITERION_2>`
- `<REQUIRED_COMMAND_OR_REVIEW_RESULT>`
- Every changed line traces to the phase objective.

## Expected files to modify

- `<EXACT_PATH_1>`
- `<EXACT_PATH_2>`
- Do not create or modify other files without reporting the need and obtaining any required approval.

## Smallest implementation plan

1. `<SMALLEST_STEP_1>` → verify: `<CHECK_1>`
2. `<SMALLEST_STEP_2>` → verify: `<CHECK_2>`
3. `<SMALLEST_STEP_3>` → verify: `<CHECK_3>`

## Mandatory workflow

1. Inspect.
2. Clarify assumptions, ambiguities, conflicts, and scope.
3. Define measurable success.
4. Plan the smallest valid implementation.
5. Implement with surgical changes.
6. Verify with the approved commands and review criteria.
7. Stop after three unsuccessful code-changing repair attempts for the same root failure.
8. Run human visual QA when visible UI changed.
9. Review Git status and diff.
10. Stop before commit.

## Verification commands

- `<COMMAND_1>`
- `<COMMAND_2>`
- `<COMMAND_3>`
- Record exact command results.
- Do not claim an unrun or failed command passed.

## Visual-QA requirements

- Browser automation does not replace human visual review.
- Any visible React change requires:
  - A local URL.
  - An inspection checklist for affected screens, states, breakpoints, keyboard behavior, focus behavior, and regressions.
  - The required phase-specific visual approval token.
- Stop before commit until the user provides the required visual approval token.
- If no visible UI changed, record: `<NO_VISIBLE_UI_CHANGE_EVIDENCE>`.

## Failure-loop stop rule

- A root failure is one underlying cause that produces the same failing result.
- Maximum three code-changing repair attempts for the same root failure.
- After the third failure:
  - Stop modifying files.
  - Do not skip or weaken tests.
  - Do not weaken security controls.
  - Report the exact command.
  - Report the exact error.
  - Report each repair attempt.
  - Report the likely cause.
  - Wait for human direction.

## Required reports

### Before editing

- Requested outcome.
- Assumptions.
- Ambiguities or conflicts.
- Existing relevant files.
- Exact files expected to change.
- Measurable success criteria.
- Smallest implementation plan.

### After verification

- Inspection summary.
- Files created.
- Files modified.
- Verification commands and results.
- Remaining ambiguity or risk.
- Unverified claims deliberately avoided.
- Git status and diff summary.
- Required human approval token.

## Git review requirements

- Run `git status --short`.
- Run `git diff --stat`.
- Run a scoped `git diff -- <EXPECTED_PATHS>`.
- Check for secrets, personal data, environment values, generated files, unrelated edits, and changes outside the approved scope.
- Show the review evidence to the user.
- Do not stage or commit without explicit user authorization.

## Human approval gate

- Required token: `<PHASE_APPROVAL_TOKEN>`
- Required visual token, if applicable: `<VISUAL_APPROVAL_TOKEN_OR_NOT_APPLICABLE>`
- Stop before commit.
- Do not activate `<NEXT_EXECUTION_PHASE_NUMBER_AND_NAME>` until the user approves this phase.
