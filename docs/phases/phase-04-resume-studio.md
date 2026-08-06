# Phase 4 — Resume Studio

Phase 4 introduces the canonical resume domain, PDF-to-resume import,
asynchronous AI analysis, stable bullet rewrites, and a frontend workspace
scaffold.

## Runtime requirement

Resume and version creation use MongoDB transactions. Run MongoDB as a
replica set locally or use MongoDB Atlas. A standalone MongoDB server does
not support multi-document transactions.

## Setup

```bash
npm install
cp backend/.env.example backend/.env
npm run dev:api
```

Configure all earlier Phase 2 and Phase 3 values. PDF extraction works
locally, but PDF-to-structured-resume parsing and resume analysis require
`GEMINI_API_KEY`.

## Resume routes

All routes require:

```text
Authorization: Bearer <access-token>
```

### Create a resume

```http
POST /api/v1/resumes
```

```json
{
  "title": "Software Engineer Resume"
}
```

This transactionally creates a Resume and immutable ResumeVersion V1.

### List and fetch

```http
GET /api/v1/resumes?page=1&limit=20
GET /api/v1/resumes/:resumeId
```

### Save a manual version

```http
POST /api/v1/resumes/:resumeId/versions
```

```json
{
  "expectedCurrentVersionId": "CURRENT_VERSION_ID",
  "changeSummary": "Updated experience",
  "content": {
    "basics": {
      "fullName": "Example User",
      "links": []
    },
    "experience": [],
    "education": [],
    "skills": [],
    "projects": [],
    "certifications": [],
    "languages": [],
    "interests": []
  }
}
```

Existing stable UUIDs should be returned unchanged. New entries and
bullets can omit IDs; the server creates them and rejects duplicates.

### Version history

```http
GET /api/v1/resumes/:resumeId/versions?page=1&limit=20
GET /api/v1/resumes/:resumeId/versions/:versionId
```

### Update design

```http
PATCH /api/v1/resumes/:resumeId/design
```

```json
{
  "templateId": "ats-classic",
  "pageSize": "A4",
  "showProfilePhoto": false
}
```

## PDF import

```http
POST /api/v1/resume-analyses/import-pdf
Content-Type: multipart/form-data
```

Fields:

- `requestId` — client-generated UUID reused for the deliberate submission
- `title`
- `file`

```bash
curl -X POST http://localhost:8000/api/v1/resume-analyses/import-pdf       -H "Authorization: Bearer $ACCESS_TOKEN"       -F "requestId=<UUID>"       -F "title=Imported Resume"       -F "file=@resume.pdf;type=application/pdf"
```

The response is `202 Accepted`. Poll:

```http
GET /api/v1/jobs/:jobId
```

A completed job returns `resumeId` and `versionId`. The PDF is initially a
private temporary Asset. It is promoted after successful import; failed
imports are removed by temporary-asset cleanup. Scanned-image OCR is not
included yet.

## Analysis routes

Queue analysis:

```http
POST /api/v1/resume-analyses/resumes/:resumeId/analyze
```

```json
{
  "requestId": "<UUID>",
  "targetRole": "Senior Frontend Engineer",
  "company": "Example Company",
  "jobDescription": "Paste the target description here."
}
```

Poll `/api/v1/jobs/:jobId`. The completed result contains `analysisId`,
`resumeVersionId`, and `totalScore`.

The score is an AI-estimated resume-readiness score, not a result from an
employer ATS. The backend computes the total from four 0–25 categories.

```http
GET /api/v1/resume-analyses/resumes/:resumeId?page=1&limit=20
GET /api/v1/resume-analyses/:analysisId
```

## Apply stored AI suggestions

```http
POST /api/v1/resume-analyses/resumes/:resumeId/rewrites/apply
```

```json
{
  "analysisId": "ANALYSIS_ID",
  "suggestionIds": ["SUGGESTION_UUID"],
  "changeSummary": "Accepted selected suggestions"
}
```

The route accepts stored suggestion IDs, not arbitrary replacement text.
It verifies ownership, source version, bullet UUID, and original text, then
creates a new immutable version. It never reparses unrelated resume fields.

## Frontend scaffold

```text
frontend/src/features/resumes/
├── ResumeWorkspace.tsx
├── ResumeEditor.tsx
├── ResumePreview.tsx
├── AiRecommendations.tsx
├── resumeApi.ts
├── resumeWorkspace.css
├── types.ts
└── index.ts
```

This is a compile-ready structural workspace. Full repeatable-field forms,
template migration, authentication state, and production server-state
management remain for the next UI migration pass.
