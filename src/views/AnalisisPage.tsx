"use client";

import { useState, useEffect } from "react";
import {
  BarChart3, Users, Filter, ChevronDown, MapPin, ArrowUpDown, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const bulanList = [
  "Semua","Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];
const bulanIndex: Record<string, number> = {
  Januari:0,Februari:1,Maret:2,April:3,Mei:4,Juni:5,
  Juli:6,Agustus:7,September:8,Oktober:9,November:10,Desember:11,
};

interface DataRow {
  id: number; timestamp: string; status: string; tnkb: string; jenis: string;
  penumpang: number; trayekAsal: string; trayekTujuan: string; perusahaan: string;
}

function parseTimestamp(ts: string): Date {
  const [datePart, timePart] = ts.split(" ");
  const [dd, mm, yyyy] = datePart.split("/").map(Number);
  const [hh, min] = (timePart ?? "00:00").split(":").map(Number);
  return new Date(yyyy, mm - 1, dd, hh, min);
}

function formatTanggal(dateStr: string) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  const bulanNama = bulanList[parseInt(month, 10) - 1];
  return `${parseInt(day, 10)} ${bulanNama} ${year}`;
}

const headers = [
  { key: "waktu", label: "Waktu", sortable: true },
  { key: "tnkb", label: "TNKB", sortable: true },
  { key: "jenis", label: "Jenis Kendaraan", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "penumpang", label: "Jumlah Penumpang", sortable: true },
  { key: "trayekAsal", label: "Trayek Asal", sortable: true },
  { key: "trayekTujuan", label: "Trayek Tujuan", sortable: true },
  { key: "perusahaan", label: "Nama Perusahaan", sortable: true },
];

const barColors = ["#60a5fa","#4ade80","#fbbf24","#f87171","#a78bfa","#34d399"];

export default function AnalisisPage() {
  const [allData, setAllData] = useState<DataRow[]>([]);
  const [filterMode, setFilterMode] = useState<"bulanan" | "harian">("bulanan");
  const [bulan, setBulan] = useState("Januari");
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [openDropdown, setOpenDropdown] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [tanggal, setTanggal] = useState(today);

  // Fetch data dari API
  useEffect(() => {
    fetch("http://localhost:5000/api/pergerakan")
      .then((res) => res.json())
      .then((json) => {
        const rows: DataRow[] = (json.data || []).map((item: any, idx: number) => {
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
            penumpang: item.jumlah_penumpang || 0,
            trayekAsal: item.trayek_asal || "",
            trayekTujuan: item.trayek_tujuan || "",
            perusahaan: item.nama_perusahaan || "",
          };
        });
        setAllData(rows);
      })
      .catch((err) => console.error("Gagal fetch:", err));
  }, []);

  // Filter berdasarkan periode
  const filteredData = allData.filter((k) => {
    const date = parseTimestamp(k.timestamp);
    if (filterMode === "harian") {
      const [yyyy, mm, dd] = tanggal.split("-").map(Number);
      return date.getFullYear() === yyyy && date.getMonth() === mm - 1 && date.getDate() === dd;
    }
    return (bulan === "Semua" || date.getMonth() === bulanIndex[bulan]) && date.getFullYear() === tahun;
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode, bulan, tahun, tanggal]);

  // Generate chart data
  const jenisCount: Record<string, number> = {};
  filteredData.forEach((k) => { jenisCount[k.jenis] = (jenisCount[k.jenis] || 0) + 1; });
  const jenisData = Object.entries(jenisCount).map(([name, value], i) => ({ name, value, fill: barColors[i % barColors.length] }));

  const kedatanganCount = filteredData.filter((k) => k.status === "Kedatangan").length;
  const keberangkatanCount = filteredData.filter((k) => k.status === "Keberangkatan").length;
  const statusData = [
    { name: "Kedatangan", value: kedatanganCount, color: "#60a5fa" },
    { name: "Keberangkatan", value: keberangkatanCount, color: "#4ade80" },
  ];

  const trayekAsalCount: Record<string, number> = {};
  filteredData.forEach((k) => { if (k.trayekAsal) trayekAsalCount[k.trayekAsal] = (trayekAsalCount[k.trayekAsal] || 0) + 1; });
  const trayekAsalData = Object.entries(trayekAsalCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value], i) => ({ name, value, fill: barColors[i % barColors.length] }));

  const trayekTujuanCount: Record<string, number> = {};
  filteredData.forEach((k) => { if (k.trayekTujuan) trayekTujuanCount[k.trayekTujuan] = (trayekTujuanCount[k.trayekTujuan] || 0) + 1; });
  const trayekTujuanData = Object.entries(trayekTujuanCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value], i) => ({ name, value, fill: barColors[i % barColors.length] }));

  const totalPenumpang = filteredData.reduce((s, k) => s + k.penumpang, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center gap-4 shadow-lg">
        <BarChart3 className="w-8 h-8 text-white" />
        <h2 className="text-white font-bold text-xl tracking-wide">ANALISIS</h2>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-md flex items-center gap-4 flex-wrap">
        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
          <button onClick={() => setFilterMode("harian")} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${filterMode === "harian" ? "bg-sidebar text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>
            <Calendar className="w-4 h-4" /> Harian
          </button>
          <button onClick={() => setFilterMode("bulanan")} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${filterMode === "bulanan" ? "bg-sidebar text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>
            <Filter className="w-4 h-4" /> Bulanan
          </button>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        {filterMode === "harian" && (
          <div className="flex items-center gap-3">
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar focus:border-transparent transition-all cursor-pointer" />
            <span className="text-sm text-text-secondary">Analisis tanggal <span className="font-semibold text-text-primary">{formatTanggal(tanggal)}</span></span>
          </div>
        )}
        {filterMode === "bulanan" && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setOpenDropdown(!openDropdown)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-text-primary px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-w-[160px] justify-between">
                <span>{bulan}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown ? "rotate-180" : ""}`} />
              </button>
              {openDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-full max-h-60 overflow-y-auto">
                  {bulanList.map((b) => (
                    <button key={b} onClick={() => { setBulan(b); setOpenDropdown(false); }} className={`w-full text-left px-4 py-2 text-sm transition-colors ${bulan === b ? "bg-sidebar text-white" : "text-text-primary hover:bg-gray-50"}`}>{b}</button>
                  ))}
                </div>
              )}
            </div>
            <input type="number" min="2020" max="2099" value={tahun} onChange={(e) => setTahun(parseInt(e.target.value))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 focus:border-sidebar transition w-20" />
            <span className="text-sm text-text-secondary">Analisis bulan <span className="font-semibold text-text-primary">{bulan} {tahun}</span></span>
          </div>
        )}
      </div>

      {/* Statistik */}
      <div className="bg-white rounded-2xl p-6 shadow-md flex items-center gap-5">
        <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center">
          <Users className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">Total Jumlah Penumpang</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{totalPenumpang}</p>
          <p className="text-xs text-text-secondary mt-0.5">{filteredData.length} kendaraan tercatat</p>
        </div>
      </div>

      {/* Grafik Baris 1 */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-md flex-1">
          <h3 className="font-bold text-text-primary text-sm mb-4">Jenis Kendaraan Yang Paling Banyak Digunakan</h3>
          {jenisData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-text-secondary text-sm">Tidak ada data</div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4">
                {jenisData.map((item) => (<div key={item.name} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.fill }} /><span className="text-xs text-text-secondary">{item.name}</span></div>))}
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={jenisData} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px", padding: "10px 14px" }} formatter={(value) => [`${value}`, "Jumlah"]} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>{jenisData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md w-full lg:w-[380px]">
          <div className="flex items-center gap-2 mb-4"><div className="w-1 h-4 bg-sidebar rounded-full" /><h3 className="font-bold text-text-primary text-sm">Kedatangan vs Keberangkatan</h3></div>
          {filteredData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-text-secondary text-sm">Tidak ada data</div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-2">
                {statusData.map((item) => (<div key={item.name} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color }} /><span className="text-xs text-text-secondary">{item.name} ({item.value})</span></div>))}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">{statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie>
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px", padding: "10px 14px" }} formatter={(value, name) => [`${value}`, `${name}`]} />
                </PieChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>

      {/* Grafik Baris 2 */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-md flex-1">
          <div className="flex items-center gap-2 mb-4"><MapPin className="w-4 h-4 text-sidebar" /><h3 className="font-bold text-text-primary text-sm">Trayek Asal Yang Paling Banyak</h3></div>
          {trayekAsalData.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-text-secondary text-sm">Tidak ada data</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-4">{trayekAsalData.map((item) => (<div key={item.name} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.fill }} /><span className="text-xs text-text-secondary">{item.name}</span></div>))}</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={trayekAsalData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px", padding: "10px 14px" }} formatter={(value) => [`${value}`, "Jumlah"]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>{trayekAsalData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md flex-1">
          <div className="flex items-center gap-2 mb-4"><MapPin className="w-4 h-4 text-sidebar" /><h3 className="font-bold text-text-primary text-sm">Trayek Tujuan Yang Paling Banyak</h3></div>
          {trayekTujuanData.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-text-secondary text-sm">Tidak ada data</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-4">{trayekTujuanData.map((item) => (<div key={item.name} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.fill }} /><span className="text-xs text-text-secondary">{item.name}</span></div>))}</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={trayekTujuanData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px", padding: "10px 14px" }} formatter={(value) => [`${value}`, "Jumlah"]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>{trayekTujuanData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>

      {/* Tabel Detail */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-text-primary text-sm">Detail Analisis Kendaraan <span className="ml-2 bg-sidebar/10 text-sidebar text-xs font-semibold px-2 py-0.5 rounded-full">{filteredData.length} data</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-200">
                {headers.map((h) => (
                  <th key={h.key} className="text-left px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1"><span>{h.label}</span>{h.sortable && <ArrowUpDown className="w-3 h-3" />}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-text-secondary">Tidak ada data analisis.</td></tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-text-secondary whitespace-nowrap">{row.timestamp}</td>
                    <td className="px-6 py-3.5 text-sm font-medium text-text-primary whitespace-nowrap">{row.tnkb}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary whitespace-nowrap">{row.jenis}</td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${row.status === "Kedatangan" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{row.status}</span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary whitespace-nowrap text-center">{row.penumpang}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary whitespace-nowrap">{row.trayekAsal}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary whitespace-nowrap">{row.trayekTujuan}</td>
                    <td className="px-6 py-3.5 text-sm font-medium text-text-primary whitespace-nowrap">{row.perusahaan}</td>
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
    </div>
  );
}
