import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { commissionApi } from '../services/api';
import { Av } from '../components/ui/Avatar';
import { ArrowLeft, Check, X, ChevronRight, Clock } from '../components/ui/Icons';
import { toast } from '../utils/helpers';
import type { CommissionOrder, CommissionOrderStatus } from '../types';

export function OrderPage() {
  const app = useApp();
  const { id } = useParams<{ id: string }>();
  
  const [order, setOrder] = useState<CommissionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    const orderId = id || (app.params.order as CommissionOrder)?.id;
    if (!orderId) {
      setError('ID pesanan tidak ditemukan.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await commissionApi.getOrder(orderId);
    setLoading(false);

    if (!result.success || !result.data?.order) {
      setError(result.message || 'Pesanan tidak ditemukan.');
      return;
    }

    setOrder(result.data.order);
  };

  const handlePayment = async () => {
    if (!order || actionBusy) return;
    setActionBusy(true);
    const result = await commissionApi.createPayment(order.id);
    setActionBusy(false);

    if (!result.success || !result.data?.payment) {
      toast.error(result.message || 'Gagal membuat pembayaran.');
      return;
    }

    const { snap_token, order_id } = result.data.payment;
    app.openMidtransPayment({ snapToken: snap_token, orderId: order_id });
  };

  const handleStart = async () => {
    if (!order || actionBusy) return;
    setActionBusy(true);
    const result = await commissionApi.startOrder(order.id);
    setActionBusy(false);

    if (!result.success || !result.data?.order) {
      toast.error(result.message || 'Gagal memulai pesanan.');
      return;
    }

    setOrder(result.data.order);
    toast.success('Pesanan dimulai.');
  };

  const handleDeliver = async () => {
    if (!order || actionBusy) return;
    setActionBusy(true);
    const result = await commissionApi.deliverOrder(order.id);
    setActionBusy(false);

    if (!result.success || !result.data?.order) {
      toast.error(result.message || 'Gagal mengirim karya.');
      return;
    }

    setOrder(result.data.order);
    toast.success('Karya dikirim ke buyer.');
  };

  const handleComplete = async () => {
    if (!order || actionBusy) return;
    setActionBusy(true);
    const result = await commissionApi.completeOrder(order.id);
    setActionBusy(false);

    if (!result.success || !result.data?.order) {
      toast.error(result.message || 'Gagal menyelesaikan pesanan.');
      return;
    }

    setOrder(result.data.order);
    toast.success('Pesanan selesai.');
  };

  const handleCancel = async () => {
    if (!order || actionBusy) return;
    app.confirm({
      title: "Batalkan pesanan?",
      body: `Pesanan #${order.id} akan dibatalkan. Dana akan dikembalikan sesuai status pembayaran.`,
      label: "Batalkan Pesanan",
      onOk: async () => {
        setActionBusy(true);
        const result = await commissionApi.cancelOrder(order.id);
        setActionBusy(false);

        if (!result.success || !result.data?.order) {
          toast.error(result.message || 'Gagal membatalkan pesanan.');
          return;
        }

        setOrder(result.data.order);
        toast.success('Pesanan dibatalkan.');
      },
    });
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getStatusBadge = (status: CommissionOrderStatus) => {
    switch (status) {
      case 'pending_payment':
        return { label: 'Menunggu Bayar', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
      case 'paid':
        return { label: 'Dibayar', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Check };
      case 'in_progress':
        return { label: 'Dikerjakan', cls: 'bg-purple-50 text-purple-700 border-purple-200', icon: Clock };
      case 'delivered':
        return { label: 'Dikirim', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Check };
      case 'completed':
        return { label: 'Selesai', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Check };
      case 'released':
        return { label: 'Dirilis', cls: 'bg-green-50 text-green-700 border-green-200', icon: Check };
      case 'cancelled':
        return { label: 'Dibatalkan', cls: 'bg-gray-100 text-[#52525B] border-gray-200', icon: X };
      case 'expired':
        return { label: 'Kedaluwarsa', cls: 'bg-red-50 text-red-700 border-red-200', icon: X };
      default:
        return { label: status, cls: 'bg-gray-100 text-[#52525B] border-gray-200', icon: Clock };
    }
  };

  const getStageIndex = (status: CommissionOrderStatus): number => {
    const stages: CommissionOrderStatus[] = ['pending_payment', 'paid', 'in_progress', 'delivered', 'completed', 'released'];
    return stages.indexOf(status);
  };

  if (loading) {
    return (
      <div className="px-6 pt-4 pb-10">
        <div className="bg-[#F5F5F5] h-8 w-32 rounded mb-4" />
        <div className="bg-[#F5F5F5] h-10 w-64 rounded mb-2" />
        <div className="bg-[#F5F5F5] h-5 w-48 rounded mb-7" />
        <div className="bg-[#F5F5F5] h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="px-6 pt-4 pb-10">
        <button onClick={app.back} className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors mb-4">
          <ArrowLeft size={14} /> Kembali
        </button>
        <div className="border border-[#E5E5E7] rounded-xl p-6 text-center">
          <p className="text-sm text-[#C41A22] font-semibold mb-2">{error || 'Pesanan tidak ditemukan'}</p>
          <button onClick={loadOrder} className="text-sm text-[#0A0A0B] hover:underline">Coba lagi</button>
        </div>
      </div>
    );
  }

  const badge = getStatusBadge(order.status);
  const IconComp = badge.icon;
  const stage = getStageIndex(order.status);
  const steps = ['Menunggu', 'Dibayar', 'Dikerjakan', 'Dikirim', 'Selesai', 'Dirilis'];

  return (
    <div className="px-6 pt-4 pb-10">
      <button onClick={app.back} data-goes-to="← Kembali" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#0A0A0B] transition-colors mb-4">
        <ArrowLeft size={14} /> Kembali
      </button>

      <div className="flex items-center gap-3 flex-wrap mb-1">
        <h1 className="text-[28px] font-extrabold text-[#0A0A0B]">Pesanan #{order.id}</h1>
        <span className={`${badge.cls} text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5`}>
          <IconComp size={11} /> {badge.label}
        </span>
      </div>
      <p className="text-sm text-[#52525B] mb-7">{order.package.title} · {formatPrice(order.amount)}</p>

      {stage >= 0 && stage < 6 && (
        <div className="flex items-center gap-0 mb-8 max-w-2xl overflow-x-auto">
          {steps.map((st, i) => (
            <React.Fragment key={st}>
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <span className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold " + (i <= stage ? "bg-[#E81E28] text-white" : "bg-[#F5F5F5] text-[#A1A1AA]")}>
                  {i < stage ? <Check size={12} /> : i + 1}
                </span>
                <span className={"text-xs font-semibold whitespace-nowrap " + (i <= stage ? "text-[#0A0A0B]" : "text-[#A1A1AA]")}>{st}</span>
              </div>
              {i < steps.length - 1 && <span className={"flex-1 h-0.5 mx-2 mb-5 min-w-[24px] " + (i < stage ? "bg-[#E81E28]" : "bg-[#E5E5E7]")} />}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-4">
          <div className="border border-[#E5E5E7] rounded-xl p-4">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2">Brief</p>
            <p className="text-sm text-[#52525B] leading-relaxed">{order.brief}</p>
          </div>
          {order.deadline_at && (
            <div className="border border-[#E5E5E7] rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2">Tenggat</p>
              <p className="text-sm font-bold text-[#0A0A0B]">{formatDate(order.deadline_at)}</p>
            </div>
          )}
        </div>
        <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E5E7]">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-0.5">Dibuat</p>
            <p className="text-sm font-bold text-[#0A0A0B]">{formatDate(order.created_at)}</p>
          </div>
          <button onClick={() => app.openProfile()} data-goes-to="→ Profil artist" className="flex items-center gap-2.5 w-full px-4 py-3 hover:bg-gray-50 active:bg-[#F5F5F5] transition-colors border-b border-[#E5E5E7]">
            <Av bg="#E81E28" initials={order.artist.name.substring(0, 2).toUpperCase()} size={32} />
            <span className="text-sm font-semibold text-[#0A0A0B]">{order.artist.name}</span>
            <ChevronRight size={14} className="text-[#A1A1AA] ml-auto" />
          </button>
          <div className="p-4 space-y-2">
            {order.status === 'pending_payment' && (
              <button disabled={actionBusy} onClick={handlePayment} className="w-full bg-[#E81E28] hover:bg-[#C41A22] text-white text-sm font-bold py-2.5 rounded-full transition-colors disabled:opacity-50">
                {actionBusy ? 'Memproses...' : 'Bayar Sekarang'}
              </button>
            )}
            {order.status === 'paid' && order.artist_id === order.buyer_id && (
              <button disabled={actionBusy} onClick={handleStart} className="w-full bg-[#E81E28] hover:bg-[#C41A22] text-white text-sm font-bold py-2.5 rounded-full transition-colors disabled:opacity-50">
                {actionBusy ? 'Memproses...' : 'Mulai Pengerjaan'}
              </button>
            )}
            {order.status === 'in_progress' && order.artist_id === order.buyer_id && (
              <button disabled={actionBusy} onClick={handleDeliver} className="w-full bg-[#E81E28] hover:bg-[#C41A22] text-white text-sm font-bold py-2.5 rounded-full transition-colors disabled:opacity-50">
                {actionBusy ? 'Memproses...' : 'Kirim Karya'}
              </button>
            )}
            {order.status === 'delivered' && order.buyer_id === order.buyer_id && (
              <button disabled={actionBusy} onClick={handleComplete} className="w-full bg-[#E81E28] hover:bg-[#C41A22] text-white text-sm font-bold py-2.5 rounded-full transition-colors disabled:opacity-50">
                {actionBusy ? 'Memproses...' : 'Konfirmasi Selesai'}
              </button>
            )}
            {['pending_payment', 'paid'].includes(order.status) && (
              <button disabled={actionBusy} onClick={handleCancel} className="w-full border border-[#E5E5E7] text-[#C41A22] text-sm font-bold py-2.5 rounded-full hover:border-[#E81E28] active:bg-[#FEF2F3] transition-colors disabled:opacity-50">
                {actionBusy ? 'Memproses...' : 'Batalkan Pesanan'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
