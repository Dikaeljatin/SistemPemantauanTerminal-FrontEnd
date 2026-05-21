"use client";

import { Users, Plus, Search, Shield, User, Pencil, Trash2, X, Check } from "lucide-react";
import { useState, useEffect } from "react";

type Role = "Super Admin" | "Petugas" | "Pimpinan";
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
  "Super Admin": "bg-purple-100 text-purple-700",
  Petugas:       "bg-blue-100 text-blue-700",
  Pimpinan:      "bg-amber-100 text-amber-700",
};

const roles: Role[] = ["Super Admin", "Petugas", "Pimpinan"];

// ─── Modal Tambah / Edit ──────────────────────────────────────────────────────
interface ModalProps {
  user?: UserData;
  onSave: (data: Omit<UserData, "id">) => void;
  onClose: () => void;
}

function UserModal({ user, onSave, onClose }: ModalProps) {
  const [nama,   setNama]   = useState(user?.nama   ?? "");
  const [email,  setEmail]  = useState(user?.email  ?? "");
  const [role,   setRole]   = useState<Role>(user?.role   ?? "Petugas");
  const [status, setStatus] = useState<Status>(user?.status ?? "Aktif");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nama.trim())  e.nama  = "Nama wajib diisi";
    if (!email.trim()) e.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Format email tidak valid";
    return e;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({ nama, email, username: user?.username ?? nama.toLowerCase().replace(/\s+/g, ""), role, status });
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KelolaUserPage() {
  const [users, setUsers]           = useState<UserData[]>([]);
  const [search, setSearch]         = useState("");
  const [showAdd, setShowAdd]       = useState(false);
  const [editUser, setEditUser]     = useState<UserData | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null);
  const [pendingEdit, setPendingEdit] = useState<Omit<UserData, "id"> | null>(null);

  // Fetch users dari API
  useEffect(() => {
    fetch("http://localhost:5000/api/users")
      .then((res) => res.json())
      .then((json) => {
        const rows: UserData[] = (json.data || []).map((u: any) => ({
          id: u.user_id,
          nama: u.nama || "",
          email: u.email || "",
          username: u.username || "",
          role: (u.role === "super_admin" ? "Super Admin" : u.role === "petugas" ? "Petugas" : "Pimpinan") as Role,
          status: (u.status === "nonaktif" ? "Nonaktif" : "Aktif") as Status,
        }));
        setUsers(rows);
      })
      .catch((err) => console.error("Gagal fetch users:", err));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (data: Omit<UserData, "id">) => {
    try {
      const res = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: data.nama, email: data.email, username: data.username, password: data.username + "123", role: data.role === "Super Admin" ? "super_admin" : data.role.toLowerCase() }),
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
      await fetch(`http://localhost:5000/api/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: pendingEdit.nama, email: pendingEdit.email, username: pendingEdit.username, role: pendingEdit.role === "Super Admin" ? "super_admin" : pendingEdit.role.toLowerCase(), status: pendingEdit.status.toLowerCase() }),
      });
      setUsers(users.map((u) => (u.id === editUser.id ? { ...u, ...pendingEdit } : u)));
    } catch (err) { console.error(err); }
    setEditUser(null);
    setPendingEdit(null);
  };

  const handleDelete = async () => {
    try {
      await fetch(`http://localhost:5000/api/users/${deleteUser!.id}`, { method: "DELETE" });
      setUsers(users.filter((u) => u.id !== deleteUser!.id));
    } catch (err) { console.error(err); }
    setDeleteUser(null);
  };

  const totalAdmin    = users.filter((u) => u.role === "Super Admin").length;
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
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <User className="w-6 h-6 text-sidebar mb-3" />
            <p className="text-3xl font-bold text-text-primary">{users.length}</p>
            <p className="text-sm text-text-secondary mt-1">Total User</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <Shield className="w-6 h-6 text-purple-500 mb-3" />
            <p className="text-3xl font-bold text-text-primary">{totalAdmin}</p>
            <p className="text-sm text-text-secondary mt-1">Super Admin</p>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-2.5 w-80">
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
              className="flex items-center gap-2 bg-sidebar hover:bg-sidebar-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah User
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
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
        </div>
      </div>
    </>
  );
}
