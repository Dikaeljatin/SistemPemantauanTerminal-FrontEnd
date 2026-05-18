"use client";

import { Tag, Plus, Trash2, Pencil, X } from "lucide-react";
import { useState, useEffect } from "react";

interface JenisKendaraan {
  id: number;
  nama: string;
  kapasitas: number;
}

export default function KelolaDataPage() {
  const [data, setData] = useState<JenisKendaraan[]>([]);
  const [showTambah, setShowTambah] = useState(false);
  const [editItem, setEditItem] = useState<JenisKendaraan | null>(null);
  const [hapusItem, setHapusItem] = useState<JenisKendaraan | null>(null);
  const [formNama, setFormNama] = useState("");
  const [formKapasitas, setFormKapasitas] = useState("10");
  const [error, setError] = useState("");
  const [showKonfirmasiTambah, setShowKonfirmasiTambah] = useState(false);
  const [showKonfirmasiEdit, setShowKonfirmasiEdit] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/jenis-kendaraan")
      .then((res) => res.json())
      .then((json) => setData(json.data || []))
      .catch(() => setData([]));
  }, []);

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
      setShowTambah(false);
      setFormNama("");
      setFormKapasitas("10");
      setError("");
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
      setEditItem(null);
      setFormNama("");
      setFormKapasitas("10");
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
          <p className="text-white/60 text-sm mt-0.5">Kelola jenis kendaraan dan kapasitas</p>
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
          <button
            onClick={() => { setShowTambah(true); setFormNama(""); setFormKapasitas("10"); setError(""); }}
            className="flex items-center gap-2 bg-sidebar hover:bg-sidebar-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
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

      {/* Popup Konfirmasi Tambah */}
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

      {/* Modal Edit */}
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

      {/* Popup Konfirmasi Edit */}
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

      {/* Modal Hapus */}
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
