import React, { useEffect, useRef } from 'react';

interface MidtransPaymentModalProps {
  snapToken: string;
  orderId: string;
  onClose: () => void;
}

export function MidtransPaymentModal({ snapToken, orderId, onClose }: MidtransPaymentModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only load script if not present
    if (!window.midtransScript) {
      const tag = document.createElement('script');
      tag.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      tag.setAttribute('data-client-key', 'SB-Mid-client-REPLACE-ME'); // Replace on backend config if safe to expose
      tag.async = true;
      tag.onload = () => launchSnap();
      document.body.appendChild(tag);
      window.midtransScript = true;
      return;
    }
    launchSnap();
    // eslint-disable-next-line
  }, [snapToken]);

  const launchSnap = () => {
    if (window.snap) {
      window.snap.pay(snapToken, {
        onSuccess: function(result) { window.location.reload(); },
        onPending: function(result) { window.location.reload(); },
        onError: function(result) { onClose(); },
        onClose,
      });
    }
  };

  return (
    <div ref={ref} className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[98]">
      <div className="p-10 bg-white rounded-xl shadow-lg text-center relative">
        <p className="font-bold text-lg mb-3">Membuka pembayaran...</p>
        <p className="text-sm text-gray-600">Jika tidak muncul, klik <button className="text-[#E81E28] underline" onClick={launchSnap}>ini</button> untuk membayar ulang.</p>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-[#E81E28] text-xl">×</button>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    snap?: any;
    midtransScript?: boolean;
  }
}
