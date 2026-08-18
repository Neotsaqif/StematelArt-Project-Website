import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PROFILE, ARTWORKS } from '../data/mockData';
import { fadeStyle, TOP_SCRIM, fmtNum } from '../utils/helpers';
import { Pic } from '../components/ui/Pic';
import { JustifiedGrid, MobileGrid } from '../components/ui/JustifiedGrid';
import { ArrowLeft, Check, MapPin, Link2 } from '../components/ui/Icons';

export function ProfilePage() {
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
