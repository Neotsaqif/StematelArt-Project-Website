// Mock data and constants extracted from legacy Artvault.jsx

export const ARTWORKS = [
  { id: 1,  photoId: "1478760329108-5c3ed9d495a0", aspect: 1.5,  title: "Kegelapan Abadi",      artist: "rioArtStudio",   artistId: "rio",      avatarBg: "#6366F1", initials: "RA", likes: 1247, comments: 89,  views: 8432,  category: "Digital Art", tags: ["gelap", "abstrak", "digital"],      description: "Eksplorasi kegelapan dalam dimensi digital. Karya ini terinspirasi dari mimpi-mimpi yang tak bisa dijelaskan dengan kata-kata biasa." },
  { id: 2,  photoId: "1508615039623-a25605d2b022", aspect: 0.7,  title: "Merah di Senja",      artist: "syandra_art",    artistId: "syandra",  avatarBg: "#F43F5E", initials: "SA", likes: 823,  comments: 56,  views: 4821,  category: "Ilustrasi",   tags: ["senja", "merah", "langit"],         description: "Senja di kota metropolitan, di mana merah dan jingga bersatu dalam harmoni yang tak tertandingi." },
  { id: 3,  photoId: "1500673922987-e212871fec22", aspect: 1.6,  title: "Lautan Api",          artist: "bagusPaints",    artistId: "bagus",    avatarBg: "#F97316", initials: "BP", likes: 2103, comments: 134, views: 12904, category: "Lukisan",     tags: ["api", "lautan", "dramatis"],        description: "Lukisan digital yang menggambarkan lautan terbakar di bawah langit malam berbintang." },
  { id: 4,  photoId: "1502134249126-9f3755a50d78", aspect: 1.0,  title: "Galaksi Tersembunyi", artist: "stellarInk",     artistId: "stellar",  avatarBg: "#8B5CF6", initials: "SI", likes: 1567, comments: 201, views: 9340,  category: "Digital Art", tags: ["galaksi", "kosmos", "bintang"],     description: "Perjalanan menemukan galaksi tersembunyi di balik nebula biru yang misterius." },
  { id: 5,  photoId: "1634017839464-5c339ebe3cb4", aspect: 1.3,  title: "Dunia 3D",            artist: "kubikArts",      artistId: "kubik",    avatarBg: "#10B981", initials: "KA", likes: 934,  comments: 67,  views: 5621,  category: "3D/CGI",      tags: ["3d", "geometri", "modern"],         description: "Eksplorasi bentuk tiga dimensi dalam ruang virtual yang penuh kemungkinan." },
  { id: 6,  photoId: "1536431311719-398b6704d4cc", aspect: 0.75, title: "Neon Kota",           artist: "neoCityArt",     artistId: "neo",      avatarBg: "#EC4899", initials: "NC", likes: 2891, comments: 178, views: 18320, category: "Digital Art", tags: ["neon", "kota", "malam"],            description: "Kota bersinar dalam kegelapan malam, dihiasi cahaya neon yang memukau dan penuh energi." },
  { id: 7,  photoId: "1579965342575-16428a7c8881", aspect: 1.4,  title: "Cat Air Gugur",       artist: "aquaArini",      artistId: "arini",    avatarBg: "#F59E0B", initials: "AA", likes: 1102, comments: 43,  views: 6730,  category: "Lukisan",     tags: ["cat air", "gugur", "daun"],         description: "Keindahan musim gugur dalam goresan cat air yang lembut dan menenangkan jiwa." },
  { id: 8,  photoId: "1547891654-e66ed7ebb968", aspect: 1.5,  title: "Potret Digital",      artist: "portraitPlus",   artistId: "portrait", avatarBg: "#06B6D4", initials: "PP", likes: 756,  comments: 34,  views: 4120,  category: "Ilustrasi",   tags: ["potret", "digital", "karakter"],    description: "Karakter fiksi dalam gaya ilustrasi semi-realis yang detail dan ekspresif." },
  { id: 9,  photoId: "1519681393784-d120267933ba", aspect: 1.8,  title: "Puncak Bintang",      artist: "gunung_photo",   artistId: "gunung",   avatarBg: "#0EA5E9", initials: "GP", likes: 3245, comments: 212, views: 21000, category: "Fotografi",   tags: ["gunung", "bintang", "bimasakti"],   description: "Puncak gunung dengan hamparan Bimasakti di atas, dipotret pada pukul 02.00 dini hari." },
  { id: 10, photoId: "1508962914676-134849a727f0", aspect: 0.67, title: "Wajah Waktu",         artist: "kronos_draw",    artistId: "kronos",   avatarBg: "#64748B", initials: "KD", likes: 1893, comments: 145, views: 11230, category: "Ilustrasi",   tags: ["potret", "waktu", "ekspresif"],     description: "Eksplorasi konsep waktu melalui wajah yang terukir oleh pengalaman dan kenangan." },
  { id: 11, photoId: "1604079628040-94301bb21b91", aspect: 1.5,  title: "Abstrak Meledak",     artist: "splashCreative", artistId: "splash",   avatarBg: "#EF4444", initials: "SC", likes: 677,  comments: 28,  views: 3890,  category: "Digital Art", tags: ["abstrak", "ledakan", "warna"],      description: "Percikan cat digital penuh energi dan ekspresi bebas tanpa batas." },
  { id: 12, photoId: "1502691876148-a84978e59af8", aspect: 0.75, title: "Simfoni Warna",       artist: "choirColor",     artistId: "choir",    avatarBg: "#D946EF", initials: "CC", likes: 1340, comments: 98,  views: 7650,  category: "Digital Art", tags: ["warna", "simfoni", "abstrak"],      description: "Komposisi warna terinspirasi dari melodi musik klasik Beethoven." },
  { id: 13, photoId: "1477959858617-67f85cf4f1df", aspect: 1.7,  title: "Garis Cakrawala",     artist: "horizonArts",    artistId: "horizon",  avatarBg: "#F97316", initials: "HA", likes: 1678, comments: 89,  views: 9870,  category: "Fotografi",   tags: ["cakrawala", "senja", "alam"],       description: "Garis cakrawala memisahkan bumi dan langit dalam keindahan senja yang dramatis." },
  { id: 14, photoId: "1524504388940-b1c1722653e1", aspect: 0.8,  title: "Potret Jiwa",         artist: "soulPortrait",   artistId: "soul",     avatarBg: "#7C3AED", initials: "SP", likes: 2109, comments: 156, views: 13200, category: "Lukisan",     tags: ["potret", "jiwa", "ekspresif"],      description: "Lukisan ekspresif menangkap esensi jiwa melalui mata yang penuh cerita." },
  { id: 15, photoId: "1518005020951-eccb494ad742", aspect: 1.2,  title: "Ruang Geometri",      artist: "geoSpace",       artistId: "geo",      avatarBg: "#0891B2", initials: "GS", likes: 543,  comments: 21,  views: 2980,  category: "3D/CGI",      tags: ["geometri", "ruang", "3d"],          description: "Menjelajahi ruang tiga dimensi melalui bentuk-bentuk geometris murni." },
  { id: 16, photoId: "1504639725590-34d0984388bd", aspect: 1.3,  title: "Desain Masa Depan",   artist: "futureDesign",   artistId: "future",   avatarBg: "#059669", initials: "FD", likes: 1123, comments: 67,  views: 6780,  category: "Digital Art", tags: ["desain", "futuristik", "teknologi"], description: "Konsep antarmuka masa depan yang bersih, intuitif, dan humanis." },
  { id: 17, photoId: "1604999333679-b86d54738315", aspect: 0.75, title: "Karakter Nusantara",  artist: "characterLab",   artistId: "charlab",  avatarBg: "#14B8A6", initials: "CL", likes: 987,  comments: 72,  views: 5400,  category: "Ilustrasi",   tags: ["karakter", "nusantara", "budaya"],  description: "Karakter original terinspirasi dari cerita rakyat Indonesia yang kaya." },
  { id: 18, photoId: "1518837695005-2083093ee35b", aspect: 1.8,  title: "Hamparan Samudra",    artist: "lautanFoto",     artistId: "lautan",   avatarBg: "#0284C7", initials: "LF", likes: 2540, comments: 189, views: 16700, category: "Fotografi",   tags: ["laut", "alam", "panorama"],         description: "Panorama laut tak bertepi saat matahari terbenam dalam warna keemasan." },
];

export const CATEGORIES_DATA = [
  { name: "Lukisan",    photoId: "1578301978018-3005759f48f7", count: "12.4k" },
  { name: "Ilustrasi",  photoId: "1513364776144-60967b0f800f", count: "34.6k" },
  { name: "Fotografi",  photoId: "1516035069371-29a1b244cc32", count: "28.9k" },
  { name: "Digital Art",photoId: "1618005182384-a83a8bd57fbe", count: "41.2k" },
  { name: "3D/CGI",     photoId: "1618005198919-d3d4b5a92ead", count: "9.8k"  },
  { name: "Komik",      photoId: "1601645191163-3fc0d5d64e35", count: "7.3k"  },
];

export const COMM_ARTISTS = [
  {
    id: "rio", name: "rioArtStudio", avatarBg: "#6366F1", initials: "RA",
    status: "open", statusLabel: "Terbuka",
    specialty: "Dark Fantasy · Concept Art · Environment", slots: 3, rating: 4.9, reviews: 234,
    portfolio: ARTWORKS.slice(0, 4),
    tiers: [
      { name: "Sketch",     price: "Rp 150.000", days: "3 hari", revisions: 2, deliverables: [{ label: "Berkas PNG", ok: true }, { label: "Resolusi tinggi 4K", ok: false }, { label: "Hak pakai komersial", ok: false }] },
      { name: "Lineart",    price: "Rp 350.000", days: "7 hari", revisions: 3, popular: true, deliverables: [{ label: "Berkas PNG + PSD", ok: true }, { label: "Resolusi tinggi 4K", ok: true }, { label: "Hak pakai komersial", ok: false }] },
      { name: "Full Color", price: "Rp 650.000", days: "14 hari", revisions: 5, deliverables: [{ label: "Berkas PNG + PSD", ok: true }, { label: "Resolusi tinggi 4K", ok: true }, { label: "Hak pakai komersial", ok: true }] },
    ],
  },
  {
    id: "syandra", name: "syandra_art", avatarBg: "#F43F5E", initials: "SA",
    status: "waitlist", statusLabel: "Waitlist",
    specialty: "Karakter · Chibi · Webtoon", slots: 0, rating: 4.7, reviews: 189,
    portfolio: ARTWORKS.slice(4, 8),
    tiers: [
      { name: "Sketch",     price: "Rp 120.000", days: "5 hari", revisions: 2, deliverables: [{ label: "Berkas PNG", ok: true }, { label: "Resolusi tinggi 4K", ok: false }, { label: "Hak pakai komersial", ok: false }] },
      { name: "Lineart",    price: "Rp 280.000", days: "10 hari", revisions: 3, popular: true, deliverables: [{ label: "Berkas PNG + PSD", ok: true }, { label: "Resolusi tinggi 4K", ok: true }, { label: "Hak pakai komersial", ok: false }] },
      { name: "Full Color", price: "Rp 500.000", days: "21 hari", revisions: 4, deliverables: [{ label: "Berkas PNG + PSD", ok: true }, { label: "Resolusi tinggi 4K", ok: true }, { label: "Hak pakai komersial", ok: true }] },
    ],
  },
  {
    id: "bagus", name: "bagusPaints", avatarBg: "#F97316", initials: "BP",
    status: "closed", statusLabel: "Tutup",
    specialty: "Landscape · Environment · Book Cover", slots: 0, rating: 5.0, reviews: 312,
    portfolio: ARTWORKS.slice(8, 12),
    tiers: [
      { name: "Sketch",     price: "Rp 200.000", days: "5 hari", revisions: 2, deliverables: [{ label: "Berkas PNG", ok: true }, { label: "Resolusi tinggi 4K", ok: false }, { label: "Hak pakai komersial", ok: false }] },
      { name: "Lineart",    price: "Rp 500.000", days: "14 hari", revisions: 3, popular: true, deliverables: [{ label: "Berkas PNG + PSD", ok: true }, { label: "Resolusi tinggi 4K", ok: true }, { label: "Hak pakai komersial", ok: false }] },
      { name: "Full Color", price: "Rp 900.000", days: "21 hari", revisions: 5, deliverables: [{ label: "Berkas PNG + PSD", ok: true }, { label: "Resolusi tinggi 4K", ok: true }, { label: "Hak pakai komersial", ok: true }] },
    ],
  },
];

export const ORDERS = [
  { id: "CM-2041", artist: "rioArtStudio", bg: "#6366F1", init: "RA", tier: "Full Color", price: "Rp 650.000",
    status: "accepted", label: "Diterima", note: "Estimasi selesai 14 hari · dana ditahan escrow hingga karya disetujui." },
  { id: "CM-2038", artist: "bagusPaints", bg: "#F97316", init: "BP", tier: "Lineart", price: "Rp 500.000",
    status: "declined", label: "Ditolak", note: "Alasan: slot bulan ini sudah penuh. Artist menyarankan pesan ulang 1 September." },
];

export const NOTIFS = [
  { id: 1, kind: "artwork", who: "stellarInk", bg: "#8B5CF6", init: "SI", text: "menyukai karyamu Kegelapan Abadi", ago: "12 menit lalu", art: 1 },
  { id: 2, kind: "comment", who: "aquaArini", bg: "#F59E0B", init: "AA", text: "mengomentari Lautan Api", ago: "1 jam lalu", art: 3 },
  { id: 3, kind: "order", who: "bagusPaints", bg: "#F97316", init: "BP", text: "menolak pesanan #CM-2038", ago: "3 jam lalu", order: "CM-2038" },
  { id: 4, kind: "order", who: "rioArtStudio", bg: "#6366F1", init: "RA", text: "menerima pesanan #CM-2041", ago: "kemarin", order: "CM-2041" },
  { id: 5, kind: "artwork", who: "neoCityArt", bg: "#EC4899", init: "NC", text: "mengunggah karya baru Neon Kota", ago: "2 hari lalu", art: 6 },
];

export const COLLECTION_SEED = [
  { id: "insp", name: "Inspirasi Gelap", ids: [1, 3, 10, 14] },
  { id: "ref", name: "Referensi Warna", ids: [11, 12, 16] },
  { id: "alam", name: "Alam & Langit", ids: [9, 13, 18] },
];

export const PARTICIPANTS = ARTWORKS.slice(0, 8).map(a => ({ id: a.artistId, name: a.artist, bg: a.avatarBg, init: a.initials, works: 2 + (a.id % 3) }));

export const TAG_POOL = [...new Set(ARTWORKS.flatMap(a => a.tags))];

export const VIEW_STATES = [["normal", "Normal"], ["loading", "Memuat"], ["empty", "Kosong"], ["error", "Error"]];

export const REOPEN = { syandra: "1 September 2026", bagus: "15 September 2026" };

export const ORDER_STEPS = ["Menunggu", "Diproses", "Selesai"];

export const CONTEST_END = new Date("2026-08-31T23:59:59+07:00");

export const MOCK_COMMENTS = [
  { user: "stellarInk",  bg: "#8B5CF6", init: "SI", text: "Wah keren banget! Teknik shadowingnya luar biasa. Pakai brush apa ini?",   ago: "2 jam lalu",  likes: 14 },
  { user: "aquaArini",   bg: "#F59E0B", init: "AA", text: "Inspirasinya dari mana? Pengen belajar teknik kayak gini ke depannya.",       ago: "5 jam lalu",  likes: 8  },
  { user: "geoSpace",    bg: "#0891B2", init: "GS", text: "Favorit! Udah disimpan buat referensi. Semangat terus karyanya!",             ago: "1 hari lalu", likes: 21 },
];

export const PROFILE = {
  name: "rioArtStudio", avatarBg: "#6366F1", initials: "RA",
  followers: 12450, following: 234, works: 89,
  bio: "Digital artist berbasis di Jakarta. Spesialisasi dalam dark fantasy dan ilustrasi konsep lingkungan. Tersedia untuk komisi komersial dan personal.",
  location: "Jakarta, Indonesia", website: "rioart.studio",
  bannerPhotoId: "1519501025264-65ba15a82390",
  tools: ["Procreate", "Adobe Photoshop", "Blender", "Cinema 4D"],
};

export const WM_POS = [
  ["flex-start", "flex-start"], ["center", "flex-start"], ["flex-end", "flex-start"],
  ["flex-start", "center"],     ["center", "center"],     ["flex-end", "center"],
  ["flex-start", "flex-end"],   ["center", "flex-end"],   ["flex-end", "flex-end"],
];

export const UPLOAD_STEPS = ["Pilih Berkas", "Watermark", "Detail Karya"];

export const AUTH_SCREENS = ["login", "signup", "forgot", "checkEmail", "reset", "onboarding"];

export const AUTH_ART = {
  login:  { photoId: "1536431311719-398b6704d4cc", title: "Neon Kota", artist: "neoCityArt" },
  signup: { photoId: "1508615039623-a25605d2b022", title: "Merah di Senja", artist: "syandra_art" },
  reset:  { photoId: "1604999333679-b86d54738315", title: "Karakter Nusantara", artist: "characterLab" },
};

export const TAKEN = ["admin", "artvault", "rioart", "syandra_art", "neocityart", "test"];

export const STRENGTH_COLOR = ["#E5E5E7", "#A1A1AA", "#F59E0B", "#059669"];
export const STRENGTH_LABEL = ["", "Lemah", "Cukup", "Kuat"];

export const ONBOARD_CHIPS = ["Digital Art", "Ilustrasi", "Lukisan", "Fotografi", "3D/CGI", "Komik", "Karakter", "Potret", "Abstrak", "Konsep Lingkungan", "Piksel", "Kaligrafi"];

export const EXPORT_FRAMES = [
  ["Discovery",              "discovery",   {}, true],
  ["Discovery — belum masuk", "discovery",  {}, false],
  ["Ranking",                "ranking",     {}, true],
  ["Commission",             "commission",  {}, true],
  ["Kontes",                 "contest",     {}, true],
  ["Artwork",                "artwork",     { artwork: ARTWORKS[0] }, true],
  ["Profil",                 "profile",     {}, true],
  ["Pencarian",              "search",      { q: "cyberpunk" }, true],
  ["Kategori",               "category",    { category: "Digital Art" }, true],
  ["Favorit",                "favorites",   {}, true],
  ["Koleksi",                "collections", {}, true],
  ["Isi koleksi",            "collection",  { collection: COLLECTION_SEED[0] }, true],
  ["Pesanan",                "order",       { order: ORDERS[0] }, true],
  ["Unggah",                 "upload",      {}, true],
  ["Watermark Generator",    "watermark",   {}, true],
  ["Pengaturan",             "settings",    {}, true],
  ["Tentang",                "about",       {}, true],
  ["Masuk",                  "login",       {}, false],
  ["Daftar",                 "signup",      {}, false],
  ["Lupa kata sandi",        "forgot",      {}, false],
  ["Cek email",              "checkEmail",  { email: "nadia@email.com" }, false],
  ["Atur ulang kata sandi",  "reset",       {}, false],
  ["Onboarding",             "onboarding",  {}, true],
];
