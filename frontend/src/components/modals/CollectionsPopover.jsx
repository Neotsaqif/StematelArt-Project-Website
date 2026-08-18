import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Popover } from './ModalShell';
import { MenuRow } from './AvatarMenu';
import { Check, Folder, FolderPlus } from '../ui/Icons';

export function CollectionsPopover({ rect, artwork, onClose }) {
  const app = useApp();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  return (
    <Popover rect={rect} onClose={onClose} width={250}>
      <div className="px-3.5 py-2.5 border-b border-[#E5E5E7]">
        <p className="text-sm font-bold text-[#0A0A0B]">Simpan ke koleksi</p>
        <p className="text-xs text-[#A1A1AA] truncate">{artwork.title}</p>
      </div>
      <div className="py-1 max-h-[220px] overflow-y-auto">
        {app.collections.map(c => (
          <MenuRow
            key={c.id}
            Icon={c.ids.includes(artwork.id) ? Check : Folder}
            label={c.name}
            note={c.ids.length + " karya"}
            hint="Simpan + toast"
            onClick={() => { app.saveTo(c, artwork); onClose(); }}
          />
        ))}
      </div>
      <div className="border-t border-[#E5E5E7] p-2.5">
        {creating ? (
          <div className="flex gap-1.5">
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && name.trim()) { app.createCollection(name.trim(), artwork); onClose(); } }}
              placeholder="Nama koleksi"
              className="flex-1 min-w-0 border border-[#E5E5E7] rounded-full px-3 py-1.5 text-xs outline-none focus:border-[#A1A1AA] transition-colors"
            />
            <button
              onClick={() => { if (name.trim()) { app.createCollection(name.trim(), artwork); onClose(); } }}
              data-goes-to="Buat + simpan"
              className="bg-[#E81E28] hover:bg-[#C41A22] text-white text-xs font-bold px-3 rounded-full transition-colors flex-shrink-0"
            >
              Buat
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            data-goes-to="Kolom nama koleksi baru"
            className="flex items-center gap-2 w-full text-sm font-semibold text-[#C41A22] hover:bg-[#FEF2F3] active:bg-[#FDE3E5] rounded-lg px-1.5 py-1.5 transition-colors"
          >
            <FolderPlus size={15} /> Buat Koleksi Baru
          </button>
        )}
      </div>
    </Popover>
  );
}
