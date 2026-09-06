# Implementation Plan: StematelArt

## 1. Overview

StematelArt is an art community platform for the MVP. Users and artists can share, discover, like, comment on, save, and rank artworks. Users can join contests and receive notifications. Admins can manage users, artists, posts, and contests, and also moderate content. Commission is explicitly excluded from the MVP scope.

The frontend is currently a high-fidelity mock prototype. The backend currently provides authentication only. This plan turns the full MVP scope into dependency-ordered, feature-sized phases. Each phase delivers a complete user-facing feature end-to-end.
##2. Assumptions & Open Questions

- Assumption: Supabase Storage is the production asset store for artwork and avatars. Dev and test may use local disk. Laravel Flysystem config keeps this swappable.
- Assumption: No domain schema exists yet. Only users, token, cache, and jobs tables exist. Each phase introduces its own migrations. Tests run on in-memory SQLite. Dev uses Postgres.
- Assumption: Roles are user, artist, and admin. They already exist on the users table. The role middleware enforces them. Sanctum bearer-token authentication is already in place for register, login, logout, and user.
- Assumption: Notifications are in-app only for the MVP. No email or push.
- Assumption: The existing frontend will be unwired from mock data feature-by-feature. Only in the phase that delivers the matching endpoint.
- Assumption: frontend-legacy is treated as reference only.
- Open question: watermarking approach is undecided. Client-side before upload or server-side. Flagged inline in Phase 3.

##3. Tech Stack / Architecture

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, react-router-dom. Existing UI can be reused.
- Backend: Laravel 12 REST API with Sanctum. Consistent JSON envelope. RoleMiddleware. Existing exception rendering.
- Database: PostgreSQL. Supabase in production. Local Postgres via Docker. In-memory SQLite for tests.
- Storage: object storage for uploads via Flysystem. Supabase Storage in prod. Local disk in dev.
- Deployment: Docker Compose. nginx serves the frontend build and proxies /api to the backend.
- Auth: Laravel Sanctum bearer tokens. The current client stores the token in memory with a sessionStorage mirror for same-tab reload persistence.
- Data delivery: relational Postgres. Notifications delivered via a simple notifications feed. No websockets for MVP.
- Architecture: Decoupled API plus SPA. It matches the existing repo layout.
##4. Phases

### Phase 1: Authentication & Session — Completed with known issues
Goal: Users can register, log in, log out, and stay authenticated. Scope: Finalize the existing Sanctum auth into a reliable client flow. Add a shared authenticated fetch helper. Keep the token safer. Make logout revoke the token server-side. Fix the broken auth items from the audit. Done when: A user can sign up, log in, reach protected views, and log out. Refresh keeps the session.

### Phase 2: Profiles & Following
Goal: Users can view and edit their profile and follow artists. Scope: Add profile fields such as bio, avatar, and social links. Add profile endpoints. Add avatar upload. Add follower and following lists and counts. Add the follow and unfollow action with ownership rules. Wire the existing profile page to these endpoints. Done when: A user can edit their profile and upload an avatar. A user can follow an artist and see counts persist.

### Phase 3: Posts & Artwork Upload
Goal: Users can publish an artwork post with upload and watermark. Scope: Add the artworks and posts schema. Add CRUD endpoints with ownership checks. Add artwork upload with validation and storage. Add a watermark step. Inline risk: watermarking approach is undecided. Plan for server-side watermark generation in PHP. Fall back to client-side canvas if needed. Wire the upload, watermark, land artwork detail routes. Done when: A user can upload a validated, watermarked artwork, edit, or delete their own posts. Unauthorized edits are rejected.

### Phase 4: Social Interaction
Goal: Users can like, comment, save, and share artworks. Scope: Add likes with a counter. Add comments with delete own comment only. Add saves to collections. Add share or copy-post-URL. Add backend endpoints with auth and ownership rules. Wire the social UI away from mock state. Like counts feed ranking. Done when: A user can like and unlike with a counter update. A user can comment and delete their own comment. A user can save an artwork and share a post URL. All persisted.
### Phase 5: Discovery & Search
Goal: Users can browse, search, filter, and paginate public artworks. Scope: Add public read endpoints for the discovery feed. Add filtering by category. Add free-text search by title, tags, or artist. Add pagination. Wire the discovery, search, and category pages. Done when: A user can browse a paginated public feed. A user can search by keyword. A user can filter by category.

### Phase 6: Ranking
Goal: Users can view artist and artwork ranking by likes. Scope: Add ranking endpoints. Order by like count all-time. Serve as read-only. Wire the ranking page to real data. Done when: A user can view an all-time ranking driven by live like data.

### Phase 7: Contests
Goal: Users can view contest info and submit artworks to a contest. Scope: Add contest schema. Add admin-managed fields such as information, rules, prize, criteria, and deadline. Add a public contest page. Add a submit endpoint linking an artwork to a contest. Validate deadline and one-entry rules. Add a participants list. Wire the contest page and modals. Done when: A user can view contest details. A user can submit an eligible artwork before the deadline. Submissions persist and appear in the participants list.

### Phase 8: Notifications
Goal: Users receive in-app notifications for likes, comments, follows, new posts, and contests. Scope: Add a notifications schema. Add a notifications feed. Track read and unread. Mark as read. Generate notifications from events in earlier phases. Wire the notification dropdown and unread badge. Done when: A user receives and can read in-app notifications. Read and unread tracking works.
### Phase 9: Artist Management
Goal: Admins can invite and manage artist accounts. Scope: Add an artist invitation flow. An admin can promote a user to artist or invite by email. Add artist account details and management endpoints. Guard by the admin role middleware. Wire artist-facing status in profiles. Done when: An admin can invite or convert a user to artist. An admin can manage artist accounts. Non-admins are forbidden.

### Phase 10: Admin Panel
Goal: Admins can manage users, artists, posts, and contests. Admins can moderate content. Scope: Add admin-only CRUD and moderation endpoints. Add user list, ban, and role-change. Add artist management. Add post removal or hide. Add contest management. Add a minimal admin UI. Guard all by the admin role. Done when: An admin can list and act on users, artists, posts, then contests. An admin can moderate content. Role checks return 401 and 403 correctly.

### Phase 11: Release & Hardening
Goal: Integrate all features, harden, test, and deploy the MVP. Scope: Run a full integration pass. Remove remaining mock data. Run QA plus API, auth, integration, security,and upload tests. Fix critical bugs. Apply the audit quick wins such as ESLint config, secret rotation, rate limiting, then strict TypeScript. Deploy via Docker to a production URL with HTTPS. Done when: The full end-state flow works on a deployed URL. No critical bugs. Mock data removed.
##5. Risks / Dependencies

- Risk: No domain migrations exist. Every phase adds schema. Mitigate by adding migrations per phase with test coverage.
- Risk: Upload, storage, then watermarking are new capabilities. Server-side watermarking may be slow. Mitigate by validating up front then falling back to client-side canvas.
- Risk: Auth security issues from the audit. A committed APP_KEY exists. A token sits in localStorage. No login rate limiting. Mitigate via the audit quick wins in Phase 11.
- Risk: The large mock frontend makes de-mocking a big task. Mitigate by replacing mock data feature-by-feature per phase.
- Risk: Owner and role permissions span many endpoints. Mitigate with roles middleware then per-phase ownership tests.
- Risk: Keep notifications in-app only. Avoid scope-creep into email or push.
- Dependency: Supabase Storage account, bucket, then keys are needed before production uploads. Dev can use local disk.
- Dependency: Domain, HTTPS, then production env are required before deployment.

##6. Definition of Done

The MVP is complete when all the following hold.

- A user can register, log in, complete their profile, follow artists, create and upload a watermarked artwork, publish a post, like and comment and save and share, browse artworks, search and filter, view ranking, join a contest, then receive in-app notifications.
- An admin can log in then manage users, artists, posts, then contests. An admin can moderate content. All actions are authorized correctly.
- Quality: Every feature has backend validation, permission, then tests. No critical bugs. Code is reviewed. Acceptance criteria are met.
- Integration: No mock data remains in active screens. All screens talk to the API.
- Release: Deployed to a production URL over HTTPS. Production database then storage are verified. The final QA approval launch gate is passed.
- Deferred: Commission is explicitly out of MVP scope.
