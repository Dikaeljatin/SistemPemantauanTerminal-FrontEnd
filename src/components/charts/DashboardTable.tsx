"use client";

import { ArrowUpDown, CalendarDays, Calendar, Filter, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

const bulanList = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];
const bulanIndex: Record<string, number> = {
  Januari:0,Februari:1,Maret:2,April:3,Mei:4,Juni:5,
  Juli:6,Agustus:7,September:8,Oktober:9,November:10,Desember:11,
};

interface KendaraanRow {
  id: number; timestamp: string; status: string; tnkb: string; jenis: string;
  penumpangDatang: number; penumpangBerangkat: number; trayekAsal: string; trayekTujuan: string; perusahaan: string;
}

function parseTimestamp(ts: string): Date {
  const [datePart, timePart] = ts.split(" ");
  const [dd, mm, yyyy] = datePart.split("/").map(Number);
  const [hh, min] = (timePart ?? "00:00").split(":").map(Number);
  return new Date(yyyy, mm - 1, dd, hh, min);
}

const headers = [
  { key: "no",                 label: "No",                             sortable: false },
  { key: "timestamp",          label: "Timestamp",                      sortable: true  },
  { key: "status",             label: "Status",                         sortable: true  },
  { key: "tnkb",               label: "TNKB",                           sortable: true  },
  { key: "jenis",              label: "Jenis Kendaraan",                sortable: true  },
  { key: "penumpangDatang",    label: "Jumlah Penumpang Kedatangan",    sortable: true  },
  { key: "penumpangBerangkat", label: "Jumlah Penumpang Keberangkatan", sortable: true  },
  { key: "trayekAsal",         label: "Trayek Asal",                    sortable: true  },
  { key: "trayekTujuan",       label: "Trayek Tujuan",                  sortable: true  },
  { key: "perusahaan",         label: "Nama Perusahaan",                sortable: true  },
];

type FilterStatus = "semua" | "Kedatangan" | "Keberangkatan";
type FilterMode = "harian" | "bulanan";

export default function DashboardTable() {
  const [kendaraanData, setKendaraanData] = useState<KendaraanRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("semua");
  const [filterMode, setFilterMode] = useState<FilterMode>("bulanan");
  const [bulan, setBulan] = useState("Januari");
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [openDropdown, setOpenDropdown] = useState(false);
  const todayStr = new Date().toISOString().split("T")[0];
  const [tanggal, setTanggal] = useState(todayStr);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

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
      .catch((err) => console.error("Gagal fetch:", err));
  }, []);

  // Filter periode + status
  const displayData = kendaraanData.filter((k) => {
    const date = parseTimestamp(k.timestamp);
    if (filterMode === "harian") {
      const [yyyy, mm, dd] = tanggal.split("-").map(Number);
      if (!(date.getFullYear() === yyyy && date.getMonth() === mm - 1 && date.getDate() === dd)) return false;
    } else {
      if (date.getMonth() !== bulanIndex[bulan] || date.getFullYear() !== tahun) return false;
    }
    return filterStatus === "semua" || k.status === filterStatus;
  });

  // Pagination logic
  const totalItems = displayData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = displayData.slice(startIndex, endIndex);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode, bulan, tahun, tanggal, filterStatus]);

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      {/* Filter Bar */}
      <div className="px-6 pt-5 pb-4 flex flex-wrap items-center gap-3">
        {/* Toggle Harian / Bulanan */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button
            onClick={() => setFilterMode("harian")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
              filterMode === "harian" ? "bg-sidebar text-white" : "bg-gray-50 text-text-secondary hover:bg-gray-100"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Harian
          </button>
          <button
            onClick={() => setFilterMode("bulanan")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
              filterMode === "bulanan" ? "bg-sidebar text-white" : "bg-gray-50 text-text-secondary hover:bg-gray-100"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Bulanan
          </button>
        </div>

        {/* Filter Harian */}
        {filterMode === "harian" && (
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 focus:border-sidebar transition"
          />
        )}

        {/* Filter Bulanan */}
        {filterMode === "bulanan" && (
          <>
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(!openDropdown)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-[140px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>{bulan}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown ? "rotate-180" : ""}`} />
              </button>
              {openDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-full max-h-60 overflow-y-auto">
                  {bulanList.map((b) => (
                    <button
                      key={b}
                      onClick={() => { setBulan(b); setOpenDropdown(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${bulan === b ? "bg-sidebar text-white" : "text-text-primary hover:bg-gray-50"}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="number"
              min="2020"
              max="2099"
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 focus:border-sidebar transition w-20"
            />
          </>
        )}

        {/* Filter Status */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {(["semua", "Kedatangan", "Keberangkatan"] as FilterStatus[]).map((s, i) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${
                filterStatus === s
                  ? s === "Kedatangan"    ? "bg-blue-500 text-white"
                  : s === "Keberangkatan" ? "bg-green-500 text-white"
                  : "bg-sidebar text-white"
                  : "bg-gray-50 text-text-secondary hover:bg-gray-100"
              }`}
            >
              {s === "semua" ? "Semua" : s}
            </button>
          ))}
        </div>

        <span className="text-xs text-text-secondary ml-1">{displayData.length} data</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-gray-200">
              {headers.map((h) => (
                <th key={h.key} className="text-left px-4 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                  {h.sortable ? (
                    <div className="flex items-center gap-1 cursor-pointer hover:text-text-primary transition-colors">
                      <span>{h.label}</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  ) : (
                    <span>{h.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-text-secondary">
                  Tidak ada data yang sesuai filter.
                </td>
              </tr>
            ) : (
              paginatedData.map((k, idx) => (
                <tr key={k.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{startIndex + idx + 1}</td>
                  <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{k.timestamp}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      k.status === "Kedatangan" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    }`}>
                      {k.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium text-text-primary whitespace-nowrap">{k.tnkb}</td>
                  <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{k.jenis}</td>
                  <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap text-center">{k.penumpangDatang > 0 ? k.penumpangDatang : "-"}</td>
                  <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap text-center">{k.penumpangBerangkat > 0 ? k.penumpangBerangkat : "-"}</td>
                  <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{k.trayekAsal}</td>
                  <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{k.trayekTujuan}</td>
                  <td className="px-4 py-3.5 text-sm font-medium text-text-primary whitespace-nowrap">{k.perusahaan}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 pb-5 pt-4 flex items-center justify-between border-t border-gray-100">
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">
              Menampilkan {startIndex + 1}–{Math.min(endIndex, totalItems)} dari {totalItems} data
            </span>
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-secondary">Per halaman:</label>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-text-secondary"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-text-secondary"
            >
              ‹
            </button>

            {(() => {
              const pages: (number | string)[] = [];
              const maxVisible = 5;
              let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
              let end = Math.min(totalPages, start + maxVisible - 1);
              if (end - start < maxVisible - 1) {
                start = Math.max(1, end - maxVisible + 1);
              }
              if (start > 1) { pages.push(1); if (start > 2) pages.push("..."); }
              for (let i = start; i <= end; i++) pages.push(i);
              if (end < totalPages) { if (end < totalPages - 1) pages.push("..."); pages.push(totalPages); }
              return pages.map((p, i) =>
                typeof p === "string" ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-text-secondary">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      currentPage === p
                        ? "bg-sidebar text-white font-semibold"
                        : "hover:bg-gray-100 text-text-secondary"
                    }`}
                  >
                    {p}
                  </button>
                )
              );
            })()}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-text-secondary"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-text-secondary"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
