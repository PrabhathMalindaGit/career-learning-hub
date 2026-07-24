# Phase 9 — Testing and Production Hardening

Phase 9 hardens the Career & Learning Hub API for production deployment and
adds a runnable Vitest test foundation covering calculations, AI output
validation, authentication, ownership, IDOR prevention, mass assignment,
CORS, and rate-limit bypass attempts.

## Production hardening

### Security middleware

The Express application now applies the following controls in order:

1. A validated or generated request ID.
2. Helmet security headers.
3. An explicit CORS origin allowlist.
4. Private, no-store response caching.
5. A dedicated health-check rate limiter.
6. A global API rate limiter.
7. Bounded JSON and URL-encoded body parsing.
8. Route-specific authentication, validation, ownership checks, and
   feature-specific rate limiters.
9. Centralized not-found and error handling.

Global rate limiting runs before request-body parsing, so abusive requests
do not consume JSON parsing resources first.

The API disables `X-Powered-By`, disables ETags for private records, and
enables escaped JSON output.

### Strict CORS

Configure exact frontend origins:

```env
CLIENT_ORIGINS=https://career.example.com,https://admin.example.com
```

Wildcards are rejected. Origins must contain only the scheme, host, and
optional port. In production, non-local origins must use HTTPS.

Allowed methods:

```text
GET
HEAD
POST
PUT
PATCH
DELETE
OPTIONS
```

Credentialed browser requests are supported only for configured origins.

Requests without an `Origin` header remain available to trusted mobile
clients, command-line tools, internal workers, and server-to-server
integrations. Authentication is still required by protected routes.

### Proxy trust and rate-limit safety

The default is:

```env
TRUST_PROXY_HOPS=0
```

This means direct deployments do not trust attacker-supplied
`X-Forwarded-For` headers.

When deploying behind a reverse proxy or load balancer, set this to the
exact number of trusted proxy hops. Do not set Express trust proxy to a
blanket `true`.

Global limiter configuration:

```env
GLOBAL_RATE_LIMIT_WINDOW_MS=900000
GLOBAL_RATE_LIMIT_MAX=300
HEALTH_RATE_LIMIT_MAX=120
```

Existing route-specific limits remain active for registration, login,
refresh, resume AI, interview AI, learning uploads, learning AI, and the
dashboard.

### Structured logging and request IDs

Every request receives:

```text
X-Request-Id
```

A supplied request ID is accepted only when it contains 16–128 safe
alphanumeric, period, underscore, or hyphen characters. Otherwise, the API
generates a UUID.

Runtime logs are newline-delimited JSON and include fields such as:

```text
timestamp
level
event
service
requestId
method
path
statusCode
durationMs
userId
clientIpHash
```

The logger does not record request bodies.

Redaction covers keys associated with:

```text
authorization
cookies
passwords
tokens
secrets
API keys
credentials
resume content
personal details
employment history
education
phone numbers
addresses
job descriptions
prompts
answers
raw document text
```

Email addresses, Bearer values, JWT-like values, and common API-key
patterns are redacted from free text.

Unknown runtime errors are represented by class and a stack fingerprint
rather than arbitrary error messages or stacks that may contain personal
resume text.

Configure logging with:

```env
LOG_LEVEL=info
REQUEST_LOGGING_ENABLED=true
```

Supported levels:

```text
silent
error
warn
info
debug
```

### Centralized error handling

Error responses now consistently include:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Safe public message",
    "requestId": "correlation-id"
  }
}
```

The handler normalizes:

- application errors;
- Zod validation errors;
- malformed JSON;
- Multer upload errors;
- oversized uploads;
- duplicate MongoDB keys;
- invalid MongoDB identifiers;
- unexpected internal failures.

Internal details are not returned for production 5xx responses.

### Environment hardening

Phase 9 adds validation for:

```env
CORS_MAX_AGE_SECONDS=600
TRUST_PROXY_HOPS=0
LOG_LEVEL=info
REQUEST_LOGGING_ENABLED=true
GLOBAL_RATE_LIMIT_WINDOW_MS=900000
GLOBAL_RATE_LIMIT_MAX=300
HEALTH_RATE_LIMIT_MAX=120
HEALTH_CHECK_TIMEOUT_MS=1500
SHUTDOWN_TIMEOUT_MS=15000
SERVER_REQUEST_TIMEOUT_MS=120000
SERVER_HEADERS_TIMEOUT_MS=65000
SERVER_KEEP_ALIVE_TIMEOUT_MS=60000
```

Boolean environment values now parse explicit values such as `true`,
`false`, `1`, and `0` correctly.

Production validation also requires:

- different access-token, refresh-token, and asset-signing secrets;
- no obvious placeholder secrets;
- `BCRYPT_ROUNDS` of at least 12;
- HTTPS frontend origins, except local development hosts;
- a headers timeout greater than the keep-alive timeout.

### Health endpoints

```http
GET /api/v1/health
GET /api/v1/health/ready
GET /api/v1/health/live
```

`/api/v1/health` and `/ready` return HTTP 200 only when:

- MongoDB is connected and responds to a ping;
- private storage was initialized and passes a live access check;
- the job system initialized;
- shutdown has not started.

Otherwise they return HTTP 503.

The storage check verifies local read/write access or performs an S3 bucket
head request.

`/live` confirms that the process is running and not shutting down.

Health responses are not cached and use a dedicated limiter so monitoring
does not consume normal API capacity.

### Graceful shutdown

`server.ts` now:

- marks readiness as false before shutdown;
- stops accepting new connections;
- closes idle HTTP connections;
- waits for active requests and the job worker;
- disconnects MongoDB;
- handles `SIGTERM` and `SIGINT`;
- treats unhandled rejections and uncaught exceptions as fatal;
- enforces a configurable shutdown deadline;
- force-closes connections only after the deadline;
- records lifecycle events through structured logs.

Server timeout values are configurable through the Phase 9 environment
variables.

## Testing structure

```text
backend/
├── vitest.config.ts
├── tsconfig.test.json
└── src/tests/
    ├── globalSetup.ts
    ├── setup.ts
    ├── helpers/
    │   └── auth.ts
    ├── unit/
    │   ├── scoring.test.ts
    │   ├── aiOutputValidation.test.ts
    │   ├── loggerRedaction.test.ts
    │   └── ownershipServices.test.ts
    ├── integration/
    │   ├── auth.integration.test.ts
    │   └── crossUserAccess.integration.test.ts
    └── security/
        ├── cors.security.test.ts
        ├── idor.security.test.ts
        ├── massAssignment.security.test.ts
        └── rateLimitBypass.security.test.ts
```

## Test infrastructure

Integration and security tests use `mongodb-memory-server` in replica-set
mode. Replica-set mode is necessary because Resume Studio uses MongoDB
transactions.

One temporary replica set is created for the full Vitest run. Each test
file connects to it, and every test clears all collections.

Temporary private storage is created outside the repository and removed by
global teardown.

The first test run may download a MongoDB test binary. The machine running
the tests therefore needs outbound access or a preinstalled compatible
binary. A controlled CI environment may provide:

```env
MONGOMS_SYSTEM_BINARY=/absolute/path/to/mongod
```

## Install dependencies

From the monorepo root:

```bash
npm install
```

Phase 9 adds these API development dependencies:

```text
vitest
@vitest/coverage-v8
supertest
@types/supertest
mongodb-memory-server
```

## Run type checks

Production API code:

```bash
npm run typecheck --workspace @career-learning-hub/api
```

Test code:

```bash
npm run typecheck:tests
```

Both API and test configurations:

```bash
npm run typecheck:all --workspace @career-learning-hub/api
```

## Run tests

Complete backend suite:

```bash
npm test
```

Unit tests:

```bash
npm run test:unit
```

Integration tests:

```bash
npm run test:integration
```

Security tests:

```bash
npm run test:security
```

Watch mode:

```bash
npm run test:watch --workspace @career-learning-hub/api
```

Coverage:

```bash
npm run test:coverage
```

CI command:

```bash
npm run test:ci
```

The CI command runs production type checking, test type checking, all
tests, and V8 coverage reporting.

Coverage output is written to:

```text
backend/coverage/
```

This directory remains excluded from Git and the release archive.

## Foundational test coverage

### Unit tests

The unit suites verify:

- resume-readiness score calculation;
- quiz percentage calculation;
- empty and non-empty score summaries;
- out-of-range score rejection;
- fenced and wrapped AI JSON extraction;
- strict Zod validation of resume and quiz AI outputs;
- duplicate quiz-choice rejection;
- invalid AI answer-index rejection;
- invalid JSON rejection;
- secret and resume-content log redaction;
- ownership queries that include both resource ID and authenticated user
  ID;
- not-found behavior for unowned resources.

Production resume and quiz services now call the tested scoring utilities.
The AI Gateway now calls the tested structured-output validator.

### Integration tests

The integration suites verify:

- readiness responses;
- Helmet headers;
- request-ID propagation;
- registration;
- access-token authentication;
- refresh-token rotation;
- invalid login rejection;
- cross-user Resume access denial;
- cross-user ResumeVersion access denial.

### Security tests

The security suites verify:

- InterviewSession IDOR denial;
- InterviewQuestion IDOR denial;
- privileged registration-field rejection;
- privileged profile-field rejection;
- strict configured-origin CORS behavior;
- unlisted-origin and preflight rejection;
- resistance to changing spoofed `X-Forwarded-For` headers when no proxy is
  trusted.

## Production deployment checklist

Before deployment:

1. Run `npm run test:ci`.
2. Run the Phase 8 migration in dry-run mode against staging.
3. Back up the target MongoDB database.
4. Configure exact HTTPS `CLIENT_ORIGINS`.
5. Set the exact trusted proxy-hop count.
6. Generate three different high-entropy signing secrets.
7. Configure production private storage.
8. Confirm `/api/v1/health/ready` returns 200 through the load balancer.
9. Confirm `SIGTERM` removes the instance from readiness before process
   exit.
10. Confirm logs contain request IDs but no request bodies, tokens, or
    resume content.
11. Verify rate-limit behavior at both the application and edge layers.
12. Run an external dependency and container vulnerability scan.
