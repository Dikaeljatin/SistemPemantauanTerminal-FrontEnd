"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Database, Settings, LogOut, Globe, CarFront, UserCircle, ShieldCheck, Menu, X } from "lucide-react";
import DashboardPage from "../views/DashboardPage";
import KelolaUserPage from "../views/KelolaUserPage";
import KelolaDataPage from "../views/KelolaDataPage";
import KonfigurasiPage from "../views/KonfigurasiPage";
import LogoutConfirmModal from "./LogoutConfirmModal";

type SuperAdminMenu = "dashboard" | "kelola-data" | "kelola-user" | "konfigurasi";

const menuItems: { id: SuperAdminMenu; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard",    label: "DASHBOARD",      icon: LayoutDashboard },
  { id: "kelola-data",  label: "KELOLA DATA",    icon: Database        },
  { id: "kelola-user",  label: "KELOLA USER",    icon: Users           },
  { id: "konfigurasi",  label: "KONFIGURASI",    icon: Settings        },
];

interface SuperAdminLayoutProps {
  onLogout: () => void;
  onMenuChange?: (menu: string) => void;
}

export default function SuperAdminLayout({ onLogout, onMenuChange }: SuperAdminLayoutProps) {
  const [activeMenu, setActiveMenu] = useState<SuperAdminMenu>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("superadmin_menu");
      if (saved && menuItems.some((m) => m.id === saved)) return saved as SuperAdminMenu;
    }
    return "dashboard";
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Persist active menu + notify parent for URL update
  useEffect(() => {
    sessionStorage.setItem("superadmin_menu", activeMenu);
    onMenuChange?.(activeMenu);
  }, [activeMenu, onMenuChange]);

  const renderPage = () => {
    switch (activeMenu) {
      case "dashboard":    return <DashboardPage />;
      case "kelola-data":  return <KelolaDataPage />;
      case "kelola-user":  return <KelolaUserPage />;
      case "konfigurasi":  return <KonfigurasiPage />;
      default:             return <DashboardPage />;
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

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`w-64 bg-sidebar min-h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-4 right-4 w-8 h-8 text-white/80 hover:text-white flex items-center justify-center"><X className="w-5 h-5" /></button>

        <div className="flex items-center justify-center py-8">
          <div className="relative">
            <Globe className="w-20 h-20 text-accent" strokeWidth={1.5} />
            <div className="absolute bottom-1 right-1 bg-sidebar rounded-full p-0.5">
              <CarFront className="w-6 h-6 text-accent" />
            </div>
          </div>
        </div>

        <div className="mx-4 mb-4 flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
          <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" />
          <span className="text-accent text-xs font-bold tracking-widest uppercase">Super Admin</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-semibold tracking-wide text-left ${isActive ? "bg-white/10 text-accent" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-accent" : "text-white/70"}`} />
                <span className="leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-8 mt-4">
          <button onClick={() => setShowConfirm(true)} className="w-full flex items-center justify-center gap-2 bg-white text-sidebar font-bold py-3 px-6 rounded-full hover:bg-gray-100 transition-colors">
            <span>KELUAR</span><LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-0 md:ml-64 flex flex-col">
        <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-bg">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden w-10 h-10 bg-sidebar text-white rounded-lg flex items-center justify-center shadow-lg"><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right">
              <p className="font-bold text-text-primary text-sm tracking-wide">SUPER ADMIN</p>
              <p className="text-xs text-text-secondary">Terminal ABDYA</p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-text-primary flex items-center justify-center">
              <UserCircle className="w-7 h-7 text-text-primary" />
            </div>
          </div>
        </header>
        <main className="px-4 md:px-8 pb-8">{renderPage()}</main>
      </div>
    </div>
  );
}
