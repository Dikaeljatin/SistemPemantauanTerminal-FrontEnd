"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, ClipboardList, Table2, FileText, BarChart3, Brain, LogOut, Globe, CarFront, UserCircle, Menu, X } from "lucide-react";
import PetugasDashboardPage from "../views/petugas/PetugasDashboardPage";
import IsiDataKendaraanPage from "../views/petugas/IsiDataKendaraanPage";
import PetugasDataKendaraanPage from "../views/petugas/PetugasDataKendaraanPage";
import LaporanPage from "../views/petugas/LaporanPage";
import DashboardPage from "../views/DashboardPage";
import AnalisisPage from "../views/AnalisisPage";
import PrediksiPage from "../views/PrediksiPage";
import LogoutConfirmModal from "./LogoutConfirmModal";

type PetugasMenu = "dashboard" | "isi-data" | "data-kendaraan" | "analisis" | "prediksi" | "laporan";

const menuItems: { id: PetugasMenu; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard",       label: "DASHBOARD",          icon: LayoutDashboard },
  { id: "isi-data",        label: "ISI DATA KENDARAAN", icon: ClipboardList   },
  { id: "data-kendaraan",  label: "DATA KENDARAAN",     icon: Table2          },
  { id: "analisis",        label: "ANALISIS",           icon: BarChart3       },
  { id: "prediksi",        label: "PREDIKSI",           icon: Brain           },
  { id: "laporan",         label: "LAPORAN",            icon: FileText        },
];

interface PetugasLayoutProps {
  onLogout: () => void;
  onMenuChange?: (menu: string) => void;
  userName?: string;
}

export default function PetugasLayout({ onLogout, onMenuChange, userName }: PetugasLayoutProps) {
  const [activeMenu, setActiveMenu] = useState<PetugasMenu>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("petugas_menu");
      if (saved && menuItems.some((m) => m.id === saved)) return saved as PetugasMenu;
    }
    return "dashboard";
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Persist active menu + notify parent for URL update
  useEffect(() => {
    sessionStorage.setItem("petugas_menu", activeMenu);
    onMenuChange?.(activeMenu);
  }, [activeMenu, onMenuChange]);

  const renderPage = () => {
    switch (activeMenu) {
      case "dashboard":
        return <DashboardPage />;
      case "isi-data":
        return <IsiDataKendaraanPage userName={userName} />;
      case "data-kendaraan":
        return <PetugasDataKendaraanPage />;
      case "analisis":
        return <AnalisisPage />;
      case "prediksi":
        return <PrediksiPage />;
      case "laporan":
        return <LaporanPage />;
      default:
        return null;
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

        {/* Menu */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
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
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-accent" : "text-white/70"}`} />
                <span className="leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 pb-8">
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full flex items-center justify-center gap-2 bg-white text-sidebar font-bold py-3 px-6 rounded-full hover:bg-gray-100 transition-colors"
          >
            <span>KELUAR</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main content */}
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
            <span className="font-bold text-text-primary text-sm tracking-wide">PETUGAS</span>
            <div className="w-10 h-10 rounded-full border-2 border-text-primary flex items-center justify-center">
              <UserCircle className="w-7 h-7 text-text-primary" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 md:px-8 pb-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
