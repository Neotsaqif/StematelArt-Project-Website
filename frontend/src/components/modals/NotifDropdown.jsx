import React from 'react';
import { useApp } from '../../context/AppContext';
import { NOTIFS, ARTWORKS, ORDERS } from '../../data/mockData';
import { Popover } from './ModalShell';
import { Av } from '../ui/Avatar';
import { Pic } from '../ui/Pic';
import { toast } from '../../utils/helpers';

export function NotifDropdown({ rect, onClose }) {
  const app = useApp();
  return (
    <Popover rect={rect} onClose={onClose} width={330}>
      <div className="px-4 py-2.5 border-b border-[#E5E5E7] flex items-center justify-between">
        <p className="text-sm font-bold text-[#0A0A0B]">Notifikasi</p>
        <button onClick={() => { toast.success("Semua ditandai terbaca"); onClose(); }} data-goes-to="Tandai terbaca + toast" className="text-xs font-semibold text-[#52525B] hover:text-[#0A0A0B] transition-colors">Tandai terbaca</button>
      </div>
      <div className="max-h-[340px] overflow-y-auto">
        {NOTIFS.map(n => {
          const art = n.art ? ARTWORKS.find(a => a.id === n.art) : null;
          const order = n.order ? ORDERS.find(o => o.id === n.order) : null;
          const hint = n.kind === "order" ? "→ Detail Pesanan" : n.kind === "comment" ? "→ Komentar karya" : "→ Halaman Karya";
          return (
            <button
              key={n.id}
              onClick={() => { onClose(); if (order) app.openOrder(order); else if (art) app.openArtwork(art); }}
              data-goes-to={hint}
              className="flex items-start gap-2.5 w-full px-4 py-3 border-b border-[#E5E5E7] last:border-0 hover:bg-gray-50 active:bg-[#F5F5F5] transition-colors text-left"
            >
              <Av bg={n.bg} initials={n.init} size={30} />
              <span className="min-w-0 flex-1">
                <span className="text-sm text-[#0A0A0B] leading-snug block"><strong className="font-bold">{n.who}</strong> {n.text}</span>
                <span className="text-xs text-[#A1A1AA]">{n.ago}</span>
              </span>
              {art && <Pic photoId={art.photoId} w={64} h={64} title={art.title} compact className="w-8 h-8 rounded flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </Popover>
  );
}
