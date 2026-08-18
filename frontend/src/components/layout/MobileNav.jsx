import React from 'react';
import { useApp } from '../../context/AppContext';
import { MOBILE_NAV } from '../../data/mockData';

export function MobileNav() {
  const app = useApp();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E5E7] flex items-center z-40">
      {MOBILE_NAV.map(({ id, label, Icon }) => {
        const active = app.screen === id;
        return (
          <button key={id} onClick={() => app.navigate(id)} className="flex-1 flex flex-col items-center gap-0.5 py-2">
            <Icon size={20} className={active ? "text-[#E81E28]" : "text-[#A1A1AA]"} />
            <span className={"text-[9px] font-semibold " + (active ? "text-[#E81E28]" : "text-[#A1A1AA]")}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
