# Interview Wizard and Build the Briefing Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Interview creation guided rather than text-heavy, fix stale exact-count state, and make custom generation categories visibly behave like selected categories without changing backend/Gemini contracts.

**Architecture:** Keep the existing Interview API/session payload unchanged. Add a small local role-guidance module plus focused frontend controls for role selection and suggested multi-select tags, integrate them surgically into `InterviewCreateDialog`, then fix the two independent Build the Briefing state/visual defects in their existing components. No broad workspace rewrite is allowed.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, existing Interview frontend API/contracts and CSS conventions.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Work only on `task/phase-19b3-task7r-interview-layout-refinement` / PR #13.
- Do not merge or deploy during implementation.
- Do not change the existing Interview session API payload shape: `title`, `targetRole`, `experienceLevel`, `mode`, `focusTopics`, `skillGaps`, optional `jobDescription`.
- Do not add a backend endpoint, schema field, Gemini/provider call, worker/job, external taxonomy service, embeddings, SSE/WebSocket, or code-execution capability.
- Keep Focus topics and Skill gaps optional and unselected by default.
- Changing Target role must update suggestions without deleting already-selected topics/gaps.
- `Mid-level` is the default Experience level.
- Exact distribution must reset to Balanced when Question count changes while exact counts are active.
- Context and custom generation categories must use one visible selected-state language.
- Preserve existing validation, dialog focus management, request-ID handling, ownership/security, polling/idempotency, typed-question behavior, MCQ secrecy, and Coding no-execution policy.
- Implementation uses GitHub connector writes. The user runs local verification after the implementation batch; browser QA follows only after automated checks are green.

---

## File Structure

### New files

- `frontend/src/features/interviews/interviewRoleGuidance.ts` — built-in role catalog, experience-level options, deterministic custom-role family matching, role-aware topic/gap suggestions, and smart-title helper.
- `frontend/src/features/interviews/interviewRoleGuidance.test.ts` — pure helper/catalog tests.
- `frontend/src/features/interviews/InterviewRoleSelector.tsx` — searchable single-select role control with common-role shortcuts and explicit custom-role adoption.
- `frontend/src/features/interviews/InterviewRoleSelector.test.tsx` — selector interaction/accessibility tests.
- `frontend/src/features/interviews/InterviewSuggestedTagInput.tsx` — optional multi-select suggestion surface plus custom-value entry for Focus topics/Skill gaps.
- `frontend/src/features/interviews/InterviewSuggestedTagInput.test.tsx` — suggestion/custom/preservation/limit tests.
- `frontend/src/features/interviews/interviewCreateGuidance.css` — focused wizard guidance/selector styling and responsive behavior.

### Existing files to modify

- `frontend/src/features/interviews/InterviewCreateDialog.tsx` — integrate role selector, predefined experience select, smart title ownership, role-aware suggested topics/gaps, and clean required/optional copy.
- `frontend/src/features/interviews/InterviewCreateDialog.test.tsx` — update existing dialog expectations and add integrated wizard behavior coverage.
- `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx` — reset stale exact-count mode on Question count changes and announce the reset.
- `frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx` — replace the old stale-mismatch expectation with reset-to-balanced behavior.
- `frontend/src/features/interviews/InterviewCategorySelector.tsx` — render custom selections as the same pressed/toggle chips as selected context categories.
- `frontend/src/features/interviews/InterviewCategorySelector.test.tsx` — assert unified selected state/removal/counter behavior.
- `frontend/src/features/interviews/interviewCategorySelector.css` — remove the weaker custom-chip treatment and let custom selections reuse `.interview-category-chip`.
- `frontend/src/features/interviews/InterviewSessionWorkspace.practiceExperience.test.tsx` — retain the integrated generation-category payload checks and update only selectors/assertions affected by the unified category presentation.

---

### Task 1: Local role guidance and title helpers

**Files:**
- Create: `frontend/src/features/interviews/interviewRoleGuidance.ts`
- Create: `frontend/src/features/interviews/interviewRoleGuidance.test.ts`

**Interfaces:**
- Produces:
  - `INTERVIEW_EXPERIENCE_LEVELS: readonly string[]`
  - `INTERVIEW_ROLE_OPTIONS: readonly InterviewRoleGuidance[]`
  - `type InterviewRoleFamily = "software-engineer" | "frontend" | "backend" | "full-stack" | "mobile" | "devops-cloud" | "data" | "ml-ai" | "cybersecurity" | "qa-test"`
  - `matchInterviewRoleFamily(targetRole: string): InterviewRoleFamily`
  - `getInterviewRoleSuggestions(targetRole: string): { focusTopics: readonly string[]; skillGaps: readonly string[] }`
  - `suggestInterviewTitle(targetRole: string, experienceLevel: string): string`

- [ ] **Step 1: Write failing pure-helper tests**

Cover exactly:

```ts
expect(INTERVIEW_EXPERIENCE_LEVELS).toEqual([
  "Intern / Student",
  "Entry-level",
  "Junior",
  "Mid-level",
  "Senior",
  "Lead / Staff",
  "Manager",
]);

expect(matchInterviewRoleFamily("MERN Developer")).toBe("full-stack");
expect(matchInterviewRoleFamily("React Native Engineer")).toBe("mobile");
expect(matchInterviewRoleFamily("LLM Engineer")).toBe("ml-ai");
expect(matchInterviewRoleFamily("Cloud Platform Engineer")).toBe("devops-cloud");
expect(matchInterviewRoleFamily("Penetration Tester")).toBe("cybersecurity");
expect(matchInterviewRoleFamily("Unusual Internal Tools Specialist")).toBe("software-engineer");

expect(suggestInterviewTitle("Backend Developer", "Mid-level")).toBe(
  "Mid-level Backend Developer Interview",
);
expect(suggestInterviewTitle("", "Mid-level")).toBe("");
```

Also assert every built-in role has non-empty, duplicate-free Focus topic and Skill gap arrays.

- [ ] **Step 2: Verify the tests are RED locally when the user next runs them**

Command:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/interviewRoleGuidance.test.ts
```

Expected before implementation: module-not-found / missing-export failure for the new helper module.

- [ ] **Step 3: Implement the smallest static role catalog**

Use these built-in labels/families:

```ts
[
  ["Software Engineer", "software-engineer"],
  ["Frontend Developer", "frontend"],
  ["Backend Developer", "backend"],
  ["Full-Stack Developer", "full-stack"],
  ["Mobile Developer", "mobile"],
  ["DevOps / Cloud Engineer", "devops-cloud"],
  ["Data Engineer", "data"],
  ["ML / AI Engineer", "ml-ai"],
  ["Cybersecurity Engineer", "cybersecurity"],
  ["QA / Test Engineer", "qa-test"],
]
```

Keep each family to a practical local list. Use these Focus topic catalogs:

```ts
software-engineer: ["Data Structures", "Algorithms", "APIs", "Databases", "Testing", "System Design", "Security", "Performance"]
frontend: ["React", "TypeScript", "State Management", "Accessibility", "Responsive Design", "Testing", "Browser APIs", "Frontend Architecture"]
backend: ["REST APIs", "Authentication", "Databases", "System Design", "Caching", "Testing", "Performance", "Security"]
full-stack: ["Frontend Architecture", "REST APIs", "Authentication", "Databases", "State Management", "Testing", "Deployment", "System Design"]
mobile: ["Mobile Architecture", "State Management", "Networking", "Offline Data", "Performance", "Testing", "Platform APIs", "App Lifecycle"]
devops-cloud: ["CI/CD", "Containers", "Cloud Architecture", "Infrastructure as Code", "Observability", "Networking", "Security", "Reliability"]
data: ["SQL", "Data Modeling", "ETL / ELT", "Data Warehousing", "Streaming", "Data Quality", "Python", "Pipeline Design"]
ml-ai: ["Machine Learning", "Deep Learning", "Model Evaluation", "Feature Engineering", "LLMs", "MLOps", "Python", "Data Processing"]
cybersecurity: ["Application Security", "Network Security", "Threat Modeling", "Authentication", "Secure Coding", "Vulnerability Assessment", "Incident Response", "Cloud Security"]
qa-test: ["Test Strategy", "Automation", "API Testing", "UI Testing", "Performance Testing", "Regression Testing", "CI Quality Gates", "Defect Analysis"]
```

Use these Skill gap catalogs:

```ts
software-engineer: ["Problem Solving", "System Design", "Testing Strategy", "Debugging", "Code Quality", "Performance", "Security", "Communication"]
frontend: ["State Management", "React Performance", "Accessibility", "Testing", "TypeScript", "Responsive Design", "Browser APIs", "Frontend Architecture"]
backend: ["System Design", "Database Optimization", "API Security", "Caching Strategies", "Testing", "Observability", "Concurrency", "Performance Tuning"]
full-stack: ["System Design", "Frontend Performance", "API Design", "Database Optimization", "Authentication", "Testing Strategy", "Deployment", "Cross-layer Debugging"]
mobile: ["Mobile Architecture", "Performance Profiling", "Offline Synchronization", "Testing", "Platform APIs", "Memory Management", "Networking", "Release Engineering"]
devops-cloud: ["Cloud Architecture", "Incident Response", "Observability", "Infrastructure as Code", "Container Security", "Networking", "Cost Awareness", "Reliability Engineering"]
data: ["Data Modeling", "Query Optimization", "Pipeline Reliability", "Streaming Systems", "Data Quality", "Warehouse Design", "Orchestration", "Scalability"]
ml-ai: ["Model Evaluation", "Feature Engineering", "ML System Design", "MLOps", "Data Leakage", "LLM Evaluation", "Experiment Design", "Production Monitoring"]
cybersecurity: ["Threat Modeling", "Secure Architecture", "Web Security", "Cloud Security", "Incident Response", "Vulnerability Analysis", "Identity and Access", "Security Testing"]
qa-test: ["Automation Design", "Test Strategy", "API Testing", "Performance Testing", "Flaky Test Diagnosis", "CI Integration", "Risk-based Testing", "Test Data Design"]
```

Custom-role matching should normalize case and whitespace, then apply small keyword checks in specific-first order. Include keywords such as `mern|full stack|full-stack` → full-stack, `react native|ios|android|mobile` → mobile, `llm|machine learning|ml engineer|artificial intelligence|ai engineer` → ml-ai, `devops|cloud|platform engineer|sre` → devops-cloud, `penetration|cyber|security` → cybersecurity, `data engineer|etl|warehouse` → data, `frontend|front-end|react developer` → frontend, `backend|back-end|api developer` → backend, `qa|test engineer|quality assurance` → qa-test; otherwise software-engineer.

- [ ] **Step 4: Keep title formatting deterministic**

Implementation rule:

```ts
export function suggestInterviewTitle(role: string, level: string): string {
  const cleanRole = role.trim();
  const cleanLevel = level.trim();
  if (!cleanRole || !cleanLevel) return "";
  return `${cleanLevel} ${cleanRole} Interview`;
}
```

- [ ] **Step 5: Commit the helper task**

Commit message:

```text
feat: add local interview role guidance
```

---

### Task 2: Searchable Target role selector

**Files:**
- Create: `frontend/src/features/interviews/InterviewRoleSelector.tsx`
- Create: `frontend/src/features/interviews/InterviewRoleSelector.test.tsx`
- Create/extend: `frontend/src/features/interviews/interviewCreateGuidance.css`

**Interfaces:**
- Consumes: `INTERVIEW_ROLE_OPTIONS` from Task 1.
- Produces:

```ts
interface InterviewRoleSelectorProps {
  value: string;
  disabled?: boolean;
  error?: string;
  onChange(next: string): void;
}
```

- [ ] **Step 1: Write failing interaction tests**

Tests must prove:

1. all ten common-role shortcut buttons are discoverable;
2. typing `backend` filters the suggestion list to Backend Developer;
3. clicking Backend Developer calls `onChange("Backend Developer")`;
4. typing `Solutions Architect` exposes an explicit `Use “Solutions Architect”` action;
5. clicking that action calls `onChange("Solutions Architect")`;
6. selecting one role replaces the previous role rather than accumulating values;
7. the search input exposes `role="combobox"`, `aria-autocomplete="list"`, `aria-controls`, and an accessible `Target role` name;
8. keyboard Enter chooses an exact filtered built-in option, while custom text requires the explicit Use action;
9. disabled state disables shortcuts/search/custom adoption.

- [ ] **Step 2: Implement the smallest controlled selector**

State owned inside the component should be only the current search draft/open state. The authoritative selected role remains `props.value`.

Interaction model:

```text
Target role
Common roles
[Software Engineer] [Frontend Developer] ...
Search or enter another role
[search input]
(filtered list when search text is present)
[Use “custom text”] only when trimmed text is non-empty and is not an exact built-in label
```

Do not add a dependency for combobox behavior. Keep filtered options bounded to the ten local roles.

- [ ] **Step 3: Add focused responsive styling**

Use `interviewCreateGuidance.css` for:

- wrapping role shortcut chips/cards;
- clear selected state using `aria-pressed="true"`;
- a bounded filtered-result surface;
- full-width search field;
- mobile stacking below ~560px;
- existing focus-ring variables/conventions.

- [ ] **Step 4: Commit the selector task**

Commit message:

```text
feat: add guided interview role selector
```

---

### Task 3: Suggested Focus topic and Skill gap selector

**Files:**
- Create: `frontend/src/features/interviews/InterviewSuggestedTagInput.tsx`
- Create: `frontend/src/features/interviews/InterviewSuggestedTagInput.test.tsx`
- Modify: `frontend/src/features/interviews/interviewCreateGuidance.css`
- Reuse: `frontend/src/features/interviews/InterviewTagInput.tsx` exports `INTERVIEW_TAG_MAX_ITEMS`, `INTERVIEW_TAG_MAX_LENGTH`, and `mergeInterviewTags`.

**Interfaces:**

```ts
interface InterviewSuggestedTagInputProps {
  id: string;
  label: string;
  suggestions: readonly string[];
  values: string[];
  disabled?: boolean;
  placeholder: string;
  helpText: string;
  error?: string;
  onValuesChange(next: string[]): void;
  onError(next?: string): void;
}
```

- [ ] **Step 1: Write failing tests for the approved interaction**

Cover:

- suggestions render unselected with `aria-pressed="false"`;
- clicking one suggestion selects it and changes to `aria-pressed="true"`;
- clicking a selected suggestion removes it;
- custom text can be added with Enter or Add button and appears as the same pressed selected-chip style;
- clicking a selected custom value removes it;
- when `suggestions` prop changes, already-selected values not in the new suggestion set remain visible/selected;
- max 50 values and max 120 characters reuse the existing constants/error messages;
- empty selection remains valid;
- duplicate additions do not create duplicate visible selected values.

- [ ] **Step 2: Implement as a focused component, not a rewrite of `InterviewTagInput`**

Use the existing merge/limit helper for custom input validation. Build the visible chip set as:

```ts
const visible = [
  ...suggestions,
  ...values.filter((value) => !suggestions.includes(value)),
];
```

Render every visible value as one button using `aria-pressed={values.includes(value)}`. Suggested-but-unselected values remain available; selected custom/retained values disappear only when explicitly deselected and are not in the current suggestion catalog.

- [ ] **Step 3: Add custom input behavior without nested forms**

The component must render a `div`/control group, never its own `<form>`, because it lives inside `InterviewCreateDialog`'s form. Use `type="button"` for Add. Enter/comma in the custom input commits locally with `preventDefault()` so it cannot submit the outer dialog.

- [ ] **Step 4: Commit the suggested-tag task**

Commit message:

```text
feat: add guided interview topic selectors
```

---

### Task 4: Integrate the guided Create Interview wizard

**Files:**
- Modify: `frontend/src/features/interviews/InterviewCreateDialog.tsx`
- Modify: `frontend/src/features/interviews/InterviewCreateDialog.test.tsx`
- Modify: `frontend/src/features/interviews/interviewCreateGuidance.css`

**Interfaces:**
- Consumes: `InterviewRoleSelector`, `InterviewSuggestedTagInput`, `INTERVIEW_EXPERIENCE_LEVELS`, `getInterviewRoleSuggestions`, `suggestInterviewTitle`.
- Produces: unchanged `createInterviewSession(...)` payload.

- [ ] **Step 1: Update failing dialog tests before production integration**

Replace old assumptions that Target role and Experience level are textboxes. Add/adjust tests to prove:

1. Experience level is a combobox/select with exactly the seven approved options and defaults to `Mid-level`;
2. selecting `Backend Developer` while title is untouched sets `Mid-level Backend Developer Interview`;
3. changing experience to Senior before manual title edit updates it to `Senior Backend Developer Interview`;
4. manually editing or clearing Session title marks it user-owned and later role/level changes do not overwrite it;
5. Backend Developer reveals Backend focus/gap suggestions, all initially unselected;
6. selecting REST APIs and System Design adds them to the outgoing arrays;
7. switching role to ML / AI Engineer changes the available suggestions while preserving already-selected REST APIs/System Design;
8. a custom role such as `LLM Engineer` uses ML/AI suggestions through local family matching;
9. Focus topics and Skill gaps can remain empty and session creation still succeeds;
10. custom topic/gap entry still respects existing limits and is sent in the current arrays;
11. visible `(required)` strings are absent;
12. the form-level note reads `Required: Session title, Target role, Experience level and Practice mode.`;
13. labels show `Focus topics · Optional`, `Skill gaps · Optional`, and `Additional context · Optional`;
14. existing Cancel/Escape/reset/focus, pending-submit lock, API-error/request-ID, validation summary, and `onCreated` tests remain green.

- [ ] **Step 2: Add smart-title ownership state**

Use a boolean/ref such as `titleIsUserOwned` initialized `false` and reset to `false` in `resetForm()`.

Rules:

```ts
function adoptRole(nextRole: string) {
  setTargetRole(nextRole);
  if (!titleIsUserOwned) {
    setTitle(suggestInterviewTitle(nextRole, experienceLevel));
  }
}

function adoptExperienceLevel(nextLevel: string) {
  setExperienceLevel(nextLevel);
  if (!titleIsUserOwned) {
    setTitle(suggestInterviewTitle(targetRole, nextLevel));
  }
}

function handleTitleChange(nextTitle: string) {
  setTitleIsUserOwned(true);
  setTitle(nextTitle);
}
```

Do not auto-regenerate a title after the user manually clears it.

- [ ] **Step 3: Replace Target role and Experience free text controls**

- Target role → `InterviewRoleSelector`.
- Experience level → native `<select>` populated from `INTERVIEW_EXPERIENCE_LEVELS`.
- Preserve existing field IDs/error mapping where practical so validation-summary anchor/focus behavior remains stable.

- [ ] **Step 4: Replace raw tag inputs with role-aware suggested controls**

Compute:

```ts
const roleSuggestions = getInterviewRoleSuggestions(targetRole);
```

Then feed `roleSuggestions.focusTopics` and `roleSuggestions.skillGaps` into two `InterviewSuggestedTagInput` controls. Do not reset `focusTopics` or `skillGaps` when `targetRole` changes.

- [ ] **Step 5: Clean required/optional copy**

Insert one form-level note near the top of the body:

```text
Required: Session title, Target role, Experience level and Practice mode.
```

Remove visible `(required)` spans from required labels. Keep actual HTML/accessibility validation. Change visible optional labels to the approved `· Optional` form while preserving the existing job-description collapsed details behavior.

- [ ] **Step 6: Preserve submit canonicalization**

Continue sending trimmed strings and arrays through the existing call:

```ts
createInterviewSession({
  title: title.trim(),
  targetRole: targetRole.trim(),
  experienceLevel: experienceLevel.trim(),
  focusTopics,
  skillGaps,
  ...(jobDescription.trim() ? { jobDescription: jobDescription.trim() } : {}),
  mode,
}, signal)
```

No API/backend edit is allowed.

- [ ] **Step 7: Commit the wizard integration**

Commit message:

```text
feat: refine interview creation wizard
```

---

### Task 5: Reset stale Exact distribution on Question count changes

**Files:**
- Modify: `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx`
- Modify: `frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx`

**Interfaces:**
- Existing props remain unchanged.

- [ ] **Step 1: Change the existing stale-count regression test to the approved behavior**

The current test named roughly `shows selected count inputs and a visible mismatch after Question count changes` must instead assert:

```ts
await user.click(screen.getByRole("button", { name: "Change question count" }));

expect(screen.getByLabelText("Distribution mode").textContent).toBe("implicit");
expect(screen.queryByRole("spinbutton")).toBeNull();
expect(screen.getByText("Balanced automatically")).not.toBeNull();
expect(screen.queryByText(/Exact counts · 4 of 5/)).toBeNull();
expect(screen.queryByText(/must equal Question count 5/i)).toBeNull();
expect(screen.getByText("Question count changed. Distribution reset to balanced.")).not.toBeNull();
expect(screen.getByLabelText("Selected order").textContent).toBe("short-answer,coding");
```

Also test that changing count while already Balanced does not create the reset announcement.

- [ ] **Step 2: Implement previous-count tracking inside the control**

Use `useRef(count)` to remember the previous count and `useEffect` to react only to a real count change. If `explicitCounts !== undefined` when count changes:

```ts
onExplicitCountsChange(undefined);
setCountsOpen(false);
setDistributionNotice(
  "Question count changed. Distribution reset to balanced.",
);
```

Always update the previous-count ref. Do not change selected Question Types.

- [ ] **Step 3: Render the reset message as a non-blocking polite status**

Use a small `<p aria-live="polite">`/status treatment, not `role="alert"`, and do not reuse validation-error styling.

- [ ] **Step 4: Verify reopening Exact counts uses the new count**

Extend the test:

```ts
await user.click(screen.getByRole("button", { name: "Set exact counts" }));
expect(screen.getByRole("spinbutton", { name: "Short Answer count" })).toHaveValue(3);
expect(screen.getByRole("spinbutton", { name: "Coding count" })).toHaveValue(2);
expect(screen.getByText("Exact counts · 5 total")).not.toBeNull();
```

- [ ] **Step 5: Commit the distribution fix**

Commit message:

```text
fix: reset stale interview exact counts
```

---

### Task 6: Unify custom generation category selected state

**Files:**
- Modify: `frontend/src/features/interviews/InterviewCategorySelector.tsx`
- Modify: `frontend/src/features/interviews/InterviewCategorySelector.test.tsx`
- Modify: `frontend/src/features/interviews/interviewCategorySelector.css`
- Modify only if selectors require it: `frontend/src/features/interviews/InterviewSessionWorkspace.practiceExperience.test.tsx`

**Interfaces:**
- Existing `InterviewCategorySelectorProps` remains unchanged.
- Existing `categories: string[]` generation payload remains unchanged.

- [ ] **Step 1: Write/adjust failing category tests**

Prove:

1. after adding `API Security`, it renders as a `.interview-category-chip` button with `aria-pressed="true"`, not as a separate `value ×` tag;
2. the selected counter becomes 3 when two context suggestions plus one custom category are selected;
3. clicking the selected custom category removes it and decrements the count;
4. clicking a selected context category leaves that context suggestion rendered with `aria-pressed="false"`;
5. adding `mongodb` when `MongoDB` exists selects canonical `MongoDB` and does not create a duplicate;
6. zero categories selected remains valid.

- [ ] **Step 2: Render one shared chip surface**

When either context suggestions or selected custom categories exist, render one suggestions/chip container. Render context categories first, then selected custom categories. Both use:

```tsx
<button
  type="button"
  className="interview-category-chip"
  aria-pressed={true /* for custom selections */}
  onClick={() => removeCustom(category)}
>
  <span aria-hidden="true">✓</span>
  {category}
</button>
```

Context categories keep their existing `aria-pressed` toggle semantics. Custom categories disappear after deselection because they are not persistent suggestions.

- [ ] **Step 3: Delete the weaker custom-chip CSS rules**

Remove `.interview-category-selector__custom-list`, `.interview-category-selector__custom-chip`, and its nested remove-button treatment if no longer used. Reuse `.interview-category-chip` focus/disabled styling for both origins.

- [ ] **Step 4: Keep generation payload tests unchanged semantically**

`InterviewSessionWorkspace.practiceExperience.test.tsx` must still prove the user's final selected array is sent exactly through `categories`. Only query/assertion mechanics may change to match the unified chip presentation.

- [ ] **Step 5: Commit the category refinement**

Commit message:

```text
fix: unify interview category selection state
```

---

### Task 7: Focused regression and integration review

**Files:**
- Test-only edits only if a legitimate stale expectation is exposed by the approved UI changes.
- No unrelated production refactors.

- [ ] **Step 1: Review the branch diff against the approved spec**

Confirm the implementation changed only the planned Interview frontend surface plus new focused helper/component/test/style files. Specifically verify there are no backend/Gemini/provider changes in this refinement batch.

- [ ] **Step 2: Prepare the focused verification command**

The user runs:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/interviewRoleGuidance.test.ts \
  src/features/interviews/InterviewRoleSelector.test.tsx \
  src/features/interviews/InterviewSuggestedTagInput.test.tsx \
  src/features/interviews/InterviewCreateDialog.test.tsx \
  src/features/interviews/InterviewQuestionTypeControls.test.tsx \
  src/features/interviews/InterviewCategorySelector.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.practiceExperience.test.tsx

npm run typecheck --workspace @career-learning-hub/web

git diff --check origin/phase-19b-interview-coach-refinements...HEAD
```

Expected: all focused tests PASS, typecheck PASS, diff check no output.

- [ ] **Step 3: If focused verification is green, prepare the full gate**

```bash
npm run test --workspace @career-learning-hub/api
npm run test --workspace @career-learning-hub/web
npm run build --workspace @career-learning-hub/api
npm run build --workspace @career-learning-hub/web
git diff --check origin/phase-19b-interview-coach-refinements...HEAD
git status --short
```

Expected: all tests/builds PASS, diff check no output, clean working tree.

- [ ] **Step 4: Browser QA after automated GREEN only**

Human browser acceptance must verify:

1. Create Interview desktop/intermediate/mobile layout remains usable;
2. common role shortcuts + search/custom fallback work;
3. Experience options are correct;
4. smart title updates then becomes user-owned after manual edit;
5. role-aware topics/gaps start unselected, can be selected/customized, and survive role changes;
6. repeated `(required)` noise is gone and optional labels are clear;
7. changing Question count during Exact mode immediately returns to Balanced with no `10 of 6` stale state;
8. custom generation categories look exactly like selected context categories and can be toggled off;
9. a fresh Coding question still shows generated Starter code, Copy, and safe Insert behavior.

- [ ] **Step 5: Update PR #13 description before final review**

The PR body must stop claiming there are no schema/Gemini changes in the whole Task 7R branch. It must accurately summarize the already-approved Coding `starterCode` storage/generation extension plus these final frontend wizard/briefing refinements, while still stating no code execution, extra provider call, deployment, or `main` change.

- [ ] **Step 6: Stop before merge**

Do not mark ready/merge until focused + full automated verification, browser QA, final review, and explicit user merge approval are all complete.
