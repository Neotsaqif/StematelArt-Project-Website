import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ARTWORKS, TAG_POOL } from '../../data/mockData';
import { Search, Upload, Bell, Tag } from '../ui/Icons';
import { Av } from '../ui/Avatar';
import { Pic } from '../ui/Pic';

export function TopCluster() {
  const app = useApp();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);

  const sug = useMemo(() => {
    const k = q.trim().toLowerCase().replace(/^#/, "");
    if (!k) return null;
    const tags = TAG_POOL.filter(t => t.includes(k)).slice(0, 4);
    const artists = [...new Set(ARTWORKS.map(a => a.artist))].filter(a => a.toLowerCase().includes(k)).slice(0, 3);
    const works = ARTWORKS.filter(a => a.title.toLowerCase().includes(k)).slice(0, 3);
    return { tags, artists, works };
  }, [q]);

  const empty = sug && !sug.tags.length && !sug.artists.length && !sug.works.length;

  const go = (val) => { setQ(""); setFocus(false); app.openSearch(val); };

  return (
    <div className="hidden md:flex items-center gap-3 px-6 py-4 bg-white border-b border-[#E5E5E7] sticky top-0 z-30">
      {/* Search bar */}
      <div className="relative flex-1 max-w-md">
        <div className="flex items-center gap-2 bg-[#F4F4F5] rounded-full px-3.5 py-2.5 transition-colors focus-within:bg-white focus-within:border-[#A1A1AA] border border-transparent">
          <Search size={16} className="text-[#A1A1AA] flex-shrink-0" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => setFocus(true)}
            onKeyDown={e => { if (e.key === "Enter" && q.trim()) go(q.trim()); }}
            className="bg-transparent text-sm placeholder-[#A1A1AA] outline-none w-full text-[#0A0A0B]"
            placeholder="Cari karya, artist, atau #tag..."
          />
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
