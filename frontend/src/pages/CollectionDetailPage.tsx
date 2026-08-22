import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ARTWORKS } from '../data/mockData';
import { SimpleGridScreen } from './FavoritesPage';
import { EmptyBlock } from '../components/ui/FeedbackBlocks';
import { Artwork } from '../types';

export function CollectionDetailPage() {
  const app = useApp();
  const { id } = useParams<{ id: string }>();
  
  // Find collection by URL parameter, or context state fallback, or default to first collection
  const c = app.collections.find(col => col.id === id) || app.params?.collection || app.collections[0];
  const list: Artwork[] = c ? (c.ids.map(colId => ARTWORKS.find(a => a.id === colId)).filter((a): a is Artwork => Boolean(a))) : [];
  
  return (
    <SimpleGridScreen
      title={c ? c.name : "Koleksi"}
      kicker={<p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1">Koleksi</p>}
      artworks={list}
      empty={<EmptyBlock title="Folder masih kosong" hint="Tambahkan karya lewat ikon + pada kartu karya." />}
    />
  );
}
