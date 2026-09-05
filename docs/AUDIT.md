# StematelArt / ARTVAULT — Project Audit

> Audit performed: 2026-09-03 · Branch: `dev` · HEAD: `6c0c68e`
>
> Stack audited: Laravel 12 REST API (`Backend/`) + React 18 / TypeScript / Vite / Tailwind SPA (`frontend/`). `frontend-legacy/` treated as reference only.

> **⚠️ Status update (2026-09-05):** The audit below is a **historical snapshot** taken at HEAD `6c0c68e`. Since then the backend has moved well past "authentication only" and now also includes **profiles & basic settings, the follow system, the posts/artwork core, Supabase artwork storage, and server-side watermarking** (scope of the `fitur-account-post-social` work, merged via #16, plus the `audit-auth-security` hardening merged via #19). The frontend remains a **high-fidelity mock prototype** that only wires login/signup to the backend. See the [current status](#post-audit-status-update-2026-09-05) section below, which supersedes the outdated claims in the original snapshot.

## Post-Audit Status Update (2026-09-05)

The original audit snapshot described the backend as **authentication-only**. That is no longer accurate. Current project state:

### Backend — implemented since the snapshot
- **Full token auth** (register / login / logout / `GET /user`) with **rate limiting** on login & registration (`throttle:auth-login`, `throttle:auth-register`) and centralized JSON error handling for 401 / 403 / 404 / 422 / 429 / 500.
- **Role middleware** (`role:user|artist|admin`) with demo endpoints; registration hard-codes `role => 'user'`.
- **Profile & settings** endpoints: get/update profile, avatar upload, theme & notification settings.
- **Follow system**: follow / unfollow / followers / following (paginated).
- **Posts / artwork** CRUD with ownership authorization (`PostPolicy`).
- **Artwork storage** on Supabase via `ArtworkStorageService` (`ARTWORK_STORAGE_DISK`) and **server-side watermarking** via native PHP GD (`ArtworkWatermarkService`).
- New tables: `users` profile fields (bio/avatar), `user_settings`, `follows`, `posts`.
- Backend test suite grown to ~76 tests / ~264 assertions (`AuthSecurityTest`, `ProfileTest`, `FollowTest`, `PostTest`, `ArtworkStorageTest`, `ArtworkWatermarkTest`).

### Frontend — unchanged from the snapshot (partial wiring)
- Still a **mock-data prototype**; only `LoginPage.tsx` / `SignupPage.tsx` call the real backend via `services/api.ts`. No authenticated fetch helper, no logout API call, no token attached to requests yet.
- Remaining de-mocking is future work (profile, posts, discovery, liking, comments, save/share, ranking, contests, notifications, admin).

### Remaining open items (still true)
- Committed `APP_KEY` in `docker-compose.yml` and `APP_DEBUG: "true"` in the compose environment.
- Token kept in `localStorage` (XSS-exposed); no httpOnly-cookie session.
- No frontend test framework (no vitest/jest/playwright).
- ESLint config still missing (`npm run lint` doesn't run).

---

## 1. Progress Overview

**Overall maturity: Early-stage, mid-prototype. High-fidelity UI, minimal backend.**

The project is highly asymmetric:

- **Backend** is skeletal — only **authentication** exists (register / login / logout / `GET /user` plus admin & artist role test endpoints in `Backend/routes/api.php`). **Zero domain endpoints** (artworks, comments, likes, commissions, contests, collections, uploads, notifications, admin panel).
- **Frontend** is a large, polished interactive **UI/UX prototype** (~24 pages + ~30 reusable components), but **nearly all data is mock** (`frontend/src/data/mockData.ts`) with local React state. It even ships design-review tooling (`DevBar`, `AnnotationLayer` with `data-goes-to` annotations, and an `ExportAll` static-frame exporter — `frontend/src/App.tsx:147-161`, `:462-463`).
- The two layers are connected **only for auth**: `LoginPage.tsx` / `SignupPage.tsx` call the real API via `frontend/src/services/api.ts`; the backend auth suite passes.

**Verdict:** early-stage prototype/MVP. Frontend is visually near-complete but functionally a mock; backend has authentication only. Production readiness is low.

---

## 2. Working Features

### Backend (Laravel 12 + Sanctum)

- Full token auth: `POST /api/register`, `POST /api/login`, `POST /api/logout`, `GET /api/user` (`Backend/routes/api.php:7-38`).
- Role-based authorization middleware (`Backend/app/Http/Middleware/RoleMiddleware.php`) wired via `role` alias (`Backend/bootstrap/app.php:21-23`), with `admin` / `artist` demo routes (`routes/api.php:20-34`).
- Consistent JSON error envelope `{success, message, data?, errors}` for 401 / 403 / 422 / 404 (`bootstrap/app.php:25-68`).
- Role-injection protection: `register()` hard-codes `role => 'user'` (`AuthController.php:27`), verified by test.

### Frontend (React / TS / Vite)

- All screens render: Discovery, Ranking, Commission, Order, Contest, Artwork Detail, Profile, Favorites, Collections, Search, Category, Settings, Upload, Watermark, About, plus the full auth set. Routes live in `App.tsx:395-403, 422-444`; `tsc --noEmit` passes.
- Interactive features working on mock data: like/favorite, follow, save-to-collection, create-collection, toasts, and overlays (lightbox, share, more, submit, participants, confirm), all local state in `App.tsx:347-382`.
- **Real** login/signup wired to the backend; token stored in `localStorage` (`services/api.ts:53-55, 88-90`).

### Tooling / Ops

- Backend tests pass: `php artisan test` → **12 passed (34 assertions)** (`Backend/tests/Feature/AuthSecurityTest.php`).
- Working Docker setup: `docker-compose.yml` (Postgres + php-fpm + nginx + frontend), `Dockerfile`, `nginx.conf`.

---

## 3. Missing / Planned Features

Inferred from READMEs, TODOs, config, and incomplete code paths:

- **Domain API layer** — no backend endpoints / models / migrations for artworks, comments, likes, favorites, collections, commissions, orders, contests, notifications, uploads, watermark, search, or admin. Only `users` + token tables exist in migrations.
- **Authenticated client** — the frontend never sends the Sanctum token. `api.ts` stores `auth_token` in `localStorage` but **no request attaches `Authorization: Bearer`**, and there are no other API calls.
- **Email / password reset** — `ForgotPasswordPage`, `CheckEmailPage`, `ResetPasswordPage` are UI only; no backend endpoints. `email_verified_at` and `password_reset_tokens` exist but are unused.
- **Persistence** — `liked`, `saved`, `followed`, `collections` are initialized from mock data and reset on reload (no backend / `localStorage` persistence).
- **Admin panel** — role exists and role-gated test routes exist, but no actual admin UI or management endpoints.

The backend `backend.md` confirms the limited scope ("autentikasi user (saat ini baru mencakup registrasi)").

---

## 4. Implemented but Broken

1. **`npm run lint` is broken** — `frontend/package.json:9` runs `eslint . --ext ts,tsx`, but there is **no ESLint config file** (`eslint.config.js`, `.eslintrc.{js,cjs,json}` all absent). Run fails with *"ESLint couldn't find a configuration file."* **Root cause:** ESLint 8.57.1 is installed but no config was ever added.
2. **Type-safety is effectively disabled** — `frontend/tsconfig.json` sets `"strict": false`, `"noUnusedLocals": false`, `"noUnusedParameters": false`. `tsc --noEmit` "passes" largely because checks are off, and there is pervasive `any` usage (`params: any` in `App.tsx`, `(window as any)`, `app: any`).
3. **Inconsistent auth flows** — the in-app `LoginModal` overlay (`App.tsx:451`) only does `setLoggedIn(true)` locally (no API), whereas `LoginPage.tsx` performs a real API login. Depending on entry path, "logging in" means different things; only one path talks to the backend.
4. **Logout does not revoke the token** — `logout` (`App.tsx:373`) clears local state and toasts, but leaves `auth_token` / `auth_user` in `localStorage` and never calls the backend `/logout` (which exists and is tested).
5. **Stale docs** — `Backend/backend.md:604` claims no protected routes exist and auth is registration-only, now outdated. Some frontend structure docs also referenced legacy `.js`/`.jsx` paths.

---

## 5. Code Quality Review

### Structure & conventions

- **Backend** follows Laravel conventions well: controllers under `app/Http/Controllers/Api/`, middleware in `app/Http/Middleware/`, consistent error envelope, sane exception rendering in `bootstrap/app.php`.
- **Frontend** is organized cleanly (`components/{ui,layout,modals}`, `pages/`, `pages/auth/`, `context/`, `services/`, `utils/`, `types/`, `data/`) with barrel `index.ts` files.
- **Repo hygiene** is good: `.env`, `node_modules`, `dist`, `vendor`, `.sqlite` are gitignored and untracked (146 tracked files, clean `git status`).

### Code smells / duplication

- `frontend/src/App.tsx` is a **~470-line monolith** mixing router, context provider, all shared state, overlay registry, dev tools, and export mode.
- `AuthController.php` has **inconsistent indentation** (register body 8-space vs. login/logout misaligned at lines 43-78).
- Register / login duplicate the same validate → hash-check → createToken → respond shape.
- Heavy `any` usage and pages reaching directly into `mockData` / `AppContext` (prototype coupling).

### Error handling & edge cases

- **Backend:** strong — consistent status codes; role guard correctly distinguishes unauthenticated vs. forbidden.
- **Frontend:** `api.ts` handles non-OK and network failures and surfaces toasts/errors. Minor gap: `res.json()` is not guarded, so a non-JSON server response falls to the generic catch message.

### Security concerns

1. **Committed `APP_KEY`** — `docker-compose.yml` hard-codes `APP_KEY: ${APP_KEY:-base64:3v4yVQ0zL2ZxQmJ6TnJ5Rk9Pc1VwWmFhR0hGd0hYd1E=}`. A signing/encryption secret is now in version control; should be loaded from a secret.
2. `APP_DEBUG: "true"` is set in the compose environment (dev-only, easy to leak in prod).
3. **Token in `localStorage`** — `api.ts:54-55` stores the auth token and user JSON in `localStorage`, which is XSS-exposed; httpOnly cookies (or state-backed sessions) would be safer.
4. **No login rate-limiting** — `api.php` adds no `throttle:` middleware, so `/login` is brute-forceable.
5. **Positive:** new users cannot escalate privileges (`role` forced to `'user'`, covered by `test_registration_ignores_role_injection`); passwords hashed & `min:8`; compose DB credentials are dev placeholders.

### Testing coverage

- **Backend:** good foundation — 12 passing tests (register, role injection, validation errors, duplicate email, login/protected route, invalid login, missing/invalid tokens, logout revocation, role authorization, 404 JSON).
- **Frontend:** **no test framework** (no vitest/jest/playwright, no test scripts). Zero component / unit / e2e coverage.

### Quick wins (not applied — logged for future work)

1. Add an ESLint flat config so `npm run lint` actually runs.
2. Remove the hard-coded `APP_KEY`; require it from env.
3. Add `throttle` middleware to `/login` and `/register`.
4. Introduce a shared authenticated fetch helper that attaches the Bearer token, and make `logout` call the backend + clear `localStorage`.
5. Enable `tsc --strict` incrementally and reduce `any`.
6. Add Vitest + React Testing Library.
7. Re-sync remaining stale docs (e.g., `Backend/backend.md`).

---

## 6. Recommended Skills (from `find-skills` discovery)

Installed at user glob (saved under `~/.agents/skills`; surfaced for Cline / Claude Code / Cursor / Gemini CLI etc.):

| Skill | Status | Purpose |
|---|---|---|
| `mattpocock/skills@code-review` | installed | General high-quality code review (TS/JS/React) |
| `addyosmani/agent-skills@code-review-and-quality` | installed | Broad code-quality / performance review |
| `dotneet/claude-code-marketplace@typescript-react-reviewer` | installed | Automated TypeScript / React review |
| `affaan-m/ecc@laravel-plugin-discovery` | **failed** | Laravel helpers — clone timed out on install |
| `jpcaparas/superpowers-laravel@laravel:code-review-requests` | **failed** | Laravel-specific review — clone source not resolvable |

Note: skills run with full agent permissions — review them before use.