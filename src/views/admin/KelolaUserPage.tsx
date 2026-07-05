"use client";

import { Users, Plus, Search, Shield, User, Pencil, Trash2, X, Check, Loader2, Eye, EyeOff, Activity, Clock, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";

type Role = "Admin" | "Petugas" | "Pimpinan";
type Status = "Aktif" | "Nonaktif";

interface UserData {
  id: number;
  nama: string;
  email: string;
  username: string;
  role: Role;
  status: Status;
}

const roleBadge: Record<Role, string> = {
  Admin:    "bg-purple-100 text-purple-700",
  Petugas:  "bg-blue-100 text-blue-700",
  Pimpinan: "bg-amber-100 text-amber-700",
};

const roles: Role[] = ["Admin", "Petugas", "Pimpinan"];

// ─── Modal Tambah / Edit ──────────────────────────────────────────────────────
interface ModalProps {
  user?: UserData;
  onSave: (data: Omit<UserData, "id"> & { password?: string }) => void;
  onClose: () => void;
}

function UserModal({ user, onSave, onClose }: ModalProps) {
  const [nama,   setNama]   = useState(user?.nama   ?? "");
  const [email,  setEmail]  = useState(user?.email  ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role,   setRole]   = useState<Role>(user?.role   ?? "Petugas");
  const [status, setStatus] = useState<Status>(user?.status ?? "Aktif");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nama.trim())  e.nama  = "Nama wajib diisi";
    if (!email.trim()) e.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Format email tidak valid";
    if (!user) {
      if (!password) e.password = "Password wajib diisi";
      else if (password.length < 6) e.password = "Password minimal 6 karakter";
    }
    return e;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({
      nama, email, username: user?.username ?? nama.toLowerCase().replace(/\s+/g, ""), role, status,
      ...(user ? {} : { password }),
    });
  };

  const inputCls = (key: string) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none transition-all ${
      errors[key]
        ? "border-red-400 bg-red-50"
        : "border-gray-200 focus:border-sidebar/50 focus:ring-2 focus:ring-sidebar/10"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-text-primary font-bold text-lg">
            {user ? "Edit User" : "Tambah User"}
          </h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Nama */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Nama</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Masukkan nama lengkap"
              className={inputCls("nama")}
            />
            {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@terminal.com"
              className={inputCls("email")}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password — hanya saat tambah user baru */}
          {!user && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className={`${inputCls("password")} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    role === r
                      ? "bg-sidebar border-sidebar text-white"
                      : "border-gray-200 text-text-secondary hover:border-sidebar/40 hover:text-sidebar"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {(["Aktif", "Nonaktif"] as Status[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    status === s
                      ? s === "Aktif"
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-red-500 border-red-500 text-white"
                      : "border-gray-200 text-text-secondary hover:border-gray-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-7">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors"
          >
            <Check className="w-4 h-4" />
            {user ? "Simpan Perubahan" : "Tambah User"}
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

// ─── Modal Konfirmasi Hapus ───────────────────────────────────────────────────
function DeleteModal({ user, onConfirm, onClose }: { user: UserData; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-text-primary font-bold text-lg mb-2">Hapus User</h3>
        <p className="text-text-secondary text-sm mb-6">
          Yakin ingin menghapus user <span className="font-semibold text-text-primary">{user.nama}</span>?
          Tindakan ini tidak dapat dibatalkan.
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

interface ActivityItem { id: number; username: string; action: string; description: string; detail: string | null; created_at: string; }

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KelolaUserPage() {
  const [users, setUsers]           = useState<UserData[]>([]);
  const [search, setSearch]         = useState("");
  const [showAdd, setShowAdd]       = useState(false);
  const [editUser, setEditUser]     = useState<UserData | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null);
  const [pendingEdit, setPendingEdit] = useState<Omit<UserData, "id"> | null>(null);
  const [isLoading, setIsLoading]   = useState(true);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [actSearchQuery, setActSearchQuery] = useState("");
  const [actFilterAction, setActFilterAction] = useState<"semua" | "create" | "update" | "delete" | "kirim">("semua");

  useEffect(() => {
    setIsLoadingActivity(true);
    apiFetch("/api/activity")
      .then((res) => res.json())
      .then((json) => setActivities(json.data || []))
      .catch(() => setActivities([]))
      .finally(() => setIsLoadingActivity(false));
  }, []);

  const filteredActivities = activities.filter((a) => {
    const matchAction = actFilterAction === "semua" || a.action === actFilterAction;
    if (!matchAction) return false;
    if (actSearchQuery.trim()) {
      const q = actSearchQuery.toLowerCase();
      return a.username.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || (a.detail || "").toLowerCase().includes(q);
    }
    return true;
  });

  // Fetch users dari API
  useEffect(() => {
    apiFetch("/api/users")
      .then((res) => res.json())
      .then((json) => {
        const rows: UserData[] = (json.data || []).map((u: any) => ({
          id: u.user_id,
          nama: u.nama || "",
          email: u.email || "",
          username: u.username || "",
          role: (u.role === "admin" ? "Admin" : u.role === "petugas" ? "Petugas" : "Pimpinan") as Role,
          status: (u.status === "nonaktif" ? "Nonaktif" : "Aktif") as Status,
        }));
        setUsers(rows);
      })
      .catch((err) => console.error("Gagal fetch users:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (data: Omit<UserData, "id"> & { password?: string }) => {
    try {
      const res = await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ nama: data.nama, email: data.email, username: data.username, password: data.password, role: data.role.toLowerCase() }),
      });
      const json = await res.json();
      if (res.ok) {
        setUsers([...users, { id: json.data.user_id, nama: json.data.nama, email: json.data.email || "", username: json.data.username, role: data.role, status: "Aktif" }]);
      }
    } catch (err) { console.error(err); }
    setShowAdd(false);
  };

  const handleEdit = async (data: Omit<UserData, "id">) => {
    // Simpan data pending, tampilkan konfirmasi
    setPendingEdit(data);
  };

  const confirmEdit = async () => {
    if (!pendingEdit || !editUser) return;
    try {
      await apiFetch(`/api/users/${editUser.id}`, {
        method: "PUT",
        body: JSON.stringify({ nama: pendingEdit.nama, email: pendingEdit.email, username: pendingEdit.username, role: pendingEdit.role.toLowerCase(), status: pendingEdit.status.toLowerCase() }),
      });
      setUsers(users.map((u) => (u.id === editUser.id ? { ...u, ...pendingEdit } : u)));
    } catch (err) { console.error(err); }
    setEditUser(null);
    setPendingEdit(null);
  };

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/users/${deleteUser!.id}`, { method: "DELETE" });
      setUsers(users.filter((u) => u.id !== deleteUser!.id));
    } catch (err) { console.error(err); }
    setDeleteUser(null);
  };

  const totalAdmin    = users.filter((u) => u.role === "Admin").length;
  const totalPetugas  = users.filter((u) => u.role === "Petugas").length;
  const totalPimpinan = users.filter((u) => u.role === "Pimpinan").length;

  return (
    <>
      {/* Modals */}
      {showAdd    && <UserModal onSave={handleAdd}  onClose={() => setShowAdd(false)} />}
      {editUser && !pendingEdit && <UserModal user={editUser} onSave={handleEdit} onClose={() => setEditUser(null)} />}
      {deleteUser && <DeleteModal user={deleteUser} onConfirm={handleDelete} onClose={() => setDeleteUser(null)} />}

      {/* Popup Konfirmasi Edit */}
      {pendingEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 text-center">
            <div className="w-14 h-14 bg-sidebar/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pencil className="w-7 h-7 text-sidebar" />
            </div>
            <h3 className="text-text-primary font-bold text-lg mb-2">Konfirmasi Edit</h3>
            <p className="text-text-secondary text-sm mb-6">Apakah Anda yakin ingin menyimpan perubahan user ini?</p>
            <div className="flex gap-3">
              <button onClick={confirmEdit} className="flex-1 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors">Simpan</button>
              <button onClick={() => { setPendingEdit(null); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors">Batal</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center gap-4 shadow-lg">
          <Users className="w-8 h-8 text-white" />
          <h2 className="text-white font-bold text-xl tracking-wide">KELOLA USER</h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <User className="w-6 h-6 text-sidebar mb-3" />
            <p className="text-3xl font-bold text-text-primary">{users.length}</p>
            <p className="text-sm text-text-secondary mt-1">Total User</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <Shield className="w-6 h-6 text-purple-500 mb-3" />
            <p className="text-3xl font-bold text-text-primary">{totalAdmin}</p>
            <p className="text-sm text-text-secondary mt-1">Admin</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <User className="w-6 h-6 text-blue-500 mb-3" />
            <p className="text-3xl font-bold text-text-primary">{totalPetugas}</p>
            <p className="text-sm text-text-secondary mt-1">Petugas</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <User className="w-6 h-6 text-amber-500 mb-3" />
            <p className="text-3xl font-bold text-text-primary">{totalPimpinan}</p>
            <p className="text-sm text-text-secondary mt-1">Pimpinan</p>
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-2.5 w-full sm:w-80">
              <Search className="w-4 h-4 text-text-secondary flex-shrink-0" />
              <input
                type="text"
                placeholder="Cari nama, email, atau role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm text-text-primary w-full"
              />
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center justify-center gap-2 bg-sidebar hover:bg-sidebar-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Tambah User
            </button>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block relative overflow-x-auto">
            {isLoading && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-lg">
                <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl shadow-md border border-gray-100">
                  <Loader2 className="w-5 h-5 text-sidebar animate-spin" />
                  <span className="text-sm font-medium text-text-secondary">Memuat data user...</span>
                </div>
              </div>
            )}
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">No</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">Nama</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-text-secondary">
                      Tidak ada user yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, idx) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{idx + 1}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-text-primary whitespace-nowrap">{u.nama}</td>
                      <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">{u.email}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge[u.role]}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.status === "Aktif"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditUser(u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold transition-colors"
                            title="Edit user"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteUser(u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors"
                            title="Hapus user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-text-secondary">Tidak ada user yang ditemukan.</div>
            ) : (
              filtered.map((u) => (
                <div key={u.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div>
                      <p className="font-bold text-text-primary text-base">{u.nama}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{u.email}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${u.status === "Aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge[u.role]}`}>{u.role}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditUser(u)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold transition-colors" title="Edit user">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => setDeleteUser(u)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors" title="Hapus user">
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Aktivitas User */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-sidebar" />
            <h3 className="font-bold text-text-primary text-base">Aktivitas User</h3>
            <span className="ml-1 bg-sidebar/10 text-sidebar text-xs font-semibold px-2 py-0.5 rounded-full">{filteredActivities.length}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {(["semua", "create", "update", "delete", "kirim"] as const).map((s, i) => (
                <button key={s} onClick={() => setActFilterAction(s)} className={`px-3 py-1.5 text-xs font-medium transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${actFilterAction === s ? s === "create" ? "bg-green-500 text-white" : s === "update" ? "bg-blue-500 text-white" : s === "delete" ? "bg-red-500 text-white" : s === "kirim" ? "bg-purple-500 text-white" : "bg-sidebar text-white" : "bg-gray-50 text-text-secondary hover:bg-gray-100"}`}>
                  {s === "semua" ? "Semua" : s === "create" ? "Input" : s === "update" ? "Edit" : s === "delete" ? "Hapus" : "Kirim"}
                </button>
              ))}
            </div>
            <div className="relative ml-0 sm:ml-auto w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input type="text" placeholder="Cari user, deskripsi..." value={actSearchQuery} onChange={(e) => setActSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-text-primary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sidebar/30 transition w-full sm:w-56" />
            </div>
          </div>

          {isLoadingActivity ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="w-5 h-5 text-sidebar animate-spin" />
              <span className="text-sm text-text-secondary">Memuat aktivitas...</span>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full min-w-[700px]">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200">
                    {["Waktu", "User", "Aksi", "Deskripsi", "Detail"].map((col) => (
                      <th key={col} className="text-left px-3 py-2.5 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.length === 0 ? (
                    <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-text-secondary">Belum ada aktivitas tercatat.</td></tr>
                  ) : (
                    filteredActivities.slice(0, 50).map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 text-xs text-text-secondary whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-text-secondary/60" />
                            {(() => { const d = new Date(item.created_at); const pad = (n: number) => String(n).padStart(2,"0"); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; })()}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm font-medium text-text-primary whitespace-nowrap">{item.username}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.action === "create" ? "bg-green-100 text-green-700" : item.action === "update" ? "bg-blue-100 text-blue-700" : item.action === "kirim" ? "bg-purple-100 text-purple-700" : "bg-red-100 text-red-700"}`}>
                            {item.action === "create" ? <><Plus className="w-3 h-3" /> Input</> : item.action === "update" ? <><Pencil className="w-3 h-3" /> Edit</> : item.action === "kirim" ? <><Send className="w-3 h-3" /> Kirim</> : <><Trash2 className="w-3 h-3" /> Hapus</>}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-text-primary">{item.description}</td>
                        <td className="px-3 py-3 text-xs text-text-secondary">{item.detail || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
