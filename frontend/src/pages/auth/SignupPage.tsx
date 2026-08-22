import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AUTH_ART, TAKEN } from '../../data/mockData';
import { emailOk, pwStrength, toast } from '../../utils/helpers';
import { AuthSplit, AuthMark, AuthField, HelpLine, EyeToggle, RedCheck, OrDivider, SocialButtons, PillButton, StrengthMeter } from './AuthLayout';
import { CheckCircle, AlertTriangle } from '../../components/ui/Icons';
import { Tip } from '../../components/ui/FeedbackBlocks';
import { registerUser } from '../../services/api';

export function SignupPage() {
  const app = useApp();
  const [nama, setNama] = useState("");
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const uTrim = user.trim().toLowerCase();
  const uTaken = uTrim.length >= 3 && TAKEN.includes(uTrim);
  const uFree = uTrim.length >= 3 && !uTaken;
  const st = pwStrength(pw);
  const mismatch = pw2.length > 0 && pw2 !== pw;

  const missing = [];
  if (!nama.trim()) missing.push("nama lengkap");
  if (!uFree) missing.push("username yang tersedia");
  if (!emailOk(email)) missing.push("email yang valid");
  if (st < 2) missing.push("kata sandi minimal 8 karakter");
  if (!pw2 || mismatch) missing.push("konfirmasi yang cocok");
  if (!agree) missing.push("centang syarat & ketentuan");
  const ready = missing.length === 0;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setApiError(null);

    const res = await registerUser({
      name: nama.trim(),
      email: email.trim(),
      password: pw,
      password_confirmation: pw2,
    });

    setBusy(false);

    if (res.success) {
      app.signIn();
      toast.success("Akun berhasil dibuat", { description: "Selamat datang, " + nama.trim().split(" ")[0] });
      app.navigate("onboarding");
    } else {
      setApiError(res.message);
      toast.error("Pendaftaran gagal", { description: res.message });
    }
  };

  return (
    <AuthSplit art={AUTH_ART.signup}>
      <AuthMark sub={
        <>
          <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-2" style={{ fontSize: 28, lineHeight: 1.15 }}>Buat Akun</h1>
          <p className="text-sm text-[#52525B] leading-relaxed">Gratis selamanya. Unggah karya, buka komisi, dan ikut kontes bulanan.</p>
        </>
      } />

      {apiError && (
        <div className="mb-4 p-3 bg-[#FEF2F3] border border-[#F7C9CC] rounded-xl flex items-center gap-2">
          <AlertTriangle size={16} className="text-[#C41A22] flex-shrink-0" />
          <p className="text-xs font-semibold text-[#C41A22]">{apiError}</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <AuthField label="Nama lengkap" value={nama} onChange={setNama} placeholder="Nama yang tampil di profil" autoFocus />

        <div>
          <AuthField
            label="Username" value={user} onChange={setUser} placeholder="tanpa spasi" invalid={uTaken}
            trailing={uFree ? <CheckCircle size={15} className="text-[#059669]" /> : uTaken ? <AlertTriangle size={15} className="text-[#E81E28]" /> : null}
          />
          {uFree && <HelpLine tone="ok">Username tersedia</HelpLine>}
          {uTaken && <HelpLine tone="error">Username sudah dipakai</HelpLine>}
        </div>

        <AuthField label="Email" value={email} onChange={setEmail} placeholder="nama@email.com" />

        <div>
          <AuthField
            label="Kata sandi" type={show ? "text" : "password"} value={pw} onChange={setPw} placeholder="Buat kata sandi"
            trailing={<EyeToggle on={show} onToggle={() => setShow(!show)} />}
          />
          <StrengthMeter value={pw} />
        </div>

        <div>
          <AuthField
            label="Konfirmasi kata sandi" type={show ? "text" : "password"} value={pw2} onChange={setPw2}
            placeholder="Ulangi kata sandi" invalid={mismatch} onEnter={submit}
          />
          {mismatch && <HelpLine tone="error">Kata sandi tidak cocok</HelpLine>}
        </div>

        <RedCheck on={agree} onToggle={() => setAgree(!agree)} goesTo="Setujui syarat">
          Saya setuju dengan <span className="font-semibold text-[#C41A22]">Syarat &amp; Ketentuan</span> dan <span className="font-semibold text-[#C41A22]">Kebijakan Privasi</span>
        </RedCheck>

        {ready ? (
          <PillButton onClick={submit} busy={busy} goesTo="Buat akun → Onboarding">{busy ? "Membuat akun..." : "Buat Akun"}</PillButton>
        ) : (
          <Tip text={"Lengkapi dulu: " + missing.join(", ")} className="w-full">
            <span className="w-full"><PillButton disabled goesTo="Nonaktif sampai semua isian valid">Buat Akun</PillButton></span>
          </Tip>
        )}
      </div>

      <OrDivider />
      <SocialButtons />

      <p className="text-xs text-[#52525B] text-center mt-6">
        Sudah punya akun? <button onClick={() => app.navigate("login")} data-goes-to="→ Masuk" className="font-bold text-[#C41A22] hover:underline">Masuk</button>
      </p>
    </AuthSplit>
  );
}
