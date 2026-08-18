import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { computeRows, fmtNum } from '../../utils/helpers';
import { Pic } from './Pic';
import { Heart, Plus, Eye } from './Icons';

export function JustifiedGrid({ artworks, targetHeight = 240 }) {
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

export function MobileGrid({ artworks, onArtworkClick }) {
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
