"use client";

import { Inbox, Eye, Clock, CheckCheck, X, Search, Filter, ChevronDown, Download, FileText } from "lucide-react";
import { useState, useEffect } from "react";

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

// Detail Modal
function DetailModal({ item, onClose, onMarkRead }: { item: LaporanMasuk; onClose: () => void; onMarkRead: (id: number) => void; }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-text-primary text-lg">Detail Laporan</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-text-secondary">Petugas</span><span className="font-semibold text-text-primary">{item.petugas}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Tanggal Kirim</span><span className="font-semibold text-text-primary">{item.tanggal}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Periode</span><span className="font-semibold text-text-primary">{item.periode}</span></div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Status</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${item.status === "dibaca" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
              {item.status === "dibaca" ? <><CheckCheck className="w-3 h-3" /> Dibaca</> : <><Eye className="w-3 h-3" /> Belum Dibaca</>}
            </span>
          </div>
          <hr className="border-gray-100" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label:"Total Kendaraan", value:item.totalKendaraan, color:"bg-sidebar/10 text-sidebar" },
              { label:"Kedatangan", value:item.totalDatang, color:"bg-blue-50 text-blue-600" },
              { label:"Keberangkatan", value:item.totalBerangkat, color:"bg-green-50 text-green-600" },
              { label:"Total Penumpang", value:item.totalPenumpang, color:"bg-amber-50 text-amber-600" },
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
            <button onClick={() => { onMarkRead(item.id); onClose(); }} className="flex-1 flex items-center justify-center gap-2 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors">
              <CheckCheck className="w-4 h-4" /> Tandai Sudah Dibaca
            </button>
          )}
          <button onClick={() => { window.open(`http://localhost:5000/api/laporan/${item.id}/export`, '_blank'); }} className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors">
            <Download className="w-4 h-4" /> Download Excel
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors">Tutup</button>
        </div>
      </div>
    </div>
  );
}

export default function LaporanMasukPage() {
  const [laporan, setLaporan] = useState<LaporanMasuk[]>([]);
  const [detailItem, setDetailItem] = useState<LaporanMasuk | null>(null);
  const [filterStatus, setFilterStatus] = useState<"semua" | "belum-dibaca" | "dibaca">("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
    } catch (err) { console.error("Gagal mark read:", err); }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("http://localhost:5000/api/laporan/read-all", { method: "PATCH" });
      setLaporan((prev) => prev.map((l) => ({ ...l, status: "dibaca" })));
    } catch (err) { console.error("Gagal mark all read:", err); }
  };

  const handleOpenDetail = (item: LaporanMasuk) => {
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
    const matchSearch = !q || l.petugas.toLowerCase().includes(q) || l.periode.toLowerCase().includes(q) || l.catatan.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalItems = displayData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = displayData.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [filterStatus, searchQuery]);

  return (
    <>
      {detailItem && <DetailModal item={detailItem} onClose={() => setDetailItem(null)} onMarkRead={handleMarkRead} />}

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Inbox className="w-8 h-8 text-white" />
              {belumDibacaCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">{belumDibacaCount}</span>
              )}
            </div>
            <div>
              <h2 className="text-white font-bold text-xl tracking-wide">LAPORAN MASUK</h2>
              <p className="text-white/60 text-sm mt-0.5">{belumDibacaCount > 0 ? `${belumDibacaCount} laporan belum dibaca` : "Semua laporan sudah dibaca"}</p>
            </div>
          </div>
          {belumDibacaCount > 0 && (
            <button onClick={handleMarkAllRead} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <CheckCheck className="w-4 h-4" /> Tandai Semua Dibaca
            </button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-md flex items-center gap-4">
            <div className="w-12 h-12 bg-sidebar/10 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6 text-sidebar" /></div>
            <div><p className="text-xs text-text-secondary font-semibold uppercase">Total Laporan</p><p className="text-2xl font-bold text-text-primary">{laporan.length}</p></div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-md flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-blue-500" /></div>
            <div><p className="text-xs text-blue-500 font-semibold uppercase">Belum Dibaca</p><p className="text-2xl font-bold text-blue-600">{belumDibacaCount}</p></div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-md flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center"><CheckCheck className="w-6 h-6 text-green-500" /></div>
            <div><p className="text-xs text-green-500 font-semibold uppercase">Sudah Dibaca</p><p className="text-2xl font-bold text-green-600">{laporan.filter(l=>l.status==="dibaca").length}</p></div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          {/* Filter & Search */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {(["semua", "belum-dibaca", "dibaca"] as const).map((s, i) => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 text-xs font-medium transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${filterStatus === s ? s === "belum-dibaca" ? "bg-blue-500 text-white" : s === "dibaca" ? "bg-green-500 text-white" : "bg-sidebar text-white" : "bg-gray-50 text-text-secondary hover:bg-gray-100"}`}>
                  {s === "semua" ? "Semua" : s === "belum-dibaca" ? "Belum Dibaca" : "Sudah Dibaca"}
                </button>
              ))}
            </div>

            <span className="text-xs text-text-secondary">{displayData.length} laporan</span>

            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input type="text" placeholder="Cari petugas, periode, catatan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 focus:border-sidebar transition w-64" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-200">
                  {["No","Tanggal Kirim","Petugas","Periode","Kendaraan","Kedatangan","Keberangkatan","Penumpang","Status","Aksi"].map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-text-secondary">Tidak ada laporan.</td></tr>
                ) : (
                  paginatedData.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${item.status === "belum-dibaca" ? "bg-blue-50/30" : ""}`} onClick={() => handleOpenDetail(item)}>
                      <td className="px-4 py-3.5 text-sm text-text-secondary">{startIndex + idx + 1}</td>
                      <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{item.tanggal}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-text-primary whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {item.petugas}
                          {item.status === "belum-dibaca" && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{item.periode}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-text-primary text-center">{item.totalKendaraan}</td>
                      <td className="px-4 py-3.5 text-sm text-blue-600 text-center">{item.totalDatang}</td>
                      <td className="px-4 py-3.5 text-sm text-green-600 text-center">{item.totalBerangkat}</td>
                      <td className="px-4 py-3.5 text-sm text-amber-600 font-semibold text-center">{item.totalPenumpang}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${item.status === "belum-dibaca" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                          {item.status === "belum-dibaca" ? "Baru" : "Dibaca"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button onClick={(e) => { e.stopPropagation(); window.open(`http://localhost:5000/api/laporan/${item.id}/export`, '_blank'); }} className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors" title="Download Excel">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <span className="text-sm text-text-secondary">Menampilkan {startIndex + 1}–{Math.min(endIndex, totalItems)} dari {totalItems} laporan</span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-text-secondary">Per halaman:</label>
                  <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30">
                    {[5, 10, 20, 50].map((n) => (<option key={n} value={n}>{n}</option>))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-text-secondary">«</button>
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-text-secondary">‹</button>
                {(() => {
                  const pages: (number | string)[] = [];
                  const maxVisible = 5;
                  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let end = Math.min(totalPages, start + maxVisible - 1);
                  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
                  if (start > 1) { pages.push(1); if (start > 2) pages.push("..."); }
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (end < totalPages) { if (end < totalPages - 1) pages.push("..."); pages.push(totalPages); }
                  return pages.map((p, i) => typeof p === "string" ? (
                    <span key={`e-${i}`} className="px-2 py-1.5 text-sm text-text-secondary">…</span>
                  ) : (
                    <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${currentPage === p ? "bg-sidebar text-white font-semibold" : "hover:bg-gray-100 text-text-secondary"}`}>{p}</button>
                  ));
                })()}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-text-secondary">›</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-text-secondary">»</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
