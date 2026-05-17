"use client";

import { useState } from "react";
import {
  Brain,
  CarFront,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Users,
  CalendarDays,
  Search,
  ArrowUpDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// Statistik cards
const stats: { label: string; value: string; icon: typeof CarFront; color: string; bg: string }[] = [
  { label: "TOTAL SELURUH KENDARAAN", value: "0", icon: CarFront, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "TOTAL KENDARAAN MASUK", value: "0", icon: ArrowDownLeft, color: "text-green-600", bg: "bg-green-50" },
  { label: "TOTAL KENDARAAN KELUAR", value: "0", icon: ArrowUpRight, color: "text-orange-600", bg: "bg-orange-50" },
  { label: "JAM TERSIBUK", value: "-", icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "JUMLAH PENUMPANG", value: "0", icon: Users, color: "text-red-600", bg: "bg-red-50" },
];

// Grafik prediksi data
const grafikData: { jam: string; masuk: number; keluar: number }[] = [];

// Tabel data
const tableData: { id: number; waktu: string; tnkb: string; jenis: string; status: string; penumpang: number; trayek: string; perusahaan: string }[] = [];

const headers = [
  { key: "waktu", label: "Waktu", sortable: true },
  { key: "tnkb", label: "TNKB", sortable: true },
  { key: "jenis", label: "Jenis Kendaraan", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "penumpang", label: "Jumlah Penumpang", sortable: true },
  { key: "trayek", label: "Trayek", sortable: true },
  { key: "perusahaan", label: "Nama Perusahaan", sortable: true },
];

export default function PrediksiPage() {
  const today = new Date().toISOString().split("T")[0];
  const [tanggalMulai, setTanggalMulai] = useState(today);
  const [tanggalAkhir, setTanggalAkhir] = useState(today);
  const [isLoading, setIsLoading]       = useState(false);
  const [errorRange, setErrorRange]     = useState("");

  const handlePrediksi = () => {
    if (!tanggalMulai || !tanggalAkhir) {
      setErrorRange("Pilih tanggal mulai dan tanggal akhir terlebih dahulu.");
      return;
    }
    if (tanggalAkhir < tanggalMulai) {
      setErrorRange("Tanggal akhir tidak boleh sebelum tanggal mulai.");
      return;
    }
    setErrorRange("");
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Format tanggal ke Indonesia
  const bulanList = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const formatTgl = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${parseInt(d, 10)} ${bulanList[parseInt(m, 10) - 1]} ${y}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center gap-4 shadow-lg">
        <Brain className="w-8 h-8 text-white" />
        <h2 className="text-white font-bold text-xl tracking-wide">PREDIKSI</h2>
      </div>

      {/* Filter Bar - Range Tanggal + Tombol Prediksi */}
      <div className="bg-white rounded-2xl p-5 shadow-md space-y-3">
        <div className="flex items-end gap-3 flex-wrap">
          {/* Tanggal Mulai */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Tanggal Mulai
            </label>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2.5">
              <CalendarDays className="w-4 h-4 text-text-secondary flex-shrink-0" />
              <input
                type="date"
                value={tanggalMulai}
                max={tanggalAkhir || undefined}
                onChange={(e) => {
                  setTanggalMulai(e.target.value);
                  setErrorRange("");
                  // jika mulai > akhir, reset akhir
                  if (tanggalAkhir && e.target.value > tanggalAkhir) {
                    setTanggalAkhir(e.target.value);
                  }
                }}
                className="bg-transparent outline-none text-sm text-text-primary w-36 cursor-pointer"
              />
            </div>
          </div>

          {/* Separator */}
          <div className="pb-2.5">
            <span className="text-text-secondary font-semibold text-sm px-1">—</span>
          </div>

          {/* Tanggal Akhir */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Tanggal Akhir
            </label>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2.5">
              <CalendarDays className="w-4 h-4 text-text-secondary flex-shrink-0" />
              <input
                type="date"
                value={tanggalAkhir}
                min={tanggalMulai || undefined}
                onChange={(e) => {
                  setTanggalAkhir(e.target.value);
                  setErrorRange("");
                }}
                className="bg-transparent outline-none text-sm text-text-primary w-36 cursor-pointer"
              />
            </div>
          </div>

          {/* Tombol Prediksi */}
          <button
            onClick={handlePrediksi}
            disabled={isLoading}
            className="flex items-center gap-2 bg-sidebar hover:bg-sidebar-hover text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-all disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memuat...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Prediksi
              </>
            )}
          </button>
        </div>

        {/* Error validasi */}
        {errorRange && (
          <p className="text-red-500 text-xs font-medium">{errorRange}</p>
        )}

        {/* Info rentang yang dipilih */}
        {tanggalMulai && tanggalAkhir && !errorRange && (
          <p className="text-sm text-text-secondary">
            Menampilkan prediksi dari{" "}
            <span className="font-semibold text-text-primary">{formatTgl(tanggalMulai)}</span>
            {" "}hingga{" "}
            <span className="font-semibold text-text-primary">{formatTgl(tanggalAkhir)}</span>
          </p>
        )}
      </div>

      {/* Statistik Cards - 5 kolom */}
      <div className="grid grid-cols-5 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-5 shadow-md">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Grafik Prediksi Kendaraan */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text-primary text-sm">
            Grafik Prediksi Kendaraan Masuk & Keluar
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
              <span className="text-xs text-text-secondary">Masuk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
              <span className="text-xs text-text-secondary">Keluar</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={grafikData} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="jam"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={{
                borderRadius: "10px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                fontSize: "12px",
                padding: "10px 14px",
              }}
              formatter={(value, name) => [`${value} kendaraan`, name === "masuk" ? "Masuk" : "Keluar"]}
            />
            <Bar dataKey="masuk" fill="#60a5fa" radius={[4, 4, 0, 0]} name="masuk" />
            <Bar dataKey="keluar" fill="#f87171" radius={[4, 4, 0, 0]} name="keluar" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">Keterangan:</span>{" "}
            Grafik di atas menampilkan prediksi jumlah kendaraan yang masuk dan keluar per jam.
            Puncak kendaraan masuk terjadi pada pukul 08:00 (42 kendaraan) dan puncak keluar pada pukul 18:00 (35 kendaraan).
            Data ini dapat membantu dalam perencanaan manajemen terminal dan alokasi sumber daya.
          </p>
        </div>
      </div>

      {/* Tabel Data Prediksi */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-text-primary text-sm">Detail Prediksi Kendaraan</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200">
                {headers.map((h) => (
                  <th
                    key={h.key}
                    className="text-left px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap"
                  >
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
              {tableData.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3.5 text-sm text-text-secondary whitespace-nowrap">
                    {row.waktu}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-medium text-text-primary whitespace-nowrap">
                    {row.tnkb}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary whitespace-nowrap">
                    {row.jenis}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        row.status === "Masuk"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary whitespace-nowrap text-center">
                    {row.penumpang}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary whitespace-nowrap">
                    {row.trayek}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-medium text-text-primary whitespace-nowrap">
                    {row.perusahaan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
