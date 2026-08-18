import React from 'react';
import { useApp } from '../../context/AppContext';
import { Popover } from './ModalShell';
import { MenuRow } from './AvatarMenu';
import { Download, Copy, Flag } from '../ui/Icons';
import { toast } from '../../utils/helpers';

export function MoreMenu({ rect, artwork, onClose }) {
  const app = useApp();
  return (
    <Popover rect={rect} onClose={onClose} width={220}>
      <div className="py-1">
        <MenuRow Icon={Download} label="Unduh" note="PNG · 2400px" hint="Unduh + toast" onClick={() => { toast.success("Berkas diunduh", { description: artwork.title + ".png" }); onClose(); }} />
        <MenuRow Icon={Copy} label="Sematkan" note="Salin kode embed" hint="Salin kode + toast" onClick={() => { toast.success("Kode sematan disalin"); onClose(); }} />
      </div>
      <div className="border-t border-[#E5E5E7] py-1">
        <MenuRow
          Icon={Flag} danger label="Laporkan" hint="Dialog konfirmasi"
          onClick={() => {
            onClose();
            app.confirm({
              title: "Laporkan karya ini?",
              body: "Tim moderasi ARTVAULT akan meninjau “" + artwork.title + "” dalam 1×24 jam.",
              label: "Laporkan",
              onOk: () => toast.success("Laporan terkirim", { description: "Kami kabari hasil peninjauan lewat notifikasi" }),
            });
          }}
        />
      </div>
    </Popover>
  );
}
