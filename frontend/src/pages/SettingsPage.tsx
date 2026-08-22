import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft } from '../components/ui/Icons';
import { toast } from '../utils/helpers';

export function SettingsPage() {
  const app = useApp();
  const [on, setOn] = useState({ komisi: true, notif: true, watermark: false });
  const rows = [
    ["komisi", "Buka status komisi", "Tampilkan paket harga di profilmu"],
    ["notif", "Notifikasi email", "Ringkasan suka, komentar dan pesanan"],
    ["watermark", "Watermark otomatis", "Terapkan watermark terakhir ke setiap unggahan"],
  ];
  return (
    <div className="px-6 pt-4 pb-10">
      <button onClick={app.back} data-goes-to="← Kembali (posisi scroll pulih)" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors mb-4">
        <ArrowLeft size={14} /> Kembali
      </button>
      <h1 className="text-[28px] font-extrabold text-[#0A0A0B] mb-6">Pengaturan</h1>
      <div className="max-w-xl border border-[#E5E5E7] rounded-xl divide-y divide-[#E5E5E7]">
        {rows.map(([k, title, sub]) => (
          <div key={k} className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-[#0A0A0B]">{title}</p>
              <p className="text-xs text-[#A1A1AA]">{sub}</p>
            </div>
            <button
              onClick={() => { setOn(s => ({ ...s, [k]: !s[k] })); toast.success("Pengaturan disimpan", { description: title }); }}
              data-goes-to="Toggle + toast"
              className={"w-11 h-6 rounded-full flex-shrink-0 transition-colors relative " + (on[k] ? "bg-[#E81E28]" : "bg-[#E5E5E7]")}
            >
              <span className={"absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all " + (on[k] ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
