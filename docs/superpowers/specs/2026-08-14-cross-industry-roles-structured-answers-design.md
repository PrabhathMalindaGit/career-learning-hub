# Cross-Industry Interview Roles and Structured Answers — Design Spec

**Project:** Career Learning Hub  
**Phase:** 19B-3 / Task 7R extension  
**Branch:** `task/phase-19b3-task7r-interview-layout-refinement`  
**PR:** #13  
**Status:** Design approved; implementation not yet authorized

## 1. Goal

Extend the Interview Coach so that Career Learning Hub supports a broad cross-industry interview workflow instead of presenting technology roles as the default universe, and make Behavioral, Scenario-Based, and Technical Explanation answers genuinely structured in the frontend while preserving the existing backend attempt contract.

The implementation must remain the smallest secure and functional solution suitable for a university project. Reuse existing architecture and contracts. Do not add enterprise-grade complexity unless required for correctness or security.

## 2. Non-goals

This refinement does **not** introduce:

- a new backend Interview session schema;
- a new attempt schema;
- a new API endpoint;
- a database migration;
- a new Gemini/provider call;
- a new worker/job type;
- a remote occupation taxonomy service;
- embeddings or semantic role search;
- separate AI evaluation jobs for answer subsections;
- code execution, compilation, sandboxing, or editor dependencies;
- deployment;
- merging to `main`;
- Task 8 closeout.

## 3. Career-area model

### 3.1 Approved career areas

Use exactly these fourteen broad career areas:

1. Technology & IT
2. Business & Management
3. Finance & Accounting
4. Marketing & Sales
5. Human Resources
6. Healthcare
7. Engineering
8. Education & Training
9. Law & Legal Services
10. Design & Creative
11. Operations & Supply Chain
12. Customer Service & Hospitality
13. Science & Research
14. Public Service & Administration

Also expose **Other / Custom** as a utility selection for unusual careers. It is not treated as a fifteenth career area in the canonical career-area catalog.

### 3.2 Representative role catalog

Each career area has a bounded local representative role list. The role list exists to accelerate selection, not to claim exhaustive occupational coverage.

#### Technology & IT

- Software Engineer
- Frontend Developer
- Backend Developer
- Full-Stack Developer
- Mobile Developer
- DevOps / Cloud Engineer
- Data Engineer
- ML / AI Engineer
- Cybersecurity Engineer
- QA / Test Engineer
- Systems Administrator
- IT Support Specialist

#### Business & Management

- Business Analyst
- Project Manager
- Product Manager
- Operations Manager
- Management Consultant
- Strategy Analyst
- Business Development Manager
- General Manager

#### Finance & Accounting

- Accountant
- Auditor
- Financial Analyst
- Management Accountant
- Tax Associate
- Banking Officer
- Investment Analyst
- Risk Analyst

#### Marketing & Sales

- Marketing Executive
- Digital Marketing Specialist
- Brand Manager
- Content Marketer
- SEO Specialist
- Sales Executive
- Account Manager
- Sales Manager

#### Human Resources

- HR Executive
- Recruiter / Talent Acquisition Specialist
- HR Business Partner
- Learning & Development Specialist
- Compensation & Benefits Specialist
- Employee Relations Specialist
- People Operations Specialist
- HR Manager

#### Healthcare

- Nurse
- Medical Officer / Doctor
- Pharmacist
- Physiotherapist
- Medical Laboratory Scientist
- Radiographer
- Public Health Officer
- Healthcare Administrator

#### Engineering

- Civil Engineer
- Mechanical Engineer
- Electrical Engineer
- Electronics Engineer
- Chemical Engineer
- Industrial Engineer
- Mechatronics Engineer
- Environmental Engineer
- Biomedical Engineer

#### Education & Training

- Teacher
- Lecturer
- Tutor
- Academic Advisor
- Instructional Designer
- Curriculum Developer
- Training Coordinator
- Education Administrator

#### Law & Legal Services

- Lawyer / Attorney
- Legal Counsel
- Paralegal
- Legal Assistant
- Compliance Officer
- Contract Specialist
- Legal Researcher
- Company Secretary

#### Design & Creative

- Graphic Designer
- UI / UX Designer
- Product Designer
- Video Editor
- Animator / Motion Designer
- Photographer
- Copywriter
- Content Creator

#### Operations & Supply Chain

- Supply Chain Analyst
- Procurement Officer
- Logistics Coordinator
- Inventory Planner
- Warehouse Manager
- Operations Analyst
- Demand Planner
- Quality Officer

#### Customer Service & Hospitality

- Customer Service Representative
- Customer Success Specialist
- Call Center Agent
- Hotel Front Office Executive
- Guest Relations Officer
- Restaurant Supervisor
- Travel Consultant
- Event Coordinator

#### Science & Research

- Research Assistant
- Research Scientist
- Laboratory Technician
- Biologist
- Chemist
- Physicist
- Environmental Scientist
- Clinical Research Coordinator

#### Public Service & Administration

- Administrative Officer
- Government Officer
- Policy Analyst
- Program Officer
- Community Development Officer
- Public Relations Officer
- Office Manager
- Executive Assistant

## 4. Create Interview interaction

### 4.1 Career area

Add a single-select Career area control above Target role.

The recommended control is a native/select-style single choice rather than fourteen visible area chips because the modal is already vertically dense.

Default behavior:

- no career area is silently inferred before the user makes a choice;
- existing required-field semantics remain accessible;
- `Other / Custom` is available as the escape hatch for unusual careers.

### 4.2 Target role

After selecting a career area:

- show approximately 6–12 representative role shortcuts from that area;
- retain a searchable Target-role combobox;
- allow explicit custom-role adoption;
- only one Target role can be selected;
- the final selected/custom value continues to populate the existing `targetRole: string` field.

The UI should therefore communicate:

```text
Career area
[ Finance & Accounting ]

Suggested roles
[ Accountant ] [ Auditor ] [ Financial Analyst ] ...

Search or enter another role
[ Search or type a custom role… ]
```

Do not add a remote role lookup dependency.

### 4.3 Custom role behavior

If a user chooses a normal career area and enters a custom role, that selected career area remains the context for local Focus-topic and Skill-gap suggestions.

Example:

```text
Career area: Healthcare
Custom role: Occupational Therapist
```

Use Healthcare guidance.

If the user chooses `Other / Custom`, use a small generic professional-interview guidance set rather than incorrectly falling back to Software Engineering.

### 4.4 Existing title behavior

Preserve the approved smart title behavior:

- while the title is still system-owned, derive it from Experience level + Target role;
- once the user edits the title manually, never overwrite it because of later Career area, role, or experience changes;
- clearing a manually owned title still counts as user ownership.

### 4.5 Existing Experience level behavior

Preserve the current approved values and default:

- Intern / Student
- Entry-level
- Junior
- Mid-level
- Senior
- Lead / Staff
- Manager

`Mid-level` remains the initial default.

## 5. Focus topics and Skill gaps

### 5.1 Guidance level

Suggestions are primarily maintained at **Career-area level**, not per individual role.

This is an intentional scope constraint. It avoids building and maintaining hundreds of role-specific taxonomies while still providing useful guided values.

### 5.2 Selection behavior

Preserve the existing approved behavior:

- suggestions start unselected;
- Focus topics are optional;
- Skill gaps are optional;
- users can add custom values;
- selected custom values use the same selected-chip visual language as suggested values;
- duplicate values are canonicalized case-insensitively;
- changing Career area or Target role updates available suggestions but does **not** silently delete any previously selected Focus topics or Skill gaps;
- empty selections remain valid.

### 5.3 Suggested guidance examples

Each career area should contain a bounded practical list, normally around eight Focus topics and eight Skill gaps.

Representative examples:

#### Finance & Accounting

Focus topics:

- Financial Reporting
- Accounting Principles
- Budgeting
- Financial Analysis
- Audit & Controls
- Taxation
- Risk Management
- Regulatory Compliance

Skill gaps:

- Financial Statement Analysis
- Excel / Financial Modelling
- Attention to Detail
- Risk Assessment
- Commercial Awareness
- Communication
- Compliance Knowledge
- Analytical Reasoning

#### Healthcare

Focus topics:

- Patient Care
- Clinical Communication
- Safety & Quality
- Documentation
- Ethics
- Teamwork
- Evidence-based Practice
- Service Improvement

Skill gaps:

- Clinical Reasoning
- Patient Communication
- Documentation Quality
- Time Management
- Safety Awareness
- Team Collaboration
- Ethical Decision-making
- Handling Pressure

#### Generic `Other / Custom`

Focus topics:

- Role Knowledge
- Communication
- Problem Solving
- Teamwork
- Customer / Stakeholder Needs
- Planning & Prioritization
- Professional Judgment
- Continuous Improvement

Skill gaps:

- Interview Communication
- Structured Problem Solving
- Confidence
- Prioritization
- Stakeholder Communication
- Decision-making
- Professional Examples
- Self-reflection

The implementation plan may define equivalent bounded catalogs for all fourteen areas as long as the wording remains practical, neutral, and career-appropriate.

## 6. Question-type answer experiences

The modern question types continue to have differentiated answer controls:

| Question type | Answer control |
| --- | --- |
| Multiple Choice | Existing clickable option cards |
| Short Answer | Existing concise single textarea |
| Coding | Existing Starter code + code textarea |
| Behavioral | New structured STAR fields |
| Scenario-Based | New structured reasoning fields |
| Technical Explanation | New structured explanation fields |
| Historical Open Response | Existing single textarea |

## 7. Behavioral structured answer

Replace the current one-textarea Behavioral answer UI with four vertically stacked text fields:

1. **Situation** — “Describe the context…”
2. **Task** — “What were you responsible for?”
3. **Action** — “What did you personally do?”
4. **Result** — “What happened? What was the impact?”

The old `Situation / Task / Action / Result` cue chips should be removed because the actual fields now provide the structure.

A short guidance sentence may remain, for example: “Use the STAR structure to keep your example clear and evidence-based.”

## 8. Scenario-Based structured answer

Replace the one-textarea Scenario-Based UI with four vertically stacked fields:

1. **Assessment** — “What is happening and what matters most?”
2. **Approach** — “What would you do?”
3. **Trade-offs** — “What risks, alternatives, or constraints would you consider?”
4. **Decision** — “What would you ultimately choose and why?”

Remove the redundant `Assess / Approach / Trade-offs / Decision` cue chips.

## 9. Technical Explanation structured answer

Replace the one-textarea Technical Explanation UI with four vertically stacked fields:

1. **Concept** — “Define the concept clearly…”
2. **How it works** — “Explain the mechanism or process…”
3. **Example** — “Give a practical example…”
4. **Trade-offs / limitations** — “Explain strengths, limitations, or alternatives…”

Remove the redundant `Concept / How it works / Example / Trade-offs` cue chips.

## 10. Validation semantics for structured answers

Do **not** require every subsection.

The whole answer is valid when:

- at least one structured subsection contains meaningful non-whitespace text; and
- the serialized combined answer is within the existing 12,000-character maximum.

This prevents artificial blocking when a question naturally does not require all four dimensions.

Use one combined character counter for the whole structured answer rather than separate independent 12,000-character limits per subsection.

## 11. Frontend state model

For Behavioral, Scenario-Based, and Technical Explanation, keep subsection values as frontend-only draft state associated with the currently selected question.

The implementation should avoid changing the backend answer type. Before submission, serialize the subsection values into the existing text answer string.

The draft-state solution must preserve the current stale-route/stale-selection safety behavior. Switching questions must not leak structured draft values from one question into another.

Do not create a large new global state framework; reuse the smallest existing component/workspace state pattern that can safely isolate per-question drafts.

## 12. Serialization format

Serialize only non-empty subsections in stable display order.

### Behavioral

```text
Situation:
...

Task:
...

Action:
...

Result:
...
```

### Scenario-Based

```text
Assessment:
...

Approach:
...

Trade-offs:
...

Decision:
...
```

### Technical Explanation

```text
Concept:
...

How it works:
...

Example:
...

Trade-offs / limitations:
...
```

Rules:

- trim subsection edges before serialization;
- omit empty subsections completely;
- separate included sections with exactly one blank line;
- preserve user-entered line breaks inside a subsection;
- the resulting string is the canonical attempt answer sent through the existing API.

## 13. Existing attempt/backend contract

Preserve the existing typed attempt contract and storage path.

Do not add structured JSON answer fields to the API or database.

Conceptually, the frontend still submits the same text answer used today, for example:

```text
{ type: "behavioral", text: "Situation:\n...\n\nAction:\n..." }
```

The backend, persistence layer, Gemini feedback flow, and Saved Attempts continue to receive ordinary text.

## 14. Saved Attempts and historical compatibility

New structured answers are stored as ordinary text with headings and line breaks.

Saved Attempts should preserve those line breaks so the headings remain readable.

Do not build a fragile parser that attempts to convert stored text back into structured JSON.

Historical attempts without headings continue to display exactly as ordinary saved text.

Historical questions and the `legacy-open-response` compatibility path remain unchanged.

## 15. AI feedback and explanations

Do not change Gemini/provider behavior.

The existing backend receives the serialized answer string and may generate feedback using the current single answer path.

Do not:

- make one Gemini request per subsection;
- score subsections separately;
- add structured AI feedback persistence;
- change polling, retry, cancellation, UUID/idempotency, lease, or worker semantics.

## 16. Accessibility and responsive behavior

The new controls must preserve or improve existing accessibility:

- Career area has a proper accessible label;
- Target role combobox semantics remain intact;
- selected role shortcuts use accessible pressed/selected state;
- Focus-topic and Skill-gap chips retain `aria-pressed` semantics;
- each structured subsection has a real associated label;
- validation/errors are connected through existing accessible error patterns;
- the combined character counter is announced/described consistently with the current answer control;
- structured answer fields render in one vertical column at all breakpoints;
- no nested forms;
- keyboard interaction remains usable without a mouse.

## 17. Security and privacy constraints

This refinement does not alter authorization or ownership behavior.

Preserve:

- authenticated session ownership enforcement;
- existing API validation;
- MCQ pre-submit answer-key secrecy;
- deterministic backend MCQ scoring;
- no MCQ AI-feedback action;
- Coding answers remain text-only and are never executed;
- no external role-taxonomy service receives user data;
- no new provider request is made simply to populate form suggestions.

## 18. Testing requirements

Add focused tests for at least the following.

### Career-area / role guidance

- all fourteen canonical career areas are present in stable order;
- Technology retains the existing representative roles;
- representative non-technology areas expose appropriate roles;
- switching areas changes visible role shortcuts;
- custom role under a selected career area uses that area’s guidance;
- `Other / Custom` uses generic professional guidance, not Software Engineering;
- existing selected Focus topics / Skill gaps survive career-area and role changes;
- suggestions start unselected;
- custom values still canonicalize/dedupe.

### Create Interview integration

- Career area is selectable;
- Target role remains searchable/customizable;
- selected role still populates the existing create-session payload;
- smart title ownership behavior remains intact;
- Experience level behavior remains intact;
- Focus topics / Skill gaps remain optional;
- existing cancellation, validation-focus, duplicate-submit, request-ID, and pending-draft protections continue to pass.

### Structured answers

For each of Behavioral, Scenario-Based, and Technical Explanation:

- correct subsection labels render;
- old cue-chip-only presentation is removed;
- subsection drafts update independently;
- empty subsections are omitted during serialization;
- stable heading order is preserved;
- at least one non-empty subsection is required before Save attempt enables;
- combined length respects the 12,000-character limit;
- serialized text is passed through the existing typed answer contract;
- question switching does not leak subsection draft state;
- Saved Attempts display serialized newlines legibly;
- historical plain-text attempts remain compatible.

### Regression

Retain existing focused coverage for:

- Multiple Choice answer UX;
- Short Answer UX;
- Coding Starter code UX;
- category selection;
- exact-count reset behavior;
- workspace route-loading/stale-selection behavior.

## 19. Verification gate

After implementation, verification order is:

1. focused new role/catalog tests;
2. focused Create Interview tests;
3. focused structured-answer tests;
4. existing Task 7R focused Interview tests;
5. frontend typecheck;
6. user local focused verification;
7. browser QA for the cross-industry wizard and all three structured answer types;
8. full backend regression;
9. full frontend regression;
10. backend production build;
11. frontend production build;
12. `git diff --check`;
13. clean working tree;
14. final PR review;
15. explicit user merge approval.

Do not merge before all required verification is green and the user separately authorizes the merge.

## 20. PR governance

Continue using PR #13 and base branch `phase-19b-interview-coach-refinements`.

Before final review, update the PR description so it no longer incorrectly describes Task 7R as presentation-only/no-schema/Gemini refinement. The final PR body must accurately mention:

- the already-added optional Coding starter-code schema/persistence extension;
- Gemini question-generation schema/prompt support for Coding starter code;
- guided Create Interview wizard;
- cross-industry career-area/role guidance;
- structured frontend answer entry for Behavioral, Scenario-Based, and Technical Explanation;
- unchanged attempt API/storage contract for those structured answers;
- no code execution;
- no extra provider call for role/topic suggestions;
- no deployment;
- explicit merge approval requirement.

## 21. Acceptance criteria

The refinement is acceptable when all of the following are true:

- Career Learning Hub no longer presents Computer Science roles as the only guided career universe;
- all fourteen approved career areas are available;
- each area exposes bounded representative roles;
- custom roles remain possible everywhere;
- `Other / Custom` does not fall back to Software Engineering guidance;
- Focus-topic and Skill-gap suggestions are career-appropriate and local;
- role/area changes never silently delete existing user selections;
- Behavioral uses Situation / Task / Action / Result fields;
- Scenario-Based uses Assessment / Approach / Trade-offs / Decision fields;
- Technical Explanation uses Concept / How it works / Example / Trade-offs or limitations fields;
- only one structured subsection needs meaningful text;
- combined answer length stays within the existing 12,000-character limit;
- structured answers serialize into the existing text attempt contract;
- backend/API/database/Gemini feedback architecture remains unchanged for structured answers;
- historical attempts remain readable;
- Multiple Choice, Short Answer, Coding, and historical Open Response remain behaviorally compatible;
- focused tests, typecheck, full regressions, builds, diff check, browser QA, and final review are green;
- PR #13 remains unmerged until explicit user merge approval.
