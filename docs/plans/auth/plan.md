# Plan: Authentication & Session

## Metadata
- Feature: Authentication & Session(Phase 1.
- Source: docs/IMPLEMENTATION_PLAN.md — Phase 1
- Status: Not started
- Target: End-to-end auth client flow

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
- [ ] Run php artisan test to confirm auth suite passes (12 tests
- If a logout already-revoked token returns an error, add an idempotent logout guard so repeated logout does not 500.

### Frontend — shared API client (services/api.ts.
- [ ] Refactor to a single authenticated fetch helper apiFetch.
  - [ ] Attach Authorization: Bearer token on authenticated calls.
  - [ ] Handle 401 by clearing the session.   - [ ] Wrap res.json() with a guard to fall back on non-JSON responses.
- [ ] Move token storage out of plain localStorage.
  - [ ] Keep the token in a module-level in-memory variable.
  - [ ] Optional sessionStorage mirror so refresh within the tab persists the session.
  - [ ] Create getToken and setToken and clearToken helpers.
- [ ] Refactor registerUser and loginUser to use apiFetch then store token via setToken.
- [ ] Add logoutUser service: POST /api/logout then clearToken then clear stored user.
- [ ] Add fetchMe service: GET /api/user then returns the current user.

### Frontend — session state (App.tsx / AppContext.
- [ ] Add currentUser state type to AppContextType.
- [ ] On app mount, hydrate the session.
  - [ ] If a stored token exists, call fetchMe to validate it.
  - [ ] On success, setLoggedIn true then store currentUser.
  - [ ] On 401, clear token then leave logged out.
- [ ] Replace placeholder loggedIn initialization (replacing DEEP_LINK/PROP mock with hydrate-from-token.
- [ ] Extend signIn to record the authenticated user object returned by login or register.
- [ ] Update logout to call logoutUser, clear token then currentUser, setLoggedIn false
  - [ ] Keep the existing toast and navigation behavior.
- [ ] Make the LoginModal overlay perform a real login via loginUser.
  - [ ] Remove the local-only setLoggedIn(true) path so both entry paths talk to the backend.
  - [ ] Keep requireAuth pending-action continuation working after real login.

### Verification
- [ ] Manual: signup, logout, login, reach a protected view(, /api/user or a role-gated route.
- [ ] Manual: reload the page and confirm the session persists within the tab.
- [ ] Manual: logout inn the AvatarMenu then confirm the token is revoked server-side (protected call now 401.
- [ ] npm run build passes(frontend.
- [ ] php artisan test passes(Backend.

## Acceptance Criteria / Definition of Done
- User can sign up then log in through both the page then the overlay modal.
- A shared helper attaches the Bearer token to authenticated requests.
- Logout calls the backend and revokes the token server-side.
- Refresh keeps the session within a single tab.
- The token is not kept in plain persistent localStorage for untrusted code to read.
- No remaining mock-only login path existed.

## Open Questions / Risks
- In-memory vs sessionStorage token trade-off. In-memory is safest but loses session on refresh; sessionStorage keeps it within a tab and survives refresh. Resolve before implementing the global handler.
- DevBar / AnnotationLayer may rely on the mock DEEP_LINK.auth flag. Confirm testing shots still render.
