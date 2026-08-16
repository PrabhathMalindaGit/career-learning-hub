# Phase 20B — Ethics and Participant Safety Gate

## 1. Purpose

This document is the mandatory precondition for any participant-facing Career Learning Hub evaluation activity in Phase 20B.

The project intends to evaluate usability and may later use participant questionnaires such as SUS. However, the available project evidence does **not** establish whether PUSL3190 requires formal ethics approval, supervisor approval, module-specific consent documentation, or another review route before participant recruitment or data collection.

Accordingly, no participant-facing evaluation activity may begin until the authoritative module/supervisor requirements are confirmed and recorded here.

## 2. Current gate status

`BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION`

This status is deliberate. It does not indicate that participant evaluation is prohibited permanently; it indicates that the project does not currently have sufficient evidence to claim that participant recruitment/data collection is authorized.

Absence of a known requirement is **not** treated as approval.

## 3. Activities blocked while this gate is unresolved

Until this gate is marked `PASSED`, do not:

- recruit participants;
- invite classmates, friends, students, graduates, job seekers or any other people to take part in a formal or pilot study;
- run an observed usability task session with a real participant;
- collect questionnaire or survey responses;
- administer or collect SUS responses;
- conduct participant interviews or focus groups;
- record participant screen/video/audio;
- collect participant think-aloud commentary;
- create participant observation notes tied to a real person;
- collect participant demographic data;
- ask participants to upload real CVs/resumes, employment history, private study documents or other personal files;
- ask participants to supply or enter a real personal Gemini/API credential;
- commit participant-derived raw data to Git;
- report any participant count, usability result, SUS score, preference percentage or qualitative finding as though the study occurred.

A developer/student self-check of the application is not automatically participant research, but it must not be relabelled as an independent usability study.

## 4. Decisions that must be confirmed

The student must obtain and record authoritative direction for every item below before the gate can pass.

| Decision | Required recorded answer |
|---|---|
| Is formal research/ethics approval required for this PUSL3190 participant evaluation? | `YES` / `NO` plus authoritative source |
| If approval is required, what approval route/reference applies? | Approval body/process/reference/date |
| Is supervisor/module approval required even if formal ethics review is not? | `YES` / `NO` plus source |
| Is a participant information sheet required? | `YES` / `NO` plus required format/location |
| Is written or recorded informed consent required? | `YES` / `NO` plus method |
| Are participants required to be adults? | Minimum age/eligibility rule |
| What participant group is permitted? | Eligibility/inclusion criteria |
| What recruitment channels are permitted? | Approved recruitment route(s) |
| Is compensation/incentive permitted? | `YES` / `NO`; if yes, conditions |
| May screen/video/audio be recorded? | Separate permission for each medium |
| What participant/demographic fields may be collected? | Exact permitted fields |
| What data may be stored for task timing/observations/SUS? | Exact permitted evidence fields |
| Are synthetic/demo Career Learning Hub records required? | `YES` / `NO`; default is `YES` |
| Are real participant resumes/private study files prohibited? | `YES` / `NO`; default is `YES` |
| Are personal API/Gemini keys prohibited? | `YES`; this is the project default regardless of study design |
| What withdrawal mechanism is required? | Procedure/deadline/effect on retained data |
| What retention period applies? | Exact period or module rule |
| Where may raw evaluation data be stored? | Approved storage location/access rule |
| May anonymized/aggregated results appear in the university report? | `YES` / `NO` plus conditions |
| May anonymized/aggregated evidence be committed to the repository? | `YES` / `NO` plus data classes |

## 5. Default privacy and safety design

Unless authoritative module/ethics guidance requires a stricter rule, later approved evaluation should use the following defaults.

### 5.1 Participant identity

Use anonymous study identifiers only:

```text
P01
P02
P03
...
```

Do not place participant names, email addresses, phone numbers, student numbers, social-media handles, employer details or other direct identifiers in repository evaluation files.

A separately protected recruitment/contact list may be required operationally, but it must remain outside Git and follow the approved data-management procedure.

### 5.2 Evaluation account and content

Prefer a dedicated evaluation environment/account populated with synthetic or de-identified demonstration content.

Participants should not need to expose their own:

- resume/CV;
- employment history;
- address/contact details;
- interview records;
- academic notes or private PDFs;
- personal Gemini/API credential.

If a future approved protocol permits real participant documents, that must be an explicit ethics/data-management decision rather than an assumption.

### 5.3 Gemini/API credentials

Participants must never be asked to disclose a personal Gemini/API secret to the researcher/evaluator.

If live AI evaluation needs Gemini access, use the existing authorized application-managed/evaluation configuration or another explicitly approved controlled arrangement. Do not record or expose credentials in observation notes, screenshots, exports, URLs, browser storage or Git.

### 5.4 Raw versus derived evidence

Treat raw participant evidence as more sensitive than derived summary evidence.

Examples of raw evidence:

- completed questionnaires;
- timestamps tied to participant IDs;
- observation notes;
- recordings;
- free-text feedback;
- demographic responses.

Examples of derived evidence:

- task-success counts;
- anonymized timing summaries;
- calculated SUS scores;
- aggregate descriptive statistics;
- categorized themes stripped of identifying information.

Only the data classes explicitly permitted by the approved procedure should be placed in the repository.

## 6. Consent principles for later approved work

If consent is required, participation must be voluntary and participants should understand, before beginning:

- what Career Learning Hub is;
- what tasks they will perform;
- the approximate session duration;
- what data will be collected;
- whether any recording occurs;
- how their data will be stored and used;
- that AI-generated content may be imperfect;
- that the study is academic evaluation rather than career, hiring or educational advice;
- whether and how they may withdraw;
- researcher/supervisor contact route required by the module.

Do not use pre-ticked consent, hidden recording, or collection beyond the stated protocol.

## 7. Risk controls for the proposed usability study

Later task-based usability evaluation should be designed to minimize foreseeable privacy and participant burden.

Required controls unless superseded by stricter guidance:

1. Use synthetic/de-identified Resume, Interview and Learning content.
2. Avoid questions asking participants to disclose sensitive employment/academic history.
3. Avoid real hiring/employment decisions; Interview feedback remains practice guidance only.
4. Avoid presenting Resume assessment as employer ATS equivalence.
5. Avoid presenting grounded Learning output as guaranteed factual truth.
6. Do not require participants to install software or grant unrelated permissions.
7. Keep sessions bounded and allow participants to stop at any time permitted by the approved procedure.
8. Do not pressure participants to complete a failed task; failure is valid evaluation evidence.
9. Do not silently alter task success criteria after observing results.
10. Do not expose other users' data during evaluation.

## 8. Gate-closing evidence

This gate may be marked `PASSED` only when the student adds a dated decision record containing:

```text
Decision date:
Authoritative source/person:
Formal ethics approval required: YES/NO
Approval/reference (if applicable):
Supervisor/module approval condition:
Participant eligibility:
Recruitment method:
Consent requirement:
Recording permission:
Permitted data fields:
Synthetic/demo-data requirement:
Withdrawal procedure:
Retention/deletion rule:
Approved raw-data storage location:
Repository/report publication boundary:
Additional conditions:
```

If formal approval is required, the study must not begin until the required approval is actually granted. A submitted/pending application does not close the gate unless the module explicitly permits work to begin while pending.

## 9. Gate states

Use only these states:

- `BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION`
- `BLOCKED / APPROVAL REQUIRED AND PENDING`
- `PASSED / PARTICIPANT EVALUATION MAY PROCEED UNDER RECORDED CONDITIONS`
- `NOT APPROVED / PARTICIPANT EVALUATION MUST NOT PROCEED`

Do not invent intermediate labels that imply approval.

## 10. Current Phase 20B-0 result

At creation of this document:

`BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION`

No participant recruitment or participant data collection is claimed.

The next valid action for this gate is to obtain authoritative PUSL3190/supervisor direction and record it before any participant-facing Phase 20B usability/SUS work.