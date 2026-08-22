import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ARTWORKS, CATEGORIES_DATA } from '../data/mockData';
import { fadeStyle, TOP_SCRIM } from '../utils/helpers';
import { JustifiedGrid, MobileGrid } from '../components/ui/JustifiedGrid';
import { SkeletonGrid, EmptyBlock, ErrorBlock } from '../components/ui/FeedbackBlocks';
import { Pic } from '../components/ui/Pic';
import { Av } from '../components/ui/Avatar';
import { Star } from '../components/ui/Icons';

export function DiscoveryPage() {
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

  const SK = "bg-[#F5F5F5]";

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
