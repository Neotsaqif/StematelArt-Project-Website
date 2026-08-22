// Helper utilities, toast system, and formatting functions

export const imgUrl = (photoId: string, w: number, h: number): string => {
  const bundled = ((window as any).__resources || {})["ph_" + photoId];
  if (bundled) return bundled;
  return "https://images.unsplash.com/photo-" + photoId + "?w=" + w + "&h=" + h + "&fit=crop&auto=format&q=80";
};

export const fmtNum = (n: number): string => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n));
export const fmtPts = (n: number): string => n.toLocaleString("id-ID");
export const lifetimeScore = (a: { likes: number; comments: number; views: number }): number =>
  a.likes * 12 + a.comments * 30 + Math.round(a.views * 0.6);

export const SINCE: Record<number, string> = {
  1: "14 Februari 2024", 2: "3 Maret 2024", 3: "27 Januari 2024", 4: "9 April 2024",
  5: "18 Mei 2024", 6: "2 Desember 2023", 7: "21 Juni 2024", 8: "7 Juli 2024",
  9: "11 November 2023", 10: "29 Agustus 2024", 11: "5 September 2024", 12: "16 Oktober 2024",
  13: "23 Januari 2025", 14: "8 Februari 2025", 15: "19 Maret 2025", 16: "4 April 2025",
  17: "30 Mei 2025", 18: "12 Juni 2025",
};

export const FADE_MASK = "linear-gradient(to bottom, #000 0%, #000 46%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0) 100%)";
export const fadeStyle = { WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK };
export const TOP_SCRIM = "linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 34%, rgba(0,0,0,0) 56%)";

// Justified Grid Engine calculation
interface GridItem {
  id: number;
  aspect: number;
}

interface ComputedCell {
  id: number;
  w: number;
  h: number;
}

export function computeRows(items: GridItem[], containerW: number, targetH: number, gutter: number): ComputedCell[][] {
  if (containerW <= 0) return [];
  const rows: ComputedCell[][] = [];
  let row: GridItem[] = [];
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

// Toast Bus System
interface ToastItem {
  id: number;
  type: string;
  title: string;
  description?: string;
}

type ToastCallback = (items: ToastItem[]) => void;

export const toastBus = {
  list: [] as ToastItem[],
  subs: new Set<ToastCallback>(),
  n: 0
};

export const emitToast = () => toastBus.subs.forEach(f => f([...toastBus.list]));

export function pushToast(type: string, title: string, opts?: { description?: string }) {
  const id = ++toastBus.n;
  toastBus.list = [...toastBus.list, { id, type, title, description: opts && opts.description }];
  emitToast();
  setTimeout(() => { toastBus.list = toastBus.list.filter(t => t.id !== id); emitToast(); }, 3000);
}

interface ToastFn {
  (m: string, o?: { description?: string }): void;
  success: (m: string, o?: { description?: string }) => void;
  error: (m: string, o?: { description?: string }) => void;
  info: (m: string, o?: { description?: string }) => void;
}

export const toast: ToastFn = Object.assign(
  (m: string, o?: { description?: string }) => pushToast("default", m, o),
  {
    success: (m: string, o?: { description?: string }) => pushToast("success", m, o),
    error:   (m: string, o?: { description?: string }) => pushToast("error", m, o),
    info:    (m: string, o?: { description?: string }) => pushToast("info", m, o),
  }
);

export const TOAST_SKIN: Record<string, { bg: string; bd: string; fg: string }> = {
  success: { bg: "#ECFDF5", bd: "#A7F3D0", fg: "#059669" },
  error:   { bg: "#FEF2F3", bd: "#F7C9CC", fg: "#C41A22" },
  info:    { bg: "#ffffff", bd: "#E5E5E7", fg: "#0A0A0B" },
  default: { bg: "#ffffff", bd: "#E5E5E7", fg: "#0A0A0B" },
};

// Auth helper functions
export const emailOk = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const pwStrength = (v: string): number => (v.length === 0 ? 0 : v.length < 8 ? 1 : /[^a-zA-Z]/.test(v) ? 3 : 2);
