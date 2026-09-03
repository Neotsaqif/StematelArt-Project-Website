\# STEMATELART — PROJECT BRIEF



\## 1. Project Overview



\*\*Project Name:\*\* StematelArt



\*\*Project Type:\*\* Art Community \& Artwork Sharing Platform



\*\*Purpose:\*\*

StematelArt adalah platform komunitas seni untuk memungkinkan user dan artist membagikan artwork, berinteraksi dengan karya orang lain, menemukan artwork, dan mengikuti perkembangan komunitas.



\*\*Main Users:\*\*



\* User

\* Artist

\* Admin



\---



\# 2. Project Goals



StematelArt bertujuan untuk:



\* Menjadi tempat berbagi artwork.

\* Membantu user menemukan karya dan artist.

\* Menyediakan interaksi sosial antar anggota.

\* Memberikan ruang untuk ranking dan community engagement.

\* Menyediakan sistem contest.

\* Memberikan tools pengelolaan untuk Admin.



\---



\# 3. Main Features



\## Account



\* Registration

\* Login

\* Logout

\* Authentication

\* Authorization / Role

\* Profile

\* Edit Profile

\* Avatar

\* Bio

\* Settings

\* Follow / Unfollow

\* Followers / Following



\## Post



\* Create Post

\* View Post

\* Edit Post

\* Delete Post

\* Artwork Upload

\* Image Validation

\* Watermark

\* Artwork Storage

\* Ownership / Permission



\## Social



\* Like / Unlike

\* Like Counter

\* Comment

\* Delete Own Comment

\* Save / Unsave

\* Share / Copy Post URL



\## Discovery



\* Browse Public Artworks

\* Search

\* Filter

\* Pagination



\## Ranking



\* Ranking berdasarkan jumlah Like/Love

\* All-time ranking



\## Contest



\* Contest Page

\* Contest Information

\* Rules

\* Prize

\* Criteria

\* Deadline

\* Submit Artwork



\## Notification



\* Like Notification

\* Comment Notification

\* Follow Notification

\* New Post Notification

\* Contest Notification



\## Artist Management



\* Artist Account

\* Artist Invitation

\* Artist Management



\## Admin Panel



\* User Management

\* Artist Management

\* Post Management

\* Contest Management

\* Moderation



\---



\# 4. Technology Stack



\## Frontend



\* React

\* TypeScript

\* Tailwind CSS



\## Backend



\* Laravel

\* PHP

\* REST API



\## Database



\* Supabase

\* PostgreSQL



\## Storage



\* Supabase Storage



\## Authentication



\* Laravel Sanctum



\## Development Environment



\* Docker



\## Version Control



\* Git

\* GitHub



\---



\# 5. Project Structure



```text

stematelart/

├── backend/

├── frontend/

├── frontend-legacy/

├── docker/

├── docker-compose.yml

├── .env.example

├── .gitignore

└── README.md

```



`frontend-legacy/` digunakan sebagai referensi dari frontend lama yang dibuat oleh UI/UX sebelum diintegrasikan ke React.



\---



\# 6. Development Flow



\## Phase 1 — Planning



Menentukan:



\* Requirement

\* Scope

\* MVP

\* User Story

\* Acceptance Criteria

\* UI/UX

\* Database Design

\* System Architecture

\* Product Backlog

\* Sprint Plan



\*\*Output:\*\* Tim tahu apa yang harus dibuat, bagaimana alurnya, dan prioritas pengerjaannya.



\---



\## Phase 2 — Setup



Menyiapkan seluruh foundation:



\* GitHub

\* Git workflow

\* Project structure

\* Laravel

\* React + TypeScript

\* Tailwind CSS

\* Supabase

\* PostgreSQL

\* REST API

\* Sanctum

\* Docker

\* Environment variables

\* CORS

\* Frontend routing



Kemudian memastikan:



```text

React

&#x20;  ↓

Laravel API

&#x20;  ↓

Supabase PostgreSQL

```



dan:



```text

Laravel

&#x20;  ↓

Supabase Storage

```



berfungsi.



\*\*Output:\*\* Semua developer bisa clone dan menjalankan project.



\---



\# 7. Sprint Roadmap



\## Sprint 1 — Core Platform



\*\*Duration:\*\* 1–2 Weeks



\*\*Goal:\*\* Membuat core user experience sampai user dapat menggunakan platform secara end-to-end.



\### Account



\* Authentication

\* Profile

\* Follow



\### Post



\* Post CRUD

\* Artwork Upload

\* Watermark

\* Storage



\### Social



\* Like

\* Comment

\* Save

\* Share



\### Discovery



\* Browse

\* Search

\* Filter

\* Pagination



\### Ranking



\* All-time ranking berdasarkan Like/Love



\*\*End Result:\*\*



```text

Register

&#x20;  ↓

Login

&#x20;  ↓

Profile

&#x20;  ↓

Follow

&#x20;  ↓

Create Artwork

&#x20;  ↓

Publish Post

&#x20;  ↓

Like / Comment / Save / Share

&#x20;  ↓

Discovery

&#x20;  ↓

Ranking

```



\---



\# 8. Sprint 2 — Community Features



\*\*Goal:\*\* Menambahkan fitur yang meningkatkan community engagement.



\### Contest



\* Contest page

\* Contest information

\* Rules

\* Prize

\* Criteria

\* Deadline

\* Submit artwork



\### Notification



\* Like

\* Comment

\* Follow

\* New post

\* Contest



\### Artist Management



\* Artist invitation

\* Artist account

\* Artist management



\*\*End Result:\*\*



```text

User

&#x20;↓

Community Interaction

&#x20;↓

Notification

&#x20;↓

Contest

&#x20;↓

Artist participation

```



\---



\# 9. Sprint 3 — Admin \& Platform Management



\*\*Goal:\*\* Membuat sistem administrasi untuk mengelola platform.



\### Admin Panel



\* User management

\* Artist management

\* Post management

\* Contest management

\* Moderation



\### Role \& Permission



\* User

\* Artist

\* Admin



\### Platform Management



\* Content moderation

\* Access control

\* Admin-only actions



\*\*End Result:\*\*



```text

Admin

&#x20;↓

Manage Users

Manage Artists

Manage Posts

Manage Contest

Moderate Content

```



\---



\# 10. Sprint 4 — Integration \& Release



\*\*Goal:\*\* Memastikan seluruh platform stabil dan siap digunakan.



\### Integration



\* Connect seluruh feature

\* Check API

\* Check database

\* Check authentication

\* Check authorization

\* Check notification

\* Check navigation

\* Remove remaining mock data



\### Testing



\* Functional testing

\* API testing

\* Authentication testing

\* Authorization testing

\* Integration testing

\* Responsive testing

\* Security testing

\* Upload testing

\* Performance basic testing



\### Bug Fixing



\* Collect bugs

\* Prioritize bugs

\* Fix critical bugs

\* Retest

\* Code review

\* Cleanup



\### Deployment



\* Production environment

\* Production database

\* Storage

\* Production `.env`

\* Frontend build

\* Backend deployment

\* Domain

\* HTTPS



\### Final



\* Final acceptance test

\* Final review

\* Production verification

\* Launch



\---



\# 11. Development Workflow



Setiap fitur mengikuti pola:



```text

Requirement

&#x20;  ↓

Task

&#x20;  ↓

Backend / Frontend Development

&#x20;  ↓

Integration

&#x20;  ↓

Self Check

&#x20;  ↓

QA

&#x20;  ↓

Bug Fix

&#x20;  ↓

Done

```



Developer dapat bekerja paralel menggunakan mock data ketika API yang dibutuhkan belum selesai.



Contoh:



```text

Backend API belum selesai

&#x20;         ↓

Frontend menggunakan mock

&#x20;         ↓

UI selesai

&#x20;         ↓

API selesai

&#x20;         ↓

Replace Mock → Real API

```



\---



\# 12. Team Structure



\### Developer 1



Fokus utama:



\* Backend

\* Database

\* Account

\* Post

\* Social



\### Developer 2



Fokus utama:



\* Backend

\* Discovery

\* Ranking

\* Fitur backend lainnya sesuai sprint



\### Developer 3



Fokus utama:



\* Frontend

\* API integration

\* Existing UI integration

\* Mock → Real API

\* Frontend state \& error handling



\### PM / QA



\* Requirement

\* Task management

\* Acceptance criteria

\* Progress monitoring

\* QA testing

\* Bug verification

\* Sprint review



\---



\# 13. Definition of Done



Sebuah feature dianggap selesai ketika:



\* Requirement terpenuhi.

\* Backend selesai.

\* Frontend selesai.

\* Integration selesai.

\* Validation bekerja.

\* Permission bekerja.

\* Tidak ada critical bug.

\* Sudah dilakukan testing.

\* Code sudah direview.

\* Acceptance criteria terpenuhi.



\---



\# 14. Deployment Flow



```text

Developer

&#x20;  ↓

GitHub

&#x20;  ↓

Development

&#x20;  ↓

Testing

&#x20;  ↓

Production

&#x20;  ↓

StematelArt Live

```



Production terdiri dari:



```text

React

&#x20;  ↓

Laravel API

&#x20;  ↓

Supabase PostgreSQL

&#x20;  +

Supabase Storage

```



\---



\# 15. Launch



Sebelum launch:



\* Semua core feature selesai.

\* Authentication bekerja.

\* Post bekerja.

\* Social bekerja.

\* Discovery bekerja.

\* Ranking bekerja.

\* Contest bekerja.

\* Notification bekerja.

\* Admin Panel bekerja.

\* Critical bugs sudah diperbaiki.

\* Production environment sudah diverifikasi.



Kemudian:



```text

FINAL QA

&#x20;  ↓

APPROVAL

&#x20;  ↓

LAUNCH

```



\---



\# 16. Maintenance



Setelah launch:



```text

User Feedback

&#x20;     ↓

Bug / Improvement

&#x20;     ↓

Product Backlog

&#x20;     ↓

Sprint Baru

&#x20;     ↓

Development

&#x20;     ↓

Testing

&#x20;     ↓

Release

```



Maintenance mencakup:



\* Bug fixing

\* Security updates

\* Performance improvement

\* User feedback

\* Feature improvement

\* Platform monitoring



\---



\# 17. Final Product Flow



```text

&#x20;                   STEMATELART

&#x20;                        │

&#x20;      ┌─────────────────┼─────────────────┐

&#x20;      ↓                 ↓                 ↓

&#x20;   ACCOUNT             POST             CONTEST

&#x20;      │                 │                 │

&#x20;      ↓                 ↓                 ↓

&#x20;   PROFILE           SOCIAL            SUBMIT

&#x20;      │                 │

&#x20;      ↓                 ↓

&#x20;    FOLLOW          LIKE / COMMENT

&#x20;      │             SAVE / SHARE

&#x20;      │                 │

&#x20;      └──────────┬──────┘

&#x20;                 ↓

&#x20;             DISCOVERY

&#x20;                 ↓

&#x20;              RANKING

&#x20;                 ↓

&#x20;           NOTIFICATION

&#x20;                 ↑

&#x20;              ADMIN

```



\# 18. Project End State



StematelArt dinyatakan selesai untuk MVP ketika user dapat:



```text

Register

→ Login

→ Complete Profile

→ Follow Artist

→ Create Artwork

→ Upload Artwork

→ Publish Post

→ Like / Comment / Save / Share

→ Browse Artwork

→ Search / Filter

→ View Ranking

→ Join Contest

→ Receive Notifications

```



dan Admin dapat:



```text

Login

→ Manage Users

→ Manage Artists

→ Manage Posts

→ Manage Contest

→ Moderate Content

```



\*\*Scope yang saat ini tetap di luar MVP:\*\* Commission.



