StematelArt — Commission & Escrow Implementation Guide

Document: commission.md
Purpose: Source of truth untuk implementasi fitur Commission & Escrow StematelArt, khususnya integrasi Midtrans Sandbox → Production.
Owner: Kiandra (Dev 1)
Backend: Laravel 12 REST API + Sanctum
Database: PostgreSQL / Supabase
Payment Gateway: Midtrans
Current Status: Phase 5 complete with limitation; automated webhook security verified, real Sandbox webhook verification pending

0. Cara Menggunakan Dokumen Ini

Dokumen ini dibuat untuk dua fungsi sekaligus:

Progress tracker untuk pekerjaan Commission & Escrow milik Kiandra.

Instruction/reference untuk AI Agent agar agent memahami arsitektur, urutan pengerjaan, batasan, security requirement, dan Definition of Done sebelum mengubah source code.

Aturan utama untuk AI Agent

Selalu audit repository terlebih dahulu sebelum menulis atau mengubah kode.

Gunakan docs/PRD.md sebagai product requirement utama.

Jangan mengasumsikan fitur Midtrans yang belum diverifikasi dari dokumentasi resmi.

Jangan menganggap redirect/callback frontend sebagai bukti pembayaran berhasil.

Status pembayaran harus ditentukan oleh backend + Midtrans notification/status verification.

Semua webhook harus aman terhadap duplicate delivery/idempotency.

Jangan pernah menyimpan Midtrans Server Key di source code.

Jangan pernah mempercayai amount, artist_id, buyer_id, atau package_id dari frontend tanpa validasi dan authorization server-side.

Jangan mengubah fitur Auth/Post/Social yang tidak berkaitan langsung dengan Commission.

Jangan menambahkan dependency hanya karena lebih nyaman; gunakan Laravel-native solution jika sudah mencukupi.

Setelah setiap phase selesai, buat test dan jalankan regression suite.

Jangan mencentang phase hanya karena file sudah dibuat. Phase hanya boleh dicentang jika acceptance criteria dan test-nya terpenuhi.

1. Status Progress Commission & Escrow

Master Checklist

COMMISSION & ESCROW — KIANDRA

[x] Phase 0 — Repository, PRD & Architecture Audit
[x] Phase 1 — Commission Package Domain
[x] Phase 2 — Commission Order Domain
[x] Phase 3 — Order Lifecycle & Authorization
[x] Phase 4 — Midtrans Sandbox Integration
[x] Phase 5 — Payment Notification / Webhook Security
[ ] Phase 6 — Escrow Ledger & Hold State
[ ] Phase 7 — Order Completion & Release Flow
[ ] Phase 8 — Admin Escrow Dashboard / Ledger API
[ ] Phase 9 — Failure, Expiry & Recovery Handling
[ ] Phase 10 — Security Hardening & Payment Test Suite
[ ] Phase 11 — Frontend Integration / Demo Flow
[ ] Phase 12 — Sandbox → Production Readiness
[ ] Phase 13 — Documentation, Final Audit & Handoff

PROGRESS: 5 / 14 phases completed

Catatan: Phase 0 dicentang karena repository, PRD, struktur backend, dan arah payment/escrow sudah direview sebagai dasar pekerjaan. Belum ada implementasi Commission yang dianggap selesai.

2. Project Context

StematelArt adalah platform komunitas seni yang memiliki tiga role utama:

user

artist

admin

Backend saat ini menggunakan Laravel 12 + Sanctum bearer-token authentication. Database production menggunakan PostgreSQL/Supabase dan object storage menggunakan Supabase Storage. Repository memisahkan frontend SPA dan backend REST API.

Commission adalah fitur MVP dan requirement product sudah mendefinisikan model escrow berbasis akun gateway milik platform. User membeli paket commission dari Artist, membayar melalui payment gateway, pekerjaan dilakukan oleh Artist, User mengonfirmasi completion, kemudian proses release kepada Artist dilakukan.

PRD saat ini mendefinisikan lifecycle utama:

pending_payment
      ↓
paid (escrow held)
      ↓
in_progress
      ↓
delivered
      ↓
completed
      ↓
released

Selain lifecycle utama, terdapat status:

expired
cancelled

Status disputed dan refunded dicadangkan untuk future release, sehingga dispute/refund/cancel money-movement flow bukan bagian dari MVP Commission saat ini.

3. Model Bisnis Commission

3.1 Aktor

User / Buyer

Tanggung jawab:

memilih Artist/package;

membuat commission order;

mengirim brief;

mengirim reference image bila diperlukan;

membayar order;

melihat status pekerjaan;

mengonfirmasi Order Completed setelah status delivered;

memicu release berdasarkan business rule.

Artist

Tanggung jawab:

menyediakan commission package;

menerima order/request sesuai desain sistem;

memulai pekerjaan;

mengubah status ke in_progress;

mengirim hasil pekerjaan;

mengubah status ke delivered.

Admin

Tanggung jawab:

melihat seluruh commission order;

melihat escrow ledger;

memantau status payment dan release;

melakukan manual intervention untuk kondisi gagal yang diizinkan sistem;

tidak boleh mengubah ledger secara sembarangan atau menghapus jejak transaksi.

4. Konsep Escrow yang Dipakai StematelArt

4.1 Jangan Menganggap Ini sebagai Internal Wallet

StematelArt tidak membuat internal wallet pada MVP.

PRD menetapkan akun merchant/payment gateway milik platform sebagai custodian dana untuk kebutuhan alur bisnis escrow.

Secara konseptual:

USER
  |
  | Payment
  v
MIDTRANS
  |
  | Merchant / Platform Account
  v
STEMATELART ESCROW STATE
  |
  | Order Completion
  v
RELEASE FLOW
  |
  v
ARTIST

Database StematelArt mencatat status dan ledger transaksi aplikasi. Database tersebut bukan rekening bank dan bukan tempat menyimpan uang nyata.

4.2 Payment Collection vs Artist Payout

Ini harus dibedakan dengan jelas.

Payment Collection

User membayar melalui Midtrans ke merchant/platform account StematelArt.

Artist Payout / Withdrawal

Dana yang telah tersedia pada merchant account tidak otomatis berarti aplikasi memiliki API universal untuk memindahkan dana per order kepada Artist.

Dokumentasi Midtrans saat ini menjelaskan bahwa dana merchant dapat ditarik melalui Withdrawal dari akun merchant, dengan timing/requirements tertentu. Karena itu, AI Agent tidak boleh mengarang bahwa Midtrans Snap menyediakan payout-per-artist langsung. Mekanisme payout Artist harus diputuskan dan diverifikasi terhadap capability akun Midtrans production yang benar-benar digunakan StematelArt sebelum go-live.

Untuk MVP/demo, sistem aplikasi tetap harus memiliki released sebagai state bisnis setelah user menyelesaikan order dan release flow dijalankan sesuai capability yang telah diverifikasi.

Jika mekanisme payout otomatis per Artist belum tersedia/diaktifkan pada akun, jangan memalsukan transaksi payout. Gunakan state release_pending atau mekanisme manual yang secara eksplisit didokumentasikan sebagai fallback apabila memang diperlukan oleh implementasi final.

5. Midtrans Environment Strategy

5.1 Sandbox

Sandbox digunakan untuk:

development;

automated integration testing yang aman;

demo;

simulasi pembayaran;

validasi webhook;

validasi status transition.

Transaksi sandbox tidak merupakan pembelian nyata dan tidak memotong dana sungguhan.

5.2 Production

Production menggunakan akun Midtrans resmi StematelArt, bukan credential sandbox milik developer.

Arsitektur konfigurasi harus environment-driven:

MIDTRANS_ENV=sandbox
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
MIDTRANS_IS_PRODUCTION=false

Untuk production:

MIDTRANS_ENV=production
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
MIDTRANS_IS_PRODUCTION=true

Nilai credential tidak boleh di-commit ke Git.

5.3 Endpoint

Snap transaction endpoint resmi Midtrans saat ini:

Sandbox:
https://app.sandbox.midtrans.com/snap/v1/transactions

Production:
https://app.midtrans.com/snap/v1/transactions

API base host:

Sandbox:
https://api.sandbox.midtrans.com

Production:
https://api.midtrans.com

AI Agent wajib mengambil endpoint dari konfigurasi/service abstraction, bukan hardcode bercampur di controller.

6. Commission Domain Model

Requirement database utama:

6.1 commission_packages

Mewakili paket commission milik Artist.

Field minimal:

id
artist_id
 title
description
price
platform_fee_rate
delivery_time
terms
active
timestamps

Catatan:

artist_id harus mengarah ke user dengan role artist.

price tidak boleh negatif.

active menentukan apakah package dapat dipesan.

platform_fee_rate harus disimpan sesuai keputusan product/business.

Jangan mengambil harga terbaru package setelah order dibuat.

6.2 commission_orders

Mewakili satu transaksi/order commission.

Field minimal:

id
package_id
buyer_id
artist_id
amount
platform_fee_amount
artist_payout_amount
deadline_at
status
timestamps

Field penting harus dianggap sebagai snapshot:

amount
platform_fee_amount
artist_payout_amount

Artinya ketika package berubah harga di masa depan, order lama tidak berubah nilainya.

6.3 escrow_transactions

Ledger aplikasi untuk kejadian uang/order terkait escrow.

Field minimal:

id
order_id
type
amount
gateway_reference_id
status
timestamps

Type yang direncanakan:

hold
release
refund

refund belum merupakan money-movement flow MVP, tetapi schema dapat mendukung penambahan future feature.

6.4 order_status_history

Merekam seluruh perubahan status.

Field:

id
order_id
from_status
to_status
actor_id
changed_at

Setiap transition yang valid wajib memiliki history record.

7. Security Invariants

Security invariant adalah aturan yang tidak boleh dilanggar meskipun frontend dimanipulasi.

7.1 Buyer Ownership

Buyer hanya dapat:

melihat order miliknya;

melakukan action buyer terhadap order miliknya;

melakukan Order Completed hanya untuk order miliknya.

Tidak boleh:

User A → complete Order milik User B

7.2 Artist Ownership

Artist hanya dapat melakukan action sebagai Artist pada order yang benar-benar berkaitan dengan dirinya.

Tidak boleh:

Artist A → update order Artist B

7.3 Admin Privilege

Admin boleh melihat order seluruh user dan artist sesuai endpoint yang dirancang.

Tetapi admin tidak boleh memanipulasi nilai ledger secara arbitrary.

Semua manual intervention harus:

mempunyai authorization;

dicatat;

tidak menghapus history lama;

tidak memungkinkan double release.

7.4 Amount Trust Boundary

Jangan pernah mempercayai:

{
  "amount": 1000,
  "artist_id": 10,
  "platform_fee": 0
}

dari frontend.

Backend harus menghitung ulang amount berdasarkan package/database dan business rule.

Frontend hanya menyatakan:

package_id
brief
reference_image
optional deadline

7.5 Payment Success Trust Boundary

Jangan melakukan:

frontend callback = payment success

Callback frontend hanya boleh dipakai untuk UX.

Status order paid harus berasal dari payment verification yang sah di backend.

8. Order State Machine

8.1 State

pending_payment
paid
in_progress
delivered
completed
released
expired
cancelled

8.2 Valid Transition

pending_payment → paid
pending_payment → expired
pending_payment → cancelled

paid → in_progress
paid → cancelled

in_progress → delivered

 delivered → completed
completed → released

Transition lain harus ditolak.

Contoh yang wajib ditolak:

pending_payment → released
paid → released
delivered → in_progress
released → paid
cancelled → paid
expired → in_progress

8.3 Status Change Must Be Auditable

Jangan hanya:

$order->update(['status' => 'delivered']);

Tanpa history.

Idealnya service/domain method melakukan secara atomic:

validate transition
→ authorize actor
→ update order
→ insert history
→ commit transaction

9. Phase-by-Phase Implementation Plan

Phase 0 — Repository, PRD & Architecture Audit

Status: [x] COMPLETE

Tujuan:

Memastikan AI Agent memahami keadaan repo sebelum menyentuh Commission.

Audit minimum:

docs/PRD.md

backend structure

routes/api.php

User model

role middleware

Sanctum

existing policies

existing migration conventions

test conventions

frontend route structure

environment configuration

existing documentation

Acceptance:

PRD Commission sudah dipahami.

Role model sudah diketahui.

Authentication architecture sudah diketahui.

Commission belum memiliki implementation backend penuh.

Midtrans environment separation sudah direncanakan.

Phase 1 — Commission Package Domain

Status: [x] COMPLETE

Tujuan:

Membangun katalog package yang dapat digunakan Artist untuk menjual jasa commission.

Pekerjaan:

migration commission_packages

model CommissionPackage

User → commissionPackages relationship

policy/authorization

create package

list package

show package

update package

deactivate package

validation

tests

Business rules:

hanya Artist dapat membuat package;

User biasa tidak boleh membuat package;

Admin dapat mengelola sesuai kebutuhan moderasi;

package inactive tidak dapat digunakan untuk order baru;

harga tidak boleh negatif;

artist_id selalu berasal dari authenticated actor/server-side identity.

Definition of Done:

Migration berhasil.

Relationship benar.

Authorization benar.

Validation lengkap.

API test lengkap.

Unauthorized access menghasilkan 403.

Tidak ada sensitive field leakage.

Full test suite tetap hijau.

Phase 2 — Commission Order Domain

Status: [x] COMPLETE

Tujuan:

Membuat order commission berdasarkan package tanpa melibatkan payment gateway terlebih dahulu.

Input minimal:

package_id
brief
reference_image (optional)
deadline_at (optional)

Backend harus mengambil:

artist_id ← package.artist_id
amount ← package.price
platform_fee_rate ← business configuration
platform_fee_amount ← calculated server-side
artist_payout_amount ← calculated server-side
buyer_id ← authenticated user

Order dibuat sebagai:

pending_payment

Pekerjaan:

migration commission_orders

CommissionOrder model

relationships

create order service

show order

list buyer orders

list artist orders

validation

authorization

amount snapshot

order tests

Definition of Done:

Client tidak dapat memanipulasi amount.

Client tidak dapat mengganti artist melalui request.

Package harus active.

Buyer harus authenticated.

Status awal selalu pending_payment.

Amount snapshot tersimpan.

Test manipulasi amount berhasil ditolak.

Phase 3 — Order Lifecycle & Authorization

Status: [ ] NOT STARTED

Tujuan:

Membuat state machine order yang kuat sebelum payment terintegrasi.

Implementasi yang disarankan:

enum/status constants;

OrderPolicy;

CommissionOrderService / domain service;

transition validator;

status history;

transaction boundary.

Pekerjaan database:

migration order_status_history

model OrderStatusHistory

Tests minimum:

valid transition diterima;

invalid transition ditolak;

buyer authorization;

artist authorization;

admin authorization;

setiap transition membuat history;

rollback jika history gagal.

Definition of Done:

Tidak ada arbitrary status update dari API.

Semua transition melalui service/domain method.

History selalu tercatat.

Authorization diuji.

Concurrent transition dipertimbangkan.

Phase 3 Implementation Notes

- CommissionOrderStatus backed enum memusatkan delapan status order dan allowed transitions.
- CommissionOrderService menjalankan transition dengan Gate authorization, DB transaction, lockForUpdate(), dan status history atomic.
- Endpoint lifecycle hanya tersedia untuk start, deliver, dan complete.
- start dan deliver hanya untuk artist pemilik order; complete hanya untuk buyer pemilik order.
- Invalid transition mengembalikan HTTP 409 Conflict.
- Tidak ada initial history null -> pending_payment.
- Tidak ada endpoint paid, expired, cancelled, released, Midtrans, escrow, payout, atau release workflow pada phase ini.
- Concurrency protection menggunakan row lock; rollback test memastikan kegagalan history membatalkan update order.

Phase 4 — Midtrans Sandbox Integration

Status: [ ] COMPLETE WITH LIMITATION

Implementasi backend Phase 4 tersedia, tetapi real Midtrans Sandbox verification belum dijalankan karena memerlukan credential Sandbox valid dan akses provider eksternal.

Tujuan:

Mengintegrasikan pembuatan transaksi Midtrans Sandbox secara aman.

4.1 Service Boundary

Jangan menaruh seluruh logic Midtrans di controller.

Contoh struktur yang disarankan:

app/
├── Services/
│   ├── Commission/
│   │   ├── CommissionOrderService.php
│   │   └── EscrowService.php
│   └── Payments/
│       ├── MidtransService.php
│       └── MidtransNotificationService.php

Struktur boleh disesuaikan dengan konvensi repository, tetapi tanggung jawab tetap dipisahkan.

4.2 Credential

Credential berasal dari .env / config.

Jangan:

$serverKey = 'SB-Mid-server-xxxxx';

Gunakan config abstraction.

4.3 Create Payment

Flow:

POST /api/commission/orders
        ↓
create order pending_payment
        ↓
POST /api/commission/orders/{order}/payment
        ↓
Backend verifies order ownership + amount
        ↓
MidtransService
        ↓
Midtrans Snap
        ↓
receive token/transaction response
        ↓
return payment information to frontend

order_id Midtrans harus memiliki mapping deterministik ke order internal.

Contoh konsep:

STEMATELART-{internal_order_id}-{nonce/version}

Format final harus sederhana, unique, dan tidak mengandung secret.

4.4 Payment Amount

Nominal pada request Midtrans harus berasal dari order snapshot di database.

Frontend tidak menentukan gross amount final.

Definition of Done:

Sandbox credential tidak di-hardcode.

Production/sandbox environment configurable.

Gross amount diambil dari database.

Internal order mapping deterministic.

Duplicate payment creation ditangani.

Response API tidak membocorkan Server Key.

Integration test/mock tersedia.

Phase 5 — Payment Notification / Webhook Security

Status: [ ] COMPLETE WITH LIMITATION

Backend webhook security dan automated tests sudah selesai. Real Sandbox webhook verification masih pending karena membutuhkan credential valid dan public HTTPS endpoint.

Ini salah satu phase paling penting.

Midtrans dapat mengirim HTTP(S) notification saat status transaksi berubah. Notification harus diverifikasi dan diproses secara idempotent.

5.1 Endpoint

Contoh:

POST /api/payments/midtrans/notification

Endpoint ini tidak menggunakan bearer token dari User karena request berasal dari Midtrans.

Sebagai gantinya:

HTTPS pada deployment;

signature verification;

optional IP/network controls sesuai deployment;

payload validation;

status verification;

idempotency.

5.2 Signature

Signature key notification Midtrans menggunakan konsep:

SHA512(order_id + status_code + gross_amount + ServerKey)

Backend harus membandingkan signature secara aman.

Jangan pernah log string yang mengandung Server Key.

5.3 Success Criteria

Jangan hanya mengecek:

transaction_status == settlement

Backend juga harus mempertimbangkan field lain yang diperlukan, termasuk status code dan fraud status ketika field tersebut tersedia.

Untuk flow kartu, status capture dapat menjadi successful transaction, dan settlement menunjukkan dana telah settled pada Midtrans. Untuk payment method lain, pending dapat bergerak menjadi settlement, deny, cancel, atau expire.

5.4 Idempotency

Notification dapat diterima lebih dari sekali.

Contoh kejadian:

Notification #1 → settlement
Notification #2 → settlement
Notification #3 → settlement

Jangan sampai menjadi:

3 × escrow hold

Harus menjadi satu logical event.

Gunakan database uniqueness/idempotency mechanism yang jelas, misalnya reference gateway/order + status event sesuai desain final.

Definition of Done:

Signature verification.

Status validation.

Idempotent processing.

Invalid signature → reject.

Duplicate notification → safe no-op / deterministic handling.

Amount mismatch → reject.

Unknown order → safe handling.

Sensitive request data tidak dilog sembarangan.

Webhook tests lengkap.

Phase 5 Implementation Notes

- Endpoint: POST /api/payments/midtrans/notification tanpa auth:sanctum.
- Protocol: Midtrans notification fields order_id, transaction_status, status_code, gross_amount, signature_key, transaction_id, payment_type, dan fraud_status bila tersedia.
- Signature: SHA-512(order_id + status_code + gross_amount + Server Key), dibandingkan dengan hash_equals().
- Order lookup menggunakan gateway_order_id.
- Gross amount wajib sama dengan commission_orders.amount.
- settlement sukses; capture hanya sukses jika fraud_status tidak tersedia atau accept.
- pending, deny, cancel, expire, dan failure tidak mengubah order menjadi paid.
- pending_payment -> paid melalui CommissionOrderService dengan actor_id null.
- Duplicate settlement aman melalui lockForUpdate(), transaction, state check, dan idempotent no-op.
- Notification lama tidak dapat mengembalikan paid ke pending_payment.
- Invalid payload/signature/order/amount menghasilkan response aman tanpa secret.
- Tidak ada escrow, payout, release, refund, atau payment UI.
- Automated tests lulus; real Sandbox webhook verification masih pending.

Phase 6 — Escrow Ledger & Hold State

Status: [ ] NOT STARTED

Tujuan:

Menyatukan payment success dengan state escrow aplikasi.

Flow utama:

Midtrans success verified
        ↓
Commission order = paid
        ↓
Escrow transaction = hold

Aturan:

satu order tidak boleh memiliki dua hold yang valid;

amount hold harus sama dengan order amount yang sah;

hold hanya dapat dibuat setelah payment verified;

frontend tidak dapat membuat escrow record langsung;

history order dibuat bersamaan dengan perubahan status.

Atomic operation:

BEGIN
  validate payment
  lock order if necessary
  verify current state
  create/update escrow hold
  update order → paid
  insert status history
COMMIT

Definition of Done:

escrow_transactions migration.

Model + relationship.

Hold creation server-side.

Duplicate hold prevented.

Amount invariant enforced.

Database transaction used.

Tests for duplicate notification.

Tests for transaction rollback.

Phase 7 — Order Completion & Release Flow

Status: [ ] NOT STARTED

Ini adalah titik paling sensitif dalam business flow.

7.1 Start Work

paid → in_progress

Hanya Artist yang terkait order.

7.2 Deliver

in_progress → delivered

Hanya Artist terkait yang boleh melakukannya.

7.3 User Confirms Completion

POST /api/commission/orders/{order}/complete

Precondition wajib:

authenticated user = buyer
order.status = delivered
payment verified = true

Kemudian:

delivered
   ↓
completed

7.4 Release

Release tidak boleh terjadi ketika:

pending_payment
paid
in_progress

Release hanya boleh dimulai dari keadaan yang memenuhi business invariant.

Tidak boleh ada endpoint yang memungkinkan:

POST /release

tanpa validasi state.

7.5 Double Release Protection

Jika order sudah:

released

request kedua harus gagal secara aman atau menjadi idempotent no-op sesuai desain API.

Jangan sampai:

Order = released
Escrow release #1
Escrow release #2

7.6 Payout Capability Caveat

AI Agent tidak boleh membuat fake payout API hanya untuk membuat demo terlihat selesai.

Ada dua kemungkinan implementasi akhir:

Mode A — Capability payout otomatis tersedia/diaktifkan

completed
  ↓
release service
  ↓
verified payout/disbursement capability
  ↓
release success

Mode B — Payout otomatis belum tersedia

completed
  ↓
release_pending / manual release workflow
  ↓
Admin handles verified merchant-side withdrawal/process
  ↓
release recorded

Pilih hanya setelah capability account Midtrans dan business/legal process StematelArt benar-benar diverifikasi.

Definition of Done:

Buyer-only completion.

Delivered-only completion.

Release hanya sekali.

Release ledger tercatat.

Failure state ditangani.

Tidak ada fake gateway call.

Test double-release.

Test unauthorized release.

Phase 8 — Admin Escrow Dashboard / Ledger API

Status: [ ] NOT STARTED

Tujuan:

Menyediakan visibility untuk Admin.

Minimal:

GET /api/admin/commission/orders
GET /api/admin/commission/orders/{order}
GET /api/admin/escrow/transactions
GET /api/admin/escrow/failed

Opsional sesuai kebutuhan final:

POST /api/admin/commission/orders/{order}/retry-release

Tetapi endpoint manual intervention harus memiliki authorization sangat ketat dan audit history.

Admin dapat melihat:

internal order id;

package;

buyer;

artist;

amount;

platform fee;

artist payout amount;

order status;

Midtrans reference;

escrow transaction status;

status history;

timestamps.

Admin tidak perlu dan tidak boleh melihat:

Midtrans Server Key;

password User;

Sanctum token;

data rahasia payment yang tidak dibutuhkan.

Phase 9 — Failure, Expiry & Recovery Handling

Status: [ ] NOT STARTED

Tujuan:

Mencegah sistem menggantung ketika payment/order gagal.

9.1 Pending Payment Expiry

Jika payment tidak dibayar sampai timeout yang ditentukan:

pending_payment → expired

Order expired tidak boleh dibayar lagi melalui transaksi yang sama.

9.2 Cancel

cancelled harus hanya terjadi pada kondisi yang diizinkan oleh business rule.

Jangan memperbolehkan random cancellation setelah dana settled tanpa proses refund yang memang tersedia.

9.3 Payment Failed

Jika Midtrans memberikan:

deny
cancel
expire
failure

mapping aplikasi harus ditentukan dengan jelas.

9.4 Release Failed

PRD sudah mengidentifikasi release_failed sebagai open question. Jika implementasi payout/release memang membutuhkan status khusus, schema/state machine harus dirancang agar tidak merusak lifecycle utama.

Contoh konsep:

completed
   ↓
release_pending
   ↓
release_failed
   ↓
admin retry

Jangan langsung kembali ke paid hanya karena release gagal.

Definition of Done:

Expiry job/command jika diperlukan.

Failed payment mapping.

Failed release handling.

Recovery tidak membuat double transaction.

Admin visibility.

Tests.

Phase 10 — Security Hardening & Payment Test Suite

Status: [ ] NOT STARTED

Phase ini wajib sebelum demo dianggap aman.

Authentication / Authorization

Test:

unauthenticated create order → 401;

user membuat package → 403;

artist mengakses order artist lain → 403;

buyer menyelesaikan order buyer lain → 403;

random user memanggil admin escrow endpoint → 403.

Payment Integrity

amount tampering;

package tampering;

artist_id tampering;

buyer_id tampering;

forged webhook;

wrong signature;

wrong amount;

unknown order_id;

duplicate webhook;

webhook after order expired;

webhook after release;

duplicate payment creation.

State Machine

invalid transition;

repeated transition;

concurrency scenario;

rollback on DB failure;

history always recorded.

Secret Protection

Search repository untuk memastikan tidak ada:

SB-Mid-server-...
Mid-server-...
Production Server Key
API secret

ter-commit secara plaintext.

Definition of Done:

Focused Commission tests pass.

Full backend suite pass.

git diff --check clean.

Security audit report tersedia.

Phase 11 — Frontend Integration / Demo Flow

Status: [ ] NOT STARTED

Frontend demo minimum:

Artist Profile
   ↓
Commission Package
   ↓
Ambil Slot
   ↓
Brief
   ↓
Reference Image
   ↓
Confirm Order
   ↓
Pay with Midtrans Sandbox
   ↓
Payment Success
   ↓
Order Status
   ↓
Artist Starts
   ↓
Delivered
   ↓
User clicks Order Completed
   ↓
Release state

Frontend harus mengambil status dari backend.

Jangan membuat status palsu hanya berdasarkan local state.

Contoh buruk:

setOrderStatus('paid');

tanpa server confirmation.

Contoh benar:

Midtrans UI
    ↓
backend/webhook
    ↓
GET order detail
    ↓
frontend render actual server state

Phase 12 — Sandbox → Production Readiness

Status: [ ] NOT STARTED

Tujuan:

Membuat integrasi mudah dipindahkan dari akun developer/sandbox ke akun resmi StematelArt.

Checklist:

Tidak ada sandbox credential hardcoded.

Environment flag tersedia.

Sandbox endpoint configurable.

Production endpoint configurable.

Production credential berasal dari secret manager/environment.

Production webhook URL sudah dipisahkan dari local URL.

HTTPS production aktif.

Notification URL sudah dikonfigurasi pada Midtrans account.

Production account StematelArt sudah diverifikasi.

Payment methods yang digunakan sudah tersedia pada production account.

Payout/withdrawal capability sudah diverifikasi.

Banking/business requirements sudah diverifikasi.

Config Matrix

Environment

Account

MIDTRANS_ENV

Credential

Local Demo

Developer Sandbox

sandbox

Developer Sandbox Key

Staging

Sandbox/Staging

sandbox

Staging/Sandbox Key

Production

StematelArt Official

production

StematelArt Production Key

Phase 13 — Documentation, Final Audit & Handoff

Status: [ ] NOT STARTED

Update minimal:

docs/PRD.md
backend/backend.md
backend/update.md
commission.md
README.md (jika diperlukan)

Dokumentasi harus menjelaskan:

Commission architecture;

package model;

order model;

lifecycle;

escrow concept;

Midtrans Sandbox setup;

environment variables;

webhook URL;

signature verification;

idempotency;

testing;

production migration;

payout/withdrawal caveat;

operational risks.

Final audit:

Source code audit.

Database audit.

API route audit.

Authorization audit.

webhook audit.

secret scan.

test suite.

documentation consistency.

Demo rehearsal.

10. API Contract Draft

Endpoint names adalah draft. AI Agent boleh menyesuaikan dengan konvensi repo, tetapi fungsi dan security boundary harus dipertahankan.

Commission Package

GET    /api/commission/packages
GET    /api/commission/packages/{package}
POST   /api/artist/commission/packages
PUT    /api/artist/commission/packages/{package}
DELETE /api/artist/commission/packages/{package}

Order

POST   /api/commission/orders
GET    /api/commission/orders
GET    /api/commission/orders/{order}

Artist Order Actions

POST /api/commission/orders/{order}/start
POST /api/commission/orders/{order}/deliver

Buyer Action

POST /api/commission/orders/{order}/complete

Payment

POST /api/commission/orders/{order}/payment
GET  /api/commission/orders/{order}/payment/status
POST /api/payments/midtrans/notification

Admin

GET /api/admin/commission/orders
GET /api/admin/commission/orders/{order}
GET /api/admin/escrow/transactions
GET /api/admin/escrow/failed

11. Recommended Response Envelope

Gunakan pola API existing StematelArt.

Success:

{
  "success": true,
  "message": "Commission order created successfully.",
  "data": {
    "order": {}
  }
}

Validation:

{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {}
}

Unauthorized:

{
  "success": false,
  "message": "Unauthenticated.",
  "errors": {}
}

Forbidden:

{
  "success": false,
  "message": "Forbidden.",
  "errors": {}
}

Payment error:

{
  "success": false,
  "message": "Payment could not be created.",
  "errors": {}
}

Jangan mengembalikan:

Server Key;

internal stack trace;

raw exception details;

Sanctum token milik user lain;

credential gateway.

12. Payment Status Mapping

Midtrans memiliki status payment seperti:

pending
capture
settlement
deny
cancel
expire
failure
refund
partial_refund
chargeback
partial_chargeback

Aplikasi StematelArt tidak perlu mengekspos seluruh status gateway sebagai order status.

Gunakan mapping domain.

Contoh awal:

Midtrans

StematelArt

pending

pending_payment

capture

paid*

settlement

paid

deny

payment failed / order remains pending or cancelled sesuai business rule

cancel

cancelled jika rule mengizinkan

expire

expired

failure

payment failed / recovery state

refund

reserved for future refund flow

capture dan settlement harus diperlakukan berdasarkan payment method dan rule verification yang benar, bukan sekadar string mapping buta.

13. Midtrans Webhook Processing Algorithm

Pseudo-flow:

Receive notification
        ↓
Validate request shape
        ↓
Read order_id
        ↓
Find internal commission order
        ↓
If order not found → reject/safe handling
        ↓
Verify signature
        ↓
Verify gateway/reference consistency
        ↓
Verify gross amount matches expected order amount
        ↓
Verify transaction status + fraud status as applicable
        ↓
Begin DB transaction
        ↓
Lock order / prevent race where necessary
        ↓
Check if event already processed
        ↓
If duplicate → return success/idempotent response
        ↓
Map gateway status to domain state
        ↓
Create/update escrow transaction if payment qualifies
        ↓
Update order status
        ↓
Insert order status history
        ↓
Commit
        ↓
Return 2xx

Untuk notification verification, Midtrans mendokumentasikan signature_key berbasis hash SHA-512 dan menganjurkan idempotent handling karena notification dapat terkirim berulang. Midtrans juga menyarankan verifikasi status melalui API status untuk meningkatkan keamanan.

14. Database Integrity Rules

Wajib dipertimbangkan:

Unique / Idempotency

Contoh:

escrow_transactions
-------------------
unique(gateway_reference_id, type)

Desain final dapat berbeda, tetapi duplicate hold/release harus dicegah pada database layer, bukan hanya controller.

Foreign Keys

Minimal:

commission_packages.artist_id → users.id
commission_orders.package_id → commission_packages.id
commission_orders.buyer_id → users.id
commission_orders.artist_id → users.id
escrow_transactions.order_id → commission_orders.id
order_status_history.order_id → commission_orders.id
order_status_history.actor_id → users.id

Money Precision

Untuk uang, jangan gunakan floating-point PHP/database secara sembarangan.

Gunakan integer minor unit/IDR rupiah integer atau decimal schema yang konsisten.

Contoh:

amount = 150000

bukan:

amount = 150000.75

karena MVP menggunakan IDR.

15. Concurrency & Race Condition

Agent wajib mempertimbangkan kondisi berikut.

Kasus 1 — Dua webhook identik

Webhook A ─┐
           ├→ same order
Webhook B ─┘

Harus menghasilkan satu logical payment/hold.

Kasus 2 — User klik Complete dua kali

Request A ─┐
           ├→ delivered order
Request B ─┘

Hanya satu transition yang valid.

Kasus 3 — Admin retry saat automatic release berjalan

Harus ada protection supaya tidak terjadi double release.

Gunakan:

DB transaction;

row locking bila diperlukan;

unique constraints;

state checks;

idempotency keys;

atomic updates.

16. Logging & Observability

Log yang diperbolehkan:

internal_order_id
midtrans_transaction_id
transaction_status
payment_type
amount
processing_time

Jangan log:

MIDTRANS_SERVER_KEY
Sanctum token
password
full sensitive payment credential

Gunakan correlation/reference ID agar troubleshooting mudah.

17. AI Agent Working Rules

Saat mengerjakan phase apa pun, agent harus mengikuti urutan:

1. Inspect repository
2. Inspect current branch
3. Inspect PRD
4. Inspect relevant implementation
5. Produce mini-plan
6. Implement smallest safe change
7. Add tests
8. Run focused tests
9. Run full test suite
10. Run static/style checks
11. Review diff
12. Update docs
13. Report exact changes

Agent tidak boleh:

- langsung membuat migration tanpa audit;
- mengganti arsitektur Auth;
- menghapus existing tests;
- menambah dependency tanpa alasan;
- hardcode secret;
- menandai phase selesai tanpa test;
- membuat fake payout integration;
- menjadikan frontend sebagai source of truth payment;
- mengubah order amount dari client.

18. Definition of Done — Entire Commission Feature

Commission & Escrow hanya boleh disebut DONE jika seluruh checklist berikut terpenuhi:

[ ] Package domain selesai
[ ] Order domain selesai
[ ] Ownership authorization selesai
[ ] State machine selesai
[ ] Status history selesai
[ ] Midtrans Sandbox create payment selesai
[ ] Midtrans webhook selesai
[ ] Signature verification selesai
[ ] Idempotency selesai
[ ] Payment status verification selesai
[ ] Escrow hold selesai
[ ] Completion trigger selesai
[ ] Release flow selesai sesuai capability payout yang diverifikasi
[ ] Admin ledger selesai
[ ] Expiry/cancel handling selesai
[ ] Failure/recovery handling selesai
[ ] Security tests selesai
[ ] Full backend tests selesai
[ ] Frontend demo selesai
[ ] Sandbox → production configuration selesai
[ ] Production credential isolation selesai
[ ] Documentation selesai
[ ] Final security review selesai

19. Demo Acceptance Scenario

Demo minimal yang disarankan kepada ketua:

1. Login sebagai Artist
2. Buat Commission Package
3. Login sebagai User
4. Pilih package
5. Klik Ambil Slot
6. Isi brief
7. Buat order
8. Pastikan status = pending_payment
9. Generate Midtrans Sandbox payment
10. Selesaikan simulated payment
11. Terima notification Midtrans
12. Backend verify notification
13. Pastikan order = paid
14. Pastikan escrow hold tercatat
15. Login sebagai Artist
16. Start order
17. Pastikan = in_progress
18. Deliver order
19. Pastikan = delivered
20. Login User
21. Klik Order Completed
22. Pastikan = completed
23. Jalankan release workflow sesuai capability payout
24. Pastikan escrow release tercatat
25. Pastikan history lengkap
26. Ulangi webhook → tidak boleh double hold
27. Ulangi complete → tidak boleh double release

20. Final Security Questions Before Production

Sebelum production, jawab YA untuk semua:

[ ] Apakah Server Key tidak ada di source code?
[ ] Apakah Server Key tidak ada di frontend?
[ ] Apakah sandbox dan production credential terpisah?
[ ] Apakah webhook menggunakan HTTPS?
[ ] Apakah signature notification diverifikasi?
[ ] Apakah payment amount diverifikasi server-side?
[ ] Apakah order ownership diperiksa?
[ ] Apakah duplicate webhook aman?
[ ] Apakah double completion aman?
[ ] Apakah double release aman?
[ ] Apakah status transition tervalidasi?
[ ] Apakah setiap status change diaudit?
[ ] Apakah admin action diaudit?
[ ] Apakah secret tidak muncul pada logs?
[ ] Apakah full test suite pass?
[ ] Apakah production Midtrans account StematelArt sudah diverifikasi?
[ ] Apakah mekanisme payout/withdrawal Artist sudah benar-benar disepakati dan diverifikasi?

21. Current Progress Snapshot

Owner: Kiandra
Feature: Commission & Escrow
Gateway: Midtrans
Current Environment: Sandbox (planned)
Production Account: StematelArt account (planned)
Implementation: Not started
Planning/Audit: Complete

Phase 0  ████████████████████ 100%  [x]
Phase 1  ████████████████████ 100%  [x]
Phase 2  --------------------   0%  [ ]
Phase 3  --------------------   0%  [ ]
Phase 4  --------------------   0%  [ ]
Phase 5  --------------------   0%  [ ]
Phase 6  --------------------   0%  [ ]
Phase 7  --------------------   0%  [ ]
Phase 8  --------------------   0%  [ ]
Phase 9  --------------------   0%  [ ]
Phase 10 --------------------   0%  [ ]
Phase 11 --------------------   0%  [ ]
Phase 12 --------------------   0%  [ ]
Phase 13 --------------------   0%  [ ]

22. Official Midtrans References

Gunakan dokumentasi resmi Midtrans sebagai sumber verifikasi saat mengimplementasikan API. Jangan mengandalkan blog/random snippets untuk behavior payment yang kritis.

Midtrans Payment Overview: https://docs.midtrans.com/docs/payment-overview

Midtrans Snap Endpoint: https://docs.midtrans.com/reference/endpoint

HTTP(S) Notification / Webhooks: https://docs.midtrans.com/docs/https-notification-webhooks

Payment Notification API: https://docs.midtrans.com/reference/payment-notification-api

Best Practices Notification: https://docs.midtrans.com/reference/best-practices-to-handle-notification

Transaction Status: https://docs.midtrans.com/reference/transaction-status

Transaction Status Cycle: https://docs.midtrans.com/docs/transaction-status-cycle

Midtrans API Host URL: https://docs.midtrans.com/reference/api-host-url

Testing Payment on Sandbox: https://docs.midtrans.com/docs/testing-payment-on-sandbox

Merchant Withdrawal: https://docs.midtrans.com/docs/how-can-i-have-my-money-in-my-account-payout

23. Important Product / Technical Caveats

Caveat A — Escrow terminology

Istilah escrow pada dokumen ini adalah business/domain state dalam aplikasi StematelArt. Jangan menyimpulkan bahwa setiap saldo/order otomatis merupakan fitur escrow regulated atau rekening penampungan independen hanya karena database memiliki tabel escrow_transactions.

Caveat B — Midtrans settlement

Payment gateway status dan status order StematelArt adalah dua domain berbeda.

Midtrans transaction status
        ≠
StematelArt order status

Mapping harus dilakukan secara eksplisit.

Caveat C — Payout Artist

Midtrans merchant withdrawal merupakan mekanisme pencairan saldo merchant. Jangan menyatakan otomatis bahwa setiap Artist dapat menerima payout langsung dari satu merchant account tanpa capability/product/account arrangement yang sesuai.

Caveat D — Dispute / Refund

Dispute/refund/cancel money-movement flow tidak termasuk MVP berdasarkan PRD saat ini. Jangan membuat feature tersebut secara diam-diam demi melengkapi lifecycle.

24. Handoff Note untuk AI Agent Berikutnya

Sebelum mengerjakan code, baca file ini dari awal sampai akhir dan khususnya:

Section 2  → Project Context
Section 4  → Escrow Model
Section 5  → Midtrans Environment
Section 7  → Security Invariants
Section 8  → State Machine
Section 9  → Phase Plan
Section 13 → Webhook Algorithm
Section 14 → DB Integrity
Section 15 → Concurrency
Section 17 → AI Agent Rules
Section 18 → Definition of Done

Kemudian:

1. Audit source code actual repository.
2. Cocokkan dengan phase yang sedang aktif.
3. Jangan mengerjakan phase berikutnya sebelum phase aktif memenuhi DoD.
4. Implementasikan perubahan sekecil mungkin.
5. Tambahkan test sebelum menyatakan selesai.
6. Update checkbox progress hanya jika bukti implementation/test tersedia.

Current next action: mulai dari Phase 1 — Commission Package Domain. Jangan memasukkan Midtrans payment code sebelum domain commission_packages dan commission_orders memiliki foundation yang benar.