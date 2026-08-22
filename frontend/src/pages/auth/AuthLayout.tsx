import type { ReactNode } from 'react';
import { useApp } from '../../context/AppContext';
import { TOP_SCRIM, pwStrength, toast } from '../../utils/helpers';
import { STRENGTH_COLOR, STRENGTH_LABEL } from '../../data/mockData';
import { Pic } from '../../components/ui/Pic';
import { Palette, AlertTriangle, CheckCircle, EyeOff, Eye, Check } from '../../components/ui/Icons';

export interface AuthSplitProps {
  art: { photoId: string; title: string; artist: string };
  children: ReactNode;
}

export function AuthSplit({ art, children }: AuthSplitProps) {
  const app = useApp();
  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden md:block relative w-[45%] flex-shrink-0 overflow-hidden bg-[#0A0A0B]">
        <Pic photoId={art.photoId} w={1100} h={1500} title={art.title} eager className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-x-0 top-0 h-36 pointer-events-none" style={{ background: TOP_SCRIM }} />
        <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 100%)" }} />
        <button onClick={() => app.navigate("discovery")} data-goes-to="→ Discovery" className="absolute top-7 left-7 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#E81E28] rounded-lg flex items-center justify-center flex-shrink-0">
            <Palette size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-extrabold text-white tracking-tight">ARTVAULT</span>
        </button>
        <p className="absolute bottom-7 left-7 right-7 text-xs text-white/75">
          <span className="font-semibold text-white">{art.title}</span> · @{art.artist}
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-14">
        <div className="w-full" style={{ maxWidth: 400 }}>{children}</div>
      </div>
    </div>
  );
}

export function AuthMark({ sub }: { sub?: ReactNode }) {
  const app = useApp();
  return (
    <div className="mb-7">
      <button onClick={() => app.navigate("discovery")} data-goes-to="→ Discovery" className="flex items-center gap-2.5 mb-7">
        <div className="w-8 h-8 bg-[#E81E28] rounded-lg flex items-center justify-center flex-shrink-0">
          <Palette size={16} className="text-white" />
        </div>
        <span className="text-[18px] font-extrabold leading-none tracking-tight">ARTVAULT</span>
      </button>
      {sub}
    </div>
  );
}

export function AuthField({ label, type = "text", value, onChange, placeholder, invalid, trailing, onEnter, autoFocus }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-[#0A0A0B]">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onKeyDown={(e) => e.key === 'Enter' && onEnter && onEnter()}
          className={`w-full h-11 px-3.5 bg-[#F4F4F5] border text-sm text-[#0A0A0B] rounded-xl outline-none transition-all placeholder:text-[#A1A1AA] ${
            invalid ? 'border-[#E81E28] bg-[#FEF2F3]' : 'border-transparent focus:border-[#E81E28] focus:bg-white'
          }`}
        />
        {trailing && <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">{trailing}</div>}
      </div>
    </div>
  );
}

export function HelpLine({ tone, children }: { tone: 'ok' | 'error'; children: ReactNode }) {
  const isOk = tone === 'ok';
  return (
    <div className={`flex items-center gap-1.5 text-xs mt-1.5 ${isOk ? 'text-[#059669]' : 'text-[#E81E28]'}`}>
      {isOk ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
      <span>{children}</span>
    </div>
  );
}

export function EyeToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="text-[#71717A] hover:text-[#0A0A0B]">
      {on ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

export function RedCheck({ on, onToggle, goesTo, children }: { on: boolean; onToggle: () => void; goesTo?: string; children: ReactNode }) {
  return (
    <label onClick={onToggle} data-goes-to={goesTo} className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-[#52525B]">
      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
        on ? 'bg-[#E81E28] border-[#E81E28] text-white' : 'border-[#D4D4D8] bg-white'
      }`}>
        {on && <Check size={11} strokeWidth={3} />}
      </div>
      <span>{children}</span>
    </label>
  );
}

export function OrDivider() {
  return (
    <div className="relative my-6 text-center">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E4E4E7]" /></div>
      <span className="relative bg-white px-3 text-xs text-[#A1A1AA] uppercase tracking-wider">atau</span>
    </div>
  );
}

export function SocialButtons() {
  const app = useApp();
  const handleSocial = (name: string) => {
    app.signIn();
    toast.success(`Berhasil masuk via ${name}`);
    app.navigate("discovery");
  };

  return (
    <div className="flex flex-col gap-2.5">
      <button onClick={() => handleSocial("Google")} className="w-full h-11 border border-[#E4E4E7] hover:bg-[#F4F4F5] rounded-xl flex items-center justify-center gap-2.5 text-xs font-bold text-[#0A0A0B] transition-colors">
        <span className="text-sm font-black text-[#4285F4]">G</span> Lanjutkan dengan Google
      </button>
      <button onClick={() => handleSocial("Discord")} className="w-full h-11 border border-[#E4E4E7] hover:bg-[#F4F4F5] rounded-xl flex items-center justify-center gap-2.5 text-xs font-bold text-[#0A0A0B] transition-colors">
        <span className="text-sm font-black text-[#5865F2]">D</span> Lanjutkan dengan Discord
      </button>
    </div>
  );
}

export function PillButton({ onClick, disabled, busy, goesTo, children }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      data-goes-to={goesTo}
      className={`w-full h-11 rounded-full text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${
        disabled
          ? 'bg-[#E4E4E7] text-[#A1A1AA] cursor-not-allowed'
          : 'bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] shadow-sm hover:shadow'
      }`}
    >
      {children}
    </button>
  );
}

export function StrengthMeter({ value }: { value: string }) {
  const st = pwStrength(value);
  if (!value) return null;

  return (
    <div className="mt-2 flex flex-col gap-1">
      <div className="flex gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className="flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: step <= st ? STRENGTH_COLOR[st] : '#E4E4E7',
            }}
          />
        ))}
      </div>
      <p className="text-[11px] font-semibold text-right" style={{ color: STRENGTH_COLOR[st] }}>
        {STRENGTH_LABEL[st]}
      </p>
    </div>
  );
}
