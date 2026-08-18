# StematelArt / ARTVAULT Frontend

Frontend modular yang sudah dipisahkan berdasarkan komponen dan halaman dari `frontend-legacy`.

## Struktur Direktori

```
frontend/
├── index.html                           # Entry point HTML
├── src/
│   ├── data/
│   │   └── mockData.js                  # Data mock & konstanta
│   ├── context/
│   │   └── AppContext.jsx               # Context & hook useApp()
│   ├── utils/
│   │   └── helpers.js                   # Helper functions, toast bus, dan utilities
│   ├── components/
│   │   ├── ui/                          # Komponen UI Reusable
│   │   │   ├── Icons.jsx                # Wrappers Lucide Icons
│   │   │   ├── Toast.jsx                # Komponen Toaster
│   │   │   ├── Avatar.jsx               # Avatar (Av)
│   │   │   ├── Pic.jsx                  # Image loader & shimmer (Pic)
│   │   │   ├── JustifiedGrid.jsx        # JustifiedGrid & MobileGrid
│   │   │   └── FeedbackBlocks.jsx       # Skeleton, EmptyBlock, ErrorBlock, Tip
│   │   ├── layout/                      # Komponen Tata Letak / Navigation
│   │   │   ├── Sidebar.jsx              # Sidebar Desktop
│   │   │   ├── TopNav.jsx               # Top Bar (Pencarian)
│   │   │   ├── MobileTopBar.jsx         # Mobile Header
│   │   │   ├── MobileNav.jsx            # Mobile Bottom Navigation
│   │   │   ├── Footer.jsx               # Footer Halaman
│   │   │   ├── DevBar.jsx               # Bar Status Dev / Anotasi
│   │   │   └── AnnotationLayer.jsx      # Overlay Anotasi data-goes-to
│   │   └── modals/                      # Popover & Modal Overlays
│   │       ├── ModalShell.jsx           # Shell dasar Modal & Popover
│   │       ├── LoginModal.jsx           # Modal login popup
│   │       ├── NotifDropdown.jsx        # Popover notifikasi
│   │       ├── AvatarMenu.jsx           # Popover menu profil user
│   │       ├── CollectionsPopover.jsx   # Popover simpan ke koleksi
│   │       ├── SharePopover.jsx         # Popover bagikan karya
│   │       ├── MoreMenu.jsx             # Popover menu unduh/laporkan
│   │       ├── Lightbox.jsx             # Lightbox gambar fullscreen
│   │       ├── SubmitModal.jsx          # Modal submit karya kontes
│   │       ├── ParticipantsModal.jsx    # Modal daftar peserta kontes
│   │       └── ConfirmDialog.jsx        # Dialog konfirmasi
│   ├── pages/                           # Halaman Aplikasi
│   │   ├── DiscoveryPage.jsx            # Halaman Discovery / Beranda
│   │   ├── RankingPage.jsx              # Halaman Papan Peringkat
│   │   ├── CommissionPage.jsx           # Halaman Pemesanan Komisi
│   │   ├── OrderPage.jsx                # Halaman Detail Pesanan
│   │   ├── ContestPage.jsx              # Halaman Kontes Seni
│   │   ├── ArtworkDetailPage.jsx        # Halaman Detail Karya & Komentar
│   │   ├── ProfilePage.jsx              # Halaman Profil Artist
│   │   ├── FavoritesPage.jsx            # Halaman Karya Favorit Disukai
│   │   ├── CollectionsPage.jsx          # Halaman Folder Koleksi
│   │   ├── CollectionDetailPage.jsx     # Halaman Isi Folder Koleksi
│   │   ├── SearchPage.jsx               # Halaman Hasil Pencarian
│   │   ├── CategoryPage.jsx             # Halaman Filter Kategori
│   │   ├── SettingsPage.jsx             # Halaman Pengaturan
│   │   ├── UploadPage.jsx               # Halaman Unggah Karya Multi-step
│   │   ├── WatermarkPage.jsx            # Halaman Watermark Generator
│   │   ├── AboutPage.jsx                # Halaman Tentang StematelArt
│   │   └── auth/                        # Halaman Autentikasi
│   │       ├── AuthLayout.jsx           # Layout & Form Helper Auth
│   │       ├── LoginPage.jsx            # Halaman Masuk
│   │       ├── SignupPage.jsx           # Halaman Daftar
│   │       ├── ForgotPasswordPage.jsx   # Halaman Lupa Kata Sandi
│   │       ├── CheckEmailPage.jsx       # Halaman Cek Email
│   │       ├── ResetPasswordPage.jsx    # Halaman Atur Ulang Kata Sandi
│   │       └── OnboardingPage.jsx       # Halaman Onboarding
│   └── App.jsx                          # Komponen Root & Router Aplikasi
```
