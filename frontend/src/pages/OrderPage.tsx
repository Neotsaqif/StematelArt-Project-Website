import React from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ORDERS, ORDER_STEPS } from '../data/mockData';
import { Av } from '../components/ui/Avatar';
import { ArrowLeft, Check, X, ChevronRight } from '../components/ui/Icons';
import { toast } from '../utils/helpers';

export function OrderPage() {
  const app = useApp();
  const { id } = useParams<{ id: string }>();
  
  // Find order by path param, or context state fallback, or default to first order
  const o = ORDERS.find(ord => ord.id === id) || app.params.order || ORDERS[0];
  const stage = o.status === "accepted" ? 1 : 0;

  return (
    <div className="px-6 pt-4 pb-10">
      <button onClick={app.back} data-goes-to="← Kembali (posisi scroll pulih)" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors mb-4">
        <ArrowLeft size={14} /> Kembali
      </button>

      <div className="flex items-center gap-3 flex-wrap mb-1">
        <h1 className="text-[28px] font-extrabold text-[#0A0A0B]">Pesanan #{o.id}</h1>
        <span className={"text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 " +
          (o.status === "accepted" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-[#52525B] border-gray-200")}>
          {o.status === "accepted" ? <Check size={11} /> : <X size={11} />} {o.label}
        </span>
      </div>
      <p className="text-sm text-[#52525B] mb-7">{o.tier} · {o.price}</p>

      {/* Timeline */}
      <div className="flex items-center gap-0 mb-8 max-w-xl">
        {ORDER_STEPS.map((st, i) => (
          <React.Fragment key={st}>
            <div className="flex flex-col items-center gap-1.5">
              <span className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold " +
                (i <= stage ? "bg-[#E81E28] text-white" : "bg-[#F5F5F5] text-[#A1A1AA]")}>
                {i < stage ? <Check size={12} /> : i + 1}
              </span>
              <span className={"text-xs font-semibold " + (i <= stage ? "text-[#0A0A0B]" : "text-[#A1A1AA]")}>{st}</span>
            </div>
            {i < ORDER_STEPS.length - 1 && <span className={"flex-1 h-0.5 mx-2 mb-5 " + (i < stage ? "bg-[#E81E28]" : "bg-[#E5E5E7]")} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-4">
          <div className="border border-[#E5E5E7] rounded-xl p-4">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2">Brief</p>
            <p className="text-sm text-[#52525B] leading-relaxed">
              Ilustrasi karakter original bertema dark fantasy, latar hutan berkabut dengan pencahayaan bulan. Palet dingin, fokus pada ekspresi wajah. Untuk dipakai sebagai cover album digital.
            </p>
          </div>
          <div className="border border-[#E5E5E7] rounded-xl p-4">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2">Catatan artist</p>
            <p className="text-sm text-[#52525B] leading-relaxed">{o.note}</p>
          </div>
        </div>
        <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E5E7]">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-0.5">Tenggat</p>
            <p className="text-sm font-bold text-[#0A0A0B]">14 September 2026</p>
          </div>
          <button
            onClick={() => app.openProfile(o.init === "RA" ? "rio" : "bagus")}
            data-goes-to="→ Profil artist"
            className="flex items-center gap-2.5 w-full px-4 py-3 hover:bg-gray-50 active:bg-[#F5F5F5] transition-colors border-b border-[#E5E5E7]"
          >
            <Av bg={o.bg} initials={o.init} size={32} />
            <span className="text-sm font-semibold text-[#0A0A0B]">{o.artist}</span>
            <ChevronRight size={14} className="text-[#A1A1AA] ml-auto" />
          </button>
          <div className="p-4">
            <button
              onClick={() => app.confirm({
                title: "Batalkan pesanan?",
                body: "Pesanan #" + o.id + " akan dibatalkan dan dana escrow dikembalikan dalam 3 hari kerja.",
                label: "Batalkan Pesanan",
                onOk: () => toast.success("Pesanan dibatalkan", { description: "Dana escrow dikembalikan ke metode pembayaranmu" }),
              })}
              data-goes-to="Dialog konfirmasi"
              className="w-full border border-[#E5E5E7] text-[#C41A22] text-sm font-bold py-2.5 rounded-full hover:border-[#E81E28] active:bg-[#FEF2F3] transition-colors"
            >
              Batalkan Pesanan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
