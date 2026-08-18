// ARTVAULT — recreation of src/app/App.tsx + wired interaction spec
const R = window.React;
const { useState, useRef, useEffect, useCallback, useMemo, useContext } = R;
const createContext = R.createContext;

// ─── lucide icons (vanilla UMD → React) ──────────────────────────────────────
const ICON_ALIASES = { CheckCircle: "CircleCheck", Share2: "Share2Icon", Link2: "Link2Icon", PenTool: "PenToolIcon", AlertTriangle: "TriangleAlert", ImageIcon: "Image" };
const SVG_ATTR = { "stroke-width": "strokeWidth", "stroke-linecap": "strokeLinecap", "stroke-linejoin": "strokeLinejoin",
  "fill-rule": "fillRule", "clip-rule": "clipRule", "fill-opacity": "fillOpacity", "stroke-opacity": "strokeOpacity",
  "stroke-dasharray": "strokeDasharray" };
function fixAttrs(a) {
  const o = {};
  for (const k in (a || {})) o[SVG_ATTR[k] || k] = a[k];
  return o;
}
function iconNode(name) {
  const L = window.lucide;
  if (!L) return null;
  const src = L.icons || L;
  return src[name] || src[ICON_ALIASES[name]] || null;
}
// lucide vanilla nodes come as either ["svg", attrs, kids] or [["path", attrs], ...]
function nodeKids(node) {
  if (!Array.isArray(node)) return [];
  if (typeof node[0] === "string") return Array.isArray(node[2]) ? node[2] : [];
  return node;
}
function renderKids(kids) {
  return (kids || []).map((c, i) => {
    if (!Array.isArray(c)) return null;
    const kids2 = Array.isArray(c[2]) ? renderKids(c[2]) : null;
    return R.createElement(c[0], { key: i, ...fixAttrs(c[1]) }, kids2);
  });
}
function makeIcon(name) {
  return function LucideIcon({ size = 24, fill = "none", strokeWidth = 2, className = "", style, ...rest }) {
    return R.createElement(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24",
        fill, stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round",
        className: ("lucide " + className).trim(), style, ...rest,
      },
      renderKids(nodeKids(iconNode(name)))
    );
  };
}
const [Search, Upload, Compass, Trophy, Briefcase, Award, Heart, Bookmark,
  Bell, Eye, MessageCircle, Share2, Plus, Crown, ChevronRight, Palette,
  Camera, PenTool, Cpu, User, Layers, BookOpen, MapPin, Link2, Star,
  Send, ArrowLeft, Check, CheckCircle, TrendingUp] =
  ["Search","Upload","Compass","Trophy","Briefcase","Award","Heart","Bookmark",
   "Bell","Eye","MessageCircle","Share2","Plus","Crown","ChevronRight","Palette",
   "Camera","PenTool","Cpu","User","Layers","BookOpen","MapPin","Link2","Star",
   "Send","ArrowLeft","Check","CheckCircle","TrendingUp"].map(makeIcon);
const [X, Lock, AlertTriangle, Stamp, Type, ImageIcon, RefreshCw, Clock, Repeat, Settings, XCircle,
  Download, MoreHorizontal, Flag, Link, Maximize2, Folder, FolderPlus, LogOut, Copy, ChevronLeft, Info, Reply, Tag] =
  ["X","Lock","AlertTriangle","Stamp","Type","ImageIcon","RefreshCw","Clock","Repeat","Settings","XCircle",
   "Download","MoreHorizontal","Flag","Link","Maximize2","Folder","FolderPlus","LogOut","Copy","ChevronLeft","Info","Reply","Tag"].map(makeIcon);
const [EyeOff, Mail, Shield, ArrowRight, Sparkles, Users] =
  ["EyeOff","Mail","Shield","ArrowRight","Sparkles","Users"].map(makeIcon);

// ─── toast: bottom-centre, 3s ─────────────────────────────────────────────────
const toastBus = { list: [], subs: new Set(), n: 0 };
const emit = () => toastBus.subs.forEach(f => f([...toastBus.list]));
function push(type, title, opts) {
  const id = ++toastBus.n;
  toastBus.list = [...toastBus.list, { id, type, title, description: opts && opts.description }];
  emit();
  setTimeout(() => { toastBus.list = toastBus.list.filter(t => t.id !== id); emit(); }, 3000);
}
const toast = Object.assign((m, o) => push("default", m, o), {
  success: (m, o) => push("success", m, o),
  error: (m, o) => push("error", m, o),
  info: (m, o) => push("info", m, o),
});
const TOAST_SKIN = {
  success: { bg: "#ECFDF5", bd: "#A7F3D0", fg: "#059669" },
  error:   { bg: "#FEF2F3", bd: "#F7C9CC", fg: "#C41A22" },
  info:    { bg: "#ffffff", bd: "#E5E5E7", fg: "#0A0A0B" },
  default: { bg: "#ffffff", bd: "#E5E5E7", fg: "#0A0A0B" },
};
function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => { toastBus.subs.add(setItems); return () => { toastBus.subs.delete(setItems); }; }, []);
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 200,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 380, pointerEvents: "none",
    }}>
      {items.map(t => {
        const sk = TOAST_SKIN[t.type] || TOAST_SKIN.default;
        return (
          <div key={t.id} style={{
            background: sk.bg, border: "1px solid " + sk.bd, color: sk.fg, borderRadius: 999,
            padding: "10px 18px", display: "flex", gap: 8, alignItems: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,.10)", pointerEvents: "auto", maxWidth: "100%",
          }}>
            {t.type === "error" ? <AlertTriangle size={15} style={{ flexShrink: 0 }} /> : <CheckCircle size={15} style={{ flexShrink: 0 }} />}
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>{t.title}</p>
              {t.description && <p style={{ margin: 0, fontSize: 12, fontWeight: 500, opacity: .8, lineHeight: 1.35 }}>{t.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── app context ──────────────────────────────────────────────────────────────
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// ─── tooltip (hover, no script) ───────────────────────────────────────────────
function Tip({ text, children, className = "" }) {
  return (
    <span className={"relative inline-flex group " + className}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
        <span className="block bg-[#0A0A0B] text-white text-[11px] font-medium leading-snug px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">{text}</span>
      </span>
    </span>
  );
}

// ─── overlay shells: Esc / X / click-outside ───────────────────────────────────
function useEsc(onClose) {
  useEffect(() => {
    const k = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
}

function Modal({ title, onClose, children, width = 440 }) {
  useEsc(onClose);
  return (
    <div className="fixed inset-0 z-[120] bg-black/45 flex items-start justify-center p-6 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full my-auto overflow-hidden"
        style={{ maxWidth: width }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5E7]">
          <p className="text-sm font-bold text-[#0A0A0B]">{title}</p>
          <button
            onClick={onClose}
            data-goes-to="Tutup (Esc / klik luar)"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#52525B] hover:bg-gray-50 active:bg-[#F5F5F5] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Popover({ rect, onClose, children, width = 250 }) {
  useEsc(onClose);
  const left = Math.min(Math.max(10, (rect.left + rect.width / 2) - width / 2), window.innerWidth - width - 10);
  const openUp = rect.bottom + 260 > window.innerHeight;
  const style = openUp
    ? { left, bottom: window.innerHeight - rect.top + 8, width }
    : { left, top: rect.bottom + 8, width };
  return (
    <div className="fixed inset-0 z-[120]" onClick={onClose}>
      <div
        className="fixed bg-white border border-[#E5E5E7] rounded-xl shadow-xl overflow-hidden"
        style={style}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ─── annotation layer ─────────────────────────────────────────────────────────
function AnnotationLayer({ on }) {
  useEffect(() => {
    if (!on) return;
    const host = document.createElement("div");
    host.setAttribute("data-annot-host", "");
    Object.assign(host.style, { position: "fixed", inset: "0", zIndex: "110", pointerEvents: "none" });
    document.body.appendChild(host);

    let raf = 0, stop = false;
    const paint = () => {
      if (stop) return;
      host.textContent = "";
      document.querySelectorAll("[data-goes-to]").forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.bottom < -40 || r.top > window.innerHeight + 40) return;
        const box = document.createElement("div");
        Object.assign(box.style, {
          position: "fixed", top: r.top + "px", left: r.left + "px",
          width: r.width + "px", height: r.height + "px",
          border: "1px dashed #E81E28", boxSizing: "border-box",
        });
        const tag = document.createElement("span");
        tag.textContent = el.getAttribute("data-goes-to");
        Object.assign(tag.style, {
          position: "absolute", top: "-10px", left: "0", maxWidth: "270px",
          background: "#E81E28", color: "#fff", font: "700 9px/1.5 'Plus Jakarta Sans',sans-serif",
          letterSpacing: ".02em", textTransform: "uppercase", padding: "1px 5px", borderRadius: "3px",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block",
        });
        box.appendChild(tag);
        host.appendChild(box);
      });
    };
    const queue = () => { if (raf) return; raf = setTimeout(() => { raf = 0; paint(); }, 60); };
    paint();
    const tick = setInterval(paint, 500);
    window.addEventListener("scroll", queue, true);
    window.addEventListener("resize", queue);
    return () => {
      stop = true; clearInterval(tick); clearTimeout(raf);
      window.removeEventListener("scroll", queue, true); window.removeEventListener("resize", queue);
      host.remove();
    };
  }, [on]);
  return null;
}

// ─── dev bar: view state + annotation ─────────────────────────────────────────
const VIEW_STATES = [["normal", "Normal"], ["loading", "Memuat"], ["empty", "Kosong"], ["error", "Error"]];

function DevBar({ value, onChange, annotate, onAnnotate }) {
  return (
    <div className="hidden md:flex fixed bottom-5 right-5 z-[100] items-center gap-1 bg-white border border-[#E5E5E7] shadow-lg rounded-full p-1">
      <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest px-2">Status</span>
      {VIEW_STATES.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={"text-xs font-semibold px-3 py-1.5 rounded-full transition-colors " + (value === id ? "bg-[#E81E28] text-white" : "text-[#52525B] hover:text-[#0A0A0B]")}
        >
          {label}
        </button>
      ))}
      <span className="w-px h-5 bg-[#E5E5E7] mx-1" />
      <button
        onClick={() => onAnnotate(!annotate)}
        className={"text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 " + (annotate ? "bg-[#0A0A0B] text-white" : "text-[#52525B] hover:text-[#0A0A0B]")}
      >
        <Info size={11} /> Anotasi
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const imgUrl = (photoId, w, h) => {
  const bundled = (window.__resources || {})["ph_" + photoId];
  if (bundled) return bundled;
  return "https://images.unsplash.com/photo-" + photoId + "?w=" + w + "&h=" + h + "&fit=crop&auto=format&q=80";
};

const fmtNum = (n) => n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
const fmtPts = (n) => n.toLocaleString("id-ID");
const lifetimeScore = (a) => a.likes * 12 + a.comments * 30 + Math.round(a.views * 0.6);
const SINCE = {
  1: "14 Februari 2024", 2: "3 Maret 2024", 3: "27 Januari 2024", 4: "9 April 2024",
  5: "18 Mei 2024", 6: "2 Desember 2023", 7: "21 Juni 2024", 8: "7 Juli 2024",
  9: "11 November 2023", 10: "29 Agustus 2024", 11: "5 September 2024", 12: "16 Oktober 2024",
  13: "23 Januari 2025", 14: "8 Februari 2025", 15: "19 Maret 2025", 16: "4 April 2025",
  17: "30 Mei 2025", 18: "12 Juni 2025",
};
const FADE_MASK = "linear-gradient(to bottom, #000 0%, #000 46%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0) 100%)";
const fadeStyle = { WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK };
const TOP_SCRIM = "linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 34%, rgba(0,0,0,0) 56%)";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ARTWORKS = [
  { id: 1,  photoId: "1478760329108-5c3ed9d495a0", aspect: 1.5,  title: "Kegelapan Abadi",      artist: "rioArtStudio",   artistId: "rio",      avatarBg: "#6366F1", initials: "RA", likes: 1247, comments: 89,  views: 8432,  category: "Digital Art", tags: ["gelap", "abstrak", "digital"],      description: "Eksplorasi kegelapan dalam dimensi digital. Karya ini terinspirasi dari mimpi-mimpi yang tak bisa dijelaskan dengan kata-kata biasa." },
  { id: 2,  photoId: "1508615039623-a25605d2b022", aspect: 0.7,  title: "Merah di Senja",      artist: "syandra_art",    artistId: "syandra",  avatarBg: "#F43F5E", initials: "SA", likes: 823,  comments: 56,  views: 4821,  category: "Ilustrasi",   tags: ["senja", "merah", "langit"],         description: "Senja di kota metropolitan, di mana merah dan jingga bersatu dalam harmoni yang tak tertandingi." },
  { id: 3,  photoId: "1500673922987-e212871fec22",   aspect: 1.6,  title: "Lautan Api",          artist: "bagusPaints",    artistId: "bagus",    avatarBg: "#F97316", initials: "BP", likes: 2103, comments: 134, views: 12904, category: "Lukisan",     tags: ["api", "lautan", "dramatis"],        description: "Lukisan digital yang menggambarkan lautan terbakar di bawah langit malam berbintang." },
  { id: 4,  photoId: "1502134249126-9f3755a50d78", aspect: 1.0,  title: "Galaksi Tersembunyi", artist: "stellarInk",     artistId: "stellar",  avatarBg: "#8B5CF6", initials: "SI", likes: 1567, comments: 201, views: 9340,  category: "Digital Art", tags: ["galaksi", "kosmos", "bintang"],     description: "Perjalanan menemukan galaksi tersembunyi di balik nebula biru yang misterius." },
  { id: 5,  photoId: "1634017839464-5c339ebe3cb4", aspect: 1.3,  title: "Dunia 3D",            artist: "kubikArts",      artistId: "kubik",    avatarBg: "#10B981", initials: "KA", likes: 934,  comments: 67,  views: 5621,  category: "3D/CGI",      tags: ["3d", "geometri", "modern"],         description: "Eksplorasi bentuk tiga dimensi dalam ruang virtual yang penuh kemungkinan." },
  { id: 6,  photoId: "1536431311719-398b6704d4cc", aspect: 0.75, title: "Neon Kota",           artist: "neoCityArt",     artistId: "neo",      avatarBg: "#EC4899", initials: "NC", likes: 2891, comments: 178, views: 18320, category: "Digital Art", tags: ["neon", "kota", "malam"],            description: "Kota bersinar dalam kegelapan malam, dihiasi cahaya neon yang memukau dan penuh energi." },
  { id: 7,  photoId: "1579965342575-16428a7c8881",   aspect: 1.4,  title: "Cat Air Gugur",       artist: "aquaArini",      artistId: "arini",    avatarBg: "#F59E0B", initials: "AA", likes: 1102, comments: 43,  views: 6730,  category: "Lukisan",     tags: ["cat air", "gugur", "daun"],         description: "Keindahan musim gugur dalam goresan cat air yang lembut dan menenangkan jiwa." },
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

const CATEGORIES_DATA = [
  { name: "Lukisan",    photoId: "1578301978018-3005759f48f7", count: "12.4k" },
  { name: "Ilustrasi",  photoId: "1513364776144-60967b0f800f", count: "34.6k" },
  { name: "Fotografi",  photoId: "1516035069371-29a1b244cc32", count: "28.9k" },
  { name: "Digital Art",photoId: "1618005182384-a83a8bd57fbe", count: "41.2k" },
  { name: "3D/CGI",     photoId: "1618005198919-d3d4b5a92ead", count: "9.8k"  },
  { name: "Komik",      photoId: "1601645191163-3fc0d5d64e35", count: "7.3k"  },
];

const COMM_ARTISTS = [
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

const ORDERS = [
  { id: "CM-2041", artist: "rioArtStudio", bg: "#6366F1", init: "RA", tier: "Full Color", price: "Rp 650.000",
    status: "accepted", label: "Diterima", note: "Estimasi selesai 14 hari · dana ditahan escrow hingga karya disetujui." },
  { id: "CM-2038", artist: "bagusPaints", bg: "#F97316", init: "BP", tier: "Lineart", price: "Rp 500.000",
    status: "declined", label: "Ditolak", note: "Alasan: slot bulan ini sudah penuh. Artist menyarankan pesan ulang 1 September." },
];

const NOTIFS = [
  { id: 1, kind: "artwork", who: "stellarInk", bg: "#8B5CF6", init: "SI", text: "menyukai karyamu Kegelapan Abadi", ago: "12 menit lalu", art: 1 },
  { id: 2, kind: "comment", who: "aquaArini", bg: "#F59E0B", init: "AA", text: "mengomentari Lautan Api", ago: "1 jam lalu", art: 3 },
  { id: 3, kind: "order", who: "bagusPaints", bg: "#F97316", init: "BP", text: "menolak pesanan #CM-2038", ago: "3 jam lalu", order: "CM-2038" },
  { id: 4, kind: "order", who: "rioArtStudio", bg: "#6366F1", init: "RA", text: "menerima pesanan #CM-2041", ago: "kemarin", order: "CM-2041" },
  { id: 5, kind: "artwork", who: "neoCityArt", bg: "#EC4899", init: "NC", text: "mengunggah karya baru Neon Kota", ago: "2 hari lalu", art: 6 },
];

const COLLECTION_SEED = [
  { id: "insp", name: "Inspirasi Gelap", ids: [1, 3, 10, 14] },
  { id: "ref", name: "Referensi Warna", ids: [11, 12, 16] },
  { id: "alam", name: "Alam & Langit", ids: [9, 13, 18] },
];

const PARTICIPANTS = ARTWORKS.slice(0, 8).map(a => ({ id: a.artistId, name: a.artist, bg: a.avatarBg, init: a.initials, works: 2 + (a.id % 3) }));

// ─── Justified Grid Engine ────────────────────────────────────────────────────
function computeRows(items, containerW, targetH, gutter) {
  if (containerW <= 0) return [];
  const rows = [];
  let row = [];
  let rowNW = 0;

  const flush = (isLast = false) => {
    if (!row.length) return;
    const gutterTotal = gutter * (row.length - 1);
    const naturalTotal = rowNW + gutterTotal;
    const shouldStretch = !isLast || naturalTotal >= containerW * 0.6;
    const scale = shouldStretch ? (containerW - gutterTotal) / rowNW : 1;
    const rh = targetH * scale;
    rows.push(row.map(r => ({ id: r.id, w: r.aspect * rh, h: rh })));
    row = []; rowNW = 0;
  };

  for (const item of items) {
    const iw = item.aspect * targetH;
    const guttersIfAdded = gutter * row.length;
    if (row.length && rowNW + guttersIfAdded + iw > containerW) flush();
    row.push(item);
    rowNW += iw;
  }
  flush(true);
  return rows;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Av({ bg, initials, size = 32, ring = false }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${ring ? "ring-2 ring-[#E81E28] ring-offset-2" : ""}`}
      style={{ width: size, height: size, background: bg, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </div>
  );
}

// ─── Pic: reserved box, shimmer skeleton, designed fallback ───────────────────
function Pic({ photoId, w, h, title, className = "", imgClass = "", style, onClick, dataGoesTo, compact, eager }) {
  const [st, setSt] = useState("load");
  return (
    <div
      className={"relative overflow-hidden bg-[#F5F5F5] " + className}
      style={style}
      onClick={onClick}
      data-goes-to={dataGoesTo}
    >
      {st === "load" && (
        <span
          className="absolute inset-0"
          style={{
            background: "linear-gradient(100deg, #F5F5F5 28%, #EAEAEC 48%, #F5F5F5 68%)",
            backgroundSize: "220% 100%", animation: "avShimmer 1.5s linear infinite",
          }}
        />
      )}
      {st === "err" ? (
        <span
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2"
          style={{ background: "#F1F1F3" }}
        >
          <Palette size={compact ? 13 : 20} style={{ color: "#A1A1AA" }} />
          {!compact && title && (
            <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: "#A1A1AA" }}>{title}</span>
          )}
        </span>
      ) : (
        <img
          src={imgUrl(photoId, w, h)}
          alt=""
          aria-label={title || undefined}
          loading={eager ? "eager" : "lazy"}
          onLoad={() => setSt("ok")}
          onError={() => setSt("err")}
          className={"absolute inset-0 w-full h-full object-cover " + imgClass}
          style={{ opacity: st === "ok" ? 1 : 0, transition: "opacity .3s ease" }}
        />
      )}
    </div>
  );
}

// ─── Justified Grid ───────────────────────────────────────────────────────────
function JustifiedGrid({ artworks, targetHeight = 240 }) {
  const app = useApp();
  const ref = useRef(null);
  const [cw, setCw] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(e => setCw(e[0].contentRect.width));
    ro.observe(ref.current);
    setCw(ref.current.clientWidth);
    return () => ro.disconnect();
  }, []);

  const rows = useMemo(() => computeRows(artworks, cw, targetHeight, 4), [artworks, cw, targetHeight]);
  const artMap = useMemo(() => new Map(artworks.map(a => [a.id, a])), [artworks]);

  return (
    <div ref={ref} className="w-full">
      {rows.map((row, ri) => (
        <div key={ri} className="flex" style={{ gap: 4, marginBottom: 4 }}>
          {row.map(cell => {
            const art = artMap.get(cell.id);
            const liked = app.liked.has(art.id);
            return (
              <div
                key={cell.id}
                className="relative group overflow-hidden bg-[#F5F5F5] cursor-pointer flex-shrink-0"
                style={{ width: Math.round(cell.w), height: Math.round(cell.h) }}
                onClick={() => app.openArtwork(art)}
                data-goes-to="→ Halaman Karya"
              >
                <Pic
                  photoId={art.photoId}
                  w={Math.round(cell.w * 1.5)}
                  h={Math.round(cell.h * 1.5)}
                  title={art.title}
                  eager
                  className="w-full h-full"
                  imgClass="transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200">
                  {/* Top-right buttons */}
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      data-goes-to="Toggle suka"
                      className={"w-7 h-7 rounded-full flex items-center justify-center shadow transition-colors " + (liked ? "bg-[#E81E28] text-white" : "bg-white text-[#0A0A0B] hover:bg-gray-100 active:bg-gray-200")}
                      onClick={e => { e.stopPropagation(); app.toggleLike(art); }}
                    >
                      <Heart size={12} fill={liked ? "currentColor" : "none"} />
                    </button>
                    <button
                      data-goes-to="Popover koleksi"
                      className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-[#0A0A0B] shadow hover:bg-gray-100 active:bg-gray-200 transition-colors"
                      onClick={e => { e.stopPropagation(); app.openCollections(art, e.currentTarget.getBoundingClientRect()); }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="h-14 bg-gradient-to-t from-black/75 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 flex items-center justify-between gap-2">
                      <button
                        className="flex items-center gap-1.5 min-w-0"
                        data-goes-to="→ Profil artist"
                        onClick={e => { e.stopPropagation(); app.openProfile(art.artistId); }}
                      >
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white"
                          style={{ background: art.avatarBg }}
                        >
                          {art.initials[0]}
                        </div>
                        <span className="text-white text-[10px] font-medium truncate leading-none">{art.artist}</span>
                      </button>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          data-goes-to="→ Blok komisi artist"
                          onClick={e => { e.stopPropagation(); app.openCommission({ artistId: art.artistId }); }}
                          className="bg-[#E81E28] hover:bg-[#C41A22] text-white text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors"
                        >
                          Buka Komisi
                        </button>
                        <span className="flex items-center gap-0.5 text-white/80 text-[9px]"><Heart size={8} /> {fmtNum(art.likes + (liked ? 1 : 0))}</span>
                        <span className="flex items-center gap-0.5 text-white/80 text-[9px]"><Eye size={8} /> {fmtNum(art.views)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Mobile 2-col Grid ────────────────────────────────────────────────────────
function MobileGrid({ artworks, onArtworkClick }) {
  return (
    <div className="grid grid-cols-2 gap-0.5">
      {artworks.map(art => (
        <div key={art.id} className="relative aspect-square bg-[#F5F5F5] overflow-hidden cursor-pointer" onClick={() => onArtworkClick(art)}>
          <Pic photoId={art.photoId} w={400} h={400} title={art.title} className="w-full h-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Loading / empty / error blocks ───────────────────────────────────────────
const SK = "bg-[#F5F5F5]";

function SkeletonGrid({ rows = 3 }) {
  const pattern = [[1.5, 0.8, 1.3, 1.1], [1.2, 1.7, 0.9], [1.4, 1.0, 1.6, 0.7]];
  return (
    <div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex" style={{ gap: 4, marginBottom: 4 }}>
          {pattern[ri % 3].map((fr, ci) => (
            <div key={ci} className={SK} style={{ flexGrow: fr, flexBasis: 0, height: 240 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonRows({ n = 6 }) {
  return (
    <div>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-[#E5E5E7]">
          <div className={SK + " w-12 h-8 flex-shrink-0"} />
          <div className={SK + " w-16 h-10 flex-shrink-0 rounded"} />
          <div className="flex-1 space-y-2">
            <div className={SK + " h-3.5 w-1/3 rounded"} />
            <div className={SK + " h-3 w-1/5 rounded"} />
          </div>
          <div className={SK + " h-4 w-20 rounded"} />
        </div>
      ))}
    </div>
  );
}

function EmptyBlock({ title, hint, Icon = Palette }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-4">
        <Icon size={26} className="text-[#A1A1AA]" />
      </div>
      <p className="text-base font-bold text-[#0A0A0B] mb-1">{title}</p>
      <p className="text-sm text-[#A1A1AA] max-w-xs leading-relaxed">{hint}</p>
    </div>
  );
}

function ErrorBlock({ title, hint, onRetry }) {
  return (
    <div className="border border-[#E81E28] rounded-xl p-5 flex items-start gap-3">
      <AlertTriangle size={18} className="text-[#C41A22] flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#C41A22] mb-1">{title}</p>
        <p className="text-sm text-[#52525B] leading-relaxed mb-3">{hint}</p>
        <button
          onClick={onRetry}
          className="border border-[#E5E5E7] text-[#0A0A0B] text-xs font-semibold px-3 py-1.5 rounded-full hover:border-[#0A0A0B] transition-colors flex items-center gap-1.5"
        >
          <RefreshCw size={11} /> Coba lagi
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "discovery",  label: "Discovery",   Icon: Compass   },
  { id: "ranking",    label: "Ranking",     Icon: Trophy    },
  { id: "commission", label: "Commission",  Icon: Briefcase },
  { id: "contest",    label: "Kontes",      Icon: Award     },
];

const COLLECTION_NAV = [
  { id: "favorites",   label: "Favorit",    Icon: Heart    },
  { id: "collections", label: "Koleksi",    Icon: Bookmark },
];

function Sidebar() {
  const app = useApp();
  const screen = app.screen;
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-[#E5E5E7] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <button onClick={() => app.navigate("discovery")} data-goes-to="→ Discovery" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#E81E28] rounded-lg flex items-center justify-center flex-shrink-0">
            <Palette size={16} className="text-white" />
          </div>
          <span className="text-[18px] font-extrabold leading-none tracking-tight">
            <span className="text-[#0A0A0B]">ART</span><span className="text-[#E81E28]">VAULT</span>
          </span>
        </button>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar">
        <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest px-5 mb-1">Jelajahi</p>
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = screen === id;
          return (
            <div key={id} className="relative">
              {active && <div className="absolute left-0 inset-y-1.5 w-[3px] bg-[#E81E28] rounded-r" />}
              <button
                onClick={() => app.navigate(id)}
                data-goes-to={"→ " + label}
                className={"flex items-center gap-3 w-full pl-5 pr-4 py-2.5 text-sm font-semibold transition-colors " + (active ? "bg-[#FEF2F3] text-[#C41A22]" : "text-[#52525B] hover:bg-gray-50 hover:text-[#0A0A0B] active:bg-[#F5F5F5]")}
              >
                <Icon size={17} />
                {label}
              </button>
            </div>
          );
        })}

        <div className="mx-5 my-3 border-t border-[#E5E5E7]" />

        <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest px-5 mb-1">Koleksi Saya</p>
        {COLLECTION_NAV.map(({ id, label, Icon }) => {
          const active = screen === id || (id === "collections" && screen === "collection");
          return (
            <div key={id} className="relative">
              {active && <div className="absolute left-0 inset-y-1.5 w-[3px] bg-[#E81E28] rounded-r" />}
              <button
                onClick={() => app.requireAuth(() => app.navigate(id))}
                data-goes-to={id === "favorites" ? "→ Grid karya disukai" : "→ Grid folder koleksi"}
                className={"flex items-center gap-3 w-full pl-5 pr-4 py-2.5 text-sm font-semibold transition-colors " + (active ? "bg-[#FEF2F3] text-[#C41A22]" : "text-[#52525B] hover:bg-gray-50 hover:text-[#0A0A0B] active:bg-[#F5F5F5]")}
              >
                <Icon size={17} /> {label}
              </button>
            </div>
          );
        })}
        <button
          onClick={e => { const r = e.currentTarget.getBoundingClientRect(); app.requireAuth(() => app.openNotifs(r)); }}
          data-goes-to="Dropdown notifikasi"
          className="flex items-center gap-3 w-full pl-5 pr-4 py-2.5 text-sm font-semibold text-[#52525B] hover:bg-gray-50 hover:text-[#0A0A0B] active:bg-[#F5F5F5] transition-colors"
        >
          <Bell size={17} /> Notifikasi
          {app.loggedIn && <span className="ml-auto bg-[#E81E28] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{NOTIFS.length}</span>}
        </button>

        <div className="mx-5 my-3 border-t border-[#E5E5E7]" />

        <div className="relative">
          {screen === "about" && <div className="absolute left-0 inset-y-1.5 w-[3px] bg-[#E81E28] rounded-r" />}
          <button
            onClick={() => app.navigate("about")}
            data-goes-to="→ Halaman Tentang"
            className={"flex items-center gap-3 w-full pl-5 pr-4 py-2.5 text-sm font-semibold transition-colors " + (screen === "about" ? "bg-[#FEF2F3] text-[#C41A22]" : "text-[#52525B] hover:bg-gray-50 hover:text-[#0A0A0B] active:bg-[#F5F5F5]")}
          >
            <Info size={17} /> Tentang
          </button>
        </div>
        <div className="h-3" />
      </nav>

      {/* User row */}
      <div className="border-t border-[#E5E5E7] px-3 py-3 flex-shrink-0">
        {app.loggedIn ? (
          <button
            onClick={e => app.openAvatarMenu(e.currentTarget.getBoundingClientRect())}
            data-goes-to="Menu akun"
            className="flex items-center gap-2.5 w-full hover:bg-gray-50 active:bg-[#F5F5F5] rounded-xl px-2 py-2 transition-colors"
          >
            <Av bg="#E81E28" initials="AU" size={32} />
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-[#0A0A0B] truncate leading-tight">Artvault User</p>
              <p className="text-xs text-[#A1A1AA]">@artvault_user</p>
            </div>
          </button>
        ) : (
          <div className="flex flex-col gap-2 px-1 pt-0.5">
            <button
              onClick={() => app.navigate("login")}
              data-goes-to="→ Halaman Masuk"
              className="w-full bg-white border border-[#E5E5E7] hover:bg-[#F5F5F5] active:bg-[#EDEDEF] text-[#0A0A0B] text-sm font-bold py-2.5 rounded-full transition-colors"
            >
              Masuk
            </button>
            <button
              onClick={() => app.navigate("signup")}
              data-goes-to="→ Halaman Daftar"
              className="w-full bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold py-2.5 rounded-full transition-colors"
            >
              Daftar
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Top-right cluster ────────────────────────────────────────────────────────
const TAG_POOL = [...new Set(ARTWORKS.flatMap(a => a.tags))];

function TopCluster() {
  const app = useApp();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const box = useRef(null);

  const sug = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return null;
    return {
      tags: TAG_POOL.filter(t => t.includes(s)).slice(0, 4),
      artists: [...new Set(ARTWORKS.filter(a => a.artist.toLowerCase().includes(s)).map(a => a.artist))].slice(0, 3),
      works: ARTWORKS.filter(a => a.title.toLowerCase().includes(s)).slice(0, 3),
    };
  }, [q]);

  const go = (text) => { setQ(""); setFocus(false); app.openSearch(text); };
  const empty = sug && !sug.tags.length && !sug.artists.length && !sug.works.length;

  return (
    <div className="hidden md:flex items-center justify-end gap-2 px-6 pt-4 pb-3">
      <div className="relative" ref={box}>
        <div className={"flex items-center gap-2 bg-[#F4F4F5] rounded-full px-3.5 py-2 w-[300px] border transition-colors " + (focus ? "border-[#E81E28]" : "border-transparent")}>
          <Search size={13} className="text-[#A1A1AA] flex-shrink-0" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => setFocus(true)}
            onKeyDown={e => { if (e.key === "Enter" && q.trim()) go(q.trim()); if (e.key === "Escape") { setQ(""); setFocus(false); } }}
            data-goes-to="Saran langsung · Enter → Hasil Pencarian"
            className="bg-transparent text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none w-full"
            placeholder="Cari karya, tag, atau artist"
          />
          {q && (
            <button onClick={() => setQ("")} data-goes-to="Kosongkan" className="text-[#A1A1AA] hover:text-[#0A0A0B] transition-colors"><X size={12} /></button>
          )}
        </div>

        {focus && sug && (
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => setFocus(false)} />
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#E5E5E7] rounded-xl shadow-xl overflow-hidden z-[95]">
              {empty && <p className="px-4 py-4 text-sm text-[#A1A1AA]">Tidak ada saran untuk “{q}”</p>}
              {!!sug.tags.length && (
                <div className="py-2">
                  <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest px-4 mb-1">Tag</p>
                  {sug.tags.map(t => (
                    <button key={t} onClick={() => go("#" + t)} data-goes-to="→ Hasil Pencarian (tag)" className="flex items-center gap-2 w-full px-4 py-1.5 text-sm text-[#0A0A0B] hover:bg-gray-50 transition-colors">
                      <Tag size={12} className="text-[#A1A1AA]" /> #{t}
                    </button>
                  ))}
                </div>
              )}
              {!!sug.artists.length && (
                <div className="py-2 border-t border-[#E5E5E7]">
                  <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest px-4 mb-1">Artist</p>
                  {sug.artists.map(nm => {
                    const a = ARTWORKS.find(x => x.artist === nm);
                    return (
                      <button key={nm} onClick={() => { setQ(""); setFocus(false); app.openProfile(a.artistId); }} data-goes-to="→ Profil artist" className="flex items-center gap-2 w-full px-4 py-1.5 text-sm text-[#0A0A0B] hover:bg-gray-50 transition-colors">
                        <Av bg={a.avatarBg} initials={a.initials} size={20} /> {nm}
                      </button>
                    );
                  })}
                </div>
              )}
              {!!sug.works.length && (
                <div className="py-2 border-t border-[#E5E5E7]">
                  <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest px-4 mb-1">Karya</p>
                  {sug.works.map(a => (
                    <button key={a.id} onClick={() => { setQ(""); setFocus(false); app.openArtwork(a); }} data-goes-to="→ Halaman Karya" className="flex items-center gap-2 w-full px-4 py-1.5 text-sm text-[#0A0A0B] hover:bg-gray-50 transition-colors">
                      <Pic photoId={a.photoId} w={48} h={48} title={a.title} compact className="w-6 h-6 rounded flex-shrink-0" /> {a.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {app.loggedIn ? (
        <>
          <button
            onClick={() => app.navigate("upload")}
            data-goes-to="→ Alur Unggah"
            className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-semibold rounded-full px-4 py-2 flex items-center gap-1.5 transition-colors flex-shrink-0"
          >
            <Upload size={13} /> Unggah
          </button>
          <button
            onClick={e => app.openNotifs(e.currentTarget.getBoundingClientRect())}
            data-goes-to="Dropdown notifikasi"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#52525B] hover:bg-gray-50 active:bg-[#F5F5F5] transition-colors flex-shrink-0 relative"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E81E28] rounded-full" />
          </button>
          <button
            onClick={e => app.openAvatarMenu(e.currentTarget.getBoundingClientRect())}
            data-goes-to="Menu akun"
            className="flex-shrink-0"
          >
            <Av bg="#E81E28" initials="AU" size={32} />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => app.navigate("login")}
            data-goes-to="→ Halaman Masuk"
            className="bg-white border border-[#E5E5E7] hover:bg-[#F5F5F5] active:bg-[#EDEDEF] text-[#0A0A0B] text-sm font-bold rounded-full px-5 py-2 transition-colors flex-shrink-0"
          >
            Masuk
          </button>
          <button
            onClick={() => app.navigate("signup")}
            data-goes-to="→ Halaman Daftar"
            className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold rounded-full px-5 py-2 transition-colors flex-shrink-0"
          >
            Daftar
          </button>
        </>
      )}
    </div>
  );
}

// ─── Mobile Top Bar ───────────────────────────────────────────────────────────
function MobileTopBar() {
  const app = useApp();
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-12 bg-white border-b border-[#E5E5E7] flex items-center gap-2 px-3 z-40">
      <div className="flex items-center gap-2 flex-1 bg-[#F4F4F5] rounded-full px-3 py-1.5">
        <Search size={13} className="text-[#A1A1AA] flex-shrink-0" />
        <input
          onKeyDown={e => { if (e.key === "Enter" && e.currentTarget.value.trim()) app.openSearch(e.currentTarget.value.trim()); }}
          className="bg-transparent text-sm placeholder-[#A1A1AA] outline-none w-full"
          placeholder="Cari karya atau artist..."
        />
      </div>
      {app.loggedIn ? (
        <button
          onClick={() => app.navigate("upload")}
          className="bg-[#E81E28] text-white text-xs font-semibold rounded-full px-3 py-1.5 flex items-center gap-1 flex-shrink-0 hover:bg-[#C41A22]"
        >
          <Upload size={11} /> Unggah
        </button>
      ) : (
        <button
          onClick={() => app.navigate("login")}
          className="bg-[#E81E28] text-white text-xs font-semibold rounded-full px-3.5 py-1.5 flex-shrink-0 hover:bg-[#C41A22]"
        >
          Masuk
        </button>
      )}
    </div>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────
const MOBILE_NAV = [
  { id: "discovery",  label: "Discovery",  Icon: Compass   },
  { id: "ranking",    label: "Ranking",    Icon: Trophy    },
  { id: "commission", label: "Komisi",     Icon: Briefcase },
  { id: "contest",    label: "Kontes",     Icon: Award     },
  { id: "profile",    label: "Profil",     Icon: User      },
];

function MobileNav() {
  const app = useApp();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E5E7] flex items-center z-40">
      {MOBILE_NAV.map(({ id, label, Icon }) => {
        const active = app.screen === id;
        return (
          <button key={id} onClick={() => app.navigate(id)} className="flex-1 flex flex-col items-center gap-0.5 py-2">
            <Icon size={20} className={active ? "text-[#E81E28]" : "text-[#A1A1AA]"} />
            <span className={"text-[9px] font-semibold " + (active ? "text-[#E81E28]" : "text-[#A1A1AA]")}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: DISCOVERY
// ══════════════════════════════════════════════════════════════════════════════
function DiscoveryScreen() {
  const app = useApp();
  const viewState = app.viewState;
  const featured = ARTWORKS[8];
  const feed = useMemo(() => ARTWORKS.filter(a => a.id !== featured.id), [featured.id]);
  const [count, setCount] = useState(12);
  const exhausted = count >= feed.length;

  useEffect(() => {
    const onScroll = () => {
      if (exhausted) return;
      if (window.innerHeight + window.scrollY > document.body.offsetHeight - 600) setCount(c => Math.min(c + 6, feed.length));
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [exhausted, feed.length]);

  if (viewState === "loading") {
    return (
      <div className="px-6 pt-1 pb-10 space-y-7">
        <div className={SK} style={{ width: "100%", aspectRatio: "21/9" }} />
        <div className="flex gap-3">
          {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className={SK + " flex-shrink-0"} style={{ width: 176, height: 108 }} />)}
        </div>
        <SkeletonGrid rows={3} />
      </div>
    );
  }

  return (
    <div>
      <div className="px-6 pt-1 pb-10 space-y-7">
        {/* Featured artwork */}
        <div
          className="relative w-full overflow-hidden cursor-pointer group"
          style={{ aspectRatio: "21/9" }}
          onClick={() => app.openArtwork(featured)}
          data-goes-to="→ Halaman Karya"
        >
          <div className="absolute inset-0" style={fadeStyle}>
            <Pic
              photoId={featured.photoId}
              w={1400}
              h={600}
              title={featured.title}
              eager
              className="w-full h-full"
              imgClass="transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0" style={{ background: TOP_SCRIM }} />
          </div>
          <div className="absolute top-4 left-4">
            <span className="bg-[#E81E28] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Star size={10} fill="currentColor" /> Karya Pilihan
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h2 className="text-[#0A0A0B] font-extrabold leading-tight mb-3" style={{ fontSize: 32 }}>{featured.title}</h2>
            <div className="flex items-center justify-between">
              <button
                className="flex items-center gap-2"
                data-goes-to="→ Profil artist"
                onClick={e => { e.stopPropagation(); app.openProfile(featured.artistId); }}
              >
                <Av bg={featured.avatarBg} initials={featured.initials} size={28} ring />
                <span className="text-[#0A0A0B] text-sm font-semibold">{featured.artist}</span>
              </button>
              <button
                onClick={e => { e.stopPropagation(); app.openArtwork(featured); }}
                data-goes-to="→ Halaman Karya"
                className="bg-white border border-[#E5E5E7] hover:border-[#0A0A0B] active:bg-[#F5F5F5] text-[#0A0A0B] text-sm font-semibold px-4 py-1.5 rounded-full transition-colors flex-shrink-0 whitespace-nowrap"
              >
                Lihat Karya
              </button>
            </div>
          </div>
        </div>

        {/* Category rail */}
        <div>
          <h3 className="text-base font-bold text-[#0A0A0B] mb-3">Jelajahi Kategori</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES_DATA.map(cat => (
              <div
                key={cat.name}
                onClick={() => app.openCategory(cat.name)}
                data-goes-to="→ Grid kategori"
                className="relative flex-shrink-0 w-[176px] aspect-[5/3] rounded-lg overflow-hidden cursor-pointer group bg-[#F5F5F5]"
              >
                <Pic photoId={cat.photoId} w={352} h={216} title={cat.name} eager className="w-full h-full" imgClass="group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-bold">{cat.name}</p>
                  <p className="text-white/70 text-xs">{cat.count} karya</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Justified grid */}
        <div>
          <h3 className="text-base font-bold text-[#0A0A0B] mb-3">Karya Terbaru</h3>
          {viewState === "empty" ? (
            <EmptyBlock title="Karya tidak ditemukan" hint="Coba kata kunci lain, atau mulai dari salah satu kategori di atas." />
          ) : viewState === "error" ? (
            <ErrorBlock
              title="Gagal memuat karya"
              hint="Koneksi ke server terputus saat mengambil galeri. Karya tetap aman."
              onRetry={app.retry}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <JustifiedGrid artworks={feed.slice(0, count)} targetHeight={240} />
              </div>
              <div className="md:hidden">
                <MobileGrid artworks={feed.slice(0, count)} onArtworkClick={app.openArtwork} />
              </div>
              <p className="text-center text-sm text-[#A1A1AA] pt-6">
                {exhausted ? "Kamu sudah melihat semua karya" : "Memuat karya berikutnya…"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: RANKING
// ══════════════════════════════════════════════════════════════════════════════
const RANKED = [...ARTWORKS].sort((a, b) => lifetimeScore(b) - lifetimeScore(a));
const PODIUM = [0, 1, 2].map(i => ({ rank: i + 1, artwork: RANKED[i], pts: lifetimeScore(RANKED[i]) }));
const LIST_ROWS = RANKED.slice(3, 13).map((a, i) => ({ rank: i + 4, artwork: a, pts: lifetimeScore(a) }));
const PTS_TIP = "Skor = suka × 12 + komentar × 30 + dilihat × 0,6";

function RankingScreen() {
  const app = useApp();
  const viewState = app.viewState;
  const podiumOrder = [PODIUM[1], PODIUM[0], PODIUM[2]];

  return (
    <div className="px-6 pt-5 pb-10">
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <span className="bg-[#FEF2F3] text-[#C41A22] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Trophy size={12} /> Papan Peringkat
        </span>
        <h1 className="text-[28px] font-extrabold text-[#0A0A0B]">Peringkat Sepanjang Masa</h1>
      </div>
      <p className="text-sm text-[#52525B] mb-7">Skor kumulatif dari suka, dilihat dan komentar sejak karya diunggah.</p>

      {viewState === "loading" ? (
        <>
          <div className="flex items-end gap-3 mb-8">
            {[246, 290, 216].map((h, i) => <div key={i} className={SK + " flex-1"} style={{ height: h }} />)}
          </div>
          <SkeletonRows n={6} />
        </>
      ) : viewState === "empty" ? (
        <EmptyBlock Icon={Trophy} title="Belum ada data" hint="Peringkat sepanjang masa muncul setelah karya pertama mengumpulkan poin." />
      ) : viewState === "error" ? (
        <ErrorBlock title="Gagal memuat peringkat" hint="Skor sepanjang masa tidak dapat dihitung saat ini. Coba beberapa saat lagi." onRetry={app.retry} />
      ) : (
        <>
          {/* Podium */}
          <div className="flex items-end gap-3 mb-8">
            {podiumOrder.map(({ rank, artwork, pts }) => {
              const isGold = rank === 1;
              const h = isGold ? 290 : rank === 2 ? 246 : 216;
              const borderC = isGold ? "#B8860B" : rank === 2 ? "#71717A" : "#92400E";
              return (
                <div
                  key={rank}
                  className="relative flex-1 rounded-xl overflow-hidden cursor-pointer group"
                  style={{ height: h, border: "2px solid " + borderC }}
                  onClick={() => app.openArtwork(artwork)}
                  data-goes-to="→ Halaman Karya"
                >
                  <Pic photoId={artwork.photoId} w={400} h={h * 2} title={artwork.title} eager className="w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  {isGold && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2">
                      <Crown size={22} style={{ color: "#B8860B" }} fill="#B8860B" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="text-4xl font-extrabold italic" style={{ color: borderC, opacity: 0.9 }}>{rank}</span>
                  </div>
                  <div className="absolute top-3 right-3 text-right" onClick={e => e.stopPropagation()}>
                    <Tip text={PTS_TIP}>
                      <span className="flex flex-col items-end cursor-help">
                        <span className="bg-white/95 text-[#C41A22] text-xs font-bold px-2 py-1 rounded-full block">{fmtPts(pts)}</span>
                        <span className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">Total Poin</span>
                      </span>
                    </Tip>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-bold truncate mb-0.5">{artwork.title}</p>
                    <button
                      className="text-white/70 text-xs hover:text-white transition-colors block"
                      data-goes-to="→ Profil artist"
                      onClick={e => { e.stopPropagation(); app.openProfile(artwork.artistId); }}
                    >{artwork.artist}</button>
                    <p className="text-white/50 text-[11px] mt-0.5">sejak {SINCE[artwork.id]}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* List */}
          <div>
            {LIST_ROWS.map(({ rank, artwork, pts }) => (
              <div
                key={rank}
                className="flex items-center gap-4 py-3 border-b border-[#E5E5E7] cursor-pointer hover:bg-gray-50 -mx-6 px-6 transition-colors"
                onClick={() => app.openArtwork(artwork)}
                data-goes-to="→ Halaman Karya"
              >
                <span className="text-[36px] font-extrabold italic text-[#E5E5E7] w-12 text-right flex-shrink-0 leading-none">{rank}</span>
                <Pic photoId={artwork.photoId} w={96} h={96} title={artwork.title} className="w-11 h-11 rounded flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0A0A0B] truncate">{artwork.title}</p>
                  <button
                    className="text-xs text-[#52525B] hover:text-[#C41A22] transition-colors"
                    data-goes-to="→ Profil artist"
                    onClick={e => { e.stopPropagation(); app.openProfile(artwork.artistId); }}
                  >{artwork.artist}</button>
                </div>
                <div className="text-right flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <Tip text={PTS_TIP}>
                    <span className="cursor-help block">
                      <span className="text-sm font-bold text-[#C41A22] leading-tight block">{fmtPts(pts)} <span className="text-[10px] font-bold uppercase tracking-widest text-[#C41A22]/70">Poin</span></span>
                      <span className="text-xs text-[#A1A1AA]">sejak {SINCE[artwork.id]}</span>
                    </span>
                  </Tip>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); app.openArtwork(artwork); }}
                  data-goes-to="→ Halaman Karya"
                  className="flex-shrink-0 border border-[#E5E5E7] text-[#0A0A0B] text-xs font-semibold px-3 py-1 rounded-full hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors"
                >
                  Lihat
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: COMMISSION
// ══════════════════════════════════════════════════════════════════════════════
const REOPEN = { syandra: "1 September 2026", bagus: "15 September 2026" };

function TierPanel({ tier, selected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      data-goes-to="Pilih tier → form terkunci"
      className={"relative rounded-xl p-4 cursor-pointer transition-colors " +
        (selected ? "border-2 border-[#E81E28] bg-[#FEF2F3]" : tier.popular ? "border-2 border-[#E81E28] bg-white hover:bg-[#FEF2F3]/40" : "border border-[#E5E5E7] bg-white hover:border-[#0A0A0B]")}
    >
      {tier.popular && (
        <span className="absolute -top-2.5 left-4 bg-[#E81E28] text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
          Paling Populer
        </span>
      )}
      <div className="flex items-center justify-between mb-2 mt-1">
        <p className="text-sm font-bold text-[#0A0A0B]">{tier.name}</p>
        {selected && <Check size={14} className="text-[#E81E28]" />}
      </div>
      <span className="bg-[#FEF2F3] text-[#C41A22] text-xs font-bold px-2.5 py-1 rounded-full inline-block mb-3">{tier.price}</span>
      <div className="flex items-center gap-3 text-xs text-[#52525B] mb-3">
        <span className="flex items-center gap-1"><Clock size={11} className="text-[#A1A1AA]" /> {tier.days}</span>
        <span className="flex items-center gap-1"><RefreshCw size={11} className="text-[#A1A1AA]" /> {tier.revisions}× revisi</span>
      </div>
      <div className="space-y-1.5 py-3 border-t border-[#E5E5E7]">
        {tier.deliverables.map(d => (
          <p key={d.label} className={"flex items-start gap-2 text-xs " + (d.ok ? "text-[#52525B]" : "text-[#A1A1AA]")}>
            {d.ok
              ? <Check size={12} className="text-[#E81E28] mt-0.5 flex-shrink-0" />
              : <X size={12} className="text-[#A1A1AA] mt-0.5 flex-shrink-0" />}
            {d.label}
          </p>
        ))}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onSelect(); }}
        data-goes-to="Pilih Paket → form terkunci"
        className={"w-full text-xs font-bold py-2 rounded-full transition-colors " +
          (selected ? "bg-[#E81E28] hover:bg-[#C41A22] text-white" : "border border-[#E5E5E7] text-[#0A0A0B] hover:border-[#0A0A0B] active:bg-[#F5F5F5]")}
      >
        {selected ? "Paket Dipilih" : "Pilih Paket"}
      </button>
    </div>
  );
}

function CommissionForm({ artist, tier, onClear }) {
  const app = useApp();
  const [brief, setBrief] = useState("");
  return (
    <div className="mt-4 border border-[#E5E5E7] rounded-xl overflow-hidden">
      <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E5E5E7] flex items-center gap-2 flex-wrap">
        <Lock size={12} className="text-[#A1A1AA] flex-shrink-0" />
        <p className="text-xs font-bold text-[#0A0A0B]">{artist.name} · {tier.name}</p>
        <span className="bg-[#FEF2F3] text-[#C41A22] text-xs font-bold px-2 py-0.5 rounded-full">{tier.price}</span>
        <span className="text-xs text-[#52525B]">{tier.days} · {tier.revisions}× revisi</span>
        <button onClick={onClear} data-goes-to="Buka pilihan paket" className="ml-auto text-xs font-semibold text-[#52525B] hover:text-[#0A0A0B] transition-colors">Ubah paket</button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Deskripsi permintaan</p>
          <textarea
            rows={3}
            value={brief}
            onChange={e => setBrief(e.target.value)}
            placeholder="Ceritakan karakter, suasana, dan referensi yang kamu inginkan..."
            className="w-full border border-[#E5E5E7] rounded-xl p-3 text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none resize-none focus:border-[#A1A1AA] transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Referensi</p>
            <button
              onClick={() => toast("Pemilih berkas dibuka", { description: "PNG atau JPG, maksimal 10 MB" })}
              data-goes-to="Pemilih berkas"
              className="w-full border border-[#E5E5E7] rounded-full px-3 py-2 text-xs font-semibold text-[#52525B] hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors flex items-center gap-1.5"
            >
              <ImageIcon size={12} /> Lampirkan gambar
            </button>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Tenggat diinginkan</p>
            <input
              placeholder="cth. 20 September 2026"
              className="w-full border border-[#E5E5E7] rounded-full px-3 py-2 text-xs text-[#0A0A0B] placeholder-[#A1A1AA] outline-none focus:border-[#A1A1AA] transition-colors"
            />
          </div>
        </div>
        <Tip text={brief.trim() ? "Kirim permintaan ke " + artist.name : "Isi deskripsi permintaan lebih dulu"}>
          <button
            disabled={!brief.trim()}
            onClick={() => app.requireAuth(() => {
              toast.success("Permintaan komisi terkirim!", { description: artist.name + " · " + tier.name + " · " + tier.price });
              onClear();
            })}
            data-goes-to="Toast sukses + tutup form"
            className={"text-sm font-bold px-5 py-2.5 rounded-full transition-colors flex items-center gap-1.5 " +
              (brief.trim() ? "bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white" : "bg-[#F5F5F5] text-[#A1A1AA] border border-[#E5E5E7] cursor-not-allowed")}
          >
            <Send size={12} /> Kirim Permintaan
          </button>
        </Tip>
      </div>
    </div>
  );
}

function CommissionScreen() {
  const app = useApp();
  const viewState = app.viewState;
  const [searchTab, setSearchTab] = useState(0);
  const [openOnly, setOpenOnly] = useState(false);
  const [picked, setPicked] = useState({});
  const refs = useRef({});

  const target = app.params.artistId;
  useEffect(() => {
    if (!target) return;
    setSearchTab(0);
    setPicked(p => (p[target] === undefined ? { ...p, [target]: 1 } : p));
    const el = refs.current[target];
    if (el) window.scrollTo({ top: Math.max(0, el.offsetTop - 16), behavior: "smooth" });
  }, [target]);

  const artists = openOnly ? COMM_ARTISTS.filter(a => a.status === "open") : COMM_ARTISTS;

  const statusCls = (s) =>
    s === "open"     ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    s === "waitlist" ? "bg-amber-50 text-amber-700 border-amber-200" :
                       "bg-gray-100 text-[#52525B] border-gray-200";

  return (
    <div className="px-6 pt-5 pb-10">
      <h1 className="text-[28px] font-extrabold text-[#0A0A0B] mb-1">Pesan Karya Custom</h1>
      <p className="text-sm text-[#52525B] mb-5">Temukan artist dan pesan karya eksklusif untukmu</p>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex bg-[#F5F5F5] rounded-full p-1">
          {["Cari Artist", "Pesanan Saya"].map((t, i) => (
            <button
              key={t} onClick={() => setSearchTab(i)}
              data-goes-to={i === 0 ? "Tab daftar artist" : "Tab daftar pesanan"}
              className={"text-sm font-semibold px-4 py-1.5 rounded-full transition-colors " + (searchTab === i ? "bg-white text-[#0A0A0B] shadow-sm" : "text-[#52525B]")}
            >{t}</button>
          ))}
        </div>
        {searchTab === 0 && (
          <label className="flex items-center gap-2 cursor-pointer" onClick={() => setOpenOnly(!openOnly)} data-goes-to="Filter langsung">
            <div className={"w-5 h-5 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0 " + (openOnly ? "bg-[#E81E28] border-[#E81E28]" : "border-[#E5E5E7]")}>
              {openOnly && <Check size={11} className="text-white" />}
            </div>
            <span className="text-sm font-medium text-[#0A0A0B]">Hanya slot terbuka</span>
          </label>
        )}
      </div>

      {viewState === "loading" ? (
        <div className="space-y-10">
          {[0, 1].map(i => (
            <div key={i} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={SK + " w-14 h-14 rounded-full"} />
                <div className="flex-1 space-y-2">
                  <div className={SK + " h-4 w-40 rounded"} />
                  <div className={SK + " h-3 w-64 rounded"} />
                </div>
              </div>
              <div className={SK + " rounded-lg"} style={{ height: 160 }} />
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map(k => <div key={k} className={SK + " rounded-xl"} style={{ height: 250 }} />)}
              </div>
            </div>
          ))}
        </div>
      ) : viewState === "error" ? (
        <ErrorBlock title="Gagal memuat daftar artist" hint="Data komisi tidak dapat diambil. Pesanan yang sudah berjalan tidak terpengaruh." onRetry={app.retry} />
      ) : viewState === "empty" ? (
        <EmptyBlock Icon={Briefcase} title="Belum ada artist yang membuka komisi" hint="Matikan filter slot terbuka, atau simpan artist favoritmu untuk diberi tahu saat slot dibuka." />
      ) : searchTab === 1 ? (
        <div className="space-y-4">
          {ORDERS.map(o => (
            <div
              key={o.id}
              onClick={() => app.openOrder(o)}
              data-goes-to="→ Detail Pesanan"
              className="border border-[#E5E5E7] rounded-xl p-4 cursor-pointer hover:border-[#0A0A0B] transition-colors"
            >
              <div className="flex items-start gap-3">
                <Av bg={o.bg} initials={o.init} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-bold text-[#0A0A0B]">{o.artist}</p>
                    <span className="text-xs text-[#A1A1AA]">#{o.id}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-[#52525B]">{o.tier}</span>
                    <span className="bg-[#FEF2F3] text-[#C41A22] text-xs font-bold px-2 py-0.5 rounded-full">{o.price}</span>
                  </div>
                </div>
                {o.status === "accepted" ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 flex-shrink-0">
                    <Check size={11} /> {o.label}
                  </span>
                ) : (
                  <span className="bg-gray-100 text-[#52525B] border border-gray-200 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 flex-shrink-0">
                    <X size={11} /> {o.label}
                  </span>
                )}
              </div>
              <p className={"text-xs leading-relaxed mt-3 pt-3 border-t border-[#E5E5E7] " + (o.status === "accepted" ? "text-[#52525B]" : "text-[#A1A1AA]")}>
                {o.note}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {artists.map(artist => {
            const pick = picked[artist.id];
            const tier = pick === undefined ? null : artist.tiers[pick];
            return (
              <div key={artist.id} ref={el => { refs.current[artist.id] = el; }} className="border-b border-[#E5E5E7] pb-10">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <button onClick={() => app.openProfile(artist.id)} data-goes-to="→ Profil artist">
                    <Av bg={artist.avatarBg} initials={artist.initials} size={56} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <button
                        className="text-base font-bold text-[#0A0A0B] hover:text-[#C41A22] transition-colors"
                        data-goes-to="→ Profil artist"
                        onClick={() => app.openProfile(artist.id)}
                      >{artist.name}</button>
                      <span className={"text-xs font-semibold px-2.5 py-0.5 rounded-full border " + statusCls(artist.status)}>
                        {artist.statusLabel}
                      </span>
                    </div>
                    <p className="text-sm text-[#52525B] mb-1">{artist.specialty}</p>
                    <div className="flex items-center gap-3 text-xs text-[#52525B]">
                      <span className="flex items-center gap-1"><Star size={11} className="text-[#D97706]" fill="#D97706" /> {artist.rating} ({artist.reviews} ulasan)</span>
                      {artist.slots > 0 && <span className="text-emerald-600 font-medium">{artist.slots} slot tersedia</span>}
                    </div>
                  </div>
                  {artist.status === "open" ? (
                    <button
                      onClick={() => app.requireAuth(() => setPicked(p => ({ ...p, [artist.id]: p[artist.id] === undefined ? 1 : p[artist.id] })))}
                      data-goes-to="Buka form komisi (artist terisi)"
                      className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors flex-shrink-0"
                    >
                      Ambil Slot
                    </button>
                  ) : (
                    <Tip text={"Slot dibuka lagi " + (REOPEN[artist.id] || "bulan depan")} className="flex-shrink-0">
                      <button
                        disabled
                        data-goes-to="Nonaktif · tooltip tanggal buka"
                        className="bg-[#F5F5F5] text-[#A1A1AA] border border-[#E5E5E7] text-sm font-semibold px-4 py-2 rounded-full cursor-not-allowed"
                      >
                        Slot penuh, buka lagi bulan depan
                      </button>
                    </Tip>
                  )}
                </div>

                {/* Portfolio row */}
                <div className="grid grid-cols-4 gap-1 mb-4">
                  {artist.portfolio.map(art => (
                    <div
                      key={art.id}
                      className="aspect-[4/3] overflow-hidden rounded-lg cursor-pointer bg-[#F5F5F5]"
                      onClick={() => app.openArtwork(art)}
                      data-goes-to="→ Halaman Karya"
                    >
                      <Pic photoId={art.photoId} w={240} h={180} title={art.title} className="w-full h-full" imgClass="hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>

                {/* Tiered packages */}
                <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2.5">Paket Harga</p>
                <div className="grid grid-cols-3 gap-3">
                  {artist.tiers.map((t, i) => (
                    <TierPanel
                      key={t.name}
                      tier={t}
                      selected={pick === i}
                      onSelect={() => setPicked(p => ({ ...p, [artist.id]: p[artist.id] === i ? undefined : i }))}
                    />
                  ))}
                </div>

                {tier && <CommissionForm artist={artist} tier={tier} onClear={() => setPicked(p => ({ ...p, [artist.id]: undefined }))} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Order detail ─────────────────────────────────────────────────────────────
const ORDER_STEPS = ["Menunggu", "Diproses", "Selesai"];

function OrderScreen() {
  const app = useApp();
  const o = app.params.order || ORDERS[0];
  const stage = o.status === "accepted" ? 1 : 0;

  return (
    <div className="px-6 pt-4 pb-10">
      <button onClick={app.back} data-goes-to="← Kembali (posisi scroll pulih)" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors mb-4">
        <ArrowLeft size={14} /> Kembali
      </button>

      <div className="flex items-center gap-3 flex-wrap mb-1">
        <h1 className="text-[28px] font-extrabold text-[#0A0A0B]">Pesanan #{o.id}</h1>
        <span className={"text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 " +
          (o.status === "accepted" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-[#52525B] border-gray-200")}>
          {o.status === "accepted" ? <Check size={11} /> : <X size={11} />} {o.label}
        </span>
      </div>
      <p className="text-sm text-[#52525B] mb-7">{o.tier} · {o.price}</p>

      {/* Timeline */}
      <div className="flex items-center gap-0 mb-8 max-w-xl">
        {ORDER_STEPS.map((st, i) => (
          <React.Fragment key={st}>
            <div className="flex flex-col items-center gap-1.5">
              <span className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold " +
                (i <= stage ? "bg-[#E81E28] text-white" : "bg-[#F5F5F5] text-[#A1A1AA]")}>
                {i < stage ? <Check size={12} /> : i + 1}
              </span>
              <span className={"text-xs font-semibold " + (i <= stage ? "text-[#0A0A0B]" : "text-[#A1A1AA]")}>{st}</span>
            </div>
            {i < ORDER_STEPS.length - 1 && <span className={"flex-1 h-0.5 mx-2 mb-5 " + (i < stage ? "bg-[#E81E28]" : "bg-[#E5E5E7]")} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-4">
          <div className="border border-[#E5E5E7] rounded-xl p-4">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2">Brief</p>
            <p className="text-sm text-[#52525B] leading-relaxed">
              Ilustrasi karakter original bertema dark fantasy, latar hutan berkabut dengan pencahayaan bulan. Palet dingin, fokus pada ekspresi wajah. Untuk dipakai sebagai cover album digital.
            </p>
          </div>
          <div className="border border-[#E5E5E7] rounded-xl p-4">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2">Catatan artist</p>
            <p className="text-sm text-[#52525B] leading-relaxed">{o.note}</p>
          </div>
        </div>
        <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E5E7]">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-0.5">Tenggat</p>
            <p className="text-sm font-bold text-[#0A0A0B]">14 September 2026</p>
          </div>
          <button
            onClick={() => app.openProfile(o.init === "RA" ? "rio" : "bagus")}
            data-goes-to="→ Profil artist"
            className="flex items-center gap-2.5 w-full px-4 py-3 hover:bg-gray-50 active:bg-[#F5F5F5] transition-colors border-b border-[#E5E5E7]"
          >
            <Av bg={o.bg} initials={o.init} size={32} />
            <span className="text-sm font-semibold text-[#0A0A0B]">{o.artist}</span>
            <ChevronRight size={14} className="text-[#A1A1AA] ml-auto" />
          </button>
          <div className="p-4">
            <button
              onClick={() => app.confirm({
                title: "Batalkan pesanan?",
                body: "Pesanan #" + o.id + " akan dibatalkan dan dana escrow dikembalikan dalam 3 hari kerja.",
                label: "Batalkan Pesanan",
                onOk: () => toast.success("Pesanan dibatalkan", { description: "Dana escrow dikembalikan ke metode pembayaranmu" }),
              })}
              data-goes-to="Dialog konfirmasi"
              className="w-full border border-[#E5E5E7] text-[#C41A22] text-sm font-bold py-2.5 rounded-full hover:border-[#E81E28] active:bg-[#FEF2F3] transition-colors"
            >
              Batalkan Pesanan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: CONTEST
// ══════════════════════════════════════════════════════════════════════════════
const CONTEST_END = new Date("2026-08-31T23:59:59+07:00");

function Countdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const ms = Math.max(0, CONTEST_END.getTime() - now);
  const d = Math.floor(ms / 86400000);
  const h = String(Math.floor(ms / 3600000) % 24).padStart(2, "0");
  const m = String(Math.floor(ms / 60000) % 60).padStart(2, "0");
  const sec = String(Math.floor(ms / 1000) % 60).padStart(2, "0");
  return (
    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
      <Clock size={11} /> {d} hari {h}:{m}:{sec}
    </span>
  );
}

function ContestScreen() {
  const app = useApp();
  const viewState = app.viewState;
  const [ended, setEnded] = useState(false);
  const submissions = ARTWORKS.slice(0, 6);
  const winner = ARTWORKS[3];

  return (
    <div>
      {/* Phase switch */}
      <div className="px-6 pt-1 pb-3 flex items-center gap-2">
        {[[false, "Kontes Aktif"], [true, "Kontes Berakhir"]].map(([v, label]) => (
          <button
            key={label}
            onClick={() => setEnded(v)}
            data-goes-to={v ? "Status: berakhir" : "Status: aktif"}
            className={"text-xs font-semibold rounded-full px-3.5 py-1.5 transition-colors whitespace-nowrap " + (ended === v ? "bg-[#E81E28] text-white" : "bg-white border border-[#E5E5E7] text-[#52525B] hover:border-[#0A0A0B]")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Banner */}
      <div className="relative h-[360px] overflow-hidden">
        <div className="absolute inset-0" style={fadeStyle}>
          <Pic
            photoId="1537996194471-e657df975ab4"
            w={1200}
            h={720}
            title="Gelombang Nusantara 2026"
            eager
            className="w-full h-full"
            imgClass={ended ? "grayscale" : ""}
          />
          <div className="absolute inset-0" style={{ background: TOP_SCRIM }} />
        </div>
        <div className="absolute top-6 left-6 flex items-center gap-2 flex-wrap">
          {ended ? (
            <span className="bg-white/85 text-[#52525B] text-xs font-bold px-3 py-1.5 rounded-full">KONTES BERAKHIR</span>
          ) : (
            <>
              <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">KONTES AKTIF</span>
              <Countdown />
            </>
          )}
        </div>
        <div className="absolute inset-x-6 top-[96px] text-center">
          <h1 className="text-white font-extrabold leading-tight" style={{ fontSize: 30 }}>Gelombang Nusantara 2026</h1>
          <p className="text-white/80 text-sm mt-2">Ekspresikan keindahan budaya Indonesia melalui seni digital</p>
        </div>
        <div className="absolute bottom-6 left-6 flex items-center gap-2.5">
          <Av bg="#E81E28" initials="AV" size={36} ring />
          <div>
            <p className="text-[#52525B] text-xs">Diselenggarakan oleh</p>
            <button
              onClick={() => app.openProfile("artvault")}
              data-goes-to="→ Profil penyelenggara"
              className="text-[#0A0A0B] text-sm font-bold hover:text-[#C41A22] transition-colors"
            >
              ARTVAULT × Telkom Indonesia
            </button>
          </div>
        </div>
      </div>

      {/* Body: 2:1 split */}
      <div className="px-6 pt-6 pb-10 flex gap-6 items-start">
        {/* Left */}
        <div className="flex-[2] min-w-0 space-y-6">
          {ended && (
            <div className="bg-[#F5F5F5] border border-[#E5E5E7] rounded-xl px-4 py-3 flex items-center gap-2.5">
              <Lock size={14} className="text-[#A1A1AA] flex-shrink-0" />
              <p className="text-sm font-semibold text-[#52525B]">Kontes telah berakhir · pengiriman karya ditutup 31 Agustus 2026</p>
            </div>
          )}

          <div>
            <h3 className="text-base font-bold text-[#0A0A0B] mb-2">Tentang Kontes</h3>
            <p className="text-sm text-[#52525B] leading-relaxed">
              Kontes seni digital terbesar ARTVAULT 2026 mengundang semua artist dari seluruh Indonesia untuk mengekspresikan keindahan budaya Nusantara. Karya dapat berupa ilustrasi digital, lukisan, atau fotografi bertema warisan budaya Indonesia.
            </p>
          </div>

          {ended && (
            <div>
              <h4 className="text-sm font-bold text-[#0A0A0B] mb-3 flex items-center gap-2">
                <Crown size={14} style={{ color: "#B8860B" }} fill="#B8860B" /> Juara 1
              </h4>
              <div
                className="relative rounded-xl overflow-hidden cursor-pointer"
                style={{ border: "2px solid #B8860B", height: 220 }}
                onClick={() => app.openArtwork(winner)}
                data-goes-to="→ Halaman Karya pemenang"
              >
                <Pic photoId={winner.photoId} w={800} h={440} title={winner.title} className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "#F5D57A" }}>Pemenang</p>
                  <p className="text-white text-base font-bold">{winner.title}</p>
                  <p className="text-white/70 text-xs">{winner.artist} · Rp 15.000.000</p>
                </div>
              </div>
            </div>
          )}

          <div className="border border-[#E5E5E7] rounded-xl p-4">
            <h4 className="text-sm font-bold text-[#0A0A0B] mb-3 flex items-center gap-2">
              <BookOpen size={14} className="text-[#C41A22]" /> Aturan Kontes
            </h4>
            <ul className="space-y-2">
              {[
                "Karya harus original dan belum pernah dipublikasi",
                "Tema: Warisan Budaya Indonesia",
                "Format: PNG/JPG min. 2000×2000px",
                "Maksimal 3 karya per peserta",
                "Tidak menggunakan AI image generator",
              ].map(rule => (
                <li key={rule} className="flex items-start gap-2 text-sm text-[#52525B]">
                  <CheckCircle size={13} className="text-[#E81E28] mt-0.5 flex-shrink-0" /> {rule}
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-[#E5E5E7] rounded-xl p-4">
            <h4 className="text-sm font-bold text-[#0A0A0B] mb-3 flex items-center gap-2">
              <Star size={14} className="text-[#C41A22]" /> Kriteria Penilaian
            </h4>
            {[["Kreativitas & Konsep", "40%"], ["Teknis & Eksekusi", "30%"], ["Relevansi Tema", "20%"], ["Presentasi", "10%"]].map(([c, p]) => (
              <div key={c} className="flex items-center justify-between py-2 border-b border-[#E5E5E7] last:border-0">
                <span className="text-sm text-[#52525B]">{c}</span>
                <span className="text-sm font-bold text-[#C41A22]">{p}</span>
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#0A0A0B] mb-3">
              {ended ? "Kiriman Terkunci (1.247 karya)" : "Kiriman Terbaru (" + submissions.length + " dari 1.247)"}
            </h4>
            {viewState === "loading" ? (
              <div className="flex gap-1" style={{ height: 200 }}>
                {submissions.map(a => <div key={a.id} className={SK + " flex-1"} />)}
              </div>
            ) : (
              <div className="flex gap-1 rounded-lg overflow-hidden" style={{ height: 200 }}>
                {submissions.map(art => (
                  <div
                    key={art.id}
                    className={"relative flex-1 min-w-0 overflow-hidden bg-[#F5F5F5] " + (ended ? "cursor-default" : "cursor-pointer")}
                    onClick={() => { if (!ended) app.openArtwork(art); }}
                    data-goes-to={ended ? "Terkunci" : "→ Halaman Karya"}
                  >
                    <Pic
                      photoId={art.photoId}
                      w={200}
                      h={200}
                      title={art.title}
                      className="w-full h-full"
                      imgClass={"transition-transform duration-300 " + (ended ? "grayscale" : "hover:scale-105")}
                    />
                    {ended && (
                      <div className="absolute inset-0 bg-white/45 flex items-center justify-center">
                        <Lock size={16} className="text-[#52525B]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sticky */}
        <div className="w-60 flex-shrink-0">
          <div className="sticky top-5 border border-[#E5E5E7] rounded-xl overflow-hidden">
            <div className="bg-[#FEF2F3] px-4 py-3 border-b border-[#E5E5E7]">
              <p className="text-xs font-bold text-[#C41A22] mb-0.5 uppercase tracking-wide">Total Hadiah</p>
              <p className="text-2xl font-extrabold text-[#0A0A0B]">Rp 30.000.000</p>
            </div>
            <div className="p-4 space-y-0">
              {[
                { rank: "🥇 Juara 1", prize: "Rp 15.000.000", color: "#B8860B" },
                { rank: "🥈 Juara 2", prize: "Rp 10.000.000", color: "#71717A" },
                { rank: "🥉 Juara 3", prize: "Rp 5.000.000",  color: "#92400E" },
                { rank: "Honorable (5×)", prize: "Rp 500.000",  color: "#C41A22" },
              ].map(({ rank, prize, color }) => (
                <div key={rank} className="flex items-center justify-between py-2 border-b border-[#E5E5E7] last:border-0">
                  <span className="text-xs font-medium text-[#52525B]">{rank}</span>
                  <span className="text-xs font-bold" style={{ color }}>{prize}</span>
                </div>
              ))}
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={() => app.openParticipants()}
                data-goes-to="Modal daftar peserta"
                className="flex items-center gap-1.5 mb-3 hover:opacity-80 transition-opacity"
              >
                <div className="flex -space-x-1.5">
                  {ARTWORKS.slice(0, 5).map(a => (
                    <div key={a.id} className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0" style={{ background: a.avatarBg }}>
                      {a.initials[0]}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-[#52525B]">+1.247 peserta</span>
              </button>
              {ended ? (
                <button
                  onClick={() => app.openArtwork(winner)}
                  data-goes-to="→ Halaman Karya pemenang"
                  className="w-full bg-[#0A0A0B] hover:bg-[#52525B] text-white text-sm font-bold py-2.5 rounded-full transition-colors"
                >
                  Lihat Pemenang
                </button>
              ) : (
                <button
                  onClick={() => app.requireAuth(() => app.openSubmit())}
                  data-goes-to="Modal kirim karya"
                  className="w-full bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold py-2.5 rounded-full transition-colors"
                >
                  Kirim Karya
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: ARTWORK PAGE
// ══════════════════════════════════════════════════════════════════════════════
const MOCK_COMMENTS = [
  { user: "stellarInk",  bg: "#8B5CF6", init: "SI", text: "Wah keren banget! Teknik shadowingnya luar biasa. Pakai brush apa ini?",   ago: "2 jam lalu",  likes: 14 },
  { user: "aquaArini",   bg: "#F59E0B", init: "AA", text: "Inspirasinya dari mana? Pengen belajar teknik kayak gini ke depannya.",       ago: "5 jam lalu",  likes: 8  },
  { user: "geoSpace",    bg: "#0891B2", init: "GS", text: "Favorit! Udah disimpan buat referensi. Semangat terus karyanya!",             ago: "1 hari lalu", likes: 21 },
];

function ArtworkScreen({ artwork }) {
  const app = useApp();
  const liked = app.liked.has(artwork.id);
  const saved = app.saved.has(artwork.id);
  const following = app.followed.has(artwork.artistId);
  const [comment, setComment] = useState("");
  const [failed, setFailed] = useState(false);
  const [cLikes, setCLikes] = useState({});
  const [reply, setReply] = useState(null);
  const composer = useRef(null);

  const related = ARTWORKS.filter(a => a.id !== artwork.id).slice(0, 9);

  const send = () => {
    if (!comment.trim()) return;
    if (app.viewState === "error") { setFailed(true); return; }
    setFailed(false); setComment(""); setReply(null);
    toast.success("Komentar terkirim", { description: "Komentarmu tampil di bawah karya ini" });
  };

  const focusComposer = () => {
    const el = composer.current;
    if (!el) return;
    window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 120), behavior: "smooth" });
    setTimeout(() => el.focus(), 350);
  };

  const startReply = (user) => {
    setReply(user);
    setComment("@" + user + " ");
    focusComposer();
  };

  return (
    <div>
      <div className="px-6 pt-4 pb-2">
        <button onClick={app.back} data-goes-to="← Kembali (posisi scroll pulih)" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors">
          <ArrowLeft size={14} /> Kembali
        </button>
      </div>

      {/* Image stage */}
      <div className="bg-[#F5F5F5] flex items-center justify-center px-6 py-10">
        <Pic
          photoId={artwork.photoId}
          w={960}
          h={Math.round(960 / artwork.aspect)}
          title={artwork.title}
          eager
          onClick={() => app.openLightbox(artwork)}
          dataGoesTo="Lightbox layar penuh"
          className="rounded-lg shadow-md cursor-zoom-in max-w-full"
          style={{ aspectRatio: String(artwork.aspect), height: "min(72vh, 620px)" }}
        />
      </div>

      {/* Floating toolbar */}
      <div className="flex justify-center -mt-5 sticky top-4 z-20 mb-5">
        <div className="bg-white shadow-lg rounded-full px-2 py-1.5 flex items-center gap-0 border border-[#E5E5E7]">
          <button
            onClick={() => app.requireAuth(() => app.toggleLike(artwork))}
            data-goes-to="Toggle suka"
            className={"flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors " + (liked ? "text-[#E81E28]" : "text-[#52525B] hover:text-[#0A0A0B]")}
          >
            <Heart size={14} fill={liked ? "currentColor" : "none"} />
            {fmtNum(artwork.likes + (liked ? 1 : 0))}
          </button>
          <button
            onClick={e => app.openShare(artwork, e.currentTarget.getBoundingClientRect())}
            data-goes-to="Popover bagikan"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold text-[#52525B] hover:text-emerald-600 transition-colors"
          >
            <Share2 size={14} /> Bagikan
          </button>
          <button
            onClick={focusComposer}
            data-goes-to="Gulir + fokus ke kolom komentar"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold text-[#52525B] hover:text-[#0A0A0B] transition-colors"
          >
            <MessageCircle size={14} /> {fmtNum(artwork.comments)}
          </button>
          <button
            onClick={e => app.requireAuth(() => app.openCollections(artwork, e.currentTarget.getBoundingClientRect()))}
            data-goes-to="Popover koleksi"
            className={"flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors " + (saved ? "text-[#E81E28]" : "text-[#52525B] hover:text-[#0A0A0B]")}
          >
            <Bookmark size={14} fill={saved ? "currentColor" : "none"} /> Simpan
          </button>
          <button
            onClick={e => app.openMore(artwork, e.currentTarget.getBoundingClientRect())}
            data-goes-to="Menu: Laporkan / Unduh / Sematkan"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#52525B] hover:text-[#0A0A0B] hover:bg-gray-50 transition-colors"
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* 2:1 split */}
      <div className="px-6 flex gap-6">
        {/* Left */}
        <div className="flex-[2] min-w-0 space-y-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A0A0B] mb-2">{artwork.title}</h1>
            <div className="flex items-center gap-4 text-xs text-[#A1A1AA]">
              <span className="flex items-center gap-1"><Eye size={11} /> {fmtNum(artwork.views)} dilihat</span>
              <span className="flex items-center gap-1"><Heart size={11} /> {fmtNum(artwork.likes + (liked ? 1 : 0))} suka</span>
              <span className="flex items-center gap-1"><MessageCircle size={11} /> {fmtNum(artwork.comments)} komentar</span>
            </div>
          </div>
          <p className="text-sm text-[#52525B] leading-relaxed">{artwork.description}</p>
          <div className="flex flex-wrap gap-2">
            {artwork.tags.map(tag => (
              <button
                key={tag}
                onClick={() => app.openSearch("#" + tag)}
                data-goes-to="→ Hasil Pencarian (tag)"
                className="bg-[#FEF2F3] text-[#C41A22] text-xs font-semibold px-3 py-1 rounded-full cursor-pointer hover:bg-[#E81E28] hover:text-white transition-colors"
              >#{tag}</button>
            ))}
            <button
              onClick={() => app.openCategory(artwork.category)}
              data-goes-to="→ Grid kategori"
              className="bg-[#FEF2F3] text-[#C41A22] text-xs font-semibold px-3 py-1 rounded-full hover:bg-[#E81E28] hover:text-white transition-colors"
            >#{artwork.category.toLowerCase().replace(/\s+/g, "")}</button>
          </div>
        </div>

        {/* Right sticky */}
        <div className="w-60 flex-shrink-0">
          <div className="sticky top-5 space-y-4">
            {/* Artist panel */}
            <div className="border border-[#E5E5E7] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => app.openProfile(artwork.artistId)} data-goes-to="→ Profil artist">
                  <Av bg={artwork.avatarBg} initials={artwork.initials} size={44} ring />
                </button>
                <div className="min-w-0">
                  <button
                    className="text-sm font-bold text-[#0A0A0B] hover:text-[#C41A22] transition-colors block truncate"
                    data-goes-to="→ Profil artist"
                    onClick={() => app.openProfile(artwork.artistId)}
                  >
                    {artwork.artist}
                  </button>
                  <p className="text-xs text-[#A1A1AA]">1.2k pengikut</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => app.requireAuth(() => app.toggleFollow(artwork.artistId))}
                  data-goes-to="Toggle ikuti"
                  className={"flex-1 text-xs font-bold py-2 rounded-full transition-colors flex items-center justify-center gap-1 " +
                    (following ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white")}
                >
                  {following ? <><Check size={11} /> Mengikuti</> : "Ikuti"}
                </button>
                <button
                  onClick={() => app.openCommission({ artistId: artwork.artistId })}
                  data-goes-to="→ Form komisi artist"
                  className="flex-1 border border-[#E5E5E7] text-[#0A0A0B] text-xs font-semibold py-2 rounded-full hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors"
                >Pesan Komisi</button>
              </div>
            </div>
            {/* 3×3 grid */}
            <div>
              <p className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2">Karya Lainnya</p>
              <div className="grid grid-cols-3 gap-0.5 rounded-lg overflow-hidden">
                {related.map(a => (
                  <div
                    key={a.id}
                    className="aspect-square bg-[#F5F5F5] overflow-hidden cursor-pointer"
                    onClick={() => app.openArtwork(a)}
                    data-goes-to="→ Halaman Karya"
                  >
                    <Pic photoId={a.photoId} w={160} h={160} title={a.title} className="w-full h-full" imgClass="hover:scale-110 transition-transform duration-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="px-6 mt-8 pb-10 border-t border-[#E5E5E7] pt-6">
        <h3 className="text-base font-bold text-[#0A0A0B] mb-5">Komentar ({artwork.comments})</h3>
        {/* Composer */}
        <div className="flex gap-3 mb-6">
          <Av bg="#E81E28" initials="AU" size={36} />
          <div className="flex-1">
            {reply && (
              <p className="text-xs text-[#52525B] mb-1.5 flex items-center gap-1.5">
                <Reply size={11} className="text-[#A1A1AA]" /> Membalas <span className="font-bold">@{reply}</span>
                <button onClick={() => { setReply(null); setComment(""); }} data-goes-to="Batalkan balasan" className="text-[#A1A1AA] hover:text-[#0A0A0B] transition-colors"><X size={11} /></button>
              </p>
            )}
            <div className={"border rounded-xl overflow-hidden transition-colors " + (failed ? "border-[#E81E28]" : "border-[#E5E5E7] focus-within:border-[#A1A1AA]")}>
              <textarea
                ref={composer}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Tulis komentarmu..."
                className="w-full p-3 text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none resize-none bg-white"
                rows={3}
              />
              <div className="px-3 pb-2.5 flex justify-end">
                <button
                  onClick={() => app.requireAuth(send)}
                  data-goes-to="Kirim komentar"
                  className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                >
                  <Send size={11} /> Kirim
                </button>
              </div>
            </div>
            {failed && (
              <div className="flex items-start gap-2 mt-2">
                <AlertTriangle size={13} className="text-[#C41A22] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#C41A22] leading-relaxed">
                  Komentar gagal dikirim. Teksmu tetap tersimpan di kolom di atas.{" "}
                  <button onClick={send} data-goes-to="Kirim ulang" className="font-bold underline hover:no-underline">Kirim ulang</button>
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Mock comments */}
        {MOCK_COMMENTS.map(c => {
          const bump = cLikes[c.user] || 0;
          return (
            <div key={c.user} className="flex gap-3 py-4 border-b border-[#E5E5E7] last:border-0">
              <button onClick={() => app.openProfile(c.user)} data-goes-to="→ Profil artist"><Av bg={c.bg} initials={c.init} size={36} /></button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <button onClick={() => app.openProfile(c.user)} data-goes-to="→ Profil artist" className="text-sm font-semibold text-[#0A0A0B] hover:text-[#C41A22] transition-colors">{c.user}</button>
                  <span className="text-xs text-[#A1A1AA]">{c.ago}</span>
                </div>
                <p className="text-sm text-[#52525B] leading-relaxed">{c.text}</p>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => app.requireAuth(() => setCLikes(s => ({ ...s, [c.user]: (s[c.user] || 0) + 1 })))}
                    data-goes-to="Tambah suka komentar"
                    className={"text-xs flex items-center gap-1 transition-colors " + (bump ? "text-[#C41A22] font-bold" : "text-[#A1A1AA] hover:text-[#C41A22]")}
                  >
                    <Heart size={10} fill={bump ? "currentColor" : "none"} /> {c.likes + bump}
                  </button>
                  <button
                    onClick={() => app.requireAuth(() => startReply(c.user))}
                    data-goes-to="Composer balasan @username"
                    className="text-xs text-[#A1A1AA] hover:text-[#0A0A0B] transition-colors"
                  >Balas</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: PROFILE
// ══════════════════════════════════════════════════════════════════════════════
const PROFILE = {
  name: "rioArtStudio", avatarBg: "#6366F1", initials: "RA",
  followers: 12450, following: 234, works: 89,
  bio: "Digital artist berbasis di Jakarta. Spesialisasi dalam dark fantasy dan ilustrasi konsep lingkungan. Tersedia untuk komisi komersial dan personal.",
  location: "Jakarta, Indonesia", website: "rioart.studio",
  bannerPhotoId: "1519501025264-65ba15a82390",
  tools: ["Procreate", "Adobe Photoshop", "Blender", "Cinema 4D"],
};

function ProfileScreen() {
  const app = useApp();
  const [tab, setTab] = useState(0);
  const following = app.followed.has("rio");

  return (
    <div>
      <div className="px-6 pt-4">
        <button onClick={app.back} data-goes-to="← Kembali (posisi scroll pulih)" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors">
          <ArrowLeft size={14} /> Kembali
        </button>
      </div>

      {/* Banner */}
      <div className="relative h-[300px] mt-2 overflow-hidden" style={fadeStyle}>
        <Pic photoId={PROFILE.bannerPhotoId} w={1200} h={600} title={PROFILE.name} eager className="w-full h-full" />
        <div className="absolute inset-0" style={{ background: TOP_SCRIM }} />
      </div>

      {/* Profile info */}
      <div className="px-6 -mt-16 relative">
        <div className="flex items-end gap-4 mb-4 flex-wrap">
          <div
            className="w-[120px] h-[120px] rounded-full flex items-center justify-center font-extrabold text-white ring-4 ring-white flex-shrink-0 shadow-lg"
            style={{ background: PROFILE.avatarBg, fontSize: 36 }}
          >
            {PROFILE.initials}
          </div>
          <div className="pb-1">
            <h1 className="text-[28px] font-extrabold text-[#0A0A0B] leading-tight">{PROFILE.name}</h1>
            <div className="flex items-center gap-5 text-sm text-[#52525B] mt-1">
              <span><strong className="text-[#0A0A0B]">{fmtNum(PROFILE.followers + (following ? 1 : 0))}</strong> Pengikut</span>
              <span><strong className="text-[#0A0A0B]">{PROFILE.following}</strong> Diikuti</span>
              <span><strong className="text-[#0A0A0B]">{PROFILE.works}</strong> Karya</span>
            </div>
          </div>
          <div className="flex gap-2 pb-1 ml-auto">
            <button
              onClick={() => app.requireAuth(() => app.toggleFollow("rio"))}
              data-goes-to="Toggle ikuti"
              className={"text-sm font-bold px-5 py-2 rounded-full transition-colors flex items-center gap-1.5 " +
                (following ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white")}
            >
              {following ? <><Check size={13} /> Mengikuti</> : "Ikuti"}
            </button>
            <button
              onClick={() => app.openCommission({ artistId: "rio" })}
              data-goes-to="→ Form komisi artist"
              className="border border-[#E5E5E7] text-[#0A0A0B] text-sm font-semibold px-4 py-2 rounded-full hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors"
            >Minta Komisi</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5E5E7] flex px-6">
        {["Galeri", "Favorit", "About Me"].map((t, i) => (
          <button
            key={t} onClick={() => setTab(i)}
            data-goes-to="Ganti tab di tempat"
            className={"relative px-5 py-3 text-sm font-semibold transition-colors " + (tab === i ? "text-[#0A0A0B]" : "text-[#A1A1AA] hover:text-[#52525B]")}
          >
            {t}
            {tab === i && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E81E28]" />}
          </button>
        ))}
      </div>

      <div className="px-6 pt-5 pb-10">
        {tab === 0 && (
          <>
            <div className="hidden md:block">
              <JustifiedGrid artworks={ARTWORKS} targetHeight={220} />
            </div>
            <div className="md:hidden">
              <MobileGrid artworks={ARTWORKS} onArtworkClick={app.openArtwork} />
            </div>
          </>
        )}
        {tab === 1 && (
          <div className="hidden md:block">
            <JustifiedGrid artworks={ARTWORKS.slice(6, 16)} targetHeight={220} />
          </div>
        )}
        {tab === 2 && (
          <div className="max-w-lg space-y-5">
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1">Tentang</p>
              <p className="text-sm text-[#52525B] leading-relaxed">{PROFILE.bio}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2">Tools</p>
              <div className="flex flex-wrap gap-2">
                {PROFILE.tools.map(t => (
                  <span key={t} className="border border-[#E5E5E7] text-[#52525B] text-xs font-medium px-3 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2">Info</p>
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm text-[#52525B]"><MapPin size={12} className="text-[#A1A1AA]" /> {PROFILE.location}</p>
                <a
                  href={"https://" + PROFILE.website}
                  target="_blank"
                  rel="noreferrer"
                  data-goes-to="Tab baru"
                  className="flex items-center gap-2 text-sm text-[#C41A22] hover:underline"
                ><Link2 size={12} className="text-[#A1A1AA]" /> {PROFILE.website}</a>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2">Status Komisi</p>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-full">
                Terbuka untuk Komisi · 3 slot tersedia
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: FAVORIT / KOLEKSI / PENCARIAN / KATEGORI / PENGATURAN
// ══════════════════════════════════════════════════════════════════════════════
function SimpleGridScreen({ title, kicker, artworks, empty }) {
  const app = useApp();
  return (
    <div className="px-6 pt-4 pb-10">
      <button onClick={app.back} data-goes-to="← Kembali (posisi scroll pulih)" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors mb-4">
        <ArrowLeft size={14} /> Kembali
      </button>
      {kicker}
      <h1 className="text-[28px] font-extrabold text-[#0A0A0B] mb-1">{title}</h1>
      <p className="text-sm text-[#52525B] mb-6">{artworks.length} karya</p>
      {artworks.length ? <JustifiedGrid artworks={artworks} targetHeight={230} /> : empty}
    </div>
  );
}

function FavoritesScreen() {
  const app = useApp();
  const list = ARTWORKS.filter(a => app.liked.has(a.id));
  return (
    <SimpleGridScreen
      title="Favorit"
      artworks={list}
      empty={<EmptyBlock title="Belum ada karya disukai" hint="Tekan ikon hati pada karya mana pun, dan karya itu muncul di sini." />}
    />
  );
}

function CollectionsScreen() {
  const app = useApp();
  return (
    <div className="px-6 pt-4 pb-10">
      <button onClick={app.back} data-goes-to="← Kembali (posisi scroll pulih)" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors mb-4">
        <ArrowLeft size={14} /> Kembali
      </button>
      <h1 className="text-[28px] font-extrabold text-[#0A0A0B] mb-1">Koleksi</h1>
      <p className="text-sm text-[#52525B] mb-6">{app.collections.length} folder</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {app.collections.map(c => {
          const cover = c.ids.map(id => ARTWORKS.find(a => a.id === id)).filter(Boolean).slice(0, 4);
          return (
            <button
              key={c.id}
              onClick={() => app.openCollection(c)}
              data-goes-to="→ Isi folder koleksi"
              className="text-left group"
            >
              <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden bg-[#F5F5F5] mb-2" style={{ aspectRatio: "4/3" }}>
                {cover.map(a => (
                  <Pic key={a.id} photoId={a.photoId} w={240} h={180} title={a.title} compact className="w-full h-full" imgClass="group-hover:opacity-90 transition-opacity" />
                ))}
              </div>
              <p className="text-sm font-bold text-[#0A0A0B] flex items-center gap-1.5"><Folder size={13} className="text-[#A1A1AA]" /> {c.name}</p>
              <p className="text-xs text-[#A1A1AA]">{c.ids.length} karya</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CollectionScreen() {
  const app = useApp();
  const c = app.params.collection || app.collections[0];
  const list = c.ids.map(id => ARTWORKS.find(a => a.id === id)).filter(Boolean);
  return (
    <SimpleGridScreen
      title={c.name}
      kicker={<p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1">Koleksi</p>}
      artworks={list}
      empty={<EmptyBlock title="Folder masih kosong" hint="Tambahkan karya lewat ikon + pada kartu karya." />}
    />
  );
}

function SearchScreen() {
  const app = useApp();
  const q = (app.params.q || "").trim();
  const key = q.replace(/^#/, "").toLowerCase();
  const results = ARTWORKS.filter(a =>
    a.title.toLowerCase().includes(key) || a.artist.toLowerCase().includes(key) ||
    a.category.toLowerCase().includes(key) || a.tags.some(t => t.includes(key)));

  return (
    <div className="px-6 pt-4 pb-10">
      <button onClick={app.back} data-goes-to="← Kembali (posisi scroll pulih)" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors mb-4">
        <ArrowLeft size={14} /> Kembali
      </button>
      <div className="bg-[#FEF2F3] rounded-xl px-4 py-3 flex items-center gap-2.5 mb-6">
        <Search size={14} className="text-[#C41A22] flex-shrink-0" />
        <p className="text-sm font-bold text-[#C41A22]">{q}</p>
        <span className="text-xs text-[#C41A22]/70">{results.length} hasil</span>
      </div>
      {results.length
        ? <JustifiedGrid artworks={results} targetHeight={230} />
        : <EmptyBlock title="Karya tidak ditemukan" hint={"Tidak ada karya yang cocok dengan “" + q + "”. Coba tag atau nama artist lain."} />}
    </div>
  );
}

function CategoryScreen() {
  const app = useApp();
  const name = app.params.category;
  const list = ARTWORKS.filter(a => a.category === name);
  return (
    <SimpleGridScreen
      title={name}
      kicker={<p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1">Kategori</p>}
      artworks={list}
      empty={<EmptyBlock title="Karya tidak ditemukan" hint="Kategori ini belum punya karya. Coba kategori lain dari Discovery." />}
    />
  );
}

function SettingsScreen() {
  const app = useApp();
  const [on, setOn] = useState({ komisi: true, notif: true, watermark: false });
  const rows = [
    ["komisi", "Buka status komisi", "Tampilkan paket harga di profilmu"],
    ["notif", "Notifikasi email", "Ringkasan suka, komentar dan pesanan"],
    ["watermark", "Watermark otomatis", "Terapkan watermark terakhir ke setiap unggahan"],
  ];
  return (
    <div className="px-6 pt-4 pb-10">
      <button onClick={app.back} data-goes-to="← Kembali (posisi scroll pulih)" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors mb-4">
        <ArrowLeft size={14} /> Kembali
      </button>
      <h1 className="text-[28px] font-extrabold text-[#0A0A0B] mb-6">Pengaturan</h1>
      <div className="max-w-xl border border-[#E5E5E7] rounded-xl divide-y divide-[#E5E5E7]">
        {rows.map(([k, title, sub]) => (
          <div key={k} className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-[#0A0A0B]">{title}</p>
              <p className="text-xs text-[#A1A1AA]">{sub}</p>
            </div>
            <button
              onClick={() => { setOn(s => ({ ...s, [k]: !s[k] })); toast.success("Pengaturan disimpan", { description: title }); }}
              data-goes-to="Toggle + toast"
              className={"w-11 h-6 rounded-full flex-shrink-0 transition-colors relative " + (on[k] ? "bg-[#E81E28]" : "bg-[#E5E5E7]")}
            >
              <span className={"absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all " + (on[k] ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WATERMARK GENERATOR
// ══════════════════════════════════════════════════════════════════════════════
const WM_POS = [
  ["flex-start", "flex-start"], ["center", "flex-start"], ["flex-end", "flex-start"],
  ["flex-start", "center"],     ["center", "center"],     ["flex-end", "center"],
  ["flex-start", "flex-end"],   ["center", "flex-end"],   ["flex-end", "flex-end"],
];

function WmSlider({ label, value, min, max, unit, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">{label}</p>
        <span className="text-xs font-bold text-[#0A0A0B]">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#E81E28]"
      />
    </div>
  );
}

function WatermarkStudio({ photoId = "1478760329108-5c3ed9d495a0", fileName = "kegelapan-abadi.png", onSkip, onApply, mode: footerMode = "flow" }) {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("© rioArtStudio");
  const [pos, setPos] = useState(8);
  const [opacity, setOpacity] = useState(40);
  const [size, setSize] = useState(26);
  const [rotation, setRotation] = useState(0);
  const [tile, setTile] = useState(false);
  const [color, setColor] = useState("white");

  const ink = color === "white" ? "#FFFFFF" : "#0A0A0B";
  const mark = (key) => (
    <span
      key={key}
      style={{
        fontSize: size, fontWeight: 800, letterSpacing: "0.02em", color: ink,
        opacity: opacity / 100, whiteSpace: "nowrap", lineHeight: 1,
        transform: tile ? "none" : "rotate(" + rotation + "deg)",
      }}
    >
      {mode === "text" ? text : <span>ART<span style={{ color: color === "white" ? "#FFFFFF" : "#E81E28" }}>VAULT</span></span>}
    </span>
  );

  return (
    <div>
      <div className="flex gap-6 items-start">
        {/* Preview stage */}
        <div className="flex-1 min-w-0">
          <div className="bg-[#F5F5F5] rounded-xl p-6 flex items-center justify-center" style={{ minHeight: 460 }}>
            <div className="relative max-w-full" style={{ lineHeight: 0 }}>
              <Pic
                photoId={photoId}
                w={900}
                h={600}
                title="Pratinjau watermark"
                eager
                className="rounded-lg shadow-md max-w-full"
                style={{ aspectRatio: "3 / 2", height: "min(420px, 60vh)" }}
              />
              {tile ? (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none flex flex-wrap items-center justify-center content-center gap-x-10 gap-y-8"
                  style={{ transform: "rotate(" + (rotation - 24) + "deg) scale(1.6)" }}
                >
                  {Array.from({ length: 30 }).map((_, i) => mark(i))}
                </div>
              ) : (
                <div
                  className="absolute inset-0 flex p-5 pointer-events-none"
                  style={{ justifyContent: WM_POS[pos][0], alignItems: WM_POS[pos][1] }}
                >
                  {mark("single")}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-2 flex items-center gap-1.5">
            <ImageIcon size={11} /> {fileName} · pratinjau langsung, watermark dibakar saat diterapkan
          </p>
        </div>

        {/* Control panel */}
        <div className="w-[320px] flex-shrink-0 border border-[#E5E5E7] rounded-xl">
          <div className="px-4 py-3 border-b border-[#E5E5E7] flex items-center gap-2">
            <Stamp size={14} className="text-[#C41A22]" />
            <p className="text-sm font-bold text-[#0A0A0B]">Watermark</p>
          </div>

          <div className="p-4 space-y-5">
            {/* Source */}
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Sumber</p>
              <div className="flex bg-[#F5F5F5] rounded-full p-1 mb-2">
                {[["text", "Teks", Type], ["logo", "Logo", ImageIcon]].map(([id, label, Icon]) => (
                  <button
                    key={id}
                    onClick={() => setMode(id)}
                    className={"flex-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center justify-center gap-1.5 " + (mode === id ? "bg-white text-[#0A0A0B] shadow-sm" : "text-[#52525B]")}
                  >
                    <Icon size={11} /> {label}
                  </button>
                ))}
              </div>
              {mode === "text" ? (
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="w-full border border-[#E5E5E7] rounded-full px-3 py-2 text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none focus:border-[#A1A1AA] transition-colors"
                  placeholder="© namamu"
                />
              ) : (
                <button className="w-full border border-dashed border-[#E5E5E7] rounded-xl px-3 py-3 text-xs font-semibold text-[#52525B] hover:border-[#0A0A0B] transition-colors flex items-center justify-center gap-1.5">
                  <Upload size={12} /> Unggah logo PNG transparan
                </button>
              )}
            </div>

            {/* Position grid */}
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Posisi</p>
              <div className="grid grid-cols-3 gap-1.5" style={{ opacity: tile ? 0.4 : 1 }}>
                {WM_POS.map((_, i) => (
                  <button
                    key={i}
                    disabled={tile}
                    onClick={() => setPos(i)}
                    className={"h-9 rounded border transition-colors " + (pos === i && !tile ? "bg-[#E81E28] border-[#E81E28]" : "bg-white border-[#E5E5E7] hover:border-[#0A0A0B]")}
                  >
                    <span className={"block w-1.5 h-1.5 rounded-full mx-auto " + (pos === i && !tile ? "bg-white" : "bg-[#E5E5E7]")} />
                  </button>
                ))}
              </div>
            </div>

            <WmSlider label="Opasitas" value={opacity} min={5} max={100} unit="%" onChange={setOpacity} />
            <WmSlider label="Ukuran" value={size} min={10} max={72} unit="px" onChange={setSize} />
            <WmSlider label="Rotasi" value={rotation} min={-90} max={90} unit="°" onChange={setRotation} />

            {/* Tile toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0A0A0B]">Pola berulang</p>
                <p className="text-xs text-[#A1A1AA]">Ubin diagonal menutup seluruh karya</p>
              </div>
              <button
                onClick={() => setTile(t => !t)}
                className={"w-11 h-6 rounded-full flex-shrink-0 transition-colors relative " + (tile ? "bg-[#E81E28]" : "bg-[#E5E5E7]")}
              >
                <span className={"absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all " + (tile ? "left-[22px]" : "left-0.5")} />
              </button>
            </div>

            {/* Colour */}
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Warna</p>
              <div className="flex gap-2">
                {[["white", "Putih", "#FFFFFF"], ["black", "Hitam", "#0A0A0B"]].map(([id, label, sw]) => (
                  <button
                    key={id}
                    onClick={() => setColor(id)}
                    className={"flex-1 flex items-center gap-2 border rounded-full px-3 py-2 text-xs font-semibold transition-colors " + (color === id ? "border-[#E81E28] text-[#0A0A0B]" : "border-[#E5E5E7] text-[#52525B] hover:border-[#0A0A0B]")}
                  >
                    <span className="w-4 h-4 rounded-full border border-[#E5E5E7] flex-shrink-0" style={{ background: sw }} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-[#E5E5E7] flex items-center gap-2">
            {footerMode === "flow" ? (
              <>
                <button
                  onClick={onSkip}
                  data-goes-to="Lanjut ke Detail Karya (tanpa watermark)"
                  className="flex-1 bg-white border border-[#E5E5E7] text-[#0A0A0B] text-sm font-semibold py-2 rounded-full hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors"
                >
                  Lewati
                </button>
                <button
                  onClick={onApply}
                  data-goes-to="Terapkan → Detail Karya"
                  className="flex-1 bg-[#E81E28] hover:bg-[#C41A22] text-white text-sm font-bold py-2 rounded-full transition-colors"
                >
                  Terapkan Watermark
                </button>
              </>
            ) : (
              <button
                onClick={onApply}
                data-goes-to="Unduh berkas ber-watermark (tanpa publikasi)"
                className="flex-1 bg-[#E81E28] hover:bg-[#C41A22] text-white text-sm font-bold py-2 rounded-full transition-colors flex items-center justify-center gap-1.5"
              >
                <Download size={13} /> Unduh Hasil
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Standalone watermark page ────────────────────────────────────────────────
function WatermarkScreen() {
  const app = useApp();
  return (
    <div>
      <div className="px-6 pt-4">
        <button onClick={app.back} data-goes-to="← Kembali (posisi scroll pulih)" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors">
          <ArrowLeft size={14} /> Kembali
        </button>
      </div>
      <div className="px-6 pt-4 pb-10">
        <h1 className="text-[28px] font-extrabold text-[#0A0A0B] mb-1">Watermark Generator</h1>
        <p className="text-sm text-[#52525B] mb-6">Tandai gambar tanpa mengunggahnya ke galeri. Berkas hasil langsung diunduh ke perangkatmu.</p>
        <WatermarkStudio
          mode="standalone"
          onApply={() => toast.success("Berkas diunduh", { description: "kegelapan-abadi-watermark.png · tidak dipublikasikan" })}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: UPLOAD (berkas → watermark → detail)
// ══════════════════════════════════════════════════════════════════════════════
const UPLOAD_STEPS = ["Pilih Berkas", "Watermark", "Detail Karya"];

function UploadScreen() {
  const app = useApp();
  const [step, setStep] = useState(0);
  const [err, setErr] = useState(app.viewState === "error");
  const [picked, setPicked] = useState(false);
  const [wm, setWm] = useState(null);

  const cancel = () => app.confirm({
    title: "Buang karya ini?",
    body: "Berkas dan semua pengaturan watermark akan dibuang. Tindakan ini tidak bisa dibatalkan.",
    label: "Buang",
    onOk: () => { toast("Unggahan dibuang"); app.navigate("discovery"); },
  });

  const next = () => {
    if (step === 0 && !picked) { setErr(true); return; }
    setStep(s => Math.min(2, s + 1));
  };

  return (
    <div>
      <div className="px-6 pt-4 flex items-center justify-between">
        <button onClick={app.back} data-goes-to="← Kembali (posisi scroll pulih)" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors">
          <ArrowLeft size={14} /> Kembali
        </button>
        <button onClick={cancel} data-goes-to="Dialog “Buang karya ini?”" className="text-sm font-semibold text-[#52525B] hover:text-[#C41A22] transition-colors">Batal</button>
      </div>

      <div className="px-6 pt-4 pb-10">
        <h1 className="text-[28px] font-extrabold text-[#0A0A0B] mb-4">Unggah Karya</h1>

        {/* Steps */}
        <div className="flex items-center gap-3 mb-7 flex-wrap">
          {UPLOAD_STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={"w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors " +
                  (i < step ? "bg-[#FEF2F3] text-[#C41A22]" : i === step ? "bg-[#E81E28] text-white" : "bg-[#F5F5F5] text-[#A1A1AA]")}>
                  {i < step ? <Check size={12} /> : i + 1}
                </span>
                <span className={"text-sm font-semibold " + (i === step ? "text-[#0A0A0B]" : "text-[#A1A1AA]")}>{label}</span>
              </div>
              {i < UPLOAD_STEPS.length - 1 && <span className={"w-8 h-px " + (i < step ? "bg-[#E81E28]" : "bg-[#E5E5E7]")} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="max-w-2xl">
            <div className={"rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors " + (err ? "border-[#E81E28] bg-[#FEF2F3]/40" : picked ? "border-emerald-300 bg-emerald-50/40" : "border-[#E5E5E7]")}>
              <div className="w-14 h-14 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
                {err ? <AlertTriangle size={22} className="text-[#C41A22]" /> : picked ? <CheckCircle size={22} className="text-emerald-600" /> : <ImageIcon size={22} className="text-[#A1A1AA]" />}
              </div>
              <p className="text-base font-bold text-[#0A0A0B] mb-1">{picked ? "kegelapan-abadi.png siap" : "Tarik berkas ke sini"}</p>
              <p className="text-sm text-[#52525B] mb-5">PNG atau JPG, minimal 2000×2000px, maksimal 25 MB</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => { setErr(false); setPicked(true); }}
                  data-goes-to="Pilih berkas (valid)"
                  className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
                >
                  Pilih Berkas
                </button>
                <button
                  onClick={() => { setPicked(false); setErr(true); }}
                  data-goes-to="Jalur gagal (format salah)"
                  className="bg-white border border-[#E5E5E7] text-[#52525B] text-sm font-semibold px-4 py-2.5 rounded-full hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors"
                >
                  Coba berkas .tiff
                </button>
              </div>
            </div>
            {err && (
              <div className="flex items-start gap-2 mt-3">
                <AlertTriangle size={14} className="text-[#C41A22] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#C41A22]">Format tidak didukung</p>
                  <p className="text-sm text-[#52525B]">Berkas kamu .tiff. Ubah ke PNG atau JPG, lalu unggah kembali.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <WatermarkStudio
            onSkip={() => { setWm(null); setStep(2); }}
            onApply={() => { setWm("kanan bawah · 40%"); setStep(2); }}
          />
        )}

        {step === 2 && (
          <div className="max-w-2xl space-y-4">
            <div className="bg-[#F5F5F5] rounded-xl px-4 py-3 flex items-center gap-2.5">
              <Stamp size={13} className="text-[#A1A1AA] flex-shrink-0" />
              <p className="text-xs font-semibold text-[#52525B]">{wm ? "Watermark diterapkan · " + wm : "Tanpa watermark"}</p>
              <button onClick={() => setStep(1)} data-goes-to="← Langkah Watermark" className="ml-auto text-xs font-semibold text-[#52525B] hover:text-[#0A0A0B] transition-colors">Ubah</button>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Judul karya</p>
              <input
                placeholder="cth. Kegelapan Abadi"
                className="w-full border border-[#E5E5E7] rounded-full px-4 py-2.5 text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none focus:border-[#A1A1AA] transition-colors"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Deskripsi</p>
              <textarea
                rows={4}
                placeholder="Ceritakan proses dan inspirasi di balik karyamu..."
                className="w-full border border-[#E5E5E7] rounded-xl p-3 text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none resize-none focus:border-[#A1A1AA] transition-colors"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Kategori</p>
              <div className="flex flex-wrap gap-2">
                {["Digital Art", "Ilustrasi", "Lukisan", "Fotografi", "3D/CGI", "Komik"].map((c, i) => (
                  <span key={c} className={"text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors " + (i === 0 ? "bg-[#E81E28] text-white border-[#E81E28]" : "bg-white border-[#E5E5E7] text-[#52525B] hover:border-[#0A0A0B]")}>{c}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step nav */}
        <div className="flex items-center gap-2 pt-7 max-w-2xl">
          <button
            onClick={() => (step === 0 ? app.back() : setStep(s => s - 1))}
            data-goes-to={step === 0 ? "← Layar sebelumnya" : "← Langkah sebelumnya"}
            className="bg-white border border-[#E5E5E7] text-[#0A0A0B] text-sm font-semibold px-5 py-2.5 rounded-full hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors"
          >
            Kembali
          </button>
          {step < 2 ? (
            <Tip text={step === 0 && !picked ? "Pilih berkas PNG atau JPG lebih dulu" : "Lanjut ke " + UPLOAD_STEPS[step + 1]}>
              <button
                onClick={next}
                disabled={step === 0 && !picked}
                data-goes-to={step === 0 && !picked ? "Nonaktif · tooltip alasan" : "→ " + UPLOAD_STEPS[Math.min(2, step + 1)]}
                className={"text-sm font-bold px-6 py-2.5 rounded-full transition-colors " +
                  (step === 0 && !picked ? "bg-[#F5F5F5] text-[#A1A1AA] border border-[#E5E5E7] cursor-not-allowed" : "bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white")}
              >
                Lanjut
              </button>
            </Tip>
          ) : (
            <button
              onClick={() => {
                toast.success("Karya berhasil diunggah", { description: "Kamu diarahkan ke halaman karya baru" });
                app.openArtwork(ARTWORKS[0]);
              }}
              data-goes-to="Toast sukses → Halaman Karya baru"
              className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold px-6 py-2.5 rounded-full transition-colors"
            >
              Unggah
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN: ABOUT
// ══════════════════════════════════════════════════════════════════════════════
function AboutScreen({ navigate }) {
  const [openFaq, setOpenFaq] = useState(0);
  const faqs = [
    ["Apakah ARTVAULT gratis?", "Ya. Membuat akun, mengunggah karya, dan mengikuti kontes tidak dipungut biaya. Kami hanya mengambil 5% dari komisi yang berhasil diselesaikan."],
    ["Siapa yang memegang hak cipta karya saya?", "Sepenuhnya milikmu. ARTVAULT hanya menampilkan karya; kami tidak pernah menjual atau melisensikannya tanpa izin tertulis darimu."],
    ["Bagaimana cara membuka komisi?", "Buka Pengaturan, aktifkan status komisi, lalu susun paket harga beserta deskripsi layanan dan estimasi waktu pengerjaan."],
    ["Bagaimana peringkat dihitung?", "Skor gabungan dari suka, komentar, dan jumlah dilihat sepanjang usia karya. Tidak ada slot yang bisa dibeli."],
    ["Apa yang terjadi jika komisi bermasalah?", "Ajukan sengketa dari halaman pesanan. Dana tetap ditahan escrow sampai tim kami menengahi dan kedua pihak sepakat."],
  ];
  const frames = [
    { a: ARTWORKS[5],  cls: "left-0 top-10 w-[46%]",       rot: -7, z: 1 },
    { a: ARTWORKS[13], cls: "right-0 top-0 w-[44%]",       rot: 6,  z: 2 },
    { a: ARTWORKS[2],  cls: "left-[25%] bottom-0 w-[50%]", rot: -2, z: 3 },
  ];
  const doing = [
    { Icon: Compass,   title: "Discovery",  desc: "Feed harian yang menampilkan karya baru dari seluruh Indonesia." },
    { Icon: Trophy,    title: "Ranking",    desc: "Peringkat berbasis apresiasi nyata, dihitung ulang setiap jam." },
    { Icon: Briefcase, title: "Commission", desc: "Pemesanan karya dengan paket harga jelas dan dana terlindungi." },
    { Icon: Award,     title: "Contest",    desc: "Kontes bertema tiap bulan dengan hadiah dan juri undangan." },
  ];
  const steps = [
    ["1", "Klien membayar di muka", "Dana masuk ke rekening escrow ARTVAULT, bukan ke artist, dan tidak bisa ditarik sepihak."],
    ["2", "Artist mengerjakan karya", "Progres, revisi, dan berkas final dikirim lewat halaman pesanan agar semua tercatat."],
    ["3", "Dana cair setelah disetujui", "Begitu klien menyetujui hasil akhir, dana diteruskan ke artist dalam 1x24 jam."],
  ];
  const team = [
    ["Nadia Prameswari", "Pendiri & Produk", "#E81E28", "NP"],
    ["Reza Hutagalung",  "Teknologi",        "#6366F1", "RH"],
    ["Alya Kusuma",      "Komunitas Artist", "#F97316", "AK"],
    ["Bimo Saptono",     "Kepercayaan & Keamanan", "#059669", "BS"],
  ];

  return (
    <div>
      {/* Hero */}
      <section className="px-6 md:px-12 pt-8 md:pt-12 pb-14 flex flex-col md:flex-row items-center gap-12 md:gap-16">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-extrabold text-[#C41A22] uppercase tracking-[0.18em] mb-4">Tentang ARTVAULT</p>
          <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-5" style={{ fontSize: 44, lineHeight: 1.06 }}>
            Rumah bagi karya<br />artist Indonesia
          </h1>
          <p className="text-[15px] text-[#52525B] leading-relaxed max-w-md mb-7" style={{ textWrap: "pretty" }}>
            ARTVAULT mempertemukan artist digital Indonesia dengan orang yang mencari, mengoleksi, dan memesan karya mereka. Satu tempat untuk memamerkan portofolio, membuka komisi, dan bertanding di kontes bulanan.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate("discovery")} data-goes-to="→ Discovery" className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold px-6 py-3 rounded-full transition-colors">Jelajahi Karya</button>
            <button onClick={() => navigate("signup")} data-goes-to="→ Daftar" className="bg-white border border-[#E5E5E7] hover:bg-[#F5F5F5] active:bg-[#EDEDEF] text-[#0A0A0B] text-sm font-bold px-6 py-3 rounded-full transition-colors">Gabung Komunitas</button>
          </div>
        </div>
        <div className="relative flex-shrink-0 w-full max-w-[400px] h-[300px] md:h-[380px]">
          {frames.map(f => (
            <div key={f.a.id} className={"absolute " + f.cls} style={{ transform: "rotate(" + f.rot + "deg)", zIndex: f.z }}>
              <div className="bg-white p-2 rounded-2xl" style={{ boxShadow: "0 18px 44px -14px rgba(10,10,11,0.34)" }}>
                <Pic photoId={f.a.photoId} w={520} h={650} title={f.a.title} className="w-full rounded-xl" style={{ aspectRatio: "4 / 5" }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Misi */}
      <section className="border-y border-[#E5E5E7] px-6 py-14">
        <p className="mx-auto text-center text-[#0A0A0B] font-medium" style={{ fontSize: 20, maxWidth: 640, lineHeight: 1.55, textWrap: "pretty" }}>
          Karya yang baik pantas ditemukan tanpa harus membayar iklan. Kami membangun peringkat dari apresiasi nyata, dan komisi dari kepercayaan yang dijaga sistem.
        </p>
      </section>

      {/* Apa yang kami lakukan */}
      <section className="px-6 md:px-12 py-14">
        <h2 className="text-[22px] font-extrabold text-[#0A0A0B] mb-8">Apa yang kami lakukan</h2>
        <div className="grid grid-cols-1 md:grid-cols-4">
          {doing.map(({ Icon, title, desc }, i) => (
            <div key={title} className={"py-6 md:py-0 md:px-7 border-[#E5E5E7] " + (i === 0 ? "md:pl-0" : "border-t md:border-t-0 md:border-l")}>
              <Icon size={22} className="text-[#E81E28] mb-4" />
              <h3 className="text-sm font-extrabold text-[#0A0A0B] mb-1.5">{title}</h3>
              <p className="text-[13px] text-[#52525B] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Angka kami */}
      <section className="border-t-2 border-[#E81E28] bg-[#F5F5F5] px-6 md:px-12 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[["1,2 Juta+", "Karya terunggah"], ["340.000+", "Artist aktif"], ["18.400+", "Komisi selesai"], ["96", "Kontes terselenggara"]].map(([n, l]) => (
            <div key={l}>
              <p className="text-[34px] font-extrabold text-[#0A0A0B] leading-none mb-2">{n}</p>
              <p className="text-[13px] text-[#52525B]">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cerita kami */}
      <section className="grid md:grid-cols-2 border-b border-[#E5E5E7]">
        <div className="px-6 md:px-12 py-14 order-2 md:order-1">
          <h2 className="text-[22px] font-extrabold text-[#0A0A0B] mb-5">Cerita kami</h2>
          <p className="text-[15px] text-[#52525B] leading-relaxed mb-4" style={{ textWrap: "pretty" }}>
            ARTVAULT dimulai pada 2023 dari satu utas keluhan: ilustrator Indonesia kehilangan pekerjaan karena klien kabur setelah karya dikirim, dan karya bagus tenggelam di linimasa yang mengutamakan pengiklan.
          </p>
          <p className="text-[15px] text-[#52525B] leading-relaxed" style={{ textWrap: "pretty" }}>
            Empat orang membangun versi pertamanya di akhir pekan: satu galeri, satu papan peringkat, satu rekening bersama. Yang tersisa hari ini adalah tiga gagasan yang sama, dijalankan untuk ratusan ribu artist.
          </p>
        </div>
        <div className="relative min-h-[280px] md:min-h-[440px] bg-[#F5F5F5] order-1 md:order-2">
          <Pic photoId={ARTWORKS[8].photoId} w={1000} h={900} title={ARTWORKS[8].title} className="absolute inset-0 w-full h-full" />
        </div>
      </section>

      {/* Keamanan komisi */}
      <section className="px-6 md:px-12 py-14">
        <div className="bg-[#F5F5F5] rounded-2xl p-7 md:p-10">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-[#E81E28]" />
            </div>
            <div>
              <h2 className="text-[20px] font-extrabold text-[#0A0A0B] mb-1.5">Keamanan komisi</h2>
              <p className="text-sm text-[#52525B] leading-relaxed max-w-lg">Setiap pembayaran ditahan sistem escrow ARTVAULT sampai kedua pihak sepakat karya selesai.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {steps.map(([n, t, d]) => (
              <div key={n} className="bg-white rounded-xl p-5">
                <span className="w-6 h-6 rounded-full bg-[#E81E28] text-white text-[11px] font-extrabold flex items-center justify-center mb-3">{n}</span>
                <h3 className="text-sm font-extrabold text-[#0A0A0B] mb-1.5">{t}</h3>
                <p className="text-[13px] text-[#52525B] leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tim */}
      <section className="px-6 md:px-12 pb-14">
        <h2 className="text-[22px] font-extrabold text-[#0A0A0B] mb-8">Tim</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {team.map(([name, role, bg, init]) => (
            <div key={name}>
              <Av bg={bg} initials={init} size={72} />
              <p className="text-sm font-bold text-[#0A0A0B] mt-3.5">{name}</p>
              <p className="text-[13px] text-[#52525B]">{role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 md:px-12 pb-14">
        <h2 className="text-[22px] font-extrabold text-[#0A0A0B] mb-4">Pertanyaan umum</h2>
        <div className="max-w-2xl border-t border-[#E5E5E7]">
          {faqs.map(([q, a], i) => {
            const open = openFaq === i;
            return (
              <div key={i} className="border-b border-[#E5E5E7]">
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  data-goes-to={open ? "Tutup jawaban" : "Buka jawaban"}
                  className="flex items-center justify-between w-full py-4 text-left gap-4 group"
                >
                  <span className={"text-sm font-bold transition-colors " + (open ? "text-[#0A0A0B]" : "text-[#0A0A0B] group-hover:text-[#C41A22]")}>{q}</span>
                  <ChevronRight size={16} className={"flex-shrink-0 transition-transform " + (open ? "rotate-90 text-[#E81E28]" : "text-[#A1A1AA]")} />
                </button>
                {open && <p className="pb-5 pr-8 text-sm text-[#52525B] leading-relaxed" style={{ textWrap: "pretty" }}>{a}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-[#E5E5E7] px-6 py-16 text-center">
        <h2 className="font-extrabold text-[#0A0A0B] tracking-tight mx-auto mb-7" style={{ fontSize: 30, maxWidth: 520, lineHeight: 1.15 }}>
          Karyamu pantas ditemukan.
        </h2>
        <button onClick={() => navigate("signup")} data-goes-to="→ Daftar" className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold px-8 py-3.5 rounded-full transition-colors">
          Daftar Gratis
        </button>
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════════════
const AUTH_SCREENS = ["login", "signup", "forgot", "checkEmail", "reset", "onboarding"];

const AUTH_ART = {
  login:  { photoId: "1536431311719-398b6704d4cc", title: "Neon Kota", artist: "neoCityArt" },
  signup: { photoId: "1508615039623-a25605d2b022", title: "Merah di Senja", artist: "syandra_art" },
  reset:  { photoId: "1604999333679-b86d54738315", title: "Karakter Nusantara", artist: "characterLab" },
};

const TAKEN = ["admin", "artvault", "rioart", "syandra_art", "neocityart", "test"];
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const pwStrength = (v) => (v.length === 0 ? 0 : v.length < 8 ? 1 : /[^a-zA-Z]/.test(v) ? 3 : 2);
const STRENGTH_COLOR = ["#E5E5E7", "#A1A1AA", "#F59E0B", "#059669"];
const STRENGTH_LABEL = ["", "Lemah", "Cukup", "Kuat"];

function AuthSplit({ art, children }) {
  const app = useApp();
  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden md:block relative w-[45%] flex-shrink-0 overflow-hidden bg-[#0A0A0B]">
        <Pic photoId={art.photoId} w={1100} h={1500} title={art.title} eager className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-x-0 top-0 h-36 pointer-events-none" style={{ background: TOP_SCRIM }} />
        <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 100%)" }} />
        <button onClick={() => app.navigate("discovery")} data-goes-to="→ Discovery" className="absolute top-7 left-7 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#E81E28] rounded-lg flex items-center justify-center flex-shrink-0">
            <Palette size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-extrabold text-white tracking-tight">ARTVAULT</span>
        </button>
        <p className="absolute bottom-7 left-7 right-7 text-xs text-white/75">
          <span className="font-semibold text-white">{art.title}</span> · @{art.artist}
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-14">
        <div className="w-full" style={{ maxWidth: 400 }}>{children}</div>
      </div>
    </div>
  );
}

function AuthMark({ sub }) {
  const app = useApp();
  return (
    <div className="mb-7">
      <button onClick={() => app.navigate("discovery")} data-goes-to="→ Discovery" className="flex items-center gap-2.5 mb-7">
        <div className="w-8 h-8 bg-[#E81E28] rounded-lg flex items-center justify-center flex-shrink-0">
          <Palette size={16} className="text-white" />
        </div>
        <span className="text-[18px] font-extrabold leading-none tracking-tight">
          <span className="text-[#0A0A0B]">ART</span><span className="text-[#E81E28]">VAULT</span>
        </span>
      </button>
      {sub}
    </div>
  );
}

function AuthField({ label, type = "text", value, onChange, placeholder, invalid, trailing, onEnter, autoFocus }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#0A0A0B] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && onEnter) onEnter(); }}
          data-goes-to={"Isi " + label.toLowerCase()}
          className={"w-full rounded-full pl-4 pr-11 py-3 text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none border transition-colors " +
            (invalid ? "bg-white border-[#E81E28]" : "bg-[#F4F4F5] border-transparent focus:border-[#A1A1AA]")}
        />
        {trailing && <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">{trailing}</div>}
      </div>
    </div>
  );
}

function HelpLine({ tone, children }) {
  const c = tone === "error" ? "#C41A22" : tone === "ok" ? "#059669" : "#A1A1AA";
  const Icon = tone === "error" ? AlertTriangle : tone === "ok" ? CheckCircle : null;
  return (
    <p className="flex items-center gap-1.5 mt-2 text-xs font-medium" style={{ color: c }}>
      {Icon && <Icon size={12} className="flex-shrink-0" />}
      <span>{children}</span>
    </p>
  );
}

function EyeToggle({ on, onToggle }) {
  const Icon = on ? EyeOff : Eye;
  return (
    <button
      onClick={onToggle}
      data-goes-to={on ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
      className="text-[#A1A1AA] hover:text-[#0A0A0B] transition-colors"
    >
      <Icon size={15} />
    </button>
  );
}

function RedCheck({ on, onToggle, children, goesTo }) {
  return (
    <button onClick={onToggle} data-goes-to={goesTo} className="flex items-start gap-2.5 text-left group">
      <span className={"w-[18px] h-[18px] mt-px rounded-md border flex items-center justify-center flex-shrink-0 transition-colors " +
        (on ? "bg-[#E81E28] border-[#E81E28]" : "bg-white border-[#D4D4D8] group-hover:border-[#A1A1AA]")}>
        {on && <Check size={11} className="text-white" strokeWidth={3.5} />}
      </span>
      <span className="text-xs text-[#52525B] leading-relaxed">{children}</span>
    </button>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-[#E5E5E7]" />
      <span className="text-xs font-medium text-[#A1A1AA]">atau</span>
      <div className="flex-1 h-px bg-[#E5E5E7]" />
    </div>
  );
}

function SocialButtons() {
  const app = useApp();
  const go = (nm) => { app.signIn(); app.navigate("discovery"); toast.success("Berhasil masuk dengan " + nm); };
  const rows = [["Google", "#4285F4", "#F4F4F5", "G"], ["Discord", "#ffffff", "#5865F2", "D"]];
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map(([nm, fg, bg, ch]) => (
        <button
          key={nm}
          onClick={() => go(nm)}
          data-goes-to={"Masuk dengan " + nm + " → Discovery"}
          className="flex items-center justify-center gap-2.5 w-full bg-white border border-[#E5E5E7] hover:bg-[#F5F5F5] active:bg-[#EDEDEF] text-[#0A0A0B] text-sm font-bold py-3 rounded-full transition-colors"
        >
          <span className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-extrabold" style={{ background: bg, color: fg }}>{ch}</span>
          Lanjutkan dengan {nm}
        </button>
      ))}
    </div>
  );
}

function PillButton({ children, onClick, disabled, busy, goesTo }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      data-goes-to={goesTo}
      className={"flex items-center justify-center gap-2 w-full text-sm font-bold py-3.5 rounded-full transition-colors " +
        (disabled ? "bg-[#E5E5E7] text-[#A1A1AA]" : "bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white")}
    >
      {busy && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
      {children}
    </button>
  );
}

function StrengthMeter({ value }) {
  const st = pwStrength(value);
  return (
    <div className="mt-2.5">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: i < st ? STRENGTH_COLOR[st] : "#E5E5E7" }} />
        ))}
      </div>
      <p className="flex items-center justify-between gap-3 mt-2 text-xs text-[#A1A1AA]">
        <span>Minimal 8 karakter, tambahkan angka atau simbol.</span>
        {st > 0 && <span className="font-semibold flex-shrink-0" style={{ color: STRENGTH_COLOR[st] }}>{STRENGTH_LABEL[st]}</span>}
      </p>
    </div>
  );
}

// ─── Masuk ────────────────────────────────────────────────────────────────────
function LoginScreen() {
  const app = useApp();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);

  const submit = () => {
    if (busy) return;
    setFail(false);
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (emailOk(email) || (email.trim().length > 2 && pw.length >= 6)) {
        if (pw.length < 6) { setFail(true); toast.error("Gagal masuk", { description: "Email atau kata sandi salah" }); return; }
        app.signIn();
        app.navigate("discovery");
        toast.success("Berhasil masuk", { description: "Selamat datang kembali" });
      } else {
        setFail(true);
        toast.error("Gagal masuk", { description: "Email atau kata sandi salah" });
      }
    }, 900);
  };

  return (
    <AuthSplit art={AUTH_ART.login}>
      <AuthMark sub={
        <>
          <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-2" style={{ fontSize: 28, lineHeight: 1.15 }}>Masuk ke ARTVAULT</h1>
          <p className="text-sm text-[#52525B] leading-relaxed">Lanjutkan menjelajah, menyimpan karya, dan mengelola komisimu.</p>
        </>
      } />

      <div className="flex flex-col gap-4">
        <div>
          <AuthField label="Email atau username" value={email} onChange={setEmail} placeholder="nama@email.com" invalid={fail} onEnter={submit} autoFocus />
        </div>
        <div>
          <AuthField
            label="Kata sandi" type={show ? "text" : "password"} value={pw} onChange={setPw}
            placeholder="Masukkan kata sandi" invalid={fail} onEnter={submit}
            trailing={<EyeToggle on={show} onToggle={() => setShow(!show)} />}
          />
          {fail && <HelpLine tone="error">Email atau kata sandi salah</HelpLine>}
        </div>

        <div className="flex items-center justify-between gap-3">
          <RedCheck on={remember} onToggle={() => setRemember(!remember)} goesTo="Ingat sesi di perangkat ini">Ingat saya</RedCheck>
          <button onClick={() => app.navigate("forgot")} data-goes-to="→ Lupa kata sandi" className="text-xs font-semibold text-[#C41A22] hover:underline flex-shrink-0">Lupa kata sandi?</button>
        </div>

        <PillButton onClick={submit} busy={busy} goesTo="Masuk → Discovery">{busy ? "Memeriksa..." : "Masuk"}</PillButton>
      </div>

      <OrDivider />
      <SocialButtons />

      <p className="text-xs text-[#52525B] text-center mt-6">
        Belum punya akun? <button onClick={() => app.navigate("signup")} data-goes-to="→ Daftar" className="font-bold text-[#C41A22] hover:underline">Daftar</button>
      </p>
    </AuthSplit>
  );
}

// ─── Daftar ───────────────────────────────────────────────────────────────────
function SignupScreen() {
  const app = useApp();
  const [nama, setNama] = useState("");
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);

  const uTrim = user.trim().toLowerCase();
  const uTaken = uTrim.length >= 3 && TAKEN.includes(uTrim);
  const uFree = uTrim.length >= 3 && !uTaken;
  const st = pwStrength(pw);
  const mismatch = pw2.length > 0 && pw2 !== pw;

  const missing = [];
  if (!nama.trim()) missing.push("nama lengkap");
  if (!uFree) missing.push("username yang tersedia");
  if (!emailOk(email)) missing.push("email yang valid");
  if (st < 2) missing.push("kata sandi minimal 8 karakter");
  if (!pw2 || mismatch) missing.push("konfirmasi yang cocok");
  if (!agree) missing.push("centang syarat & ketentuan");
  const ready = missing.length === 0;

  const submit = () => {
    if (!ready || busy) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); app.signIn(); app.navigate("onboarding"); toast.success("Akun dibuat", { description: "Selamat datang, " + nama.trim().split(" ")[0] }); }, 900);
  };

  return (
    <AuthSplit art={AUTH_ART.signup}>
      <AuthMark sub={
        <>
          <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-2" style={{ fontSize: 28, lineHeight: 1.15 }}>Buat Akun</h1>
          <p className="text-sm text-[#52525B] leading-relaxed">Gratis selamanya. Unggah karya, buka komisi, dan ikut kontes bulanan.</p>
        </>
      } />

      <div className="flex flex-col gap-4">
        <AuthField label="Nama lengkap" value={nama} onChange={setNama} placeholder="Nama yang tampil di profil" autoFocus />

        <div>
          <AuthField
            label="Username" value={user} onChange={setUser} placeholder="tanpa spasi" invalid={uTaken}
            trailing={uFree ? <CheckCircle size={15} className="text-[#059669]" /> : uTaken ? <AlertTriangle size={15} className="text-[#E81E28]" /> : null}
          />
          {uFree && <HelpLine tone="ok">Username tersedia</HelpLine>}
          {uTaken && <HelpLine tone="error">Username sudah dipakai</HelpLine>}
        </div>

        <AuthField label="Email" value={email} onChange={setEmail} placeholder="nama@email.com" />

        <div>
          <AuthField
            label="Kata sandi" type={show ? "text" : "password"} value={pw} onChange={setPw} placeholder="Buat kata sandi"
            trailing={<EyeToggle on={show} onToggle={() => setShow(!show)} />}
          />
          <StrengthMeter value={pw} />
        </div>

        <div>
          <AuthField
            label="Konfirmasi kata sandi" type={show ? "text" : "password"} value={pw2} onChange={setPw2}
            placeholder="Ulangi kata sandi" invalid={mismatch} onEnter={submit}
          />
          {mismatch && <HelpLine tone="error">Kata sandi tidak cocok</HelpLine>}
        </div>

        <RedCheck on={agree} onToggle={() => setAgree(!agree)} goesTo="Setujui syarat">
          Saya setuju dengan <span className="font-semibold text-[#C41A22]">Syarat &amp; Ketentuan</span> dan <span className="font-semibold text-[#C41A22]">Kebijakan Privasi</span>
        </RedCheck>

        {ready ? (
          <PillButton onClick={submit} busy={busy} goesTo="Buat akun → Onboarding">{busy ? "Membuat akun..." : "Buat Akun"}</PillButton>
        ) : (
          <Tip text={"Lengkapi dulu: " + missing.join(", ")} className="w-full">
            <span className="w-full"><PillButton disabled goesTo="Nonaktif sampai semua isian valid">Buat Akun</PillButton></span>
          </Tip>
        )}
      </div>

      <OrDivider />
      <SocialButtons />

      <p className="text-xs text-[#52525B] text-center mt-6">
        Sudah punya akun? <button onClick={() => app.navigate("login")} data-goes-to="→ Masuk" className="font-bold text-[#C41A22] hover:underline">Masuk</button>
      </p>
    </AuthSplit>
  );
}

// ─── Lupa kata sandi ──────────────────────────────────────────────────────────
function ForgotScreen() {
  const app = useApp();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const submit = () => {
    if (busy) return;
    if (!emailOk(email)) { setInvalid(true); toast.error("Email tidak valid"); return; }
    setInvalid(false);
    setBusy(true);
    setTimeout(() => { setBusy(false); app.navigate("checkEmail", { email: email.trim() }); }, 800);
  };

  return (
    <AuthSplit art={AUTH_ART.reset}>
      <AuthMark sub={
        <>
          <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-2" style={{ fontSize: 28, lineHeight: 1.15 }}>Lupa kata sandi</h1>
          <p className="text-sm text-[#52525B] leading-relaxed">Masukkan email akunmu. Kami kirim tautan untuk mengatur ulang kata sandi.</p>
        </>
      } />
      <div className="flex flex-col gap-4">
        <div>
          <AuthField label="Email" value={email} onChange={setEmail} placeholder="nama@email.com" invalid={invalid} onEnter={submit} autoFocus />
          {invalid && <HelpLine tone="error">Format email tidak valid</HelpLine>}
        </div>
        <PillButton onClick={submit} busy={busy} goesTo="Kirim tautan → Cek email">{busy ? "Mengirim..." : "Kirim Tautan Reset"}</PillButton>
      </div>
      <p className="text-center mt-6">
        <button onClick={() => app.navigate("login")} data-goes-to="→ Masuk" className="text-xs font-bold text-[#C41A22] hover:underline">Kembali ke Masuk</button>
      </p>
    </AuthSplit>
  );
}

// ─── Cek email ────────────────────────────────────────────────────────────────
function CheckEmailScreen() {
  const app = useApp();
  const email = app.params.email || "nama@email.com";
  const [left, setLeft] = useState(60);

  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft(n => (n <= 1 ? 0 : n - 1)), 1000);
    return () => clearInterval(t);
  }, [left > 0]);

  const resend = () => { if (left > 0) return; setLeft(60); toast.success("Tautan dikirim ulang", { description: email }); };

  return (
    <AuthSplit art={AUTH_ART.reset}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FEF2F3] flex items-center justify-center mx-auto mb-6">
          <Mail size={24} className="text-[#E81E28]" />
        </div>
        <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-3" style={{ fontSize: 26, lineHeight: 1.15 }}>Cek email kamu</h1>
        <p className="text-sm text-[#52525B] leading-relaxed mb-1">Kami mengirim tautan pengaturan ulang ke</p>
        <p className="text-sm font-bold text-[#0A0A0B] mb-7">{email}</p>

        <button onClick={() => app.navigate("reset")} data-goes-to="→ Atur ulang kata sandi" className="w-full bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold py-3.5 rounded-full transition-colors">
          Buka Tautan Reset
        </button>

        <p className="text-xs text-[#52525B] mt-6">
          Tidak menerima email?{" "}
          <button
            onClick={resend}
            disabled={left > 0}
            data-goes-to={left > 0 ? "Nonaktif 60 detik" : "Kirim ulang tautan"}
            className={"font-bold " + (left > 0 ? "text-[#A1A1AA]" : "text-[#C41A22] hover:underline")}
          >
            Kirim ulang{left > 0 ? " (" + left + "s)" : ""}
          </button>
        </p>
        <p className="mt-4">
          <button onClick={() => app.navigate("login")} data-goes-to="→ Masuk" className="text-xs font-bold text-[#C41A22] hover:underline">Kembali ke Masuk</button>
        </p>
      </div>
    </AuthSplit>
  );
}

// ─── Atur ulang kata sandi ────────────────────────────────────────────────────
function ResetScreen() {
  const app = useApp();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const st = pwStrength(pw);
  const mismatch = pw2.length > 0 && pw2 !== pw;
  const ready = st >= 2 && pw2 === pw && pw2.length > 0;

  const submit = () => {
    if (!ready || busy) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); app.navigate("login"); toast.success("Kata sandi diperbarui", { description: "Silakan masuk dengan kata sandi baru" }); }, 800);
  };

  return (
    <AuthSplit art={AUTH_ART.reset}>
      <AuthMark sub={
        <>
          <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-2" style={{ fontSize: 28, lineHeight: 1.15 }}>Atur ulang kata sandi</h1>
          <p className="text-sm text-[#52525B] leading-relaxed">Buat kata sandi baru untuk akunmu.</p>
        </>
      } />
      <div className="flex flex-col gap-4">
        <div>
          <AuthField
            label="Kata sandi baru" type={show ? "text" : "password"} value={pw} onChange={setPw} placeholder="Kata sandi baru" autoFocus
            trailing={<EyeToggle on={show} onToggle={() => setShow(!show)} />}
          />
          <StrengthMeter value={pw} />
        </div>
        <div>
          <AuthField label="Konfirmasi kata sandi" type={show ? "text" : "password"} value={pw2} onChange={setPw2} placeholder="Ulangi kata sandi baru" invalid={mismatch} onEnter={submit} />
          {mismatch && <HelpLine tone="error">Kata sandi tidak cocok</HelpLine>}
        </div>
        <PillButton onClick={submit} busy={busy} disabled={!ready} goesTo="Simpan → Masuk">{busy ? "Menyimpan..." : "Simpan Kata Sandi"}</PillButton>
      </div>
    </AuthSplit>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
const ONBOARD_CHIPS = ["Digital Art", "Ilustrasi", "Lukisan", "Fotografi", "3D/CGI", "Komik", "Karakter", "Potret", "Abstrak", "Konsep Lingkungan", "Piksel", "Kaligrafi"];

function OnboardingScreen() {
  const app = useApp();
  const [step, setStep] = useState(1);
  const [picks, setPicks] = useState(new Set());
  const [follows, setFollows] = useState(new Set());

  const toggleChip = (c) => setPicks(s => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n; });
  const toggleFollow = (id) => setFollows(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const finish = (skipped) => {
    app.navigate("discovery");
    toast.success(skipped ? "Selamat datang di ARTVAULT" : "Feed kamu sudah disesuaikan", { description: skipped ? undefined : picks.size + " kategori · " + follows.size + " artist diikuti" });
  };

  const suggested = ARTWORKS.slice(0, 6);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-6 md:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#E81E28] rounded-lg flex items-center justify-center flex-shrink-0">
            <Palette size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-extrabold leading-none tracking-tight">
            <span className="text-[#0A0A0B]">ART</span><span className="text-[#E81E28]">VAULT</span>
          </span>
        </div>
        <button onClick={() => finish(true)} data-goes-to="Lewati → Discovery" className="text-xs font-semibold text-[#A1A1AA] hover:text-[#0A0A0B] transition-colors">Lewati</button>
      </div>

      <div className="flex-1 flex justify-center px-6 pb-16">
        <div className="w-full" style={{ maxWidth: 680 }}>
          <div className="flex items-center gap-2 mb-7">
            {[1, 2].map(n => (
              <span key={n} className="h-1 flex-1 rounded-full transition-colors" style={{ background: n <= step ? "#E81E28" : "#E5E5E7" }} />
            ))}
          </div>
          <p className="text-[11px] font-extrabold text-[#C41A22] uppercase tracking-[0.18em] mb-3">Langkah {step} dari 2</p>

          {step === 1 ? (
            <>
              <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-2" style={{ fontSize: 30, lineHeight: 1.12 }}>Apa yang ingin kamu lihat?</h1>
              <p className="text-sm text-[#52525B] mb-8">Pilih minimal tiga kategori. Kami pakai ini untuk menyusun feed-mu.</p>
              <div className="flex flex-wrap gap-2.5 mb-10">
                {ONBOARD_CHIPS.map(c => {
                  const on = picks.has(c);
                  return (
                    <button
                      key={c}
                      onClick={() => toggleChip(c)}
                      data-goes-to={on ? "Batal pilih" : "Pilih kategori"}
                      className={"text-sm font-semibold px-4 py-2.5 rounded-full border transition-colors " +
                        (on ? "bg-[#E81E28] border-[#E81E28] text-white" : "bg-white border-[#E5E5E7] text-[#52525B] hover:border-[#A1A1AA] hover:text-[#0A0A0B]")}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => picks.size >= 3 && setStep(2)}
                  disabled={picks.size < 3}
                  data-goes-to="Lanjut → Langkah 2"
                  className={"text-sm font-bold px-8 py-3.5 rounded-full transition-colors " + (picks.size < 3 ? "bg-[#E5E5E7] text-[#A1A1AA]" : "bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white")}
                >
                  Lanjut
                </button>
                <span className="text-xs text-[#A1A1AA]">{picks.size < 3 ? "Pilih " + (3 - picks.size) + " lagi" : picks.size + " kategori dipilih"}</span>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-2" style={{ fontSize: 30, lineHeight: 1.12 }}>Artist untuk kamu ikuti</h1>
              <p className="text-sm text-[#52525B] mb-8">Berdasarkan kategori yang kamu pilih. Bisa diubah kapan saja.</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-10">
                {suggested.map(a => {
                  const on = follows.has(a.artistId);
                  return (
                    <div key={a.artistId} className="flex items-center gap-3 border border-[#E5E5E7] rounded-2xl p-3">
                      <Pic photoId={a.photoId} w={120} h={120} title={a.title} compact className="w-11 h-11 rounded-xl flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#0A0A0B] truncate">{a.artist}</p>
                        <p className="text-xs text-[#A1A1AA] truncate">{a.category} · {fmtNum(a.likes)} suka</p>
                      </div>
                      <button
                        onClick={() => toggleFollow(a.artistId)}
                        data-goes-to={on ? "Berhenti mengikuti" : "Ikuti artist"}
                        className={"text-xs font-bold px-4 py-2 rounded-full transition-colors flex-shrink-0 border " +
                          (on ? "bg-white border-[#E5E5E7] text-[#52525B] hover:border-[#A1A1AA]" : "bg-[#E81E28] border-[#E81E28] hover:bg-[#C41A22] text-white")}
                      >
                        {on ? "Mengikuti" : "Ikuti"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => finish(false)} data-goes-to="Selesai → Discovery" className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold px-8 py-3.5 rounded-full transition-colors">
                  Mulai Jelajahi
                </button>
                <button onClick={() => setStep(1)} data-goes-to="← Langkah 1" className="text-xs font-semibold text-[#52525B] hover:text-[#0A0A0B] transition-colors">Kembali</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ navigate }) {
  return (
    <footer className="bg-[#0A0A0B] text-white px-6 py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-[#E81E28] rounded-lg flex items-center justify-center flex-shrink-0">
              <Palette size={13} className="text-white" />
            </div>
            <span className="text-base font-extrabold"><span className="text-white">ART</span><span className="text-[#E81E28]">VAULT</span></span>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">Platform komunitas seni digital terdepan di Indonesia untuk artist dan penggemar seni.</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Navigasi</p>
          <div className="space-y-2">
            {[["discovery", "Discovery"], ["ranking", "Ranking"], ["commission", "Commission"], ["contest", "Kontes"], ["about", "Tentang"], ["login", "Masuk"], ["signup", "Daftar"]].map(([id, label]) => (
              <button key={id} onClick={() => navigate(id)} data-goes-to={"→ " + label} className="block text-xs text-white/50 hover:text-white transition-colors">
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Medium Populer</p>
          {["Digital Art", "Ilustrasi", "Lukisan", "Fotografi", "3D/CGI", "Komik"].map(m => (
            <button key={m} className="block text-xs text-white/50 hover:text-white transition-colors mb-2">{m}</button>
          ))}
        </div>
        <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Keamanan</p>
          <p className="text-xs text-white/50 leading-relaxed mb-4">Semua transaksi komisi dilindungi sistem escrow ARTVAULT. Dana aman hingga karya disetujui.</p>
          <button onClick={() => navigate("about")} data-goes-to="→ Halaman Tentang" className="text-xs text-[#E81E28] hover:text-white transition-colors font-semibold">Tentang ARTVAULT →</button>
        </div>
      </div>
      <div className="border-t border-white/10 pt-6 text-center">
        <p className="text-xs text-white/30">© 2026 ARTVAULT. Platform seni digital Indonesia. Semua hak dilindungi.</p>
      </div>
    </footer>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OVERLAYS
// ══════════════════════════════════════════════════════════════════════════════
function MenuRow({ Icon, label, note, hint, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      data-goes-to={hint}
      className={"flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm font-semibold transition-colors text-left " +
        (danger ? "text-[#C41A22] hover:bg-[#FEF2F3] active:bg-[#FDE3E5]" : "text-[#52525B] hover:bg-gray-50 hover:text-[#0A0A0B] active:bg-[#F5F5F5]")}
    >
      <Icon size={15} className="flex-shrink-0" />
      <span className="min-w-0">
        {label}
        {note && <span className="block text-xs font-normal text-[#A1A1AA]">{note}</span>}
      </span>
    </button>
  );
}

function LoginModal({ onClose, onDone }) {
  const app = useApp();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);

  const submit = () => {
    if (busy) return;
    setFail(false);
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (email.trim().length > 2 && pw.length >= 6) onDone();
      else { setFail(true); toast.error("Gagal masuk", { description: "Email atau kata sandi salah" }); }
    }, 900);
  };
  const leave = (screen) => { onClose(); app.navigate(screen); };

  return (
    <Modal title="Masuk ke ARTVAULT" onClose={onClose} width={420}>
      <div className="p-6">
        <p className="text-sm text-[#52525B] leading-relaxed mb-5">
          Tindakanmu butuh akun. Masuk dulu, lalu kami lanjutkan tindakan yang tertunda.
        </p>
        <div className="flex flex-col gap-4">
          <AuthField label="Email atau username" value={email} onChange={setEmail} placeholder="nama@email.com" invalid={fail} onEnter={submit} autoFocus />
          <div>
            <AuthField
              label="Kata sandi" type={show ? "text" : "password"} value={pw} onChange={setPw}
              placeholder="Masukkan kata sandi" invalid={fail} onEnter={submit}
              trailing={<EyeToggle on={show} onToggle={() => setShow(!show)} />}
            />
            {fail && <HelpLine tone="error">Email atau kata sandi salah</HelpLine>}
          </div>
          <div className="flex justify-end -mt-1">
            <button onClick={() => leave("forgot")} data-goes-to="→ Lupa kata sandi" className="text-xs font-semibold text-[#C41A22] hover:underline">Lupa kata sandi?</button>
          </div>
          <PillButton onClick={submit} busy={busy} goesTo="Masuk → lanjutkan tindakan tertunda">{busy ? "Memeriksa..." : "Masuk"}</PillButton>
        </div>

        <OrDivider />
        <SocialButtons />

        <p className="text-xs text-[#52525B] text-center mt-6">
          Belum punya akun? <button onClick={() => leave("signup")} data-goes-to="→ Daftar" className="font-bold text-[#C41A22] hover:underline">Daftar</button>
        </p>
      </div>
    </Modal>
  );
}

function NotifDropdown({ rect, onClose }) {
  const app = useApp();
  return (
    <Popover rect={rect} onClose={onClose} width={330}>
      <div className="px-4 py-2.5 border-b border-[#E5E5E7] flex items-center justify-between">
        <p className="text-sm font-bold text-[#0A0A0B]">Notifikasi</p>
        <button onClick={() => { toast.success("Semua ditandai terbaca"); onClose(); }} data-goes-to="Tandai terbaca + toast" className="text-xs font-semibold text-[#52525B] hover:text-[#0A0A0B] transition-colors">Tandai terbaca</button>
      </div>
      <div className="max-h-[340px] overflow-y-auto">
        {NOTIFS.map(n => {
          const art = n.art ? ARTWORKS.find(a => a.id === n.art) : null;
          const order = n.order ? ORDERS.find(o => o.id === n.order) : null;
          const hint = n.kind === "order" ? "→ Detail Pesanan" : n.kind === "comment" ? "→ Komentar karya" : "→ Halaman Karya";
          return (
            <button
              key={n.id}
              onClick={() => { onClose(); if (order) app.openOrder(order); else if (art) app.openArtwork(art); }}
              data-goes-to={hint}
              className="flex items-start gap-2.5 w-full px-4 py-3 border-b border-[#E5E5E7] last:border-0 hover:bg-gray-50 active:bg-[#F5F5F5] transition-colors text-left"
            >
              <Av bg={n.bg} initials={n.init} size={30} />
              <span className="min-w-0 flex-1">
                <span className="text-sm text-[#0A0A0B] leading-snug block"><strong className="font-bold">{n.who}</strong> {n.text}</span>
                <span className="text-xs text-[#A1A1AA]">{n.ago}</span>
              </span>
              {art && <Pic photoId={art.photoId} w={64} h={64} title={art.title} compact className="w-8 h-8 rounded flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </Popover>
  );
}

function AvatarMenu({ rect, onClose }) {
  const app = useApp();
  return (
    <Popover rect={rect} onClose={onClose} width={230}>
      <div className="px-3.5 py-3 border-b border-[#E5E5E7] flex items-center gap-2.5">
        <Av bg="#E81E28" initials="AU" size={34} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#0A0A0B] truncate">{app.loggedIn ? "Artvault User" : "Tamu"}</p>
          <p className="text-xs text-[#A1A1AA]">{app.loggedIn ? "@artvault_user" : "Belum masuk"}</p>
        </div>
      </div>
      <div className="py-1">
        <MenuRow Icon={User}  label="Profil Saya"        hint="→ Profil" onClick={() => { onClose(); app.requireAuth(() => app.openProfile("me")); }} />
        <MenuRow Icon={Stamp} label="Watermark Generator" hint="→ Watermark Generator" onClick={() => { onClose(); app.navigate("watermark"); }} />
        <MenuRow Icon={Settings} label="Pengaturan"      hint="→ Pengaturan" onClick={() => { onClose(); app.requireAuth(() => app.navigate("settings")); }} />
      </div>
      <div className="border-t border-[#E5E5E7] py-1">
        {app.loggedIn ? (
          <MenuRow Icon={LogOut} danger label="Keluar" hint="Keluar + toast" onClick={() => { onClose(); app.logout(); }} />
        ) : (
          <MenuRow Icon={LogOut} label="Masuk" hint="Modal masuk" onClick={() => { onClose(); app.requireAuth(() => toast.success("Berhasil masuk")); }} />
        )}
      </div>
    </Popover>
  );
}

function CollectionsPopover({ rect, artwork, onClose }) {
  const app = useApp();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  return (
    <Popover rect={rect} onClose={onClose} width={250}>
      <div className="px-3.5 py-2.5 border-b border-[#E5E5E7]">
        <p className="text-sm font-bold text-[#0A0A0B]">Simpan ke koleksi</p>
        <p className="text-xs text-[#A1A1AA] truncate">{artwork.title}</p>
      </div>
      <div className="py-1 max-h-[220px] overflow-y-auto">
        {app.collections.map(c => (
          <MenuRow
            key={c.id}
            Icon={c.ids.includes(artwork.id) ? Check : Folder}
            label={c.name}
            note={c.ids.length + " karya"}
            hint="Simpan + toast"
            onClick={() => { app.saveTo(c, artwork); onClose(); }}
          />
        ))}
      </div>
      <div className="border-t border-[#E5E5E7] p-2.5">
        {creating ? (
          <div className="flex gap-1.5">
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && name.trim()) { app.createCollection(name.trim(), artwork); onClose(); } }}
              placeholder="Nama koleksi"
              className="flex-1 min-w-0 border border-[#E5E5E7] rounded-full px-3 py-1.5 text-xs outline-none focus:border-[#A1A1AA] transition-colors"
            />
            <button
              onClick={() => { if (name.trim()) { app.createCollection(name.trim(), artwork); onClose(); } }}
              data-goes-to="Buat + simpan"
              className="bg-[#E81E28] hover:bg-[#C41A22] text-white text-xs font-bold px-3 rounded-full transition-colors flex-shrink-0"
            >
              Buat
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            data-goes-to="Kolom nama koleksi baru"
            className="flex items-center gap-2 w-full text-sm font-semibold text-[#C41A22] hover:bg-[#FEF2F3] active:bg-[#FDE3E5] rounded-lg px-1.5 py-1.5 transition-colors"
          >
            <FolderPlus size={15} /> Buat Koleksi Baru
          </button>
        )}
      </div>
    </Popover>
  );
}

function SharePopover({ rect, artwork, onClose }) {
  const rows = [
    { Icon: Link, label: "Salin Tautan", hint: "Salin + toast emerald", act: () => toast.success("Tautan disalin", { description: "artvault.id/karya/" + artwork.id }) },
    { Icon: MessageCircle, label: "WhatsApp", hint: "Bagikan ke WhatsApp", act: () => toast.success("Dibagikan ke WhatsApp") },
    { Icon: X, label: "X", hint: "Bagikan ke X", act: () => toast.success("Dibagikan ke X") },
    { Icon: Share2, label: "Facebook", hint: "Bagikan ke Facebook", act: () => toast.success("Dibagikan ke Facebook") },
  ];
  return (
    <Popover rect={rect} onClose={onClose} width={220}>
      <div className="py-1">
        {rows.map(r => <MenuRow key={r.label} Icon={r.Icon} label={r.label} hint={r.hint} onClick={() => { r.act(); onClose(); }} />)}
      </div>
    </Popover>
  );
}

function MoreMenu({ rect, artwork, onClose }) {
  const app = useApp();
  return (
    <Popover rect={rect} onClose={onClose} width={220}>
      <div className="py-1">
        <MenuRow Icon={Download} label="Unduh" note="PNG · 2400px" hint="Unduh + toast" onClick={() => { toast.success("Berkas diunduh", { description: artwork.title + ".png" }); onClose(); }} />
        <MenuRow Icon={Copy} label="Sematkan" note="Salin kode embed" hint="Salin kode + toast" onClick={() => { toast.success("Kode sematan disalin"); onClose(); }} />
      </div>
      <div className="border-t border-[#E5E5E7] py-1">
        <MenuRow
          Icon={Flag} danger label="Laporkan" hint="Dialog konfirmasi"
          onClick={() => {
            onClose();
            app.confirm({
              title: "Laporkan karya ini?",
              body: "Tim moderasi ARTVAULT akan meninjau “" + artwork.title + "” dalam 1×24 jam.",
              label: "Laporkan",
              onOk: () => toast.success("Laporan terkirim", { description: "Kami kabari hasil peninjauan lewat notifikasi" }),
            });
          }}
        />
      </div>
    </Popover>
  );
}

function Lightbox({ artwork, onClose }) {
  useEsc(onClose);
  return (
    <div className="fixed inset-0 z-[130] bg-black/90 flex items-center justify-center p-8" onClick={onClose}>
      <button
        onClick={onClose}
        data-goes-to="Tutup (Esc / klik luar)"
        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors"
      >
        <X size={16} />
      </button>
      <Pic
        photoId={artwork.photoId}
        w={1600}
        h={Math.round(1600 / artwork.aspect)}
        title={artwork.title}
        eager
        onClick={e => e.stopPropagation()}
        className="max-w-full"
        style={{ aspectRatio: String(artwork.aspect), height: "min(84vh, 900px)", maxWidth: "92vw", background: "transparent" }}
      />
      <p className="absolute bottom-5 left-0 right-0 text-center text-white/70 text-xs">{artwork.title} · {artwork.artist}</p>
    </div>
  );
}

function SubmitModal({ onClose }) {
  const app = useApp();
  const [pick, setPick] = useState(null);
  const mine = ARTWORKS.slice(0, 8);
  return (
    <Modal title="Kirim Karya ke Kontes" onClose={onClose} width={560}>
      <div className="p-5 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => { onClose(); app.navigate("upload"); }}
            data-goes-to="→ Alur Unggah"
            className="flex-1 border border-[#E5E5E7] text-[#0A0A0B] text-sm font-semibold py-2.5 rounded-full hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors flex items-center justify-center gap-1.5"
          >
            <Upload size={13} /> Unggah baru
          </button>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2">Pilih dari karya saya</p>
          <div className="grid grid-cols-4 gap-1.5">
            {mine.map(a => (
              <button
                key={a.id}
                onClick={() => setPick(a.id)}
                data-goes-to="Pilih karya"
                className={"relative aspect-square overflow-hidden rounded-lg bg-[#F5F5F5] transition-all " + (pick === a.id ? "ring-2 ring-[#E81E28]" : "hover:opacity-80")}
              >
                <Pic photoId={a.photoId} w={160} h={160} title={a.title} className="w-full h-full" />
                {pick === a.id && (
                  <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#E81E28] text-white flex items-center justify-center"><Check size={11} /></span>
                )}
              </button>
            ))}
          </div>
        </div>
        <Tip text={pick ? "Kirim karya terpilih" : "Pilih satu karya lebih dulu"}>
          <button
            disabled={!pick}
            onClick={() => { onClose(); toast.success("Karya terkirim ke kontes", { description: "Gelombang Nusantara 2026 · menunggu kurasi" }); }}
            data-goes-to="Kirim + toast sukses"
            className={"w-full text-sm font-bold py-2.5 rounded-full transition-colors " +
              (pick ? "bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white" : "bg-[#F5F5F5] text-[#A1A1AA] border border-[#E5E5E7] cursor-not-allowed")}
          >
            Kirim Karya
          </button>
        </Tip>
      </div>
    </Modal>
  );
}

function ParticipantsModal({ onClose }) {
  const app = useApp();
  return (
    <Modal title="Peserta Kontes (1.247)" onClose={onClose} width={420}>
      <div className="max-h-[420px] overflow-y-auto">
        {PARTICIPANTS.map(p => (
          <button
            key={p.id + p.name}
            onClick={() => { onClose(); app.openProfile(p.id); }}
            data-goes-to="→ Profil artist"
            className="flex items-center gap-3 w-full px-5 py-3 border-b border-[#E5E5E7] last:border-0 hover:bg-gray-50 active:bg-[#F5F5F5] transition-colors text-left"
          >
            <Av bg={p.bg} initials={p.init} size={32} />
            <span className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-[#0A0A0B] block truncate">{p.name}</span>
              <span className="text-xs text-[#A1A1AA]">{p.works} karya dikirim</span>
            </span>
            <ChevronRight size={14} className="text-[#A1A1AA] flex-shrink-0" />
          </button>
        ))}
      </div>
    </Modal>
  );
}

function ConfirmDialog({ spec, onClose }) {
  return (
    <Modal title={spec.title} onClose={onClose} width={400}>
      <div className="p-5">
        <p className="text-sm text-[#52525B] leading-relaxed mb-5">{spec.body}</p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            data-goes-to="Tutup dialog"
            className="flex-1 bg-white border border-[#E5E5E7] text-[#0A0A0B] text-sm font-semibold py-2.5 rounded-full hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors"
          >
            Kembali
          </button>
          <button
            onClick={() => { onClose(); spec.onOk(); }}
            data-goes-to="Konfirmasi + toast"
            className="flex-1 bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold py-2.5 rounded-full transition-colors"
          >
            {spec.label}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
const DEEP_LINK = (() => {
  try {
    const q = new URLSearchParams(location.search + "&" + location.hash.replace(/^#/, ""));
    const screen = q.get("screen");
    return { screen: screen || "discovery", auth: q.get("auth") !== "out" && !AUTH_SCREENS.includes(screen || "") };
  } catch (e) { return { screen: "discovery", auth: true }; }
})();

const EXPORT_FRAMES = [
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

function ExportAll() {
  return (
    <div style={{ background: "#FFFFFF" }}>
      <style>{".av-frame aside{height:100% !important}.av-frame .av-mobilenav,.av-frame .md\\:hidden{display:none !important}"}</style>
      {EXPORT_FRAMES.map(([label, screen, params, auth]) => (
        <div key={label} style={{ width: 1440, margin: "0 auto 96px" }}>
          <p style={{ font: "700 13px 'Plus Jakarta Sans', system-ui", color: "#A1A1AA", padding: "0 0 10px", letterSpacing: "0.04em" }}>{label}</p>
          <div className="av-frame" style={{ position: "relative", transform: "translate(0,0)", border: "1px solid #E5E5E7", overflow: "hidden", background: "#FFFFFF" }}>
            <App screen0={screen} params0={params} auth0={auth} exportMode />
          </div>
        </div>
      ))}
    </div>
  );
}

function App(props = {}) {
  const [view, setView] = useState({ screen: props.screen0 || DEEP_LINK.screen, params: props.params0 || {} });
  const [stack, setStack] = useState([]);
  const [liked, setLiked] = useState(new Set());
  const [saved, setSaved] = useState(new Set());
  const [followed, setFollowed] = useState(new Set());
  const [collections, setCollections] = useState(COLLECTION_SEED);
  const [loggedIn, setLoggedIn] = useState(props.auth0 !== undefined ? props.auth0 : DEEP_LINK.auth);
  const [viewState, setViewState] = useState("normal");
  const [annotate, setAnnotate] = useState(false);
  const [overlay, setOverlay] = useState(null);
  const pending = useRef(null);
  const restore = useRef(null);
  const [, iconTick] = useState(0);

  useEffect(() => {
    if (window.lucide) return;
    const t = setInterval(() => { if (window.lucide) { clearInterval(t); iconTick(n => n + 1); } }, 60);
    setTimeout(() => clearInterval(t), 8000);
    return () => clearInterval(t);
  }, []);

  // scroll restore
  useEffect(() => {
    if (restore.current !== null) {
      const y = restore.current;
      restore.current = null;
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y })));
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [view]);

  const push = useCallback((screen, params = {}) => {
    setStack(s => [...s, { ...view, scroll: window.scrollY }]);
    setOverlay(null);
    setView({ screen, params });
  }, [view]);

  const back = useCallback(() => {
    setStack(s => {
      if (!s.length) { setView({ screen: "discovery", params: {} }); return s; }
      const prev = s[s.length - 1];
      restore.current = prev.scroll;
      setView({ screen: prev.screen, params: prev.params });
      return s.slice(0, -1);
    });
    setOverlay(null);
  }, []);

  const requireAuth = useCallback((fn) => {
    if (loggedIn) { fn(); return; }
    pending.current = fn;
    setOverlay({ kind: "login" });
  }, [loggedIn]);

  const app = {
    screen: view.screen,
    params: view.params,
    viewState, liked, saved, followed, collections, loggedIn,
    navigate: (s, p) => push(s, p),
    signIn: () => setLoggedIn(true),
    back, requireAuth,
    retry: () => setViewState("normal"),
    openArtwork: (a) => push("artwork", { artwork: a }),
    openProfile: () => push("profile"),
    openCommission: (p) => push("commission", p),
    openOrder: (o) => push("order", { order: o }),
    openSearch: (q) => push("search", { q }),
    openCategory: (c) => push("category", { category: c }),
    openCollection: (c) => push("collection", { collection: c }),
    toggleLike: (a) => {
      setLiked(s => {
        const n = new Set(s);
        n.has(a.id) ? n.delete(a.id) : n.add(a.id);
        toast.success(n.has(a.id) ? "Ditambahkan ke Favorit" : "Dihapus dari Favorit", { description: a.title });
        return n;
      });
    },
    toggleFollow: (id) => {
      setFollowed(s => {
        const n = new Set(s);
        n.has(id) ? n.delete(id) : n.add(id);
        toast.success(n.has(id) ? "Kamu mengikuti artist ini" : "Berhenti mengikuti");
        return n;
      });
    },
    saveTo: (c, a) => {
      setCollections(list => list.map(x => x.id === c.id ? { ...x, ids: x.ids.includes(a.id) ? x.ids : [...x.ids, a.id] } : x));
      setSaved(s => new Set(s).add(a.id));
      toast.success("Disimpan ke " + c.name, { description: a.title });
    },
    createCollection: (name, a) => {
      setCollections(list => [...list, { id: "c" + Date.now(), name, ids: [a.id] }]);
      setSaved(s => new Set(s).add(a.id));
      toast.success("Koleksi “" + name + "” dibuat", { description: a.title + " disimpan" });
    },
    logout: () => { setLoggedIn(false); toast("Kamu telah keluar"); },
    confirm: (spec) => setOverlay({ kind: "confirm", spec }),
    openNotifs: (rect) => setOverlay({ kind: "notifs", rect }),
    openAvatarMenu: (rect) => setOverlay({ kind: "avatar", rect }),
    openCollections: (artwork, rect) => setOverlay({ kind: "collections", artwork, rect }),
    openShare: (artwork, rect) => setOverlay({ kind: "share", artwork, rect }),
    openMore: (artwork, rect) => setOverlay({ kind: "more", artwork, rect }),
    openLightbox: (artwork) => setOverlay({ kind: "lightbox", artwork }),
    openSubmit: () => setOverlay({ kind: "submit" }),
    openParticipants: () => setOverlay({ kind: "participants" }),
  };

  const closeOverlay = () => setOverlay(null);
  const screen = view.screen;
  const chrome = !props.exportMode;

  if (!props.screen0 && DEEP_LINK.screen === "all") return <ExportAll />;

  if (AUTH_SCREENS.includes(screen)) {
    return (
      <AppCtx.Provider value={app}>
        <div className={chrome ? "min-h-screen bg-white" : "bg-white"} style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
          {chrome && <Toaster />}
          {screen === "login"      && <LoginScreen />}
          {screen === "signup"     && <SignupScreen />}
          {screen === "forgot"     && <ForgotScreen />}
          {screen === "checkEmail" && <CheckEmailScreen />}
          {screen === "reset"      && <ResetScreen />}
          {screen === "onboarding" && <OnboardingScreen />}
          <AnnotationLayer on={annotate} />
          {chrome && <DevBar value={viewState} onChange={setViewState} annotate={annotate} onAnnotate={setAnnotate} />}
        </div>
      </AppCtx.Provider>
    );
  }

  return (
    <AppCtx.Provider value={app}>
      <div className={chrome ? "min-h-screen bg-white" : "bg-white"} style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
        {chrome && <Toaster />}

        <div className="hidden md:block"><Sidebar /></div>
        <MobileTopBar />

        <main className={"md:ml-60 pt-12 md:pt-0 pb-16 md:pb-0 flex flex-col " + (chrome ? "min-h-screen" : "")}>
          <div className="flex-1">
            {!["artwork", "upload", "watermark"].includes(screen) && <TopCluster />}
            {screen === "discovery"   && <DiscoveryScreen />}
            {screen === "ranking"     && <RankingScreen />}
            {screen === "commission"  && <CommissionScreen />}
            {screen === "contest"     && <ContestScreen />}
            {screen === "order"       && <OrderScreen />}
            {screen === "upload"      && <UploadScreen />}
            {screen === "watermark"   && <WatermarkScreen />}
            {screen === "favorites"   && <FavoritesScreen />}
            {screen === "collections" && <CollectionsScreen />}
            {screen === "collection"  && <CollectionScreen />}
            {screen === "search"      && <SearchScreen />}
            {screen === "category"    && <CategoryScreen />}
            {screen === "settings"    && <SettingsScreen />}
            {screen === "profile"     && <ProfileScreen />}
            {screen === "about"       && <AboutScreen navigate={app.navigate} />}
            {screen === "artwork"     && view.params.artwork && <ArtworkScreen artwork={view.params.artwork} />}
          </div>
          <Footer navigate={app.navigate} />
        </main>

        <MobileNav />

        {overlay && overlay.kind === "login"        && <LoginModal onClose={closeOverlay} onDone={() => { setLoggedIn(true); closeOverlay(); const fn = pending.current; pending.current = null; toast.success("Berhasil masuk", { description: fn ? "Tindakanmu dilanjutkan" : undefined }); if (fn) setTimeout(fn, 60); }} />}
        {overlay && overlay.kind === "notifs"       && <NotifDropdown rect={overlay.rect} onClose={closeOverlay} />}
        {overlay && overlay.kind === "avatar"       && <AvatarMenu rect={overlay.rect} onClose={closeOverlay} />}
        {overlay && overlay.kind === "collections"  && <CollectionsPopover rect={overlay.rect} artwork={overlay.artwork} onClose={closeOverlay} />}
        {overlay && overlay.kind === "share"        && <SharePopover rect={overlay.rect} artwork={overlay.artwork} onClose={closeOverlay} />}
        {overlay && overlay.kind === "more"         && <MoreMenu rect={overlay.rect} artwork={overlay.artwork} onClose={closeOverlay} />}
        {overlay && overlay.kind === "lightbox"     && <Lightbox artwork={overlay.artwork} onClose={closeOverlay} />}
        {overlay && overlay.kind === "submit"       && <SubmitModal onClose={closeOverlay} />}
        {overlay && overlay.kind === "participants" && <ParticipantsModal onClose={closeOverlay} />}
        {overlay && overlay.kind === "confirm"      && <ConfirmDialog spec={overlay.spec} onClose={closeOverlay} />}

        <AnnotationLayer on={annotate} />
        {chrome && <DevBar value={viewState} onChange={setViewState} annotate={annotate} onAnnotate={setAnnotate} />}
      </div>
    </AppCtx.Provider>
  );
}
window.ArtvaultApp = App;
