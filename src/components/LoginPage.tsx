"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, CarFront, Eye, EyeOff, Lock, Users, ShieldCheck, Briefcase, Crown, ChevronDown, Check, ArrowLeft } from "lucide-react";

export type UserRole = "super_admin" | "petugas" | "pimpinan";

interface LoginPageProps {
  onLogin: (role: UserRole, username: string) => void;
  onBack?: () => void;
}

const roles: { value: UserRole; label: string; icon: React.ReactNode }[] = [
  { value: "super_admin", label: "Super Admin", icon: <ShieldCheck className="w-4 h-4" /> },
  { value: "petugas",     label: "Petugas",     icon: <Briefcase   className="w-4 h-4" /> },
  { value: "pimpinan",    label: "Pimpinan",    icon: <Crown       className="w-4 h-4" /> },
];

export default function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("super_admin");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeRole = roles.find((r) => r.value === selectedRole)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi");
      return;
    }

    setIsLoading(true);

    // Login via API
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal");
        setIsLoading(false);
        return;
      }

      // Validasi: pastikan role yang dipilih sesuai dengan role akun
      const actualRole = data.user.role as UserRole;
      if (actualRole !== selectedRole) {
        const roleLabel = roles.find((r) => r.value === actualRole)?.label || actualRole;
        setError(`Akun ini terdaftar sebagai ${roleLabel}, bukan ${activeRole.label}. Silakan pilih role yang sesuai.`);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onLogin(actualRole, data.user.username || data.user.nama || username.trim());
    } catch (err) {
      setError("Gagal terhubung ke server");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar relative overflow-hidden">
      {/* Back Button - pojok kiri atas */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/70 hover:text-white text-base font-semibold transition-colors bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali
        </button>
      )}

      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <Globe className="w-24 h-24 text-accent" strokeWidth={1.2} />
            <div className="absolute bottom-1 right-1 bg-sidebar rounded-full p-1">
              <CarFront className="w-8 h-8 text-accent" />
            </div>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-wider text-center">
            SISTEM MONITORING TERMINAL ABDYA
          </h1>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white text-lg font-semibold text-center mb-6">
            Masuk ke Akun Anda
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selector */}
            <div>
              <label className="block text-white/70 text-xs font-medium uppercase tracking-wider mb-2">
                Login Sebagai
              </label>
              <div className="relative" ref={dropdownRef}>
                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="w-full bg-white/10 border border-white/15 rounded-xl pl-10 pr-10 py-3 text-white text-sm text-left outline-none focus:border-accent/50 focus:bg-white/15 transition-all flex items-center gap-2"
                >
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
                    <Users className="w-4 h-4" />
                  </span>
                  <span className="flex items-center gap-2 text-white">
                    <span className="text-accent">{activeRole.icon}</span>
                    {activeRole.label}
                  </span>
                  <ChevronDown
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown list */}
                {dropdownOpen && (
                  <div className="absolute z-50 mt-1.5 w-full bg-sidebar border border-white/15 rounded-xl shadow-2xl overflow-hidden">
                    {roles.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role.value);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          selectedRole === role.value
                            ? "bg-accent/15 text-accent"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>{role.icon}</span>
                        <span className="flex-1 text-left font-medium">{role.label}</span>
                        {selectedRole === role.value && (
                          <Check className="w-4 h-4 text-accent" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-white/70 text-xs font-medium uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full bg-white/10 border border-white/15 rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder:text-white/30 outline-none focus:border-accent/50 focus:bg-white/15 transition-all [&:-webkit-autofill]:bg-white/10 [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/70 text-xs font-medium uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full bg-white/10 border border-white/15 rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder:text-white/30 outline-none focus:border-accent/50 focus:bg-white/15 transition-all [&:-webkit-autofill]:bg-white/10 [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-accent focus:ring-accent/50"
                />
                <span className="text-white/50 text-xs">Ingat saya</span>
              </label>
              <button
                type="button"
                className="text-accent text-xs hover:text-accent-hover transition-colors"
              >
                Lupa password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent-hover text-sidebar font-bold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memuat...
                </>
              ) : (
                "MASUK"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-8">
          &copy; 2026 Dashboard Manajemen Kendaraan. All rights reserved.
        </p>
      </div>
    </div>
  );
}
