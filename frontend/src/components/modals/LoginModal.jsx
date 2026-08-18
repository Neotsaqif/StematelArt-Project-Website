import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from './ModalShell';
import { AuthField, HelpLine, EyeToggle, OrDivider, SocialButtons, PillButton } from '../../pages/auth/AuthLayout';
import { toast } from '../../utils/helpers';

export function LoginModal({ onClose, onDone }) {
  const app = useApp();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);

  const submit = () => {
    if (busy) return;
    setFail(false);
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (email.trim().length > 2 && pw.length >= 6) onDone();
      else { setFail(true); toast.error("Gagal masuk", { description: "Email atau kata sandi salah" }); }
    }, 900);
  };

  const leave = (screen) => { onClose(); app.navigate(screen); };

  return (
    <Modal title="Masuk ke ARTVAULT" onClose={onClose} width={420}>
      <div className="p-6">
        <p className="text-sm text-[#52525B] leading-relaxed mb-5">
          Tindakanmu butuh akun. Masuk dulu, lalu kami lanjutkan tindakan yang tertunda.
        </p>
        <div className="flex flex-col gap-4">
          <AuthField label="Email atau username" value={email} onChange={setEmail} placeholder="nama@email.com" invalid={fail} onEnter={submit} autoFocus />
          <div>
            <AuthField
              label="Kata sandi" type={show ? "text" : "password"} value={pw} onChange={setPw}
              placeholder="Masukkan kata sandi" invalid={fail} onEnter={submit}
              trailing={<EyeToggle on={show} onToggle={() => setShow(!show)} />}
            />
            {fail && <HelpLine tone="error">Email atau kata sandi salah</HelpLine>}
          </div>
          <div className="flex justify-end -mt-1">
            <button onClick={() => leave("forgot")} data-goes-to="→ Lupa kata sandi" className="text-xs font-semibold text-[#C41A22] hover:underline">Lupa kata sandi?</button>
          </div>
          <PillButton onClick={submit} busy={busy} goesTo="Masuk → lanjutkan tindakan tertunda">{busy ? "Memeriksa..." : "Masuk"}</PillButton>
        </div>

        <OrDivider />
        <SocialButtons />

        <p className="text-xs text-[#52525B] text-center mt-6">
          Belum punya akun? <button onClick={() => leave("signup")} data-goes-to="→ Daftar" className="font-bold text-[#C41A22] hover:underline">Daftar</button>
        </p>
      </div>
    </Modal>
  );
}
