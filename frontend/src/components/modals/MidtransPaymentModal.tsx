import React, { useEffect, useRef, useState } from 'react';

interface MidtransPaymentModalProps {
  snapToken: string;
  orderId: string;
  onClose: () => void;
}

function getMidtransConfig() {
  const env = import.meta.env.VITE_MIDTRANS_ENV || 'sandbox';
  const snapUrl = import.meta.env.VITE_MIDTRANS_SNAP_URL;
  const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;

  if (!snapUrl || !clientKey) {
    throw new Error(`[Midtrans] ${env} environment requires VITE_MIDTRANS_SNAP_URL and VITE_MIDTRANS_CLIENT_KEY to be configured.`);
  }

  return {
    env,
    snapUrl,
    clientKey,
  };
}

export function MidtransPaymentModal({ snapToken, orderId, onClose }: MidtransPaymentModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const config = getMidtransConfig();

      if (!window.midtransScript) {
        const tag = document.createElement('script');
        tag.src = config.snapUrl;
        tag.setAttribute('data-client-key', config.clientKey);
        tag.async = true;
        tag.onload = () => launchSnap();
        tag.onerror = () => {
          setConfigError('Gagal memuat Midtrans Snap. Periksa konfigurasi VITE_MIDTRANS_SNAP_URL.');
        };
        document.body.appendChild(tag);
        window.midtransScript = true;
        return;
      }
      launchSnap();
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : 'Konfigurasi Midtrans tidak valid.');
    }
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

  if (configError) {
    return (
      <div ref={ref} className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[98]">
        <div className="p-10 bg-white rounded-xl shadow-lg text-center relative max-w-md">
          <p className="font-bold text-lg mb-3 text-red-600">Konfigurasi Error</p>
          <p className="text-sm text-gray-700 mb-6">{configError}</p>
          <button onClick={onClose} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Tutup</button>
        </div>
      </div>
    );
  }

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
