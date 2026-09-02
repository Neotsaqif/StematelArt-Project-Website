# Update Phase 1 — Account Security

Tanggal: 2026-09-02
Branch: fitur-account-post-social

## Perubahan

- Mendaftarkan alias middleware role pada konfigurasi Laravel 12.
- Mempertahankan middleware RoleMiddleware untuk authorization berbasis role.
- Memulihkan protected endpoint GET /api/user.
- Menambahkan endpoint verifikasi role:
  - GET /api/admin/test untuk admin.
  - GET /api/artist/test untuk artist.
- Menambahkan response error JSON terpusat untuk API:
  - 401 Unauthenticated
  - 403 Forbidden
  - 404 Resource not found
  - 422 Validation error
- Memastikan registration selalu membuat role user dan mengabaikan role dari client.
- Menambahkan feature test untuk registration, login, logout, Sanctum token, protected route, role authorization, validation, dan API 404.
- Memperbarui dokumentasi Phase 1 pada backend.md.

## Validasi

- php artisan route:list: berhasil, 12 route terdaftar.
- composer test: berhasil, 12 test dan 34 assertion lulus.
- git diff --check: berhasil tanpa whitespace error.
- Tidak ada migration, dependency, frontend, .env, atau credential yang diubah.

## Catatan

php artisan migrate:status belum dapat membaca Supabase dari sandbox karena koneksi database ditolak oleh environment. Phase 1 tidak menambahkan atau mengubah migration.

---

# Update Phase 2 — Account Profile & Basic Settings

## Perubahan

- Menambahkan migration baru untuk field users.bio dan users.avatar.
- Menambahkan migration baru untuk tabel user_settings dengan theme dan notifications_enabled.
- Menambahkan model UserSetting serta relationship User::settings().
- Menambahkan ProfileController untuk melihat dan mengubah profile authenticated user.
- Menambahkan upload dan replacement avatar menggunakan Laravel Storage.
- Menambahkan SettingsController untuk settings account dasar.
- Menambahkan route profile dan settings di bawah auth:sanctum.
- Menambahkan konfigurasi PROFILE_AVATAR_DISK dengan default public.
- Menambahkan feature test profile, avatar, settings, validation, dan role escalation.
- Memperbarui dokumentasi Phase 2 pada backend.md.

## Endpoint Baru

- GET /api/profile
- PUT /api/profile
- POST /api/profile/avatar
- GET /api/settings
- PUT /api/settings

## Keamanan

- Profile dan settings hanya menggunakan authenticated user dari request.
- Email, role, password, token, dan field sensitif tidak dapat diubah melalui profile API.
- Upload avatar dibatasi pada jpg, jpeg, png, webp dengan maksimum 5 MB.
- Filename asli tidak dipercaya dan tidak digunakan sebagai storage path.
- Supabase Storage belum dikonfigurasi; implementasi menggunakan disk Laravel yang tersedia.

## Validasi

- Focused test Phase 2: 13 test, 47 assertion lulus.
- Full suite: 25 test, 81 assertion lulus.
- php artisan route:list: berhasil, 17 route terdaftar.
- php artisan migrate:status: seluruh 7 migration berstatus Ran; migration Phase 2 berjalan pada batch 4.
- git diff --check: berhasil tanpa whitespace error.
- package-lock.json, .env, frontend, credential, dependency, dan migration lama tidak diubah.

---

# Update Phase 3 — Follow System

## Perubahan

- Menambahkan migration baru untuk tabel follows.
- Menambahkan model Follow.
- Menambahkan relationship followers() dan following() pada User.
- Menambahkan FollowController untuk follow, unfollow, followers, dan following.
- Menambahkan route follow dengan auth:sanctum dan route model binding.
- Menambahkan pagination aman dengan default 15 dan maksimum 50.
- Menambahkan perlindungan self-follow, duplicate follow, dan follower_id injection.
- Menambahkan feature test FollowTest.
- Memperbarui dokumentasi Phase 3 pada backend.md.

## Endpoint Baru

- POST /api/users/{user}/follow
- DELETE /api/users/{user}/follow
- GET /api/users/{user}/followers
- GET /api/users/{user}/following

## Validasi

- Focused FollowTest: 14 test, 38 assertion lulus.
- Focused FollowTest: 14 test, 38 assertion lulus.
- Full suite: 39 test, 119 assertion lulus.
- php artisan route:list: berhasil, 21 route terdaftar.
- php artisan migrate:status: seluruh 8 migration berstatus Ran; migration Phase 3 berjalan pada batch 5.
- git diff --check: berhasil tanpa whitespace error.
- Tidak ada post, like, comment, save, share, watermark, notification, frontend, credential, atau package-lock.json yang diubah.

---

# Update Phase 4 — Post Core

## Perubahan

- Menambahkan migration baru untuk tabel posts.
- Menambahkan model Post dan relationship User::posts() serta Post::user().
- Menambahkan PostPolicy untuk role dan ownership.
- Menambahkan PostController untuk list, show, create, update, dan delete.
- Menambahkan route post di bawah auth:sanctum.
- Menambahkan pagination default 15 dengan maksimum 50.
- Menambahkan validasi title, description, tags, artwork_path, dan per_page.
- Menambahkan perlindungan user_id injection dan role escalation.
- Menambahkan feature test PostTest.
- Memperbarui dokumentasi Phase 4 pada backend.md.

## Endpoint Baru

- GET /api/posts
- GET /api/posts/{post}
- POST /api/posts
- PUT /api/posts/{post}
- DELETE /api/posts/{post}

## Batasan

artwork_path hanya storage reference. Upload binary, Supabase Storage, penghapusan file artwork, watermark, likes, comments, saves, shares, dan moderation belum diimplementasikan pada Phase 4.

## Validasi

- Focused PostTest: 14 test, 53 assertion lulus.
- Full suite: 53 test, 172 assertion lulus.
- php artisan route:list: berhasil, 26 route terdaftar.
- php artisan migrate:status: seluruh 9 migration berstatus Ran; migration Phase 4 berjalan pada batch 6.
- git diff --check: berhasil tanpa whitespace error.
- Tidak ada migration lama, frontend, .env, credential, dependency, atau package-lock.json yang diubah.
