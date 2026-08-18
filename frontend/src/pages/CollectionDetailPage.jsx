import React from 'react';
import { useApp } from '../context/AppContext';
import { ARTWORKS } from '../data/mockData';
import { SimpleGridScreen } from './FavoritesPage';
import { EmptyBlock } from '../components/ui/FeedbackBlocks';

export function CollectionDetailPage() {
  const app = useApp();
  const c = app.params.collection || app.collections[0];
  const list = c.ids.map(id => ARTWORKS.find(a => a.id === id)).filter(Boolean);
  return (
    <SimpleGridScreen
      title={c.name}
      kicker={<p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1">Koleksi</p>}
      artworks={list}
      empty={<EmptyBlock title="Folder masih kosong" hint="Tambahkan karya lewat ikon + pada kartu karya." />}
    />
  );
}
