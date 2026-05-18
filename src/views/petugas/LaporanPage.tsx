"use client";

import {
  FileText, Send, CalendarDays, Calendar,
  Filter, ChevronDown, CheckCircle, Clock, Eye, X,
} from "lucide-react";
import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LaporanItem {
  id: number;
  tanggal: string;       // tanggal kirim, format DD/MM/YYYY HH:mm
  periode: string;       // "Harian - 12/05/2026" atau "Bulanan - Mei 2026"
  catatan: string;
  totalKendaraan: number;
  totalDatang: number;
  totalBerangkat: number;
  totalPenumpang: number;
  status: "terkirim" | "dibaca";
}

// ─── Data kendaraan dari API ──────────────────────────────────────────────────
interface KendaraanRow {
  id: number; timestamp: string; status: string; tnkb: string; jenis: string;
  penumpangDatang: number; penumpangBerangkat: number; trayekAsal: string; trayekTujuan: string; perusahaan: string;
}

const bulanList = ["Semua","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const bulanIndex: Record<string,number> = { Januari:0,Februari:1,Maret:2,April:3,Mei:4,Juni:5,Juli:6,Agustus:7,September:8,Oktober:9,November:10,Desember:11 };

function parseTimestamp(ts: string): Date {
  const [dp, tp] = ts.split(" ");
  const [dd,mm,yyyy] = dp.split("/").map(Number);
  const [hh,min] = (tp??"00:00").split(":").map(Number);
  return new Date(yyyy, mm-1, dd, hh, min);
}

// ─── Modal Detail Laporan ─────────────────────────────────────────────────────
function DetailModal({ item, onClose }: { item: LaporanItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-text-primary text-lg">Detail Laporan</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Tanggal Kirim</span>
            <span className="font-semibold text-text-primary">{item.tanggal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Periode</span>
            <span className="font-semibold text-text-primary">{item.periode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Status</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              item.status === "dibaca" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            }`}>
              {item.status === "dibaca" ? <Eye className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {item.status === "dibaca" ? "Dibaca" : "Terkirim"}
            </span>
          </div>
          <hr className="border-gray-100" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label:"Total Kendaraan",  value: item.totalKendaraan, color:"text-sidebar"    },
              { label:"Kedatangan",       value: item.totalDatang,    color:"text-blue-600"   },
              { label:"Keberangkatan",    value: item.totalBerangkat, color:"text-green-600"  },
              { label:"Total Penumpang",  value: item.totalPenumpang, color:"text-amber-600"  },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <hr className="border-gray-100" />
          <div>
            <p className="text-text-secondary mb-1">Catatan</p>
            <p className="text-text-primary bg-gray-50 rounded-xl p-3 leading-relaxed">{item.catatan}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LaporanPage() {
  const [kendaraanData, setKendaraanData] = useState<KendaraanRow[]>([]);
  const [filterMode, setFilterMode] = useState<"harian"|"bulanan">("harian");
  const [openDropdown, setOpenDropdown] = useState(false);
  const [selectedBulan, setSelectedBulan] = useState("Mei");
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear());
  const [catatan, setCatatan] = useState("");
  const [riwayat, setRiwayat] = useState<LaporanItem[]>([]);
  const [detailItem, setDetailItem] = useState<LaporanItem|null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const [selectedTanggal, setSelectedTanggal] = useState(todayStr);

  // Fetch data kendaraan dari API
  useEffect(() => {
    fetch("http://localhost:5000/api/pergerakan")
      .then((res) => res.json())
      .then((json) => {
        const rows: KendaraanRow[] = (json.data || []).map((item: any, idx: number) => {
          let ts = "";
          if (item.timestamp) {
            const raw = item.timestamp.replace("T", " ").replace("Z", "").split(".")[0];
            const [datePart, timePart] = raw.split(" ");
            const [yyyy, mm, dd] = datePart.split("-");
            const time = timePart ? timePart.slice(0, 5) : "00:00";
            ts = `${dd}/${mm}/${yyyy} ${time}`;
          }
          return {
            id: item.pergerakan_id ?? idx,
            timestamp: ts,
            status: item.status_pergerakan === "kedatangan" ? "Kedatangan" : "Keberangkatan",
            tnkb: item.tnkb || "",
            jenis: item.jenis_kendaraan || "",
            penumpangDatang: item.status_pergerakan === "kedatangan" ? item.jumlah_penumpang : 0,
            penumpangBerangkat: item.status_pergerakan === "keberangkatan" ? item.jumlah_penumpang : 0,
            trayekAsal: item.trayek_asal || "",
            trayekTujuan: item.trayek_tujuan || "",
            perusahaan: item.nama_perusahaan || "",
          };
        });
        setKendaraanData(rows);
      })
      .catch((err) => console.error("Gagal fetch kendaraan:", err));
  }, []);

  // Fetch riwayat laporan dari API
  useEffect(() => {
    fetch("http://localhost:5000/api/laporan")
      .then((res) => res.json())
      .then((json) => {
        const rows: LaporanItem[] = (json.data || []).map((item: any) => {
          const d = new Date(item.created_at);
          const pad = (n: number) => String(n).padStart(2, "0");
          const tgl = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
          return {
            id: item.laporan_id,
            tanggal: tgl,
            periode: item.periode,
            catatan: item.catatan || "-",
            totalKendaraan: item.total_kendaraan,
            totalDatang: item.total_kedatangan,
            totalBerangkat: item.total_keberangkatan,
            totalPenumpang: item.total_penumpang,
            status: item.status === "dibaca" ? "dibaca" : "terkirim",
          };
        });
        setRiwayat(rows);
      })
      .catch((err) => console.error("Gagal fetch laporan:", err));
  }, []);

  // Filter data preview
  const previewData = kendaraanData.filter((k) => {
    const date = parseTimestamp(k.timestamp);
    if (filterMode === "harian") {
      const [yyyy,mm,dd] = selectedTanggal.split("-").map(Number);
      return date.getFullYear()===yyyy && date.getMonth()===mm-1 && date.getDate()===dd;
    }
    return (selectedBulan === "Semua" || date.getMonth() === bulanIndex[selectedBulan]) && date.getFullYear() === selectedTahun;
  });

  const totalDatang    = previewData.filter(k=>k.status==="Kedatangan").length;
  const totalBerangkat = previewData.filter(k=>k.status==="Keberangkatan").length;
  const totalPenumpang = previewData.reduce((s,k)=>s+k.penumpangDatang+k.penumpangBerangkat,0);

  const periodeLabel = filterMode === "harian"
    ? `Harian - ${selectedTanggal.split("-").reverse().join("/")}`
    : `Bulanan - ${selectedBulan} ${selectedTahun}`;

  const handleKirim = async () => {
    const now = new Date();
    const pad = (n:number) => String(n).padStart(2,"0");
    const tanggalKirim = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // Kirim ke backend
    try {
      await fetch("http://localhost:5000/api/laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petugas_nama: "Petugas",
          periode: periodeLabel,
          catatan: catatan.trim() || "-",
          total_kendaraan: previewData.length,
          total_kedatangan: totalDatang,
          total_keberangkatan: totalBerangkat,
          total_penumpang: totalPenumpang,
        }),
      });
    } catch (err) {
      console.error("Gagal kirim laporan:", err);
    }

    const newLaporan: LaporanItem = {
      id: Date.now(),
      tanggal: tanggalKirim,
      periode: periodeLabel,
      catatan: catatan.trim() || "-",
      totalKendaraan: previewData.length,
      totalDatang,
      totalBerangkat,
      totalPenumpang,
      status: "terkirim",
    };

    setRiwayat((prev) => [newLaporan, ...prev]);
    setCatatan("");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <>
      {detailItem && <DetailModal item={detailItem} onClose={() => setDetailItem(null)} />}

      {/* Popup Konfirmasi Kirim Laporan */}
      {showKonfirmasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-sidebar/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-7 h-7 text-sidebar" />
              </div>
              <h3 className="font-bold text-text-primary text-lg">Kirim Laporan?</h3>
              <p className="text-text-secondary text-sm mt-1">Laporan akan dikirim kepada pimpinan</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-sidebar">{previewData.length}</p>
                <p className="text-xs text-text-secondary mt-0.5">Kendaraan</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-amber-600">{totalPenumpang}</p>
                <p className="text-xs text-text-secondary mt-0.5">Penumpang</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm">
              <p className="text-text-secondary">Periode: <span className="font-semibold text-text-primary">{periodeLabel}</span></p>
              {catatan.trim() && <p className="text-text-secondary mt-1">Catatan: <span className="text-text-primary">{catatan.trim()}</span></p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowKonfirmasi(false); handleKirim(); }}
                className="flex-1 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors"
              >
                Kirim
              </button>
              <button
                onClick={() => setShowKonfirmasi(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast sukses */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-gray-900 text-white text-sm font-medium px-5 py-3.5 rounded-2xl shadow-2xl">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          Laporan berhasil dikirim ke pimpinan!
          <button onClick={() => setShowSuccess(false)} className="ml-2 text-white/50 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center gap-4 shadow-lg">
          <FileText className="w-8 h-8 text-white" />
          <div>
            <h2 className="text-white font-bold text-xl tracking-wide">KIRIM LAPORAN</h2>
            <p className="text-white/60 text-sm mt-0.5">Buat dan kirim laporan harian atau bulanan kepada pimpinan</p>
          </div>
        </div>

        {/* Form Laporan */}
        <div className="bg-white rounded-2xl p-6 shadow-md space-y-5">
          <h3 className="font-bold text-text-primary text-base">Buat Laporan Baru</h3>

          {/* Filter periode */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                onClick={() => setFilterMode("harian")}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                  filterMode==="harian" ? "bg-sidebar text-white" : "bg-gray-50 text-text-secondary hover:bg-gray-100"
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Harian
              </button>
              <button
                onClick={() => setFilterMode("bulanan")}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                  filterMode==="bulanan" ? "bg-sidebar text-white" : "bg-gray-50 text-text-secondary hover:bg-gray-100"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Bulanan
              </button>
            </div>

            {filterMode === "harian" && (
              <input
                type="date"
                value={selectedTanggal}
                onChange={(e) => setSelectedTanggal(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 focus:border-sidebar transition"
              />
            )}

            {filterMode === "bulanan" && (
              <>
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(!openDropdown)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-[160px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span>{selectedBulan}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown?"rotate-180":""}`} />
                </button>
                {openDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-full max-h-60 overflow-y-auto">
                    {bulanList.map((b) => (
                      <button key={b} onClick={() => { setSelectedBulan(b); setOpenDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          selectedBulan===b ? "bg-sidebar text-white" : "text-text-primary hover:bg-gray-50"
                        }`}
                      >{b}</button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number"
                min="2020"
                max="2099"
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(parseInt(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 focus:border-sidebar transition w-20"
              />
              </>
            )}
          </div>

          {/* Ringkasan data */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label:"Total Kendaraan", value:previewData.length, color:"bg-sidebar/10 text-sidebar"   },
              { label:"Kedatangan",      value:totalDatang,         color:"bg-blue-50 text-blue-600"     },
              { label:"Keberangkatan",   value:totalBerangkat,      color:"bg-green-50 text-green-600"   },
              { label:"Total Penumpang", value:totalPenumpang,      color:"bg-amber-50 text-amber-600"   },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-4 text-center ${s.color}`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Preview tabel */}
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Preview Data — {periodeLabel}
              <span className="ml-2 bg-sidebar/10 text-sidebar px-2 py-0.5 rounded-full normal-case font-semibold">
                {previewData.length} data
              </span>
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["No","Timestamp","Status","TNKB","Jenis","P. Kedatangan","P. Keberangkatan","Trayek Asal","Trayek Tujuan","Perusahaan"].map((c) => (
                      <th key={c} className="text-left px-3 py-2.5 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.length === 0 ? (
                    <tr><td colSpan={10} className="px-3 py-8 text-center text-text-secondary">Tidak ada data untuk periode ini.</td></tr>
                  ) : (
                    previewData.map((k,idx) => (
                      <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 text-text-secondary whitespace-nowrap">{idx+1}</td>
                        <td className="px-3 py-3 text-text-secondary whitespace-nowrap">{k.timestamp}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            k.status==="Kedatangan" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                          }`}>{k.status}</span>
                        </td>
                        <td className="px-3 py-3 font-medium text-text-primary whitespace-nowrap">{k.tnkb}</td>
                        <td className="px-3 py-3 text-text-secondary whitespace-nowrap">{k.jenis}</td>
                        <td className="px-3 py-3 text-text-secondary text-center whitespace-nowrap">{k.penumpangDatang>0?k.penumpangDatang:"-"}</td>
                        <td className="px-3 py-3 text-text-secondary text-center whitespace-nowrap">{k.penumpangBerangkat>0?k.penumpangBerangkat:"-"}</td>
                        <td className="px-3 py-3 text-text-secondary whitespace-nowrap">{k.trayekAsal}</td>
                        <td className="px-3 py-3 text-text-secondary whitespace-nowrap">{k.trayekTujuan}</td>
                        <td className="px-3 py-3 font-medium text-text-primary whitespace-nowrap">{k.perusahaan}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Catatan untuk Pimpinan <span className="text-text-secondary font-normal">(opsional)</span>
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Tuliskan catatan, kendala, atau informasi tambahan untuk pimpinan..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 focus:border-sidebar transition resize-none"
            />
          </div>

          {/* Tombol kirim */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowKonfirmasi(true)}
              disabled={previewData.length === 0}
              className="flex items-center gap-2 bg-sidebar hover:bg-sidebar-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <Send className="w-4 h-4" />
              Kirim Laporan ke Pimpinan
            </button>
          </div>
        </div>

        {/* Riwayat Laporan */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h3 className="font-bold text-text-primary text-base mb-4">
            Riwayat Laporan
            <span className="ml-2 bg-sidebar/10 text-sidebar text-xs font-semibold px-2 py-0.5 rounded-full">
              {riwayat.length} laporan
            </span>
          </h3>

          {riwayat.length === 0 ? (
            <p className="text-center text-text-secondary text-sm py-8">Belum ada laporan yang dikirim.</p>
          ) : (
            <div className="space-y-3">
              {riwayat.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.status==="dibaca" ? "bg-green-100" : "bg-amber-100"
                  }`}>
                    {item.status==="dibaca"
                      ? <Eye className="w-5 h-5 text-green-600" />
                      : <Clock className="w-5 h-5 text-amber-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary text-sm">{item.periode}</p>
                    <p className="text-xs text-text-secondary mt-0.5 truncate">{item.catatan}</p>
                    <p className="text-xs text-text-secondary mt-0.5">Dikirim: {item.tanggal}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right text-xs text-text-secondary">
                      <p>{item.totalKendaraan} kendaraan</p>
                      <p>{item.totalPenumpang} penumpang</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.status==="dibaca" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {item.status==="dibaca" ? "Dibaca" : "Terkirim"}
                    </span>
                    <button
                      onClick={() => setDetailItem(item)}
                      className="text-sidebar hover:text-sidebar-hover text-xs font-medium underline underline-offset-2 transition-colors"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
