import React, { useEffect } from 'react';

export function AnnotationLayer({ on }) {
  useEffect(() => {
    if (!on) return;
    const host = document.createElement("div");
    host.setAttribute("data-annot-host", "");
    Object.assign(host.style, { position: "fixed", inset: "0", zIndex: "110", pointerEvents: "none" });
    document.body.appendChild(host);

    let raf = 0, stop = false;
    const paint = () => {
      if (stop) return;
      host.textContent = "";
      document.querySelectorAll("[data-goes-to]").forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.bottom < -40 || r.top > window.innerHeight + 40) return;
        const box = document.createElement("div");
        Object.assign(box.style, {
          position: "fixed", top: r.top + "px", left: r.left + "px",
          width: r.width + "px", height: r.height + "px",
          border: "1px dashed #E81E28", boxSizing: "border-box",
        });
        const tag = document.createElement("span");
        tag.textContent = el.getAttribute("data-goes-to");
        Object.assign(tag.style, {
          position: "absolute", top: "-10px", left: "0", maxWidth: "270px",
          background: "#E81E28", color: "#fff", font: "700 9px/1.5 'Plus Jakarta Sans',sans-serif",
          letterSpacing: ".02em", textTransform: "uppercase", padding: "1px 5px", borderRadius: "3px",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block",
        });
        box.appendChild(tag);
        host.appendChild(box);
      });
    };
    const queue = () => { if (raf) return; raf = window.setTimeout(() => { raf = 0; paint(); }, 60); };
    paint();
    const tick = setInterval(paint, 500);
    window.addEventListener("scroll", queue, true);
    window.addEventListener("resize", queue);
    return () => {
      stop = true; clearInterval(tick); clearTimeout(raf);
      window.removeEventListener("scroll", queue, true); window.removeEventListener("resize", queue);
      host.remove();
    };
  }, [on]);
  return null;
}
