import React from 'react';
import { useApp } from '../../context/AppContext';
import { PARTICIPANTS } from '../../data/mockData';
import { Modal } from './ModalShell';
import { Av } from '../ui/Avatar';
import { ChevronRight } from '../ui/Icons';

export function ParticipantsModal({ onClose }) {
  const app = useApp();
  return (
    <Modal title="Peserta Kontes (1.247)" onClose={onClose} width={420}>
      <div className="max-h-[420px] overflow-y-auto">
        {PARTICIPANTS.map(p => (
          <button
            key={p.id + p.name}
            onClick={() => { onClose(); app.openProfile(p.id); }}
            data-goes-to="→ Profil artist"
            className="flex items-center gap-3 w-full px-5 py-3 border-b border-[#E5E5E7] last:border-0 hover:bg-gray-50 active:bg-[#F5F5F5] transition-colors text-left"
          >
            <Av bg={p.bg} initials={p.init} size={32} />
            <span className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-[#0A0A0B] block truncate">{p.name}</span>
              <span className="text-xs text-[#A1A1AA]">{p.works} karya dikirim</span>
            </span>
            <ChevronRight size={14} className="text-[#A1A1AA] flex-shrink-0" />
          </button>
        ))}
      </div>
    </Modal>
  );
}
