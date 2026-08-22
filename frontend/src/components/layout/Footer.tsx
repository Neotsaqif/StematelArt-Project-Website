import React from 'react';
import { Palette } from '../ui/Icons';

export function Footer({ navigate }) {
  return (
    <footer className="bg-[#0A0A0B] text-white px-6 py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-[#E81E28] rounded-lg flex items-center justify-center flex-shrink-0">
              <Palette size={13} className="text-white" />
            </div>
            <span className="text-base font-extrabold"><span className="text-white">ART</span><span className="text-[#E81E28]">VAULT</span></span>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">Platform komunitas seni digital terdepan di Indonesia untuk artist dan penggemar seni.</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Navigasi</p>
          <div className="space-y-2">
            {[["discovery", "Discovery"], ["ranking", "Ranking"], ["commission", "Commission"], ["contest", "Kontes"], ["about", "Tentang"], ["login", "Masuk"], ["signup", "Daftar"]].map(([id, label]) => (
              <button key={id} onClick={() => navigate(id)} data-goes-to={"→ " + label} className="block text-xs text-white/50 hover:text-white transition-colors">
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Medium Populer</p>
          {["Digital Art", "Ilustrasi", "Lukisan", "Fotografi", "3D/CGI", "Komik"].map(m => (
            <button key={m} className="block text-xs text-white/50 hover:text-white transition-colors mb-2">{m}</button>
          ))}
        </div>
        <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Keamanan</p>
          <p className="text-xs text-white/50 leading-relaxed mb-4">Semua transaksi komisi dilindungi sistem escrow ARTVAULT. Dana aman hingga karya disetujui.</p>
          <button onClick={() => navigate("about")} data-goes-to="→ Halaman Tentang" className="text-xs text-[#E81E28] hover:text-white transition-colors font-semibold">Tentang ARTVAULT →</button>
        </div>
      </div>
      <div className="border-t border-white/10 pt-6 text-center">
        <p className="text-xs text-white/30">© 2026 ARTVAULT. Platform seni digital Indonesia. Semua hak dilindungi.</p>
      </div>
    </footer>
  );
}
