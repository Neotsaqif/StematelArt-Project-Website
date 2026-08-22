import { useApp } from '../context/AppContext';
import { ARTWORKS } from '../data/mockData';
import { lifetimeScore, fmtPts, SINCE } from '../utils/helpers';
import { Pic } from '../components/ui/Pic';
import { EmptyBlock, ErrorBlock, SkeletonRows, Tip } from '../components/ui/FeedbackBlocks';
import { Trophy, Crown } from '../components/ui/Icons';

const RANKED = [...ARTWORKS].sort((a, b) => lifetimeScore(b) - lifetimeScore(a));
const PODIUM = [0, 1, 2].map(i => ({ rank: i + 1, artwork: RANKED[i], pts: lifetimeScore(RANKED[i]) }));
const LIST_ROWS = RANKED.slice(3, 13).map((a, i) => ({ rank: i + 4, artwork: a, pts: lifetimeScore(a) }));
const PTS_TIP = "Skor = suka × 12 + komentar × 30 + dilihat × 0,6";
const SK = "bg-[#F5F5F5]";

export function RankingPage() {
  const app = useApp();
  const viewState = app.viewState;
  const podiumOrder = [PODIUM[1], PODIUM[0], PODIUM[2]];

  return (
    <div className="px-6 pt-5 pb-10">
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <span className="bg-[#FEF2F3] text-[#C41A22] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Trophy size={12} /> Papan Peringkat
        </span>
        <h1 className="text-[28px] font-extrabold text-[#0A0A0B]">Peringkat Sepanjang Masa</h1>
      </div>
      <p className="text-sm text-[#52525B] mb-7">Skor kumulatif dari suka, dilihat dan komentar sejak karya diunggah.</p>

      {viewState === "loading" ? (
        <>
          <div className="flex items-end gap-3 mb-8">
            {[246, 290, 216].map((h, i) => <div key={i} className={SK + " flex-1"} style={{ height: h }} />)}
          </div>
          <SkeletonRows n={6} />
        </>
      ) : viewState === "empty" ? (
        <EmptyBlock Icon={Trophy} title="Belum ada data" hint="Peringkat sepanjang masa muncul setelah karya pertama mengumpulkan poin." />
      ) : viewState === "error" ? (
        <ErrorBlock title="Gagal memuat peringkat" hint="Skor sepanjang masa tidak dapat dihitung saat ini. Coba beberapa saat lagi." onRetry={app.retry} />
      ) : (
        <>
          {/* Podium */}
          <div className="flex items-end gap-3 mb-8">
            {podiumOrder.map(({ rank, artwork, pts }) => {
              const isGold = rank === 1;
              const h = isGold ? 290 : rank === 2 ? 246 : 216;
              const borderC = isGold ? "#B8860B" : rank === 2 ? "#71717A" : "#92400E";
              return (
                <div
                  key={rank}
                  className="relative flex-1 rounded-xl overflow-hidden cursor-pointer group"
                  style={{ height: h, border: "2px solid " + borderC }}
                  onClick={() => app.openArtwork(artwork)}
                  data-goes-to="→ Halaman Karya"
                >
                  <Pic photoId={artwork.photoId} w={400} h={h * 2} title={artwork.title} eager className="w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  {isGold && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2">
                      <Crown size={22} style={{ color: "#B8860B" }} fill="#B8860B" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="text-4xl font-extrabold italic" style={{ color: borderC, opacity: 0.9 }}>{rank}</span>
                  </div>
                  <div className="absolute top-3 right-3 text-right" onClick={e => e.stopPropagation()}>
                    <Tip text={PTS_TIP}>
                      <span className="flex flex-col items-end cursor-help">
                        <span className="bg-white/95 text-[#C41A22] text-xs font-bold px-2 py-1 rounded-full block">{fmtPts(pts)}</span>
                        <span className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">Total Poin</span>
                      </span>
                    </Tip>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-bold truncate mb-0.5">{artwork.title}</p>
                    <button
                      className="text-white/70 text-xs hover:text-white transition-colors block"
                      data-goes-to="→ Profil artist"
                      onClick={e => { e.stopPropagation(); app.openProfile(artwork.artistId); }}
                    >{artwork.artist}</button>
                    <p className="text-white/50 text-[11px] mt-0.5">sejak {SINCE[artwork.id]}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* List */}
          <div>
            {LIST_ROWS.map(({ rank, artwork, pts }) => (
              <div
                key={rank}
                className="flex items-center gap-4 py-3 border-b border-[#E5E5E7] cursor-pointer hover:bg-gray-50 -mx-6 px-6 transition-colors"
                onClick={() => app.openArtwork(artwork)}
                data-goes-to="→ Halaman Karya"
              >
                <span className="text-[36px] font-extrabold italic text-[#E5E5E7] w-12 text-right flex-shrink-0 leading-none">{rank}</span>
                <Pic photoId={artwork.photoId} w={96} h={96} title={artwork.title} className="w-11 h-11 rounded flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0A0A0B] truncate">{artwork.title}</p>
                  <button
                    className="text-xs text-[#52525B] hover:text-[#C41A22] transition-colors"
                    data-goes-to="→ Profil artist"
                    onClick={e => { e.stopPropagation(); app.openProfile(artwork.artistId); }}
                  >{artwork.artist}</button>
                </div>
                <div className="text-right flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <Tip text={PTS_TIP}>
                    <span className="cursor-help block">
                      <span className="text-sm font-bold text-[#C41A22] leading-tight block">{fmtPts(pts)} <span className="text-[10px] font-bold uppercase tracking-widest text-[#C41A22]/70">Poin</span></span>
                      <span className="text-xs text-[#A1A1AA]">sejak {SINCE[artwork.id]}</span>
                    </span>
                  </Tip>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); app.openArtwork(artwork); }}
                  data-goes-to="→ Halaman Karya"
                  className="flex-shrink-0 border border-[#E5E5E7] text-[#0A0A0B] text-xs font-semibold px-3 py-1 rounded-full hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors"
                >
                  Lihat
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
