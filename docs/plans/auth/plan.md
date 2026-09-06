# Plan: Authentication & Session

## Metadata
- Feature: Authentication & Session(Phase 1.
- Source: docs/IMPLEMENTATION_PLAN.md — Phase 1
- Status: Completed with known issues
- Target: End-to-end auth client flow
- Audit: [docs/AUDIT_AUTH_PHASE1.md](../../AUDIT_AUTH_PHASE1.md)

## Goal / Outcome
A user can sign up, log in, reach protected views, then log out. The token is revoked server-side on logout. Refresh reloads keep the session within a single tab.

## Scope & Assumptions
- In scope: shared authenticated fetch helper, secure token handling, real login in the app overlay, logout that revokes the token, session hydration on boot, then guarded protected routes.
- Out of scope: forgot / reset password backend (pages stay UI-only. Commission panel.
- Assumption: Backend auth endpoints already exist and pass tests. No login throttling here (audit quick win, deferred to Phase 11.
- Assumption: Session persists across refresh within a tab via stored token, validated against GET /user.
- Assumption: frontend-legacy is reference only.

## Task List

### Backend (verify, minimal change.
- [x] Run php artisan test to confirm auth suite passes (17 auth tests, 62 assertions).
- [x] Verify logout with an already revoked token is safe (returns 401 through Sanctum middleware instead of 500).

### Frontend — shared API client (services/api.ts.
- [x] Refactor to a single authenticated fetch helper apiFetch.
  - [x] Attach Authorization: Bearer token on authenticated calls.
  - [x] Handle 401 by clearing the session for authenticated calls.
  - [x] Wrap res.json() with a guard to fall back on non-JSON responses.
- [x] Move token storage out of plain localStorage.
  - [x] Keep the token in a module-level in-memory variable.
  - [x] Use a sessionStorage mirror so refresh within the tab persists the session.
  - [x] Create getToken, setToken, and clearToken helpers.
- [x] Refactor registerUser and loginUser to use apiFetch then store token via setToken.
- [x] Add logoutUser service: POST /api/logout then clearToken.
- [x] Add fetchMe service: GET /api/user then return the current user.

### Frontend — session state (App.tsx / AppContext.
- [x] Add currentUser state type to AppContextType.
- [x] On app mount, hydrate the session.
  - [x] If a stored token exists, call fetchMe to validate it.
  - [x] On success, setLoggedIn true then store currentUser.
  - [x] On confirmed 401, clear token then leave logged out.
- [x] Replace placeholder loggedIn initialization with hydrate-from-token for normal runtime (static export fixtures retain auth props).
- [x] Extend signIn to record the authenticated user object returned by login or register.
- [x] Update logout to call logoutUser, clear token and currentUser, and set loggedIn false.
  - [x] Keep the existing logout toast behavior.
- [x] Make the LoginModal overlay perform a real login via loginUser.
  - [x] Remove the local-only overlay login path so page and overlay email/password login use the backend.
  - [x] Keep requireAuth pending-action continuation working after real login.

### Verification
- [x] Manual: signup, logout, login, reach a protected view (`/api/user` or a role-gated route).
- [x] Manual: reload the page and confirm the session persists within the tab.
- [x] Manual: logout in the AvatarMenu then confirm the token is revoked server-side (protected call returns 401).
- [x] npm run build passes (frontend).
- [ ] php artisan test passes (Backend) — the focused auth suite passes, but the full suite remains blocked by the local GD extension issue.

## Acceptance Criteria / Definition of Done
- User can sign up then log in through both the page then the overlay modal.
- A shared helper attaches the Bearer token to authenticated requests.
- Logout calls the backend and revokes the token server-side.
- Refresh keeps the session within a single tab.
- The token is not kept in plain persistent localStorage for untrusted code to read.
- No remaining mock-only login path exists for email/password. Google/Discord buttons remain mock-only until OAuth is implemented.

## Open Questions / Risks
- In-memory plus sessionStorage mirror selected to preserve the session within one tab while avoiding cross-tab persistence.
- DevBar / AnnotationLayer may rely on the mock DEEP_LINK.auth flag. Confirm testing shots still render.
