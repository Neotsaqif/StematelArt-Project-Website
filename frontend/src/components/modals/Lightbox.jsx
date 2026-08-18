import React from 'react';
import { useEsc } from './ModalShell';
import { Pic } from '../ui/Pic';
import { X } from '../ui/Icons';

export function Lightbox({ artwork, onClose }) {
  useEsc(onClose);
  return (
    <div className="fixed inset-0 z-[130] bg-black/90 flex items-center justify-center p-8" onClick={onClose}>
      <button
        onClick={onClose}
        data-goes-to="Tutup (Esc / klik luar)"
        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors"
      >
        <X size={16} />
      </button>
      <Pic
        photoId={artwork.photoId}
        w={1600}
        h={Math.round(1600 / artwork.aspect)}
        title={artwork.title}
        eager
        onClick={e => e.stopPropagation()}
        className="max-w-full"
        style={{ aspectRatio: String(artwork.aspect), height: "min(84vh, 900px)", maxWidth: "92vw", background: "transparent" }}
      />
      <p className="absolute bottom-5 left-0 right-0 text-center text-white/70 text-xs">{artwork.title} · {artwork.artist}</p>
    </div>
  );
}
