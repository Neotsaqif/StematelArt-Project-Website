import React from 'react';
import { VIEW_STATES } from '../../data/mockData';
import { Info } from '../ui/Icons';

export function DevBar({ value, onChange, annotate, onAnnotate }) {
  return (
    <div className="hidden md:flex fixed bottom-5 right-5 z-[100] items-center gap-1 bg-white border border-[#E5E5E7] shadow-lg rounded-full p-1">
      <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest px-2">Status</span>
      {VIEW_STATES.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={"text-xs font-semibold px-3 py-1.5 rounded-full transition-colors " + (value === id ? "bg-[#E81E28] text-white" : "text-[#52525B] hover:text-[#0A0A0B]")}
        >
          {label}
        </button>
      ))}
      <span className="w-px h-5 bg-[#E5E5E7] mx-1" />
      <button
        onClick={() => onAnnotate(!annotate)}
        className={"text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 " + (annotate ? "bg-[#0A0A0B] text-white" : "text-[#52525B] hover:text-[#0A0A0B]")}
      >
        <Info size={11} /> Anotasi
      </button>
    </div>
  );
}
