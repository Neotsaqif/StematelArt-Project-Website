import React from 'react';
import { Popover } from './ModalShell';
import { MenuRow } from './AvatarMenu';
import { Link, MessageCircle, X, Share2 } from '../ui/Icons';
import { toast } from '../../utils/helpers';

export function SharePopover({ rect, artwork, onClose }) {
  const rows = [
    { Icon: Link, label: "Salin Tautan", hint: "Salin + toast emerald", act: () => toast.success("Tautan disalin", { description: "artvault.id/karya/" + artwork.id }) },
    { Icon: MessageCircle, label: "WhatsApp", hint: "Bagikan ke WhatsApp", act: () => toast.success("Dibagikan ke WhatsApp") },
    { Icon: X, label: "X", hint: "Bagikan ke X", act: () => toast.success("Dibagikan ke X") },
    { Icon: Share2, label: "Facebook", hint: "Bagikan ke Facebook", act: () => toast.success("Dibagikan ke Facebook") },
  ];
  return (
    <Popover rect={rect} onClose={onClose} width={220}>
      <div className="py-1">
        {rows.map(r => <MenuRow key={r.label} Icon={r.Icon} label={r.label} hint={r.hint} onClick={() => { r.act(); onClose(); }} />)}
      </div>
    </Popover>
  );
}
