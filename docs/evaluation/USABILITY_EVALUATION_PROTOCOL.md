# Phase 20B-3 — Task-Based Usability Evaluation Protocol

## 1. Purpose

This document freezes the task-based usability method for Career Learning Hub under Objective O7.

It defines the participant-facing tasks, completion rules, timing method, recoverable-error rules, assistance rules, observer instructions, evaluation environment, invalid-data handling, and claim boundaries that must be used if and when participant usability evaluation is later permitted.

This document is **method design only**. It does not report participant results and does not authorize participant recruitment or data collection.

## 2. Protocol identity and status

- Protocol: `PHASE 20B-3 — TASK-BASED USABILITY EVALUATION PROTOCOL`
- Version: `1.0`
- Status: `FROZEN METHOD DESIGN / PARTICIPANT EXECUTION BLOCKED`
- Phase 20B stream: `B — PARTICIPANT USABILITY EVIDENCE`
- Branch base for this documentation slice: `main @ 41dcc7cd6f11b5fad603c845c525b318c0a578eb`
- Current qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Master protocol: `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md`
- Ethics gate: `docs/evaluation/PHASE_20B_ETHICS_AND_PARTICIPANT_SAFETY_GATE.md`

The ethics gate currently remains:

```text
BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION
```

Therefore this protocol must not yet be used with real participants.

## 3. Evaluation question

The task-based usability study answers:

> Can permitted representative participants understand and complete the main Career Learning Hub workflows under a consistent, frozen study procedure using prepared synthetic/de-identified study data?

The study evaluates observable task performance and interaction behaviour. It does not attempt to infer participant intelligence, employability, personality, learning ability, or hiring outcomes.

## 4. Scope

The task set covers the integrated user journey across:

1. authenticated access and application navigation;
2. Resume Studio editing, version saving and assessment/recommendation review;
3. Interview Coach answer, attempt-history and feedback workflows;
4. Learning Workspace original/extracted document review, Grounded Chat and source references;
5. flashcard study, quiz completion and saved review.

The study intentionally does not attempt to test every feature in the application.

## 5. Explicit non-scope

This protocol does not authorize or evaluate:

- participant recruitment;
- participant eligibility or sample size;
- SUS administration or scoring;
- full accessibility/WCAG conformance;
- formal AI-output-quality scoring;
- employer ATS equivalence;
- hiring probability or employment prediction;
- learning-outcome improvement;
- penetration testing or security certification;
- production scalability or uptime;
- application code changes;
- deployment.

SUS is handled separately by Phase 20B-4. Participant eligibility/recruitment/sample planning is handled by Phase 20B-5. Accessibility and AI-output-quality evidence are handled by later separate Phase 20B protocols.

## 6. Preconditions before any participant session

Participant execution is prohibited until all applicable prerequisites are satisfied.

At minimum:

1. the Phase 20B ethics/module/supervisor gate must be explicitly passed under recorded conditions;
2. Phase 20B-5 must define the permitted participant population, recruitment route, sample plan and stopping rule;
3. Phase 20B-8 must provide the frozen synthetic/de-identified study fixtures required by these tasks;
4. Phase 20B-9 must provide the frozen evidence-collection template;
5. the study executable baseline and browser/environment identity must be recorded;
6. every participant must start from equivalent resettable study state;
7. any study-managed Gemini connection needed by an AI-dependent task must be functioning before the session;
8. participants must never be asked to provide a personal Gemini/API key.

If SUS is to be administered in the same study session, Phase 20B-4 must also be frozen before the first participant session.

## 7. Freeze rule

The participant-facing task wording, task order, success criteria, timing convention, assistance definition, recoverable-error definition and validity rules in this version are frozen before any participant result is collected.

Exact synthetic fixture values are intentionally created later by Phase 20B-8. Binding a frozen fixture ID to a task does not change this protocol provided the task goal and scoring criteria remain unchanged.

If a later fixture or product change materially alters a task goal, required outcome or scoring rule, increment the protocol version and identify which participant records were collected under each version.

Do not change criteria after observing results merely to improve the outcome.

## 8. Study design

### 8.1 Unit of observation

One permitted participant completes the same five ordered tasks using a fresh/reset study account and equivalent synthetic/de-identified application state.

### 8.2 Task order

Use this fixed order for every participant:

```text
U1 — Access & Navigation
U2 — Resume Studio
U3 — Interview Coach
U4 — Grounded Learning
U5 — Study Materials
```

The fixed order is intentional because U1 establishes authenticated orientation and the later tasks follow the application's major workspaces in a consistent sequence.

Do not randomize the task order in protocol version 1.0.

### 8.3 Maximum task time

Each task has a maximum active task window of:

```text
10 minutes
```

Participants must be told before the task set begins that each task has a 10-minute maximum.

Do not stop or pause the clock for ordinary hesitation, navigation, recoverable mistakes, normal application loading or a counted request for assistance.

A confirmed external/setup failure that makes the task impossible is handled as `INVALID_ENVIRONMENT`, not as a participant task failure.

## 9. Standard evaluation environment

Unless an approved accommodation requires otherwise, use one consistent study environment:

- current approved Career Learning Hub evaluation baseline;
- Google Chrome stable;
- desktop/laptop presentation;
- target browser viewport approximately `1440 × 900`;
- browser zoom `100%`;
- keyboard and pointing device available;
- clean study browser profile/session;
- stable network connection where Gemini-backed behaviour is required;
- prepared study-managed Gemini configuration for AI-dependent tasks;
- current release-path model recorded as `gemini-3.6-flash` when AI is exercised;
- no participant personal API keys or private files;
- identical synthetic/de-identified study fixtures for all comparable participants.

Record the actual browser version, device/viewport, evaluation date, executable checkpoint, protocol version and relevant non-secret configuration when the study is conducted.

If an approved accessibility accommodation changes the environment, provide it and record the change. Do not count the accommodation itself as participant assistance or a usability error.

## 10. Moderator / observer instructions

The moderator must use the same procedure for every participant.

1. Confirm the permitted consent/participant-information process before any task activity.
2. Use only the prepared study account and synthetic/de-identified study data.
3. Read each participant-facing task prompt verbatim.
4. Do not explain where controls are located before the participant begins.
5. Start timing only when the task prompt has been fully given and the participant indicates readiness.
6. Observe visible actions without coaching.
7. If the participant asks for clarification, first repeat the task goal without naming a UI control or path.
8. If directional help is then required, provide the smallest useful hint and count it as assistance.
9. Do not take control of the mouse/keyboard or perform an essential task action for the participant during a valid task attempt.
10. Ask a neutral closing question such as `Are you finished with this task?` when the participant appears to stop.
11. Record only observable interaction evidence in notes.
12. Do not infer ability, motivation, personality or emotion from behaviour.
13. Do not require think-aloud commentary in protocol version 1.0.
14. Do not record audio, video or the screen unless the ethics/module gate later explicitly permits that exact recording method.
15. Respect withdrawal immediately under the approved ethics procedure.

## 11. Core task record

Each task attempt must preserve these logical fields when participant collection is later authorized:

```text
participant_id
protocol_version
task_id
validity_status
completion_status
time_seconds
recoverable_errors
assistance_count
observation_notes
```

Phase 20B-9 will define the machine-readable collection template. It must preserve the semantics defined here.

Do not store participant names, emails, student IDs, phone numbers, personal CVs, private documents, personal Gemini credentials or other direct identifiers in the repository evidence by default.

## 12. Validity status

Use one of these values before interpreting task completion:

```text
VALID
INVALID_ENVIRONMENT
WITHDRAWN
NOT_RUN
```

### VALID

The task was available, the participant was permitted to attempt it, and no confirmed external/setup failure made the task impossible.

A `VALID` record must also have one completion status: `SUCCESS`, `PARTIAL` or `FAILED`.

### INVALID_ENVIRONMENT

Use only when a confirmed study setup, service or infrastructure problem prevents meaningful completion independently of the participant's actions.

Examples include:

- the prepared study account cannot authenticate because the account was not provisioned correctly;
- the required synthetic fixture is missing before the task begins;
- the study-managed Gemini service is unavailable and the AI-dependent task cannot proceed;
- the study server/browser environment becomes unavailable.

Do not use `INVALID_ENVIRONMENT` merely because the application displays an ordinary user-facing validation error or because a participant makes a recoverable mistake.

`INVALID_ENVIRONMENT` records must not be counted as `FAILED` and must be excluded from valid-task completion-rate denominators.

### WITHDRAWN

Use when the participant stops the study or task under the approved withdrawal procedure.

Do not convert withdrawal into a failure.

### NOT_RUN

Use when a task was not attempted for a documented procedural reason other than withdrawal or environment invalidation.

Do not fabricate completion data for a task marked `NOT_RUN`.

## 13. Completion-status scale

For `VALID` task records use exactly:

```text
SUCCESS
PARTIAL
FAILED
```

### SUCCESS

Use `SUCCESS` only when:

- all task-specific required outcomes are achieved within 10 minutes;
- no counted directional moderator assistance was required; and
- the moderator did not perform an essential task action.

Recoverable participant errors may occur and still result in `SUCCESS` if the participant self-corrects independently and reaches all required outcomes.

### PARTIAL

Use `PARTIAL` when the primary task outcome is reached but at least one required secondary outcome is missing, **or** when one or more counted directional moderator assists were required to reach the intended outcome.

A participant who completes every UI step only after directional help is therefore not recorded as an independent `SUCCESS`.

### FAILED

Use `FAILED` when:

- the primary task outcome is not achieved within 10 minutes;
- the participant abandons the valid task without invoking the study withdrawal procedure;
- the moderator must perform an essential task action for the participant; or
- the task ends in a valid but unresolved interaction state that does not satisfy the primary outcome.

A confirmed external/setup failure must use `INVALID_ENVIRONMENT` instead of `FAILED`.

## 14. Timing method

### Start event

Start the timer when:

1. the moderator has finished reading the task prompt; and
2. the participant indicates readiness to begin.

### Stop event

Stop the timer at the earliest of:

- all required task outcomes are visibly achieved and the participant indicates completion;
- the participant indicates they cannot continue with the valid task;
- the 10-minute maximum is reached;
- a confirmed environment failure invalidates the task;
- the participant invokes withdrawal.

Record elapsed time in whole seconds.

Do not remove a slow valid completion merely because it is inconvenient.

For an invalid/withdrawn record, elapsed time may be retained for audit context if permitted, but it must not be included in normal completion-time summaries.

If completion status is valid but timing data is missing because of observer error, retain the completion status, record the missing time explicitly, and exclude that record only from timing calculations. Do not impute a time value.

## 15. Recoverable-error definition

A `recoverable error` is one discrete participant action episode that clearly moves away from the task's intended state or produces an incorrect/invalid state, but the participant subsequently recovers without the moderator performing the task.

Count examples such as:

- opening the wrong workspace or record and returning;
- choosing the wrong tab and correcting it;
- entering invalid task data, receiving validation feedback and correcting it;
- attempting an incorrect save/navigation action and then self-correcting;
- selecting the wrong study item and returning to the assigned item.

Do **not** count:

- visually scanning the page;
- hovering or reading labels;
- reasonable exploration that does not create an incorrect state;
- normal application loading;
- an approved accessibility accommodation;
- a study setup issue;
- repeated clicks that are part of the same unresolved error episode.

Count one logical episode as one recoverable error even if it contains several clicks before recovery.

## 16. Assistance definition

Increment `assistance_count` for each discrete directional moderator intervention that helps the participant locate or complete a task step.

Count assistance when the moderator:

- names a specific control, tab, menu or location;
- tells the participant which route or sequence to follow;
- explains a feature in a way that directly enables task completion;
- tells the participant which action to perform next.

Do **not** count:

- reading the original task prompt;
- repeating the task goal without naming controls/locations;
- saying `continue when you are ready`;
- confirming that the participant may stop;
- fixing a study environment/setup failure outside a valid task attempt;
- providing an approved accessibility accommodation.

If the moderator physically performs an essential task action, the valid task cannot be `SUCCESS` or `PARTIAL`; record `FAILED` unless the task was actually invalidated by an environment problem.

## 17. Observation-note standard

Observation notes must describe visible interaction evidence.

Good examples:

- `Opened Settings before locating Resume Studio, then returned independently.`
- `Attempted to submit the quiz before answering the final item; validation message was read and the item was completed.`
- `Asked where saved interview attempts are located; one directional hint was provided.`

Do not write unsupported personal interpretations such as:

- `Participant is bad at technology.`
- `Participant was not intelligent enough to understand the page.`
- `Participant disliked the application` unless that exact statement was voluntarily expressed and collection of such comments is permitted.

Do not include direct identifying information in observation notes.

## 18. Task-state reset and contamination control

Before each participant:

1. use a fresh/reset study account or reset the participant's assigned study account to the frozen baseline;
2. restore the prepared Resume, Interview and Learning fixtures to their starting states;
3. remove any prior quiz attempt, draft/version changes or other participant-created state that would reveal a prior participant's actions;
4. confirm the required document is fully processed;
5. confirm prepared flashcards and quiz resources are present;
6. confirm the study-managed AI connection needed by U2/U4 is available;
7. begin from the same public/login starting route for U1.

Do not expose one participant's observations, answers or modified state to another participant.

## 19. Task summary

| Task | Area | Primary outcome | AI dependency |
|---|---|---|---|
| U1 | Access & Navigation | Authenticate and locate the major workspaces/settings | No |
| U2 | Resume Studio | Edit, save a new version, request assessment and inspect recommendation state | Yes |
| U3 | Interview Coach | Save an attempt and locate saved feedback/explanation | No new generation required |
| U4 | Grounded Learning | Ask a grounded question and use the source/page reference | Yes |
| U5 | Study Materials | Study prepared flashcards, submit quiz and open saved review | No new generation required |

## 20. U1 — Access & Navigation

### Preconditions

- participant starts signed out;
- prepared study account credentials are supplied under the approved study procedure;
- account is valid and contains the frozen study data needed by later tasks.

### Participant-facing prompt

> Using the study account details provided, sign in to Career Learning Hub. Then locate where you would work on a resume, practise interview questions, study from a document, and manage application settings. Finish by returning to the dashboard.

### Required outcomes

1. Sign in successfully.
2. Reach the Resume workspace/collection.
3. Reach the Interview workspace/collection.
4. Reach the Learning workspace/library.
5. Reach Settings.
6. Return to Dashboard.

### Primary outcome

Successful authentication plus independent orientation across the application's major workspaces.

### SUCCESS

All six required outcomes are achieved without counted directional assistance.

### PARTIAL

The participant authenticates and reaches at least three of the four specified module/settings destinations but misses one required destination or the final Dashboard return, **or** requires counted directional assistance to complete the full task.

### FAILED

The participant cannot complete authentication through valid interaction, or after authentication reaches fewer than three of the four specified destinations within 10 minutes.

A confirmed provisioning/auth-environment failure uses `INVALID_ENVIRONMENT` instead.

## 21. U2 — Resume Studio

### Preconditions

- one frozen synthetic/de-identified Resume is available;
- the exact replacement professional-summary text is supplied by the later frozen study fixture;
- Resume assessment is available through the study-managed Gemini configuration;
- the Resume begins in its reset baseline state.

### Participant-facing prompt

> Open the prepared resume. Replace its professional summary with the study text provided and save the change as a new version. Then request an AI assessment. When the assessment finishes, find the overall assessment score and inspect one recommendation. If an actionable recommendation is available, continue until its confirmation step is shown, but stop before applying the recommendation.

### Required outcomes

1. Open the assigned Resume.
2. Replace the professional summary with the supplied study text.
3. Save the edited Resume as a new version.
4. Start the Resume assessment.
5. Reach the completed assessment result.
6. Locate the overall assessment score.
7. Inspect the recommendation state.
8. If an actionable recommendation is available, reach its confirmation step without applying it.

### Primary outcome

Create a new saved Resume version and successfully reach/review the assessment result.

### SUCCESS

All applicable required outcomes are achieved without counted directional assistance.

If the completed assessment contains no actionable recommendation, the participant can still achieve `SUCCESS` by correctly locating the recommendation state and recognizing that no actionable recommendation is available. Do not fabricate a recommendation solely to make the task pass.

### PARTIAL

The participant successfully creates the new saved version and reaches a completed assessment, but misses the score or recommendation-state requirement, **or** needs counted directional assistance to complete the task.

### FAILED

The participant does not create the new saved version or cannot reach a completed assessment through valid interaction within 10 minutes.

A confirmed study-managed Gemini/service outage that prevents the assessment from operating uses `INVALID_ENVIRONMENT` instead.

## 22. U3 — Interview Coach

### Preconditions

- one prepared Interview session is available;
- the session contains at least one assigned Multiple Choice question and one assigned written-response question;
- no generation step is required during the participant task;
- the participant has no previous saved attempt for the assigned task state.

### Participant-facing prompt

> Open the prepared interview practice session. Answer the assigned multiple-choice question and written question, save the attempt, then find that saved attempt and review the explanation or feedback for your answers.

### Required outcomes

1. Open the assigned Interview session.
2. Answer the assigned Multiple Choice question.
3. Answer the assigned written-response question.
4. Save the attempt.
5. Locate the saved attempt/history entry.
6. Open the saved attempt and reach its explanation/feedback information.

### Primary outcome

Create a saved Interview attempt and later locate/review its feedback/explanation.

### SUCCESS

All six required outcomes are achieved without counted directional assistance.

### PARTIAL

The attempt is saved but one assigned response is incomplete, or the participant cannot independently locate/open the saved attempt feedback, **or** counted directional assistance is required.

### FAILED

No valid attempt is saved within 10 minutes, or the moderator must perform an essential task action.

## 23. U4 — Grounded Learning

### Preconditions

- one frozen synthetic text-based PDF is already uploaded and fully processed;
- original PDF and extracted-content views are available;
- the later frozen study fixture supplies one known-answerable grounded question;
- study-managed Gemini is available;
- source/page references are enabled by the current Learning workflow.

### Participant-facing prompt

> Open the prepared learning document. View both the original PDF and the extracted text. Ask the supplied study question in Grounded Chat. When the answer appears, use its source or page reference to locate the supporting content in the document.

### Required outcomes

1. Open the assigned Learning document.
2. View the original PDF.
3. View the extracted content.
4. Open/use Grounded Chat.
5. Send the supplied study question.
6. Reach a completed grounded answer.
7. Identify its source/page reference.
8. Use that reference to locate the supporting document content.

### Primary outcome

Obtain the grounded answer and use its source/page reference to trace the answer back to the prepared document.

### SUCCESS

All eight required outcomes are achieved without counted directional assistance.

### PARTIAL

A grounded answer is successfully obtained but the participant misses either one document-view requirement or the source/page trace-back requirement, **or** counted directional assistance is required.

### FAILED

The participant cannot obtain the grounded answer through valid interaction or cannot reach the primary grounded workflow within 10 minutes.

A confirmed study-managed Gemini/service or prepared-document failure that makes the task impossible uses `INVALID_ENVIRONMENT` instead.

The task does not score whether the AI answer is factually correct; that belongs to the separate Learning AI-quality rubric in Phase 20B-7.

## 24. U5 — Study Materials

### Preconditions

- the same prepared Learning document has an existing frozen flashcard set with at least two cards;
- the same document has an existing prepared quiz with enough questions for the study task;
- no flashcard/quiz generation step is required during participant execution;
- the participant starts without a prior saved quiz attempt for the assigned quiz.

### Participant-facing prompt

> Open the prepared study materials for this document. Study two flashcards by revealing their answers. Then complete the prepared quiz, submit it, and open the saved result or review so you can see how the attempt was recorded.

### Required outcomes

1. Open the prepared flashcard set.
2. Reveal the answers for at least two flashcards.
3. Open the prepared quiz.
4. Provide an answer for every assigned quiz question.
5. Submit/complete the quiz.
6. Locate/open the saved quiz result or review.

### Primary outcome

Submit the prepared quiz and locate its saved review/result after using the prepared study materials.

### SUCCESS

All six required outcomes are achieved without counted directional assistance.

### PARTIAL

The quiz is submitted but the participant misses the two-card study requirement or cannot independently open the saved review/result, **or** counted directional assistance is required.

### FAILED

The participant does not submit a valid quiz attempt within 10 minutes or the moderator must perform an essential task action.

## 25. Environment and system failures during a task

Do not automatically convert every application error into `INVALID_ENVIRONMENT`.

If an ordinary, reproducible user-facing application error occurs under valid task interaction, preserve it as observed usability evidence and allow the participant to respond naturally.

Use `INVALID_ENVIRONMENT` only when the researcher can establish that the task was made impossible by a study setup/service condition outside the participant's meaningful interaction, such as a missing prepared fixture or confirmed provider outage.

If the same probable product defect repeatedly prevents a task, stop affected evaluation, preserve the observation, and use the Phase 20B change-control procedure. Product repair must occur on a separate authorized branch before affected evaluation resumes.

## 26. Derived task metrics

Phase 20B-10 may calculate the following from valid records without changing these definitions after data collection begins.

### Independent success rate per task

```text
number of VALID records with completion_status = SUCCESS
-------------------------------------------------------- × 100
                  number of VALID records
```

### Partial completion rate per task

```text
number of VALID records with completion_status = PARTIAL
-------------------------------------------------------- × 100
                  number of VALID records
```

### Failure rate per task

```text
number of VALID records with completion_status = FAILED
------------------------------------------------------- × 100
                 number of VALID records
```

The three rates should sum to 100% apart from ordinary rounding.

### Completion time

For each task report the median completion time for `SUCCESS` records with valid timing data. For a small sample, also report the observed range rather than implying population precision.

Do not impute missing task times.

### Assistance

Report, at minimum:

- number/rate of valid task attempts requiring one or more counted assists;
- total assistance interventions by task where useful.

### Recoverable errors

Report, at minimum:

- total recoverable-error episodes by task;
- median recoverable errors per valid attempt where useful.

Do not collapse these task metrics into a single unsupported overall `usability percentage`.

## 27. Missing, invalid and withdrawn data

1. Exclude `INVALID_ENVIRONMENT`, `WITHDRAWN` and `NOT_RUN` records from valid completion-rate denominators.
2. Report how many records were excluded and why.
3. Do not replace missing task results with failures or successes.
4. Do not impute missing task times.
5. Retain a valid completion status if only timing was lost through observer error.
6. If a participant withdraws, follow the approved ethics procedure for retention/deletion of any data already collected.
7. If the ethics procedure requires deletion after withdrawal, repository summaries must also respect that requirement.

## 28. Participant privacy and study data

Until the ethics gate is explicitly passed, collect nothing from real participants.

If later permitted:

- use anonymous participant IDs such as `P01`, `P02`, ...;
- use synthetic/de-identified study records;
- do not use participant personal CVs or study documents by default;
- do not request personal Gemini/API keys;
- keep direct identifiers out of Git;
- keep raw participant material out of Git by default;
- store only the data classes and retention period allowed by the recorded ethics/module/supervisor conditions;
- ensure participant state is isolated from other participants.

## 29. Task wording discipline

The task prompts intentionally describe user goals without giving step-by-step UI instructions.

The moderator must not add route names, button names or control locations unless a counted directional assist is provided.

If a participant asks what a task means, the moderator may restate the goal in neutral terms without naming the UI path.

## 30. Reproducibility record required at study time

Before the first participant task is run, record:

```text
protocol_version
ethics_gate_status_and_reference
executable_checkpoint
repository/main identity
browser_name_and_version
device_and_viewport
browser_zoom
evaluation_date
study_fixture_version
study_account_reset_method
Gemini model/configuration identity without secret values
```

If the executable product changes after collection begins, do not silently pool old/new records. Record the new baseline and determine whether affected tasks must be repeated under the change-control process.

## 31. Report-ready claim boundaries

If later evidence is genuinely collected under this protocol, safe report wording may take forms such as:

> Task-based usability evaluation used five predefined Career Learning Hub tasks covering access/navigation, Resume Studio, Interview Coach, grounded Learning and study-material workflows. Completion status, time, recoverable errors and moderator assistance were recorded under a frozen protocol.

After results exist, report the actual observed counts/rates and sample size.

Do not state, solely from this protocol or its task results, that:

- Career Learning Hub is universally easy to use;
- the participant sample represents all students/job seekers;
- a task-success rate is an AI-accuracy score;
- task success proves learning effectiveness;
- task success proves full accessibility conformance;
- task success predicts employment outcomes;
- a small convenience sample supports broad population claims.

## 32. Relationship to SUS

This task protocol does not administer or score SUS.

If Phase 20B-4 later authorizes SUS and the ethics gate permits questionnaires, administer SUS only under that separate frozen procedure after the approved system/task exposure.

A SUS result is a score from `0–100`, not a percentage, and must not be substituted for the task-performance metrics defined here.

## 33. Relationship to accessibility evaluation

Accessibility-oriented engineering behaviour and participant task performance do not establish full WCAG conformance.

Phase 20B-6 must separately define the selected accessibility evaluation protocol and its own `PASS / FAIL / NOT ASSESSED` evidence.

An approved accommodation provided during this usability study is not itself a usability error or counted moderator assistance.

## 34. Relationship to AI-quality evaluation

U2 and U4 exercise AI-backed user workflows for usability purposes only.

This protocol asks whether participants can operate and interpret the relevant UI workflow, not whether Gemini output is correct, truthful, relevant or high quality.

Resume, Interview and Learning AI-output quality must be evaluated separately under Phase 20B-7 with frozen cases and feature-specific rubrics.

## 35. Change control

If participant execution later reveals a probable product defect:

1. preserve the observation as collected;
2. do not modify Career Learning Hub on the evaluation branch;
3. determine whether the affected task can continue meaningfully;
4. use a separate bounded product-repair branch after explicit authorization;
5. reproduce, repair and qualify the defect through the normal project workflow;
6. merge only after exact-head approval;
7. record the new executable baseline;
8. repeat only the affected evidence required for comparability;
9. document which results belong to which executable/protocol baseline.

## 36. Phase 20B-3 completion criteria

The 20B-3 documentation slice is complete only when:

1. this protocol exists and contains all five fixed tasks;
2. every task has a participant-facing prompt, primary outcome and explicit `SUCCESS / PARTIAL / FAILED` rules;
3. the 10-minute timing convention is frozen;
4. recoverable-error and assistance definitions are explicit;
5. observer instructions are explicit;
6. environment and reset rules are explicit;
7. invalid/withdrawn/not-run records cannot be misclassified as failures;
8. privacy/ethics boundaries remain intact;
9. SUS, accessibility and AI-quality evaluation remain separate;
10. no participant data/results are invented or collected;
11. changed repository files remain documentation-only;
12. local `git diff --check origin/main...HEAD` passes;
13. non-documentation changed-path check is empty;
14. final local worktree is clean;
15. PR creation and merge remain separate explicit approval gates.

## 37. Current authorization boundary

The user authorization for this slice covers only:

`APPROVE PHASE 20B-3 — TASK-BASED USABILITY EVALUATION PROTOCOL`

Authorized work:

- create this task-based usability protocol;
- update current Phase 20B planning/progress documentation to identify 20B-3 as the current bounded slice.

Not authorized:

- participant recruitment or data collection;
- usability session execution;
- SUS administration;
- participant/sample plan execution;
- accessibility campaign execution;
- AI-quality evaluation;
- synthetic fixture creation;
- evaluation-result population;
- application/test/package/config changes;
- deployment;
- PR creation before local qualification and explicit approval;
- merge;
- branch deletion.
