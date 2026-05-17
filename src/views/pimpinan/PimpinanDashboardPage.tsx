"use client";

import { CarFront, TrendingUp, TrendingDown, Users, CalendarDays, Calendar, Filter, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";

// ─── Interface ────────────────────────────────────────────────────────────────
interface LaporanRow {
  id: number; timestamp: string; petugas: string; status: string; tnkb: string; jenis: string;
  penumpangDatang: number; penumpangBerangkat: number; trayekAsal: string; trayekTujuan: string; perusahaan: string;
}

const bulanList = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];
const bulanIndex: Record<string, number> = {
  Januari:0,Februari:1,Maret:2,April:3,Mei:4,Juni:5,
  Juli:6,Agustus:7,September:8,Oktober:9,November:10,Desember:11,
};

function parseTimestamp(ts: string): Date {
  const [datePart, timePart] = ts.split(" ");
  const [dd, mm, yyyy] = datePart.split("/").map(Number);
  const [hh, min] = (timePart ?? "00:00").split(":").map(Number);
  return new Date(yyyy, mm - 1, dd, hh, min);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-md flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-text-primary leading-tight">{value}</p>
        {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

type FilterMode = "harian" | "bulanan";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PimpinanDashboardPage() {
  const [laporanData, setLaporanData] = useState<LaporanRow[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("bulanan");
  const [selectedBulan, setSelectedBulan] = useState("Mei");
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear());
  const [openDropdown, setOpenDropdown] = useState(false);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const [selectedTanggal, setSelectedTanggal] = useState(todayStr);

  // Fetch data dari API
  useEffect(() => {
    fetch("http://localhost:5000/api/pergerakan")
      .then((res) => res.json())
      .then((json) => {
        const rows: LaporanRow[] = (json.data || []).map((item: any, idx: number) => {
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
            petugas: "-",
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
        setLaporanData(rows);
      })
      .catch((err) => console.error("Gagal fetch:", err));
  }, []);

  // Filter data
  const filteredData = laporanData.filter((k) => {
    const date = parseTimestamp(k.timestamp);
    if (filterMode === "harian") {
      const [yyyy, mm, dd] = selectedTanggal.split("-").map(Number);
      return date.getFullYear()===yyyy && date.getMonth()===mm-1 && date.getDate()===dd;
    }
    return date.getMonth() === bulanIndex[selectedBulan] && date.getFullYear() === selectedTahun;
  });

  // Statistik
  const totalKendaraan   = filteredData.length;
  const totalDatang      = filteredData.filter((k) => k.status === "Kedatangan").length;
  const totalBerangkat   = filteredData.filter((k) => k.status === "Keberangkatan").length;
  const totalPenumpang   = filteredData.reduce((s, k) => s + k.penumpangDatang + k.penumpangBerangkat, 0);

  // Data chart bar — per jenis kendaraan
  const jenisCount: Record<string, number> = {};
  filteredData.forEach((k) => { jenisCount[k.jenis] = (jenisCount[k.jenis] ?? 0) + 1; });
  const barColors = ["#60a5fa","#4ade80","#fbbf24","#f87171","#a78bfa"];
  const barData = Object.entries(jenisCount).map(([name, value], i) => ({
    name, value, fill: barColors[i % barColors.length],
  }));

  // Data chart pie — datang vs berangkat
  const pieData = [
    { name: "Kedatangan",    value: totalDatang,    color: "#60a5fa" },
    { name: "Keberangkatan", value: totalBerangkat, color: "#4ade80" },
  ];

  // Label filter aktif
  const filterLabel = filterMode === "harian"
    ? selectedTanggal.split("-").reverse().join("/")
    : `${selectedBulan} ${selectedTahun}`;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center gap-4 shadow-lg">
        <CarFront className="w-8 h-8 text-white" />
        <div>
          <h2 className="text-white font-bold text-xl tracking-wide">LAPORAN DASHBOARD</h2>
          <p className="text-white/60 text-sm mt-0.5">Ringkasan laporan pergerakan kendaraan dari petugas</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl px-6 py-4 shadow-md flex flex-wrap items-center gap-3">
        {/* Toggle */}
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

        {/* Input tanggal */}
        {filterMode === "harian" && (
          <input
            type="date"
            value={selectedTanggal}
            onChange={(e) => setSelectedTanggal(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 focus:border-sidebar transition"
          />
        )}

        {/* Dropdown bulan */}
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
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown ? "rotate-180" : ""}`} />
            </button>
            {openDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-full max-h-60 overflow-y-auto">
                {bulanList.map((b) => (
                  <button
                    key={b}
                    onClick={() => { setSelectedBulan(b); setOpenDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      selectedBulan === b ? "bg-sidebar text-white" : "text-text-primary hover:bg-gray-50"
                    }`}
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
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(parseInt(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 focus:border-sidebar transition w-20"
          />
          </>
        )}

        <span className="text-sm text-text-secondary">
          Data untuk <span className="font-semibold text-text-primary">{filterLabel}</span>
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Kendaraan"  value={totalKendaraan} icon={CarFront}     color="bg-sidebar"      sub="kendaraan tercatat" />
        <StatCard label="Kedatangan"       value={totalDatang}    icon={TrendingDown}  color="bg-blue-500"     sub="kendaraan datang"   />
        <StatCard label="Keberangkatan"    value={totalBerangkat} icon={TrendingUp}    color="bg-green-500"    sub="kendaraan berangkat" />
        <StatCard label="Total Penumpang"  value={totalPenumpang} icon={Users}         color="bg-amber-500"    sub="penumpang terlayani" />
      </div>

      {/* Charts */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-md flex-1">
          <h3 className="font-bold text-text-primary text-sm mb-4">Kendaraan per Jenis</h3>
          {barData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-secondary text-sm">
              Tidak ada data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={44}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px", padding: "10px 14px" }}
                  formatter={(v) => [`${v}`, "Jumlah"]}
                />
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-md w-full lg:w-[340px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-sidebar rounded-full" />
            <h3 className="font-bold text-text-primary text-sm">Kedatangan vs Keberangkatan</h3>
          </div>
          {totalKendaraan === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-secondary text-sm">
              Tidak ada data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px", padding: "10px 14px" }}
                  formatter={(v, n) => [`${v}`, `${n}`]}
                />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tabel Laporan Petugas */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="font-bold text-text-primary text-sm mb-4">
          Detail Laporan Petugas
          <span className="ml-2 bg-sidebar/10 text-sidebar text-xs font-semibold px-2 py-0.5 rounded-full">
            {filteredData.length} data
          </span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-gray-200">
                {["No","Timestamp","Petugas","Status","TNKB","Jenis","Penumpang Kedatangan","Penumpang Keberangkatan","Trayek Asal","Trayek Tujuan","Perusahaan"].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-sm text-text-secondary">
                    Tidak ada laporan untuk {filterLabel}.
                  </td>
                </tr>
              ) : (
                filteredData.map((k, idx) => (
                  <tr key={k.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{idx + 1}</td>
                    <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{k.timestamp}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-text-primary whitespace-nowrap">{k.petugas}</td>
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
      </div>
    </div>
  );
}
