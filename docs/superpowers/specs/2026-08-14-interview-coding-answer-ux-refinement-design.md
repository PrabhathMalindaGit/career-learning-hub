# Phase 19B-3 Task 7R Addendum — Coding Answer UX Refinement

## Objective

Make Coding interview attempts clearer and more code-oriented without changing the typed-answer contract, persistence, feedback behavior, Gemini prompts, scoring, backend APIs, or introducing code execution.

Controlling constraint:

> Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

## Approved problem

Human browser QA confirmed that Coding questions currently use the same general attempt composer pattern as other written responses. The textarea is functional and already larger/monospace, but the UI does not clearly tell the user what level of code to submit or that the code is reviewed as text rather than executed.

## Approved design

For `questionType === "coding"` only:

- Keep the existing 12,000-character text submission contract.
- Keep the existing Save Attempt flow and immutable attempt behavior.
- Keep the existing 12-row-or-larger code-oriented textarea and monospace treatment.
- Change the visible field label from `Coding answer` to `Your code`.
- Add concise helper text above/below the textarea explaining that the user should complete only the function/solution requested by the question and does not need unrelated application boilerplate.
- Add an explicit notice that the submission is reviewed as text and is not executed.
- Add a useful coding placeholder such as `Write or paste the code you would submit in an interview…`.
- Set `spellCheck={false}` for the Coding textarea.
- Refine the Coding textarea styling to feel more like a lightweight code-entry surface while remaining a native textarea.
- Keep normal typing, paste, keyboard navigation, selection, and accessibility behavior.

The surrounding attempt composer may use a more coding-specific heading only if it can be done without changing non-Coding semantics or attempt logic. The required minimum improvement is the Coding field itself.

## Explicitly not included

- Run / Execute buttons
- compiler or sandbox
- language runtime
- automatic tests
- syntax execution or correctness claims
- Monaco, CodeMirror, or any new editor dependency
- backend changes
- API contract changes
- Gemini/provider changes
- new scoring rules
- Task 8 changes

## Behavioral invariants

The refinement must preserve:

- `TypedInterviewAnswer` for Coding as `{ type: "coding", text: string }`;
- the existing 12,000-character bound;
- blank-answer validation;
- Save Attempt request/response behavior;
- immutable saved attempts;
- Coding feedback remaining text-based and never claiming execution;
- all other question-type controls and labels unchanged;
- no Run/Execute control anywhere in the Coding answer surface.

## Expected file scope

- `frontend/src/features/interviews/InterviewAnswerControl.tsx`
- `frontend/src/features/interviews/InterviewAnswerControl.test.tsx`
- `frontend/src/features/interviews/interviewQuestionTypes.css`

Avoid modifying `InterviewSessionWorkspace.tsx` unless a coding-specific composer heading proves necessary after implementation review.

## Verification

Before Task 7R merge approval:

1. focused `InterviewAnswerControl` tests pass;
2. a Coding-specific test verifies `Your code`, helper copy, placeholder, `spellCheck=false`, code-oriented class, 12-row control, and absence of Run/Execute controls;
3. existing typed Interview workspace tests remain green;
4. frontend typecheck passes;
5. full frontend regression passes;
6. production build passes;
7. `git diff --check` is clean;
8. human browser QA confirms the Coding field is clearly code-oriented and explains that only the requested solution is needed and code is not executed.

## Merge and release control

- This addendum belongs to existing Task 7R branch `task/phase-19b3-task7r-interview-layout-refinement` and draft PR #13.
- Do not merge PR #13 without explicit Task 7R merge approval after all verification is green.
- Do not deploy, merge to `main`, delete the task branch, or begin Task 8 automatically.
