import React, { useState } from 'react';
import { imgUrl } from '../../utils/helpers';
import { Palette } from './Icons';

export interface PicProps {
  photoId: string;
  w: number;
  h: number;
  title?: string;
  className?: string;
  imgClass?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  dataGoesTo?: string;
  compact?: boolean;
  eager?: boolean;
}

export function Pic({ photoId, w, h, title, className = "", imgClass = "", style, onClick, dataGoesTo, compact, eager }: PicProps) {
  const [st, setSt] = useState("load");
  return (
    <div
      className={"relative overflow-hidden bg-[#F5F5F5] " + className}
      style={style}
      onClick={onClick}
      data-goes-to={dataGoesTo}
    >
      {st === "load" && (
        <span
          className="absolute inset-0"
          style={{
            background: "linear-gradient(100deg, #F5F5F5 28%, #EAEAEC 48%, #F5F5F5 68%)",
            backgroundSize: "220% 100%",
            animation: "avShimmer 1.5s linear infinite",
          }}
        />
      )}
      {st === "err" ? (
        <span
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2"
          style={{ background: "#F1F1F3" }}
        >
          <Palette size={compact ? 13 : 20} style={{ color: "#A1A1AA" }} />
          {!compact && title && (
            <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: "#A1A1AA" }}>
              {title}
            </span>
          )}
        </span>
      ) : (
        <img
          src={imgUrl(photoId, w, h)}
          alt=""
          aria-label={title || undefined}
          loading={eager ? "eager" : "lazy"}
          onLoad={() => setSt("ok")}
          onError={() => setSt("err")}
          className={"absolute inset-0 w-full h-full object-cover " + imgClass}
          style={{ opacity: st === "ok" ? 1 : 0, transition: "opacity .3s ease" }}
        />
      )}
    </div>
  );
}
