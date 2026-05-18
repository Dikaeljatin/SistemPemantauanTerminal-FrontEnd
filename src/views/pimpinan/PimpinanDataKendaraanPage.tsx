"use client";

import { CarFront, CalendarDays, Calendar, Filter, ChevronDown, Search } from "lucide-react";
import { useState, useEffect } from "react";

const bulanList = [
  "Semua","Januari","Februari","Maret","April","Mei","Juni",
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

type FilterMode = "harian" | "bulanan";

export default function PimpinanDataKendaraanPage() {
  const [kendaraanData, setKendaraanData] = useState<KendaraanRow[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("bulanan");
  const [selectedBulan, setSelectedBulan] = useState("Mei");
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear());
  const [openDropdown, setOpenDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"semua" | "Kedatangan" | "Keberangkatan">("semua");

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const [selectedTanggal, setSelectedTanggal] = useState(todayStr);

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

  // Filter berdasarkan periode
  const periodFiltered = kendaraanData.filter((k) => {
    const date = parseTimestamp(k.timestamp);
    if (filterMode === "harian") {
      const [yyyy, mm, dd] = selectedTanggal.split("-").map(Number);
      return date.getFullYear()===yyyy && date.getMonth()===mm-1 && date.getDate()===dd;
    }
    return (selectedBulan === "Semua" || date.getMonth() === bulanIndex[selectedBulan]) && date.getFullYear() === selectedTahun;
  });

  // Filter status + search
  const displayData = periodFiltered.filter((k) => {
    const matchStatus = filterStatus === "semua" || k.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      k.tnkb.toLowerCase().includes(q) ||
      k.jenis.toLowerCase().includes(q) ||
      k.perusahaan.toLowerCase().includes(q) ||
      k.trayekAsal.toLowerCase().includes(q) ||
      k.trayekTujuan.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const filterLabel = filterMode === "harian"
    ? selectedTanggal.split("-").reverse().join("/")
    : `${selectedBulan} ${selectedTahun}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center gap-4 shadow-lg">
        <CarFront className="w-8 h-8 text-white" />
        <div>
          <h2 className="text-white font-bold text-xl tracking-wide">DATA KENDARAAN</h2>
          <p className="text-white/60 text-sm mt-0.5">Pantau data kendaraan yang masuk dan keluar terminal</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-md text-center">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Total</p>
          <p className="text-3xl font-bold text-text-primary">{periodFiltered.length}</p>
          <p className="text-xs text-text-secondary mt-1">kendaraan</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-md text-center">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">Kedatangan</p>
          <p className="text-3xl font-bold text-blue-600">{periodFiltered.filter(k=>k.status==="Kedatangan").length}</p>
          <p className="text-xs text-text-secondary mt-1">kendaraan datang</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-md text-center">
          <p className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-1">Keberangkatan</p>
          <p className="text-3xl font-bold text-green-600">{periodFiltered.filter(k=>k.status==="Keberangkatan").length}</p>
          <p className="text-xs text-text-secondary mt-1">kendaraan berangkat</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Toggle Harian/Bulanan */}
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

          {/* Filter Status */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {(["semua","Kedatangan","Keberangkatan"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${s !== "semua" ? "border-l border-gray-200" : ""} ${
                  filterStatus === s ? "bg-sidebar text-white" : "bg-gray-50 text-text-secondary hover:bg-gray-100"
                }`}
              >
                {s === "semua" ? "Semua" : s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Cari TNKB, jenis, perusahaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 focus:border-sidebar transition w-64"
            />
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-text-secondary mb-3">
          Menampilkan <span className="font-semibold text-text-primary">{displayData.length}</span> data untuk{" "}
          <span className="font-semibold text-text-primary">{filterLabel}</span>
          {filterStatus !== "semua" && (
            <> — status <span className="font-semibold text-text-primary">{filterStatus}</span></>
          )}
        </p>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-200">
                {["No","Timestamp","Status","TNKB","Jenis Kendaraan",
                  "Penumpang Kedatangan","Penumpang Keberangkatan",
                  "Trayek Asal","Trayek Tujuan","Nama Perusahaan"].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-text-secondary">
                    Tidak ada data yang sesuai filter.
                  </td>
                </tr>
              ) : (
                displayData.map((k, idx) => (
                  <tr key={k.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{idx + 1}</td>
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
      </div>
    </div>
  );
}
