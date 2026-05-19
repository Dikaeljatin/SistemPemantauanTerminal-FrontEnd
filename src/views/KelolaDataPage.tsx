"use client";

import { Tag, Plus, Trash2, Pencil, X, Database, Search, Filter, ChevronDown, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

interface JenisKendaraan {
  id: number;
  nama: string;
  kapasitas: number;
}

interface PergerakanRow {
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
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

const bulanList = [
  "Semua","Januari","Februari","Maret","April","Mei","Juni",
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

export default function KelolaDataPage() {
  // Jenis Kendaraan state
  const [data, setData] = useState<JenisKendaraan[]>([]);
  const [showTambah, setShowTambah] = useState(false);
  const [editItem, setEditItem] = useState<JenisKendaraan | null>(null);
  const [hapusItem, setHapusItem] = useState<JenisKendaraan | null>(null);
  const [formNama, setFormNama] = useState("");
  const [formKapasitas, setFormKapasitas] = useState("10");
  const [error, setError] = useState("");
  const [showKonfirmasiTambah, setShowKonfirmasiTambah] = useState(false);
  const [showKonfirmasiEdit, setShowKonfirmasiEdit] = useState(false);

  // Data Pergerakan state
  const [pergerakanData, setPergerakanData] = useState<PergerakanRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"bulanan" | "harian">("bulanan");
  const [bulan, setBulan] = useState("Semua");
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [openDropdown, setOpenDropdown] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [tanggal, setTanggal] = useState(today);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    fetch("http://localhost:5000/api/jenis-kendaraan")
      .then((res) => res.json())
      .then((json) => setData(json.data || []))
      .catch(() => setData([]));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/pergerakan")
      .then((res) => res.json())
      .then((json) => {
        const rows: PergerakanRow[] = (json.data || []).map((item: any, idx: number) => {
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
            createdBy: item.created_by || "-",
            updatedBy: item.updated_by || "-",
            createdAt: item.created_at || "",
            updatedAt: item.updated_at || "",
          };
        });
        setPergerakanData(rows);
      })
      .catch(() => setPergerakanData([]));
  }, []);

  // Filter pergerakan data
  const filteredPergerakan = pergerakanData.filter((k) => {
    const date = parseTimestamp(k.timestamp);
    if (filterMode === "harian") {
      const [yyyy, mm, dd] = tanggal.split("-").map(Number);
      if (!(date.getFullYear() === yyyy && date.getMonth() === mm - 1 && date.getDate() === dd)) return false;
    } else {
      if (!(bulan === "Semua" || date.getMonth() === bulanIndex[bulan]) || date.getFullYear() !== tahun) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return k.tnkb.toLowerCase().includes(q) || k.trayekAsal.toLowerCase().includes(q) ||
        k.trayekTujuan.toLowerCase().includes(q) || k.perusahaan.toLowerCase().includes(q) ||
        k.createdBy.toLowerCase().includes(q) || k.updatedBy.toLowerCase().includes(q);
    }
    return true;
  });

  const totalItems = filteredPergerakan.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedPergerakan = filteredPergerakan.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [filterMode, bulan, tahun, tanggal, searchQuery]);

  const handleTambah = async () => {
    if (!formNama.trim()) { setError("Nama wajib diisi"); return; }
    try {
      const res = await fetch("http://localhost:5000/api/jenis-kendaraan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: formNama.trim(), kapasitas: parseInt(formKapasitas) || 10 }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setData([...data, json.data]);
      setShowTambah(false); setFormNama(""); setFormKapasitas("10"); setError("");
    } catch { setError("Gagal menambahkan"); }
  };

  const handleEdit = async () => {
    if (!editItem || !formNama.trim()) return;
    try {
      await fetch(`http://localhost:5000/api/jenis-kendaraan/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: formNama.trim(), kapasitas: parseInt(formKapasitas) || 10 }),
      });
      setData(data.map((d) => d.id === editItem.id ? { ...d, nama: formNama.trim(), kapasitas: parseInt(formKapasitas) || 10 } : d));
      setEditItem(null); setFormNama(""); setFormKapasitas("10");
    } catch { /* ignore */ }
  };

  const handleHapus = async () => {
    if (!hapusItem) return;
    try {
      await fetch(`http://localhost:5000/api/jenis-kendaraan/${hapusItem.id}`, { method: "DELETE" });
      setData(data.filter((d) => d.id !== hapusItem.id));
    } catch { /* ignore */ }
    setHapusItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center gap-4 shadow-lg">
        <Tag className="w-8 h-8 text-white" />
        <div>
          <h2 className="text-white font-bold text-xl tracking-wide">KELOLA DATA</h2>
          <p className="text-white/60 text-sm mt-0.5">Kelola jenis kendaraan dan lihat data pergerakan</p>
        </div>
      </div>

      {/* Jenis Kendaraan */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-sidebar" />
            <h3 className="font-bold text-text-primary text-base">Jenis Kendaraan</h3>
            <span className="ml-1 bg-sidebar/10 text-sidebar text-xs font-semibold px-2 py-0.5 rounded-full">{data.length}</span>
          </div>
          <button onClick={() => { setShowTambah(true); setFormNama(""); setFormKapasitas("10"); setError(""); }} className="flex items-center gap-2 bg-sidebar hover:bg-sidebar-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Tambah Jenis
          </button>
        </div>
        {data.length === 0 ? (
          <p className="text-text-secondary text-sm py-6 text-center">Belum ada jenis kendaraan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">No</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Nama Jenis</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Kapasitas</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-sm text-text-secondary">{idx + 1}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-text-primary">{item.nama}</td>
                    <td className="px-4 py-3.5 text-sm text-text-secondary">{item.kapasitas} penumpang</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditItem(item); setFormNama(item.nama); setFormKapasitas(String(item.kapasitas)); }} className="p-1.5 text-sidebar hover:bg-sidebar/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setHapusItem(item)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data Pergerakan */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-2 mb-5">
          <Database className="w-5 h-5 text-sidebar" />
          <h3 className="font-bold text-text-primary text-base">Data Pergerakan Kendaraan</h3>
          <span className="ml-1 bg-sidebar/10 text-sidebar text-xs font-semibold px-2 py-0.5 rounded-full">{totalItems} data</span>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            <button onClick={() => setFilterMode("harian")} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${filterMode === "harian" ? "bg-sidebar text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>
              <Calendar className="w-4 h-4" /> Harian
            </button>
            <button onClick={() => setFilterMode("bulanan")} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${filterMode === "bulanan" ? "bg-sidebar text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>
              <Filter className="w-4 h-4" /> Bulanan
            </button>
          </div>

          {filterMode === "harian" && (
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 transition" />
          )}

          {filterMode === "bulanan" && (
            <>
              <div className="relative">
                <button onClick={() => setOpenDropdown(!openDropdown)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-[140px] justify-between">
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
              <input type="number" min="2020" max="2099" value={tahun} onChange={(e) => setTahun(parseInt(e.target.value))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 transition w-20" />
            </>
          )}

          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input type="text" placeholder="Cari TNKB, trayek, petugas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 transition w-64" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px]">
            <thead>
              <tr className="border-b border-gray-200">
                {["No","Timestamp","Status","TNKB","Jenis","P. Kedatangan","P. Keberangkatan","Trayek Asal","Trayek Tujuan","Perusahaan","Diinput Oleh","Waktu Input","Diedit Oleh","Waktu Edit"].map((col) => (
                  <th key={col} className="text-left px-3 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedPergerakan.length === 0 ? (
                <tr><td colSpan={14} className="px-3 py-10 text-center text-sm text-text-secondary">Tidak ada data.</td></tr>
              ) : (
                paginatedPergerakan.map((k, idx) => (
                  <tr key={k.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-sm text-text-secondary whitespace-nowrap">{startIndex + idx + 1}</td>
                    <td className="px-3 py-3 text-sm text-text-secondary whitespace-nowrap">{k.timestamp}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${k.status === "Kedatangan" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{k.status}</span>
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-text-primary whitespace-nowrap">{k.tnkb}</td>
                    <td className="px-3 py-3 text-sm text-text-secondary whitespace-nowrap">{k.jenis}</td>
                    <td className="px-3 py-3 text-sm text-text-secondary whitespace-nowrap text-center">{k.penumpangDatang > 0 ? k.penumpangDatang : "-"}</td>
                    <td className="px-3 py-3 text-sm text-text-secondary whitespace-nowrap text-center">{k.penumpangBerangkat > 0 ? k.penumpangBerangkat : "-"}</td>
                    <td className="px-3 py-3 text-sm text-text-secondary whitespace-nowrap">{k.trayekAsal}</td>
                    <td className="px-3 py-3 text-sm text-text-secondary whitespace-nowrap">{k.trayekTujuan}</td>
                    <td className="px-3 py-3 text-sm text-text-primary whitespace-nowrap">{k.perusahaan}</td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${k.createdBy !== "-" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>{k.createdBy}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary whitespace-nowrap">
                      {k.createdAt ? (() => {
                        const d = new Date(k.createdAt);
                        const pad = (n: number) => String(n).padStart(2, "0");
                        return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
                      })() : "-"}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${k.updatedBy !== "-" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{k.updatedBy}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary whitespace-nowrap">
                      {k.updatedAt ? (() => {
                        const d = new Date(k.updatedAt);
                        const pad = (n: number) => String(n).padStart(2, "0");
                        return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
                      })() : "-"}
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
              <span className="text-sm text-text-secondary">Menampilkan {startIndex + 1}–{Math.min(endIndex, totalItems)} dari {totalItems} data</span>
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-secondary">Per halaman:</label>
                <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30">
                  {[10, 20, 50, 100].map((n) => (<option key={n} value={n}>{n}</option>))}
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

      {/* Modal Tambah */}
      {showTambah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-text-primary text-lg">Tambah Jenis Kendaraan</h3>
              <button onClick={() => setShowTambah(false)} className="text-text-secondary hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Nama Jenis</label>
                <input type="text" value={formNama} onChange={(e) => { setFormNama(e.target.value); setError(""); }} placeholder="Contoh: Minibus" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Kapasitas</label>
                <input type="number" min="1" value={formKapasitas} onChange={(e) => setFormKapasitas(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none" />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { if (!formNama.trim()) { setError("Nama wajib diisi"); return; } setShowKonfirmasiTambah(true); }} className="flex-1 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors">Tambah</button>
              <button onClick={() => setShowTambah(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors">Batal</button>
            </div>
          </div>
        </div>
      )}

      {showKonfirmasiTambah && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 text-center">
            <div className="w-14 h-14 bg-sidebar/10 rounded-full flex items-center justify-center mx-auto mb-4"><Plus className="w-7 h-7 text-sidebar" /></div>
            <h3 className="text-text-primary font-bold text-lg mb-2">Konfirmasi Tambah</h3>
            <p className="text-text-secondary text-sm mb-6">Tambahkan jenis kendaraan <span className="font-semibold">{formNama}</span> dengan kapasitas {formKapasitas} penumpang?</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowKonfirmasiTambah(false); handleTambah(); }} className="flex-1 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors">Tambah</button>
              <button onClick={() => setShowKonfirmasiTambah(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors">Batal</button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-text-primary text-lg">Edit Jenis Kendaraan</h3>
              <button onClick={() => setEditItem(null)} className="text-text-secondary hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Nama Jenis</label>
                <input type="text" value={formNama} onChange={(e) => setFormNama(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Kapasitas</label>
                <input type="number" min="1" value={formKapasitas} onChange={(e) => setFormKapasitas(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowKonfirmasiEdit(true)} className="flex-1 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors">Simpan</button>
              <button onClick={() => setEditItem(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors">Batal</button>
            </div>
          </div>
        </div>
      )}

      {showKonfirmasiEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 text-center">
            <div className="w-14 h-14 bg-sidebar/10 rounded-full flex items-center justify-center mx-auto mb-4"><Pencil className="w-7 h-7 text-sidebar" /></div>
            <h3 className="text-text-primary font-bold text-lg mb-2">Konfirmasi Edit</h3>
            <p className="text-text-secondary text-sm mb-6">Apakah Anda yakin ingin menyimpan perubahan ini?</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowKonfirmasiEdit(false); handleEdit(); }} className="flex-1 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors">Simpan</button>
              <button onClick={() => setShowKonfirmasiEdit(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors">Batal</button>
            </div>
          </div>
        </div>
      )}

      {hapusItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-7 h-7 text-red-500" /></div>
            <h3 className="text-text-primary font-bold text-lg mb-2">Hapus Jenis Kendaraan</h3>
            <p className="text-text-secondary text-sm mb-6">Yakin ingin menghapus <span className="font-semibold">{hapusItem.nama}</span>?</p>
            <div className="flex gap-3">
              <button onClick={handleHapus} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors">Hapus</button>
              <button onClick={() => setHapusItem(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
