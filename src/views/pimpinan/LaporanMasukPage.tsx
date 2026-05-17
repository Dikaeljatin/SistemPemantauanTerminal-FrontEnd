"use client";

import { Inbox, Eye, Clock, CheckCheck, X, Search, Filter, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LaporanMasuk {
  id: number;
  tanggal: string;
  petugas: string;
  periode: string;
  catatan: string;
  totalKendaraan: number;
  totalDatang: number;
  totalBerangkat: number;
  totalPenumpang: number;
  status: "belum-dibaca" | "dibaca";
}

// ─── Modal Detail ─────────────────────────────────────────────────────────────
function DetailModal({
  item,
  onClose,
  onMarkRead,
}: {
  item: LaporanMasuk;
  onClose: () => void;
  onMarkRead: (id: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-text-primary text-lg">Detail Laporan</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Petugas</span>
            <span className="font-semibold text-text-primary">{item.petugas}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Tanggal Kirim</span>
            <span className="font-semibold text-text-primary">{item.tanggal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Periode</span>
            <span className="font-semibold text-text-primary">{item.periode}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Status</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              item.status === "dibaca"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {item.status === "dibaca"
                ? <><CheckCheck className="w-3 h-3" /> Dibaca</>
                : <><Eye className="w-3 h-3" /> Belum Dibaca</>
              }
            </span>
          </div>

          <hr className="border-gray-100" />

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label:"Total Kendaraan", value:item.totalKendaraan, color:"bg-sidebar/10 text-sidebar"  },
              { label:"Kedatangan",      value:item.totalDatang,    color:"bg-blue-50 text-blue-600"    },
              { label:"Keberangkatan",   value:item.totalBerangkat, color:"bg-green-50 text-green-600"  },
              { label:"Total Penumpang", value:item.totalPenumpang, color:"bg-amber-50 text-amber-600"  },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
              </div>
            ))}
          </div>

          <hr className="border-gray-100" />

          <div>
            <p className="text-text-secondary mb-1.5">Catatan dari Petugas</p>
            <p className="text-text-primary bg-gray-50 rounded-xl p-3 leading-relaxed">{item.catatan}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {item.status === "belum-dibaca" && (
            <button
              onClick={() => { onMarkRead(item.id); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Tandai Sudah Dibaca
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LaporanMasukPage() {
  const [laporan, setLaporan] = useState<LaporanMasuk[]>([]);
  const [detailItem, setDetailItem] = useState<LaporanMasuk | null>(null);
  const [filterStatus, setFilterStatus] = useState<"semua" | "belum-dibaca" | "dibaca">("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFilter, setOpenFilter] = useState(false);

  // Fetch laporan dari API
  useEffect(() => {
    fetch("http://localhost:5000/api/laporan")
      .then((res) => res.json())
      .then((json) => {
        const rows: LaporanMasuk[] = (json.data || []).map((item: any) => {
          const d = new Date(item.created_at);
          const pad = (n: number) => String(n).padStart(2, "0");
          const tgl = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
          return {
            id: item.laporan_id,
            tanggal: tgl,
            petugas: item.petugas_nama || "Petugas",
            periode: item.periode,
            catatan: item.catatan || "-",
            totalKendaraan: item.total_kendaraan,
            totalDatang: item.total_kedatangan,
            totalBerangkat: item.total_keberangkatan,
            totalPenumpang: item.total_penumpang,
            status: item.status as "belum-dibaca" | "dibaca",
          };
        });
        setLaporan(rows);
      })
      .catch((err) => console.error("Gagal fetch laporan:", err));
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await fetch(`http://localhost:5000/api/laporan/${id}/read`, { method: "PATCH" });
      setLaporan((prev) => prev.map((l) => l.id === id ? { ...l, status: "dibaca" } : l));
    } catch (err) {
      console.error("Gagal mark read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("http://localhost:5000/api/laporan/read-all", { method: "PATCH" });
      setLaporan((prev) => prev.map((l) => ({ ...l, status: "dibaca" })));
    } catch (err) {
      console.error("Gagal mark all read:", err);
    }
  };

  const handleOpenDetail = (item: LaporanMasuk) => {
    // Auto-mark as read when opened
    if (item.status === "belum-dibaca") {
      handleMarkRead(item.id);
      setDetailItem({ ...item, status: "dibaca" });
    } else {
      setDetailItem(item);
    }
  };

  const belumDibacaCount = laporan.filter((l) => l.status === "belum-dibaca").length;

  const displayData = laporan.filter((l) => {
    const matchStatus = filterStatus === "semua" || l.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      l.petugas.toLowerCase().includes(q) ||
      l.periode.toLowerCase().includes(q) ||
      l.catatan.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const filterLabels: Record<string, string> = {
    "semua": "Semua",
    "belum-dibaca": "Belum Dibaca",
    "dibaca": "Sudah Dibaca",
  };

  return (
    <>
      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onMarkRead={handleMarkRead}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Inbox className="w-8 h-8 text-white" />
              {belumDibacaCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
                  {belumDibacaCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-white font-bold text-xl tracking-wide">LAPORAN MASUK</h2>
              <p className="text-white/60 text-sm mt-0.5">
                {belumDibacaCount > 0
                  ? `${belumDibacaCount} laporan belum dibaca`
                  : "Semua laporan sudah dibaca"}
              </p>
            </div>
          </div>
          {belumDibacaCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-md text-center">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Total Laporan</p>
            <p className="text-3xl font-bold text-text-primary">{laporan.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-md text-center">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">Belum Dibaca</p>
            <p className="text-3xl font-bold text-blue-600">{belumDibacaCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-md text-center">
            <p className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-1">Sudah Dibaca</p>
            <p className="text-3xl font-bold text-green-600">{laporan.filter(l=>l.status==="dibaca").length}</p>
          </div>
        </div>

        {/* List Laporan */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          {/* Filter & Search */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {/* Filter status dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenFilter(!openFilter)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-[160px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>{filterLabels[filterStatus]}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${openFilter?"rotate-180":""}`} />
              </button>
              {openFilter && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-full">
                  {(["semua","belum-dibaca","dibaca"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setFilterStatus(s); setOpenFilter(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        filterStatus===s ? "bg-sidebar text-white" : "text-text-primary hover:bg-gray-50"
                      }`}
                    >
                      {filterLabels[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Cari petugas, periode, catatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 focus:border-sidebar transition w-64"
              />
            </div>
          </div>

          {/* List */}
          {displayData.length === 0 ? (
            <div className="py-12 text-center text-text-secondary text-sm">
              Tidak ada laporan yang sesuai filter.
            </div>
          ) : (
            <div className="space-y-3">
              {displayData.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                    item.status === "belum-dibaca"
                      ? "border-blue-200 bg-blue-50/40 hover:bg-blue-50"
                      : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  {/* Status icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.status === "belum-dibaca" ? "bg-blue-100" : "bg-green-100"
                  }`}>
                    {item.status === "belum-dibaca"
                      ? <Eye className="w-5 h-5 text-blue-600" />
                      : <CheckCheck className="w-5 h-5 text-green-600" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-text-primary text-sm">{item.petugas}</p>
                      {item.status === "belum-dibaca" && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{item.periode}</p>
                    <p className="text-xs text-text-secondary truncate mt-0.5">{item.catatan}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right text-xs text-text-secondary flex-shrink-0">
                    <p className="font-medium text-text-primary">{item.totalKendaraan} kendaraan</p>
                    <p>{item.totalPenumpang} penumpang</p>
                    <p className="mt-0.5">{item.tanggal}</p>
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    item.status === "belum-dibaca"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {item.status === "belum-dibaca" ? "Baru" : "Dibaca"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
