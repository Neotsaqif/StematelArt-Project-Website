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

---

# Update Phase 5 — Supabase Storage dan Artwork Upload

## Perubahan

- Menambahkan disk `supabase` S3-compatible dan konfigurasi `ARTWORK_STORAGE_DISK`.
- Menambahkan `ArtworkStorageService` untuk upload generated path, delete trusted path, dan temporary URL 15 menit.
- Mengubah create post menjadi upload multipart `artwork` wajib.
- Menambahkan replacement artwork pada update dan cleanup artwork saat delete post.
- Menambahkan rollback praktis saat database gagal dan warning aman saat cleanup gagal.
- Menambahkan focused `ArtworkStorageTest` dengan fake configured disk.
- Memperbarui `PostTest` agar menggunakan fake disk yang sama.

## Batasan

Supabase bucket nyata belum diverifikasi dari environment ini. Automated tests menggunakan fake filesystem. Bucket harus dibuat dan credential dikonfigurasi di environment deployment; watermark belum termasuk Phase 5.

## Validasi

- Artwork: image `jpg`, `jpeg`, `png`, atau `webp`, maksimum 10 MB.
- Path: `artworks/{user_id}/{uuid}.{extension}`; `artwork_path` client diabaikan.
- `artwork_url`: signed temporary URL bila driver mendukung, selain itu `null`.

## Hasil Verifikasi Phase 5

- `php artisan config:clear`: berhasil.
- `php artisan migrate:status`: seluruh 9 migration berstatus `Ran` sampai migration posts batch 6; tidak ada migration baru pada Phase 5.
- `php artisan route:list`: berhasil, 26 route terdaftar.
- `php artisan test tests/Feature/PostTest.php`: 14 test, 52 assertion lulus.
- `php artisan test tests/Feature/ArtworkStorageTest.php`: 8 test, 31 assertion lulus.
- `composer test`: 61 test, 202 assertion lulus.
- `git diff --check`: berhasil tanpa whitespace error.
- Supabase nyata belum diuji; automated storage test menggunakan fake configured disk.

---

# Update Authentication Security Audit

## Temuan dan Perbaikan

- Menambahkan rate limiter Laravel-native untuk login dan registration.
- Menetapkan expiry token Sanctum default 7 hari melalui `SANCTUM_TOKEN_EXPIRATION` tanpa mengubah `.env`.
- Membungkus registration user dan token dalam transaction.
- Membuat logout aman untuk authentication tanpa current bearer token.
- Mengonsolidasikan API exception response agar 401/403/404/422/429/500 konsisten dan tidak membocorkan detail internal.
- Merapikan `AuthController` dan mempertahankan role registration tetap `user`.
- Menambahkan regression tests untuk throttling, expiry, logout, role security, dan error leakage.

## Hasil Verifikasi

- `php artisan test tests/Feature/AuthSecurityTest.php`: 16 test, 61 assertions lulus.
- `composer test`: 76 test, 264 assertions lulus.
- Migration database tidak berubah; seluruh 9 migration existing tetap digunakan.
- Tidak ada perubahan frontend, migration, credential, `.env`, atau file untracked pengguna.

## Risiko Tersisa

- Token yang belum logout tetap valid sampai expiry 7 hari; mekanisme revoke-all-devices atau password reset belum termasuk audit ini.
- Throttling berbasis cache memerlukan cache backend yang sesuai pada deployment multi-instance agar limit konsisten antar server.

---

# Update Phase 6 — Server-Side Artwork Watermark

## Perubahan

- Menambahkan `ArtworkWatermarkService` berbasis native PHP GD.
- Menerapkan watermark `StematelART` di posisi bottom-right sebelum upload storage.
- Mempertahankan format JPG, PNG, dan WebP serta dimensi image.
- Mengubah storage flow agar menyimpan binary hasil watermark, bukan file asli.
- Mempertahankan rollback upload, replacement, ownership, authorization, dan cleanup Phase 5.
- Menambahkan `ArtworkWatermarkTest` dengan verifikasi binary output benar-benar berubah.

## Hasil Verifikasi

- `php artisan test tests/Feature/ArtworkWatermarkTest.php`: 9 test, 33 assertions lulus.
- `php artisan test tests/Feature/PostTest.php`: 14 test, 52 assertions lulus.
- Native GD: tersedia; JPEG, PNG, WebP, dan TrueType text rendering tersedia.
- Intervention Image: tidak terpasang dan tidak diperlukan.
- Migration database: tidak berubah; schema Phase 5 tetap digunakan.

- `php artisan optimize:clear`: berhasil dengan akses database yang tersedia.
- `php artisan migrate:status`: seluruh 9 migration berstatus `Ran`; tidak ada migration Phase 6.
- `php artisan route:list`: berhasil, 26 route terdaftar.
- `php artisan test tests/Feature/ArtworkWatermarkTest.php`: 9 test, 33 assertions lulus.
- `php artisan test tests/Feature/PostTest.php`: 14 test, 52 assertions lulus.
- `composer test`: 70 test, 235 assertions lulus.
- `git diff --check`: berhasil tanpa whitespace error.

## Batasan

Verifikasi upload ke bucket Supabase nyata belum dilakukan dalam automated test. Test memakai fake filesystem. Verifikasi visual pada temporary URL Supabase perlu dilakukan manual setelah environment deployment aktif.
