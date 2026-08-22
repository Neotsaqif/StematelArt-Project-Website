import React, { useEffect } from 'react';
import { X } from '../ui/Icons';

export function useEsc(onClose) {
  useEffect(() => {
    const k = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
}

export function Modal({ title, onClose, children, width = 440 }) {
  useEsc(onClose);
  return (
    <div className="fixed inset-0 z-[120] bg-black/45 flex items-start justify-center p-6 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full my-auto overflow-hidden"
        style={{ maxWidth: width }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5E7]">
          <p className="text-sm font-bold text-[#0A0A0B]">{title}</p>
          <button
            onClick={onClose}
            data-goes-to="Tutup (Esc / klik luar)"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#52525B] hover:bg-gray-50 active:bg-[#F5F5F5] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Popover({ rect, onClose, children, width = 250 }) {
  useEsc(onClose);
  const left = Math.min(Math.max(10, (rect.left + rect.width / 2) - width / 2), window.innerWidth - width - 10);
  const openUp = rect.bottom + 260 > window.innerHeight;
  const style = openUp
    ? { left, bottom: window.innerHeight - rect.top + 8, width }
    : { left, top: rect.bottom + 8, width };
  return (
    <div className="fixed inset-0 z-[120]" onClick={onClose}>
      <div
        className="fixed bg-white border border-[#E5E5E7] rounded-xl shadow-xl overflow-hidden"
        style={style}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
