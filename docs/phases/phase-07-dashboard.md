# Phase 7 — Unified Dashboard and Progress System

Phase 7 adds a private, authenticated dashboard that aggregates actual
records from Resume Studio, Interview Coach, Learning Workspace, quizzes,
the AI Gateway, and the shared ActivityEvent collection.

No random values, synthetic study streaks, estimated engagement scores, or
fabricated progress records are generated.

## Requirements

The Phase 2–6 runtime requirements still apply:

- Node.js 20 or later
- MongoDB Atlas or a local MongoDB replica set
- The existing authentication system
- Existing domain records from Resume Studio, Interview Coach, Learning
  Workspace, and the AI Gateway

Install and run:

```bash
npm install
npm run dev:api
npm run dev:web
```

Every dashboard route requires:

```text
Authorization: Bearer <access-token>
```

Responses use:

```text
Cache-Control: private, no-store
Vary: Authorization, Cookie
```

## Security model

Dashboard routes do not accept a user ID from the client.

The route middleware:

1. authenticates the access token;
2. confirms the loaded active User matches the token subject;
3. derives the dashboard user ID only from `request.auth.userId`;
4. applies a per-user dashboard read rate limit;
5. passes the authenticated user ID to every database query.

Every aggregation begins with a user-scoped filter. The dashboard cannot
request another account's records by changing a URL parameter or request
body.

## Routes

### Complete dashboard overview

```http
GET /api/v1/dashboard
```

Optional query parameters:

```text
windowDays=30
trendLimit=12
activityLimit=15
recentDocumentLimit=6
```

Limits:

- `windowDays`: 7–365
- `trendLimit`: 3–30
- `activityLimit`: 1–50
- `recentDocumentLimit`: 1–20

The response includes all progress metrics plus recent activity.

### Progress metrics without the activity feed

```http
GET /api/v1/dashboard/progress
```

This accepts the same query parameters as the overview route and returns
the same domain metrics without `recentActivity`.

### Paginated chronological activity feed

```http
GET /api/v1/dashboard/activity?page=1&limit=25
```

Optional filters:

```text
type=quiz.completed
origin=worker
resourceType=learning-document
```

The feed is sorted by `occurredAt` descending, followed by `_id` descending
for deterministic pagination.

## Aggregated metrics

### Resume readiness

Data source:

```text
ResumeAnalysis
```

The dashboard returns:

- the latest owned ResumeAnalysis;
- the immediately previous readiness score;
- the real score difference between those two analyses;
- the average score inside the selected date window;
- the number of analyses inside the window;
- the number of distinct resumes analysed inside the window;
- recent analysis scores inside the window.

The latest and previous scores are all-time records. Window averages and
trend points use the requested `windowDays`.

### Interview progress

Data sources:

```text
InterviewSession
InterviewAttempt
```

The dashboard returns:

- written attempts recorded in the selected window;
- feedback-completed attempts in the selected window;
- actual average, best, and latest AI feedback scores;
- active and completed session counts;
- recent scored-attempt points inside the selected window.

Attempts without completed feedback count as attempts but do not receive a
made-up score.

### Learning documents

Data source:

```text
LearningDocument
```

The dashboard returns current counts for:

- total documents;
- uploaded;
- processing;
- ready;
- failed;
- deleting.

It also returns the most recently updated owned documents with their real
processing status, page count, chunk count, and timestamps.

### Quiz performance

Data source:

```text
QuizAttempt
```

Inside the selected window, the dashboard calculates:

- attempt count;
- average score;
- best score;
- latest score;
- total questions answered;
- total correct answers;
- recent attempt score points.

Each value comes from stored, successfully completed QuizAttempt records.

### AI usage

Data source:

```text
UsageEvent
```

Inside the selected window, the dashboard aggregates:

- request count;
- successful requests;
- failed requests;
- input tokens;
- output tokens;
- total tokens;
- average recorded latency;
- estimated cost total;
- number of UsageEvents that actually contain a cost estimate;
- usage grouped by feature;
- daily usage buckets.

`estimatedCostUsd` is not represented as complete billing data unless
`estimatedCostEventCount` shows that the relevant UsageEvents contain cost
estimates.

### Recent activity

Data source:

```text
ActivityEvent
```

The dashboard returns the user's real chronological events, such as:

```text
resume.created
resume.analysis.completed
interview.session.completed
interview.attempt.recorded
interview.attempt.feedback.completed
learning.document.uploaded
learning.document.processed
learning.flashcards.generated
learning.quiz.generated
learning.chat.response.generated
quiz.completed
```

The frontend converts event type strings into readable labels, but it does
not invent activity records.

## Indexes added for dashboard queries

Phase 7 adds or confirms indexes for:

```text
ResumeAnalysis: { userId: 1, createdAt: -1 }
InterviewAttempt: { userId: 1, createdAt: -1 }
InterviewAttempt: { userId: 1, feedback.completedAt: -1 }
QuizAttempt: { userId: 1, completedAt: -1 }
ActivityEvent: { userId: 1, occurredAt: -1 }
ActivityEvent: { userId: 1, origin: 1, occurredAt: -1 }
ActivityEvent: { userId: 1, resourceType: 1, occurredAt: -1 }
UsageEvent: { userId: 1, createdAt: -1 }
```

## Frontend scaffold

```text
frontend/src/features/dashboard/
├── MainDashboard.tsx
├── DashboardLayout.tsx
├── ProgressWidgets.tsx
├── ActivityFeed.tsx
├── dashboardApi.ts
├── dashboard.css
├── types.ts
└── index.ts
```

The scaffold includes:

- selectable 7, 30, 90, and 365-day windows;
- resume, interview, quiz, and AI usage widgets;
- actual interview and quiz score trend rows;
- recent learning-document status cards;
- AI usage details grouped by feature;
- a chronological ActivityEvent feed;
- loading, error, and no-recorded-data states;
- typed API wrappers.

`MainDashboard` accepts an authenticated `accessToken` or server-provided
`initialData`. The current AppShell mounts the component without a token,
so it shows a safe integration state until the shared authentication UI is
connected. It does not display placeholder scores.

## Suggested verification workflow

1. Sign in as User A.
2. Create and analyse a resume.
3. Record interview attempts and complete at least one feedback job.
4. Upload and process a learning document.
5. complete two quizzes with different scores.
6. Trigger AI features that create UsageEvents.
7. Request:

   ```http
   GET /api/v1/dashboard?windowDays=30
   ```

8. Compare each returned count and score against its source collection.
9. Request the paginated activity feed and verify chronological ordering.
10. Sign in as User B and confirm User A's metrics are absent.
11. Confirm dashboard responses contain `private, no-store`.
12. Verify empty accounts return zero counts and `null` score metrics,
    rather than random or fabricated values.
