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
- Implementation uses GitHub connector writes. The assistant cannot execute the repository test suite locally through this connector. Following the user's established streamlined workflow, focused tests are written before production changes in each task, then the user runs the GREEN verification gate after the implementation batch. Do not claim a RED or GREEN run that was not actually observed.
- Browser QA is required only after automated verification is green.

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

- `frontend/src/features/interviews/InterviewCreateDialog.tsx`
- `frontend/src/features/interviews/InterviewCreateDialog.test.tsx`
- `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx`
- `frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx`
- `frontend/src/features/interviews/InterviewCategorySelector.tsx`
- `frontend/src/features/interviews/InterviewCategorySelector.test.tsx`
- `frontend/src/features/interviews/interviewCategorySelector.css`
- `frontend/src/features/interviews/InterviewSessionWorkspace.practiceExperience.test.tsx` only if unified category selectors require assertion updates.

---

### Task 1: Local role guidance and smart-title helpers

**Files:**
- Create: `frontend/src/features/interviews/interviewRoleGuidance.ts`
- Create: `frontend/src/features/interviews/interviewRoleGuidance.test.ts`

**Interfaces:**

```ts
export type InterviewRoleFamily =
  | "software-engineer"
  | "frontend"
  | "backend"
  | "full-stack"
  | "mobile"
  | "devops-cloud"
  | "data"
  | "ml-ai"
  | "cybersecurity"
  | "qa-test";

export interface InterviewRoleGuidance {
  family: InterviewRoleFamily;
  label: string;
  focusTopics: readonly string[];
  skillGaps: readonly string[];
}

export const INTERVIEW_EXPERIENCE_LEVELS: readonly string[];
export const INTERVIEW_ROLE_OPTIONS: readonly InterviewRoleGuidance[];
export function matchInterviewRoleFamily(targetRole: string): InterviewRoleFamily;
export function getInterviewRoleSuggestions(targetRole: string): {
  focusTopics: readonly string[];
  skillGaps: readonly string[];
};
export function suggestInterviewTitle(
  targetRole: string,
  experienceLevel: string,
): string;
```

- [ ] **Step 1: Add the focused helper tests first**

Tests must assert the exact Experience options:

```ts
[
  "Intern / Student",
  "Entry-level",
  "Junior",
  "Mid-level",
  "Senior",
  "Lead / Staff",
  "Manager",
]
```

They must also assert:

```ts
expect(matchInterviewRoleFamily("MERN Developer")).toBe("full-stack");
expect(matchInterviewRoleFamily("React Native Engineer")).toBe("mobile");
expect(matchInterviewRoleFamily("LLM Engineer")).toBe("ml-ai");
expect(matchInterviewRoleFamily("Cloud Platform Engineer")).toBe("devops-cloud");
expect(matchInterviewRoleFamily("Penetration Tester")).toBe("cybersecurity");
expect(matchInterviewRoleFamily("Unusual Internal Tools Specialist")).toBe(
  "software-engineer",
);
expect(suggestInterviewTitle("Backend Developer", "Mid-level")).toBe(
  "Mid-level Backend Developer Interview",
);
expect(suggestInterviewTitle("", "Mid-level")).toBe("");
```

Every built-in role must have non-empty, duplicate-free Focus topic and Skill gap arrays.

- [ ] **Step 2: Implement the exact built-in role set**

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

Use these Focus topic catalogs:

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

- [ ] **Step 3: Implement deterministic custom-role family matching**

Normalize case/whitespace and apply specific-first keyword groups:

```text
mern | full stack | full-stack                         -> full-stack
react native | ios | android | mobile                 -> mobile
llm | machine learning | ml engineer | ai engineer    -> ml-ai
devops | cloud | platform engineer | sre              -> devops-cloud
penetration | cyber | security                         -> cybersecurity
data engineer | etl | warehouse                        -> data
frontend | front-end | react developer                 -> frontend
backend | back-end | api developer                     -> backend
qa | test engineer | quality assurance                 -> qa-test
otherwise                                               -> software-engineer
```

- [ ] **Step 4: Implement deterministic title formatting**

```ts
export function suggestInterviewTitle(role: string, level: string): string {
  const cleanRole = role.trim();
  const cleanLevel = level.trim();
  if (!cleanRole || !cleanLevel) return "";
  return `${cleanLevel} ${cleanRole} Interview`;
}
```

- [ ] **Step 5: Commit**

```text
feat: add local interview role guidance
```

---

### Task 2: Searchable Target role selector

**Files:**
- Create: `frontend/src/features/interviews/InterviewRoleSelector.tsx`
- Create: `frontend/src/features/interviews/InterviewRoleSelector.test.tsx`
- Create: `frontend/src/features/interviews/interviewCreateGuidance.css`

**Interfaces:**

```ts
export interface InterviewRoleSelectorProps {
  value: string;
  disabled?: boolean;
  error?: string;
  onChange(next: string): void;
}
```

- [ ] **Step 1: Add selector tests first**

Prove:

1. all ten common-role shortcut buttons are visible;
2. typing `backend` filters the result list to Backend Developer;
3. clicking Backend Developer calls `onChange("Backend Developer")`;
4. typing `Solutions Architect` exposes `Use “Solutions Architect”`;
5. clicking that action adopts the custom role;
6. only one authoritative role value exists at a time;
7. the search input has accessible name `Target role`, `role="combobox"`, `aria-autocomplete="list"`, `aria-controls`, and meaningful expanded state;
8. Enter selects an exact built-in match; non-matching custom text requires the explicit Use action;
9. disabled state disables shortcuts, search, and custom adoption.

- [ ] **Step 2: Implement a controlled role selector without a new dependency**

The authoritative selected role is `props.value`. Internal state is limited to search draft/open state. Keep the result set bounded to the ten local roles.

Interaction:

```text
Target role
Common roles
[Software Engineer] [Frontend Developer] ...
Search or enter another role
[search input]
(filtered built-in results)
[Use “custom text”] when there is no exact built-in match
```

- [ ] **Step 3: Add focused responsive CSS**

`interviewCreateGuidance.css` must cover wrapping shortcut chips/cards, clear `aria-pressed="true"` selection, full-width search field, bounded result surface, existing focus-ring conventions, and mobile stacking below approximately 560px.

- [ ] **Step 4: Commit**

```text
feat: add guided interview role selector
```

---

### Task 3: Suggested Focus topic and Skill gap selector

**Files:**
- Create: `frontend/src/features/interviews/InterviewSuggestedTagInput.tsx`
- Create: `frontend/src/features/interviews/InterviewSuggestedTagInput.test.tsx`
- Modify: `frontend/src/features/interviews/interviewCreateGuidance.css`
- Reuse from `InterviewTagInput.tsx`: `INTERVIEW_TAG_MAX_ITEMS`, `INTERVIEW_TAG_MAX_LENGTH`, `mergeInterviewTags`.

**Interfaces:**

```ts
export interface InterviewSuggestedTagInputProps {
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

- [ ] **Step 1: Add focused tests first**

Prove suggestions start with `aria-pressed="false"`; clicking selects/deselects; custom text added by Enter or Add appears with the same selected-chip treatment; clicking selected custom values removes them; changing suggestion sets preserves prior selected values; max 50 / max 120 constraints reuse current messages; empty selection is valid; duplicate values do not render twice.

- [ ] **Step 2: Implement as a focused component, not a rewrite of `InterviewTagInput`**

Build visible choices as current suggestions plus selected values not present in the current suggestion list:

```ts
const visible = [
  ...suggestions,
  ...values.filter((value) => !suggestions.includes(value)),
];
```

Each visible choice is one toggle button with `aria-pressed={values.includes(value)}`. Suggested-but-unselected values remain visible. Selected custom/retained values disappear after explicit deselection only when they are not in the current suggestion catalog.

- [ ] **Step 3: Keep custom entry safe inside the outer dialog form**

Never render a nested `<form>`. Use a control group plus `type="button"` Add action. Enter/comma commits locally with `preventDefault()` so it cannot submit the outer Create Interview form.

- [ ] **Step 4: Commit**

```text
feat: add guided interview topic selectors
```

---

### Task 4: Integrate the Create Interview wizard

**Files:**
- Modify: `frontend/src/features/interviews/InterviewCreateDialog.tsx`
- Modify: `frontend/src/features/interviews/InterviewCreateDialog.test.tsx`
- Modify: `frontend/src/features/interviews/interviewCreateGuidance.css`

**Consumes:** `InterviewRoleSelector`, `InterviewSuggestedTagInput`, `INTERVIEW_EXPERIENCE_LEVELS`, `getInterviewRoleSuggestions`, `suggestInterviewTitle`.

**Produces:** unchanged `createInterviewSession(...)` payload.

- [ ] **Step 1: Update dialog tests first**

Add/adjust tests for:

- Experience is a select with exactly seven options and defaults to Mid-level;
- selecting Backend Developer while title is untouched creates `Mid-level Backend Developer Interview`;
- changing Experience to Senior before title ownership creates `Senior Backend Developer Interview`;
- manually editing or clearing title prevents later role/level overwrites;
- Backend role exposes Backend topic/gap suggestions, all initially unselected;
- selecting REST APIs/System Design reaches outgoing arrays;
- changing role to ML / AI Engineer updates suggestions but preserves prior selections;
- custom `LLM Engineer` receives ML/AI suggestions via local family matching;
- Focus topics and Skill gaps may both remain empty;
- custom topic/gap values still obey existing bounds and submit through existing arrays;
- visible `(required)` strings are absent;
- one note reads `Required: Session title, Target role, Experience level and Practice mode.`;
- labels use `Focus topics · Optional`, `Skill gaps · Optional`, `Additional context · Optional`;
- existing Cancel/Escape/reset/focus, pending-submit lock, request-ID error, validation summary, and `onCreated` behavior remain green.

- [ ] **Step 2: Add smart-title ownership state**

Use `titleIsUserOwned` initialized/reset to `false`.

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

Manual clearing counts as ownership; never regenerate afterward unless the whole form is reset.

- [ ] **Step 3: Replace Target role and Experience free text controls**

Target role becomes `InterviewRoleSelector`. Experience becomes a native `<select>` populated from `INTERVIEW_EXPERIENCE_LEVELS`. Preserve existing error IDs/focus anchors where practical.

- [ ] **Step 4: Add role-aware optional topic/gap controls**

```ts
const roleSuggestions = getInterviewRoleSuggestions(targetRole);
```

Feed `roleSuggestions.focusTopics` / `skillGaps` into the new suggested tag controls. Never clear selected arrays when role changes.

- [ ] **Step 5: Clean required/optional copy without weakening semantics**

Add the one form-level note. Remove visible `(required)` spans. Keep `required`, validation functions, `aria-invalid`, validation summary, focus-to-error behavior, and dialog focus management. Use the approved `· Optional` copy.

- [ ] **Step 6: Preserve the exact existing API contract**

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

No backend edit.

- [ ] **Step 7: Commit**

```text
feat: refine interview creation wizard
```

---

### Task 5: Reset stale Exact distribution when Question count changes

**Files:**
- Modify: `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx`
- Modify: `frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx`

**Interfaces:** Existing props remain unchanged.

- [ ] **Step 1: Replace the current stale-mismatch test with the approved reset behavior**

After entering Exact mode and changing count, assert:

```ts
expect(screen.getByLabelText("Distribution mode").textContent).toBe("implicit");
expect(screen.queryByRole("spinbutton")).toBeNull();
expect(screen.getByText("Balanced automatically")).not.toBeNull();
expect(screen.queryByText(/Exact counts · 4 of 5/)).toBeNull();
expect(screen.queryByText(/must equal Question count 5/i)).toBeNull();
expect(
  screen.getByText("Question count changed. Distribution reset to balanced."),
).not.toBeNull();
expect(screen.getByLabelText("Selected order").textContent).toBe(
  "short-answer,coding",
);
```

Also prove a count change while already Balanced does not announce a reset.

- [ ] **Step 2: Implement previous-count tracking**

Use `useRef(count)` and `useEffect`. On a real count change, if `explicitCounts !== undefined`:

```ts
onExplicitCountsChange(undefined);
setCountsOpen(false);
setDistributionNotice(
  "Question count changed. Distribution reset to balanced.",
);
```

Always update the previous-count ref. Never change selected Question Types.

- [ ] **Step 3: Define notice lifecycle explicitly**

Render the reset notice as a non-blocking `aria-live="polite"` status, not `role="alert"`. Clear `distributionNotice` when the user explicitly opens Exact counts again or explicitly chooses Balanced distribution, so a previous automatic-reset message cannot linger during a later distribution choice.

- [ ] **Step 4: Prove reopening Exact mode uses the new count**

For count 5 with Short Answer + Coding, reopening Exact must start at 3 / 2 and show `Exact counts · 5 total`.

- [ ] **Step 5: Commit**

```text
fix: reset stale interview exact counts
```

---

### Task 6: Unify custom generation category selected state

**Files:**
- Modify: `frontend/src/features/interviews/InterviewCategorySelector.tsx`
- Modify: `frontend/src/features/interviews/InterviewCategorySelector.test.tsx`
- Modify: `frontend/src/features/interviews/interviewCategorySelector.css`
- Modify only if query mechanics require it: `frontend/src/features/interviews/InterviewSessionWorkspace.practiceExperience.test.tsx`

**Interfaces:** Existing selector props and `categories: string[]` payload remain unchanged.

- [ ] **Step 1: Add/adjust category tests first**

Prove:

- after adding `API Security`, it is a `.interview-category-chip` button with `aria-pressed="true"`, not a separate `value ×` tag;
- selected counter reflects two context categories + one custom as 3;
- clicking selected custom removes it and decrements the counter;
- clicking selected context leaves the suggestion visible with `aria-pressed="false"`;
- entering `mongodb` when `MongoDB` exists selects canonical `MongoDB` without duplicate;
- zero categories selected remains valid.

- [ ] **Step 2: Render one shared chip surface**

Render context suggestions first and selected custom categories after them. Both use `.interview-category-chip`. Custom selections are always pressed and clicking them calls `removeCustom(category)`. Context categories retain their existing pressed toggle behavior.

- [ ] **Step 3: Remove the weaker custom-chip CSS path**

Delete unused `.interview-category-selector__custom-list`, `.interview-category-selector__custom-chip`, and nested remove-button styling. Reuse the existing category-chip focus/disabled styles.

- [ ] **Step 4: Preserve generation payload semantics**

`InterviewSessionWorkspace.practiceExperience.test.tsx` must continue proving that final user selection reaches `generateInterviewQuestions(... categories: string[])`. Only UI queries may change.

- [ ] **Step 5: Commit**

```text
fix: unify interview category selection state
```

---

### Task 7: Verification, browser acceptance, and PR accuracy

**Production changes:** None unless a verification failure reveals a root cause inside this approved scope.

- [ ] **Step 1: Review the implementation diff**

Verify this refinement batch contains only the planned Interview frontend helpers/components/tests/styles and no backend/Gemini/provider modifications.

- [ ] **Step 2: User runs the focused GREEN gate**

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

- [ ] **Step 3: If focused GREEN, user runs full regression/build gate**

```bash
npm run test --workspace @career-learning-hub/api
npm run test --workspace @career-learning-hub/web
npm run build --workspace @career-learning-hub/api
npm run build --workspace @career-learning-hub/web
git diff --check origin/phase-19b-interview-coach-refinements...HEAD
git status --short
```

Expected: all tests/builds PASS, diff check no output, clean working tree.

- [ ] **Step 4: Browser QA only after automated GREEN**

Verify desktop/intermediate/mobile Create Interview layout; common role shortcuts/search/custom fallback; exact Experience options; smart-title ownership; role-aware optional suggestions and preserved selections; clean required/optional copy; Exact-count automatic reset; unified custom category selection; and fresh Coding starter-code Copy/Insert behavior.

- [ ] **Step 5: Update PR #13 description before final review**

Correct the stale PR body so it accurately includes the already-approved Coding `starterCode` storage/generation extension and these wizard/briefing refinements. Keep explicit statements that there is no code execution, extra provider call, deployment, or `main` change.

- [ ] **Step 6: Stop before merge**

Do not mark ready or merge until focused + full automated verification, browser QA, final review, and explicit user merge approval are complete.
