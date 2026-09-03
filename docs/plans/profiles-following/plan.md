# Plan: Profiles & Following

## Metadata
- Feature: Profiles & Following(Phase 2.
- Source: docs/IMPLEMENTATION_PLAN.md — Phase 2
- Status: Not started
- Target: Edit profile, upload avatar, follow artists

## Goal / Outcome
A logged-in user can edit their profile then upload an avatar. Any user can follow or unfollow an artist then see follower then following counts persist.

## Scope & Assumptions
- In scope: profile fields, profile endpoints, avatar upload, follow then unfollow, follower then following lists then counts, then wiring the existing ProfilePage to real data.
- Out of scope: artworks on the profile(Phase 3. Commission panel(out of MVP. Full watermarking(Phase 3.
- Assumption: Profile fields from the plan are bio, avatar, social links(website optionally location.
- Assumption: Store avatar via the existing Flysystem abstraction(local disk in dev, Supabase Storage in prod.
- Assumption: Follow is a one-way directional relationship between any two users. Self-follow is forbidden.
- Assumption: frontend-legacy is reference only.

## Task List

### Backend — schema
- [ ] Add a migration for profile fields on users.
  - [ ] Add nullable bio, location, website columns.
  - [ ] Add nullable avatar_path column.
- [ ] Add a migration for the follows table.
  - [ ] id, follower_id, followee_id, timestamps.
  - [ ] Unique constraint on follower/followee pair.
  - [ ] Cascade delete on both foreign keys.
- [ ] Create the Follow model them add User relationships.
  - [ ] followers() then following() belongsToMany helpers.

### Backend — profile API (ProfileController
- [ ] Add GET /api/users/{user} public profile with counts.
  - [ ] Include avatar, bio, name, follower count, following count, works count.
- [ ] Add PUT /api/users/{user} update own profile.
  - [ ] Validate bio, location, website length then format.
  - [ ] Allow only the owner (403 otherwise. Only authenticated users may update.
- [ ] Add avatar upload handling in the update endpoint.
  - [ ] Validate image type then size.
  - [ ] Store via Storage disk then set avatar_path.
- [ ] Add POST /api/users/{user}/follow.
  - [ ] Auth required; forbid self-follow(422.
  - [ ] Return current follower count then following state.
- [ ] Add DELETE /api/users/{user}/follow(unfollow.
- [ ] Add GET /api/users/{user}/followers then /following list endpoints(paginated.
- [ ] Route all through existing middleware then JSON envelope conventions.

### Backend — tests(tests/Feature/ProfileTest.php
- [ ] Caller of profile endpoints. Public profile readable without auth.
- [ ] Update works for owner only(401 unauthenticated, 403 non-owner.
- [ ] Follow then unfollow persist.
  - [ ] Self-follow rejected. Follow reverse idempotent(no duplicate row.
- [ ] Avatar upload stores then serves the image.
- [ ] php artisan test passes.

### Frontend — api services(services/api.ts
- [ ] Add fetchProfile(GET /users/{id}.
- [ ] Add updateProfile with optional avatar FormData.
- [ ] Add followUser then unfollowUser helpers.
- [ ] Add fetchFollowers then fetchFollowing list helpers.

### Frontend — state then pages
- [ ] Extend types with a ProfileDTO(avatarUrl, bio, location, website, followerCount, followingCount, worksCount.
- [ ] Wire AppContext followed state to the API.
  - [ ] Replace mock followed set reads with real followed entity data.
  - [ ] toggleFollow calls followUser or unfollowUser then updates counts.
- [ ] Rewire ProfilePage to real data.
  - [ ] Fetch profile via fetchProfile by userId.
  - [ ] Render real avatar image, bio, location, website.
  - [ ] Show real follower count, following count, works count.
  - [ ] Keep the Minta Komisi button disabled or hidden(out of MVP.
- [ ] Wire the follow button on ProfilePage to the API.

### Verification
- [ ] Manual: log in then edit own bio then upload an avatar then see it update.
- [ ] Manual: follow then unfollow an artist then confirm counts change then persist across reload.
- [ ] Manual: a non-owner gets a forbidden error when trying to edit another profile.
- [ ] npm run build passes(frontend.
- [ ] php artisan test passes(Backend.

## Acceptance Criteria / Definition of Done
- A user can edit their profile then upload an avatar.
- Any user can follow then unfollow an artist.
- Follower then following counts persist across reloads.
- Avatar image is stored via the storage abstraction then served correctly.
- Permission rules return 401 then 403 correctly.
- Self-follow is rejected.
- The ProfilePage no longer uses mock PROFILE data for the active profile.

## Open Questions / Risks
- Social links shape: single website vs multiple accounts. Starting with website(plus optional location.
- Avatar storage disk wiring needs a Supabase bucket then keys before production uploads. Dev uses local disk.
- ProfilePage is currently the artist showcase view. Confirm whether the own-profile edit UI lives in SettingsPage instead.
