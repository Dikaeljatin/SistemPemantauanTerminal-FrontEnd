"use client";

import { Activity, Search, Plus, Pencil, Trash2, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface ActivityItem {
  id: number;
  username: string;
  action: string;
  description: string;
  detail: string | null;
  created_at: string;
}

export default function AktivitasUserPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<"semua" | "create" | "update" | "delete">("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    fetch("http://localhost:5000/api/activity")
      .then((res) => res.json())
      .then((json) => setActivities(json.data || []))
      .catch(() => setActivities([]));
  }, []);

  const filteredData = activities.filter((a) => {
    const matchAction = filterAction === "semua" || a.action === filterAction;
    if (!matchAction) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return a.username.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || (a.detail || "").toLowerCase().includes(q);
    }
    return true;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [filterAction, searchQuery]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create": return <Plus className="w-4 h-4 text-green-600" />;
      case "update": return <Pencil className="w-4 h-4 text-blue-600" />;
      case "delete": return <Trash2 className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "create": return "bg-green-100 text-green-700";
      case "update": return "bg-blue-100 text-blue-700";
      case "delete": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "create": return "Input";
      case "update": return "Edit";
      case "delete": return "Hapus";
      default: return action;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center gap-4 shadow-lg">
        <Activity className="w-8 h-8 text-white" />
        <div>
          <h2 className="text-white font-bold text-xl tracking-wide">AKTIVITAS USER</h2>
          <p className="text-white/60 text-sm mt-0.5">Log aktivitas petugas (input, edit, hapus data kendaraan)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-sidebar/10 rounded-xl flex items-center justify-center"><Activity className="w-6 h-6 text-sidebar" /></div>
          <div><p className="text-xs text-text-secondary font-semibold uppercase">Total Aktivitas</p><p className="text-2xl font-bold text-text-primary">{activities.length}</p></div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center"><Plus className="w-6 h-6 text-green-500" /></div>
          <div><p className="text-xs text-green-500 font-semibold uppercase">Input Data</p><p className="text-2xl font-bold text-green-600">{activities.filter(a => a.action === "create").length}</p></div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center"><Pencil className="w-6 h-6 text-blue-500" /></div>
          <div><p className="text-xs text-blue-500 font-semibold uppercase">Edit Data</p><p className="text-2xl font-bold text-blue-600">{activities.filter(a => a.action === "update").length}</p></div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center"><Trash2 className="w-6 h-6 text-red-500" /></div>
          <div><p className="text-xs text-red-500 font-semibold uppercase">Hapus Data</p><p className="text-2xl font-bold text-red-600">{activities.filter(a => a.action === "delete").length}</p></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {(["semua", "create", "update", "delete"] as const).map((s, i) => (
              <button key={s} onClick={() => setFilterAction(s)} className={`px-4 py-2 text-xs font-medium transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${filterAction === s ? s === "create" ? "bg-green-500 text-white" : s === "update" ? "bg-blue-500 text-white" : s === "delete" ? "bg-red-500 text-white" : "bg-sidebar text-white" : "bg-gray-50 text-text-secondary hover:bg-gray-100"}`}>
                {s === "semua" ? "Semua" : s === "create" ? "Input" : s === "update" ? "Edit" : "Hapus"}
              </button>
            ))}
          </div>
          <span className="text-xs text-text-secondary">{filteredData.length} aktivitas</span>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input type="text" placeholder="Cari username, deskripsi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 transition w-64" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200">
                {["No", "Waktu", "User", "Aksi", "Deskripsi", "Detail"].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-text-secondary">Belum ada aktivitas tercatat.</td></tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-sm text-text-secondary">{startIndex + idx + 1}</td>
                    <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-text-secondary/60" />
                        {formatDate(item.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-text-primary whitespace-nowrap">{item.username}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getActionBadge(item.action)}`}>
                        {getActionIcon(item.action)}
                        {getActionLabel(item.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-text-primary">{item.description}</td>
                    <td className="px-4 py-3.5 text-sm text-text-secondary">{item.detail || "-"}</td>
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
              <span className="text-sm text-text-secondary">Menampilkan {startIndex + 1}–{Math.min(endIndex, totalItems)} dari {totalItems}</span>
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-secondary">Per halaman:</label>
                <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30">
                  {[10, 20, 50, 100].map((n) => (<option key={n} value={n}>{n}</option>))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-text-secondary">«</button>
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-text-secondary">‹</button>
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
                  <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1.5 text-sm rounded-lg ${currentPage === p ? "bg-sidebar text-white font-semibold" : "hover:bg-gray-100 text-text-secondary"}`}>{p}</button>
                ));
              })()}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-text-secondary">›</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-text-secondary">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
