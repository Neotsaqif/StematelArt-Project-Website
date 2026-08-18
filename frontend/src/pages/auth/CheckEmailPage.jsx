import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AUTH_ART } from '../../data/mockData';
import { AuthSplit } from './AuthLayout';
import { Mail } from '../../components/ui/Icons';
import { toast } from '../../utils/helpers';

export function CheckEmailPage() {
  const app = useApp();
  const email = app.params.email || "nama@email.com";
  const [left, setLeft] = useState(60);

  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft(n => (n <= 1 ? 0 : n - 1)), 1000);
    return () => clearInterval(t);
  }, [left > 0]);

  const resend = () => { if (left > 0) return; setLeft(60); toast.success("Tautan dikirim ulang", { description: email }); };

  return (
    <AuthSplit art={AUTH_ART.reset}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FEF2F3] flex items-center justify-center mx-auto mb-6">
          <Mail size={24} className="text-[#E81E28]" />
        </div>
        <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-3" style={{ fontSize: 26, lineHeight: 1.15 }}>Cek email kamu</h1>
        <p className="text-sm text-[#52525B] leading-relaxed mb-1">Kami mengirim tautan pengaturan ulang ke</p>
        <p className="text-sm font-bold text-[#0A0A0B] mb-7">{email}</p>

        <button onClick={() => app.navigate("reset")} data-goes-to="→ Atur ulang kata sandi" className="w-full bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold py-3.5 rounded-full transition-colors">
          Buka Tautan Reset
        </button>

        <p className="text-xs text-[#52525B] mt-6">
          Tidak menerima email?{" "}
          <button
            onClick={resend}
            disabled={left > 0}
            data-goes-to={left > 0 ? "Nonaktif 60 detik" : "Kirim ulang tautan"}
            className={"font-bold " + (left > 0 ? "text-[#A1A1AA]" : "text-[#C41A22] hover:underline")}
          >
            Kirim ulang{left > 0 ? " (" + left + "s)" : ""}
          </button>
        </p>
        <p className="mt-4">
          <button onClick={() => app.navigate("login")} data-goes-to="→ Masuk" className="text-xs font-bold text-[#C41A22] hover:underline">Kembali ke Masuk</button>
        </p>
      </div>
    </AuthSplit>
  );
}
