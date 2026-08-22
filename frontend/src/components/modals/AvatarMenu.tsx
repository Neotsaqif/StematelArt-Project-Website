import React from 'react';
import { useApp } from '../../context/AppContext';
import { Popover } from './ModalShell';
import { Av } from '../ui/Avatar';
import { User, Stamp, Settings, LogOut } from '../ui/Icons';
import { toast } from '../../utils/helpers';

export interface MenuRowProps {
  Icon: any;
  label: string;
  note?: string;
  hint?: string;
  onClick?: () => void;
  danger?: boolean;
}

export function MenuRow({ Icon, label, note, hint, onClick, danger }: MenuRowProps) {
  return (
    <button
      onClick={onClick}
      data-goes-to={hint}
      className={"flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm font-semibold transition-colors text-left " +
        (danger ? "text-[#C41A22] hover:bg-[#FEF2F3] active:bg-[#FDE3E5]" : "text-[#52525B] hover:bg-gray-50 hover:text-[#0A0A0B] active:bg-[#F5F5F5]")}
    >
      <Icon size={15} className="flex-shrink-0" />
      <span className="min-w-0">
        {label}
        {note && <span className="block text-xs font-normal text-[#A1A1AA]">{note}</span>}
      </span>
    </button>
  );
}

export function AvatarMenu({ rect, onClose }: { rect: DOMRect | null; onClose: () => void }) {
  const app = useApp();
  return (
    <Popover rect={rect} onClose={onClose} width={230}>
      <div className="px-3.5 py-3 border-b border-[#E5E5E7] flex items-center gap-2.5">
        <Av bg="#E81E28" initials="AU" size={34} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#0A0A0B] truncate">{app.loggedIn ? "Artvault User" : "Tamu"}</p>
          <p className="text-xs text-[#A1A1AA]">{app.loggedIn ? "@artvault_user" : "Belum masuk"}</p>
        </div>
      </div>
      <div className="py-1">
        <MenuRow Icon={User}  label="Profil Saya"        hint="→ Profil" onClick={() => { onClose(); app.requireAuth(() => app.openProfile("me")); }} />
        <MenuRow Icon={Stamp} label="Watermark Generator" hint="→ Watermark Generator" onClick={() => { onClose(); app.navigate("watermark"); }} />
        <MenuRow Icon={Settings} label="Pengaturan"      hint="→ Pengaturan" onClick={() => { onClose(); app.requireAuth(() => app.navigate("settings")); }} />
      </div>
      <div className="border-t border-[#E5E5E7] py-1">
        {app.loggedIn ? (
          <MenuRow Icon={LogOut} danger label="Keluar" hint="Keluar + toast" onClick={() => { onClose(); app.logout(); }} />
        ) : (
          <MenuRow Icon={LogOut} label="Masuk" hint="Modal masuk" onClick={() => { onClose(); app.requireAuth(() => toast.success("Berhasil masuk")); }} />
        )}
      </div>
    </Popover>
  );
}
