import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Upload } from '../ui/Icons';

export function MobileTopBar() {
  const app = useApp();
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-12 bg-white border-b border-[#E5E5E7] flex items-center gap-2 px-3 z-40">
      <div className="flex items-center gap-2 flex-1 bg-[#F4F4F5] rounded-full px-3 py-1.5">
        <Search size={13} className="text-[#A1A1AA] flex-shrink-0" />
        <input
          onKeyDown={e => { if (e.key === "Enter" && e.currentTarget.value.trim()) app.openSearch(e.currentTarget.value.trim()); }}
          className="bg-transparent text-sm placeholder-[#A1A1AA] outline-none w-full"
          placeholder="Cari karya atau artist..."
        />
      </div>
      {app.loggedIn ? (
        <button
          onClick={() => app.navigate("upload")}
          className="bg-[#E81E28] text-white text-xs font-semibold rounded-full px-3 py-1.5 flex items-center gap-1 flex-shrink-0 hover:bg-[#C41A22]"
        >
          <Upload size={11} /> Unggah
        </button>
      ) : (
        <button
          onClick={() => app.navigate("login")}
          className="bg-[#E81E28] text-white text-xs font-semibold rounded-full px-3.5 py-1.5 flex-shrink-0 hover:bg-[#C41A22]"
        >
          Masuk
        </button>
      )}
    </div>
  );
}
