import React from 'react';
import { useApp } from '../../context/AppContext';
import { TOP_SCRIM, pwStrength, toast } from '../../utils/helpers';
import { STRENGTH_COLOR, STRENGTH_LABEL } from '../../data/mockData';
import { Pic } from '../../components/ui/Pic';
import { Palette, AlertTriangle, CheckCircle, EyeOff, Eye, Check } from '../../components/ui/Icons';

export function AuthSplit({ art, children }) {
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

export function AuthMark({ sub }) {
  const app = useApp();
  return (
    <div className="mb-7">
      <button onClick={() => app.navigate("discovery")} data-goes-to="→ Discovery" className="flex items-center gap-2.5 mb-7">
        <div className="w-8 h-8 bg-[#E81E28] rounded-lg flex items-center justify-center flex-shrink-0">
          <Palette size={16} className="text-white" />
        </div>
        <span className="text-[18px] font-extrabold leading-none tracking-tight">
          <span className="text-[#0A0A0B]">ART</span><span className="text-[#E81E28]">VAULT</span>
        </span>
      </button>
      {sub}
    </div>
  );
}

export function AuthField({ label, type = "text", value, onChange, placeholder, invalid, trailing, onEnter, autoFocus }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#0A0A0B] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && onEnter) onEnter(); }}
          data-goes-to={"Isi " + label.toLowerCase()}
          className={"w-full rounded-full pl-4 pr-11 py-3 text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none border transition-colors " +
            (invalid ? "bg-white border-[#E81E28]" : "bg-[#F4F4F5] border-transparent focus:border-[#A1A1AA]")}
        />
        {trailing && <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">{trailing}</div>}
      </div>
    </div>
  );
}

export function HelpLine({ tone, children }) {
  const c = tone === "error" ? "#C41A22" : tone === "ok" ? "#059669" : "#A1A1AA";
  const Icon = tone === "error" ? AlertTriangle : tone === "ok" ? CheckCircle : null;
  return (
    <p className="flex items-center gap-1.5 mt-2 text-xs font-medium" style={{ color: c }}>
      {Icon && <Icon size={12} className="flex-shrink-0" />}
      <span>{children}</span>
    </p>
  );
}

export function EyeToggle({ on, onToggle }) {
  const Icon = on ? EyeOff : Eye;
  return (
    <button
      onClick={onToggle}
      data-goes-to={on ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
      className="text-[#A1A1AA] hover:text-[#0A0A0B] transition-colors"
    >
      <Icon size={15} />
    </button>
  );
}

export function RedCheck({ on, onToggle, children, goesTo }) {
  return (
    <button onClick={onToggle} data-goes-to={goesTo} className="flex items-start gap-2.5 text-left group">
      <span className={"w-[18px] h-[18px] mt-px rounded-md border flex items-center justify-center flex-shrink-0 transition-colors " +
        (on ? "bg-[#E81E28] border-[#E81E28]" : "bg-white border-[#D4D4D8] group-hover:border-[#A1A1AA]")}>
        {on && <Check size={11} className="text-white" strokeWidth={3.5} />}
      </span>
      <span className="text-xs text-[#52525B] leading-relaxed">{children}</span>
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-[#E5E5E7]" />
      <span className="text-xs font-medium text-[#A1A1AA]">atau</span>
      <div className="flex-1 h-px bg-[#E5E5E7]" />
    </div>
  );
}

export function SocialButtons() {
  const app = useApp();
  const go = (nm) => { app.signIn(); app.navigate("discovery"); toast.success("Berhasil masuk dengan " + nm); };
  const rows = [["Google", "#4285F4", "#F4F4F5", "G"], ["Discord", "#ffffff", "#5865F2", "D"]];
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map(([nm, fg, bg, ch]) => (
        <button
          key={nm}
          onClick={() => go(nm)}
          data-goes-to={"Masuk dengan " + nm + " → Discovery"}
          className="flex items-center justify-center gap-2.5 w-full bg-white border border-[#E5E5E7] hover:bg-[#F5F5F5] active:bg-[#EDEDEF] text-[#0A0A0B] text-sm font-bold py-3 rounded-full transition-colors"
        >
          <span className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-extrabold" style={{ background: bg, color: fg }}>{ch}</span>
          Lanjutkan dengan {nm}
        </button>
      ))}
    </div>
  );
}

export function PillButton({ children, onClick, disabled, busy, goesTo }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      data-goes-to={goesTo}
      className={"flex items-center justify-center gap-2 w-full text-sm font-bold py-3.5 rounded-full transition-colors " +
        (disabled ? "bg-[#E5E5E7] text-[#A1A1AA]" : "bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white")}
    >
      {busy && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
      {children}
    </button>
  );
}

export function StrengthMeter({ value }) {
  const st = pwStrength(value);
  return (
    <div className="mt-2.5">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: i < st ? STRENGTH_COLOR[st] : "#E5E5E7" }} />
        ))}
      </div>
      <p className="flex items-center justify-between gap-3 mt-2 text-xs text-[#A1A1AA]">
        <span>Minimal 8 karakter, tambahkan angka atau simbol.</span>
        {st > 0 && <span className="font-semibold flex-shrink-0" style={{ color: STRENGTH_COLOR[st] }}>{STRENGTH_LABEL[st]}</span>}
      </p>
    </div>
  );
}
