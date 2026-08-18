import React from 'react';

export function Av({ bg, initials, size = 32, ring = false }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${ring ? "ring-2 ring-[#E81E28] ring-offset-2" : ""}`}
      style={{ width: size, height: size, background: bg, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </div>
  );
}
