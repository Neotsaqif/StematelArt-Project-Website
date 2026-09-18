# StematelArt / ARTVAULT Frontend

Frontend modular yang sudah dipisahkan berdasarkan komponen dan halaman dari `frontend-legacy`.

> **Status (2026-09-05):** prototipe UI beresolusi tinggi. Sebagian besar data adalah **mock** (`src/data/mockData.ts`) dengan state lokal React. Hanya alur **login/signup** yang terhubung ke backend Laravel via `src/services/api.ts`. Backend sendiri sudah berkembang (auth, profil/settings, follow, posts/artwork + watermark/storage) namun frontend belum di-wire ke endpoint tersebut — itu masih pekerjaan de-mocking berikutnya. Lihat `docs/AUDIT.md` untuk audit lengkap dan status terkini.

## Tech Stack

- React 18 (TypeScript) + Vite + Tailwind CSS
- `react-router-dom` untuk routing
- `lucide-react` untuk ikon

## Struktur Direktori

```
frontend/
├── index.html                           # Entry point HTML
├── vite.config.ts                      # Vite config (proxy /api -> http://localhost:8000)
├── tailwind.config.js / postcss.config.js
├── tsconfig.json
└── src/
    ├── main.tsx                        # Entry point React (BrowserRouter)
    ├── App.tsx                         # Root komponen, router, & shared state (context provider)
    ├── data/
    │   └── mockData.ts                 # Data mock & konstanta
    ├── context/
    │   └── AppContext.tsx              # Context & hook useApp()
    ├── services/
    │   └── api.ts                      # API client (register/login ke backend Laravel)
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
    │   ├── DiscoveryPage.tsx           # Halaman Discovery / Beranda
    │   ├── RankingPage.tsx             # Halaman Papan Peringkat
    │   ├── CommissionPage.tsx          # Halaman Pemesanan Komisi
    │   ├── OrderPage.tsx               # Halaman Detail Pesanan
    │   ├── ContestPage.tsx             # Halaman Kontes Seni
    │   ├── ArtworkDetailPage.tsx       # Halaman Detail Karya
    │   ├── ProfilePage.tsx             # Halaman Profil Artist
    │   ├── FavoritesPage.tsx           # Halaman Karya Favorit
    │   ├── CollectionsPage.tsx         # Halaman Folder Koleksi
    │   ├── CollectionDetailPage.tsx    # Halaman Isi Folder Koleksi
    │   ├── SearchPage.tsx              # Halaman Hasil Pencarian
    │   ├── CategoryPage.tsx            # Halaman Filter Kategori
    │   ├── SettingsPage.tsx            # Halaman Pengaturan
    │   ├── UploadPage.tsx              # Halaman Unggah Karya Multi-step
    │   ├── WatermarkPage.tsx           # Halaman Watermark Generator
    │   ├── AboutPage.tsx               # Halaman Tentang StematelArt
    │   └── auth/                       # Halaman Autentikasi
    │       ├── index.ts                # Barrel export
    │       ├── AuthLayout.tsx          # Layout & Form Helper Auth
    │       ├── LoginPage.tsx           # Halaman Masuk
    │       ├── SignupPage.tsx          # Halaman Daftar
    │       ├── ForgotPasswordPage.tsx  # Halaman Lupa Kata Sandi
    │       ├── CheckEmailPage.tsx      # Halaman Cek Email
    │       ├── ResetPasswordPage.tsx   # Halaman Atur Ulang Kata Sandi
    │       └── OnboardingPage.tsx      # Halaman Onboarding
```

## Scripts

```bash
npm run dev      # Vite dev server (port 3000, proxy /api -> http://localhost:8000)
npm run build    # tsc && vite build
npm run lint     # ESLint (saat ini rusak - belum ada file konfigurasi; lihat docs/AUDIT.md)
```

## Catatan

- Request `/api` diproksikan ke backend Laravel di `http://localhost:8000` via `frontend/vite.config.ts`.
- Backend menggunakan Laravel Sanctum; frontend baru memakai API pada alur login/signup.
