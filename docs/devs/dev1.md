# Developer 1 — Development Tasks

## Role

Developer 1 owns the **Content & Social Core** of the platform. This is the foundational vertical slice that produces the users' primary content (profiles, posts/artworks with watermarking, likes, saves, collections) and the public-facing discovery feed. Every other feature area — Ranking, Contest, Notifications, and Commission portfolios — reads data that Developer 1's features create. Delivery order is therefore **first**, to unblock Developers 2 and 3.

## Sprint Goal

De-mock the Account/Profile, Post/Artwork, and Social flows against the already-implemented backend endpoints, and build the social-interaction and discovery/search features end-to-end (backend + frontend + tests) so users can share and browse artwork against live data instead of local mock state.

---

## Responsibilities

### 1. Profiles & Following — Frontend Wiring (PRD Phase 2)

#### Goal
The backend (Profile, Settings, Follow controllers + tests) already exists. This work replaces the mock profile data on the frontend with real API data so users can view, edit, and follow against the live backend.

#### Scope
- Expose the profile, avatar, and follow endpoints through the shared frontend API client, following the existing authenticated-fetch and JSON-envelope conventions.
- Wire the Profile page and Settings page to real data for: profile fields (bio, location, website), avatar upload/replacement, follower/following counts, and the follow/unfollow button.
- Reflect follow state and counts immediately (optimistic update acceptable) and persist across reloads.
- Represent the appropriate data model (avatar URL, bio, counts) in the shared frontend types.

#### Out of Scope
- Backend changes to profile/settings/follow (already implemented and tested).
- Artworks on the profile gallery (owned by Developer 1's Posts responsibility below, but explicitly not part of this specific task if it would block it).
- Commission status/pricing UI on the profile (owned by Developer 3).
- Auth/session logic (already delivered).

#### Dependencies
- Backend endpoints (`GET/PUT /profile`, `POST /profile/avatar`, `GET/PUT /settings`, follow routes) — **existing, done**.
- Shared API client (`services/api.ts`) and token handling — **existing, done**.
- Requires the auth session to be present, which is already implemented.

#### Acceptance Criteria
- A logged-in user can edit their profile and see changes persist after reload.
- A user can upload/replace an avatar and the updated avatar is shown.
- Follower/following counts display live values and change immediately on follow/unfollow.
- A non-owner attempting to edit another profile receives a 403 (or is prevented client-side) without corrupting state.
- Self-follow is prevented.
- The active user's profile and settings pages no longer render mock avatar/bio/count data.

#### Expected Outcome
Users can manage their real profile and follow each other entirely through the API, with no mock profile/follow data remaining on these screens.

#### Priority
High

---

### 2. Posts & Artwork Upload — Frontend Wiring (PRD Phase 3)

#### Goal
The backend already implements post CRUD, artwork upload with image validation, ownership enforcement (`PostPolicy`), Supabase storage, and **server-side watermarking**. This work wires the multi-step artwork-upload wizard, the artwork detail page, and edit/delete actions to the live backend so users publish real watermarked artwork.

#### Scope
- Expose post list/get/create/update/delete and artwork-upload through the shared API client using the existing JSON envelope.
- Wire the 3-step upload wizard to create posts and upload artwork, honoring the existing image-validation rules (PNG/JPG, dimensions, size).
- Wire edit and delete from the artwork detail page; enforce owner-only actions (client + rely on `PostPolicy` 403s).
- Display artwork via the storage/media URLs returned by the backend.
- Treat the existing server-side watermark service as the authenticator of record for uploads.

#### Out of Scope
- Adding a new watermarking implementation (the backend already applies the StematelART watermark server-side via `ArtworkWatermarkService`); do not build a competing client-side watermark-application flow for uploads.
- Post management / moderation admin views (owned by Developer 2).
- Portfolio grid patterns beyond what is needed for the post/feed flow (Commission portfolio reuses these).

#### Dependencies
- Backend post & storage endpoints — **existing, done**.
- Developer 1's own Profile wiring where posts reference an author's profile.
- Developer 3 depends on the resulting posts (as portfolio preview data) and on author ownership data.

#### Acceptance Criteria
- A user can create a post through the upload wizard and the watermarked artwork is stored and returned by the backend.
- Image uploads that fail PNG/JPG / dimension / size validation show the validation error and are not saved.
- A post owner can edit and delete their post; the actions persist and disappear from feeds.
- Deleting another user's post is blocked (403) by `PostPolicy`.
- Reloading shows the post and its artwork from the API, not from local mock data.

#### Expected Outcome
A complete publish-to-browse loop exists: users create, upload (server-side watermarked), view, edit, and delete real posts, and the artwork is served from storage — no mock artwork remains in the create/view flows.

#### Priority
High

---

### 3. Social Interaction — Like, Comment, Save, Share (PRD Phase 4)

#### Goal
Add the full social layer on top of posts so users can like/unlike, comment (and delete their own), save artwork into collections, and copy a post's share URL. Like counts feed directly into Developer 2's Ranking and Notification features.

#### Scope
- Like/unlike endpoints and frontend wiring; a like counter that updates immediately and persists.
- Comment creation and delete-own-comment endpoints and UI, with delete restricted to the comment author.
- Save/unsave to collections, supporting picking an existing collection or creating a new one.
- Share action that copies the post URL.
- The related data structures (likes, comments, collections, saves) with migrations and feature tests, following the existing per-phase migration + SQLite test conventions.
- Allow the public post feed and page to read like/comment/save state.

#### Out of Scope
- New-post, like, or comment notifications and read/unread badges (owned by Developer 2, PRD Phase 8) — but keep the social events this developer emits structured so notifications can be generated from them later.
- Admin moderation of comments/posts (owned by Developer 2, Admin Panel).
- Any Commission-related social or rating data (owned by Developer 3).

#### Dependencies
- Posts API (Developer 1's own responsibility above) as the parent resource.
- Provides likes/comments data to **Developer 2** (Ranking computes from likes; Notifications generate from like/comment/post events).
- Collections are user-owned; this developer owns the full collection domain end-to-end.

#### Acceptance Criteria
- Toggling like/unlike updates the counter without a full reload and persists.
- A user can post a comment and delete only their own comment; deleting another's comment is forbidden (403).
- A user can save an artwork to an existing or newly created collection, and unsave it.
- The share action copies the post's URL to the clipboard.
- Backend validation, permission enforcement, and feature tests exist for likes, comments, and collections.

#### Expected Outcome
A working social layer where likes, comments, and collections persist against the backend and feed the ranking/notification systems, with no mock social data remaining.

#### Priority
High

---

### 4. Discovery & Search (PRD Phase 5)

#### Goal
Provide public browsing of artworks with a featured spotlight, category filtering, free-text search across title/tags/artist, and pagination/infinite scroll — all readable without authentication.

#### Scope
- Public artwork feed endpoint backed by paginated data (respecting existing pagination conventions).
- Free-text search across post title, tags, and artist name.
- Category rail/filter support.
- Featured-artwork spotlight on the discovery home.
- Wire the Discovery, Search, Category, and related pages to these endpoints; support infinite scroll/pagination in the UI.
- Read access must not require authentication; only mutating actions are authenticated.

#### Out of Scope
- Ranking views (Developer 2).
- Contest submission surfaces (Developer 2) — though eligibility may read published posts.
- Admin content removal/hide (Developer 2, Admin Panel).
- Commission portfolio/preview uses of the feed (Developer 3).

#### Dependencies
- Posts/artwork data (Developer 1's own responsibility above) as the search/filter source.
- Public access must interoperate with the existing read-only browsing requirement (no auth token required for reads).

#### Acceptance Criteria
- An unauthenticated visitor can browse and search public artworks.
- Search returns results matching title, tags, or artist name.
- Category filtering narrows the feed to the selected category.
- Pagination/infinite scroll loads additional results without duplicates.
- The featured spotlight renders a designated public artwork.
- No mock discovery/search data remains on these screens.

#### Expected Outcome
A browsable, searchable public feed fully backed by the API, forming the primary discovery surface of the platform.

#### Priority
High

---

## Collaboration

### Depends On
- Existing auth/session flow and shared API client — already delivered.
- Existing backend profile/settings/follow/post endpoints — already delivered.

### Provides To
- **Developer 2** — Posts, likes, comments, collections, and follows (Ranking computes from likes; Notifications generate from like/comment/post events; Contest lists eligible posts).
- **Developer 3** — Published posts as portfolio/preview data for artist commission pages; author/user data for order attribution.
- **All** — The shared frontend API-service and type conventions this developer extends (JSON envelope, authenticated fetch) become the pattern Developers 2 and 3 follow.

---

## Definition of Done

- [ ] Implementation completed for all four responsibilities.
- [ ] Requirements from the PRD feature scope satisfied (profiles, posts/artwork, social, discovery).
- [ ] Acceptance criteria verified against the live backend.
- [ ] Tests completed where applicable (backend feature tests for social/discovery; frontend build passes).
- [ ] No known blocking bugs.
- [ ] Changes documented where necessary (e.g., new endpoints/models noted in the project's docs).