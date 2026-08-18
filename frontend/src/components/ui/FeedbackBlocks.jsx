import React from 'react';
import { Palette, AlertTriangle, RefreshCw } from './Icons';

const SK = "bg-[#F5F5F5]";

export function Tip({ text, children, className = "" }) {
  return (
    <span className={"relative inline-flex group " + className}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
        <span className="block bg-[#0A0A0B] text-white text-[11px] font-medium leading-snug px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">{text}</span>
      </span>
    </span>
  );
}

export function SkeletonGrid({ rows = 3 }) {
  const pattern = [[1.5, 0.8, 1.3, 1.1], [1.2, 1.7, 0.9], [1.4, 1.0, 1.6, 0.7]];
  return (
    <div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex" style={{ gap: 4, marginBottom: 4 }}>
          {pattern[ri % 3].map((fr, ci) => (
            <div key={ci} className={SK} style={{ flexGrow: fr, flexBasis: 0, height: 240 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ n = 6 }) {
  return (
    <div>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-[#E5E5E7]">
          <div className={SK + " w-12 h-8 flex-shrink-0"} />
          <div className={SK + " w-16 h-10 flex-shrink-0 rounded"} />
          <div className="flex-1 space-y-2">
            <div className={SK + " h-3.5 w-1/3 rounded"} />
            <div className={SK + " h-3 w-1/5 rounded"} />
          </div>
          <div className={SK + " h-4 w-20 rounded"} />
        </div>
      ))}
    </div>
  );
}

export function EmptyBlock({ title, hint, Icon = Palette }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-4">
        <Icon size={26} className="text-[#A1A1AA]" />
      </div>
      <p className="text-base font-bold text-[#0A0A0B] mb-1">{title}</p>
      <p className="text-sm text-[#A1A1AA] max-w-xs leading-relaxed">{hint}</p>
    </div>
  );
}

export function ErrorBlock({ title, hint, onRetry }) {
  return (
    <div className="border border-[#E81E28] rounded-xl p-5 flex items-start gap-3">
      <AlertTriangle size={18} className="text-[#C41A22] flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#C41A22] mb-1">{title}</p>
        <p className="text-sm text-[#52525B] leading-relaxed mb-3">{hint}</p>
        <button
          onClick={onRetry}
          className="border border-[#E5E5E7] text-[#0A0A0B] text-xs font-semibold px-3 py-1.5 rounded-full hover:border-[#0A0A0B] transition-colors flex items-center gap-1.5"
        >
          <RefreshCw size={11} /> Coba lagi
        </button>
      </div>
    </div>
  );
}
