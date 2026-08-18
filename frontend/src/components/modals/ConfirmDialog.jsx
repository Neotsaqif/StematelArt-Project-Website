import React from 'react';
import { Modal } from './ModalShell';

export function ConfirmDialog({ spec, onClose }) {
  return (
    <Modal title={spec.title} onClose={onClose} width={400}>
      <div className="p-5">
        <p className="text-sm text-[#52525B] leading-relaxed mb-5">{spec.body}</p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            data-goes-to="Tutup dialog"
            className="flex-1 bg-white border border-[#E5E5E7] text-[#0A0A0B] text-sm font-semibold py-2.5 rounded-full hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors"
          >
            Kembali
          </button>
          <button
            onClick={() => { onClose(); spec.onOk(); }}
            data-goes-to="Konfirmasi + toast"
            className="flex-1 bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold py-2.5 rounded-full transition-colors"
          >
            {spec.label}
          </button>
        </div>
      </div>
    </Modal>
  );
}
