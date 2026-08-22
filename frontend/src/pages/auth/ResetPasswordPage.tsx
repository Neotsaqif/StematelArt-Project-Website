import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AUTH_ART } from '../../data/mockData';
import { pwStrength, toast } from '../../utils/helpers';
import { AuthSplit, AuthMark, AuthField, HelpLine, EyeToggle, PillButton, StrengthMeter } from './AuthLayout';

export function ResetPasswordPage() {
  const app = useApp();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const st = pwStrength(pw);
  const mismatch = pw2.length > 0 && pw2 !== pw;
  const ready = st >= 2 && pw2 === pw && pw2.length > 0;

  const submit = () => {
    if (!ready || busy) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); app.navigate("login"); toast.success("Kata sandi diperbarui", { description: "Silakan masuk dengan kata sandi baru" }); }, 800);
  };

  return (
    <AuthSplit art={AUTH_ART.reset}>
      <AuthMark sub={
        <>
          <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-2" style={{ fontSize: 28, lineHeight: 1.15 }}>Atur ulang kata sandi</h1>
          <p className="text-sm text-[#52525B] leading-relaxed">Buat kata sandi baru untuk akunmu.</p>
        </>
      } />
      <div className="flex flex-col gap-4">
        <div>
          <AuthField
            label="Kata sandi baru" type={show ? "text" : "password"} value={pw} onChange={setPw} placeholder="Kata sandi baru" autoFocus
            trailing={<EyeToggle on={show} onToggle={() => setShow(!show)} />}
          />
          <StrengthMeter value={pw} />
        </div>
        <div>
          <AuthField label="Konfirmasi kata sandi" type={show ? "text" : "password"} value={pw2} onChange={setPw2} placeholder="Ulangi kata sandi baru" invalid={mismatch} onEnter={submit} />
          {mismatch && <HelpLine tone="error">Kata sandi tidak cocok</HelpLine>}
        </div>
        <PillButton onClick={submit} busy={busy} disabled={!ready} goesTo="Simpan → Masuk">{busy ? "Menyimpan..." : "Simpan Kata Sandi"}</PillButton>
      </div>
    </AuthSplit>
  );
}
