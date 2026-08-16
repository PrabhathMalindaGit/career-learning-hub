# Phase 20B-6 — Selected Accessibility Evaluation Protocol

## 1. Purpose

This document freezes a bounded accessibility-evaluation method for Career Learning Hub under Objective O7.

It is designed to produce reproducible evidence about selected accessibility-oriented behaviours in critical workflows. It is **not** a complete accessibility audit and must not be reported as formal WCAG conformance or certification.

This document defines method only. It contains no accessibility results.

## 2. Protocol identity and status

- Protocol: `PHASE 20B-6 — SELECTED ACCESSIBILITY EVALUATION PROTOCOL`
- Version: `1.0`
- Status: `FROZEN METHOD DESIGN / EVALUATION NOT YET EXECUTED`
- Phase 20B evidence stream: `C — SELECTED ACCESSIBILITY EVIDENCE`
- Branch base for this documentation slice: `main @ 7142e6dde8281db1852d365989f25c4d10e5265b`
- Current qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Master protocol: `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md`

## 3. Evaluation question

The protocol answers:

> Do selected critical Career Learning Hub workflows exhibit the keyboard, focus, form, status, zoom/reflow and responsive-navigation behaviours chosen for the final university evaluation?

The result may support bounded statements about the checks actually performed. It does not establish complete conformance across every page, state, assistive technology, browser or accessibility requirement.

## 4. Scope

The selected evaluation covers these areas:

1. authentication forms;
2. application shell and navigation;
3. Resume Studio critical edit/save/dialog flows;
4. Interview Coach question/attempt/dialog flows;
5. Learning Workspace document/chat/flashcard/quiz flows;
6. Settings/Gemini controls.

The behavioural categories are:

- keyboard-only operation;
- visible focus and logical focus movement;
- dialog focus management and escape/close behaviour;
- labels/instructions and understandable control naming;
- validation/error identification;
- status/error communication;
- text resize and 200% zoom/reflow;
- reduced-width/responsive navigation;
- preservation of critical functionality under those conditions.

## 5. Explicit non-scope

This protocol does not claim or require:

- a complete WCAG conformance audit;
- accessibility certification;
- formal assistive-technology coverage for every screen reader/browser combination;
- automated accessibility-scanner certification;
- colour-vision simulation as proof of conformance;
- participant disability research;
- accessibility-related participant recruitment;
- application code changes;
- production deployment.

If later evidence identifies a probable defect, record it and use a separate approved repair branch.

## 6. Evaluation environment

Record the actual environment when execution is later authorized.

Default environment for protocol version `1.0`:

- approved Career Learning Hub evaluation baseline;
- Google Chrome stable on desktop/laptop;
- normal viewport approximately `1440 × 900` at `100%` zoom for baseline checks;
- browser zoom changed to `200%` for resize/reflow checks;
- a reduced-width viewport for responsive-navigation checks;
- keyboard-only interaction for keyboard/focus checks;
- standard pointing device may be used only for checks not specifically designated keyboard-only;
- synthetic/de-identified study data;
- study-managed Gemini configuration if a checked state requires AI-backed content;
- no personal API keys or private participant documents.

Record:

```text
executable_checkpoint
protocol_version
evaluation_date
browser_name
browser_version
operating_system
viewport
zoom_level
fixture_version
notes
```

## 7. Result scale

Every accessibility check uses exactly:

```text
PASS
FAIL
NOT ASSESSED
```

### PASS

The observed behaviour matches the frozen expected result for the complete check procedure.

### FAIL

At least one required expected behaviour is not met during the check.

Do not convert a partial result into `PASS`.

### NOT ASSESSED

Use when the check could not be meaningfully completed, including unavailable prerequisite state, environment failure, or a deliberately omitted check.

Do not relabel `NOT ASSESSED` as `PASS` or exclude it silently from reporting.

## 8. Evidence record

Phase 20B-9 will later create the machine-readable template. It must preserve at least:

```text
check_id
protocol_version
screen_or_route
category
procedure
expected_result
observed_result
result_status
evidence_reference
notes
```

Observation text must describe what was actually seen or experienced during the procedure.

## 9. General execution rules

1. Start each check from a documented state.
2. Follow the frozen procedure in order.
3. Do not repair the product during the evaluation campaign.
4. Record failures even if a workaround exists.
5. Record `NOT ASSESSED` when prerequisites are unavailable.
6. Do not infer accessibility from automated tests alone.
7. Do not infer a failure from personal preference if the expected behaviour was satisfied.
8. Preserve screenshots or other evidence references only when permitted and useful.
9. Keep result collection separate from later interpretation.

## 10. Keyboard and focus checks

### A-01 — Authentication keyboard operation

**Screen:** Login

**Procedure:** Starting at the browser content area, use keyboard navigation only to reach email, password and submit controls, enter valid study credentials and submit.

**Expected result:** All required controls are reachable and operable without a pointing device; keyboard focus is visible while moving between interactive controls.

### A-02 — Registration keyboard operation

**Screen:** Registration

**Procedure:** Use keyboard navigation only through the required registration fields and action controls using synthetic study data.

**Expected result:** Required inputs and actions are reachable and operable in a coherent order with visible focus.

### A-03 — Application shell keyboard navigation

**Screen:** Authenticated shell

**Procedure:** Use keyboard navigation only to move through the primary application navigation and activate at least Dashboard, Resume, Interview, Learning and Settings destinations.

**Expected result:** Destinations are keyboard reachable and activatable; focus remains visible and does not become trapped in navigation chrome.

### A-04 — Resume primary controls

**Screen:** Resume Studio

**Procedure:** Use keyboard-only navigation to reach primary edit/save/version/design/assessment-related controls present in the prepared state.

**Expected result:** Critical controls can be reached and activated without requiring pointer-only interaction.

### A-05 — Interview primary controls

**Screen:** Interview Coach

**Procedure:** Use keyboard-only navigation through prepared question controls, answer input/action controls and attempt-history access.

**Expected result:** The critical practice workflow is operable by keyboard in a coherent focus order.

### A-06 — Learning primary controls

**Screen:** Learning Workspace

**Procedure:** Use keyboard-only navigation between the prepared document areas and the critical chat/flashcard/quiz controls.

**Expected result:** The critical study workflow remains reachable and operable without pointer-only interaction.

### A-07 — Settings controls

**Screen:** Settings/Gemini

**Procedure:** Use keyboard-only navigation to reach the principal account/session and Gemini/settings controls available in the prepared configuration.

**Expected result:** Critical settings controls are keyboard reachable, visible in focus and operable where enabled.

## 11. Dialog and focus-management checks

### A-08 — Modal/dialog entry focus

**Area:** Any representative critical modal/dialog used by Resume, Interview, Learning or Settings

**Procedure:** Open the prepared modal/dialog using keyboard interaction.

**Expected result:** Focus moves into the active dialog or otherwise lands on an appropriate interactive element associated with it; background interaction is not accidentally required to continue.

### A-09 — Dialog keyboard containment

**Procedure:** With the representative dialog open, navigate through its interactive controls using keyboard only.

**Expected result:** Focus does not disappear behind the modal and the user can reach all required dialog actions without pointer use.

### A-10 — Dialog close and focus return

**Procedure:** Close the representative dialog using an available keyboard-operable close/cancel action.

**Expected result:** The dialog closes predictably and focus returns to a sensible location in the underlying workflow rather than being lost.

## 12. Form label, instruction and validation checks

### A-11 — Login labels and errors

**Procedure:** Inspect the login fields and intentionally submit an invalid/empty state.

**Expected result:** Inputs have understandable visible or programmatically associated naming; the error state identifies what needs correction without relying only on colour.

### A-12 — Resume form labels

**Procedure:** Inspect representative Resume edit fields in the prepared synthetic Resume.

**Expected result:** Field purpose is understandable from labels/instructions and required interactions do not depend on placeholder text alone.

### A-13 — Interview answer instructions

**Procedure:** Inspect representative multiple-choice and written-answer controls.

**Expected result:** The participant can determine what input/action is expected from visible labels/instructions and control naming.

### A-14 — Learning chat input instructions

**Procedure:** Inspect the Grounded Chat input/action state and trigger a representative validation state if available without changing product code.

**Expected result:** Input purpose and submission action are understandable; validation or unavailable-state feedback is identifiable.

### A-15 — Settings credential/status controls

**Procedure:** Inspect the prepared Gemini/settings state without exposing secrets.

**Expected result:** Control purpose and current status are understandable from labels/status text; secret values are not required to interpret the interface.

## 13. Status and feedback checks

### A-16 — Background AI job status

**Area:** Representative Resume or Learning AI operation

**Procedure:** Trigger a prepared permitted operation and observe the progress/status lifecycle where practical.

**Expected result:** The interface communicates meaningful progress/result/error state without requiring the user to infer completion solely from visual layout change.

### A-17 — Error communication

**Area:** Representative safe validation/error state

**Procedure:** Trigger a non-destructive validation error.

**Expected result:** The error is communicated in understandable text and the affected interaction can be identified.

### A-18 — Save/confirmation feedback

**Area:** Representative Resume or Interview save operation

**Procedure:** Complete the prepared save action.

**Expected result:** The interface communicates the resulting saved/updated state clearly enough to determine that the action completed.

## 14. 200% zoom and reflow checks

Perform the following checks at browser zoom `200%` using the same desktop browser environment.

### A-19 — Authentication at 200%

**Procedure:** Open login and registration surfaces at 200% zoom.

**Expected result:** Critical text and controls remain readable and usable; essential content is not clipped in a way that prevents completion.

### A-20 — Application shell at 200%

**Procedure:** Navigate Dashboard and primary application navigation at 200% zoom.

**Expected result:** Primary navigation and core content remain usable without overlapping controls that block critical interaction.

### A-21 — Resume at 200%

**Procedure:** Open the prepared Resume workflow at 200% zoom and exercise representative edit/save navigation.

**Expected result:** Critical editing and save controls remain reachable and understandable; essential content is not hidden by overlap.

### A-22 — Interview at 200%

**Procedure:** Open the prepared Interview workflow at 200% zoom.

**Expected result:** Questions, answer inputs and primary actions remain usable and readable.

### A-23 — Learning at 200%

**Procedure:** Open the prepared Learning document/chat/flashcard/quiz areas at 200% zoom.

**Expected result:** Critical study controls remain readable and operable without essential content being obscured by layout collisions.

### A-24 — Settings at 200%

**Procedure:** Open Settings/Gemini at 200% zoom.

**Expected result:** Critical status and configuration controls remain readable and usable.

## 15. Reduced-width responsive-navigation checks

Use a consistent reduced-width browser viewport defined by the later execution record. The exact numeric viewport used must be recorded before the campaign begins and kept consistent for comparable checks.

### A-25 — Reduced-width primary navigation

**Procedure:** At the frozen reduced-width viewport, open authenticated navigation and reach Dashboard, Resume, Interview, Learning and Settings.

**Expected result:** Primary destinations remain discoverable and operable; navigation is not blocked by clipped/overlapping controls.

### A-26 — Resume reduced-width critical flow

**Procedure:** Open the prepared Resume workflow at the reduced width and reach representative edit/save/assessment controls.

**Expected result:** Critical controls remain usable without horizontal layout failures that prevent task completion.

### A-27 — Interview reduced-width critical flow

**Procedure:** Open the prepared Interview workflow at reduced width and exercise question/answer/attempt access.

**Expected result:** Critical controls remain readable and operable.

### A-28 — Learning reduced-width critical flow

**Procedure:** Open prepared document/chat/flashcard/quiz areas at reduced width.

**Expected result:** Critical study controls remain readable and operable.

### A-29 — Settings reduced-width critical flow

**Procedure:** Open Settings/Gemini at reduced width.

**Expected result:** Critical status/actions remain accessible without blocked interaction.

## 16. Evidence-summary method

After real checks are completed, report:

- total number of frozen checks;
- count of `PASS`;
- count of `FAIL`;
- count of `NOT ASSESSED`;
- failed check IDs and concise observed failure descriptions;
- environment/protocol version;
- relevant limitations.

A simple selected-check pass rate may be calculated only as:

```text
selected_check_pass_rate = PASS / (PASS + FAIL)
```

if the denominator and excluded `NOT ASSESSED` count are disclosed.

Do not call that value a WCAG conformance percentage.

## 17. Claim boundaries

Allowed bounded statement after actual evidence exists:

> Career Learning Hub was evaluated against a frozen set of selected keyboard, focus, form, status, 200%-zoom/reflow and reduced-width checks across critical workflows; X checks passed, Y failed and Z were not assessed under the recorded environment.

Do not claim from this protocol/results alone that:

- Career Learning Hub is WCAG compliant;
- the application is fully accessible;
- every screen is keyboard accessible;
- all assistive technologies are supported;
- no accessibility defects remain.

## 18. Change control

After the first accessibility result is collected under version `1.0`, do not alter check procedures or expected results to improve outcomes.

If a material protocol change is required:

1. create a new protocol version;
2. preserve the earlier observations;
3. identify which checks/results belong to which version;
4. do not silently pool incompatible evidence.

## 19. Completion condition for Phase 20B-6 method design

The method-design portion of Phase 20B-6 is complete when:

1. selected screens/categories are frozen;
2. each check has an ID, procedure and expected result;
3. the `PASS / FAIL / NOT ASSESSED` scale is frozen;
4. environment/evidence fields are defined;
5. summary calculations and claim boundaries are explicit;
6. no accessibility result is invented;
7. product repairs remain separate from evaluation evidence.