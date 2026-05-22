"use client";

import { useState } from "react";
import { X, User, Mail, Lock, Eye, EyeOff, Check } from "lucide-react";

interface EditProfileModalProps {
  userId: number;
  currentNama: string;
  currentEmail: string;
  currentUsername: string;
  role: string;
  onClose: () => void;
  onSaved: (nama: string) => void;
}

export default function EditProfileModal({
  userId, currentNama, currentEmail, currentUsername, role, onClose, onSaved,
}: EditProfileModalProps) {
  const [nama, setNama] = useState(currentNama);
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError("");

    if (!nama.trim()) {
      setError("Nama tidak boleh kosong");
      return;
    }

    if (password && password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (password && password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    setIsLoading(true);
    try {
      const body: Record<string, string> = {
        nama: nama.trim(),
        email: email.trim(),
        username: currentUsername,
        role,
        status: "aktif",
      };
      if (password) {
        body.password = password;
      }

      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Gagal menyimpan perubahan");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      onSaved(nama.trim());
      setTimeout(() => onClose(), 1500);
    } catch {
      setError("Gagal terhubung ke server");
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-text-primary text-lg">Edit Profil</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-text-primary font-semibold">Profil berhasil diperbarui!</p>
          </div>
        ) : (
          <>
            {/* Form */}
            <div className="space-y-4">
              {/* Nama */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Opsional"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-text-secondary mb-3">Kosongkan jika tidak ingin mengubah password</p>
              </div>

              {/* Password Baru */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password */}
              {password && (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Konfirmasi Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-red-500 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 border border-gray-200 text-text-secondary font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                Batal
              </button>
              <button onClick={handleSave} disabled={isLoading} className="flex-1 bg-sidebar hover:bg-sidebar-hover text-white font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60">
                {isLoading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
