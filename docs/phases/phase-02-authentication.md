# Phase 2 — Unified Authentication and User Management

## Included

- Unified Mongoose `User` model
- Case-normalized unique email index
- bcrypt password hashing
- Refresh-session persistence with TTL indexes
- Short-lived JWT access tokens
- Rotating refresh token in an HttpOnly cookie
- Refresh-token replay detection
- Registration, login, refresh and logout routes
- Current-user profile routes
- Password change and logout-all controls
- Request validation with Zod
- Authentication and API rate limiting
- Restricted CORS allowlist
- Central error handling
- MongoDB startup and graceful shutdown

## Setup

From the monorepo root:

```bash
npm install
cp backend/.env.example backend/.env
```

Generate two different JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Place separate generated values in:

```env
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

Start MongoDB, then run:

```bash
npm run dev:api
```

## Routes

### Public authentication

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Authenticated user management

Supply `Authorization: Bearer <accessToken>`.

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `POST /api/v1/users/me/change-password`
- `POST /api/v1/users/me/logout-all`

## Important client behaviour

The access token is returned in the JSON response and should be held in
application memory. The refresh token is stored only in an HttpOnly cookie.
Calls to `/auth/refresh` must use credentials, for example Axios
`withCredentials: true`.

## Production notes

- Use HTTPS so refresh cookies receive the `Secure` attribute.
- Use a managed MongoDB deployment with backups.
- Replace development secrets before deployment.
- Configure `CLIENT_ORIGINS` as a comma-separated allowlist.
- Run database index creation as a controlled deployment step in production.
