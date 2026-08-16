# Career Learning Hub — Staging Provider and Secret-Name Manifest

## Purpose

This document records the current staging-provider responsibilities and configuration-name boundary for Career Learning Hub. It contains configuration names and responsibilities only; it does not contain secret values.

The final Phase 20A release evidence does not claim that the exact frozen executable baseline was newly deployed. Any new deployment remains a separately authorized activity.

## Provider responsibilities

| Provider | Responsibility | Current boundary |
| --- | --- | --- |
| GitHub | Source control and reviewed promotion | `main` remains the protected release-development reference; feature work occurs on bounded branches |
| Vercel | Frontend hosting | Frontend only; React/Vite SPA |
| Render | Backend hosting | Express/TypeScript API and in-process background worker |
| MongoDB Atlas | Persistent database | Dedicated Career Learning Hub database boundary with scoped credentials and network controls |
| S3-compatible storage | Private asset storage when enabled | Private bucket/object access only; no public asset exposure |
| Google Gemini | AI-assisted workflows | Gemini Direct only, fixed `gemini-3.6-flash`, server-side credentials |
| DNS provider | Staging/public hostname control | DNS/TLS changes require separate authorization |

## Deployment separation

- Frontend and backend remain separate deployable services.
- MongoDB credentials are scoped to Career Learning Hub only.
- Storage credentials are scoped to the private asset boundary only.
- Gemini credentials are server-side only.
- No production/staging secret may be copied into tracked files, screenshots, reports, URLs, or client-side storage.
- Provider-default URLs, custom domains, DNS changes, and access-control policies must be verified during the specific deployment task.

## Frontend configuration

| Name | Purpose | Secret |
| --- | --- | --- |
| `VITE_API_URL` | Public build-time API base URL | No |

The frontend must not receive database credentials, JWT secrets, storage secrets, or Gemini API keys.

## Backend runtime configuration

Representative current backend configuration names include:

| Name | Purpose | Secret |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment mode | No |
| `PORT` | Provider/runtime port | No |
| `MONGODB_URI` | MongoDB connection URI | Yes |
| `CLIENT_ORIGINS` | Exact CORS allowlist | No |
| `API_PUBLIC_ORIGIN` | Public API origin used by server behavior | No |
| `TRUST_PROXY_HOPS` | Approved proxy-hop boundary | No |
| `LOG_LEVEL` | Server log level | No |
| `REQUEST_LOGGING_ENABLED` | Request-logging feature flag | No |
| `JWT_ACCESS_SECRET` | Access-token signing secret | Yes |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret | Yes |
| `ASSET_SIGNING_SECRET` | Private asset signing secret | Yes |
| `ACCESS_TOKEN_TTL_MINUTES` | Access-token lifetime | No |
| `REFRESH_TOKEN_TTL_DAYS` | Refresh-token lifetime | No |
| `REFRESH_COOKIE_NAME` | Refresh-cookie name | No |
| `BCRYPT_ROUNDS` | Password-hashing work factor | No |
| `GLOBAL_RATE_LIMIT_WINDOW_MS` | Global rate-limit window | No |
| `GLOBAL_RATE_LIMIT_MAX` | Global rate-limit ceiling | No |
| `HEALTH_RATE_LIMIT_MAX` | Health-endpoint rate limit | No |
| `ASSET_STORAGE_DRIVER` | Private storage driver selector | No |
| `ASSET_MAX_FILE_SIZE_BYTES` | Upload size limit | No |
| `ASSET_USER_QUOTA_BYTES` | Per-user private-asset quota | No |
| `ASSET_SIGNED_URL_TTL_SECONDS` | Signed private-asset URL lifetime | No |
| `AWS_REGION` | S3-compatible region when applicable | No |
| `AWS_S3_BUCKET` | Private bucket name | No |
| `AWS_ACCESS_KEY_ID` | Storage access identity | Yes |
| `AWS_SECRET_ACCESS_KEY` | Storage secret | Yes |
| `GEMINI_API_KEY` | Administrator-managed Gemini key when explicitly enabled | Yes |
| `BYOK_ENCRYPTION_KEY` | Server-side key material for encrypted personal Gemini credentials | Yes |

Exact environment validation in the backend code remains authoritative. This document does not replace the tracked `.env.example` contract.

## Security requirements

- Generate signing and encryption secrets independently.
- Never reuse JWT, asset-signing, storage, or encryption secrets for another purpose.
- Keep all secrets in provider secret stores or approved local `.env` files; never commit them.
- Use exact CORS origins rather than wildcards in deployed environments.
- Keep private assets private and enforce owner-scoped access.
- Keep personal Gemini credentials encrypted at rest and server-side at use time.
- Do not expose plaintext Gemini keys through API responses, browser storage, URLs, logs, jobs, usage events, or screenshots.
- Preserve rate limiting, request validation, ownership checks, security headers, and Request-ID handling during deployment.

## Verification boundary

A deployment may be called verified only after the authorized deployment task checks, as applicable:

- frontend load and SPA routing;
- backend health and API routing;
- authentication/cookie behavior across the deployed origins;
- exact CORS behavior;
- database connectivity and required indexes/transactions;
- private asset upload/access behavior;
- Gemini Settings and one bounded provider-backed workflow using synthetic content;
- DNS/TLS/access-control behavior for the actual deployed hostnames;
- sanitized provider logs for secret/privacy leakage.

Phase 20A final product qualification remains separate from deployment qualification.
