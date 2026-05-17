"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, CarFront, Inbox, LogOut, Globe, UserCircle, Crown, Menu, X } from "lucide-react";
import PimpinanDashboardPage from "../views/pimpinan/PimpinanDashboardPage";
import PimpinanDataKendaraanPage from "../views/pimpinan/PimpinanDataKendaraanPage";
import LaporanMasukPage from "../views/pimpinan/LaporanMasukPage";
import LogoutConfirmModal from "./LogoutConfirmModal";

type PimpinanMenu = "dashboard" | "data-kendaraan" | "laporan-masuk";

const menuItems: { id: PimpinanMenu; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard",       label: "DASHBOARD",      icon: LayoutDashboard },
  { id: "data-kendaraan",  label: "DATA KENDARAAN", icon: CarFront        },
  { id: "laporan-masuk",   label: "LAPORAN MASUK",  icon: Inbox           },
];

interface PimpinanLayoutProps {
  onLogout: () => void;
}

export default function PimpinanLayout({ onLogout }: PimpinanLayoutProps) {
  const [activeMenu, setActiveMenu] = useState<PimpinanMenu>("dashboard");
  const [showConfirm, setShowConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Fetch jumlah laporan belum dibaca dari API
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("http://localhost:5000/api/laporan")
      .then((res) => res.json())
      .then((json) => {
        const count = (json.data || []).filter((l: any) => l.status === "belum-dibaca").length;
        setUnreadCount(count);
      })
      .catch(() => setUnreadCount(0));
  }, [activeMenu]); // Re-fetch saat pindah menu (misal setelah baca laporan)

  const renderPage = () => {
    switch (activeMenu) {
      case "dashboard":      return <PimpinanDashboardPage />;
      case "data-kendaraan": return <PimpinanDataKendaraanPage />;
      case "laporan-masuk":  return <LaporanMasukPage />;
      default:               return <PimpinanDashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {showConfirm && (
        <LogoutConfirmModal
          onConfirm={() => { setShowConfirm(false); onLogout(); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Overlay - mobile only */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-sidebar min-h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}>
        {/* Close button - mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 w-8 h-8 text-white/80 hover:text-white flex items-center justify-center"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center py-8">
          <div className="relative">
            <Globe className="w-20 h-20 text-accent" strokeWidth={1.5} />
            <div className="absolute bottom-1 right-1 bg-sidebar rounded-full p-0.5">
              <CarFront className="w-6 h-6 text-accent" />
            </div>
          </div>
        </div>

        {/* Role Badge */}
        <div className="mx-4 mb-4 flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
          <Crown className="w-4 h-4 text-accent flex-shrink-0" />
          <span className="text-accent text-xs font-bold tracking-widest uppercase">Pimpinan</span>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-semibold tracking-wide text-left ${
                  isActive
                    ? "bg-white/10 text-accent"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Icon className={`w-5 h-5 ${isActive ? "text-accent" : "text-white/70"}`} />
                  {item.id === "laporan-masuk" && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span className="leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 pb-8 mt-4">
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full flex items-center justify-center gap-2 bg-white text-sidebar font-bold py-3 px-6 rounded-full hover:bg-gray-100 transition-colors"
          >
            <span>KELUAR</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-0 md:ml-64 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-bg">
          {/* Hamburger button - mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-10 h-10 bg-sidebar text-white rounded-lg flex items-center justify-center shadow-lg"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right">
              <p className="font-bold text-text-primary text-sm tracking-wide">PIMPINAN</p>
              <p className="text-xs text-text-secondary">Terminal ABDYA</p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-text-primary flex items-center justify-center">
              <UserCircle className="w-7 h-7 text-text-primary" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="px-4 md:px-8 pb-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
