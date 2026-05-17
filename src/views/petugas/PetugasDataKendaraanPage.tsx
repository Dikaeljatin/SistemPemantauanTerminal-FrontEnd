"use client";

import { CarFront, Filter, ChevronDown, Calendar, Trash2, Pencil, X } from "lucide-react";
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
  id: number;
  timestamp: string;
  status: string;
  tnkb: string;
  jenis: string;
  penumpangDatang: number;
  penumpangBerangkat: number;
  trayekAsal: string;
  trayekTujuan: string;
  perusahaan: string;
}

export default function PetugasDataKendaraanPage() {
  const [kendaraanData, setKendaraanData] = useState<KendaraanRow[]>([]);
  const [filterMode, setFilterMode] = useState<"bulanan" | "harian">("bulanan");
  const [bulan, setBulan] = useState("Januari");
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [openDropdown, setOpenDropdown] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"semua" | "Kedatangan" | "Keberangkatan">("semua");
  const today = new Date().toISOString().split("T")[0];
  const [tanggal, setTanggal] = useState(today);

  // Fetch data dari API
  useEffect(() => {
    fetch("http://localhost:5000/api/pergerakan")
      .then((res) => res.json())
      .then((json) => {
        const rows: KendaraanRow[] = (json.data || []).map((item: any, idx: number) => {
          // Timestamp dari DB format: "2026-05-12T07:30:00.000Z" atau "2026-05-12 07:30:00"
          // Tampilkan langsung tanpa konversi timezone
          let ts = "";
          if (item.timestamp) {
            const raw = item.timestamp.replace("T", " ").replace("Z", "").split(".")[0];
            const [datePart, timePart] = raw.split(" ");
            const [yyyy, mm, dd] = datePart.split("-");
            const time = timePart ? timePart.slice(0, 5) : "00:00";
            ts = `${dd}/${mm}/${yyyy} ${time}`;
          }
          const statusLabel = item.status_pergerakan === "kedatangan" ? "Kedatangan" : "Keberangkatan";
          return {
            id: item.pergerakan_id ?? idx,
            timestamp: ts,
            status: statusLabel,
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
      .catch((err) => console.error("Gagal fetch data:", err));
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
    const matchStatus = filterStatus === "semua" || k.status === filterStatus;
    return matchStatus;
  });

  const [hapusId, setHapusId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<KendaraanRow | null>(null);
  const [editForm, setEditForm] = useState({ tnkb: "", trayekAsal: "", trayekTujuan: "", jumlah_penumpang: "", status_pergerakan: "", timestamp: "", perusahaan: "" });
  const [showEditSuccess, setShowEditSuccess] = useState(false);

  const [showEditConfirm, setShowEditConfirm] = useState(false);

  const handleHapus = async () => {
    if (!hapusId) return;
    try {
      await fetch(`http://localhost:5000/api/pergerakan/${hapusId}`, { method: "DELETE" });
      setKendaraanData((prev) => prev.filter((k) => k.id !== hapusId));
    } catch (err) {
      console.error("Gagal hapus:", err);
    }
    setHapusId(null);
  };

  const openEdit = (item: KendaraanRow) => {
    // Parse timestamp DD/MM/YYYY HH:mm → YYYY-MM-DDTHH:mm
    const [datePart, timePart] = item.timestamp.split(" ");
    const [dd, mm, yyyy] = datePart.split("/");
    const tsForInput = `${yyyy}-${mm}-${dd}T${timePart || "00:00"}`;
    setEditForm({
      tnkb: item.tnkb,
      trayekAsal: item.trayekAsal,
      trayekTujuan: item.trayekTujuan,
      jumlah_penumpang: String(item.penumpangDatang > 0 ? item.penumpangDatang : item.penumpangBerangkat),
      status_pergerakan: item.status === "Kedatangan" ? "kedatangan" : "keberangkatan",
      timestamp: tsForInput,
      perusahaan: item.perusahaan,
    });
    setEditItem(item);
  };

  const handleEdit = async () => {
    if (!editItem) return;
    try {
      await fetch(`http://localhost:5000/api/pergerakan/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tnkb: editForm.tnkb,
          trayek_asal: editForm.trayekAsal,
          trayek_tujuan: editForm.trayekTujuan,
          jumlah_penumpang: parseInt(editForm.jumlah_penumpang) || 0,
          status_pergerakan: editForm.status_pergerakan,
          timestamp: editForm.timestamp.replace("T", " "),
          nama_perusahaan: editForm.perusahaan,
        }),
      });
      // Update local state
      setKendaraanData((prev) => prev.map((k) => {
        if (k.id !== editItem.id) return k;
        const [datePart, timePart] = editForm.timestamp.split("T");
        const [yyyy, mm, dd] = datePart.split("-");
        const ts = `${dd}/${mm}/${yyyy} ${timePart || "00:00"}`;
        const statusLabel = editForm.status_pergerakan === "kedatangan" ? "Kedatangan" : "Keberangkatan";
        const penumpang = parseInt(editForm.jumlah_penumpang) || 0;
        return {
          ...k,
          tnkb: editForm.tnkb,
          timestamp: ts,
          status: statusLabel,
          trayekAsal: editForm.trayekAsal,
          trayekTujuan: editForm.trayekTujuan,
          penumpangDatang: editForm.status_pergerakan === "kedatangan" ? penumpang : 0,
          penumpangBerangkat: editForm.status_pergerakan === "keberangkatan" ? penumpang : 0,
          perusahaan: editForm.perusahaan,
        };
      }));
    } catch (err) {
      console.error("Gagal edit:", err);
    }
    setEditItem(null);
    setShowEditSuccess(true);
    setTimeout(() => setShowEditSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Edit Sukses */}
      {showEditSuccess && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-gray-900 text-white text-sm font-medium px-5 py-3.5 rounded-2xl shadow-2xl">
          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          Data kendaraan berhasil diperbarui!
          <button onClick={() => setShowEditSuccess(false)} className="ml-2 text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {hapusId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-text-primary font-bold text-lg mb-2">Hapus Data</h3>
            <p className="text-text-secondary text-sm mb-6">Yakin ingin menghapus data ini? Tindakan tidak bisa dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={handleHapus} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors">Hapus</button>
              <button onClick={() => setHapusId(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-text-primary text-lg">Edit Data Kendaraan</h3>
              <button onClick={() => setEditItem(null)} className="text-text-secondary hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Timestamp</label>
                <input type="datetime-local" value={editForm.timestamp} onChange={(e) => setEditForm({...editForm, timestamp: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Status</label>
                <select value={editForm.status_pergerakan} onChange={(e) => setEditForm({...editForm, status_pergerakan: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none">
                  <option value="kedatangan">Kedatangan</option>
                  <option value="keberangkatan">Keberangkatan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">TNKB</label>
                <input type="text" value={editForm.tnkb} onChange={(e) => setEditForm({...editForm, tnkb: e.target.value.toUpperCase()})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Jumlah Penumpang</label>
                <input type="number" min="0" max="16" value={editForm.jumlah_penumpang} onChange={(e) => setEditForm({...editForm, jumlah_penumpang: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Trayek Asal</label>
                <input type="text" value={editForm.trayekAsal} onChange={(e) => setEditForm({...editForm, trayekAsal: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Trayek Tujuan</label>
                <input type="text" value={editForm.trayekTujuan} onChange={(e) => setEditForm({...editForm, trayekTujuan: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Nama Perusahaan</label>
                <input type="text" value={editForm.perusahaan} onChange={(e) => setEditForm({...editForm, perusahaan: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditConfirm(true)} className="flex-1 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors">Simpan</button>
              <button onClick={() => setEditItem(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Edit */}
      {showEditConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 text-center">
            <div className="w-14 h-14 bg-sidebar/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pencil className="w-7 h-7 text-sidebar" />
            </div>
            <h3 className="text-text-primary font-bold text-lg mb-2">Konfirmasi Edit</h3>
            <p className="text-text-secondary text-sm mb-6">Apakah Anda yakin ingin menyimpan perubahan data ini?</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowEditConfirm(false); handleEdit(); }} className="flex-1 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors">Simpan</button>
              <button onClick={() => setShowEditConfirm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Header card */}
      <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center gap-4 shadow-lg">
        <CarFront className="w-8 h-8 text-white" />
        <h2 className="text-white font-bold text-xl tracking-wide">DATA KENDARAAN</h2>
      </div>

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
                          bulan === b
                            ? "bg-sidebar text-white"
                            : "text-text-primary hover:bg-gray-50"
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">No</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">TNKB</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">Jenis Kendaraan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">Jumlah Penumpang Kedatangan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">Jumlah Penumpang Keberangkatan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">Trayek Asal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">Trayek Tujuan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">Nama Perusahaan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-sm text-text-secondary">
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
                    <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap text-center">
                      {k.penumpangDatang > 0 ? k.penumpangDatang : "-"}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap text-center">
                      {k.penumpangBerangkat > 0 ? k.penumpangBerangkat : "-"}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{k.trayekAsal}</td>
                    <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{k.trayekTujuan}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-text-primary whitespace-nowrap">{k.perusahaan}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(k)}
                          className="p-1.5 text-sidebar hover:text-sidebar-hover hover:bg-sidebar/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setHapusId(k.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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
