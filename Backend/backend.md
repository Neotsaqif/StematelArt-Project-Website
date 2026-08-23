# StematelART Backend

Dokumentasi teknis untuk backend StematelART.

StematelART adalah platform komunitas seni untuk anak-anak StematelArt, dengan konsep mirip social media untuk karya seni yang dilengkapi sistem role dan permission.

Backend StematelART dibangun dengan **Laravel** dan berperan sebagai **REST API** yang melayani kebutuhan frontend. Backend bertanggung jawab untuk:

- Menyediakan REST API untuk frontend.
- Mengelola autentikasi user (saat ini baru mencakup registrasi).
- Menyimpan dan mengelola data user.
- Menjadi lapisan bisnis logic dan validasi sebelum data disimpan ke database.
- Terhubung ke database **Supabase/PostgreSQL**.

Hubungan backend dengan frontend:

```
Frontend
   |
   | HTTP Request (JSON)
   v
Laravel REST API (Backend)
   |
   +---- Validation
   |
   +---- Business Logic
   |
   +---- Authentication (Sanctum)
   |
   v
Supabase PostgreSQL
```

---

# 1. Project Overview

StematelART memiliki struktur repository dengan pemisahan dua direktori utama:

```
StematelArt-Project-Website/
├── Backend/       <- Laravel REST API (fokus dokumentasi ini)
└── Frontend/      <- Frontend application
```

Arsitektur umum:

```
Frontend
   |
   | HTTP Request (GET/POST, JSON)
   v
Laravel REST API
   |
   +---- AuthController -> Registration API (saat ini)
   |
   +---- Eloquent ORM
   |
   v
Supabase PostgreSQL
```

Alur komunikasi saat ini:

1. Frontend (atau client API seperti Postman) mengirim request HTTP ke endpoint Laravel.
2. Laravel meneruskan request ke route yang terdaftar di `routes/api.php`.
3. Route memanggil controller yang sesuai (saat ini hanya `AuthController@register`).
4. Controller melakukan validasi terhadap input request.
5. Jika valid, data diproses (misalnya password di-hash) lalu disimpan ke database melalui Eloquent Model (`User`).
6. Database yang digunakan adalah Supabase PostgreSQL.
7. Laravel mengembalikan response JSON ke client.

---

# 2. Technology Stack

Berikut teknologi yang benar-benar digunakan di repository backend:

| Teknologi | Versi | Fungsi |
|---|---|---|
| Laravel | ^12.0 | Backend framework |
| PHP | ^8.2 | Bahasa pemrograman |
| Laravel Sanctum | ^4.0 | API authentication (token-based) |
| Supabase | - | Database/backend infrastructure (PostgreSQL hosted) |
| PostgreSQL | - | Database engine |
| Eloquent ORM | bawaan Laravel | Object-relational mapping |
| Composer | - | Dependency management PHP |
| Laravel Tinker | ^2.10.1 | REPL untuk berinteraksi dengan aplikasi |
| Laravel Pint | ^1.24 (dev) | PHP code style fixer |
| PHPUnit | ^11.5.50 (dev) | Unit & feature test |
| Laravel Pail | ^1.2.2 (dev) | Real-time log tailing |
| Git | - | Version control |

Catatan: versi dependency diambil dari `composer.json` aktual.

---

# 3. Backend Directory Structure

Struktur direktori `Backend/`:

```
Backend/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── Api/
│   │       │   └── AuthController.php
│   │       └── Controller.php
│   ├── Models/
│   │   └── User.php
│   └── Providers/
│       └── AppServiceProvider.php
├── bootstrap/
│   ├── app.php
│   ├── cache/
│   └── providers.php
├── config/
│   ├── app.php
│   ├── auth.php
│   ├── cache.php
│   ├── database.php
│   ├── filesystems.php
│   ├── logging.php
│   ├── mail.php
│   ├── queue.php
│   ├── sanctum.php
│   ├── services.php
│   └── session.php
├── database/
│   ├── factories/
│   │   └── UserFactory.php
│   ├── migrations/
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 0001_01_01_000001_create_cache_table.php
│   │   ├── 0001_01_01_000002_create_jobs_table.php
│   │   ├── 2026_08_18_145310_create_personal_access_tokens_table.php
│   │   └── 2026_08_22_071356_add_role_to_users_table.php
│   └── seeders/
│       └── DatabaseSeeder.php
├── public/
├── resources/
│   └── views/
├── routes/
│   ├── api.php
│   ├── console.php
│   └── web.php
├── storage/
├── tests/
│   ├── Feature/
│   │   └── ExampleTest.php
│   └── Unit/
│       └── ExampleTest.php
├── .env                 <- TIDAK commit (secret)
├── .env.example
├── artisan
├── composer.json
├── composer.lock
├── package.json
├── vite.config.js
├── phpunit.xml
└── ...
```

Penjelasan folder penting:

- **`app/`** — Tempat logic aplikasi. Developer paling sering bekerja di sini.
  - `app/Http/Controllers/Api/` — Tempat controller untuk endpoint API. Saat ini berisi `AuthController.php`.
  - `app/Models/` — Tempat Eloquent model. Saat ini berisi `User.php`.
  - `app/Providers/` — Service provider. Saat ini `AppServiceProvider.php` masih kosong (default).
- **`bootstrap/`** — Konfigurasi booting aplikasi. `app.php` mendaftarkan route web, api, console, health. Developer jarang menyentuh folder ini.
- **`config/`** — Semua file konfigurasi Laravel. `database.php` mengatur koneksi database, `auth.php` mengatur guard, `sanctum.php` mengatur konfigurasi Sanctum.
- **`database/`** — Semua yang berkaitan dengan database.
  - `migrations/` — Skema database versioned.
  - `factories/` — Factory untuk testing/seeding.
  - `seeders/` — Seeder data awal.
- **`routes/`** — Definisi route aplikasi. `api.php` untuk endpoint API, `web.php` untuk web.
- **`tests/`** — Unit dan feature test. Saat ini masih contoh default Laravel.
- **`.env`** — Konfigurasi environment lokal (secret, TIDAK boleh di-commit). File ini hanya ada secara lokal.
- **`.env.example`** — Template env yang dibagikan via Git (tanpa secret).

---

# 4. Local Development Setup

Lingkungan development project adalah **Windows** dengan **Laragon**.

Panduan untuk developer baru dari nol:

### 1. Install Laragon

Laragon menyediakan PHP, Composer, dan Apache/Nginx dalam satu paket. Pastikan PHP versi 8.2+ terpasang (syarat Laravel 12). Periksa versi PHP:

```
php -v
```

### 2. Clone repository

```
git clone https://github.com/Neotsaqif/StematelArt-Project-Website.git
cd StematelArt-Project-Website
```

### 3. Masuk ke folder Backend

```
cd Backend
```

### 4. Checkout branch dev

```
git checkout dev
```

### 5. Install dependency Composer

```
composer install
```

Pastikan file `composer.lock` tersedia di repository. Jika muncul error, cek versi PHP dan ekstensi yang dibutuhkan.

### 6. Copy .env.example menjadi .env

Pada Windows (cmd):

```
copy .env.example .env
```

### 7. Konfigurasi environment

Buka `.env` dan sesuaikan. Bagian paling penting adalah konfigurasi database Supabase (lihat bagian 5 dan 6). Ubah `DB_CONNECTION` menjadi `pgsql` dan isi `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SSLMODE` sesuai credential Supabase.

Catatan: `.env.example` saat ini masih memakai konfigurasi default Laravel (`DB_CONNECTION=sqlite`, `APP_NAME=Laravel`). Developer perlu memperbarui manual agar sesuai dengan environment masing-masing. Bagian ini akan diperbarui pada development berikutnya.

### 8. Generate APP_KEY

```
php artisan key:generate
```

### 9. Konfigurasi database Supabase

Supabase menyediakan credential PostgreSQL di Dashboard Supabase (Project Settings > Database). Salin nilainya ke `.env`. Detail lebih lanjut di bagian 6.

### 10. Jalankan migration

```
php artisan migrate
```

### 11. Clear cache

```
php artisan optimize:clear
```

### 12. Jalankan Laravel server

```
php artisan serve
```

Server berjalan di: `http://127.0.0.1:8000`

### 13. Verifikasi API

Daftar route aktif:

```
php artisan route:list
```

Test endpoint registrasi (lihat bagian 17):

```
POST http://127.0.0.1:8000/api/register
```

---

# 5. Environment Configuration

File `.env` adalah file konfigurasi environment lokal yang berisi **secret**. File `.env.example` adalah template yang dibagikan via Git tanpa secret.

Perbedaan:

| | `.env` | `.env.example` |
|---|---|---|
| Di-commit ke Git | Tidak (terdaftar di `.gitignore`) | Ya |
| Berisi secret | Ya | Tidak |
| Fungsi | Konfigurasi aktual environment lokal | Template untuk developer baru |

`.gitignore` sudah mencakup `.env`, sehingga file `.env` tidak akan ter-commit.

### Variabel penting `.env`

Berikut variabel yang ada di `.env.example` aktual beserta fungsinya (nilai contoh bersifat ilustrasi, bukan secret asli):

| Variable | Fungsi | Contoh |
|---|---|---|
| APP_NAME | Nama aplikasi | Laravel |
| APP_ENV | Environment | local |
| APP_KEY | Laravel application key | generated (jangan di-commit) |
| APP_DEBUG | Mode debug | true |
| APP_URL | URL aplikasi | http://localhost |
| DB_CONNECTION | Driver database | sqlite (default) atau pgsql untuk Supabase |
| DB_HOST | Host database | <YOUR_SUPABASE_HOST> |
| DB_PORT | Port database | 5432 (PostgreSQL) |
| DB_DATABASE | Nama database | <YOUR_DATABASE_NAME> |
| DB_USERNAME | Username database | <YOUR_DATABASE_USER> |
| DB_PASSWORD | Password database | <YOUR_DATABASE_PASSWORD> |
| DB_SSLMODE | Mode SSL koneksi | prefer |
| SESSION_DRIVER | Driver session | database |
| QUEUE_CONNECTION | Koneksi queue | database |
| CACHE_STORE | Penyimpanan cache | database |
| MAIL_MAILER | Driver mail | log |
| SANCTUM_STATEFUL_DOMAINS | Domain yang melayani stateful auth | localhost,127.0.0.1 |

Catatan penting:
- `.env` **tidak boleh** di-commit ke Git karena berisi secret seperti `DB_PASSWORD`, `APP_KEY`, dan credential Supabase.
- Nilai asli `APP_KEY`, `DB_PASSWORD`, atau `SUPABASE_*` **jangan pernah** ditampilkan di dokumentasi, issue, atau chat publik.
- Jangan meng-hardcode credential di source code. Selalu pakai `env()` atau konfigurasi.
- `.env.example` saat ini belum berisi konfigurasi Supabase/PostgreSQL. Ini adalah salah satu hal yang perlu diperbarui di development berikutnya agar developer baru lebih mudah setup.

---

# 6. Laravel + Supabase Database

Supabase adalah platform backend-as-a-service yang menyediakan **PostgreSQL** sebagai database-nya. Laravel di project ini memakai Supabase sebagai database utama.

### Cara Laravel terhubung ke Supabase

1. Supabase menyediakan credential PostgreSQL (host, port, database, user, password) di Dashboard Supabase.
2. Laravel menyimpan credential tersebut di `.env` pada variabel `DB_*`.
3. `config/database.php` mendefinisikan koneksi `pgsql`. Koneksi default diambil dari `env('DB_CONNECTION', 'sqlite')`. Untuk memakai Supabase, set `DB_CONNECTION=pgsql` di `.env`.

Konfigurasi koneksi `pgsql` di `config/database.php`:

```php
'pgsql' => [
    'driver' => 'pgsql',
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '5432'),
    'database' => env('DB_DATABASE', 'laravel'),
    'username' => env('DB_USERNAME', 'root'),
    'password' => env('DB_PASSWORD', ''),
    'charset' => env('DB_CHARSET', 'utf8'),
    'prefix' => '',
    'prefix_indexes' => true,
    'search_path' => 'laravel',
    'sslmode' => env('DB_SSLMODE', 'prefer'),
],
```

Nilai-nilai ini diisi dari `.env`.

### Alur kerja

```
Supabase PostgreSQL
   ^
   | (koneksi via var env DB_*)
   |
Laravel (config/database.php)
   |
   | Eloquent ORM / Query Builder
   |
Model (User) / Migration / Seeder
```

- **Migration** memakai koneksi default untuk membuat/mengubah tabel di Supabase.
- **Eloquent** (misal `User` model) memakai koneksi yang sama untuk query CRUD.

### Catatan untuk bekerja dengan PostgreSQL/Supabase

- Port default PostgreSQL adalah `5432`.
- Supabase biasanya memerlukan `sslmode` (misal `prefer` atau `require`) untuk koneksi aman. Default di project ini `prefer`.
- Supabase menyarankan penggunaan `search_path` untuk skema.
- Pastikan IP database Supabase mengizinkan koneksi (Supabase menyediakan fitur IP allow list).
- Untuk koneksi lokal, gunakan `DB_HOST` dan `DB_PORT` dari dashboard Supabase. Supabase juga menyediakan pooling connection string (port 6543) sebagai alternatif.
- Error koneksi umum: host salah, port salah, password salah, atau IP tidak diizinkan di dashboard Supabase.
- Jangan pernah membocorkan password/credential Supabase ke dokumentasi atau Git.

---

# 7. Database Structure

Berdasarkan migration yang ada di `database/migrations/`, tabel berikut sudah tersedia di database:

| Tabel | Dibuat oleh migration | Fungsi |
|---|---|---|
| users | 0001_01_01_000000_create_users_table.php | Data user |
| password_reset_tokens | 0001_01_01_000000_create_users_table.php | Token reset password |
| sessions | 0001_01_01_000000_create_users_table.php | Session |
| cache | 0001_01_01_000001_create_cache_table.php | Cache |
| cache_locks | 0001_01_01_000001_create_cache_table.php | Kunci cache |
| jobs | 0001_01_01_000002_create_jobs_table.php | Antrian job |
| job_batches | 0001_01_01_000002_create_jobs_table.php | Batch job |
| failed_jobs | 0001_01_01_000002_create_jobs_table.php | Job gagal |
| personal_access_tokens | 2026_08_18_145310_create_personal_access_tokens_table.php | Token Sanctum |
| migrations | (bawaan Laravel) | Pencatat migration yang sudah jalan |

### Tabel `users`

Dibentuk dari migration `0001_01_01_000000_create_users_table.php` dan dimodifikasi oleh `2026_08_22_071356_add_role_to_users_table.php`.

Kolom setelah kedua migration dijalankan:

| Column | Type | Nullable | Default | Keterangan |
|---|---|---|---|---|
| id | bigint (unsigned) | No | auto-increment | Primary key |
| name | string | No | - | Nama user |
| email | string | No | - | Email unik (unique index) |
| email_verified_at | timestamp | Yes | null | Waktu verifikasi email |
| password | string | No | - | Password ter-hash |
| role | string | No | `user` | Role user (`user`, `artist`, `admin`) |
| remember_token | string (100) | Yes | null | Token remember me |
| created_at | timestamp | Yes | null | Waktu dibuat |
| updated_at | timestamp | Yes | null | Waktu diperbarui |

Kolom `role` ditambahkan lewat migration terpisah (`add_role_to_users_table`) dengan default `'user'` dan diletakkan setelah kolom `password`.

### Tabel `personal_access_tokens`

Dibuat oleh migration `2026_08_18_145310_create_personal_access_tokens_table.php`. Ini adalah tabel kunci untuk Laravel Sanctum.

| Column | Type | Nullable | Keterangan |
|---|---|---|---|
| id | bigint (unsigned) | No | Primary key |
| tokenable_type | string | No | Nama model (polymorphic, misal `App\Models\User`) |
| tokenable_id | bigint (unsigned) | No | ID model |
| name | text | No | Nama token (misal "auth_token") |
| token | string (64) | No | Hash token (unique) |
| abilities | text | Yes | Kemampuan token (nullable) |
| last_used_at | timestamp | Yes | Terakhir dipakai |
| expires_at | timestamp | Yes | Waktu kedaluwarsa |
| created_at | timestamp | Yes | Waktu dibuat |
| updated_at | timestamp | Yes | Waktu diperbarui |

---

# 8. Database Migration

Laravel menggunakan **migration** untuk mengelola skema database secara versioned. Setiap migration punya method `up()` (menerapkan perubahan) dan `down()` (membatalkan perubahan).

Migration yang sudah tersedia di project (urut sesuai urutan file):

1. `0001_01_01_000000_create_users_table.php` — membuat `users`, `password_reset_tokens`, `sessions`.
2. `0001_01_01_000001_create_cache_table.php` — membuat `cache`, `cache_locks`.
3. `0001_01_01_000002_create_jobs_table.php` — membuat `jobs`, `job_batches`, `failed_jobs`.
4. `2026_08_18_145310_create_personal_access_tokens_table.php` — membuat `personal_access_tokens` (dipublish dari package Sanctum).
5. `2026_08_22_071356_add_role_to_users_table.php` — menambahkan kolom `role` ke tabel `users`.

### Cara melihat status migration

```
php artisan migrate:status
```

Perintah ini menampilkan daftar migration beserta statusnya (`Ran` / `Pending`).

### Cara menjalankan migration

```
php artisan migrate
```

Menjalankan semua migration yang belum dijalankan.

### Cara membatalkan migration terakhir (hati-hati)

```
php artisan migrate:rollback
```

### Catatan penting

- **Jangan** mengubah migration yang sudah pernah dijalankan (sudah tercatat di tabel `migrations`). Jika skema harus diubah, buat migration baru.
- Jika bermigrasi ke production/team, koordinasikan dulu.
- Pada project ini, `role` ditambahkan lewat migration terpisah daripada langsung di `create_users_table`. Ini pola yang baik karena memungkinkan penambahan kolom tanpa mengubah migration yang sudah terpakai oleh orang lain.
- Untuk environment development dengan Supabase, pastikan konfigurasi database di `.env` benar sebelum menjalankan migration.

---

# 9. User Model

Lokasi: `Backend/app/Models/User.php`

```php
<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;


class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
```

Penjelasan:

- **Inheritance**: `User` meng-extend `Illuminate\Foundation\Auth\User` (alias `Authenticatable`). Ini membuat model User dapat digunakan untuk autentikasi (login, auth guard).
- **Traits**:
  - `HasApiTokens` — dari Sanctum. Memberikan kemampuan `createToken()`, `tokens()`, dan menyimpan token API. Ini yang menghubungkan User dengan tabel `personal_access_tokens`.
  - `HasFactory` — memungkinkan penggunaan `UserFactory` untuk testing/seeding.
  - `Notifiable` — mendukung notifikasi Laravel.
- **`$fillable`**: `name`, `email`, `password`, `role`. Ini field yang boleh diisi secara mass-assignment (via `User::create()`). Perhatikan `role` ada di sini karena AuthController menetapkan role default `'user'` saat registrasi.
- **`$hidden`**: `password` dan `remember_token` disembunyikan dari serialization JSON (misal ketika model di-return ke client). Ini penting agar password tidak bocor ke response API.
- **`casts()`**:
  - `email_verified_at` di-cast ke `datetime`.
  - `password` di-cast ke `hashed`. Ini otomatis me-hash password saat diset. Namun di AuthController, password tetap di-hash eksplisit dengan `Hash::make()`.

### Hubungan User dengan Sanctum

Karena `User` memakai trait `HasApiTokens`, setiap instance `User` dapat membuat token:

```php
$token = $user->createToken('auth_token')->plainTextToken;
```

Token disimpan di tabel `personal_access_tokens`.

---

# 10. Authentication dengan Laravel Sanctum

### Apa itu Sanctum

Laravel Sanctum adalah package resmi Laravel untuk autentikasi API. Sanctum menyediakan dua mekanisme:

1. **Token-based (Personal Access Token)**: client mengirim token di header `Authorization: Bearer <token>` pada setiap request terautentikasi. Ini model yang dipakai untuk API murni (SPA/React/Vue yang terpisah dari backend).
2. **Stateful (Cookie-based)**: untuk SPA yang hidup di domain yang sama. Ini memakai session dan CSRF.

Project ini menggunakan **token-based** untuk API.

### Implementasi di project

- Package terdaftar di `composer.json`: `laravel/sanctum: ^4.0`.
- Migration `2026_08_18_145310_create_personal_access_tokens_table.php` membuat tabel `personal_access_tokens`.
- Model `User` menggunakan trait `HasApiTokens`.
- Di `AuthController@register`, setelah user dibuat, backend memanggil:

```php
$token = $user->createToken('auth_token')->plainTextToken;
```

- `createToken('auth_token')` membuat record baru di `personal_access_tokens` dan mengembalikan objek token.
- `->plainTextToken` mengembalikan token plain-text yang dikirim ke client.
- Client menyimpan token ini dan mengirimkannya di header `Authorization: Bearer <token>` pada request berikutnya.

### Tabel `personal_access_tokens`

- `tokenable_id` / `tokenable_type` — menghubungkan token ke model (misal User id).
- `token` — hash token (bukan plain text). Arknya plain text hanya ditampilkan sekali saat dibuat.
- `abilities` — izin token (misal `['*']`).
- `last_used_at` — terakhir dipakai.
- `expires_at` — kedaluwarsa.

### Alur penggunaan token oleh client

1. Client register/dapat token.
2. Client menyimpan token (misal di localStorage/state management frontend).
3. Setiap request terautentikasi, client kirim header:

```
Authorization: Bearer <token>
```

4. Laravel memverifikasi token via guard/`auth:sanctum` middleware (jika sudah digunakan pada route).

### Status middleware `auth:sanctum` di project

Saat ini, **belum ada** route yang menggunakan middleware `auth:sanctum`. Artinya, belum ada endpoint terproteksi yang memerlukan token. Autentikasi baru sebatas pembuatan token di registrasi. Middleware ini akan dipakai di development berikutnya (misal untuk login/logout dan endpoint terproteksi).

### Perbedaan authentication dan authorization

- **Authentication** — memverifikasi identitas (siapa user-nya). Contoh: login, token valid.
- **Authorization** — memverifikasi apa yang boleh dilakukan user (role/permission). Contohnya: hanya admin yang bisa menghapus artwork.

Saat ini project baru memiliki bagian authentication (terbatas) berupa pembuatan token saat registrasi. **Authorization berbasis role belum diimplementasikan** (belum ada middleware role, belum ada guard role).

---

# 11. API Structure

Lokasi route API: `Backend/routes/api.php`

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::post('/register', [AuthController::class, 'register']);
```

### Endpoint aktif

| Method | Endpoint | Controller@Method | Status |
|---|---|---|---|
| POST | `/api/register` | `AuthController@register` | ✓ Sudah tersedia |

Karena route ada di `routes/api.php`, semua endpoint API otomatis memiliki prefix `/api`. Jadi endpoint lengkapnya adalah `POST /api/register`.

### Konvensi penamaan endpoint untuk development berikutnya

- Gunakan prefix `/api` (otomatis).
- Gunakan kata benda jamak untuk resource: `/artworks`, `/comments`, `/commissions`, `/contests`.
- Gunakan kata kerja untuk aksi khusus: `/login`, `/logout`, `/me`, `/search`.
- Endpoint protected ditandai dengan middleware `auth:sanctum`:
  ```php
  Route::middleware('auth:sanctum')->group(function () {
      // endpoint terproteksi
  });
  ```

---

# 12. Registration API

Ini adalah endpoint utama yang saat ini tersedia.

### Endpoint

```
POST /api/register
```

### Tujuan

Membuat akun user baru sekaligus mengembalikan token Sanctum agar client bisa langsung menggunakan API yang terproteksi (di masa depan).

### Request body (JSON)

```
{
    "name": "Nama User",
    "email": "user@example.com",
    "password": "password123",
    "password_confirmation": "password123"
}
```

### Field

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| name | string | Ya | Nama user. Maksimal 255 karakter. |
| email | string | Ya | Alamat email. Harus format email valid dan unik (belum dipakai user lain). |
| password | string | Ya | Password. Minimal 8 karakter. |
| password_confirmation | string | Ya | Harus sama dengan `password` (karena rule `confirmed`). |

### Proses di AuthController

1. Terima request.
2. Validasi input (lihat bagian 14).
3. Buat user baru dengan:
   - `name` dari input.
   - `email` dari input.
   - `password` di-hash dengan `Hash::make()`.
   - `role` di-set ke `'user'` (default).
4. Buat token Sanctum: `$user->createToken('auth_token')->plainTextToken`.
5. Kembalikan response JSON dengan status **201 Created**.

### Response sukses

```
HTTP 201 Created
```

```json
{
    "success": true,
    "message": "Registration successful",
    "data": {
        "user": {
            "id": 1,
            "name": "Nama User",
            "email": "user@example.com",
            "role": "user",
            "created_at": "...",
            "updated_at": "..."
        },
        "token": "<plain-text-token>"
    }
}
```

Catatan: kolom `password` dan `remember_token` tidak muncul karena ada di `$hidden` model User.

### Response error validasi

```
HTTP 422 Unprocessable Entity
```

```json
{
    "message": "The email field is required. (and 2 more errors)",
    "errors": {
        "email": [
            "The email field is required."
        ],
        "password": [
            "The password field is required."
        ],
        "name": [
            "The name field is required."
        ]
    }
}
```

Format error ini adalah format bawaan Laravel validation.

---

# 13. Registration Flow

```
Client
  |
  | POST /api/register
  | name, email, password, password_confirmation
  v
routes/api.php
  |
  | Route::post('/register', [AuthController::class, 'register'])
  v
AuthController@register(Request $request)
  |
  | Validasi:
  | - name: required, string, max:255
  | - email: required, string, email, max:255, unique:users,email
  | - password: required, string, min:8, confirmed
  |
  | Apakah valid?
  v
  +--- tidak -> Response 422 (validation error)
  |
  | ya
  v
User::create([
    'name'      => $validated['name'],
    'email'     => $validated['email'],
    'password'  => Hash::make($validated['password']),
    'role'      => 'user',
]);
  |
  | Hash::make(password)
  | Eloquent insert ke tabel users
  v
Database (Supabase PostgreSQL)
  |
  v
$token = $user->createToken('auth_token')->plainTextToken;
  |
  | Simpan token ke personal_access_tokens
  v
response()->json([...], 201)
  |
  v
Client (menerima token)
```

Tahap demi tahap:

1. **Client** mengirim request `POST /api/register` dengan body JSON.
2. **Route** meneruskan ke `AuthController@register`.
3. **Validasi** dijalankan. Jika gagal, Laravel otomatis mengembalikan 422 dengan daftar error.
4. **Pembuatan user**: `User::create()` menyimpan record ke tabel `users` via Eloquent. Password di-hash oleh `Hash::make()` sebelum disimpan.
5. **Role default**: kolom `role` di-set `'user'` secara paksa di controller, bukan dari input client.
6. **Token**: `createToken('auth_token')` membuat token Sanctum dan disimpan ke `personal_access_tokens`. `plainTextToken` mengembalikan token plain text untuk dikirim ke client.
7. **Response**: JSON `{ success, message, data: { user, token } }` dengan HTTP 201.

---

# 14. Validation

Validasi ada di `AuthController@register`:

```php
$validated = $request->validate([
    'name' => ['required', 'string', 'max:255'],
    'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
    'password' => ['required', 'string', 'min:8', 'confirmed'],
]);
```

### Tabel rule

| Field | Rule | Penjelasan |
|---|---|---|
| name | required | Wajib diisi |
| name | string | Harus berupa string |
| name | max:255 | Maksimal 255 karakter |
| email | required | Wajib diisi |
| email | string | Harus berupa string |
| email | email | Harus format email yang valid |
| email | max:255 | Maksimal 255 karakter |
| email | unique:users,email | Tidak boleh duplikat dengan email yang sudah ada di tabel users |
| password | required | Wajib diisi |
| password | string | Harus berupa string |
| password | min:8 | Minimal 8 karakter |
| password | confirmed | Harus ada field `password_confirmation` yang nilainya sama dengan `password` |

Rule `confirmed` otomatis membutuhkan pasangan field `password_confirmation`.

---

# 15. Password Security

Password **tidak pernah disimpan dalam bentuk plain text**.

Di `AuthController@register`, password di-hash:

```php
'password' => Hash::make($validated['password']),
```

`Hash::make()` menggunakan algoritma bcrypt (atau argon) untuk meng-hash password. Hasilnya adalah string satu arah: tidak bisa dibalik menjadi password asli.

Selain itu, model `User` memiliki cast:

```php
'password' => 'hashed',
```

Ini memastikan nilai password selalu di-hash setiap kali di-set melalui Eloquent, sebagai lapisan keamanan tambahan.

Karena password di-hash:

- Tidak ada cara (praktis) untuk mengetahui password asli user, bahkan oleh admin.
- Jika database bocor, password user tetap aman (tidak bisa dibaca langsung).

Jangan pernah:

- Menyimpan password plain text.
- Mengembalikan password ke dalam response API.
- Menampilkan password user asli di dokumentasi/code.

---

# 16. API Response Format

Response API mengikuti format JSON yang konsisten.

### Response sukses (registrasi)

```
HTTP 201 Created
```

```json
{
    "success": true,
    "message": "Registration successful",
    "data": {
        "user": {
            "id": 1,
            "name": "Nama User",
            "email": "user@example.com",
            "role": "user",
            "created_at": "...",
            "updated_at": "..."
        },
        "token": "<plain-text-token>"
    }
}
```

### Makna field

| Field | Keterangan |
|---|---|
| `success` | Boolean. `true` berarti request berhasil. |
| `message` | Pesan deskriptif untuk client (misal "Registration successful"). |
| `data` | Payload utama response. |
| `data.user` | Objek data user (tanpa `password` dan `remember_token` karena `$hidden`). |
| `data.token` | Token Sanctum plain-text untuk autentikasi selanjutnya. |

### Penting

- `token` adalah **credential sensitif**. Siapa pun yang memiliki token dapat mengakses resource terproteksi atas nama user tersebut (setelah middleware `auth:sanctum` diaktifkan).
- Jangan pernah menaruh token di source code, commit, atau dokumentasi publik.
- Format response ini adalah keputusan project saat ini ditentukan di controller langsung. Untuk pengembangan berikutnya, sebaiknya dibakukan (misal lewat resource class/helper) agar konsisten di seluruh endpoint.

---

# 17. API Testing

Endpoint dapat diuji menggunakan **Postman** atau alat serupa.

### Setup Postman

- **Method**: `POST`
- **URL**: `http://127.0.0.1:8000/api/register`
- **Headers**:
  - `Accept: application/json`
  - `Content-Type: application/json`
- **Body**: raw JSON

### Contoh request body

```json
{
    "name": "Nama User",
    "email": "user@example.com",
    "password": "password123",
    "password_confirmation": "password123"
}
```

### Expected result (sukses)

- **Status**: `201 Created`
- **Body**:
```json
{
    "success": true,
    "message": "Registration successful",
    "data": {
        "user": {
            "id": 1,
            "name": "Nama User",
            "email": "user@example.com",
            "role": "user",
            "created_at": "...",
            "updated_at": "..."
        },
        "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
}
```

### Bagaimana tahu registration berhasil

1. Status code adalah `201`.
2. Field `success` bernilai `true`.
3. Ada `token` di `data.token`.
4. Data user muncul di `data.user` dengan `role: "user"`.
5. Di database, muncul record baru di tabel `users` (dan `personal_access_tokens` untuk token).

---

# 18. Validation Error Testing

Berikut test case untuk menguji validasi.

### 1. Email kosong

**Input:**
```json
{
    "name": "Nama User",
    "email": "",
    "password": "password123",
    "password_confirmation": "password123"
}
```

**Expected**: `422 Unprocessable Entity`. Error pada field `email` ("The email field is required."). Alasan: rule `required`.

### 2. Password kosong

**Input:**
```json
{
    "name": "Nama User",
    "email": "user@example.com",
    "password": "",
    "password_confirmation": ""
}
```

**Expected**: `422`. Error pada fields `password` dan `password_confirmation` (dari rule `required` dan `confirmed`). Alasan: rule `required`.

### 3. Password kurang dari 8 karakter

**Input:**
```json
{
    "name": "Nama User",
    "email": "user@example.com",
    "password": "123",
    "password_confirmation": "123"
}
```

**Expected**: `422`. Error pada field `password` ("The password field must be at least 8 characters."). Alasan: rule `min:8`.

### 4. Password confirmation tidak sama

**Input:**
```json
{
    "name": "Nama User",
    "email": "user@example.com",
    "password": "password123",
    "password_confirmation": "password456"
}
```

**Expected**: `422`. Error pada field `password` ("The password field confirmation does not match."). Alasan: rule `confirmed`.

### 5. Email sudah digunakan

**Input:**
```json
{
    "name": "Nama User",
    "email": "user@example.com",
    "password": "password123",
    "password_confirmation": "password123"
}
```

Jika `user@example.com` sudah terdaftar sebelumnya (misal dari test sebelumnya):

**Expected**: `422`. Error pada field `email` ("The email has already been taken."). Alasan: rule `unique:users,email`.

### 6. Email format tidak valid

**Input:**
```json
{
    "name": "Nama User",
    "email": "bukan-email",
    "password": "password123",
    "password_confirmation": "password123"
}
```

**Expected**: `422`. Error pada field `email` ("The email field must be a valid email address."). Alasan: rule `email`.

---

# 19. Error Handling & Troubleshooting

Bagian ini berisi masalah umum yang bisa muncul selama pengembangan backend Laravel dengan Supabase.

### `Table users already exists`

- **Penyebab**: Migration `create_users_table` dijalankan padahal tabel sudah ada di database.
- **Cara cek**: `php artisan migrate:status`.
- **Solusi**: Jika tabel sudah dibuat, jangan menjalankan ulang migration yang sama. Jika perlu reset (development), gunakan `php artisan migrate:fresh` (hati-hati: menghapus semua data). Jangan ubah migration yang sudah jalan.

### Database connection error (SQLSTATE[08006] / connection refused)

- **Penyebab**: Kredensial database salah, host/port salah, Supabase tidak mengizinkan IP, atau SSL mismatch.
- **Cara cek**: Periksa variabel `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SSLMODE` di `.env`.
- **Solusi**:
  - Pastikan `DB_CONNECTION=pgsql`.
  - Cocokkan credential dengan Dashboard Supabase (Project Settings > Database).
  - Pastikan IP Address diizinkan di Supabase (Access Control > IP Allow List) atau tambahkan `0.0.0.0/0` untuk development.
  - Coba `php artisan migrate:status` untuk melihat apakah koneksi berhasil.
  - Pastikan PostgreSQL driver terpasang di PHP (`pdo_pgsql`). Cek dengan `php -m | grep pgsql`.

### Migration pending

- **Penyebab**: Ada migration yang belum dijalankan.
- **Cara cek**: `php artisan migrate:status`.
- **Solusi**: Jalankan `php artisan migrate`.

### Route tidak muncul / 404

- **Penyebab**: Route tidak terdaftar, atau salah method/prefix.
- **Cara cek**: `php artisan route:list`.
- **Solusi**: Pastikan route ada di `routes/api.php` dan method HTTP benar. Endpoint API menggunakan prefix `/api`.

### `Class not found`

- **Penyebab**: File/class belum ada, namespace salah, atau autoload belum diperbarui.
- **Solusi**: Pastikan class ada dan namespace benar. Jalankan `composer dump-autoload`.

### Validation error yang tidak sinkron

- **Penyebab**: Aturan validasi berubah tapi request tidak sesuai.
- **Cara cek**: Lihat aturan di `AuthController@register`.
- **Solusi**: Sesuaikan request atau perbarui aturan.

### Sanctum token error

- **Penyebab**: Token tidak dikirim, token salah/kadaluwarsa, atau bukan token yang valid untuk user.
- **Cara cek**: Pastikan header `Authorization: Bearer <token>` dikirim.
- **Solusi**: Token hanya bisa dibuat ulang dengan membuat user baru atau menambah metode login (belum ada). Perhatikan bahwa `expiration` Sanctum diatur `null` (tidak kedaluwarsa) pada konfigurasi saat ini.

### `Undefined variable $table`

- **Penyebab**: Referensi variabel/tabel yang tidak didefinisikan di scope migration/controller.
- **Solusi**: Periksa kode migration/controller. Sebagai contoh, di migration gunakan `Schema::table('users', function (Blueprint $table) {...})`. Scribble variabel tidak boleh keluar scope.

### `Syntax error unexpected token public`

- **Penyebab**: Biasanya karena sintaks PHP salah, misalnya menaruh `return` di luar function, atau salah menaruh modifier visibility.
- **Solusi**: Periksa kode PHP di file yang bersangkutan. Pastikan sintaks sesuai standar (misal `public function` di dalam class).

### `Target class [xxx] does not exist` / `Route not defined`

- **Penyebab**: Referensi class/route yang belum ada.
- **Solusi**: Pastikan class dibuat dan route benar. Jalankan `composer dump-autoload` dan `php artisan optimize:clear`.

### `The stream or file could not be opened` (storage)

- **Penyebab**: Folder `storage/` tidak writable.
- **Solusi**: Pastikan folder `storage/` dan `bootstrap/cache/` writable oleh user PHP.

### Server berjalan tapi request menggantung

- **Penyebab**: Kemungkinan koneksi database timeout atau DNS.
- **Cara cek**: Jalankan `php artisan tinker` lalu coba `DB::connection()->getPdo();`.
- **Solusi**: Periksa konfigurasi `.env` dan network.

---

# 20. Useful Artisan Commands

Cheat sheet command yang sering dipakai di project ini.

| Command | Fungsi |
|---|---|
| `php artisan serve` | Menjalankan development server (default `http://127.0.0.1:8000`) |
| `php artisan migrate` | Menjalankan semua migration yang pending |
| `php artisan migrate:status` | Menampilkan status setiap migration |
| `php artisan migrate:rollback` | Membatalkan batch migration terakhir |
| `php artisan migrate:fresh` | Menghapus semua tabel lalu migrasi ulang (HATI-HATI: data hilang) |
| `php artisan route:list` | Menampilkan daftar semua route |
| `php artisan optimize:clear` | Membersihkan semua cache (config, route, view, event) |
| `php artisan config:clear` | Membersihkan cache config |
| `php artisan key:generate` | Generate `APP_KEY` baru |
| `php artisan make:model` | Membuat model baru (contoh: `php artisan make:model Artwork`) |
| `php artisan make:controller` | Membuat controller baru (contoh: `php artisan make:controller Api/ArtworkController`) |
| `php artisan make:migration` | Membuat migration baru (contoh: `php artisan make:migration create_artworks_table`) |
| `php artisan tinker` | REPL interaktif untuk berinteraksi dengan aplikasi (misal test model, DB) |
| `php artisan test` | Menjalankan test (PHPUnit) |
| `php artisan pail` | Melihat log secara real-time |

Contoh penggunaan `tinker` untuk cek koneksi database:

```php
php artisan tinker
>>> DB::connection()->getPdo();
```

---

# 21. Git Workflow untuk Backend Developer

Developer backend bekerja pada branch `dev`.

### Workflow dasar sebelum coding

```
git status
git pull origin dev
git checkout dev
```

- `git status` — lihat perubahan yang belum di-commit (pastikan working tree bersih sebelum mulai).
- `git pull origin dev` — ambil perubahan terbaru dari remote.
- `git checkout dev` — pastikan berada di branch dev.

### Workflow setelah perubahan

```
php artisan test            # atau test manual via Postman
git diff                     # lihat perubahan sebelum di-commit
git status
git add <file1> <file2>
git commit -m "Deskripsi perubahan"
git push origin dev
```

### Larangan

- **Jangan commit `.env`** (sudah di-ignore oleh `.gitignore`).
- **Jangan commit token** (Sanctum token, personal access token).
- **Jangan commit password** (db password, credential apapun).
- **Jangan force push** ke branch bersama tanpa koordinasi dengan tim.
- **Jangan mengubah migration** yang sudah dipakai oleh tim tanpa koordinasi. Buat migration baru.
- **Jangan hardcode** credential di source code.

---

# 22. Coding Conventions

Konvensi yang saat ini digunakan project dan sebaiknya diikuti.

- **Naming class**: StudlyCase (contoh: `AuthController`, `User`).
- **Naming method**: camelCase (contoh: `register()`).
- **Naming route**: kebab-case / lower-case (contoh: `/register`, `/artworks`, `/create-artwork`).
- **Controller**: ditempatkan di `app/Http/Controllers`. Untuk API, dibungkus folder `Api/` (contoh: `Api/AuthController`).
- **Model**: singular, StudlyCase, di `app/Models` (contoh: `User`). Nama tabel di plural underscore (contoh: `users`).
- **Migration**: nama deskriptif (contoh: `create_users_table`, `add_role_to_users_table`).
- **Validation**: menggunakan `$request->validate()` inline di controller (pola yang dipakai saat ini). Untuk aturan kompleks bisa dipindah ke Form Request di development berikutnya.
- **Response JSON**: gunakan format `{ success, message, data }` agar konsisten (keputusan project saat ini).
- **HTTP status code**: gunakan kode yang tepat, misal `201` untuk created, `422` untuk validation error, `200` untuk sukses umum.
- **Mass assignment**: gunakan `$fillable` pada model dan hanya masukkan field yang diizinkan.
- **Password**: selalu di-hash dengan `Hash::make()`.
- **Role**: jangan menerima `role` dari input public; tentukan di server (seperti default `'user'`).

---

# 23. Security Guidelines

Pedoman keamanan. Beberapa poin sudah diterapkan, beberapa adalah rekomendasi untuk pengembangan berikutnya.

### Sudah diterapkan

- Password selalu di-hash dengan `Hash::make()`.
- `password` dan `remember_token` berada di `$hidden` model User (tidak muncul di response JSON).
- `role` tidak diambil dari input request; di-set default `'user'` di server.
- Validasi input dilakukan sebelum memproses data.
- `.env` masuk ke `.gitignore`.

### Rekomendasi untuk pengembangan berikutnya

- **Jangan commit `.env`** — pastikan secret tidak pernah masuk ke Git.
- **Jangan expose Supabase credentials** — jangan tampilkan `DB_PASSWORD`, host, atau key di dokumentasi publik.
- **Jangan expose service role key** Supabase — key ini sangat sensitif dan tidak boleh ada di frontend/kode publik.
- **Jangan expose Sanctum token** — token jangan pernah ditampilkan di log, response debug, atau commit.
- **Selalu hash password** — sudah dilakukan, pertahankan.
- **Gunakan validation** — sudah dilakukan, pertahankan.
- **Jangan menerima `role` secara bebas dari public registration** — sudah diterapkan (role default 'user'); tetap pertahankan dan jangan izinkan client mengatur role.
- **Gunakan authorization untuk endpoint sensitif** — belum ada; perlu ditambahkan (misal role middleware: admin/artist).
- **Gunakan middleware untuk protected endpoint** — belum ada; perlu `auth:sanctum` dan role middleware.
- **Jangan mengembalikan data sensitif ke frontend** — misal jangan kembalikan `password`, `remember_token`, atau token orang lain.
- **Gunakan HTTPS di production** — pastikan API diakses lewat HTTPS.
- **Set `APP_DEBUG=false` di production** — jangan tampilkan stack trace detail di production.

---

# 24. Current Backend Status

Status aktual backend saat ini berdasarkan source code.

### Sudah selesai

- [✓] Laravel setup
- [✓] Supabase connection
- [✓] API structure (prefix `/api`)
- [✓] Sanctum (package + migration + HasApiTokens)
- [✓] `users` table (migration + role)
- [✓] `personal_access_tokens` table
- [✓] User model (+ trait HasApiTokens, HasFactory, Notifiable)
- [✓] Registration API (`POST /api/register`)
- [✓] Validation (name, email, password)
- [✓] Registration API testing (Postman/HTTP)

### Belum diimplementasikan

- [ ] Login API
- [ ] Logout API
- [ ] Get authenticated user (`/api/me`)
- [ ] Role middleware (user/artist/admin authorization)
- [ ] Artist authorization
- [ ] Admin authorization
- [ ] Artwork API
- [ ] Like API
- [ ] Comment API
- [ ] Saved/liked artwork API
- [ ] Discovery / ranking
- [ ] Commission API
- [ ] Contest API
- [ ] Notification API
- [ ] Admin management API
- [ ] Protected route dengan `auth:sanctum`
- [ ] Feature/unit test untuk AuthController
- [ ] Update `.env.example` untuk konfigurasi Supabase/PostgreSQL

---

# 25. Roadmap Backend

Berikut rencana pengembangan backend berdasarkan kebutuhan StematelART. Ini adalah **rencana**, bukan fitur yang sudah selesai.

**Phase 1 — Fondasi (SAAT INI)**
- Laravel setup
- Koneksi Supabase
- Struktur API
- Sanctum
- Migration users/role
- Registration API + validation + testing

**Phase 2 — Autentikasi lengkap**
- Login API (`POST /api/login`)
- Logout API (`POST /api/logout`)
- Get current user (`GET /api/me`)
- Middleware `auth:sanctum` untuk protected route
- Refresh token / token management

**Phase 3 — Role & authorization**
- Role middleware (user, artist, admin)
- Seed role/permission
- Authorization guard untuk aksi spesifik (misal hanya admin yang bisa manage)

**Phase 4 — User profile**
- Get/update profile
- Avatar/photo
- Public profile endpoint

**Phase 5 — Artwork / post system**
- CRUD artwork
- Upload media (gambar)
- List/garner query

**Phase 6 — Like / comment / save**
- Like artwork
- Comment on artwork
- Saved/liked artwork

**Phase 7 — Discovery & ranking**
- Feed/discovery
- Ranking berdasarkan like/popularity

**Phase 8 — Commission**
- Commission request
- Status management

**Phase 9 — Contest**
- Contest creation
- Submission/join contest

**Phase 10 — Notification**
- Notification system

**Phase 11 — Admin management**
- Manage users, artworks, contests, commissions

---

# 26. Developer Onboarding

Jika kamu developer baru di project ini, ikuti checklist praktis ini.

1. Clone repository: `git clone https://github.com/Neotsaqif/StematelArt-Project-Website.git`
2. Masuk folder: `cd StematelArt-Project-Website`
3. Masuk folder Backend: `cd Backend`
4. Checkout branch dev: `git checkout dev`
5. Install dependency: `composer install`
6. Salin env: `copy .env.example .env`
7. Konfigurasi `.env` (isi database Supabase, generate `APP_KEY`).
8. Generate key (jika kosong): `php artisan key:generate`
9. Pastikan database Supabase aktif dan IP diizinkan.
10. Cek migration: `php artisan migrate:status`
11. Jalankan migration: `php artisan migrate`
12. Bersihkan cache: `php artisan optimize:clear`
13. Jalankan server: `php artisan serve`
14. Cek route: `php artisan route:list`
15. Test `/api/register` via Postman/curl.
16. Baca `app/Models/User.php`.
17. Baca `app/Http/Controllers/Api/AuthController.php`.
18. Baca `routes/api.php` dan `database/migrations/`.
19. Baca `config/database.php`, `config/auth.php`, `config/sanctum.php`.

Setelah itu kamu akan memahami fondasi backend saat ini.

---

# 27. Important Notes for Future Developers

- **Jangan mengubah migration yang sudah digunakan** sembarangan. Cek `php artisan migrate:status` dulu. Gunakan migration baru untuk perubahan schema.
- **Jangan commit `.env`** — sudah di-ignore, tapi tetap waspada.
- **Jangan hardcode credential** — selalu via variabel env.
- **Jangan menerima `role` dari public registration** — selalu set role dari server.
- **Selalu test API setelah perubahan** — pastikan endpoint masih berjalan.
- **Pastikan berada di branch yang benar** sebelum coding (`dev`).
- **Pull perubahan terbaru sebelum coding** — `git pull origin dev`.
- **Jangan menghapus migration yang sudah digunakan** tanpa koordinasi tim.
- **Jangan membocorkan secret** (password, token, key) ke dokumentasi/chat/commit.
- **Gunakan `$fillable`** pada model untuk mencegah mass assignment vulnerability.
- **Hati-hati** dengan `php artisan migrate:fresh` — menghapus semua data.
- **Set `APP_DEBUG=false` di production**.
- **Gunakan format response konsisten** `{ success, message, data }` untuk semua endpoint baru.
- **Gunakan `Hash::make()`** untuk semua password.

---

# 28. Final Summary

Saat ini, fondasi backend StematelART sudah terbangun dengan:

```
Laravel 12
+ Supabase / PostgreSQL
+ Eloquent ORM
+ Laravel Sanctum (token-based)
+ User model (+ role)
+ Registration API
+ Validation
+ API testing (Postman)
```

Fondasi ini siap untuk dikembangkan ke tahap autentikasi lengkap (login, logout), role-based authorization, dan fitur-fitur inti (artwork, like, comment, commission, contest, notification, admin management).

Penting dicatat bahwa **sistem authentication belum lengkap**. Login, logout, middleware `auth:sanctum`, dan authorization berbasis role **belum diimplementasikan**. Dokumentasi ini dibuat berdasarkan source code aktual di repository pada branch `dev`, bukan berdasarkan asumsi atau template.
