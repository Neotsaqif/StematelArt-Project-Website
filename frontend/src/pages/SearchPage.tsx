import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ARTWORKS } from '../data/mockData';
import { JustifiedGrid } from '../components/ui/JustifiedGrid';
import { EmptyBlock } from '../components/ui/FeedbackBlocks';
import { ArrowLeft, Search } from '../components/ui/Icons';

export function SearchPage() {
  const app = useApp();
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") || app.params?.q || "").trim();
  const key = q.replace(/^#/, "").toLowerCase();
  const results = ARTWORKS.filter(a =>
    a.title.toLowerCase().includes(key) || a.artist.toLowerCase().includes(key) ||
    a.category.toLowerCase().includes(key) || a.tags.some(t => t.includes(key)));

  return (
    <div className="px-6 pt-4 pb-10">
      <button onClick={app.back} data-goes-to="← Kembali (posisi scroll pulih)" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors mb-4">
        <ArrowLeft size={14} /> Kembali
      </button>
      <div className="bg-[#FEF2F3] rounded-xl px-4 py-3 flex items-center gap-2.5 mb-6">
        <Search size={14} className="text-[#C41A22] flex-shrink-0" />
        <p className="text-sm font-bold text-[#C41A22]">{q}</p>
        <span className="text-xs text-[#C41A22]/70">{results.length} hasil</span>
      </div>
      {results.length
        ? <JustifiedGrid artworks={results} targetHeight={230} />
        : <EmptyBlock title="Karya tidak ditemukan" hint={"Tidak ada karya yang cocok dengan “" + q + "”. Coba tag atau nama artist lain."} />}
    </div>
  );
}
