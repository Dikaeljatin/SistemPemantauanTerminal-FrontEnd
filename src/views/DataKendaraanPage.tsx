"use client";

import { CarFront, Filter, ChevronDown, Plus, Trash2, X, Tag, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

const bulanList = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const bulanIndex: Record<string, number> = {
  Januari:0, Februari:1, Maret:2, April:3, Mei:4, Juni:5,
  Juli:6, Agustus:7, September:8, Oktober:9, November:10, Desember:11,
};

// Helper: format tanggal ke string lokal Indonesia
function formatTanggal(dateStr: string) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  const bulanNama = bulanList[parseInt(month, 10) - 1];
  return `${parseInt(day, 10)} ${bulanNama} ${year}`;
}

function parseTimestamp(ts: string): Date {
  const [datePart, timePart] = ts.split(" ");
  const [dd, mm, yyyy] = datePart.split("/").map(Number);
  const [hh, min] = (timePart ?? "00:00").split(":").map(Number);
  return new Date(yyyy, mm - 1, dd, hh, min);
}

interface KendaraanRow {
  id: number; timestamp: string; status: string; tnkb: string; jenis: string;
  penumpangDatang: number; penumpangBerangkat: number; trayekAsal: string; trayekTujuan: string; perusahaan: string;
}

const initialJenis = ["MICROBUS", "HIACE", "L300", "KIA"];

// ─── Modal Tambah Jenis ───────────────────────────────────────────────────────
function TambahJenisModal({
  existing,
  onSave,
  onClose,
}: {
  existing: string[];
  onSave: (nama: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) { setError("Nama jenis kendaraan wajib diisi"); return; }
    if (existing.includes(trimmed)) { setError("Jenis kendaraan sudah ada"); return; }
    onSave(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-text-primary font-bold text-lg">Tambah Jenis Kendaraan</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Nama Jenis Kendaraan
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="Contoh: MINIBUS"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none transition-all ${
              error
                ? "border-red-400 bg-red-50"
                : "border-gray-200 focus:border-sidebar/50 focus:ring-2 focus:ring-sidebar/10"
            }`}
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          <p className="text-text-secondary text-xs mt-1.5">Nama akan otomatis diubah ke huruf kapital.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors"
          >
            Tambah
          </button>
          <button
            onClick={onClose}
            className="px-5 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Konfirmasi Hapus Jenis ─────────────────────────────────────────────
function HapusJenisModal({
  nama,
  onConfirm,
  onClose,
}: {
  nama: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-text-primary font-bold text-lg mb-2">Hapus Jenis Kendaraan</h3>
        <p className="text-text-secondary text-sm mb-6">
          Yakin ingin menghapus jenis{" "}
          <span className="font-semibold text-text-primary">{nama}</span>?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Hapus
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DataKendaraanPage() {
  // Mode filter: "bulanan" | "harian"
  const [filterMode, setFilterMode]     = useState<"bulanan" | "harian">("bulanan");

  // State bulanan
  const [bulan, setBulan]               = useState("Januari");
  const [tahun, setTahun]               = useState(new Date().getFullYear());
  const [openDropdown, setOpenDropdown] = useState(false);

  // State harian
  const today = new Date().toISOString().split("T")[0];
  const [tanggal, setTanggal]           = useState(today);

  const [jenisKendaraan, setJenisKendaraan] = useState<string[]>(initialJenis);
  const [showTambah, setShowTambah]     = useState(false);
  const [hapusTarget, setHapusTarget]   = useState<string | null>(null);
  const [toastMsg, setToastMsg]         = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"semua" | "Kedatangan" | "Keberangkatan">("semua");
  const [kendaraanData, setKendaraanData] = useState<KendaraanRow[]>([]);

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

  const displayData = kendaraanData.filter((k) => {
    // Filter periode
    const date = parseTimestamp(k.timestamp);
    if (filterMode === "harian") {
      const [yyyy, mm, dd] = tanggal.split("-").map(Number);
      if (!(date.getFullYear() === yyyy && date.getMonth() === mm - 1 && date.getDate() === dd)) return false;
    } else {
      if (date.getMonth() !== bulanIndex[bulan] || date.getFullYear() !== tahun) return false;
    }
    // Filter status
    return filterStatus === "semua" || k.status === filterStatus;
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleTambahJenis = (nama: string) => {
    setJenisKendaraan((prev) => [...prev, nama]);
    setShowTambah(false);
    showToast(`Jenis kendaraan "${nama}" berhasil ditambahkan.`);
  };

  const handleHapusJenis = () => {
    if (!hapusTarget) return;
    const nama = hapusTarget;
    setJenisKendaraan((prev) => prev.filter((j) => j !== nama));
    setHapusTarget(null);
    showToast(`Jenis kendaraan "${nama}" berhasil dihapus.`);
  };

  return (
    <>
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-gray-900 text-white text-sm font-medium px-5 py-3.5 rounded-2xl shadow-2xl animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          {toastMsg}
          <button
            onClick={() => setToastMsg(null)}
            className="ml-2 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {showTambah && (
        <TambahJenisModal
          existing={jenisKendaraan}
          onSave={handleTambahJenis}
          onClose={() => setShowTambah(false)}
        />
      )}
      {hapusTarget && (
        <HapusJenisModal
          nama={hapusTarget}
          onConfirm={handleHapusJenis}
          onClose={() => setHapusTarget(null)}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center gap-4 shadow-lg">
          <CarFront className="w-8 h-8 text-white" />
          <h2 className="text-white font-bold text-xl tracking-wide">DATA KENDARAAN</h2>
        </div>

        {/* ── Kelola Jenis Kendaraan ── */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-sidebar" />
              <h3 className="font-bold text-text-primary text-base">Jenis Kendaraan</h3>
              <span className="ml-1 bg-sidebar/10 text-sidebar text-xs font-semibold px-2 py-0.5 rounded-full">
                {jenisKendaraan.length}
              </span>
            </div>
            <button
              onClick={() => setShowTambah(true)}
              className="flex items-center gap-2 bg-sidebar hover:bg-sidebar-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Jenis
            </button>
          </div>

          {jenisKendaraan.length === 0 ? (
            <p className="text-text-secondary text-sm py-4 text-center">Belum ada jenis kendaraan.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {jenisKendaraan.map((j) => (
                <div
                  key={j}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full pl-4 pr-2 py-1.5 group"
                >
                  <span className="text-sm font-semibold text-text-primary">{j}</span>
                  <button
                    onClick={() => setHapusTarget(j)}
                    className="w-5 h-5 rounded-full bg-gray-300 hover:bg-red-400 hover:text-white flex items-center justify-center transition-colors text-text-secondary"
                    title={`Hapus ${j}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tabel Data Kendaraan ── */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          {/* Filter Bar */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            {/* Toggle Harian / Bulanan */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setFilterMode("harian")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filterMode === "harian"
                    ? "bg-sidebar text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Harian
              </button>
              <button
                onClick={() => setFilterMode("bulanan")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filterMode === "bulanan"
                    ? "bg-sidebar text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Filter className="w-4 h-4" />
                Bulanan
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200" />

            {/* Filter Harian */}
            {filterMode === "harian" && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-text-secondary font-medium">Pilih Tanggal:</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar focus:border-transparent transition-all cursor-pointer"
                />
                <span className="text-sm text-text-secondary">
                  Menampilkan data tanggal{" "}
                  <span className="font-semibold text-text-primary">{formatTanggal(tanggal)}</span>
                </span>
              </div>
            )}

            {/* Filter Bulanan */}
            {filterMode === "bulanan" && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-text-secondary font-medium">Pilih Bulan:</label>
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(!openDropdown)}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-text-primary px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-w-[160px] justify-between"
                  >
                    <span>{bulan}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {openDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-full max-h-60 overflow-y-auto">
                      {bulanList.map((b) => (
                        <button
                          key={b}
                          onClick={() => { setBulan(b); setOpenDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            bulan === b ? "bg-sidebar text-white" : "text-text-primary hover:bg-gray-50"
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
                  value={tahun}
                  onChange={(e) => setTahun(parseInt(e.target.value))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 focus:border-sidebar transition w-20"
                />
                <span className="text-sm text-text-secondary">
                  Menampilkan data bulan{" "}
                  <span className="font-semibold text-text-primary">{bulan} {tahun}</span>
                </span>
              </div>
            )}

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200" />

            {/* Filter Status */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {(["semua", "Kedatangan", "Keberangkatan"] as const).map((s, i) => (
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-200">
                  {["No","Timestamp","Status","TNKB","Jenis Kendaraan",
                    "Jumlah Penumpang Kedatangan","Jumlah Penumpang Keberangkatan",
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
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          jenisKendaraan.includes(k.jenis)
                            ? "bg-sidebar/10 text-sidebar"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {k.jenis}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap text-center">
                        {k.penumpangDatang > 0 ? k.penumpangDatang : "-"}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap text-center">
                        {k.penumpangBerangkat > 0 ? k.penumpangBerangkat : "-"}
                      </td>
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
    </>
  );
}
