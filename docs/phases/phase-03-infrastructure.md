# Phase 3 — Shared Infrastructure

This phase adds private asset storage, a structured AI gateway, a shared
activity-event system, and a durable MongoDB-backed job queue.

## 1. Install and configure

From the repository root:

```bash
npm install
cp backend/.env.example backend/.env
```

Configure MongoDB and all authentication secrets from Phase 2. Also set a
separate asset-signing secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Use the output for `ASSET_SIGNING_SECRET`.

Local development uses:

```env
ASSET_STORAGE_DRIVER=local
ASSET_LOCAL_ROOT=./storage/private
JOB_WORKER_ENABLED=true
ENABLE_DEV_ROUTES=true
```

Gemini is optional for starting the API. To test the AI gateway, set:

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash
```

Start the API:

```bash
npm run dev:api
```

Check infrastructure health:

```bash
curl http://localhost:8000/api/v1/health
```

## 2. Obtain an access token

Register a local test user:

```bash
curl -i -X POST http://localhost:8000/api/v1/auth/register       -H "Content-Type: application/json"       -c cookies.txt       -d '{
    "email":"phase3@example.com",
    "password":"SecurePassword123",
    "displayName":"Phase Three"
  }'
```

Copy `data.accessToken` from the JSON response:

```bash
export ACCESS_TOKEN="paste-access-token"
```

## 3. Test private local asset storage

Create a small valid PDF:

```bash
printf '%%PDF-1.4\n%%EOF\n' > phase3-test.pdf
```

Upload it:

```bash
curl -X POST http://localhost:8000/api/v1/assets       -H "Authorization: Bearer $ACCESS_TOKEN"       -F "purpose=learning-document"       -F "file=@phase3-test.pdf;type=application/pdf"
```

Copy the returned asset ID:

```bash
export ASSET_ID="paste-asset-id"
```

Read metadata:

```bash
curl http://localhost:8000/api/v1/assets/$ASSET_ID       -H "Authorization: Bearer $ACCESS_TOKEN"
```

Generate a short-lived private download URL:

```bash
curl -X POST http://localhost:8000/api/v1/assets/$ASSET_ID/signed-url       -H "Authorization: Bearer $ACCESS_TOKEN"       -H "Content-Type: application/json"       -d '{"expiresInSeconds":300}'
```

The local driver stores private bytes under `storage/private`, which is
ignored by Git. The S3 adapter uses private objects and presigned GET URLs.

## 4. Test the durable job queue

`ENABLE_DEV_ROUTES=true` is required.

```bash
curl -X POST http://localhost:8000/api/v1/jobs/infrastructure-test       -H "Authorization: Bearer $ACCESS_TOKEN"       -H "Content-Type: application/json"       -d '{"message":"Job queue is operational"}'
```

Copy the returned job ID and poll it:

```bash
curl http://localhost:8000/api/v1/jobs/JOB_ID       -H "Authorization: Bearer $ACCESS_TOKEN"
```

The job should move from `queued` to `processing` and then `completed`.
Job status and retries survive API restarts because they are stored in
MongoDB. Expired worker leases can be reclaimed by another worker.

## 5. Test activity events

Asset and test-job operations create activity events automatically:

```bash
curl "http://localhost:8000/api/v1/activity?page=1&limit=25"       -H "Authorization: Bearer $ACCESS_TOKEN"
```

## 6. Test AI quota status

```bash
curl http://localhost:8000/api/v1/ai/usage       -H "Authorization: Bearer $ACCESS_TOKEN"
```

With `ENABLE_DEV_ROUTES=true` and `GEMINI_API_KEY` configured:

```bash
curl -X POST http://localhost:8000/api/v1/ai/structured-test       -H "Authorization: Bearer $ACCESS_TOKEN"
```

The gateway applies a timeout, bounded retries, daily quota reservation,
structured Zod validation, and usage-event logging.

## Routes added

### Assets

- `POST /api/v1/assets`
- `GET /api/v1/assets/:assetId`
- `GET /api/v1/assets/:assetId/content`
- `POST /api/v1/assets/:assetId/signed-url`
- `GET /api/v1/assets/:assetId/download` — signed local-development URL
- `DELETE /api/v1/assets/:assetId`

### AI infrastructure

- `GET /api/v1/ai/usage`
- `POST /api/v1/ai/structured-test` — development only

### Activity

- `GET /api/v1/activity`

### Jobs

- `POST /api/v1/jobs/infrastructure-test` — development only
- `GET /api/v1/jobs/:jobId`
- `DELETE /api/v1/jobs/:jobId` — cancels an owned queued job
- `POST /api/v1/jobs/:jobId/cancel` — cancels owned queued or pre-persistence
  processing work and returns the safe terminal job
- `POST /api/v1/jobs/:jobId/retry` — creates or returns one owned idempotent
  linked retry job for an eligible failed or cancelled AI job

Owned job responses expose only allowlisted status, safe phase, progress,
attempt counts, retry eligibility/lineage, validated final result, normalized
safe error fields, and timestamps. Token streaming, SSE, and WebSockets are not
part of the job transport.

## Production notes

- Use S3 or compatible private object storage in production.
- Leave `ENABLE_DEV_ROUTES=false` in production.
- Run the job worker as a separate process when traffic increases; the
  MongoDB lease design already supports multiple workers.
- AI quota counters are daily guardrails, not a billing ledger.
- Do not log prompts, resumes, document text, API keys, or signed URLs.
- Configure MongoDB backups and controlled index creation before launch.
