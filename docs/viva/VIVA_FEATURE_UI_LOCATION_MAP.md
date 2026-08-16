# Career Learning Hub — Viva Feature & UI Location Map

## Purpose

This guide is the authoritative viva-preparation map for the current Career Learning Hub implementation. It links stable feature numbers to visible UI locations, exact user controls, state/visual behavior, and the principal frontend/backend/shared/test implementation locations.

Career Learning Hub is an integrated authenticated web application comprising Resume Studio, Interview Coach and Learning Workspace, supported by shared authentication, persistence, private storage, background processing and controlled Gemini integration.

## How to read each feature entry

Detailed entries use the following fields where relevant:

- **UI path** — navigation path a user follows.
- **Route** — current React Router route or route family.
- **Screen / section** — visible workspace or panel.
- **Control** — exact user-facing button, link, input or state surface.
- **Control location** — where the control appears within the current screen.
- **Enabled when** — prerequisite state for an action.
- **Visual / state behavior** — normal, hover, selected, disabled, busy, success, warning, error or destructive behavior supported by current source/CSS.
- **What happens** — immediate user-visible result and important control-flow boundary.
- **Frontend** — principal component/file.
- **Frontend API / gateway** — client API module when relevant.
- **Backend** — principal route/controller/service/job boundary when relevant.
- **Shared contract** — cross-layer contract/type file when relevant.
- **Representative tests** — existing automated evidence useful for locating or explaining the behavior.
- **Viva-ready explanation** — short explanation suitable for an examiner question.

## Canonical protected-route map

```text
/login
/register
/dashboard
/resumes
/resumes/:resumeId
/interviews
/interviews/:sessionId
/learning
/learning/documents/:documentId
/learning/documents/:documentId/conversations/:conversationId
/learning/documents/:documentId/flashcards/:setId
/learning/documents/:documentId/quizzes/:quizId
/learning/documents/:documentId/quizzes/:quizId/attempts/:attemptId
/settings
```

The application does not define a separate Activity route or a separate study-set rename route.

## Shared visual/action language

The current common UI vocabulary is:

- **Primary** — solid Career Learning Hub green (`--accent: #287a4a`) with white text; hover uses darker green (`--accent-dark: #1e6039`).
- **Secondary** — light/neutral supporting action using the shared border/surface-muted treatment.
- **Quiet / tertiary** — low-emphasis action; transparent by default with restrained hover treatment.
- **Destructive** — solid red (`#a33b3b`) with darker red hover (`#842424`).
- **Disabled** — non-interactive muted state. Shared buttons use reduced opacity; feature-specific controls may define a more precise disabled presentation.
- **Busy** — the action remains identifiable while the label/status changes, for example `Saving…`, `Creating…`, `Uploading…`, `Generating…` or `Testing…`.
- **Active navigation/tab/filter** — selected treatment identifies the current context. Main navigation uses a pale green active background with a green inset indicator.
- **Status surfaces** — success, warning, error and information feedback communicate state rather than acting as primary actions.

## Stable feature-number index

### 1 — Access & Navigation

- **1.1** Register
- **1.2** Login
- **1.3** Authenticated application shell
- **1.4** Sidebar/mobile navigation
- **1.5** Global Create menu
- **1.6** Logout/session handling

### 2 — Dashboard

- **2.1** Progress overview
- **2.2** Continue/Create Resume
- **2.3** Continue/Start Interview
- **2.4** Open/Upload Learning document
- **2.5** Recent activity

### 3 — Resume Studio

- **3.1** Resume collection
- **3.2** Resume creation
  - **3.2.1** Guided setup
  - **3.2.2** Start blank
  - **3.2.3** Import PDF
- **3.3** Resume editor
- **3.4** Live preview
- **3.5** Save new immutable version
- **3.6** Design/template controls
- **3.7** Candidate photo
- **3.8** Print / Save as PDF
- **3.9** AI-assisted role assessment
- **3.10** AI recommendations
- **3.11** Version history
- **3.12** Draft recovery / unsaved-change protection

### 4 — Interview Coach

- **4.1** Interview session collection
- **4.2** Create interview
- **4.3** Career area / role / experience configuration
- **4.4** AI question generation
- **4.5** Manual question creation
- **4.6** Question types
- **4.7** Question filtering and pinning
- **4.8** Private notes
- **4.9** Save practice attempt
- **4.10** Saved-attempt history
- **4.11** Question explanation
- **4.12** AI feedback
- **4.13** Session archive/restore/delete

### 5 — Learning Workspace

- **5.1** PDF upload
- **5.2** Document processing
- **5.3** Document library
- **5.4** Overview / summary
- **5.5** Secure original PDF viewer
- **5.6** Extracted page-aware content
- **5.7** Grounded Chat
  - **5.7.1** Create conversation
  - **5.7.2** Send question
  - **5.7.3** Source-page references
- **5.8** Flashcards
  - **5.8.1** Generate
  - **5.8.2** Study
  - **5.8.3** Reveal answer / navigation
- **5.9** Quizzes
  - **5.9.1** Generate
  - **5.9.2** Take quiz
  - **5.9.3** Review saved attempt
- **5.10** Learning resource deletion

### 6 — Settings & Gemini

- **6.1** Gemini connection status
- **6.2** Fixed Gemini model display
- **6.3** Application-managed Gemini
- **6.4** Personal Gemini key
- **6.5** Save and test key
- **6.6** Test connection
- **6.7** Replace key
- **6.8** Disconnect
- **6.9** Delete personal key
- **6.10** AI usage diagnostics
- **6.11** Account/session information

### 7 — Shared Platform Controls

- **7.1** Authentication/session security
- **7.2** Ownership/authorization
- **7.3** Private file storage
- **7.4** Background jobs
- **7.5** Progress polling
- **7.6** Cancel/retry handling
- **7.7** Validation before persistence
- **7.8** Error/request-ID handling
- **7.9** Responsive/accessibility behavior

---

## 1 — Access & Navigation

### 1.1 Register

### 1.2 Login

### 1.3 Authenticated application shell

### 1.4 Sidebar/mobile navigation

### 1.5 Global Create menu

### 1.6 Logout/session handling

## 2 — Dashboard

### 2.1 Progress overview

### 2.2 Continue/Create Resume

### 2.3 Continue/Start Interview

### 2.4 Open/Upload Learning document

### 2.5 Recent activity

## 3 — Resume Studio

### 3.1 Resume collection

### 3.2 Resume creation

#### 3.2.1 Guided setup

#### 3.2.2 Start blank

#### 3.2.3 Import PDF

### 3.3 Resume editor

### 3.4 Live preview

### 3.5 Save new immutable version

### 3.6 Design/template controls

### 3.7 Candidate photo

### 3.8 Print / Save as PDF

### 3.9 AI-assisted role assessment

### 3.10 AI recommendations

### 3.11 Version history

### 3.12 Draft recovery / unsaved-change protection

## 4 — Interview Coach

### 4.1 Interview session collection

### 4.2 Create interview

### 4.3 Career area / role / experience configuration

### 4.4 AI question generation

### 4.5 Manual question creation

### 4.6 Question types

### 4.7 Question filtering and pinning

### 4.8 Private notes

### 4.9 Save practice attempt

### 4.10 Saved-attempt history

### 4.11 Question explanation

### 4.12 AI feedback

### 4.13 Session archive/restore/delete

## 5 — Learning Workspace

### 5.1 PDF upload

### 5.2 Document processing

### 5.3 Document library

### 5.4 Overview / summary

### 5.5 Secure original PDF viewer

### 5.6 Extracted page-aware content

### 5.7 Grounded Chat

#### 5.7.1 Create conversation

#### 5.7.2 Send question

#### 5.7.3 Source-page references

### 5.8 Flashcards

#### 5.8.1 Generate

#### 5.8.2 Study

#### 5.8.3 Reveal answer / navigation

### 5.9 Quizzes

#### 5.9.1 Generate

#### 5.9.2 Take quiz

#### 5.9.3 Review saved attempt

### 5.10 Learning resource deletion

## 6 — Settings & Gemini

### 6.1 Gemini connection status

### 6.2 Fixed Gemini model display

### 6.3 Application-managed Gemini

### 6.4 Personal Gemini key

### 6.5 Save and test key

### 6.6 Test connection

### 6.7 Replace key

### 6.8 Disconnect

### 6.9 Delete personal key

### 6.10 AI usage diagnostics

### 6.11 Account/session information

## 7 — Shared Platform Controls

### 7.1 Authentication/session security

### 7.2 Ownership/authorization

### 7.3 Private file storage

### 7.4 Background jobs

### 7.5 Progress polling

### 7.6 Cancel/retry handling

### 7.7 Validation before persistence

### 7.8 Error/request-ID handling

### 7.9 Responsive/accessibility behavior
