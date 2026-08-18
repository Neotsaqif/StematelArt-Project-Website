import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AUTH_ART } from '../../data/mockData';
import { emailOk, toast } from '../../utils/helpers';
import { AuthSplit, AuthMark, AuthField, HelpLine, EyeToggle, RedCheck, OrDivider, SocialButtons, PillButton } from './AuthLayout';

export function LoginPage() {
  const app = useApp();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);

  const submit = () => {
    if (busy) return;
    setFail(false);
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (emailOk(email) || (email.trim().length > 2 && pw.length >= 6)) {
        if (pw.length < 6) { setFail(true); toast.error("Gagal masuk", { description: "Email atau kata sandi salah" }); return; }
        app.signIn();
        app.navigate("discovery");
        toast.success("Berhasil masuk", { description: "Selamat datang kembali" });
      } else {
        setFail(true);
        toast.error("Gagal masuk", { description: "Email atau kata sandi salah" });
      }
    }, 900);
  };

  return (
    <AuthSplit art={AUTH_ART.login}>
      <AuthMark sub={
        <>
          <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-2" style={{ fontSize: 28, lineHeight: 1.15 }}>Masuk ke ARTVAULT</h1>
          <p className="text-sm text-[#52525B] leading-relaxed">Lanjutkan menjelajah, menyimpan karya, dan mengelola komisimu.</p>
        </>
      } />

      <div className="flex flex-col gap-4">
        <div>
          <AuthField label="Email atau username" value={email} onChange={setEmail} placeholder="nama@email.com" invalid={fail} onEnter={submit} autoFocus />
        </div>
        <div>
          <AuthField
            label="Kata sandi" type={show ? "text" : "password"} value={pw} onChange={setPw}
            placeholder="Masukkan kata sandi" invalid={fail} onEnter={submit}
            trailing={<EyeToggle on={show} onToggle={() => setShow(!show)} />}
          />
          {fail && <HelpLine tone="error">Email atau kata sandi salah</HelpLine>}
        </div>

        <div className="flex items-center justify-between gap-3">
          <RedCheck on={remember} onToggle={() => setRemember(!remember)} goesTo="Ingat sesi di perangkat ini">Ingat saya</RedCheck>
          <button onClick={() => app.navigate("forgot")} data-goes-to="→ Lupa kata sandi" className="text-xs font-semibold text-[#C41A22] hover:underline flex-shrink-0">Lupa kata sandi?</button>
        </div>

        <PillButton onClick={submit} busy={busy} goesTo="Masuk → Discovery">{busy ? "Memeriksa..." : "Masuk"}</PillButton>
      </div>

      <OrDivider />
      <SocialButtons />

      <p className="text-xs text-[#52525B] text-center mt-6">
        Belum punya akun? <button onClick={() => app.navigate("signup")} data-goes-to="→ Daftar" className="font-bold text-[#C41A22] hover:underline">Daftar</button>
      </p>
    </AuthSplit>
  );
}
