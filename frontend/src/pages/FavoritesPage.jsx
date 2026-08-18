import React from 'react';
import { useApp } from '../context/AppContext';
import { ARTWORKS } from '../data/mockData';
import { JustifiedGrid } from '../components/ui/JustifiedGrid';
import { EmptyBlock } from '../components/ui/FeedbackBlocks';
import { ArrowLeft } from '../components/ui/Icons';

export function SimpleGridScreen({ title, kicker, artworks, empty }) {
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

export function FavoritesPage() {
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
