# Cross-Industry Interview Roles and Structured Answers — Design Spec

**Project:** Career Learning Hub
**Phase:** 19B-3 / Task 7R extension
**Branch:** `task/phase-19b3-task7r-interview-layout-refinement`
**PR:** #13
**Status:** Design approved; written spec awaiting user approval

## 1. Goal

Extend the Interview Coach so Career Learning Hub supports guided interview preparation across multiple industries rather than presenting technology roles as the default career universe, and make Behavioral, Scenario-Based, and Technical Explanation answers genuinely structured in the frontend while preserving the existing backend attempt contract.

Build the smallest secure and functional solution suitable for a university project. Reuse existing architecture and contracts. Do not add enterprise-grade complexity unless required for correctness or security.

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

### 3.1 Canonical career areas

Use exactly these fourteen canonical career areas, in this order:

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

Also expose **Other / Custom** as a utility selection for unusual careers. It is not part of the canonical fourteen-area catalog.

### 3.2 Career-area state is frontend-only

`careerArea` is a frontend authoring value used to choose representative roles and local Focus-topic / Skill-gap suggestions.

Do **not** add `careerArea` to the existing create-session API payload or backend session schema in this refinement.

The existing session payload remains conceptually:

```text
title
targetRole
experienceLevel
mode
focusTopics[]
skillGaps[]
jobDescription?
```

### 3.3 Career area is required and has no biased default

Career area is required in the Create Interview wizard.

- Initial state: no area selected.
- The control shows a neutral placeholder such as `Choose a career area`.
- Do not default to Technology & IT or any other area.
- Target-role shortcuts and area-specific suggestions remain unavailable until an area is selected.
- `Other / Custom` satisfies the Career-area requirement for unusual careers.

## 4. Representative role catalog

Each career area has a bounded local representative role list. The list accelerates selection; it is not an exhaustive occupational taxonomy.

### Technology & IT

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

### Business & Management

- Business Analyst
- Project Manager
- Product Manager
- Operations Manager
- Management Consultant
- Strategy Analyst
- Business Development Manager
- General Manager

### Finance & Accounting

- Accountant
- Auditor
- Financial Analyst
- Management Accountant
- Tax Associate
- Banking Officer
- Investment Analyst
- Risk Analyst

### Marketing & Sales

- Marketing Executive
- Digital Marketing Specialist
- Brand Manager
- Content Marketer
- SEO Specialist
- Sales Executive
- Account Manager
- Sales Manager

### Human Resources

- HR Executive
- Recruiter / Talent Acquisition Specialist
- HR Business Partner
- Learning & Development Specialist
- Compensation & Benefits Specialist
- Employee Relations Specialist
- People Operations Specialist
- HR Manager

### Healthcare

- Nurse
- Medical Officer / Doctor
- Pharmacist
- Physiotherapist
- Medical Laboratory Scientist
- Radiographer
- Public Health Officer
- Healthcare Administrator

### Engineering

- Civil Engineer
- Mechanical Engineer
- Electrical Engineer
- Electronics Engineer
- Chemical Engineer
- Industrial Engineer
- Mechatronics Engineer
- Environmental Engineer
- Biomedical Engineer

### Education & Training

- Teacher
- Lecturer
- Tutor
- Academic Advisor
- Instructional Designer
- Curriculum Developer
- Training Coordinator
- Education Administrator

### Law & Legal Services

- Lawyer / Attorney
- Legal Counsel
- Paralegal
- Legal Assistant
- Compliance Officer
- Contract Specialist
- Legal Researcher
- Company Secretary

### Design & Creative

- Graphic Designer
- UI / UX Designer
- Product Designer
- Video Editor
- Animator / Motion Designer
- Photographer
- Copywriter
- Content Creator

### Operations & Supply Chain

- Supply Chain Analyst
- Procurement Officer
- Logistics Coordinator
- Inventory Planner
- Warehouse Manager
- Operations Analyst
- Demand Planner
- Quality Officer

### Customer Service & Hospitality

- Customer Service Representative
- Customer Success Specialist
- Call Center Agent
- Hotel Front Office Executive
- Guest Relations Officer
- Restaurant Supervisor
- Travel Consultant
- Event Coordinator

### Science & Research

- Research Assistant
- Research Scientist
- Laboratory Technician
- Biologist
- Chemist
- Physicist
- Environmental Scientist
- Clinical Research Coordinator

### Public Service & Administration

- Administrative Officer
- Government Officer
- Policy Analyst
- Program Officer
- Community Development Officer
- Public Relations Officer
- Office Manager
- Executive Assistant

## 5. Create Interview interaction

### 5.1 Career area control

Use a compact single-select control above Target role rather than fourteen visible area chips.

The label is `Career area`.

### 5.2 Target role workflow

After a Career area is selected:

- show the representative roles for that area as visible shortcuts;
- retain the searchable Target-role combobox;
- allow explicit custom-role adoption;
- only one Target role can be selected;
- the final selected/custom value continues to populate the existing `targetRole: string` field.

Example:

```text
Career area
[ Finance & Accounting ▼ ]

Suggested roles
[ Accountant ] [ Auditor ] [ Financial Analyst ] ...

Search or enter another role
[ Search or type a custom role… ]
```

### 5.3 Role search is scoped to the selected area

The searchable list searches only the representative roles from the currently selected Career area.

Do not search a hidden global list across all fourteen areas because that could silently create a mismatch between Career-area guidance and the selected role.

If the user wants a role that is not in the selected area’s representative list, they can explicitly adopt it as a custom role.

### 5.4 Changing Career area

Changing Career area:

- updates the representative role shortcuts;
- clears the currently selected Target role because that single role belongs to the previous authoring context;
- does **not** clear a manually owned Session title;
- does **not** delete already selected Focus topics or Skill gaps;
- leaves Focus / Skill custom values untouched;
- updates the available unselected Focus / Skill suggestions to the new area.

If the title is still system-owned, clearing the Target role temporarily clears the smart title until a new role is selected.

### 5.5 Custom role behavior

If a user chooses a normal Career area and explicitly adopts a custom Target role, that selected Career area remains the source of Focus-topic and Skill-gap suggestions.

Example:

```text
Career area: Healthcare
Custom role: Occupational Therapist
```

Use Healthcare guidance.

If the user chooses `Other / Custom`, use the generic professional guidance catalog defined in Section 7.15 rather than falling back to Software Engineering.

### 5.6 Existing title behavior

Preserve the approved smart-title behavior:

- while the title is system-owned, derive it from Experience level + Target role;
- once the user edits the title manually, never overwrite it because of later Career area, role, or experience changes;
- clearing a manually owned title still counts as user ownership.

### 5.7 Existing Experience level behavior

Preserve these values and order:

- Intern / Student
- Entry-level
- Junior
- Mid-level
- Senior
- Lead / Staff
- Manager

`Mid-level` remains the initial default.

## 6. Focus topics and Skill gaps — common behavior

Suggestions are maintained at **Career-area level**, not per individual representative role.

This is an intentional scope constraint. It avoids maintaining hundreds of role-specific taxonomies while still giving useful guidance.

Preserve the existing approved selection behavior:

- suggestions start unselected;
- Focus topics are optional;
- Skill gaps are optional;
- users can add custom values;
- selected custom values use the same selected-chip visual language as suggested values;
- duplicates are canonicalized case-insensitively;
- changing Career area or Target role does **not** silently delete any already selected Focus topics or Skill gaps;
- empty selections remain valid.

## 7. Exact local guidance catalogs

Use the following exact bounded catalogs. Each canonical Career area has eight Focus topics and eight Skill gaps. `Other / Custom` has its own generic set.

### 7.1 Technology & IT

Focus topics:

- Software & Systems
- APIs & Integration
- Databases & Data
- Cloud & Infrastructure
- Security
- Testing & Quality
- Performance & Reliability
- Data & AI

Skill gaps:

- Problem Solving
- System Design
- Debugging
- Testing Strategy
- Security Awareness
- Performance Analysis
- Technical Communication
- Code Quality

### 7.2 Business & Management

Focus topics:

- Business Strategy
- Project Delivery
- Stakeholder Management
- Process Improvement
- Decision-making
- Leadership
- Business Analysis
- Change Management

Skill gaps:

- Strategic Thinking
- Prioritization
- Stakeholder Communication
- Leadership
- Commercial Awareness
- Conflict Resolution
- Presentation Skills
- Decision-making

### 7.3 Finance & Accounting

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

### 7.4 Marketing & Sales

Focus topics:

- Marketing Strategy
- Digital Marketing
- Brand Management
- Customer Segmentation
- Sales Process
- Campaign Analysis
- Content & Messaging
- Customer Relationships

Skill gaps:

- Persuasive Communication
- Customer Discovery
- Campaign Measurement
- Negotiation
- Presentation Skills
- CRM Discipline
- Market Analysis
- Objection Handling

### 7.5 Human Resources

Focus topics:

- Recruitment & Selection
- Employee Relations
- Performance Management
- Learning & Development
- HR Policy
- Workforce Planning
- Employee Experience
- Employment Compliance

Skill gaps:

- Difficult Conversations
- Interviewing
- Conflict Resolution
- HR Analytics
- Policy Interpretation
- Stakeholder Communication
- Coaching
- Confidentiality & Judgment

### 7.6 Healthcare

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

### 7.7 Engineering

Focus topics:

- Engineering Design
- Technical Analysis
- Safety & Standards
- Project Delivery
- Testing & Validation
- Quality Control
- Sustainability
- Technical Documentation

Skill gaps:

- Engineering Judgment
- Root-cause Analysis
- Technical Communication
- Safety Awareness
- Design Trade-offs
- Project Planning
- Quality Methods
- Cross-functional Collaboration

### 7.8 Education & Training

Focus topics:

- Teaching & Facilitation
- Lesson / Session Planning
- Assessment
- Learner Engagement
- Inclusive Practice
- Curriculum Design
- Feedback
- Education Technology

Skill gaps:

- Classroom / Group Management
- Differentiation
- Assessment Design
- Learner Communication
- Feedback Skills
- Facilitation Confidence
- Inclusive Teaching
- Time Management

### 7.9 Law & Legal Services

Focus topics:

- Legal Research
- Case / Matter Analysis
- Contracts
- Compliance
- Client Communication
- Legal Writing
- Risk & Ethics
- Negotiation

Skill gaps:

- Legal Reasoning
- Research Efficiency
- Drafting
- Client Communication
- Attention to Detail
- Negotiation
- Ethical Judgment
- Prioritization

### 7.10 Design & Creative

Focus topics:

- Design Process
- User / Audience Needs
- Visual Communication
- Creative Direction
- Portfolio Decisions
- Feedback & Iteration
- Brand Consistency
- Production Workflow

Skill gaps:

- Design Rationale
- Presenting Work
- Receiving Feedback
- Prioritization
- User Research
- Creative Problem Solving
- Production Efficiency
- Stakeholder Communication

### 7.11 Operations & Supply Chain

Focus topics:

- Supply Planning
- Procurement
- Logistics
- Inventory Management
- Process Improvement
- Quality
- Supplier Management
- Operational Risk

Skill gaps:

- Demand Planning
- Data Analysis
- Negotiation
- Process Mapping
- Risk Management
- Supplier Communication
- Inventory Control
- Continuous Improvement

### 7.12 Customer Service & Hospitality

Focus topics:

- Customer Experience
- Service Recovery
- Complaint Handling
- Communication
- Team Coordination
- Service Standards
- Upselling / Recommendations
- Operational Awareness

Skill gaps:

- De-escalation
- Active Listening
- Handling Pressure
- Customer Communication
- Problem Resolution
- Service Recovery
- Teamwork
- Professionalism

### 7.13 Science & Research

Focus topics:

- Research Methods
- Experimental Design
- Data Analysis
- Scientific Communication
- Literature Review
- Laboratory / Field Practice
- Research Ethics
- Reproducibility

Skill gaps:

- Experimental Reasoning
- Statistical Interpretation
- Scientific Writing
- Research Presentation
- Data Quality
- Critical Evaluation
- Documentation
- Research Planning

### 7.14 Public Service & Administration

Focus topics:

- Public / Administrative Service
- Policy & Procedures
- Stakeholder Communication
- Records & Documentation
- Program Delivery
- Governance
- Community / Citizen Needs
- Process Improvement

Skill gaps:

- Administrative Accuracy
- Policy Interpretation
- Written Communication
- Public Communication
- Prioritization
- Stakeholder Management
- Professional Judgment
- Service Orientation

### 7.15 Other / Custom

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

## 8. Question-type answer experiences

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

## 9. Behavioral structured answer

Replace the current one-textarea Behavioral UI with four vertically stacked text fields:

1. **Situation** — `Describe the context…`
2. **Task** — `What were you responsible for?`
3. **Action** — `What did you personally do?`
4. **Result** — `What happened? What was the impact?`

Remove the old `Situation / Task / Action / Result` cue chips because the real fields now provide the structure.

Keep one short guidance sentence: `Use the STAR structure to keep your example clear and evidence-based.`

## 10. Scenario-Based structured answer

Replace the one-textarea Scenario-Based UI with four vertically stacked fields:

1. **Assessment** — `What is happening and what matters most?`
2. **Approach** — `What would you do?`
3. **Trade-offs** — `What risks, alternatives, or constraints would you consider?`
4. **Decision** — `What would you ultimately choose and why?`

Remove the old `Assess / Approach / Trade-offs / Decision` cue chips.

Keep one short guidance sentence: `Structure your reasoning from assessment through the final decision.`

## 11. Technical Explanation structured answer

Replace the one-textarea Technical Explanation UI with four vertically stacked fields:

1. **Concept** — `Define the concept clearly…`
2. **How it works** — `Explain the mechanism or process…`
3. **Example** — `Give a practical example…`
4. **Trade-offs / limitations** — `Explain strengths, limitations, or alternatives…`

Remove the old `Concept / How it works / Example / Trade-offs` cue chips.

Keep one short guidance sentence: `Explain the idea as if speaking to an interviewer.`

## 12. Structured-answer validation

Do **not** require every subsection.

The overall answer is valid when:

- at least one subsection contains meaningful non-whitespace text; and
- the exact serialized string described in Section 14 is no longer than 12,000 characters.

The 12,000-character count includes:

- subsection headings;
- heading punctuation;
- preserved user text;
- newlines and blank-line separators.

This is deliberate because that exact serialized text is what the existing API receives.

### 12.1 Combined hard limit behavior

Use one combined counter for the structured answer.

When a proposed subsection edit would make the serialized answer exceed 12,000 characters, reject that edit rather than silently truncating user text. Keep the existing draft unchanged and leave the counter at or below 12,000.

Do not give each subsection an independent 12,000-character allowance.

## 13. Frontend draft state

For Behavioral, Scenario-Based, and Technical Explanation, subsection values are frontend-only draft state for the currently selected question.

Requirements:

- switching to another question must never leak subsection values into that question;
- returning to a question is **not required** to restore an unsaved structured draft in this bounded refinement;
- selecting a different question may clear the current unsaved structured draft, matching the existing conservative answer-draft behavior;
- route/session changes must clear structured draft state;
- no new global state framework or persistent draft store is introduced.

Before submission, serialize the current structured fields into the existing typed text answer.

## 14. Serialization format

Serialize only non-empty subsections in stable display order.

### 14.1 Behavioral

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

### 14.2 Scenario-Based

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

### 14.3 Technical Explanation

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

Serialization rules:

- trim leading/trailing whitespace from each subsection;
- omit empty subsections completely;
- separate included sections with exactly one blank line;
- preserve user-entered internal line breaks inside a subsection;
- use the exact heading capitalization shown above;
- the resulting serialized string is the canonical attempt answer submitted to the existing API.

## 15. Existing attempt/backend contract

Preserve the existing typed attempt contract and storage path.

Do not add structured JSON answer fields to the API or database.

Conceptually the frontend still submits, for example:

```text
{ type: "behavioral", text: "Situation:\n...\n\nAction:\n..." }
```

The backend, persistence layer, Gemini feedback flow, and Saved Attempts continue to receive ordinary text.

## 16. Saved Attempts and historical compatibility

New structured answers are stored as ordinary text with headings and line breaks.

The Saved Attempts presentation must preserve line breaks (for example with an existing or focused `white-space: pre-wrap` treatment) so the headings remain readable.

Do not parse stored text back into structured JSON or subsection objects.

Historical attempts without headings continue to display as ordinary saved text.

Historical questions and the `legacy-open-response` compatibility path remain unchanged.

## 17. AI feedback and explanations

Do not change Gemini/provider behavior.

The existing backend receives the serialized answer string and may generate feedback through the existing single-answer path.

Do not:

- make one Gemini request per subsection;
- score subsections separately;
- add structured AI-feedback persistence;
- change polling, retry, cancellation, UUID/idempotency, lease, or worker semantics.

## 18. Accessibility and responsive behavior

The new controls must preserve or improve existing accessibility:

- Career area has a real accessible label and required state;
- Target-role combobox semantics remain intact;
- selected role shortcuts use accessible pressed/selected state;
- Focus-topic and Skill-gap chips retain `aria-pressed` semantics;
- each structured subsection has a real associated label;
- validation/errors use the existing accessible error patterns;
- the combined character counter is connected to the structured answer group;
- structured fields render in one vertical column at every breakpoint;
- no nested forms;
- keyboard interaction remains usable without a mouse.

## 19. Security and privacy constraints

This refinement does not alter authorization or ownership behavior.

Preserve:

- authenticated session ownership enforcement;
- existing API validation;
- MCQ pre-submit answer-key secrecy;
- deterministic backend MCQ scoring;
- no MCQ AI-feedback action;
- Coding answers remain text-only and are never executed;
- no external role-taxonomy service receives user data;
- no new provider request is made simply to populate Career area, role, topic, or skill-gap suggestions.

## 20. Testing requirements

### 20.1 Career-area and role guidance

Tests must prove:

- all fourteen canonical career areas exist in stable order;
- `Other / Custom` exists as a separate utility option;
- no Career area is selected by default;
- Technology retains the approved representative roles;
- representative non-technology areas expose their approved roles;
- role search only searches the selected area;
- changing area clears Target role but preserves selected Focus topics / Skill gaps;
- custom role under a selected area uses that area’s guidance;
- `Other / Custom` uses generic professional guidance, never Software Engineering guidance;
- suggestions start unselected;
- custom Focus / Skill values still canonicalize and dedupe.

### 20.2 Create Interview integration

Tests must prove:

- Career area is required;
- Target role remains required, searchable, and customizable after an area is chosen;
- the selected/custom role still populates the existing create-session payload;
- `careerArea` is **not** added to that payload;
- smart-title ownership remains intact;
- Experience-level behavior remains intact;
- Focus topics / Skill gaps remain optional;
- existing cancellation, validation-focus, duplicate-submit, request-ID, and pending-draft protections continue to pass.

### 20.3 Structured answers

For Behavioral, Scenario-Based, and Technical Explanation, tests must prove:

- the exact approved subsection labels render;
- old cue-chip-only presentation is removed;
- subsection values update independently;
- empty subsections are omitted during serialization;
- stable heading order and exact heading text are preserved;
- one non-empty subsection is enough to enable Save attempt;
- zero non-empty subsections keeps Save attempt disabled;
- combined serialization, including headings/newlines, never exceeds 12,000 characters;
- an edit that would exceed the limit is rejected without truncating existing text;
- serialized text is passed through the existing typed answer contract;
- question/session changes do not leak structured draft state;
- Saved Attempts display serialized newlines legibly;
- historical plain-text attempts remain compatible.

### 20.4 Regression

Retain existing focused coverage for:

- Multiple Choice answer UX;
- Short Answer UX;
- Coding Starter code UX;
- category selection;
- exact-count reset behavior;
- workspace route-loading/stale-selection behavior.

## 21. Verification gate

After implementation, verification order is:

1. focused Career-area / role-guidance tests;
2. focused Create Interview tests;
3. focused structured-answer tests;
4. existing Task 7R focused Interview tests;
5. frontend typecheck;
6. user local focused verification;
7. browser QA for cross-industry wizard and all three structured answer types;
8. full backend regression;
9. full frontend regression;
10. backend production build;
11. frontend production build;
12. `git diff --check`;
13. clean working tree;
14. final PR review;
15. explicit user merge approval.

Do not merge before all required verification is green and the user separately authorizes the merge.

## 22. Browser acceptance checks

Browser QA must include at least:

- opening Create Interview with no Career area selected;
- selecting a Technology role;
- selecting at least one non-technology role, such as Accountant, Nurse, Teacher, or Civil Engineer;
- verifying the role shortcuts and Focus / Skill suggestions change with Career area;
- adopting a custom role under a normal area;
- using `Other / Custom` and confirming generic professional suggestions;
- verifying existing selected Focus / Skill values survive an area change;
- Behavioral STAR field entry and submission;
- Scenario-Based field entry and submission;
- Technical Explanation field entry and submission;
- a partially completed structured answer with only one subsection;
- Saved Attempts rendering with preserved headings/newlines;
- desktop and mobile-width layout sanity.

## 23. PR governance

Continue using PR #13 and base branch `phase-19b-interview-coach-refinements`.

Before final review, update the PR description so it accurately mentions:

- the already-added optional Coding starter-code schema/persistence extension;
- Gemini question-generation schema/prompt support for Coding starter code;
- guided Create Interview wizard;
- cross-industry Career-area / role guidance;
- structured frontend answer entry for Behavioral, Scenario-Based, and Technical Explanation;
- unchanged attempt API/storage contract for structured answers;
- no code execution;
- no extra provider call for role/topic suggestions;
- no deployment;
- explicit merge approval requirement.

## 24. Acceptance criteria

The refinement is acceptable when all of the following are true:

- Career Learning Hub no longer presents Computer Science roles as the only guided career universe;
- all fourteen approved Career areas are available with no biased default;
- each area exposes the exact bounded representative role catalog;
- custom roles remain possible after area selection;
- `Other / Custom` uses generic professional guidance rather than Software Engineering guidance;
- Career area remains frontend-only and does not change the session API/schema;
- Focus-topic and Skill-gap suggestions use the exact approved area-level catalogs;
- area/role changes never silently delete already selected Focus / Skill values;
- Behavioral uses Situation / Task / Action / Result fields;
- Scenario-Based uses Assessment / Approach / Trade-offs / Decision fields;
- Technical Explanation uses Concept / How it works / Example / Trade-offs or limitations fields;
- only one structured subsection needs meaningful text;
- the exact serialized answer, including headings and newlines, never exceeds 12,000 characters;
- structured answers serialize into the existing text attempt contract;
- backend/API/database/Gemini feedback architecture remains unchanged for structured answers;
- historical attempts remain readable;
- Multiple Choice, Short Answer, Coding, and historical Open Response remain behaviorally compatible;
- focused tests, typecheck, full regressions, builds, diff check, browser QA, and final review are green;
- PR #13 remains unmerged until explicit user merge approval.
