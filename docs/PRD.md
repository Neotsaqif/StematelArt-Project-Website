# StematelArt — Product Requirements Document (PRD)

**Version:** 1.2
**Status:** Draft — single consolidated reference (the product brief and 12-phase implementation plan have been folded into this document)
**Last Updated:** 2026-09-06

---

## 1. Introduction

### 1.1 Purpose
This PRD defines the full scope, requirements, and delivery plan for **StematelArt**, an art community and artwork-sharing platform. It consolidates the project brief (business/product framing) and the implementation plan (technical/phase framing) into a single reference for engineering, QA, and product stakeholders.

### 1.2 Background
StematelArt currently exists as:
- A **high-fidelity frontend prototype** (`frontend-legacy/Artvault.jsx`) using mock data and local state.
- A **backend** (Laravel 12 + Sanctum) that has already implemented Phases 1–3 server-side (auth, profiles/settings, follow system, posts core, Supabase artwork storage, pagination) — watermarking is handled **client-side**.
- The new frontend (React 18 + TypeScript) currently implements the **Phase 1 auth/session flow** (register, login, logout, token storage, session hydration on reload); the remaining work is largely de-mocking the UI feature-by-feature against the existing/soon-to-exist backend endpoints.

### 1.3 Definitions
| Term | Meaning |
|---|---|
| MVP | Minimum Viable Product — scope defined in Section 4 |
| BE done | Backend endpoint implemented, not yet wired to frontend |
| Proto | UI exists in the legacy prototype using mock data |
| Planned | Specified but not yet built (frontend or backend) |
| Out of MVP | Explicitly excluded from this release |

---

## 2. Project Overview

| Field | Detail |
|---|---|
| **Project Name** | StematelArt |
| **Project Type** | Art Community & Artwork Sharing Platform |
| **Purpose** | Allow users and artists to share artwork, interact with each other's work, discover new art and artists, and follow community activity. |
| **Primary User Roles** | User, Artist, Admin |

### 2.1 Goals
- Provide a place to share artwork.
- Help users discover artwork and artists.
- Provide social interaction between members.
- Provide ranking and community engagement mechanics.
- Provide a contest system.
- Provide management tooling for Admins.

### 2.2 Explicit Non-Goals (Out of MVP)
- Email or push notifications — MVP notifications are **in-app only**.
- Real-time delivery (no WebSockets for MVP; notifications are feed-based).
- Commission **dispute/refund/cancel money-movement flows** — the commission system itself is in MVP scope (Section 4.10); only the dispute/refund flows are deferred to a future release.

---

## 3. Technology Stack & Architecture

| Layer | Choice |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, react-router-dom |
| Backend | Laravel 12 REST API, Sanctum bearer-token auth, consistent JSON envelope, `RoleMiddleware` |
| Database | PostgreSQL (Supabase in production; local Postgres via Docker for dev; in-memory SQLite for tests) |
| Storage | Object storage via Laravel Flysystem — Supabase Storage in production, local disk in dev |
| Deployment | Docker Compose; nginx serves the frontend build and proxies `/api` to the backend |
| Version Control | Git + GitHub |
| Dev Environment | Docker |

**Architecture pattern:** Decoupled REST API + SPA.

```
React (SPA)
   ↓
Laravel API (Sanctum, RoleMiddleware)
   ↓
Supabase PostgreSQL   +   Supabase Storage
```

### 3.1 Project Structure
```
stematelart/
├── backend/
├── frontend/
├── frontend-legacy/   (reference only — pre-React UI/UX mockup)
├── docker/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

### 3.2 Architectural Assumptions
- Supabase Storage is the production asset store for artwork and avatars; dev/test may use local disk (swappable via Flysystem).
- Roles (`user`, `artist`, `admin`) already exist on the `users` table and are enforced via role middleware.
- Sanctum bearer-token auth is implemented for register, login, logout, and the authenticated user endpoint; login and registration are rate-limited (`throttle:auth-login`, `throttle:auth-register`), and the frontend stores the token in memory with a `sessionStorage` mirror, hydrating the session on reload.
- Notifications are in-app only for MVP — no email/push.
- The frontend is de-mocked feature-by-feature, only once the matching backend endpoint exists.
- `frontend-legacy` is a design reference only, not shipped code.
- Watermarking is implemented **client-side** in the browser (e.g., HTML5 canvas) and applied to the artwork before upload — resolved from an earlier open question about client- vs. server-side approach.
- Commission payments flow through a **real payment gateway**; the platform's own gateway account acts as the escrow custodian (no separate internal wallet). Payout to the Artist happens only after the User confirms order completion.

---

## 4. Functional Requirements (Feature Scope)

Each feature below carries a **status tag**:
- **[Proto]** — UI exists in the legacy prototype with mock data.
- **[Planned]** — specified, not yet built.
- **[BE done]** — backend implemented; frontend integration pending.
- **[FE done]** — frontend implemented and wired to the live backend.
- **[Out of MVP]** — excluded from this release.

### 4.1 Account
| Feature | Status |
|---|---|
| Registration | BE done / FE done |
| Login | BE done / FE done |
| Logout (token revocation) | BE done / FE done |
| Authentication (Sanctum bearer token) | BE done / FE done |
| Authorization / Role (user, artist, admin; role middleware) | BE done / FE done |
| Profile (view) | Proto / BE done |
| Edit Profile | Proto / BE done |
| Avatar upload | Proto / BE done |
| Bio | Proto / BE done |
| Settings (commission status, email notifications, auto-watermark) | Proto / BE done (settings) |
| Follow / Unfollow | Proto / BE done |
| Followers / Following lists + counts | Planned |

**Requirements:**
- Users must be able to register, log in, and log out, with the token revoked server-side on logout.
- Sessions persist across page refresh.
- Role-based access is enforced on protected routes and actions.
- Users can edit profile fields (bio, avatar, social links) and see changes persist.
- Follow/unfollow actions must be idempotent and reflect updated counts immediately.

### 4.2 Post
| Feature | Status |
|---|---|
| Create Post | Proto UI / BE done |
| View Post (artwork detail) | Proto |
| Edit Post | BE done / Proto UI |
| Delete Post | BE done / Proto UI |
| Artwork Upload (3-step wizard) | Proto / BE done |
| Image Validation (PNG/JPG, dimensions, size) | Proto / BE done |
| Watermark (client-side, canvas) | Proto UI / Planned |
| Artwork Storage (Supabase object storage) | BE done |
| Ownership / Permission (PostPolicy) | BE done |

**Requirements:**
- Only image formats PNG/JPG are accepted, with size and dimension validation.
- Every uploaded artwork is watermarked client-side in the browser before upload.
- A post's owner is the only user permitted to edit/delete it (enforced by `PostPolicy`); unauthorized attempts return 403.

### 4.3 Social
| Feature | Status |
|---|---|
| Like / Unlike | Proto |
| Like Counter | Proto |
| Comment | Proto |
| Delete Own Comment | Planned |
| Save / Unsave (collections) | Proto |
| Save to collection (pick / create new) | Proto |
| Share / Copy Post URL | Proto |

**Requirements:**
- Like/unlike toggles must update the counter in real time and persist.
- Users may delete only their own comments.
- Save/unsave supports assigning artwork to an existing or newly created collection.
- Share action provides a copyable post URL.
- Like counts feed directly into the Ranking system (Section 4.4).

### 4.4 Discovery
| Feature | Status |
|---|---|
| Browse Public Artworks | Proto |
| Featured artwork spotlight | Proto |
| Category rail / filter | Proto |
| Search (title, tags, artist) | Proto |
| Infinite scroll / pagination | Proto / BE done (pagination) |

**Requirements:**
- Public feed is browsable without authentication (read-only).
- Search supports free text across title, tags, and artist name.
- Category filtering and pagination/infinite scroll are supported on the feed.

### 4.5 Ranking
| Feature | Status |
|---|---|
| All-time ranking by total likes (highest first) | Proto |
| Top-3 podium + ranked list | Proto |

**Requirements:**
- Ranking is read-only and computed from live like data.
- Ranking is ordered by all-time total likes, from highest to lowest.
- UI presents a top-3 podium plus a full ranked list.

### 4.6 Contest
| Feature | Status |
|---|---|
| Contest Page | Proto |
| Contest Information | Proto |
| Rules | Proto |
| Prize (breakdown) | Proto |
| Criteria | Proto |
| Countdown / Deadline | Proto |
| Submit Artwork (auth-gated) | Proto |
| Participants list + modal | Proto |
| Winners view (ended) | Proto |

**Requirements:**
- Contest fields (info, rules, prize, criteria, deadline) are admin-managed.
- Submission is gated to authenticated users, validated against the deadline, and limited to one entry per user per contest (unless otherwise specified by admin).
- Participants list updates as submissions are made; a winners view appears once the contest ends.

### 4.7 Notification
| Feature | Status |
|---|---|
| Notification dropdown + unread badge | Proto |
| Like Notification | Planned |
| Comment Notification | Planned |
| Follow Notification | Planned |
| New Post Notification | Planned |
| Contest Notification | Planned |
| Mark all read | Proto |
| Click → navigate to related item | Proto |

**Requirements:**
- Notifications are generated in-app from events in earlier phases (likes, comments, follows, new posts, contests).
- Unread state is tracked and reflected in a badge; "mark all read" clears it.
- Clicking a notification navigates to the related item (post, profile, contest).

### 4.8 Artist Management
| Feature | Status |
|---|---|
| Artist Account | Out of current proto UI |
| Artist Invitation (admin) | Planned |
| Artist Management (admin) | Planned |

**Requirements:**
- Admins can invite a user to become an artist, or promote/convert an existing user.
- Admins can manage artist account details and status.
- All actions guarded by admin role middleware; non-admins are forbidden (403).

### 4.9 Admin Panel
| Feature | Status |
|---|---|
| Admin login | Planned |
| User Management | Planned |
| Artist Management | Planned |
| Post Management | Planned |
| Contest Management | Planned |
| Moderation (report → review) | Planned / Proto (report) |

**Requirements:**
- Admins can list and act on users (ban, role-change), artists, posts (remove/hide), and contests.
- A moderation queue supports report submission and admin review.
- All admin endpoints/UI are role-guarded; correct 401 (unauthenticated) vs. 403 (unauthorized) responses are required.

### 4.10 Commission (In MVP — Escrow-based)
| Feature | Status |
|---|---|
| Artist list with rating, reviews, specialty | Proto |
| Commission status (open / closed) + slot tooltip | Proto |
| Portfolio preview grid | Proto |
| Tiered pricing packages (`commission_packages`) | Proto / Planned |
| "Ambil Slot" request flow (brief, reference image, deadline) | Proto / Planned |
| Order detail + status timeline | Proto |
| Profile-page commission status (current order + refunding status) | Proto / Planned |
| Payment via gateway → escrow hold | Planned |
| Order lifecycle (`pending_payment → paid → in_progress → delivered → completed → released`) | Planned |
| Expired / cancelled order handling | Planned |
| "Order Completed" release trigger (User) | Planned |
| Admin escrow ledger | Planned |
| Dispute / refund | Out of MVP (future release) |

**Requirements:**
- The **Profile page** (the artist showcase page) must surface a **commission status** section showing the current/latest in-progress commission(s) for the artist and the refunding status of any order. This view belongs on the artist Profile page only — it is **not** shown on the "Profil Saya", "Watermark Generator", or "Pengaturan" screens. Refund status is a read-only display of the order's refund state (the money-movement refund flow itself remains out of MVP scope).
- Every order executes through the escrow model: the User pays via a real payment gateway into the **platform's own gateway account** (Admin is escrow custodian — no separate internal wallet); the Artist is paid out **only when the User clicks "Order Completed"**.
- Supported lifecycle: `pending_payment → paid (escrow held) → in_progress → delivered → completed → released`, plus `expired` / `cancelled`. `disputed` / `refunded` are reserved for a future release (the schema must allow adding them later); the dispute/refund/cancel money-movement flows are **not** built in this phase.
- The User may create an order against an artist package ("Ambil Slot") with a brief, reference image, and optional deadline; payment is required before work begins.
- The User triggers "Order Completed" **only from the `delivered` status**; that action initiates the escrow release to the Artist.
- Role responsibilities: **User** — create order, pay, click "Order Completed"; **Artist** — accept order, mark `in_progress` / `delivered`; **Admin** — view all orders + escrow ledger, manually intervene on failed payouts.
- Authorization mirrors existing patterns: `RoleMiddleware` for role checks plus a new `OrderPolicy` (modeled on `PostPolicy`) for ownership/permission checks on mutating order endpoints.
- Every status change is recorded with a timestamp via `order_status_history`.

#### Commission Data Model
```
commission_packages   artist_id, title, description, price, platform_fee_rate,
                      delivery_time, terms, active
commission_orders     package_id, buyer_id, artist_id, amount, platform_fee_amount,
                      artist_payout_amount (snapshotted), deadline_at, status,
                      timestamps per status change
escrow_transactions   order_id, type: hold|release|refund, amount,
                      gateway_reference_id, status
order_status_history  order_id, from_status, to_status, actor_id, changed_at
```

#### Open Questions (pending — not resolved in this phase)
- Exact payment gateway choice.
- Platform fee % and how it is applied (see `platform_fee_amount` snapshot).
- Artist payout-method registration (how Artists receive released funds).
- Webhook idempotency — dedupe webhook events via `gateway_reference_id`.
- `release_failed` sub-state for failed payouts and the Admin manual-intervention workflow.

### 4.11 Shared UI Components (Prototype Reference)
- Toast system (success / error / info)
- Modal shell + popovers
- Tooltip helper (Tip)
- Skeleton loaders, empty blocks, error blocks
- Confirm dialog (destructive actions)
- Lucide icons
- Avatar component
- Picture loader (lazy / shimmer)
- Justified grid + mobile grid
- Desktop sidebar / mobile top bar / mobile bottom nav / footer
- Back button with scroll-position restore
- Deep-linking via `?screen=` / `?auth=`
- Share popover (copy link, WhatsApp, X, Facebook)
- More menu (download, embed code, report)
- Lightbox fullscreen viewer (Esc / click-outside)
- DevBar + AnnotationLayer + ExportAll (dev tooling only — not shipped to production)

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | Sanctum bearer tokens; login & registration rate-limiting implemented; token stored in memory with a `sessionStorage` mirror (moved out of plain `localStorage`, though still not an httpOnly cookie); no committed secrets / `APP_KEY`; ownership checks (policies) on all mutating endpoints. |
| **Validation** | Every backend feature requires input validation, permission checks, and automated tests. |
| **Performance** | Basic performance testing before launch; paginated/infinite-scroll feeds to avoid large payloads. |
| **Availability** | Production deployment over HTTPS on a stable domain. |
| **Data Integrity** | Relational PostgreSQL with per-phase migrations and test coverage (SQLite in-memory for CI). |
| **Compliance/Scope Control** | Notifications stay in-app only; no scope creep into email/push for MVP. |
| **Auditability** | Consistent JSON envelope and exception rendering across the API for predictable client error handling. |

---

## 6. User Roles & Permissions

| Role | Capabilities |
|---|---|
| **User** | Register/login, manage own profile, follow/unfollow, create/edit/delete own posts, like/comment/save/share, browse/search/filter, view ranking, submit to contests, receive notifications, create and pay for commission orders, click "Order Completed" to release escrow payout. |
| **Artist** | All User capabilities plus artist-designated status/visibility, manage commission packages/status, accept commission orders, mark orders `in_progress` / `delivered`. |
| **Admin** | All of the above plus: manage users (ban, role-change), manage artists (invite/convert/manage), manage posts (remove/hide), manage contests (create/edit fields), view all commission orders + escrow ledger, manually intervene on failed payouts, moderate reported content. |

Role enforcement is handled by `RoleMiddleware`; ownership enforcement (e.g., "only the post owner can edit") is handled by dedicated policies (e.g., `PostPolicy`).

---

## 7. Delivery Plan — Phased Roadmap

The MVP is delivered as **12 dependency-ordered phases**, each shipping a complete end-to-end user-facing feature. As of **2026-09-06**, Phases 1–3 are done on the backend and the **Phase 1 frontend auth/session flow is implemented** (end-to-end); Social (4), Discovery (5), and Ranking (6) are not yet started. De-mocking the remaining phases is the primary remaining work.

| Phase | Name | Goal | Status |
|---|---|---|---|
| 1 | Authentication & Session | Register, log in, log out, stay authenticated | Backend done; frontend auth/session flow implemented |
| 2 | Profiles & Following | Edit profile, upload avatar, follow/unfollow with persisted counts | Backend done; frontend wiring pending |
| 3 | Posts & Artwork Upload | Upload, validate, and watermark artwork; CRUD with ownership checks | Backend done; frontend wiring pending |
| 4 | Social Interaction | Like, comment (delete own), save, share | Not yet started |
| 5 | Discovery & Search | Browse, search, filter, paginate public artworks | Not yet started |
| 6 | Ranking | All-time ranking ordered by highest total likes | Not yet started |
| 7 | Contests | Contest info, rules, prize, criteria, deadline, submission, participants | Not yet started |
| 8 | Notifications | In-app notifications for likes/comments/follows/new posts/contests; read/unread tracking | Not yet started |
| 9 | Artist Management | Admin invites/promotes/manages artist accounts | Not yet started |
| 10 | Admin Panel | Admin manages users, artists, posts, contests; moderation | Not yet started |
| 11 | Release & Hardening | Full integration pass, remove mock data, QA, security hardening, deploy | Not yet started |
| 12 | Commission & Escrow | Order via artist packages, gateway payment into escrow, "Order Completed" release trigger | Not yet started |

### 7.1 Sprint Mapping (Business View)
| Sprint | Duration | Focus | Phases Covered |
|---|---|---|---|
| **Sprint 1 — Core Platform** | 1–2 weeks | Auth, profile, follow, post CRUD/upload/watermark/storage, like/comment/save/share, discovery, ranking | 1–6 |
| **Sprint 2 — Community Features** | TBD | Contest, notifications, artist management, commission & escrow | 7–9, 12 |
| **Sprint 3 — Admin & Platform Management** | TBD | Admin panel, role & permission hardening, moderation | 10 |
| **Sprint 4 — Integration & Release** | TBD | Full integration, testing, bug fixing, deployment, launch | 11 |

### 7.2 Development Workflow (per feature)
```
Requirement → Task → Backend/Frontend Development → Integration
   → Self Check → QA → Bug Fix → Done
```
Frontend developers may work in parallel against mock data while backend endpoints are in progress; each phase replaces mocks with real API calls once the corresponding endpoint ships.

### 7.3 Team Structure (as briefed)
| Role | Focus |
|---|---|
| Developer 1 | Backend, database, Account, Post, Social |
| Developer 2 | Backend, Discovery, Ranking, other backend features per sprint |
| Developer 3 | Frontend, API integration, mock → real API migration, state/error handling |
| PM / QA | Requirements, task management, acceptance criteria, progress monitoring, QA, bug verification, sprint review |

### 7.4 Assumptions & Delivery Context
Folded in from the original implementation plan:

- Supabase Storage is the production asset store for artwork and avatars; dev and test use local disk (Laravel Flysystem keeps this swappable).
- There is no single domain schema — each phase adds its own migrations. Tests run on in-memory SQLite; dev uses PostgreSQL.
- Roles are `user`, `artist`, and `admin`, enforced by `RoleMiddleware`; authentication uses Sanctum bearer tokens.
- Notifications are in-app only for the MVP. No email or push.
- The existing frontend is unwired from mock data feature-by-feature, only in the phase that ships the matching endpoint.
- `frontend-legacy/` is treated as reference only.

### 7.5 Engineering Phase Details
Each phase below carries the **Goal → Scope → Done-when** detail folded in from the original implementation plan.

#### Phase 1 — Authentication & Session
**Goal:** Users can register, log in, log out, and stay authenticated.
**Scope:** Finalize existing Sanctum auth into a reliable client flow; add a shared authenticated fetch helper; keep the token safer (moved from plain `localStorage` to an in-memory variable with a `sessionStorage` mirror); make logout revoke the token server-side; hydrate the session on reload and fix 401-on-refresh bugs.
**Status:** Implemented (Phase 1 complete). Google/Discord sign-in buttons remain mock-only until OAuth is added.
**Done when:** A user can sign up, log in, reach protected views, and log out; refresh keeps the session.

#### Phase 2 — Profiles & Following
**Goal:** Users can view and edit their profile and follow artists.
**Scope:** Add profile fields (bio, avatar, social links); add follow/unfollow with persisted counts; wire profile UI.
**Done when:** A user can edit their profile and follow/unfollow an artist; follower/following counts persist.

#### Phase 3 — Posts & Artwork Upload
**Goal:** Users can publish an artwork post with upload and watermark.
**Scope:** Add artworks and posts schema; CRUD endpoints with ownership checks; artwork upload with validation and storage; client-side watermark applied before upload (HTML5 canvas); wire the upload/watermark/artwork-detail routes.
**Done when:** A user can upload a validated, watermarked artwork and edit/delete their own posts; unauthorized edits are rejected.

#### Phase 4 — Social Interaction
**Goal:** Users can like, comment, save, and share artworks.
**Scope:** Likes with a counter; comments (delete own only); saves to collections; share/copy post URL; backend endpoints with auth and ownership rules; wire social UI away from mock state; like counts feed ranking.
**Done when:** A user can like/unlike with a counter update, comment and delete their own comment, save an artwork, and share a post URL — all persisted.

#### Phase 5 — Discovery & Search
**Goal:** Users can browse, search, filter, and paginate public artworks.
**Scope:** Public read endpoints for the discovery feed; category filter; free-text search by title/tags/artist; pagination; wire discovery, search, and category pages.
**Done when:** A user can browse a paginated public feed, search by keyword, and filter by category.

#### Phase 6 — Ranking
**Goal:** Users can view artwork ranking by all-time likes.
**Scope:** Add read-only ranking endpoints ordered by all-time like count; wire the ranking page to real data.
**Done when:** A user can view an all-time ranking driven by live like data.

#### Phase 7 — Contests
**Goal:** Users can view contest info and submit artworks to a contest.
**Scope:** Contest schema; admin-managed fields (information, rules, prize, criteria, deadline); public contest page; submit endpoint linking an artwork to a contest with deadline and one-entry rules; participants list; wire the contest page and modals.
**Done when:** A user can view contest details and submit an eligible artwork before the deadline; submissions persist and appear in the participants list.

#### Phase 8 — Notifications
**Goal:** Users receive in-app notifications for likes, comments, follows, new posts, and contests.
**Scope:** Notifications schema; notifications feed; read/unread tracking; mark as read; generate notifications from earlier-phase events; wire the dropdown and unread badge.
**Done when:** A user receives and can read in-app notifications; read/unread tracking works.

#### Phase 9 — Artist Management
**Goal:** Admins can invite and manage artist accounts.
**Scope:** Artist invitation flow; admin promotes a user to artist or invites by email; artist account details and management endpoints; guarded by admin role middleware; wire artist-facing status in profiles.
**Done when:** An admin can invite or convert a user to artist and manage artist accounts; non-admins are forbidden.

#### Phase 10 — Admin Panel
**Goal:** Admins can manage users, artists, posts, and contests and moderate content.
**Scope:** Admin-only CRUD and moderation endpoints; user list, ban, role-change; artist management; post removal/hide; contest management; minimal admin UI; guarded by admin role.
**Done when:** An admin can list and act on users, artists, posts, and contests, and moderate content; role checks return 401 and 403 correctly.

#### Phase 11 — Release & Hardening
**Goal:** Integrate all features, harden, test, and deploy the MVP.
**Scope:** Full integration pass; remove remaining mock data; QA plus API/auth/integration/security/upload tests; fix critical bugs; apply audit quick wins (ESLint config, secret rotation, rate limiting, strict TypeScript); deploy via Docker to a production HTTPS URL.
**Done when:** The full end-state flow works on a deployed URL with no critical bugs and no mock data.

#### Phase 12 — Commission & Escrow
**Goal:** Users can order a commission from an artist, pay via a real payment gateway, and release the Artist payout only on completion (escrow).
**Scope:** Commission schema (`commission_packages`, `commission_orders`, `escrow_transactions`, `order_status_history`); endpoints — `POST /api/commissions/{artist}/orders`, `POST /api/orders/{order}/pay`, `POST /api/webhooks/payment-gateway`, `PATCH /api/orders/{order}/status`, `POST /api/orders/{order}/complete`, `POST /api/webhooks/payment-gateway/payout`, `GET /api/admin/escrow-ledger`; authorization via `RoleMiddleware` + `OrderPolicy`; Admin escrow ledger; wire the commission UI (packages, "Ambil Slot", order detail/timeline, Admin ledger). Dispute/refund/cancel money-movement flows are deferred.
**Done when:** A User can create and pay for a commission order, the Artist can manage it through `delivered`, and the escrow payout to the Artist releases only after the User clicks "Order Completed"; Admin can review the escrow ledger.

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| No domain migrations existed initially; every phase adds schema | Add migrations per phase with test coverage |
| Client-side watermarking can be tampered with / removed | Watermark is applied on upload as a UX safeguard, not a security boundary; consider server-side addition as a post-launch hardening follow-up |
| Known auth security gaps — **resolved:** login/registration rate limiting added; token moved out of plain `localStorage` into an in-memory + `sessionStorage` mirror. **Remaining:** committed `APP_KEY` and `APP_DEBUG` in `docker-compose.yml`; token still not an httpOnly cookie | Resolved items were delivered as part of the auth security/hardening work and Phase 1; remaining items are queued for Phase 11 hardening |
| Large legacy mock frontend makes de-mocking substantial | Replace mock data feature-by-feature, one phase at a time |
| Ownership/role permissions span many endpoints | Enforce via role middleware + per-phase ownership policy tests |
| Scope creep into email/push notifications | Explicitly restrict MVP notifications to in-app only |

### 8.1 Dependencies
- Supabase Storage account, bucket, and keys must exist before production uploads (dev may use local disk).
- Production domain, HTTPS certificate, and environment configuration required before deployment.

---

## 9. Definition of Done (MVP)

The MVP is considered complete when **all** of the following hold:

1. A user can register, log in, complete their profile, follow artists, create and upload a watermarked artwork, publish a post, like/comment/save/share, browse artworks, search/filter, view ranking, join a contest, receive in-app notifications, and commission an artist with escrow payment, confirming completion to release the payout.
2. An admin can log in and manage users, artists, posts, and contests, and moderate content — with all actions correctly authorized.
3. **Quality:** every feature has backend validation, permission enforcement, and automated tests; no critical bugs remain; code is reviewed; acceptance criteria are met.
4. **Integration:** no mock data remains in active screens — all screens call the real API.
5. **Release:** the platform is deployed to a production URL over HTTPS, with production database and storage verified, and has passed the final QA approval gate.
6. **Deferred:** Commission dispute/refund/cancel money-movement flows are out of MVP scope (reserved as a future extension).

---

## 10. Launch Checklist

Before launch, confirm:
- [ ] Authentication works end-to-end
- [ ] Post creation/upload/watermark works
- [ ] Social features (like/comment/save/share) work
- [ ] Discovery (browse/search/filter/pagination) works
- [ ] Ranking reflects live data
- [ ] Contest submission and participant tracking work
- [ ] Commission: order creation, payment/escrow hold, and "Order Completed" release work
- [ ] Notifications generate and display correctly
- [ ] Admin panel functions across all management areas
- [ ] All critical bugs fixed
- [ ] Production environment verified (DB, storage, HTTPS, domain)

**Launch sequence:** `Final QA → Approval → Launch`

---

## 11. Post-Launch Maintenance

```
User Feedback → Bug / Improvement → Product Backlog
   → New Sprint → Development → Testing → Release
```

Ongoing maintenance covers: bug fixing, security updates, performance improvement, user feedback triage, feature improvement, and platform monitoring.

---

## 12. Appendix — End-to-End Product Flow

**User flow:**
```
Register → Login → Complete Profile → Follow Artist → Create Artwork
  → Upload Artwork → Publish Post → Like/Comment/Save/Share
  → Browse Artwork → Search/Filter → View Ranking
  → Join Contest → Receive Notifications
  → Order a Commission → Pay (Escrow Hold) → Artist Delivers
  → Confirm "Order Completed" (Escrow Release)
```

**Admin flow:**
```
Login → Manage Users → Manage Artists → Manage Posts
  → Manage Contest → Manage Commission Escrow → Moderate Content
```

**System flow:**
```
React (SPA) → Laravel API → Supabase PostgreSQL + Supabase Storage
```
