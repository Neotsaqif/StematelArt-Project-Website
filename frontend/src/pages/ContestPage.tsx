import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ARTWORKS, CONTEST_END } from '../data/mockData';
import { fadeStyle, TOP_SCRIM } from '../utils/helpers';
import { Pic } from '../components/ui/Pic';
import { Av } from '../components/ui/Avatar';
import { Clock, Lock, Crown, BookOpen, CheckCircle, Star } from '../components/ui/Icons';

export function Countdown() {
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

export function ContestPage() {
  const app = useApp();
  const viewState = app.viewState;
  const [ended, setEnded] = useState(false);
  const submissions = ARTWORKS.slice(0, 6);
  const winner = ARTWORKS[3];

  const SK = "bg-[#F5F5F5]";

  const phases = [
    { v: false, label: "Kontes Aktif" },
    { v: true, label: "Kontes Berakhir" }
  ];

  return (
    <div>
      {/* Phase switch */}
      <div className="px-6 pt-1 pb-3 flex items-center gap-2">
        {phases.map(({ v, label }) => (
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
