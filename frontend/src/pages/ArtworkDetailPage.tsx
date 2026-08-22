import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ARTWORKS, MOCK_COMMENTS } from '../data/mockData';
import { fmtNum, toast } from '../utils/helpers';
import { Pic } from '../components/ui/Pic';
import { Av } from '../components/ui/Avatar';
import { ArrowLeft, Heart, Share2, MessageCircle, Bookmark, MoreHorizontal, Eye, Check, Send, AlertTriangle, Reply, X } from '../components/ui/Icons';

export function ArtworkDetailPage({ artwork }) {
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
