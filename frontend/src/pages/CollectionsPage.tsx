import React from 'react';
import { useApp } from '../context/AppContext';
import { ARTWORKS } from '../data/mockData';
import { Pic } from '../components/ui/Pic';
import { ArrowLeft, Folder } from '../components/ui/Icons';

export function CollectionsPage() {
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
