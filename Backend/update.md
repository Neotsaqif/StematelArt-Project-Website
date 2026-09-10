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

---

# Update Phase 1 — Commission Package Domain

Tanggal: 2026-09-09
Branch: feature/commission-and-escrow

## Perubahan

- Menambahkan migration baru untuk tabel commission_packages.
- Menambahkan model CommissionPackage dengan fillable, casts, dan artist() relationship.
- Menambahkan commissionPackages() HasMany relationship pada model User.
- Menambahkan CommissionPackagePolicy untuk authorization (view, create, update, delete).
- Menambahkan CommissionPackageController dengan method index, show, store, update, destroy.
- Menambahkan 5 route baru di bawah auth:sanctum:
  - GET  /api/commission/packages
  - GET  /api/commission/packages/{commissionPackage}
  - POST /api/artist/commission/packages
  - PUT  /api/artist/commission/packages/{commissionPackage}
  - DELETE /api/artist/commission/packages/{commissionPackage}
- Menambahkan feature test CommissionPackageTest.php dengan 43 test case dan 105 assertions.
- Memperbarui progress tracker commission.md (Phase 1 marked [x] COMPLETE).

## Endpoint Baru

- GET /api/commission/packages — list active packages, paginated, eager-load artist
- GET /api/commission/packages/{commissionPackage} — show package detail
- POST /api/artist/commission/packages — create package (artist/admin only)
- PUT /api/artist/commission/packages/{commissionPackage} — update package (owner artist/admin)
- DELETE /api/artist/commission/packages/{commissionPackage} — deactivate package (sets active=false)

## Keamanan

- artist_id tidak pernah diterima dari request; selalu diambil dari authenticated user.
- Role injection dari request body tidak berpengaruh pada authorization.
- Policy CommissionPackagePolicy memvalidasi ownership melalui relasi Eloquent, bukan artist_id dari request.
- DELETE menggunakan soft-deactivation (active=false), bukan hard delete, untuk preservasi history.
- Response eager-load artist menggunakan kolom terbatas (id, name, email, role, bio, avatar); password dan remember_token tidak bocor.
- Pagination dibatasi maksimum 50 per halaman.

## Validasi

- title: required, string, max:255
- description: nullable, string, max:5000
- price: required, integer, min:0
- platform_fee_rate: required, numeric, min:0, max:1
- delivery_time: required, integer, min:1
- terms: nullable, string, max:5000
- active: sometimes, boolean

## Hasil Verifikasi

- php artisan test tests/Feature/CommissionPackageTest.php: 43 test, 105 assertion lulus.
- composer test (full suite): 119 test, 369 assertion lulus (76 existing + 43 new).
- php artisan migrate:status: seluruh 10 migration berstatus Ran; migration Phase 1 Commission berjalan pada batch 8.
- php artisan route:list: berhasil, 31 route terdaftar (5 route baru commission).
- git diff --check: berhasil tanpa whitespace error.
- Tidak ada migration lama, Auth, Profile, Follow, Post, Storage, Watermark, frontend, .env, credential, atau package-lock.json yang diubah.

---

# Update Phase 2 — Commission Order Domain

Tanggal: 2026-09-10
Branch: feature/commission-and-escrow

## Perubahan

- Menambahkan migration baru untuk tabel commission_orders.
- Menambahkan model CommissionOrder dengan fillable, casts, dan relationships (package, buyer, artist).
- Menambahkan commissionOrders() dan commissionSales() HasMany relationships pada model User.
- Menambahkan orders() HasMany relationship pada model CommissionPackage.
- Menambahkan CommissionOrderPolicy untuk authorization (viewAny, view, create).
- Menambahkan CommissionOrderController dengan method index, show, store.
- Menambahkan 3 route baru di bawah auth:sanctum:
  - GET  /api/commission/orders
  - GET  /api/commission/orders/{commissionOrder}
  - POST /api/commission/orders
- Menambahkan feature test CommissionOrderTest.php dengan 40 test case dan 102 assertions.
- Memperbarui progress tracker commission.md (Phase 2 marked [x] COMPLETE).

## Endpoint Baru

- GET /api/commission/orders — list orders scoped by role (buyer/artist/admin), paginated
- GET /api/commission/orders/{commissionOrder} — show order detail with authorization
- POST /api/commission/orders — create order with server-side snapshot and validation

## Keamanan

- buyer_id tidak pernah diterima dari request; selalu diambil dari authenticated user.
- artist_id tidak pernah diterima dari request; selalu diambil dari package.artist_id.
- amount tidak pernah diterima dari request; selalu diambil dari package.price (snapshot).
- platform_fee_amount calculated server-side menggunakan package.platform_fee_rate.
- artist_payout_amount calculated server-side sebagai (amount - platform_fee_amount).
- status awal selalu 'pending_payment'; tidak boleh di-inject dari request.
- Package harus active untuk dapat membuat order baru.
- Policy CommissionOrderPolicy memvalidasi ownership dengan role-based scoping.
- Soft restriction dengan restrictOnDelete() untuk preservasi order history.
- Response eager-load buyer, artist, package menggunakan kolom terbatas; password dan remember_token tidak bocor.
- Pagination dibatasi maksimum 50 per halaman.

## Validasi

- package_id: required, integer, exists:commission_packages,id
- brief: required, string, max:5000
- reference_image: nullable, string, max:500
- deadline_at: nullable, date, after:now

## Business Rules

- Amount snapshot: order.amount menyimpan package.price saat order dibuat dan tidak berubah meskipun package.price berubah di kemudian hari.
- Artist snapshot: order.artist_id menyimpan package.artist_id saat order dibuat dan tidak berubah meskipun package ownership berubah.
- Platform fee calculation: platform_fee_amount = round(amount × platform_fee_rate)
- Artist payout calculation: artist_payout_amount = amount - platform_fee_amount
- Money invariant: amount = platform_fee_amount + artist_payout_amount (integer IDR)
- Inactive package tidak dapat digunakan untuk membuat order baru.

## Authorization Scoping

- Buyer: dapat melihat order dimana buyer_id = user.id
- Artist: dapat melihat order dimana artist_id = user.id
- Admin: dapat melihat semua order
- 403 Forbidden untuk order yang tidak dimiliki user

## Hasil Verifikasi

- php artisan test tests/Feature/CommissionOrderTest.php: 40 test, 102 assertion lulus.
- composer test (full suite): 159 test, 471 assertion lulus (119 existing + 40 new).
- php artisan migrate:status: seluruh 11 migration berstatus Ran; migration Phase 2 Commission berjalan pada batch 8.
- php artisan route:list --path=commission: berhasil, 8 route terdaftar (3 route baru commission orders).
- git diff --check: berhasil tanpa whitespace error.
- Tidak ada migration lama, Auth, Profile, Follow, Post, Storage, Watermark, CommissionPackage, frontend, .env, credential, atau package-lock.json yang diubah.

## Batasan Phase 2

Phase 2 TIDAK termasuk:
- Midtrans integration
- Payment gateway
- Snap token generation
- Webhook
- Escrow hold/release
- Payout mechanism
- Order lifecycle actions (start, deliver, complete, release)
- Order status history table
- State machine transitions
- Reference image binary upload (hanya string reference)
- Frontend payment UI

Phase 2 hanya membangun domain Commission Order yang aman dengan snapshot pricing, authorization kuat, dan siap digunakan oleh Phase 3 (lifecycle) dan Phase 4 (payment).

## Assumptions & Limitations

- Platform fee rate diambil dari package.platform_fee_rate yang sudah tersimpan di database saat package dibuat.
- Pembulatan fee menggunakan round() half-up untuk hasil integer IDR.
- deadline_at bersifat optional; jika diberikan harus di masa depan (after:now).
- reference_image hanya string reference/path; binary upload akan diimplementasikan di phase berikutnya.
- Timezone menggunakan konfigurasi aplikasi existing; tidak ada custom timezone handling.
- Foreign key restrictOnDelete() mencegah penghapusan user/package yang memiliki order history.
