import React, { useState } from 'react';
import { ARTWORKS } from '../data/mockData';
import { Pic } from '../components/ui/Pic';
import { Av } from '../components/ui/Avatar';
import { Compass, Trophy, Briefcase, Award, Shield, ChevronRight } from '../components/ui/Icons';

export function AboutPage({ navigate }) {
  const [openFaq, setOpenFaq] = useState(0);
  const faqs = [
    ["Apakah ARTVAULT gratis?", "Ya. Membuat akun, mengunggah karya, dan mengikuti kontes tidak dipungut biaya. Kami hanya mengambil 5% dari komisi yang berhasil diselesaikan."],
    ["Siapa yang memegang hak cipta karya saya?", "Sepenuhnya milikmu. ARTVAULT hanya menampilkan karya; kami tidak pernah menjual atau melisensikannya tanpa izin tertulis darimu."],
    ["Bagaimana cara membuka komisi?", "Buka Pengaturan, aktifkan status komisi, lalu susun paket harga beserta deskripsi layanan dan estimasi waktu pengerjaan."],
    ["Bagaimana peringkat dihitung?", "Skor gabungan dari suka, komentar, dan jumlah dilihat sepanjang usia karya. Tidak ada slot yang bisa dibeli."],
    ["Apa yang terjadi jika komisi bermasalah?", "Ajukan sengketa dari halaman pesanan. Dana tetap ditahan escrow sampai tim kami menengahi dan kedua pihak sepakat."],
  ];
  const frames = [
    { a: ARTWORKS[5],  cls: "left-0 top-10 w-[46%]",       rot: -7, z: 1 },
    { a: ARTWORKS[13], cls: "right-0 top-0 w-[44%]",       rot: 6,  z: 2 },
    { a: ARTWORKS[2],  cls: "left-[25%] bottom-0 w-[50%]", rot: -2, z: 3 },
  ];
  const doing = [
    { Icon: Compass,   title: "Discovery",  desc: "Feed harian yang menampilkan karya baru dari seluruh Indonesia." },
    { Icon: Trophy,    title: "Ranking",    desc: "Peringkat berbasis apresiasi nyata, dihitung ulang setiap jam." },
    { Icon: Briefcase, title: "Commission", desc: "Pemesanan karya dengan paket harga jelas dan dana terlindungi." },
    { Icon: Award,     title: "Contest",    desc: "Kontes bertema tiap bulan dengan hadiah dan juri undangan." },
  ];
  const steps = [
    ["1", "Klien membayar di muka", "Dana masuk ke rekening escrow ARTVAULT, bukan ke artist, dan tidak bisa ditarik sepihak."],
    ["2", "Artist mengerjakan karya", "Progres, revisi, dan berkas final dikirim lewat halaman pesanan agar semua tercatat."],
    ["3", "Dana cair setelah disetujui", "Begitu klien menyetujui hasil akhir, dana diteruskan ke artist dalam 1x24 jam."],
  ];
  const team = [
    ["Nadia Prameswari", "Pendiri & Produk", "#E81E28", "NP"],
    ["Reza Hutagalung",  "Teknologi",        "#6366F1", "RH"],
    ["Alya Kusuma",      "Komunitas Artist", "#F97316", "AK"],
    ["Bimo Saptono",     "Kepercayaan & Keamanan", "#059669", "BS"],
  ];

  return (
    <div>
      {/* Hero */}
      <section className="px-6 md:px-12 pt-8 md:pt-12 pb-14 flex flex-col md:flex-row items-center gap-12 md:gap-16">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-extrabold text-[#C41A22] uppercase tracking-[0.18em] mb-4">Tentang ARTVAULT</p>
          <h1 className="font-extrabold text-[#0A0A0B] tracking-tight mb-5" style={{ fontSize: 44, lineHeight: 1.06 }}>
            Rumah bagi karya<br />artist Indonesia
          </h1>
          <p className="text-[15px] text-[#52525B] leading-relaxed max-w-md mb-7" style={{ textWrap: "pretty" }}>
            ARTVAULT mempertemukan artist digital Indonesia dengan orang yang mencari, mengoleksi, dan memesan karya mereka. Satu tempat untuk memamerkan portofolio, membuka komisi, dan bertanding di kontes bulanan.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate("discovery")} data-goes-to="→ Discovery" className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold px-6 py-3 rounded-full transition-colors">Jelajahi Karya</button>
            <button onClick={() => navigate("signup")} data-goes-to="→ Daftar" className="bg-white border border-[#E5E5E7] hover:bg-[#F5F5F5] active:bg-[#EDEDEF] text-[#0A0A0B] text-sm font-bold px-6 py-3 rounded-full transition-colors">Gabung Komunitas</button>
          </div>
        </div>
        <div className="relative flex-shrink-0 w-full max-w-[400px] h-[300px] md:h-[380px]">
          {frames.map(f => (
            <div key={f.a.id} className={"absolute " + f.cls} style={{ transform: "rotate(" + f.rot + "deg)", zIndex: f.z }}>
              <div className="bg-white p-2 rounded-2xl" style={{ boxShadow: "0 18px 44px -14px rgba(10,10,11,0.34)" }}>
                <Pic photoId={f.a.photoId} w={520} h={650} title={f.a.title} className="w-full rounded-xl" style={{ aspectRatio: "4 / 5" }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Misi */}
      <section className="border-y border-[#E5E5E7] px-6 py-14">
        <p className="mx-auto text-center text-[#0A0A0B] font-medium" style={{ fontSize: 20, maxWidth: 640, lineHeight: 1.55, textWrap: "pretty" }}>
          Karya yang baik pantas ditemukan tanpa harus membayar iklan. Kami membangun peringkat dari apresiasi nyata, dan komisi dari kepercayaan yang dijaga sistem.
        </p>
      </section>

      {/* Apa yang kami lakukan */}
      <section className="px-6 md:px-12 py-14">
        <h2 className="text-[22px] font-extrabold text-[#0A0A0B] mb-8">Apa yang kami lakukan</h2>
        <div className="grid grid-cols-1 md:grid-cols-4">
          {doing.map(({ Icon, title, desc }, i) => (
            <div key={title} className={"py-6 md:py-0 md:px-7 border-[#E5E5E7] " + (i === 0 ? "md:pl-0" : "border-t md:border-t-0 md:border-l")}>
              <Icon size={22} className="text-[#E81E28] mb-4" />
              <h3 className="text-sm font-extrabold text-[#0A0A0B] mb-1.5">{title}</h3>
              <p className="text-[13px] text-[#52525B] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Angka kami */}
      <section className="border-t-2 border-[#E81E28] bg-[#F5F5F5] px-6 md:px-12 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[["1,2 Juta+", "Karya terunggah"], ["340.000+", "Artist aktif"], ["18.400+", "Komisi selesai"], ["96", "Kontes terselenggara"]].map(([n, l]) => (
            <div key={l}>
              <p className="text-[34px] font-extrabold text-[#0A0A0B] leading-none mb-2">{n}</p>
              <p className="text-[13px] text-[#52525B]">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cerita kami */}
      <section className="grid md:grid-cols-2 border-b border-[#E5E5E7]">
        <div className="px-6 md:px-12 py-14 order-2 md:order-1">
          <h2 className="text-[22px] font-extrabold text-[#0A0A0B] mb-5">Cerita kami</h2>
          <p className="text-[15px] text-[#52525B] leading-relaxed mb-4" style={{ textWrap: "pretty" }}>
            ARTVAULT dimulai pada 2023 dari satu utas keluhan: ilustrator Indonesia kehilangan pekerjaan karena klien kabur setelah karya dikirim, dan karya bagus tenggelam di linimasa yang mengutamakan pengiklan.
          </p>
          <p className="text-[15px] text-[#52525B] leading-relaxed" style={{ textWrap: "pretty" }}>
            Empat orang membangun versi pertamanya di akhir pekan: satu galeri, satu papan peringkat, satu rekening bersama. Yang tersisa hari ini adalah tiga gagasan yang sama, dijalankan untuk ratusan ribu artist.
          </p>
        </div>
        <div className="relative min-h-[280px] md:min-h-[440px] bg-[#F5F5F5] order-1 md:order-2">
          <Pic photoId={ARTWORKS[8].photoId} w={1000} h={900} title={ARTWORKS[8].title} className="absolute inset-0 w-full h-full" />
        </div>
      </section>

      {/* Keamanan komisi */}
      <section className="px-6 md:px-12 py-14">
        <div className="bg-[#F5F5F5] rounded-2xl p-7 md:p-10">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-[#E81E28]" />
            </div>
            <div>
              <h2 className="text-[20px] font-extrabold text-[#0A0A0B] mb-1.5">Keamanan komisi</h2>
              <p className="text-sm text-[#52525B] leading-relaxed max-w-lg">Setiap pembayaran ditahan sistem escrow ARTVAULT sampai kedua pihak sepakat karya selesai.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {steps.map(([n, t, d]) => (
              <div key={n} className="bg-white rounded-xl p-5">
                <span className="w-6 h-6 rounded-full bg-[#E81E28] text-white text-[11px] font-extrabold flex items-center justify-center mb-3">{n}</span>
                <h3 className="text-sm font-extrabold text-[#0A0A0B] mb-1.5">{t}</h3>
                <p className="text-[13px] text-[#52525B] leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tim */}
      <section className="px-6 md:px-12 pb-14">
        <h2 className="text-[22px] font-extrabold text-[#0A0A0B] mb-8">Tim</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {team.map(([name, role, bg, init]) => (
            <div key={name}>
              <Av bg={bg} initials={init} size={72} />
              <p className="text-sm font-bold text-[#0A0A0B] mt-3.5">{name}</p>
              <p className="text-[13px] text-[#52525B]">{role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 md:px-12 pb-14">
        <h2 className="text-[22px] font-extrabold text-[#0A0A0B] mb-4">Pertanyaan umum</h2>
        <div className="max-w-2xl border-t border-[#E5E5E7]">
          {faqs.map(([q, a], i) => {
            const open = openFaq === i;
            return (
              <div key={i} className="border-b border-[#E5E5E7]">
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  data-goes-to={open ? "Tutup jawaban" : "Buka jawaban"}
                  className="flex items-center justify-between w-full py-4 text-left gap-4 group"
                >
                  <span className={"text-sm font-bold transition-colors " + (open ? "text-[#0A0A0B]" : "text-[#0A0A0B] group-hover:text-[#C41A22]")}>{q}</span>
                  <ChevronRight size={16} className={"flex-shrink-0 transition-transform " + (open ? "rotate-90 text-[#E81E28]" : "text-[#A1A1AA]")} />
                </button>
                {open && <p className="pb-5 pr-8 text-sm text-[#52525B] leading-relaxed" style={{ textWrap: "pretty" }}>{a}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-[#E5E5E7] px-6 py-16 text-center">
        <h2 className="font-extrabold text-[#0A0A0B] tracking-tight mx-auto mb-7" style={{ fontSize: 30, maxWidth: 520, lineHeight: 1.15 }}>
          Karyamu pantas ditemukan.
        </h2>
        <button onClick={() => navigate("signup")} data-goes-to="→ Daftar" className="bg-[#E81E28] hover:bg-[#C41A22] active:bg-[#A9161D] text-white text-sm font-bold px-8 py-3.5 rounded-full transition-colors">
          Daftar Gratis
        </button>
      </section>
    </div>
  );
}
