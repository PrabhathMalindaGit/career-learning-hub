# Phase 20B-4 — System Usability Scale (SUS) Evaluation Protocol

## 1. Purpose

This document freezes the System Usability Scale (SUS) procedure that may later be used as one component of Career Learning Hub usability evaluation under Objective O7.

This is **method design only**. It does not contain participant responses, a SUS result, a participant count, or permission to administer the questionnaire.

## 2. Protocol identity and status

- Protocol: `PHASE 20B-4 — SUS EVALUATION PROTOCOL`
- Version: `1.0`
- Status: `FROZEN METHOD DESIGN / PARTICIPANT ADMINISTRATION BLOCKED`
- Phase 20B evidence stream: `B — PARTICIPANT USABILITY EVIDENCE`
- Branch base for this documentation slice: `main @ 7142e6dde8281db1852d365989f25c4d10e5265b`
- Current qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Master protocol: `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md`
- Task-based usability protocol: `docs/evaluation/USABILITY_EVALUATION_PROTOCOL.md`
- Ethics gate: `docs/evaluation/PHASE_20B_ETHICS_AND_PARTICIPANT_SAFETY_GATE.md`

The ethics gate currently remains:

```text
BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION
```

Therefore this protocol must not yet be administered to real participants.

## 3. Evaluation question

If participant questionnaires are later permitted, SUS answers the bounded question:

> How do permitted study participants rate the perceived usability of Career Learning Hub after completing the approved exposure/task procedure?

SUS is a perceived-usability instrument. It does not establish task effectiveness, accessibility conformance, AI factual quality, learning improvement, employment outcomes, or population-wide acceptance.

## 4. Preconditions before administration

SUS may be administered only when all applicable conditions are satisfied:

1. the ethics/module/supervisor gate is explicitly passed under recorded conditions;
2. Phase 20B-5 has frozen the permitted participant/sample plan;
3. the participant has completed the approved Career Learning Hub study exposure defined for the evaluation campaign;
4. the exact SUS wording and response scale in this protocol are used unchanged;
5. Phase 20B-9 has provided the frozen evidence-collection template;
6. the questionnaire is administered before any debrief discussion likely to influence responses;
7. participant withdrawal and missing-data rules follow the approved ethics procedure.

No SUS score exists until real responses are collected under those conditions.

## 5. Administration timing

For the planned Career Learning Hub participant study, administer SUS **once after the participant has completed the approved U1–U5 task sequence or the permitted equivalent exposure for that campaign**.

Do not administer SUS after each individual task.

If a participant is unable to complete every valid task, they may still complete SUS if the approved study procedure permits it and they received sufficient system exposure. Their task results and SUS response remain separate evidence and must not be altered to agree with each other.

## 6. Participant instructions

Use a neutral instruction such as:

> Please rate each statement from 1 to 5 based on your experience using Career Learning Hub during this session. There are no right or wrong answers. Please choose the response that best reflects your own view.

Do not explain which answers would increase or decrease the SUS score.

Do not coach participants toward positive responses.

## 7. Response scale

Use exactly this five-point scale for all ten items:

| Value | Response |
|---:|---|
| 1 | Strongly disagree |
| 2 | Disagree |
| 3 | Neither agree nor disagree |
| 4 | Agree |
| 5 | Strongly agree |

Do not reverse the visual order for negatively worded items.

## 8. Standard SUS items

Use the ten items in this exact order:

1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to be able to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

Do not paraphrase the items, replace `system` with feature-specific wording, omit items, or add scored custom questions to the SUS total.

Any optional non-SUS feedback questions, if later authorized, must be stored and analysed separately.

## 9. Raw response record

When collection is later authorized, preserve at least these logical fields:

```text
participant_id
sus_protocol_version
administration_status
item_1
item_2
item_3
item_4
item_5
item_6
item_7
item_8
item_9
item_10
individual_sus_score
notes
```

Phase 20B-9 will define the machine-readable template. It must preserve these semantics.

Use anonymous participant IDs such as `P01`. Do not place names, emails, student IDs, phone numbers or other direct identifiers in repository evaluation records by default.

## 10. Administration status

Use exactly one of:

```text
VALID
INVALID_RESPONSE
WITHDRAWN
NOT_RUN
```

### VALID

All ten responses are present and each value is an integer from 1 through 5.

### INVALID_RESPONSE

Use when the questionnaire was submitted but cannot be scored under this protocol, including:

- one or more missing SUS items;
- a response outside the 1–5 scale;
- duplicated/ambiguous response data that cannot be resolved from the original record.

Do not impute or guess missing SUS responses.

### WITHDRAWN

Use when the participant withdraws under the approved procedure before the SUS record is complete.

Do not calculate a SUS score unless the approved withdrawal procedure explicitly permits retention and all ten item responses were validly completed before withdrawal.

### NOT_RUN

Use when SUS was not administered for a documented procedural reason.

Do not fabricate questionnaire values for `NOT_RUN` records.

## 11. Individual SUS scoring

Calculate an individual SUS score only for `VALID` records.

For odd-numbered items `1, 3, 5, 7, 9`:

```text
adjusted_item = response - 1
```

For even-numbered items `2, 4, 6, 8, 10`:

```text
adjusted_item = 5 - response
```

Each adjusted item therefore ranges from `0` to `4`.

Then:

```text
adjusted_sum = sum(all 10 adjusted items)
individual_sus_score = adjusted_sum × 2.5
```

The resulting score ranges from:

```text
0 to 100
```

A SUS score is a **score on a 0–100 scale, not a percentage**.

Example calculation structure only:

```text
Odd-item contributions:  (Q1-1) + (Q3-1) + (Q5-1) + (Q7-1) + (Q9-1)
Even-item contributions: (5-Q2) + (5-Q4) + (5-Q6) + (5-Q8) + (5-Q10)
SUS = (odd contributions + even contributions) × 2.5
```

This protocol does not provide or invent an example participant result.

## 12. Group-level reporting

After actual valid responses exist, report at minimum:

- number of participants with `VALID` SUS records (`n`);
- each anonymized individual SUS score where permitted by the approved data-management procedure;
- arithmetic mean SUS score;
- median SUS score;
- minimum and maximum SUS score;
- number of invalid/not-run/withdrawn records separately.

If the sample is small, emphasize descriptive statistics and the observed sample rather than population-level inference.

Do not report a fabricated confidence interval or significance test merely to make the evaluation appear more advanced.

## 13. Relationship to task-based usability evidence

SUS and the U1–U5 task evidence answer different questions.

Task-based evidence includes observable performance such as:

- task completion status;
- completion time;
- recoverable errors;
- moderator assistance.

SUS records participants' perceived usability after system exposure.

Do not:

- convert task-success rate into a SUS score;
- infer task success from a high SUS score;
- modify SUS responses because task performance was poor;
- exclude a valid SUS record solely because the participant had failed or partial tasks.

Any relationship between task metrics and SUS may be described only if the actual dataset and sample size justify that analysis.

## 14. Missing and invalid data

Rules are frozen as follows:

1. A SUS record with fewer than ten valid item responses is not scored.
2. Missing responses are not replaced by the participant mean, group mean, neutral response, or any other imputed value.
3. Invalid/non-integer values are not silently rounded or repaired.
4. The invalid record remains preserved according to the approved data-management procedure.
5. Invalid records are excluded from SUS mean/median calculations and reported separately.
6. No participant is pressured to provide a missing answer after invoking withdrawal.

## 15. Data integrity and calculation verification

When results are later analysed:

1. preserve the raw 1–5 item responses;
2. calculate scores reproducibly from the raw responses;
3. retain the protocol version associated with every scored record;
4. independently spot-check at least one calculated individual score against the formula;
5. ensure the number of scores used in group statistics equals the number of `VALID` records;
6. do not overwrite raw responses with adjusted values;
7. keep interpretation separate from calculation.

## 16. Claim boundaries

Allowed bounded statement after real evidence exists:

> Participants who completed the approved Career Learning Hub evaluation procedure produced a mean SUS score of X on the standard 0–100 SUS scale (n = Y), with the study limitations reported separately.

The actual values `X` and `Y` must come from real collected evidence.

Do not claim solely from SUS that:

- `X% of users found the system usable`;
- the system is accessible or WCAG compliant;
- the system is effective for all students or job seekers;
- AI outputs are accurate or useful;
- Career Learning Hub improves employability or learning outcomes;
- the sample represents the wider population;
- a high SUS score proves task effectiveness.

## 17. Ethics and privacy boundary

This method does not change the current ethics gate.

Until the gate explicitly passes, do not:

- administer the ten SUS items to real participants for formal/pilot evaluation;
- collect questionnaire responses;
- collect demographic data;
- create participant-linked free-text feedback;
- report a SUS participant count or score.

Raw SUS responses are participant-derived evidence and must follow the approved storage, retention, withdrawal and publication rules once those are known.

## 18. Change-control rule

After the first real SUS response is collected under version `1.0`, do not change item wording, order, response scale, scoring formula, missing-data rule or administration timing for convenience.

If a material change is required, create a new protocol version and identify which records belong to each version. Do not silently pool incompatible administrations.

## 19. Completion condition for Phase 20B-4 method design

The method-design portion of Phase 20B-4 is complete when:

1. the standard ten items and 1–5 scale are frozen;
2. administration timing is frozen;
3. scoring is reproducible;
4. missing/invalid response handling is explicit;
5. reporting rules and claim boundaries are explicit;
6. participant administration remains blocked by the ethics gate;
7. no real SUS result is invented.

Actual SUS collection and results remain later evaluation work.