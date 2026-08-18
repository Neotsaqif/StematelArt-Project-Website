import React from 'react';
import { useApp } from '../context/AppContext';
import { ARTWORKS } from '../data/mockData';
import { SimpleGridScreen } from './FavoritesPage';
import { EmptyBlock } from '../components/ui/FeedbackBlocks';

export function CategoryPage() {
  const app = useApp();
  const name = app.params.category;
  const list = ARTWORKS.filter(a => a.category === name);
  return (
    <SimpleGridScreen
      title={name}
      kicker={<p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1">Kategori</p>}
      artworks={list}
      empty={<EmptyBlock title="Karya tidak ditemukan" hint="Kategori ini belum punya karya. Coba kategori lain dari Discovery." />}
    />
  );
}
