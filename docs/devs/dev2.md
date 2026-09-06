# Developer 2 — Development Tasks

## Role

Developer 2 owns the **Engagement & Administration** features: Ranking, Contest, Notifications, Artist Management, and the Admin Panel. This developer turns User-contributed data (likes, follows, posts) into engagement surfaces (rankings, contests, notifications) and provides the admin governance layer over users, artists, posts, and contests. It sits **second** in the delivery order, consuming Developer 1's content/social data.

## Sprint Goal

Build the engagement and governance layers end-to-end: all-time artwork ranking, contest participation with winners, in-app notifications with read/unread tracking, admin-managed artists, and an admin panel for managing users, posts, and contests with moderation — all backed by real data and authorization rules.

---

## Responsibilities

### 1. Ranking (PRD Phase 6)

#### Goal
Provide an all-time ranking of artworks ordered by total likes (highest first), presented as a top-3 podium plus a ranked list, computed from live like data.

#### Scope
- Ranking query/endpoint computing all-time like totals per post, ordered highest first.
- Top-3 podium and a full ranked list in the UI.
- Read-only ranking; no client-supplied ordering or scoring logic trusted from the frontend.
- Wire the Ranking page to the endpoint, replacing mock data.
- Add feature tests for ordering and empty/like-boundary cases.

#### Out of Scope
- Comments, saves, or "trending by recency" metrics beyond all-time like totals.
- Live real-time updates (feed-based refresh is acceptable for MVP).
- Admin override of ranking results.

#### Dependencies
- Likes data — **Developer 1** (Social Interaction).
- Posts data — **Developer 1**.

#### Acceptance Criteria
- Ranking is ordered by all-time total likes, highest first.
- The UI renders a top-3 podium and the ranked list from live data.
- Unauthenticated users can view the ranking (read-only).
- Feature tests verify correct ordering and handling of zero-like posts.
- No mock ranking data remains on the Ranking page.

#### Expected Outcome
A live, accurate all-time ranking fed directly by real like counts.

#### Priority
Medium

---

### 2. Contest (PRD Phase 7)

#### Goal
Let users view contest details (information, rules, prize, criteria, deadline) and submit an eligible artwork to an active contest before the deadline, with a participants list and a winners view once ended.

#### Scope
- Contest data model and endpoints for public contest detail; submission linking an artwork to a contest with a deadline and one-entry-per-user rule.
- Admin-managed contest fields (information, rules, prize, criteria, deadline).
- Auth-gated submission validated against the deadline; a participant list that updates as submissions are made.
- A winners view that appears once the contest ends.
- Wire the Contest page and related modals to the backend, replacing mock data.

#### Out of Scope
- Commission packages or order data (Developer 3).
- Notification generation tied to contest events (this developer's own Notification responsibility below handles it).
- Contest prize payout/escrow mechanics (Developer 3's Commission; not part of contest MVP).

#### Dependencies
- Auth + roles for gating submission — existing (done).
- Published posts eligible for submission — **Developer 1**.
- Provides contest events (submission, ending) that this developer's own Notification feature consumes.

#### Acceptance Criteria
- A user can view contest info, rules, prize, criteria, and deadline.
- Only authenticated users can submit; the deadline is enforced; a user is limited to one entry per contest.
- The participants list reflects live submissions.
- Once the contest ends, a winners view appears.
- Admin can create/edit the managed contest fields.
- Feature tests cover deadline enforcement, single-entry, and admin field management.

#### Expected Outcome
A complete contest lifecycle — view, submit, track participants, and reveal winners — all persisted and admin-driven.

#### Priority
Medium

---

### 3. Notifications (PRD Phase 8)

#### Goal
Generate in-app notifications from earlier events (likes, comments, follows, new posts, contests), track read/unread state with a badge, allow "mark all read," and navigate to the related item on click.

#### Scope
- Notification data model and a feed endpoint with read/unread tracking.
- Generation of in-app notifications from like, comment, follow, new-post, and contest events.
- Notification dropdown with an unread badge; "mark all read" action.
- Click-to-navigate behavior to the related post, profile, or contest.
- In-app only — no email or push delivery.

#### Out of Scope
- Real-time push/WebSockets (feed-based only for MVP).
- Email/push notifications.
- Notification preferences beyond what the existing Settings endpoint already provides.

#### Dependencies
- Social events to notify on (likes, comments, follows) — **Developer 1**.
- Contest events — this developer's own Contest responsibility.
- New-post events — **Developer 1**.

#### Acceptance Criteria
- Notifications are created for likes, comments, follows, new posts, and contests.
- A user sees an unread badge and can mark all as read; read/unread state persists.
- Clicking a notification navigates to the related item.
- Notifications are in-app only (no email/push) for MVP.
- Feature tests verify generation, read/unread tracking, and targeting the correct recipient.

#### Expected Outcome
A functional in-app notification center driven by real platform events, keeping users informed of activity without email or push.

#### Priority
Medium

---

### 4. Artist Management (PRD Phase 9)

#### Goal
Let admins invite or convert a user into an artist account and manage artist account details and status, with all actions guarded by the admin role.

#### Scope
- Admin invitation flow for a user to become an artist (invite by email or convert/promote an existing user).
- Artist account detail and status management endpoints.
- Role-middleware guarding so non-admins are forbidden (403).
- At least a minimal admin-facing surface for artist management.

#### Out of Scope
- Artist-facing commission packages, order acceptance, and payout flows (Developer 3, Commission).
- Contest management (this developer's Admin Panel responsibility below).

#### Dependencies
- Role middleware and `user`/`artist`/`admin` roles — existing (done).
- Artist identity eventually consumed by **Developer 3** (commission orders require artist users).

#### Acceptance Criteria
- An admin can invite or convert a user to artist status.
- An admin can manage artist account details and status.
- Non-admin requests are rejected with 403.
- Feature tests cover invite, convert, manage, and role guards.

#### Expected Outcome
Admins can create and manage artist accounts end-to-end, with correct role enforcement.

#### Priority
Medium

---

### 5. Admin Panel — Users, Posts, Contests & Moderation (PRD Phase 10)

#### Goal
Provide admins the ability to manage users (ban, role-change), artists, posts (remove/hide), and contests, plus a moderation queue for report → review, with all actions role-guarded and returning correct 401 vs. 403.

#### Scope
- Admin-only endpoints/UI for listing and acting on users (ban, role-change), posts (remove/hide).
- Contest management through the admin panel.
- A moderation queue supporting report submission and admin review.
- Correct 401 (unauthenticated) vs. 403 (unauthorized) responses enforced by role middleware.
- Admin login and a minimal admin UI.

#### Out of Scope
- Artist management UI is this developer's own responsibility above (kept separate for clarity, same owner).
- Commission order/escrow administration (Developer 3) — the admin escrow ledger is owned by Developer 3.
- Analytics, dashboards, or billing beyond the MVP-defined management actions.

#### Dependencies
- Posts data — **Developer 1**.
- Contests — this developer's own Contest responsibility.
- Artist accounts — this developer's own Artist Management responsibility.
- Role middleware for admin gating — existing (done).

#### Acceptance Criteria
- An admin can list and act on users (ban, role-change), posts (remove/hide), and contests.
- Report submission feeds a moderation queue that an admin can review.
- All admin endpoints/UI return 401 when unauthenticated and 403 when authenticated but not an admin.
- Feature tests cover each admin action and the 401/403 distinction.

#### Expected Outcome
A working, role-guarded admin panel covering users, posts, contests, and moderation.

#### Priority
High

---

## Collaboration

### Depends On
- **Developer 1** — Likes (Ranking), posts (Ranking, Contest, Admin), follow/new-post/like/comment events (Notifications).
- Existing auth, roles, and session flow — done.

### Provides To
- **Developer 3** — Admin rights (artist records), contest state, and the role/permission guarantees the Commission admin escrow ledger relies on; artist user identity for commission orders.

---

## Definition of Done

- [ ] Implementation completed for all five responsibilities.
- [ ] Requirements from the PRD feature scope satisfied (ranking, contest, notifications, artist management, admin panel).
- [ ] Acceptance criteria verified against the live backend.
- [ ] Tests completed where applicable (backend feature tests; frontend build passes).
- [ ] No known blocking bugs.
- [ ] Changes documented where necessary.