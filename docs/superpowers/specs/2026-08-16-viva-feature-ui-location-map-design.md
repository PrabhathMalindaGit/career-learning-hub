# Viva Feature & UI Location Map — Design

## Purpose

Create a documentation-only viva reference that lets the student answer two practical examiner questions quickly:

1. Where is each implemented capability located in Career Learning Hub?
2. Which control/button activates it, and how does that control or surrounding state change visually?

The guide must describe the current final application as implemented. It must not change application behavior, source code, tests, runtime configuration, APIs, schemas, or styling.

## Deliverables

### 1. Repository guide

Create `docs/viva/VIVA_FEATURE_UI_LOCATION_MAP.md`.

For each major capability, record:

- capability name;
- top-level navigation path;
- route or route family;
- exact screen/workspace/section;
- exact visible control or button label;
- physical location of the control in the screen;
- normal visual treatment;
- hover, selected, disabled, busy, success, warning, error, or destructive state where relevant;
- prerequisite state that enables the control;
- immediate result after activation;
- short viva-ready explanation;
- implementation file reference for traceability.

The guide should prioritize what an examiner can actually see and click during a live demonstration rather than low-level implementation detail.

### 2. Chat cheat sheet

Provide a shorter memorization-oriented reference in ChatGPT after the repository guide is complete. It should organize the application by:

- global navigation;
- Dashboard;
- Resume Studio;
- Interview Coach;
- Learning Workspace;
- Settings/Gemini;
- common button/state language.

Each entry should answer, in one or two lines, “where is it?” and “what do I click?”.

## Coverage

### Global shell

Document:

- sidebar/mobile navigation;
- Create menu;
- account/session area;
- active navigation treatment;
- logout;
- breadcrumbs and mobile navigation where useful for viva explanation.

### Dashboard

Document:

- Continue Resume / Create Resume;
- Continue Interview / Start Interview Session;
- Open Learning Document / Upload Learning Document;
- recent activity/progress areas when they are useful as demonstration entry points.

### Resume Studio

Document at minimum:

- Create Resume;
- Guided setup;
- Start blank;
- Import PDF;
- Resume editor;
- live preview;
- Save new version;
- unsaved/dirty/save-state behavior;
- design controls;
- candidate photo controls;
- print/save-as-PDF controls;
- Role-aware assessment;
- Run AI-assisted assessment;
- assessment progress/cancel/retry/check-status states;
- AI recommendation selection/application;
- immutable version history and historical snapshot viewing;
- recovery and destructive confirmation controls.

Special emphasis: the AI assessment action is intentionally visually secondary to Save. Its current scoped presentation is pale green rather than the common solid-green primary button. Record the exact normal, hover, and disabled colors from `ResumeAssessmentActionUi.css`.

### Interview Coach

Document at minimum:

- Create interview;
- career area, target role, experience level and practice mode selection;
- Generate questions;
- question type selection/counts;
- Add manually;
- Multiple Choice, Short Answer, Coding, Behavioral, Scenario-Based and Technical Explanation answer experiences;
- Pin/Unpin question;
- Request explanation;
- private notes;
- Save attempt;
- saved-attempt review;
- Request feedback;
- session filters and archive/restore/delete controls where present;
- provider job progress/retry/cancel/resume-status states.

### Learning Workspace

Document at minimum:

- Upload PDF / Upload document;
- document-status filter and Refresh documents;
- Open workspace;
- Overview;
- Original PDF;
- Extracted Content;
- Grounded Chat;
- Flashcards;
- Quizzes;
- Create conversation / Send question;
- source-page references;
- Create flashcards / Generate flashcards / Study set;
- Reveal/Hide answer and Previous/Next study controls;
- Create quiz / Generate quiz / Take quiz;
- background generation/status/resilience controls;
- deletion confirmations and unavailable/processing states where they materially affect navigation.

### Settings / Gemini

Document:

- Gemini connection panel;
- connected/disconnected status badge;
- fixed model display;
- Test connection;
- Use application-managed Gemini when available;
- Connect personal key / Replace key;
- Save and test;
- Disconnect;
- Delete key confirmation;
- Sign out of this session.

## Button and state language

The guide must distinguish visual meaning, not only CSS class names:

- primary: green, highest-emphasis constructive action;
- secondary: light/neutral action;
- quiet/tertiary: low-emphasis action;
- destructive: red destructive/irreversible action;
- disabled: muted and non-interactive;
- busy: label changes such as Saving…, Creating…, Generating…, Uploading…, Testing…;
- active navigation/tab/filter: selected treatment indicates current context;
- success/warning/error/status surfaces: explain state feedback instead of presenting them as buttons.

Do not claim a button changes color unless the current CSS or rendered state supports that claim. Where a control changes label instead of color, describe the label/state transition precisely.

## Evidence sources

Use the current repository implementation as the source of truth, especially:

- `frontend/src/routing/router.tsx`;
- `frontend/src/AppShell.tsx`;
- `frontend/src/styles.css`;
- feature components under `frontend/src/features/resumes/`;
- feature components under `frontend/src/features/interviews/`;
- feature components under `frontend/src/features/learning/`;
- settings/Gemini components under `frontend/src/features/auth/`;
- feature-specific CSS files, including `ResumeAssessmentActionUi.css`.

Existing final evidence may be used for terminology and scope, but visible control names and states must be verified from current implementation files.

## Scope boundaries

- Documentation only.
- No source/application/test/config/runtime changes.
- No styling changes.
- No new features.
- No deployment.
- No branch deletion.
- No unsupported claim that every action changes colour; document actual state changes only.
- Do not reintroduce old predecessor-application narrative.

## Success criteria

The deliverable is complete when:

1. Every major user-facing capability used in the intended viva flow can be located from the guide without reading source code.
2. Each important action names the exact visible control and its screen location.
3. Button/state behavior is described accurately from current CSS/component logic.
4. The Resume AI-assessment action’s pale-green normal/hover/disabled treatment is explicitly documented.
5. No application/source/test/config/runtime file is modified.
6. The shorter ChatGPT cheat sheet can be used as a rehearsal aid without needing the full repository guide.
