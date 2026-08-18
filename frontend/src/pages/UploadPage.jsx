import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UPLOAD_STEPS, ARTWORKS } from '../data/mockData';
import { WatermarkStudio } from './WatermarkPage';
import { Tip } from '../components/ui/FeedbackBlocks';
import { ArrowLeft, Check, AlertTriangle, CheckCircle, ImageIcon, Stamp } from '../components/ui/Icons';
import { toast } from '../utils/helpers';

export function UploadPage() {
  const app = useApp();
  const [step, setStep] = useState(0);
  const [err, setErr] = useState(app.viewState === "error");
  const [picked, setPicked] = useState(false);
  const [wm, setWm] = useState(null);

  const cancel = () => app.confirm({
    title: "Buang karya ini?",
    body: "Berkas dan semua pengaturan watermark akan dibuang. Tindakan ini tidak bisa dibatalkan.",
    label: "Buang",
    onOk: () => { toast("Unggahan dibuang"); app.navigate("discovery"); },
  });

  const next = () => {
    if (step === 0 && !picked) { setErr(true); return; }
    setStep(s => Math.min(2, s + 1));
  };

  return (
    <div>
      <div className="px-6 pt-4 flex items-center justify-between">
        <button onClick={app.back} data-goes-to="← Kembali (posisi scroll pulih)" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors">
          <ArrowLeft size={14} /> Kembali
        </button>
        <button onClick={cancel} data-goes-to="Dialog “Buang karya ini?”" className="text-sm font-semibold text-[#52525B] hover:text-[#C41A22] transition-colors">Batal</button>
      </div>

      <div className="px-6 pt-4 pb-10">
        <h1 className="text-[28px] font-extrabold text-[#0A0A0B] mb-4">Unggah Karya</h1>

        {/* Steps */}
        <div className="flex items-center gap-3 mb-7 flex-wrap">
          {UPLOAD_STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={"w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors " +
                  (i < step ? "bg-[#FEF2F3] text-[#C41A22]" : i === step ? "bg-[#E81E28] text-white" : "bg-[#F5F5F5] text-[#A1A1AA]")}>
                  {i < step ? <Check size={12} /> : i + 1}
                </span>
                <span className={"text-sm font-semibold " + (i === step ? "text-[#0A0A0B]" : "text-[#A1A1AA]")}>{label}</span>
              </div>
              {i < UPLOAD_STEPS.length - 1 && <span className={"w-8 h-px " + (i < step ? "bg-[#E81E28]" : "bg-[#E5E5E7]")} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="max-w-2xl">
            <div className={"rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors " + (err ? "border-[#E81E28] bg-[#FEF2F3]/40" : picked ? "border-emerald-300 bg-emerald-50/40" : "border-[#E5E5E7]")}>
              <div className="w-14 h-14 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
                {err ? <AlertTriangle size={22} className="text-[#C41A22]" /> : picked ? <CheckCircle size={22} className="text-emerald-600" /> : <ImageIcon size={22} className="text-[#A1A1AA]" />}
              </div>
              <p className="text-base font-bold text-[#0A0A0B] mb-1">{picked ? "kegelapan-abadi.png siap" : "Tarik berkas ke sini"}</p>
              <p className="text-sm text-[#52525B] mb-5">PNG atau JPG, minimal 2000×2000px, maksimal 25 MB</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => { setErr(false); setPicked(true); }}
                  data-goes-to="Pilih berkas (valid)"
                  className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
                >
                  Pilih Berkas
                </button>
                <button
                  onClick={() => { setPicked(false); setErr(true); }}
                  data-goes-to="Jalur gagal (format salah)"
                  className="bg-white border border-[#E5E5E7] text-[#52525B] text-sm font-semibold px-4 py-2.5 rounded-full hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors"
                >
                  Coba berkas .tiff
                </button>
              </div>
            </div>
            {err && (
              <div className="flex items-start gap-2 mt-3">
                <AlertTriangle size={14} className="text-[#C41A22] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#C41A22]">Format tidak didukung</p>
                  <p className="text-sm text-[#52525B]">Berkas kamu .tiff. Ubah ke PNG atau JPG, lalu unggah kembali.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <WatermarkStudio
            onSkip={() => { setWm(null); setStep(2); }}
            onApply={() => { setWm("kanan bawah · 40%"); setStep(2); }}
          />
        )}

        {step === 2 && (
          <div className="max-w-2xl space-y-4">
            <div className="bg-[#F5F5F5] rounded-xl px-4 py-3 flex items-center gap-2.5">
              <Stamp size={13} className="text-[#A1A1AA] flex-shrink-0" />
              <p className="text-xs font-semibold text-[#52525B]">{wm ? "Watermark diterapkan · " + wm : "Tanpa watermark"}</p>
              <button onClick={() => setStep(1)} data-goes-to="← Langkah Watermark" className="ml-auto text-xs font-semibold text-[#52525B] hover:text-[#0A0A0B] transition-colors">Ubah</button>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Judul karya</p>
              <input
                placeholder="cth. Kegelapan Abadi"
                className="w-full border border-[#E5E5E7] rounded-full px-4 py-2.5 text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none focus:border-[#A1A1AA] transition-colors"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Deskripsi</p>
              <textarea
                rows={4}
                placeholder="Ceritakan proses dan inspirasi di balik karyamu..."
                className="w-full border border-[#E5E5E7] rounded-xl p-3 text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none resize-none focus:border-[#A1A1AA] transition-colors"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Kategori</p>
              <div className="flex flex-wrap gap-2">
                {["Digital Art", "Ilustrasi", "Lukisan", "Fotografi", "3D/CGI", "Komik"].map((c, i) => (
                  <span key={c} className={"text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors " + (i === 0 ? "bg-[#E81E28] text-white border-[#E81E28]" : "bg-white border-[#E5E5E7] text-[#52525B] hover:border-[#0A0A0B]")}>{c}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step nav */}
        <div className="flex items-center gap-2 pt-7 max-w-2xl">
          <button
            onClick={() => (step === 0 ? app.back() : setStep(s => s - 1))}
            data-goes-to={step === 0 ? "← Layar sebelumnya" : "← Langkah sebelumnya"}
            className="bg-white border border-[#E5E5E7] text-[#0A0A0B] text-sm font-semibold px-5 py-2.5 rounded-full hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors"
          >
            Kembali
          </button>
          {step < 2 ? (
            <Tip text={step === 0 && !picked ? "Pilih berkas PNG atau JPG lebih dulu" : "Lanjut ke " + UPLOAD_STEPS[step + 1]}>
              <button
                onClick={next}
                disabled={step === 0 && !picked}
                data-goes-to={step === 0 && !picked ? "Nonaktif · tooltip alasan" : "→ " + UPLOAD_STEPS[Math.min(2, step + 1)]}
                className={"text-sm font-bold px-6 py-2.5 rounded-full transition-colors " +
                  (step === 0 && !picked ? "bg-[#F5F5F5] text-[#A1A1AA] border border-[#E5E5E7] cursor-not-allowed" : "bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white")}
              >
                Lanjut
              </button>
            </Tip>
          ) : (
            <button
              onClick={() => {
                toast.success("Karya berhasil diunggah", { description: "Kamu diarahkan ke halaman karya baru" });
                app.openArtwork(ARTWORKS[0]);
              }}
              data-goes-to="Toast sukses → Halaman Karya baru"
              className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold px-6 py-2.5 rounded-full transition-colors"
            >
              Unggah
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
