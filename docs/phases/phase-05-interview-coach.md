# Phase 5 — Interview Coach

Phase 5 adds secure interview sessions, question libraries, written
attempts, AI question generation, question explanations, and structured
written-answer feedback.

## Requirements

The Phase 2–4 requirements still apply:

- Node.js 20 or later
- MongoDB Atlas or a local MongoDB replica set
- A configured Gemini key for AI generation and feedback
- The Phase 3 MongoDB job worker enabled

Configure:

```env
INTERVIEW_MAX_QUESTIONS_PER_SESSION=500
INTERVIEW_MAX_ANSWER_CHARACTERS=12000
INTERVIEW_AI_JOB_MAX_ATTEMPTS=3
JOB_WORKER_ENABLED=true
GEMINI_API_KEY=your_key
```

Install and run:

```bash
npm install
npm run dev:api
npm run dev:web
```

All Interview Coach routes require:

```text
Authorization: Bearer <access-token>
```

## Security and ownership model

Nested routes apply explicit ownership middleware in this order:

1. Verify the access token.
2. Validate MongoDB identifiers.
3. Load the session using both `sessionId` and authenticated `userId`.
4. Load a question or attempt using its ID, session ID, and user ID.

A valid identifier belonging to another account therefore produces the
same not-found response as a missing resource. Questions, notes, answers,
feedback, and attempts are never fetched using an unscoped identifier.

AI endpoints also use per-user rate limits and the shared daily AI quota.

## Session routes

### Create a manual session

```http
POST /api/v1/interview-sessions
Content-Type: application/json
```

```json
{
  "title": "Frontend Engineer Preparation",
  "sourceResumeId": "RESUME_ID",
  "sourceResumeVersionId": "RESUME_VERSION_ID",
  "targetRole": "Frontend Engineer",
  "experienceLevel": "Junior",
  "focusTopics": [
    "React",
    "JavaScript",
    "Accessibility"
  ],
  "skillGaps": [
    "Testing",
    "System design"
  ],
  "jobDescription": "Paste the target job description here.",
  "mode": "written-practice",
  "manualQuestions": [
    {
      "category": "Behavioral",
      "difficulty": "medium",
      "question": "Describe a difficult technical decision.",
      "modelAnswer": "Use a truthful STAR-style answer."
    }
  ]
}
```

Resume and version ownership are checked before the session is created.
The version must belong to the supplied resume.

Supported modes:

- `study`
- `written-practice`
- `mock-interview`

### List sessions

```http
GET /api/v1/interview-sessions?page=1&limit=20&status=active
```

### Fetch a session

```http
GET /api/v1/interview-sessions/:sessionId
```

### Change session status

```http
PATCH /api/v1/interview-sessions/:sessionId/status
```

```json
{
  "status": "completed"
}
```

Supported statuses are `active`, `completed`, and `archived`. Completing
a session records an `interview.session.completed` activity event.

## Question routes

### Add a manual question

```http
POST /api/v1/interview-sessions/:sessionId/questions
```

```json
{
  "category": "Technical",
  "difficulty": "medium",
  "question": "How would you reduce unnecessary React renders?",
  "modelAnswer": "Discuss measurement, component boundaries, memoization, and state placement."
}
```

### List questions with pagination

```http
GET /api/v1/interview-sessions/:sessionId/questions?page=1&limit=20
```

Optional filters:

```text
pinned=true
difficulty=hard
category=Technical
```

List responses deliberately omit model answers and explanations.

### Fetch one question

```http
GET /api/v1/interview-sessions/:sessionId/questions/:questionId
```

Model answers are visible immediately in `study` mode. In practice modes,
they remain hidden until an explanation has been generated.

### Pin or unpin

```http
PATCH /api/v1/interview-sessions/:sessionId/questions/:questionId/pin
```

```json
{
  "isPinned": true
}
```

### Save private notes

```http
PATCH /api/v1/interview-sessions/:sessionId/questions/:questionId/notes
```

```json
{
  "notes": "Review useMemo versus useCallback before retrying."
}
```

Sending an empty string clears the notes.

## AI question generation

```http
POST /api/v1/interview-sessions/:sessionId/questions/generate
```

```json
{
  "requestId": "CLIENT_GENERATED_UUID",
  "resumeVersionId": "OPTIONAL_OWNED_RESUME_VERSION_ID",
  "count": 10,
  "categories": [
    "Technical",
    "Behavioral"
  ],
  "difficultyMix": {
    "easy": 2,
    "medium": 5,
    "hard": 3
  }
}
```

`requestId` is an idempotency key. Repeating the same request does not
create another generation job.

The worker combines:

- the selected owned ResumeVersion;
- target role and experience level;
- the session job description;
- focus topics;
- identified skill gaps.

The Gemini response is accepted only when it passes the strict Zod schema.

Duplicate detection uses:

1. Unicode normalization;
2. lowercase conversion;
3. punctuation and symbol removal;
4. whitespace normalization;
5. a SHA-256 fingerprint;
6. a unique MongoDB index per session.

Duplicates inside the generated response and questions already present in
the session are skipped. Question insertion and question-count updates run
in a MongoDB transaction.

The endpoint returns `202 Accepted`. Poll:

```http
GET /api/v1/jobs/:jobId
```

A completed job returns:

```json
{
  "insertedCount": 8,
  "duplicateCount": 2,
  "questionIds": []
}
```

## Question explanation

```http
POST /api/v1/interview-sessions/:sessionId/questions/:questionId/explanation
```

The response is either:

- `200 OK` when an explanation already exists; or
- `202 Accepted` with a job ID.

The structured AI result contains an explanation, key points, and a
general model-answer framework. It is not permitted to invent candidate
experience.

## Written attempts

### Record an attempt

```http
POST /api/v1/interview-sessions/:sessionId/questions/:questionId/attempts
```

```json
{
  "answerText": "My written practice answer..."
}
```

Recording an attempt does not automatically spend AI quota.

### List attempt history

```http
GET /api/v1/interview-sessions/:sessionId/attempts?page=1&limit=20
```

Optional filters:

```text
questionId=QUESTION_ID
status=feedback-completed
```

### Fetch one attempt

```http
GET /api/v1/interview-sessions/:sessionId/attempts/:attemptId
```

## AI answer feedback

```http
POST /api/v1/interview-sessions/:sessionId/attempts/:attemptId/feedback
```

The feedback worker evaluates:

- relevance to the question;
- answer structure;
- clarity;
- evidence;
- completeness;
- target role and experience level;
- job description, focus topics, and skill gaps.

The strict result contains:

```json
{
  "score": 78,
  "summary": "Overall assessment",
  "strengths": [],
  "improvements": [],
  "suggestedAnswerOutline": []
}
```

Feedback status is stored on the attempt:

- `recorded`
- `feedback-queued`
- `feedback-processing`
- `feedback-completed`
- `feedback-failed`

Failures are written to the attempt and to the shared job record. The job
system applies the configured retry policy.

## Frontend scaffold

```text
frontend/src/features/interviews/
├── InterviewDashboard.tsx
├── SessionSetup.tsx
├── QuestionPractice.tsx
├── AttemptHistory.tsx
├── interviewApi.ts
├── interviewCoach.css
├── types.ts
└── index.ts
```

The scaffold provides:

- session setup forms;
- question practice layout;
- pin and notes interaction points;
- written-answer recording;
- explanation and feedback action points;
- attempt-history cards;
- typed API wrappers.

It uses local placeholder state so the visual structure can run before the
shared authentication provider and server-state library are integrated.

## Suggested end-to-end test

1. Register and obtain an access token.
2. Create a Resume and ResumeVersion, or omit the resume source.
3. Create an InterviewSession.
4. Add a manual question.
5. Generate an AI question set and poll the returned job.
6. List questions and pin one.
7. Save notes.
8. Record a written attempt.
9. Request feedback and poll the job.
10. Fetch the attempt and verify the structured feedback.
11. Sign in as a second user and confirm all first-user IDs return 404.
