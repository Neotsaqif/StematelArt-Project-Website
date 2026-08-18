import React from 'react';
import { useApp } from '../../context/AppContext';
import { NAV_ITEMS, COLLECTION_NAV, NOTIFS } from '../../data/mockData';
import { Palette, Bell, Info } from '../ui/Icons';
import { Av } from '../ui/Avatar';

export function Sidebar() {
  const app = useApp();
  const screen = app.screen;
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-[#E5E5E7] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <button onClick={() => app.navigate("discovery")} data-goes-to="→ Discovery" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#E81E28] rounded-lg flex items-center justify-center flex-shrink-0">
            <Palette size={16} className="text-white" />
          </div>
          <span className="text-[18px] font-extrabold leading-none tracking-tight">
            <span className="text-[#0A0A0B]">ART</span><span className="text-[#E81E28]">VAULT</span>
          </span>
        </button>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar">
        <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest px-5 mb-1">Jelajahi</p>
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = screen === id;
          return (
            <div key={id} className="relative">
              {active && <div className="absolute left-0 inset-y-1.5 w-[3px] bg-[#E81E28] rounded-r" />}
              <button
                onClick={() => app.navigate(id)}
                data-goes-to={"→ " + label}
                className={"flex items-center gap-3 w-full pl-5 pr-4 py-2.5 text-sm font-semibold transition-colors " + (active ? "bg-[#FEF2F3] text-[#C41A22]" : "text-[#52525B] hover:bg-gray-50 hover:text-[#0A0A0B] active:bg-[#F5F5F5]")}
              >
                <Icon size={17} />
                {label}
              </button>
            </div>
          );
        })}

        <div className="mx-5 my-3 border-t border-[#E5E5E7]" />

        <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest px-5 mb-1">Koleksi Saya</p>
        {COLLECTION_NAV.map(({ id, label, Icon }) => {
          const active = screen === id || (id === "collections" && screen === "collection");
          return (
            <div key={id} className="relative">
              {active && <div className="absolute left-0 inset-y-1.5 w-[3px] bg-[#E81E28] rounded-r" />}
              <button
                onClick={() => app.requireAuth(() => app.navigate(id))}
                data-goes-to={id === "favorites" ? "→ Grid karya disukai" : "→ Grid folder koleksi"}
                className={"flex items-center gap-3 w-full pl-5 pr-4 py-2.5 text-sm font-semibold transition-colors " + (active ? "bg-[#FEF2F3] text-[#C41A22]" : "text-[#52525B] hover:bg-gray-50 hover:text-[#0A0A0B] active:bg-[#F5F5F5]")}
              >
                <Icon size={17} /> {label}
              </button>
            </div>
          );
        })}
        <button
          onClick={e => { const r = e.currentTarget.getBoundingClientRect(); app.requireAuth(() => app.openNotifs(r)); }}
          data-goes-to="Dropdown notifikasi"
          className="flex items-center gap-3 w-full pl-5 pr-4 py-2.5 text-sm font-semibold text-[#52525B] hover:bg-gray-50 hover:text-[#0A0A0B] active:bg-[#F5F5F5] transition-colors"
        >
          <Bell size={17} /> Notifikasi
          {app.loggedIn && <span className="ml-auto bg-[#E81E28] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{NOTIFS.length}</span>}
        </button>

        <div className="mx-5 my-3 border-t border-[#E5E5E7]" />

        <div className="relative">
          {screen === "about" && <div className="absolute left-0 inset-y-1.5 w-[3px] bg-[#E81E28] rounded-r" />}
          <button
            onClick={() => app.navigate("about")}
            data-goes-to="→ Halaman Tentang"
            className={"flex items-center gap-3 w-full pl-5 pr-4 py-2.5 text-sm font-semibold transition-colors " + (screen === "about" ? "bg-[#FEF2F3] text-[#C41A22]" : "text-[#52525B] hover:bg-gray-50 hover:text-[#0A0A0B] active:bg-[#F5F5F5]")}
          >
            <Info size={17} /> Tentang
          </button>
        </div>
        <div className="h-3" />
      </nav>

      {/* User row */}
      <div className="border-t border-[#E5E5E7] px-3 py-3 flex-shrink-0">
        {app.loggedIn ? (
          <button
            onClick={e => app.openAvatarMenu(e.currentTarget.getBoundingClientRect())}
            data-goes-to="Menu akun"
            className="flex items-center gap-2.5 w-full hover:bg-gray-50 active:bg-[#F5F5F5] rounded-xl px-2 py-2 transition-colors"
          >
            <Av bg="#E81E28" initials="AU" size={32} />
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-[#0A0A0B] truncate leading-tight">Artvault User</p>
              <p className="text-xs text-[#A1A1AA]">@artvault_user</p>
            </div>
          </button>
        ) : (
          <div className="flex flex-col gap-2 px-1 pt-0.5">
            <button
              onClick={() => app.navigate("login")}
              data-goes-to="→ Halaman Masuk"
              className="w-full bg-white border border-[#E5E5E7] hover:bg-[#F5F5F5] active:bg-[#EDEDEF] text-[#0A0A0B] text-sm font-bold py-2.5 rounded-full transition-colors"
            >
              Masuk
            </button>
            <button
              onClick={() => app.navigate("signup")}
              data-goes-to="→ Halaman Daftar"
              className="w-full bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold py-2.5 rounded-full transition-colors"
            >
              Daftar
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
