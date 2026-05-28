"use client";

import { CarFront, Filter, ChevronDown, Calendar, Trash2, Pencil, X, Upload, Download, FileSpreadsheet, Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const bulanList = [
  "Semua", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
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
  createdBy: string;
}

export default function PetugasDataKendaraanPage() {
  const [kendaraanData, setKendaraanData] = useState<KendaraanRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"bulanan" | "harian">("bulanan");
  const [bulan, setBulan] = useState("Januari");
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [openDropdown, setOpenDropdown] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"semua" | "Kedatangan" | "Keberangkatan">("semua");
  const today = new Date().toISOString().split("T")[0];
  const [tanggal, setTanggal] = useState(today);
  const [importEnabled, setImportEnabled] = useState(false);
  const [exportEnabled, setExportEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ message: string; errors?: string[] } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [showImportError, setShowImportError] = useState<string | null>(null);

  // Fetch konfigurasi
  useEffect(() => {
    fetch("http://localhost:5000/api/konfigurasi")
      .then((res) => res.json())
      .then((json) => {
        const config = json.data || {};
        setImportEnabled(config.import_enabled === "true");
        setExportEnabled(config.export_enabled === "true");
      })
      .catch(() => {});
  }, []);

  // Fetch data dari API
  useEffect(() => {
    setIsLoading(true);
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
            createdBy: item.created_by || "",
          };
        });
        setKendaraanData(rows);
      })
      .catch((err) => console.error("Gagal fetch data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const displayData = kendaraanData.filter((k) => {
    // Filter periode
    const date = parseTimestamp(k.timestamp);
    if (filterMode === "harian") {
      const [yyyy, mm, dd] = tanggal.split("-").map(Number);
      if (!(date.getFullYear() === yyyy && date.getMonth() === mm - 1 && date.getDate() === dd)) return false;
    } else {
      if (!(bulan === "Semua" || date.getMonth() === bulanIndex[bulan]) || date.getFullYear() !== tahun) return false;
    }
    // Filter status
    const matchStatus = filterStatus === "semua" || k.status === filterStatus;
    if (!matchStatus) return false;
    // Filter search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        k.tnkb.toLowerCase().includes(q) ||
        k.jenis.toLowerCase().includes(q) ||
        k.trayekAsal.toLowerCase().includes(q) ||
        k.trayekTujuan.toLowerCase().includes(q) ||
        k.perusahaan.toLowerCase().includes(q) ||
        k.timestamp.toLowerCase().includes(q)
      );
    }
    return true;
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
  }, [filterMode, bulan, tahun, tanggal, filterStatus, searchQuery]);

  const [hapusId, setHapusId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<KendaraanRow | null>(null);
  const [editForm, setEditForm] = useState({ tnkb: "", trayekAsal: "", trayekTujuan: "", jumlah_penumpang: "", status_pergerakan: "", timestamp: "", perusahaan: "" });
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const [showEditConfirm, setShowEditConfirm] = useState(false);

  const handleHapus = async () => {
    if (!hapusId) return;
    try {
      await fetch(`http://localhost:5000/api/pergerakan/${hapusId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted_by: sessionStorage.getItem("app_username") || "Petugas" }),
      });
      setKendaraanData((prev) => prev.filter((k) => k.id !== hapusId));
      setShowDeleteSuccess(true);
      setTimeout(() => setShowDeleteSuccess(false), 3000);
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
          updated_by: sessionStorage.getItem("app_username") || null,
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

  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("created_by", sessionStorage.getItem("app_username") || "");

      const res = await fetch("http://localhost:5000/api/pergerakan/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setShowImportModal(false);
        setImportFile(null);
        setImportResult(null);
        setShowImportError(json.error || "Gagal import data");
      } else {
        setImportResult({ message: json.message, errors: json.errors });
        // Show success popup and close import modal
        if (json.imported > 0) {
          setShowImportModal(false);
          setImportFile(null);
          setImportResult(null);
          setShowImportSuccess(true);
          setTimeout(() => setShowImportSuccess(false), 3000);
          // Refresh data
          const dataRes = await fetch("http://localhost:5000/api/pergerakan");
          const dataJson = await dataRes.json();
          const rows = (dataJson.data || []).map((item: any, idx: number) => {
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
              createdBy: item.created_by || "",
            };
          });
          setKendaraanData(rows);
        }
      }
    } catch (err) {
      setShowImportModal(false);
      setImportFile(null);
      setImportResult(null);
      setShowImportError("Gagal terhubung ke server");
    }
    setImportLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Modal Import */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-text-primary text-lg">Import Data Kendaraan</h3>
              <button onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }} className="text-text-secondary hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-700 text-sm font-medium mb-1">Format File</p>
                <p className="text-blue-600 text-xs">File Excel (.xlsx) harus sesuai dengan template yang disediakan. Pastikan kolom: Timestamp, Status, TNKB, Jenis Kendaraan, Jumlah Penumpang Kedatangan, Jumlah Penumpang Keberangkatan, Trayek Asal, Trayek Tujuan, Nama Perusahaan.</p>
                <button
                  onClick={() => window.open("http://localhost:5000/api/pergerakan/template", "_blank")}
                  className="mt-2 text-blue-700 text-xs font-semibold underline underline-offset-2"
                >
                  Download Template
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Pilih File Excel</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-text-primary file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sidebar file:text-white hover:file:bg-sidebar-hover"
                />
              </div>

              {importFile && (
                <p className="text-sm text-text-secondary">File: <span className="font-medium text-text-primary">{importFile.name}</span></p>
              )}

              {importResult && (
                <div className={`rounded-xl p-4 ${importResult.errors && importResult.errors.length > 0 ? "bg-amber-50 border border-amber-200" : importResult.message.includes("Gagal") || importResult.message.includes("tidak sesuai") ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
                  <p className={`text-sm font-medium ${importResult.message.includes("Gagal") || importResult.message.includes("tidak sesuai") ? "text-red-700" : "text-green-700"}`}>{importResult.message}</p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      {importResult.errors.map((err, i) => (
                        <p key={i} className="text-xs text-amber-700">{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleImport}
                disabled={!importFile || importLoading}
                className="flex-1 bg-sidebar hover:bg-sidebar-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {importLoading ? (
                  <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Mengimport...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Import Data</>
                )}
              </button>
              <button
                onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Export */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-text-primary text-lg">Export Data Kendaraan</h3>
              <button onClick={() => setShowExportModal(false)} className="text-text-secondary hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-700 text-sm font-medium mb-1">Export ke Excel</p>
                <p className="text-green-600 text-xs">Data akan diexport sesuai filter yang sedang aktif saat ini.</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-text-secondary mb-1">Filter aktif:</p>
                <p className="text-sm font-semibold text-text-primary">
                  {filterMode === "harian"
                    ? `Harian — ${tanggal.split("-").reverse().join("/")}`
                    : `Bulanan — ${bulan} ${tahun}`
                  }
                </p>
                <p className="text-xs text-text-secondary mt-1">{displayData.length} data akan diexport</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  let url = "http://localhost:5000/api/pergerakan/export";
                  const params = new URLSearchParams();
                  if (filterMode === "harian") {
                    params.set("tanggal", tanggal);
                  } else {
                    params.set("bulan", bulan);
                    params.set("tahun", String(tahun));
                  }
                  url += "?" + params.toString();
                  window.open(url, "_blank");
                  setShowExportModal(false);
                }}
                disabled={displayData.length === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" /> Download Excel
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Import Sukses */}
      {showImportSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-text-primary font-bold text-lg mb-2">Import Data Berhasil</h3>
            <p className="text-text-secondary text-sm mb-6">Data kendaraan berhasil diimport ke dalam sistem.</p>
            <button
              onClick={() => setShowImportSuccess(false)}
              className="w-full bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Popup Import Gagal */}
      {showImportError && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-text-primary font-bold text-lg mb-2">Import Data Gagal</h3>
            <p className="text-text-secondary text-sm mb-4">File tidak dapat diimport karena tidak sesuai dengan template yang ditentukan.</p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-left">
              <p className="text-red-700 text-xs font-medium">{showImportError}</p>
            </div>
            <button
              onClick={() => setShowImportError(null)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Toast Edit Sukses */}
      {showEditSuccess && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-gray-900 text-white text-sm font-medium px-5 py-3.5 rounded-2xl shadow-2xl">
          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          Data kendaraan berhasil diperbarui!
          <button onClick={() => setShowEditSuccess(false)} className="ml-2 text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Toast Hapus Sukses */}
      {showDeleteSuccess && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-gray-900 text-white text-sm font-medium px-5 py-3.5 rounded-2xl shadow-2xl">
          <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
          Data kendaraan berhasil dihapus!
          <button onClick={() => setShowDeleteSuccess(false)} className="ml-2 text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
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
      <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <CarFront className="w-8 h-8 text-white" />
          <h2 className="text-white font-bold text-xl tracking-wide">DATA KENDARAAN</h2>
        </div>
        <div className="flex items-center gap-2">
          {importEnabled && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
          )}
          {exportEnabled && (
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          )}
          <button
            onClick={() => window.open("http://localhost:5000/api/pergerakan/template", "_blank")}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Template Excel
          </button>
        </div>
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

          {/* Search Bar */}
          <div className="relative ml-0 sm:ml-auto w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Cari TNKB, trayek, perusahaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 focus:border-sidebar transition w-full sm:w-64"
            />
          </div>
        </div>

        {/* Table */}
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
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
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-sidebar animate-spin" />
                      <span className="text-text-secondary text-sm">Memuat data kendaraan...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-sm text-text-secondary">
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
                      {(() => {
                        const currentUser = typeof window !== "undefined" ? sessionStorage.getItem("app_username") || "" : "";
                        const isOwner = k.createdBy && currentUser && k.createdBy.toLowerCase() === currentUser.toLowerCase();
                        if (!isOwner) return <span className="text-xs text-text-secondary italic">—</span>;
                        return (
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
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12">
              <Loader2 className="w-5 h-5 text-sidebar animate-spin" />
              <span className="text-text-secondary text-sm">Memuat data kendaraan...</span>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-secondary">Tidak ada data yang sesuai filter.</div>
          ) : (
            paginatedData.map((k, idx) => {
              const currentUser = typeof window !== "undefined" ? sessionStorage.getItem("app_username") || "" : "";
              const isOwner = k.createdBy && currentUser && k.createdBy.toLowerCase() === currentUser.toLowerCase();
              return (
                <div key={k.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary font-semibold">#{startIndex + idx + 1}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${k.status === "Kedatangan" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{k.status}</span>
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(k)} className="p-1.5 text-sidebar hover:bg-sidebar/10 rounded-lg" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setHapusId(k.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <p className="font-bold text-text-primary text-base">{k.tnkb}</p>
                      <span className="text-xs text-text-secondary">{k.jenis}</span>
                    </div>
                    <p className="text-xs text-text-secondary">{k.timestamp}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] text-text-secondary uppercase tracking-wide">Trayek Asal</p>
                        <p className="text-sm text-text-primary">{k.trayekAsal || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-secondary uppercase tracking-wide">Trayek Tujuan</p>
                        <p className="text-sm text-text-primary">{k.trayekTujuan || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-secondary uppercase tracking-wide">Penumpang</p>
                        <p className="text-sm text-text-primary">{k.penumpangDatang || k.penumpangBerangkat || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-secondary uppercase tracking-wide">Perusahaan</p>
                        <p className="text-sm text-text-primary">{k.perusahaan || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
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
