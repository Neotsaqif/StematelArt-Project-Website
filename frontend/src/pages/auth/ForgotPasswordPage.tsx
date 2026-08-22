import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AUTH_ART } from '../../data/mockData';
import { emailOk, toast } from '../../utils/helpers';
import { AuthSplit, AuthMark, AuthField, HelpLine, PillButton } from './AuthLayout';

export function ForgotPasswordPage() {
  const app = useApp();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const submit = () => {
    if (busy) return;
    if (!emailOk(email)) { setInvalid(true); toast.error("Email tidak valid"); return; }
    setInvalid(false);
    setBusy(true);
    setTimeout(() => { setBusy(false); app.navigate("checkEmail", { email: email.trim() }); }, 800);
  };

  return (
    <AuthSplit art={AUTH_ART.reset}>
      <AuthMark sub={
        <>
          <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-2" style={{ fontSize: 28, lineHeight: 1.15 }}>Lupa kata sandi</h1>
          <p className="text-sm text-[#52525B] leading-relaxed">Masukkan email akunmu. Kami kirim tautan untuk mengatur ulang kata sandi.</p>
        </>
      } />
      <div className="flex flex-col gap-4">
        <div>
          <AuthField label="Email" value={email} onChange={setEmail} placeholder="nama@email.com" invalid={invalid} onEnter={submit} autoFocus />
          {invalid && <HelpLine tone="error">Format email tidak valid</HelpLine>}
        </div>
        <PillButton onClick={submit} busy={busy} goesTo="Kirim tautan → Cek email">{busy ? "Mengirim..." : "Kirim Tautan Reset"}</PillButton>
      </div>
      <p className="text-center mt-6">
        <button onClick={() => app.navigate("login")} data-goes-to="→ Masuk" className="text-xs font-bold text-[#C41A22] hover:underline">Kembali ke Masuk</button>
      </p>
    </AuthSplit>
  );
}
