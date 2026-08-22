import React, { useState, useEffect } from 'react';
import { toastBus, TOAST_SKIN } from '../../utils/helpers';
import { AlertTriangle, CheckCircle } from './Icons';

export function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    toastBus.subs.add(setItems);
    return () => {
      toastBus.subs.delete(setItems);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        width: 380,
        pointerEvents: "none",
      }}
    >
      {items.map((t) => {
        const sk = TOAST_SKIN[t.type] || TOAST_SKIN.default;
        return (
          <div
            key={t.id}
            style={{
              background: sk.bg,
              border: "1px solid " + sk.bd,
              color: sk.fg,
              borderRadius: 999,
              padding: "10px 18px",
              display: "flex",
              gap: 8,
              alignItems: "center",
              boxShadow: "0 8px 24px rgba(0,0,0,.10)",
              pointerEvents: "auto",
              maxWidth: "100%",
            }}
          >
            {t.type === "error" ? (
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle size={15} style={{ flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>
                {t.title}
              </p>
              {t.description && (
                <p style={{ margin: 0, fontSize: 12, fontWeight: 500, opacity: 0.8, lineHeight: 1.35 }}>
                  {t.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
