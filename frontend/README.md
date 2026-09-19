# StematelArt / ARTVAULT Frontend

Frontend modular yang sudah dipisahkan berdasarkan komponen dan halaman dari `frontend-legacy`.

> **Status (2026-09-19):** Fase 1 (Auth) selesai end-to-end. Fase 2–3 (Profil, Posts) backend selesai namun frontend sebagian mock. **Fase 12 (Commission & Escrow) selesai** — order creation, payment, webhook, escrow, admin ledger fully functional (Midtrans Sandbox). Fase 4–6 (Social, Discovery, Ranking) dan Fase 7–11 tetap mock-only. Lihat `docs/PRD.md` dan `docs/commission.md` untuk status lengkap.

## Tech Stack

- React 18 (TypeScript) + Vite + Tailwind CSS
- `react-router-dom` untuk routing
- `lucide-react` untuk ikon

## Struktur Direktori

```
frontend/
├── index.html                           # Entry point HTML
├── vite.config.ts                      # Vite config (proxy /api -> http://localhost:8000)
├── .eslintrc.cjs                       # ESLint config
├── tailwind.config.js / postcss.config.js
├── tsconfig.json
└── src/
    ├── main.tsx                        # Entry point React (BrowserRouter)
    ├── App.tsx                         # Root komponen, router, & shared state (context provider)
    ├── vite-env.d.ts                   # Vite environment types
    ├── data/
    │   └── mockData.ts                 # Data mock & konstanta
    ├── context/
    │   └── AppContext.tsx              # Context & hook useApp()
    ├── services/
    │   └── api.ts                      # API client (auth, commission, payment)
    ├── types/
    │   └── index.ts                    # TypeScript interfaces (Artwork, Order, Collection, dll.)
    ├── utils/
    │   └── helpers.ts                  # Helper functions, toast bus, dan utilities
    ├── components/
    │   ├── ui/                         # Komponen UI Reusable
    │   │   ├── index.ts                # Barrel export
    │   │   ├── Icons.tsx               # Wrappers Lucide Icons
    │   │   ├── Toast.tsx               # Komponen Toaster
    │   │   ├── Avatar.tsx              # Avatar (Av)
    │   │   ├── Pic.tsx                 # Image loader & shimmer (Pic)
    │   │   ├── JustifiedGrid.tsx       # JustifiedGrid & MobileGrid
    │   │   └── FeedbackBlocks.tsx      # Skeleton, EmptyBlock, ErrorBlock, Tip
    │   ├── layout/                     # Komponen Tata Letak / Navigation
    │   │   ├── index.ts                # Barrel export
    │   │   ├── Sidebar.tsx             # Sidebar Desktop
    │   │   ├── TopNav.tsx              # Top Bar (Pencarian)
    │   │   ├── MobileTopBar.tsx        # Mobile Header
    │   │   ├── MobileNav.tsx           # Mobile Bottom Navigation
    │   │   ├── Footer.tsx              # Footer Halaman
    │   │   ├── DevBar.tsx              # Bar Status Dev / Anotasi
    │   │   └── AnnotationLayer.tsx     # Overlay Anotasi data-goes-to
    │   └── modals/                     # Popover & Modal Overlays
    │       ├── index.ts                # Barrel export
    │       ├── ModalShell.tsx          # Shell dasar Modal & Popover
    │       ├── LoginModal.tsx          # Modal login popup
    │       ├── MidtransPaymentModal.tsx # Modal Midtrans payment (Commission)
    │       ├── NotifDropdown.tsx       # Popover notifikasi
    │       ├── AvatarMenu.tsx          # Popover menu profil user
    │       ├── CollectionsPopover.tsx  # Popover simpan ke koleksi
    │       ├── SharePopover.tsx        # Popover bagikan karya
    │       ├── MoreMenu.tsx            # Popover menu unduh/laporkan
    │       ├── Lightbox.tsx            # Lightbox gambar fullscreen
    │       ├── SubmitModal.tsx         # Modal submit karya kontes
    │       ├── ParticipantsModal.tsx   # Modal daftar peserta kontes
    │       └── ConfirmDialog.tsx       # Dialog konfirmasi
    ├── pages/                          # Halaman Aplikasi
    │   ├── index.ts                    # Barrel export
    │   ├── DiscoveryPage.tsx           # Halaman Discovery / Beranda (mock)
    │   ├── RankingPage.tsx             # Halaman Papan Peringkat (mock)
    │   ├── CommissionPage.tsx          # Halaman Pemesanan Komisi (fully functional)
    │   ├── OrderPage.tsx               # Halaman Detail Pesanan (fully functional)
    │   ├── ContestPage.tsx             # Halaman Kontes Seni (mock)
    │   ├── ArtworkDetailPage.tsx       # Halaman Detail Karya
    │   ├── ProfilePage.tsx             # Halaman Profil Artist
    │   ├── FavoritesPage.tsx           # Halaman Karya Favorit (mock)
    │   ├── CollectionsPage.tsx         # Halaman Folder Koleksi (mock)
    │   ├── CollectionDetailPage.tsx    # Halaman Isi Folder Koleksi (mock)
    │   ├── SearchPage.tsx              # Halaman Hasil Pencarian (mock)
    │   ├── CategoryPage.tsx            # Halaman Filter Kategori (mock)
    │   ├── SettingsPage.tsx            # Halaman Pengaturan
    │   ├── UploadPage.tsx              # Halaman Unggah Karya Multi-step
    │   ├── WatermarkPage.tsx           # Halaman Watermark Generator
    │   ├── AboutPage.tsx               # Halaman Tentang StematelArt
    │   └── auth/                       # Halaman Autentikasi
    │       ├── index.ts                # Barrel export
    │       ├── AuthLayout.tsx          # Layout & Form Helper Auth
    │       ├── LoginPage.tsx           # Halaman Masuk (fully functional)
    │       ├── SignupPage.tsx          # Halaman Daftar (fully functional)
    │       ├── ForgotPasswordPage.tsx  # Halaman Lupa Kata Sandi
    │       ├── CheckEmailPage.tsx      # Halaman Cek Email
    │       ├── ResetPasswordPage.tsx   # Halaman Atur Ulang Kata Sandi
    │       └── OnboardingPage.tsx      # Halaman Onboarding
```

## Environment Variables

Frontend menggunakan environment variables dengan prefix `VITE_` (yang masuk ke browser bundle):

```bash
# .env.local atau .env.development
VITE_API_BASE_URL=http://localhost:8000
VITE_MIDTRANS_ENV=sandbox
VITE_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js
VITE_MIDTRANS_CLIENT_KEY=YOUR_MIDTRANS_CLIENT_KEY
```

**PENTING:** 
- `VITE_*` variables dapat terlihat di browser (jangan masukkan secret)
- `MIDTRANS_SERVER_KEY` harus tetap di backend saja; jangan expose ke frontend
- `VITE_MIDTRANS_CLIENT_KEY` adalah public key dan aman untuk frontend

## Routing & API Proxy

Request `/api` diproksikan ke backend Laravel di `http://localhost:8000` via `frontend/vite.config.ts`:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

Ini memungkinkan frontend dan backend berjalan di port berbeda saat development.

## Scripts

```bash
npm run dev      # Vite dev server (port 3000, proxy /api -> http://localhost:8000)
npm run build    # tsc && vite build
npm run lint     # ESLint
```

## Catatan

- Authentication menggunakan Sanctum bearer tokens (disimpan di in-memory + sessionStorage).
- Commission & Escrow fully wired ke backend (`CommissionPage`, `OrderPage`, `MidtransPaymentModal`).
- Fase 4–6 (Social, Discovery, Ranking) masih menggunakan mock data dari `mockData.ts`.
- Backend endpoint `/api/commissions/{artist}/orders`, `/api/orders/{order}/pay`, `/api/webhooks/payment-gateway`, dan `/api/admin/escrow-ledger` sudah tersedia untuk production integration.
