# Developer 3 — Development Tasks

## Role

Developer 3 is the **sole owner of Commission & Escrow** (PRD §4.10 / Phase 12). This is a self-contained, high-complexity commerce domain: artist/package discovery, order creation and payment via a real gateway, escrow hold and release, order lifecycle tracking, and the admin escrow ledger. No other developer works in Commission. Because Commission is a complete PRD phase on its own (gateway integration, escrow money movement, `OrderPolicy`, webhooks, ledger), Developer 3 carries fewer feature titles but at least equal technical risk and effort to the other two developers.

## Sprint Goal

Deliver a working end-to-end commission order flow: a user browses an artist's packages, creates an order ("Ambil Slot") with a brief, reference image, and deadline, pays through a real payment gateway into an escrow hold, the artist accepts and advances the order through `paid → in_progress → delivered`, and the User's "Order Completed" action releases the Artist payout — plus an admin escrow ledger. Dispute/refund/cancel money-movement flows are explicitly deferred.

---

## Responsibilities

### 1. Commission & Escrow (PRD §4.10 / Phase 12) — Sole Ownership

#### Goal
Let users commission an artist, pay through a real gateway, and have the artist paid out only after the user confirms completion — enforcing a strict escrow lifecycle while recording every status change.

#### Scope
- **Artist & package discovery:** artist list with rating, reviews, and specialty; open/closed commission status with slot tooltip; portfolio preview grid; tiered pricing packages (`commission_packages` with price, `platform_fee_rate`, delivery time, terms, active).
- **Order creation ("Ambil Slot"):** the User creates an order against an artist package with a brief, optional reference image, and optional deadline.
- **Payment & escrow:** payment through a real gateway into the **platform's own gateway account** (Admin is escrow custodian; no separate internal wallet); captured by `escrow_transactions` (type `hold` / `release`; future `refund` reserved).
- **Order lifecycle:** `pending_payment → paid (escrow held) → in_progress → delivered → completed → released`, plus `expired` / `cancelled` handling; `disputed` / `refunded` reserved in the schema but not built. Every status change recorded in `order_status_history` (from, to, actor, timestamp).
- **Release trigger:** only the User, from the `delivered` status, can click "Order Completed", which initiates escrow release to the Artist.
- **Role responsibilities:** User — create order, pay, click "Order Completed"; Artist — accept, mark `in_progress` / `delivered`; Admin — view all orders + escrow ledger, manually intervene on failed payouts.
- **Authorization:** `RoleMiddleware` for role checks plus an `OrderPolicy` (modeled on the existing `PostPolicy`) for ownership/permission on mutating order endpoints.
- **Data model & migrations:** `commission_packages`, `commission_orders`, `escrow_transactions`, `order_status_history` per the PRD, with feature tests.
- **Frontend wiring:** commission page (packages, artist list), "Ambil Slot" form, order detail + status timeline, and the admin escrow ledger — de-mocking the existing Commission/Order pages.
- **Profile-page commission status:** on the artist **Profile page**, surface a **commission status** section showing the current/latest in-progress commission(s) for the artist and the **refunding** status of any order. This view belongs on the artist Profile page only — it is **not** shown on the "Profil Saya", "Watermark Generator", or "Pengaturan" screens. Refund status is a read-only display of the order's refund state; the money-movement refund flow itself remains out of MVP scope.

#### Out of Scope
- **Dispute / refund / cancel money-movement flows** — explicitly deferred to a future release. The schema must allow adding `disputed` / `refunded` later, but the flows themselves are NOT built.
- Artist account creation/invitation/management (Developer 2, Artist Management) — Commission consumes artist identity but does not manage it.
- Social features, posts, likes, comments, collections (Developer 1).
- Ranking, contest, notifications, and general admin user/post/contest management (Developer 2).

#### Dependencies
- **Developer 1** — Posts/artwork data for the portfolio preview grid; author/user data for order attribution to artists; shared API-client and type conventions.
- **Developer 2** — Artist user identity and status (Artist Management); admin role guarantees for the escrow ledger gating.
- Existing auth, roles, and `PostPolicy` pattern — done (Commission's `OrderPolicy` should model on `PostPolicy`).
- **External:** a real payment gateway account, webhook endpoint security, an artist payout-method registration mechanism, and a platform fee % policy — several of these are open questions in the PRD (see Risks below).
- **Rules to honor (state machine):** payment required before work begins; "Order Completed" only reachable from `delivered`; payout only after "Order Completed".

#### Acceptance Criteria
- A User can view artist packages, create an order with brief/reference/deadline, and pay through the gateway where the funds land in an escrow hold, not directly to the artist.
- The artist **Profile page** shows a commission status section with the current/latest in-progress commission(s) and the refunding status of any order; this section appears only on the artist Profile page and not on the "Profil Saya", "Watermark Generator", or "Pengaturan" screens.
- The order progresses through `pending_payment → paid → in_progress → delivered → completed → released` with each transition recorded with an actor and timestamp.
- A User cannot advance the order or trigger release except "Order Completed" from `delivered`.
- An Artist can accept and mark `in_progress` / `delivered` but cannot alter payment amounts or self-release escrow.
- An Admin can view all orders and the escrow ledger and manually intervene on failed payouts.
- `OrderPolicy` blocks unauthorized mutations (401 unauthenticated, 403 unauthorized/non-owner).
- Dispute/refund/cancel money-movement flows are NOT implemented; schema leaves room for `disputed` / `refunded`.
- Feature tests cover the lifecycle, permissions, escrow hold/release, and webhook idempotency via `gateway_reference_id`.

#### Expected Outcome
A complete, testable commission domain where money is held in escrow and only released to the Artist after the User confirms completion, with a full admin ledger — and no mock commissioning data remaining in the user flow.

#### Priority
High

---

## Collaboration

### Depends On
- **Developer 1** — Published posts/portfolios, author/user data, shared API patterns.
- **Developer 2** — Artist user identity/status, admin role guarantees for the escrow ledger.
- Existing auth, roles, and policy patterns — done.

### Provides To
- No other developer depends on Commission's internals (it is a leaf in the dependency graph). It connects only inward to the platform's auth, roles, posts, and artist data.

---

## Definition of Done

- [ ] Implementation completed for the Commission & Escrow feature.
- [ ] Requirements from PRD §4.10 satisfied.
- [ ] Acceptance criteria verified against the live backend and gateway sandbox.
- [ ] Tests completed where applicable (lifecycle, permissions, escrow, webhook idempotency; frontend build passes).
- [ ] No known blocking bugs; deferred dispute/refund flows correctly excluded.
- [ ] Changes documented where necessary (new schema, endpoints, gateway config, open questions resolved or recorded).