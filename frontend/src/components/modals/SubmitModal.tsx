import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ARTWORKS } from '../../data/mockData';
import { Modal } from './ModalShell';
import { Pic } from '../ui/Pic';
import { Tip } from '../ui/FeedbackBlocks';
import { Upload, Check } from '../ui/Icons';
import { toast } from '../../utils/helpers';

export function SubmitModal({ onClose }) {
  const app = useApp();
  const [pick, setPick] = useState(null);
  const mine = ARTWORKS.slice(0, 8);
  return (
    <Modal title="Kirim Karya ke Kontes" onClose={onClose} width={560}>
      <div className="p-5 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => { onClose(); app.navigate("upload"); }}
            data-goes-to="→ Alur Unggah"
            className="flex-1 border border-[#E5E5E7] text-[#0A0A0B] text-sm font-semibold py-2.5 rounded-full hover:border-[#0A0A0B] active:bg-[#F5F5F5] transition-colors flex items-center justify-center gap-1.5"
          >
            <Upload size={13} /> Unggah baru
          </button>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2">Pilih dari karya saya</p>
          <div className="grid grid-cols-4 gap-1.5">
            {mine.map(a => (
              <button
                key={a.id}
                onClick={() => setPick(a.id)}
                data-goes-to="Pilih karya"
                className={"relative aspect-square overflow-hidden rounded-lg bg-[#F5F5F5] transition-all " + (pick === a.id ? "ring-2 ring-[#E81E28]" : "hover:opacity-80")}
              >
                <Pic photoId={a.photoId} w={160} h={160} title={a.title} className="w-full h-full" />
                {pick === a.id && (
                  <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#E81E28] text-white flex items-center justify-center"><Check size={11} /></span>
                )}
              </button>
            ))}
          </div>
        </div>
        <Tip text={pick ? "Kirim karya terpilih" : "Pilih satu karya lebih dulu"}>
          <button
            disabled={!pick}
            onClick={() => { onClose(); toast.success("Karya terkirim ke kontes", { description: "Gelombang Nusantara 2026 · menunggu kurasi" }); }}
            data-goes-to="Kirim + toast sukses"
            className={"w-full text-sm font-bold py-2.5 rounded-full transition-colors " +
              (pick ? "bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white" : "bg-[#F5F5F5] text-[#A1A1AA] border border-[#E5E5E7] cursor-not-allowed")}
          >
            Kirim Karya
          </button>
        </Tip>
      </div>
    </Modal>
  );
}
