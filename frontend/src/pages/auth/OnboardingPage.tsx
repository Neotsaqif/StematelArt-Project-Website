import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ONBOARD_CHIPS, ARTWORKS } from '../../data/mockData';
import { Palette } from '../../components/ui/Icons';
import { Pic } from '../../components/ui/Pic';
import { fmtNum, toast } from '../../utils/helpers';

export function OnboardingPage() {
  const app = useApp();
  const [step, setStep] = useState(1);
  const [picks, setPicks] = useState(new Set());
  const [follows, setFollows] = useState(new Set());

  const toggleChip = (c) => setPicks(s => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n; });
  const toggleFollow = (id) => setFollows(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const finish = (skipped) => {
    app.navigate("discovery");
    toast.success(skipped ? "Selamat datang di ARTVAULT" : "Feed kamu sudah disesuaikan", { description: skipped ? undefined : picks.size + " kategori · " + follows.size + " artist diikuti" });
  };

  const suggested = ARTWORKS.slice(0, 6);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-6 md:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#E81E28] rounded-lg flex items-center justify-center flex-shrink-0">
            <Palette size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-extrabold leading-none tracking-tight">
            <span className="text-[#0A0A0B]">ART</span><span className="text-[#E81E28]">VAULT</span>
          </span>
        </div>
        <button onClick={() => finish(true)} data-goes-to="Lewati → Discovery" className="text-xs font-semibold text-[#A1A1AA] hover:text-[#0A0A0B] transition-colors">Lewati</button>
      </div>

      <div className="flex-1 flex justify-center px-6 pb-16">
        <div className="w-full" style={{ maxWidth: 680 }}>
          <div className="flex items-center gap-2 mb-7">
            {[1, 2].map(n => (
              <span key={n} className="h-1 flex-1 rounded-full transition-colors" style={{ background: n <= step ? "#E81E28" : "#E5E5E7" }} />
            ))}
          </div>
          <p className="text-[11px] font-extrabold text-[#C41A22] uppercase tracking-[0.18em] mb-3">Langkah {step} dari 2</p>

          {step === 1 ? (
            <>
              <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-2" style={{ fontSize: 30, lineHeight: 1.12 }}>Apa yang ingin kamu lihat?</h1>
              <p className="text-sm text-[#52525B] mb-8">Pilih minimal tiga kategori. Kami pakai ini untuk menyusun feed-mu.</p>
              <div className="flex flex-wrap gap-2.5 mb-10">
                {ONBOARD_CHIPS.map(c => {
                  const on = picks.has(c);
                  return (
                    <button
                      key={c}
                      onClick={() => toggleChip(c)}
                      data-goes-to={on ? "Batal pilih" : "Pilih kategori"}
                      className={"text-sm font-semibold px-4 py-2.5 rounded-full border transition-colors " +
                        (on ? "bg-[#E81E28] border-[#E81E28] text-white" : "bg-white border-[#E5E5E7] text-[#52525B] hover:border-[#A1A1AA] hover:text-[#0A0A0B]")}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => picks.size >= 3 && setStep(2)}
                  disabled={picks.size < 3}
                  data-goes-to="Lanjut → Langkah 2"
                  className={"text-sm font-bold px-8 py-3.5 rounded-full transition-colors " + (picks.size < 3 ? "bg-[#E5E5E7] text-[#A1A1AA]" : "bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white")}
                >
                  Lanjut
                </button>
                <span className="text-xs text-[#A1A1AA]">{picks.size < 3 ? "Pilih " + (3 - picks.size) + " lagi" : picks.size + " kategori dipilih"}</span>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-2" style={{ fontSize: 30, lineHeight: 1.12 }}>Artist untuk kamu ikuti</h1>
              <p className="text-sm text-[#52525B] mb-8">Berdasarkan kategori yang kamu pilih. Bisa diubah kapan saja.</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-10">
                {suggested.map(a => {
                  const on = follows.has(a.artistId);
                  return (
                    <div key={a.artistId} className="flex items-center gap-3 border border-[#E5E5E7] rounded-2xl p-3">
                      <Pic photoId={a.photoId} w={120} h={120} title={a.title} compact className="w-11 h-11 rounded-xl flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#0A0A0B] truncate">{a.artist}</p>
                        <p className="text-xs text-[#A1A1AA] truncate">{a.category} · {fmtNum(a.likes)} suka</p>
                      </div>
                      <button
                        onClick={() => toggleFollow(a.artistId)}
                        data-goes-to={on ? "Berhenti mengikuti" : "Ikuti artist"}
                        className={"text-xs font-bold px-4 py-2 rounded-full transition-colors flex-shrink-0 border " +
                          (on ? "bg-white border-[#E5E5E7] text-[#52525B] hover:border-[#A1A1AA]" : "bg-[#E81E28] border-[#E81E28] hover:bg-[#C41A22] text-white")}
                      >
                        {on ? "Mengikuti" : "Ikuti"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => finish(false)} data-goes-to="Selesai → Discovery" className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold px-8 py-3.5 rounded-full transition-colors">
                  Mulai Jelajahi
                </button>
                <button onClick={() => setStep(1)} data-goes-to="← Langkah 1" className="text-xs font-semibold text-[#52525B] hover:text-[#0A0A0B] transition-colors">Kembali</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
