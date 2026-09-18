import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { commissionApi } from '../services/api';
import { ORDERS, REOPEN } from '../data/mockData'; // REOPEN kept for now, ORDERS will be replaced
import { Av } from '../components/ui/Avatar';
import { Pic } from '../components/ui/Pic';
import { EmptyBlock, ErrorBlock, Tip } from '../components/ui/FeedbackBlocks';
import { Check, Clock, RefreshCw, X, Lock, ImageIcon, Send, Star, Briefcase } from '../components/ui/Icons';
import { toast } from '../utils/helpers';
import type { CommissionPackage, CommissionOrder } from '../types';

interface TierPanelProps {
  pkg: CommissionPackage;
  selected: boolean;
  onSelect: () => void;
}

export function TierPanel({ pkg, selected, onSelect }: TierPanelProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div
      onClick={onSelect}
      data-goes-to="Pilih paket → form terkunci"
      className={"relative rounded-xl p-4 cursor-pointer transition-colors " +
        (selected ? "border-2 border-[#E81E28] bg-[#FEF2F3]" : "border border-[#E5E5E7] bg-white hover:border-[#0A0A0B]")}
    >
      <div className="flex items-center justify-between mb-2 mt-1">
        <p className="text-sm font-bold text-[#0A0A0B]">{pkg.title}</p>
        {selected && <Check size={14} className="text-[#E81E28]" />}
      </div>
      <span className="bg-[#FEF2F3] text-[#C41A22] text-xs font-bold px-2.5 py-1 rounded-full inline-block mb-3">
        {formatPrice(pkg.price)}
      </span>
      <div className="flex items-center gap-3 text-xs text-[#52525B] mb-3">
        <span className="flex items-center gap-1"><Clock size={11} className="text-[#A1A1AA]" /> {pkg.delivery_time} hari</span>
      </div>
      {pkg.description && (
        <div className="space-y-1.5 py-3 border-t border-[#E5E5E7]">
          <p className="text-xs text-[#52525B] line-clamp-3">{pkg.description}</p>
        </div>
      )}
      <button
        onClick={e => { e.stopPropagation(); onSelect(); }}
        data-goes-to="Pilih Paket → form terkunci"
        className={"w-full text-xs font-bold py-2 rounded-full transition-colors " +
          (selected ? "bg-[#E81E28] hover:bg-[#C41A22] text-white" : "border border-[#E5E5E7] text-[#0A0A0B] hover:border-[#0A0A0B] active:bg-[#F5F5F5]")}
      >
        {selected ? "Paket Dipilih" : "Pilih Paket"}
      </button>
    </div>
  );
}

interface CommissionFormProps {
  pkg: CommissionPackage;
  onClear: () => void;
  onCreated: (order: CommissionOrder) => void;
}

export function CommissionForm({ pkg, onClear, onCreated }: CommissionFormProps) {
  const app = useApp();
  const [brief, setBrief] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const submit = async () => {
    if (!brief.trim() || submitting) return;
    setSubmitting(true);
    const result = await commissionApi.createOrder({
      package_id: pkg.id,
      brief: brief.trim(),
      deadline_at: deadline || undefined,
    });
    setSubmitting(false);

    if (!result.success || !result.data?.order) {
      toast.error(result.message || 'Pesanan gagal dibuat.');
      return;
    }

    if (result.data.order.status !== 'pending_payment') {
      toast.error('Status pesanan dari server tidak sesuai.');
      return;
    }

    toast.success('Permintaan komisi dibuat', { description: `Pesanan #${result.data.order.id} menunggu pembayaran.` });
    onCreated(result.data.order);
  };

  return (
    <div className="mt-4 border border-[#E5E5E7] rounded-xl overflow-hidden">
      <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E5E5E7] flex items-center gap-2 flex-wrap">
        <Lock size={12} className="text-[#A1A1AA] flex-shrink-0" />
        <p className="text-xs font-bold text-[#0A0A0B]">{pkg.artist.name} · {pkg.title}</p>
        <span className="bg-[#FEF2F3] text-[#C41A22] text-xs font-bold px-2 py-0.5 rounded-full">{formatPrice(pkg.price)}</span>
        <span className="text-xs text-[#52525B]">{pkg.delivery_time} hari</span>
        <button onClick={onClear} data-goes-to="Buka pilihan paket" className="ml-auto text-xs font-semibold text-[#52525B] hover:text-[#0A0A0B] transition-colors">Ubah paket</button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Deskripsi permintaan</p>
          <textarea rows={3} value={brief} onChange={e => setBrief(e.target.value)} placeholder="Ceritakan karakter, suasana, dan referensi yang kamu inginkan..." className="w-full border border-[#E5E5E7] rounded-xl p-3 text-sm text-[#0A0A0B] placeholder-[#A1A1AA] outline-none resize-none focus:border-[#A1A1AA] transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Referensi</p>
            <p className="text-xs text-[#A1A1AA] border border-dashed border-[#E5E5E7] rounded-full px-3 py-2">Upload belum tersedia pada API</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Tenggat diinginkan</p>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full border border-[#E5E5E7] rounded-full px-3 py-2 text-xs text-[#0A0A0B] outline-none focus:border-[#A1A1AA] transition-colors" />
          </div>
        </div>
        <Tip text={brief.trim() ? "Kirim permintaan ke " + pkg.artist.name : "Isi deskripsi permintaan lebih dulu"}>
          <button disabled={!brief.trim() || submitting} onClick={() => app.requireAuth(submit)} data-goes-to="Buat pesanan" className={"text-sm font-bold px-5 py-2.5 rounded-full transition-colors flex items-center gap-1.5 " + (brief.trim() && !submitting ? "bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white" : "bg-[#F5F5F5] text-[#A1A1AA] border border-[#E5E5E7] cursor-not-allowed")}>
            <Send size={12} /> {submitting ? 'Mengirim...' : 'Kirim Permintaan'}
          </button>
        </Tip>
      </div>
    </div>
  );
}

export function CommissionPage() {
  const app = useApp();
  const [searchTab, setSearchTab] = useState(0);
  const [picked, setPicked] = useState<Record<number, number | undefined>>({});
  const refs = useRef<Record<number, HTMLDivElement | null>>({});
  
  const [packages, setPackages] = useState<CommissionPackage[]>([]);
  const [orders, setOrders] = useState<CommissionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const targetArtistId = searchParams.get("artistId") || app.params.artistId;

  useEffect(() => {
    loadPackages();
  }, []);

  useEffect(() => {
    if (searchTab === 1 && orders.length === 0 && !ordersLoading) {
      loadOrders();
    }
  }, [searchTab]);

  useEffect(() => {
    if (!targetArtistId || packages.length === 0) return;
    const targetId = Number(targetArtistId);
    const pkg = packages.find(p => p.artist_id === targetId);
    if (pkg) {
      setSearchTab(0);
      setPicked(p => (p[pkg.artist_id] === undefined ? { ...p, [pkg.artist_id]: pkg.id } : p));
      const el = refs.current[pkg.artist_id];
      if (el) setTimeout(() => window.scrollTo({ top: Math.max(0, el.offsetTop - 16), behavior: "smooth" }), 100);
    }
  }, [targetArtistId, packages]);

  const loadPackages = async () => {
    setLoading(true);
    setError(null);
    const result = await commissionApi.getPackages(100);
    setLoading(false);
    
    if (!result.success) {
      setError(result.message || 'Gagal memuat paket komisi.');
      return;
    }

    const pkgData = result.data?.packages;
    const pkgArray = Array.isArray(pkgData) ? pkgData : (pkgData as any)?.data || [];
    setPackages(pkgArray);
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    const result = await commissionApi.getOrders(100);
    setOrdersLoading(false);

    if (!result.success) {
      toast.error(result.message || 'Gagal memuat pesanan.');
      return;
    }

    const ordData = result.data?.orders;
    const ordArray = Array.isArray(ordData) ? ordData : (ordData as any)?.data || [];
    setOrders(ordArray);
  };

  const handleOrderCreated = (order: CommissionOrder) => {
    setPicked(p => ({ ...p, [order.artist_id]: undefined }));
    setOrders(prev => [order, ...prev]);
    app.openOrder(order);
  };

  const groupedPackages = packages.reduce((acc, pkg) => {
    if (!acc[pkg.artist_id]) {
      acc[pkg.artist_id] = { artist: pkg.artist, packages: [] };
    }
    acc[pkg.artist_id].packages.push(pkg);
    return acc;
  }, {} as Record<number, { artist: typeof packages[0]['artist'], packages: CommissionPackage[] }>);

  const artistIds = Object.keys(groupedPackages).map(Number);
  const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return { label: 'Menunggu Bayar', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'paid':
        return { label: 'Dibayar', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'in_progress':
        return { label: 'Dikerjakan', cls: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'delivered':
        return { label: 'Dikirim', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'completed':
        return { label: 'Selesai', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'released':
        return { label: 'Dirilis', cls: 'bg-green-50 text-green-700 border-green-200' };
      case 'cancelled':
        return { label: 'Dibatalkan', cls: 'bg-gray-100 text-[#52525B] border-gray-200' };
      case 'expired':
        return { label: 'Kedaluwarsa', cls: 'bg-red-50 text-red-700 border-red-200' };
      default:
        return { label: status, cls: 'bg-gray-100 text-[#52525B] border-gray-200' };
    }
  };

  const SK = "bg-[#F5F5F5]";

  return (
    <div className="px-6 pt-5 pb-10">
      <h1 className="text-[28px] font-extrabold text-[#0A0A0B] mb-1">Pesan Karya Custom</h1>
      <p className="text-sm text-[#52525B] mb-5">Temukan artist dan pesan karya eksklusif untukmu</p>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex bg-[#F5F5F5] rounded-full p-1">
          {["Cari Artist", "Pesanan Saya"].map((t, i) => (
            <button key={t} onClick={() => setSearchTab(i)} data-goes-to={i === 0 ? "Tab daftar artist" : "Tab daftar pesanan"} className={"text-sm font-semibold px-4 py-1.5 rounded-full transition-colors " + (searchTab === i ? "bg-white text-[#0A0A0B] shadow-sm" : "text-[#52525B]")}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && searchTab === 0 ? (
        <div className="space-y-10">
          {[0, 1].map(i => (
            <div key={i} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={SK + " w-14 h-14 rounded-full"} />
                <div className="flex-1 space-y-2">
                  <div className={SK + " h-4 w-40 rounded"} />
                  <div className={SK + " h-3 w-64 rounded"} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map(k => <div key={k} className={SK + " rounded-xl"} style={{ height: 250 }} />)}
              </div>
            </div>
          ))}
        </div>
      ) : error && searchTab === 0 ? (
        <ErrorBlock title="Gagal memuat daftar artist" hint={error} onRetry={loadPackages} />
      ) : packages.length === 0 && searchTab === 0 ? (
        <EmptyBlock Icon={Briefcase} title="Belum ada paket komisi tersedia" hint="Cek lagi nanti atau hubungi artist langsung." />
      ) : searchTab === 1 ? (
        <div className="space-y-4">
          {ordersLoading ? (
            <div className={SK + " h-32 rounded-xl"} />
          ) : orders.length === 0 ? (
            <EmptyBlock Icon={Briefcase} title="Belum ada pesanan" hint="Buat pesanan pertama kamu dengan memilih artist dan paket." />
          ) : (
            orders.map(o => {
              const badge = getStatusBadge(o.status);
              return (
                <div key={o.id} onClick={() => app.openOrder(o)} data-goes-to="→ Detail Pesanan" className="border border-[#E5E5E7] rounded-xl p-4 cursor-pointer hover:border-[#0A0A0B] transition-colors">
                  <div className="flex items-start gap-3">
                    <Av bg="#E81E28" initials={o.artist.name.substring(0, 2).toUpperCase()} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-bold text-[#0A0A0B]">{o.artist.name}</p>
                        <span className="text-xs text-[#A1A1AA]">#{o.id}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-[#52525B]">{o.package.title}</span>
                        <span className="bg-[#FEF2F3] text-[#C41A22] text-xs font-bold px-2 py-0.5 rounded-full">{formatPrice(o.amount)}</span>
                      </div>
                    </div>
                    <span className={`${badge.cls} text-xs font-bold px-3 py-1.5 rounded-full border flex-shrink-0`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#52525B] leading-relaxed mt-3 pt-3 border-t border-[#E5E5E7] line-clamp-2">
                    {o.brief}
                  </p>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {artistIds.map(artistId => {
            const group = groupedPackages[artistId];
            const artist = group.artist;
            const pkgs = group.packages;
            const pickedPkgId = picked[artistId];
            const pickedPkg = pkgs.find(p => p.id === pickedPkgId);

            return (
              <div key={artistId} ref={el => { refs.current[artistId] = el; }} className="border-b border-[#E5E5E7] pb-10">
                <div className="flex items-start gap-4 mb-4">
                  <button onClick={() => app.openProfile()} data-goes-to="→ Profil artist">
                    <Av bg="#E81E28" initials={artist.name.substring(0, 2).toUpperCase()} size={56} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <button className="text-base font-bold text-[#0A0A0B] hover:text-[#C41A22] transition-colors" data-goes-to="→ Profil artist" onClick={() => app.openProfile()}>
                        {artist.name}
                      </button>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        Slot Terbuka
                      </span>
                    </div>
                    <p className="text-sm text-[#52525B] mb-1">{artist.bio || 'Artist profesional'}</p>
                  </div>
                  <button onClick={() => app.requireAuth(() => setPicked(p => ({ ...p, [artistId]: p[artistId] === undefined ? pkgs[0]?.id : p[artistId] })))} data-goes-to="Buka form komisi" className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors flex-shrink-0">
                    Ambil Slot
                  </button>
                </div>

                <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2.5">Paket Harga</p>
                <div className="grid grid-cols-3 gap-3">
                  {pkgs.map(pkg => (
                    <TierPanel key={pkg.id} pkg={pkg} selected={pickedPkgId === pkg.id} onSelect={() => setPicked(p => ({ ...p, [artistId]: p[artistId] === pkg.id ? undefined : pkg.id }))} />
                  ))}
                </div>

                {pickedPkg && <CommissionForm pkg={pickedPkg} onClear={() => setPicked(p => ({ ...p, [artistId]: undefined }))} onCreated={handleOrderCreated} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
