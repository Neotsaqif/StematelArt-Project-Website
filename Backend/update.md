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
