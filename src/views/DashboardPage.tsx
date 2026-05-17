"use client";

import { useState, useEffect } from "react";
import { CarFront, CalendarDays, Calendar, Filter, ChevronDown, ArrowUpDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";

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

const barColors = ["#60a5fa","#4ade80","#fbbf24","#f87171","#a78bfa","#34d399"];
type FilterMode = "harian" | "bulanan";
type FilterStatus = "semua" | "Kedatangan" | "Keberangkatan";

export default function DashboardPage() {
  const [allData, setAllData] = useState<KendaraanRow[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("bulanan");
  const [bulan, setBulan] = useState("Januari");
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [openDropdown, setOpenDropdown] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("semua");

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
        setAllData(rows);
      })
      .catch((err) => console.error("Gagal fetch:", err));
  }, []);

  // Filter data
  const filteredData = allData.filter((k) => {
    const date = parseTimestamp(k.timestamp);
    if (filterMode === "harian") {
      const [yyyy, mm, dd] = tanggal.split("-").map(Number);
      if (!(date.getFullYear() === yyyy && date.getMonth() === mm - 1 && date.getDate() === dd)) return false;
    } else {
      if (date.getMonth() !== bulanIndex[bulan] || date.getFullYear() !== tahun) return false;
    }
    return filterStatus === "semua" || k.status === filterStatus;
  });

  // Chart data
  const jenisCount: Record<string, number> = {};
  filteredData.forEach((k) => { jenisCount[k.jenis] = (jenisCount[k.jenis] || 0) + 1; });
  const jenisChartData = Object.entries(jenisCount).map(([name, value], i) => ({ name, value, fill: barColors[i % barColors.length] }));

  const kedatanganCount = filteredData.filter((k) => k.status === "Kedatangan").length;
  const keberangkatanCount = filteredData.filter((k) => k.status === "Keberangkatan").length;
  const pieChartData = [
    { name: "Kedatangan", value: kedatanganCount, color: "#60a5fa" },
    { name: "Keberangkatan", value: keberangkatanCount, color: "#4ade80" },
  ];

  return (
    <div className="space-y-6">
      {/* Filter Bar — di paling atas */}
      <div className="bg-white rounded-2xl px-6 py-4 shadow-md flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button onClick={() => setFilterMode("harian")} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${filterMode === "harian" ? "bg-sidebar text-white" : "bg-gray-50 text-text-secondary hover:bg-gray-100"}`}>
            <CalendarDays className="w-4 h-4" /> Harian
          </button>
          <button onClick={() => setFilterMode("bulanan")} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${filterMode === "bulanan" ? "bg-sidebar text-white" : "bg-gray-50 text-text-secondary hover:bg-gray-100"}`}>
            <Calendar className="w-4 h-4" /> Bulanan
          </button>
        </div>

        {filterMode === "harian" && (
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 focus:border-sidebar transition" />
        )}

        {filterMode === "bulanan" && (
          <>
            <div className="relative">
              <button onClick={() => setOpenDropdown(!openDropdown)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-[140px] justify-between">
                <div className="flex items-center gap-2"><Filter className="w-4 h-4" /><span>{bulan}</span></div>
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
          </>
        )}

        {/* Filter Status */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {(["semua", "Kedatangan", "Keberangkatan"] as FilterStatus[]).map((s, i) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-2 text-xs font-medium transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${filterStatus === s ? s === "Kedatangan" ? "bg-blue-500 text-white" : s === "Keberangkatan" ? "bg-green-500 text-white" : "bg-sidebar text-white" : "bg-gray-50 text-text-secondary hover:bg-gray-100"}`}>
              {s === "semua" ? "Semua" : s}
            </button>
          ))}
        </div>

        <span className="text-xs text-text-secondary ml-auto">{filteredData.length} data</span>
      </div>

      {/* Total Kendaraan */}
      <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center gap-4 shadow-lg">
        <div className="flex flex-col">
          <h2 className="text-white font-bold text-lg tracking-wide">TOTAL KENDARAAN</h2>
          <div className="flex items-center gap-3 mt-1">
            <CarFront className="w-8 h-8 text-white" />
            <span className="text-white text-4xl font-bold">{filteredData.length}</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-md flex-1">
          <h3 className="font-bold text-text-primary text-sm mb-4">Jenis Kendaraan Yang Paling Banyak Digunakan</h3>
          {jenisChartData.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-text-secondary text-sm">Tidak ada data</div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4">
                {jenisChartData.map((item) => (<div key={item.name} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.fill }} /><span className="text-xs text-text-secondary">{item.name}</span></div>))}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={jenisChartData} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px", padding: "10px 14px" }} formatter={(value) => [`${value}`, "Jumlah"]} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>{jenisChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-md w-full lg:w-[380px]">
          <div className="flex items-center gap-2 mb-4"><div className="w-1 h-4 bg-sidebar rounded-full" /><h3 className="font-bold text-text-primary text-sm">Kedatangan vs Keberangkatan</h3></div>
          {filteredData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-text-secondary text-sm">Tidak ada data</div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-2">
                {pieChartData.map((item) => (<div key={item.name} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color }} /><span className="text-xs text-text-secondary">{item.name} ({item.value})</span></div>))}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">{pieChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie>
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px", padding: "10px 14px" }} formatter={(value, name) => [`${value}`, `${name}`]} />
                </PieChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-200">
                {["No","Timestamp","Status","TNKB","Jenis Kendaraan","Penumpang Kedatangan","Penumpang Keberangkatan","Trayek Asal","Trayek Tujuan","Nama Perusahaan"].map((col) => (
                  <th key={col} className="text-left px-4 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1"><span>{col}</span>{col !== "No" && <ArrowUpDown className="w-3 h-3" />}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-text-secondary">Tidak ada data yang sesuai filter.</td></tr>
              ) : (
                filteredData.map((k, idx) => (
                  <tr key={k.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{idx + 1}</td>
                    <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{k.timestamp}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${k.status === "Kedatangan" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{k.status}</span></td>
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
      </div>
    </div>
  );
}
