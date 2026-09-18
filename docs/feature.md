# StematelArt — Feature List

> Sources: `frontend-legacy/Artvault.jsx` (ARTVAULT high-fidelity UI prototype), `docs/PRD.md` (single consolidated reference — product brief + 11-phase implementation plan).
>
> Status markers:
> - **[Proto]** — UI present in the legacy prototype (mock data / local state).
> - **[Planned]** — in the implementation plan / project brief, not yet built.
> - **[BE done]** — backend API implemented (see `Backend/update.md`); frontend not yet wired.
> - **[Out of MVP]** — present in prototype but explicitly excluded from the MVP scope.

---

## Account
- Registration — [Proto] / [BE done]
- Login — [Proto] / [BE done]
- Logout (token revocation) — [BE done] / [Proto UI]
- Authentication (Sanctum bearer token) — [BE done] / [Proto UI]
- Authorization / Role (user, artist, admin; role middleware) — [BE done] / [Proto UI]
- Profile — [Proto] / [BE done]
- Edit Profile — [Proto] / [BE done]
- Avatar (upload) — [Proto] / [BE done]
- Bio — [Proto] / [BE done]
- Settings (commission status, email notifications, auto-watermark) — [Proto] / [BE done settings]
- Follow / Unfollow — [Proto] / [BE done]
- Followers / Following lists + counts — [Planned]

## Post
- Create Post — [Proto UI] / [BE done]
- View Post (artwork detail) — [Proto]
- Edit Post — [BE done] / [Proto UI]
- Delete Post — [BE done] / [Proto UI]
- Artwork Upload (3-step wizard) — [Proto] / [BE done]
- Image Validation (PNG/JPG, dimensions, size) — [Proto] / [BE done]
- Watermark (client-side, canvas before upload) — [Proto UI] / [Planned]
- Artwork Storage (Supabase object storage) — [BE done]
- Ownership / Permission (PostPolicy) — [BE done]

## Social
- Like / Unlike — [Proto]
- Like Counter — [Proto]
- Comment — [Proto]
- Delete Own Comment — [Planned]
- Save / Unsave (collections) — [Proto]
- Save to collection (pick / create new) — [Proto]
- Share / Copy Post URL — [Proto]

## Discovery
- Browse Public Artworks — [Proto]
- Featured artwork spotlight — [Proto]
- Category rail / filter — [Proto]
- Search (title, tags, artist) — [Proto]
- Infinite scroll / pagination — [Proto] / [BE done pagination]

## Ranking
- All-time ranking by total likes (highest first) — [Proto]
- Top-3 podium + ranked list — [Proto]

## Contest
- Contest Page — [Proto]
- Contest Information — [Proto]
- Rules — [Proto]
- Prize (breakdown) — [Proto]
- Criteria — [Proto]
- Countdown / Deadline — [Proto]
- Submit Artwork (auth-gated) — [Proto]
- Participants list + modal — [Proto]
- Winners view (ended) — [Proto]

## Notification
- Notification dropdown + unread badge — [Proto]
- Like Notification — [Planned]
- Comment Notification — [Planned]
- Follow Notification — [Planned]
- New Post Notification — [Planned]
- Contest Notification — [Planned]
- Mark all read — [Proto]
- Click → navigate to related item — [Proto]

## Artist Management
- Artist Account — [Out of current proto UI]
- Artist Invitation (admin) — [Planned]
- Artist Management (admin) — [Planned]

## Admin Panel
- Admin login — [Planned]
- User Management — [Planned]
- Artist Management — [Planned]
- Post Management — [Planned]
- Contest Management — [Planned]
- Moderation (report → review) — [Planned] / [Proto report]

## Commission (out of MVP)
- Artist list with rating, reviews, specialty — [Proto] · [Out of MVP]
- Open / closed commission status — [Proto] · [Out of MVP]
- Open slots / slot tooltip — [Proto] · [Out of MVP]
- Portfolio preview grid — [Proto] · [Out of MVP]
- Tiered pricing packages — [Proto] · [Out of MVP]
- "Ambil Slot" → commission form (brief, reference image, deadline) — [Proto] · [Out of MVP]
- Order detail, status steps, cancel (escrow) — [Proto] · [Out of MVP]

---

## UI Shared Components (prototype)
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
- DevBar + AnnotationLayer + ExportAll (dev tooling)
- Share popover (copy link, WhatsApp, X, Facebook)
- More menu (download, embed code, report)
- Lightbox fullscreen viewer (Esc / click-outside)

---

## Attribute Legend (plan phases)
- **Phase 1** — Authentication & Session
- **Phase 2** — Profiles & Following
- **Phase 3** — Posts & Artwork Upload (incl. watermark)
- **Phase 4** — Social Interaction (like, comment, save, share)
- **Phase 5** — Discovery & Search
- **Phase 6** — Ranking
- **Phase 7** — Contests
- **Phase 8** — Notifications
- **Phase 9** — Artist Management
- **Phase 10** — Admin Panel
- **Phase 11** — Release & Hardening