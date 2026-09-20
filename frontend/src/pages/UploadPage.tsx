import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { UPLOAD_STEPS } from '../data/mockData';
import { WatermarkStudio } from './WatermarkPage';
import { Tip } from '../components/ui/FeedbackBlocks';
import { ArrowLeft, Check, AlertTriangle, CheckCircle, ImageIcon, Stamp } from '../components/ui/Icons';
import { toast } from '../utils/helpers';
import { postsApi, mapPostToArtwork } from '../services/api';
import { ApiError } from '../services/api';

export function UploadPage() {
  const app = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [wm, setWm] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErr(null);

    if (!file) {
      setPickedFile(null);
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      setErr('Format tidak didukung. Gunakan PNG, JPG, atau WebP.');
      setPickedFile(null);
      return;
    }

    if (file.size > maxSize) {
      setErr('Ukuran file maksimal 10 MB.');
      setPickedFile(null);
      return;
    }

    setPickedFile(file);
  }, []);

  const triggerFileSelect = () => {
    setErr(null);
    fileInputRef.current?.click();
  };

  const cancel = () => app.confirm({
    title: "Buang karya ini?",
    body: "Berkas dan semua pengaturan watermark akan dibuang. Tindakan ini tidak bisa dibatalkan.",
    label: "Buang",
    onOk: () => {
      toast("Unggahan dibuang");
      app.navigate("discovery");
    },
  });

  const next = () => {
    if (step === 0 && !pickedFile) { setErr('Pilih berkas PNG atau JPG lebih dulu.'); return; }
    setStep(s => Math.min(2, s + 1));
  };

  const handleSubmit = async () => {
    if (!pickedFile || !title.trim()) {
      setErr('Judul karya wajib diisi.');
      return;
    }

    setIsUploading(true);
    setErr(null);

    try {
      const response = await postsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.trim() || undefined,
        artwork: pickedFile,
      });

      if (response.success && response.data?.post) {
        toast.success("Karya berhasil diunggah", { description: "Kamu diarahkan ke halaman karya baru" });
        const artwork = mapPostToArtwork(response.data.post);
        app.openArtwork(artwork);
      } else {
        setErr(response.message || 'Gagal mengunggah karya.');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setErr('Sesi kamu telah berakhir. Silakan login kembali.');
        } else if (error.status === 403) {
          setErr('Hanya seniman atau admin yang dapat mengunggah karya.');
        } else if (error.status === 422) {
          const errors = error.data?.errors || {};
          const firstError = Object.values(errors).flat().join(' ') || 'Validasi gagal.';
          setErr(firstError);
        } else {
          setErr(error.message || 'Terjadi kesalahan saat mengunggah.');
        }
      } else {
        setErr('Tidak dapat terhubung ke server.');
      }
    } finally {
      setIsUploading(false);
    }
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
            <div className={"rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors " + (err ? "border-[#E81E28] bg-[#FEF2F3]/40" : pickedFile ? "border-emerald-300 bg-emerald-50/40" : "border-[#E5E5E7]")}>
              <div className="w-14 h-14 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
                {err ? <AlertTriangle size={22} className="text-[#C41A22]" /> : pickedFile ? <CheckCircle size={22} className="text-emerald-600" /> : <ImageIcon size={22} className="text-[#A1A1AA]" />}
              </div>
              <p className="text-base font-bold text-[#0A0A0B] mb-1">{pickedFile ? pickedFile.name : "Pilih berkas karya"}</p>
              <p className="text-sm text-[#52525B] mb-5">PNG, JPG, atau WebP, maksimal 10 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileSelect}
                data-goes-to="Input berkas asli"
              />
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={triggerFileSelect}
                  data-goes-to="Pilih berkas (valid)"
                  className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
                >
                  {pickedFile ? 'Ganti Berkas' : 'Pilih Berkas'}
                </button>
              </div>
            </div>
            {err && (
              <div className="flex items-start gap-2 mt-3">
                <AlertTriangle size={14} className="text-[#C41A22] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#C41A22]">{err}</p>
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
            {pickedFile && (
              <div className="bg-[#F5F5F5] rounded-xl px-4 py-3 flex items-center gap-2.5">
                <Stamp size={13} className="text-[#A1A1AA] flex-shrink-0" />
                <p className="text-xs font-semibold text-[#52525B]">Berkas: {pickedFile.name}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Judul karya *</p>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth. Kegelapan Abadi"
                className="w-full border border-[#E5E5E7] rounded-full px-4 py-2.5 text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none focus:border-[#A1A1AA] transition-colors"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Deskripsi</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Ceritakan proses dan inspirasi di balik karyamu..."
                className="w-full border border-[#E5E5E7] rounded-xl p-3 text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none resize-none focus:border-[#A1A1AA] transition-colors"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Tag (pisahkan dengan koma)</p>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="cth. digital art, fantasi, gelap"
                className="w-full border border-[#E5E5E7] rounded-full px-4 py-2.5 text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none focus:border-[#A1A1AA] transition-colors"
              />
            </div>
            {err && (
              <div className="flex items-start gap-2 mt-3">
                <AlertTriangle size={14} className="text-[#C41A22] flex-shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-[#C41A22]">{err}</p>
              </div>
            )}
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
            <Tip text={step === 0 && !pickedFile ? "Pilih berkas PNG atau JPG lebih dulu" : "Lanjut ke " + UPLOAD_STEPS[step + 1]}>
              <button
                onClick={next}
                disabled={step === 0 && !pickedFile}
                data-goes-to={step === 0 && !pickedFile ? "Nonaktif · tooltip alasan" : "→ " + UPLOAD_STEPS[Math.min(2, step + 1)]}
                className={"text-sm font-bold px-6 py-2.5 rounded-full transition-colors " +
                  (step === 0 && !pickedFile ? "bg-[#F5F5F5] text-[#A1A1AA] border border-[#E5E5E7] cursor-not-allowed" : "bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white")}
              >
                Lanjut
              </button>
            </Tip>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isUploading || !title.trim()}
              data-goes-to={isUploading ? "Mengunggah..." : "→ Unggah ke server"}
              className={"text-sm font-bold px-6 py-2.5 rounded-full transition-colors " +
                (isUploading || !title.trim() ? "bg-[#F5F5F5] text-[#A1A1AA] border border-[#E5E5E7] cursor-not-allowed" : "bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white")}
            >
              {isUploading ? "Mengunggah..." : "Unggah"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
