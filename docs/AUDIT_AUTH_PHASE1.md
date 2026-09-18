# Audit Authentication & Session - Phase 1

> Audit status: completed
> Scope: Laravel API authentication and React/Vite client session flow
> Date: 2026-09-06

## 1. Executive Summary

Authentication and session Phase 1 is implemented for the email/password flow.
The frontend now uses a shared authenticated API client, stores the token in
module memory with a `sessionStorage` mirror, hydrates the session through
`GET /api/user`, supports real login in the overlay, and revokes the current
Sanctum token during logout.

The focused backend auth suite passes. The frontend production build passes.
Manual browser verification confirmed that the reload logout issue was resolved.
The full backend suite is not fully green in the current local environment
because image tests require the PHP GD extension. That failure is unrelated to
authentication.

The Phase 1 acceptance criteria are therefore met for the email/password
workflow, with the known issues documented in this report still outstanding.

## 2. Implementation Completed

### Backend

- `POST /api/register` creates a user with the default `user` role and issues a Sanctum token.
- `POST /api/login` validates credentials and issues a Sanctum token.
- `GET /api/user` validates the Bearer token and returns the authenticated user.
- `POST /api/logout` deletes the current Sanctum token.
- Invalid, expired, or revoked Bearer tokens are rejected by `auth:sanctum` with `401`.
- Logout with an already revoked token is covered by a regression test and returns `401` rather than crashing with `500`.
- API exception rendering uses a consistent JSON envelope and generic messages for unexpected server errors.

### Frontend API client

Implemented in `frontend/src/services/api.ts`:

- Central `apiFetch` helper.
- Automatic `Authorization: Bearer <token>` header for authenticated requests.
- Safe response parsing for non-JSON responses.
- `getToken`, `setToken`, and `clearToken` helpers.
- Module-level in-memory token as the primary value.
- `sessionStorage` mirror under `auth_token` for same-tab reload persistence.
- `loginUser` and `registerUser` store successful tokens through `setToken`.
- `fetchMe` validates a stored token through `GET /api/user`.
- `logoutUser` calls `POST /api/logout` and always clears the local token.
- Public `401` responses from `/login` and `/register` no longer clear an existing authenticated session.

### Frontend session state

Implemented in `frontend/src/App.tsx` and `frontend/src/types/index.ts`:

- `currentUser` was added to `AppContextType`.
- Normal runtime starts logged out and hydrates from the stored token.
- A valid `fetchMe` result sets both `currentUser` and `loggedIn`.
- Hydration no longer deletes the token for an ambiguous `fetchMe` failure.
- Login page, signup page, and `LoginModal` use the backend auth services.
- Logout calls the backend service, clears token and user state, and preserves the logout toast.
- Protected actions retain a pending callback and continue after successful overlay login.
- Cancelling the login overlay, opening forgot-password, or opening signup clears the pending callback.

## 3. Bugs Found and Fixed

### 3.1 Reload appeared to log the user out

**Cause:** `fetchMe()` returned `null` for every failure type, while hydration
interpreted `null` as an invalid session. A transient or ambiguous failure could
therefore force the logged-out state and, in the earlier implementation, clear
the stored token.

**Fix:** hydration only treats a returned user object as an authenticated
session and no longer calls `clearToken()` for every `null` result. Confirmed
HTTP `401` responses are still handled by `apiFetch` and clear the token.

**Verification:** the frontend was tested in both Vite development and
production preview flows. After the fix, reload persistence was confirmed
manually in the same browser tab.

### 3.2 Public login/register `401` cleared an active session

**Cause:** `apiFetch` cleared the token for every `401`, even when called with
`authenticated = false` for login or registration.

**Fix:** token clearing is now conditional:

```ts
if (authenticated && res.status === 401) clearToken();
```

### 3.3 Pending protected action survived login cancellation

**Cause:** `pending.current` was only cleared after a successful overlay login.
Closing the modal or navigating to forgot-password/signup left the old callback
stored for a later login.

**Fix:** the login overlay now uses a dedicated close handler that clears
`pending.current` before closing the overlay. Successful login still consumes
and clears the pending callback before continuing it.

## 4. Verification Status

### Frontend

- `npm run build`: **PASS**
- TypeScript compilation and Vite production build completed successfully.
- Manual browser testing: **PASS based on the reported verification**
  - email/password login
  - `GET /api/user` returning `200`
  - same-tab reload session persistence
  - logout and token revocation flow
- The development console diagnostics used during investigation were removed
  after the reload bug was confirmed fixed.

### Backend auth suite

File: `Backend/tests/Feature/AuthSecurityTest.php`

Latest focused result:

```text
17 passed (62 assertions)
```

The suite covers registration, role injection protection, validation, duplicate
registration, login, invalid login, protected routes, rate limits, logout
revocation, revoked-token logout, token expiry, role authorization, sanitized
server errors, and missing resources.

### Full backend suite

The full `php artisan test` suite is not currently 100% green in the local
machine. Image-related tests fail because the PHP GD extension is unavailable.
There was also an `APP_KEY` setup issue before `Backend/.env` was created and
key generation was run. These are environment/setup issues, not auth suite
failures.

## 5. Known Issues and Non-Blocking Risks

### Social login remains mock-only

Location: `frontend/src/pages/auth/AuthLayout.tsx`

Google and Discord buttons still call `app.signIn()` directly without a
backend OAuth flow or token. Email/password login is real; social login is not.

### API response time can be slow

Signup was previously observed taking approximately 36 seconds. The likely
cause is connectivity or latency to the Supabase pooler, rather than the
frontend token flow. The client currently has no explicit request timeout or
cancellation policy.

### Concurrent login/logout race

Two auth requests issued concurrently can complete out of order. A stale login
response could overwrite a newer token, or a login response arriving after
logout could restore a session. The UI prevents duplicate submission in the
main modal, so the practical impact is currently low.

### BCRYPT_ROUNDS=12

The current value is reasonable for security but may add noticeable latency on
local or constrained production hardware. Benchmark login and registration
latency before changing it.

### No frontend auth contract tests

There are no focused frontend tests for:

- Bearer header attachment
- token storage and clearing
- non-JSON responses
- `401` behavior
- hydration with a valid `/api/user` response
- same-tab reload persistence
- pending action continuation and cancellation

### Placeholder identity in some UI components

`Sidebar` and `TopNav` still display placeholder identity values such as
`Artvault User`, `@artvault_user`, and `AU`. `AvatarMenu` already uses
`currentUser`. This is a presentation inconsistency, not an auth failure.

### Session storage security trade-off

`sessionStorage` meets the requirement to persist within one tab and avoids
cross-tab persistence, but JavaScript running under an XSS vulnerability can
read it. An HttpOnly cookie-based Sanctum SPA flow would provide stronger token
protection in a later iteration.

## 6. Environment and Infrastructure Notes

- The configured application database is Supabase PostgreSQL, not local MySQL.
- The PHP CLI required `pdo_pgsql` and `pgsql` to be enabled in
  `C:\xampp\php\php.ini` before PostgreSQL migrations could run.
- Supabase migrations completed with `Nothing to migrate`; all listed migrations
  were already marked `Ran`.
- The local full backend suite remains blocked by the missing GD extension for
  image-upload tests.
- The frontend development proxy targets the Laravel backend at
  `http://localhost:8000`.
- `sessionStorage` is origin-scoped. `localhost:3000`, `localhost:3001`,
  `localhost:4173`, and `127.0.0.1` do not share the same token storage.

## 7. Recommended Next Iteration

1. **High:** replace mock Google/Discord login with a real OAuth backend flow,
   or disable those buttons until OAuth is available.
2. **High:** add frontend tests for `apiFetch`, token storage, `401` handling,
   hydration, reload persistence, and pending action behavior.
3. **High:** distinguish `401` from network/5xx errors in `fetchMe` so a
   temporary backend failure does not present as an invalid session.
4. **Medium:** add request timeout/cancellation and a retry-friendly error
   state for slow Supabase requests.
5. **Medium:** prevent stale concurrent login/logout responses from overwriting
   the current token.
6. **Medium:** add an `authHydrating`/`sessionReady` state to avoid the initial
   logged-out flicker and early protected-action race.
7. **Low:** replace placeholder identity values in Sidebar and TopNav with
   `currentUser` data.
8. **Low:** benchmark `BCRYPT_ROUNDS=12` under production-like load.
9. **Environment:** enable GD in the local PHP CLI and rerun the full backend
   suite to separate application failures from setup failures.

## 8. Final Assessment

| Area | Status |
|---|---|
| Email/password register and login | Complete and verified |
| Shared authenticated API client | Complete and build-verified |
| In-memory plus sessionStorage token flow | Complete and manually verified |
| Session hydration on reload | Fixed and manually verified |
| Overlay login and pending action | Complete for email/password |
| Server-side logout revocation | Complete and auth-tested |
| Auth backend test suite | 17 passed, 62 assertions |
| Full backend test suite | Blocked by local GD environment issue |
| Social OAuth login | Not implemented, known issue |
| Frontend auth automated tests | Not implemented, recommended next step |
