import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WM_POS } from '../data/mockData';
import { Pic } from '../components/ui/Pic';
import { ArrowLeft, Stamp, Type, ImageIcon, Upload, Download } from '../components/ui/Icons';
import { toast } from '../utils/helpers';

export function WmSlider({ label, value, min, max, unit, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">{label}</p>
        <span className="text-xs font-bold text-[#0A0A0B]">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#E81E28]"
      />
    </div>
  );
}

export function WatermarkStudio({ photoId = "1478760329108-5c3ed9d495a0", fileName = "kegelapan-abadi.png", onSkip, onApply, mode: footerMode = "flow" }) {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("© rioArtStudio");
  const [pos, setPos] = useState(8);
  const [opacity, setOpacity] = useState(40);
  const [size, setSize] = useState(26);
  const [rotation, setRotation] = useState(0);
  const [tile, setTile] = useState(false);
  const [color, setColor] = useState("white");

  const ink = color === "white" ? "#FFFFFF" : "#0A0A0B";
  const mark = (key) => (
    <span
      key={key}
      style={{
        fontSize: size, fontWeight: 800, letterSpacing: "0.02em", color: ink,
        opacity: opacity / 100, whiteSpace: "nowrap", lineHeight: 1,
        transform: tile ? "none" : "rotate(" + rotation + "deg)",
      }}
    >
      {mode === "text" ? text : <span>ART<span style={{ color: color === "white" ? "#FFFFFF" : "#E81E28" }}>VAULT</span></span>}
    </span>
  );

  return (
    <div>
      <div className="flex gap-6 items-start">
        {/* Preview stage */}
        <div className="flex-1 min-w-0">
          <div className="bg-[#F5F5F5] rounded-xl p-6 flex items-center justify-center" style={{ minHeight: 460 }}>
            <div className="relative max-w-full" style={{ lineHeight: 0 }}>
              <Pic
                photoId={photoId}
                w={900}
                h={600}
                title="Pratinjau watermark"
                eager
                className="rounded-lg shadow-md max-w-full"
                style={{ aspectRatio: "3 / 2", height: "min(420px, 60vh)" }}
              />
              {tile ? (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none flex flex-wrap items-center justify-center content-center gap-x-10 gap-y-8"
                  style={{ transform: "rotate(" + (rotation - 24) + "deg) scale(1.6)" }}
                >
                  {Array.from({ length: 30 }).map((_, i) => mark(i))}
                </div>
              ) : (
                <div
                  className="absolute inset-0 flex p-5 pointer-events-none"
                  style={{ justifyContent: WM_POS[pos][0], alignItems: WM_POS[pos][1] }}
                >
                  {mark("single")}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-2 flex items-center gap-1.5">
            <ImageIcon size={11} /> {fileName} · pratinjau langsung, watermark dibakar saat diterapkan
          </p>
        </div>

        {/* Control panel */}
        <div className="w-[320px] flex-shrink-0 border border-[#E5E5E7] rounded-xl">
          <div className="px-4 py-3 border-b border-[#E5E5E7] flex items-center gap-2">
            <Stamp size={14} className="text-[#C41A22]" />
            <p className="text-sm font-bold text-[#0A0A0B]">Watermark</p>
          </div>

          <div className="p-4 space-y-5">
            {/* Source */}
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Sumber</p>
              <div className="flex bg-[#F5F5F5] rounded-full p-1 mb-2">
                {[["text", "Teks", Type], ["logo", "Logo", ImageIcon]].map(([id, label, Icon]) => (
                  <button
                    key={id}
                    onClick={() => setMode(id)}
                    className={"flex-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center justify-center gap-1.5 " + (mode === id ? "bg-white text-[#0A0A0B] shadow-sm" : "text-[#52525B]")}
                  >
                    <Icon size={11} /> {label}
                  </button>
                ))}
              </div>
              {mode === "text" ? (
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="w-full border border-[#E5E5E7] rounded-full px-3 py-2 text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none focus:border-[#A1A1AA] transition-colors"
                  placeholder="© namamu"
                />
              ) : (
                <button className="w-full border border-dashed border-[#E5E5E7] rounded-xl px-3 py-3 text-xs font-semibold text-[#52525B] hover:border-[#0A0A0B] transition-colors flex items-center justify-center gap-1.5">
                  <Upload size={12} /> Unggah logo PNG transparan
                </button>
              )}
            </div>

            {/* Position grid */}
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Posisi</p>
              <div className="grid grid-cols-3 gap-1.5" style={{ opacity: tile ? 0.4 : 1 }}>
                {WM_POS.map((_, i) => (
                  <button
                    key={i}
                    disabled={tile}
                    onClick={() => setPos(i)}
                    className={"h-9 rounded border transition-colors " + (pos === i && !tile ? "bg-[#E81E28] border-[#E81E28]" : "bg-white border-[#E5E5E7] hover:border-[#0A0A0B]")}
                  >
                    <span className={"block w-1.5 h-1.5 rounded-full mx-auto " + (pos === i && !tile ? "bg-white" : "bg-[#E5E5E7]")} />
                  </button>
                ))}
              </div>
            </div>

            <WmSlider label="Opasitas" value={opacity} min={5} max={100} unit="%" onChange={setOpacity} />
            <WmSlider label="Ukuran" value={size} min={10} max={72} unit="px" onChange={setSize} />
            <WmSlider label="Rotasi" value={rotation} min={-90} max={90} unit="°" onChange={setRotation} />

            {/* Tile toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0A0A0B]">Pola berulang</p>
                <p className="text-xs text-[#A1A1AA]">Ubin diagonal menutup seluruh karya</p>
              </div>
              <button
                onClick={() => setTile(t => !t)}
                className={"w-11 h-6 rounded-full flex-shrink-0 transition-colors relative " + (tile ? "bg-[#E81E28]" : "bg-[#E5E5E7]")}
              >
                <span className={"absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all " + (tile ? "left-[22px]" : "left-0.5")} />
              </button>
            </div>

            {/* Colour */}
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Warna</p>
              <div className="flex gap-2">
                {[["white", "Putih", "#FFFFFF"], ["black", "Hitam", "#0A0A0B"]].map(([id, label, sw]) => (
                  <button
                    key={id}
                    onClick={() => setColor(id)}
                    className={"flex-1 flex items-center gap-2 border rounded-full px-3 py-2 text-xs font-semibold transition-colors " + (color === id ? "border-[#E81E28] text-[#0A0A0B]" : "border-[#E5E5E7] text-[#52525B] hover:border-[#0A0A0B]")}
                  >
                    <span className="w-4 h-4 rounded-full border border-[#E5E5E7] flex-shrink-0" style={{ background: sw }} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-[#E5E5E7] flex items-center gap-2">
            {footerMode === "flow" ? (
              <>
                <button
                  onClick={onSkip}
                  data-goes-to="Lanjut ke Detail Karya (tanpa watermark)"
                  className="flex-1 bg-white border border-[#E5E5E7] text-[#0A0A0B] text-sm font-semibold py-2 rounded-full hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors"
                >
                  Lewati
                </button>
                <button
                  onClick={onApply}
                  data-goes-to="Terapkan → Detail Karya"
                  className="flex-1 bg-[#E81E28] hover:bg-[#C41A22] text-white text-sm font-bold py-2 rounded-full transition-colors"
                >
                  Terapkan Watermark
                </button>
              </>
            ) : (
              <button
                onClick={onApply}
                data-goes-to="Unduh berkas ber-watermark (tanpa publikasi)"
                className="flex-1 bg-[#E81E28] hover:bg-[#C41A22] text-white text-sm font-bold py-2 rounded-full transition-colors flex items-center justify-center gap-1.5"
              >
                <Download size={13} /> Unduh Hasil
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WatermarkPage() {
  const app = useApp();
  return (
    <div>
      <div className="px-6 pt-4">
        <button onClick={app.back} data-goes-to="← Kembali (posisi scroll pulih)" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors">
          <ArrowLeft size={14} /> Kembali
        </button>
      </div>
      <div className="px-6 pt-4 pb-10">
        <h1 className="text-[28px] font-extrabold text-[#0A0A0B] mb-1">Watermark Generator</h1>
        <p className="text-sm text-[#52525B] mb-6">Tandai gambar tanpa mengunggahnya ke galeri. Berkas hasil langsung diunduh ke perangkatmu.</p>
        <WatermarkStudio
          mode="standalone"
          onApply={() => toast.success("Berkas diunduh", { description: "kegelapan-abadi-watermark.png · tidak dipublikasikan" })}
        />
      </div>
    </div>
  );
}
