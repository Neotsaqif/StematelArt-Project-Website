import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { COMM_ARTISTS, ORDERS, REOPEN } from '../data/mockData';
import { Av } from '../components/ui/Avatar';
import { Pic } from '../components/ui/Pic';
import { EmptyBlock, ErrorBlock, Tip } from '../components/ui/FeedbackBlocks';
import { Check, Clock, RefreshCw, X, Lock, ImageIcon, Send, Star, Briefcase } from '../components/ui/Icons';
import { toast } from '../utils/helpers';

export function TierPanel({ tier, selected, onSelect }) {
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

export function CommissionForm({ artist, tier, onClear }) {
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

export function CommissionPage() {
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

  const SK = "bg-[#F5F5F5]";

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
