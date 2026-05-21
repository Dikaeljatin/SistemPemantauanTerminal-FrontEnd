"use client";

import { LayoutDashboard, CarFront, BarChart3, Brain, Users, LogOut, Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import LogoutConfirmModal from "./LogoutConfirmModal";

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  onLogout?: () => void;
}

const menuItems = [
  { id: "dashboard", label: "DASHBOARD", icon: LayoutDashboard },
  { id: "data-kendaraan", label: "DATA KENDARAAN", icon: CarFront },
  { id: "analisis", label: "ANALISIS", icon: BarChart3 },
  { id: "prediksi", label: "PREDIKSI", icon: Brain },
  { id: "kelola-user", label: "KELOLA USER", icon: Users },
];

export default function Sidebar({ activeMenu, onMenuChange, onLogout }: SidebarProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {showConfirm && (
        <LogoutConfirmModal
          onConfirm={() => { setShowConfirm(false); onLogout?.(); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Hamburger button - mobile only */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-sidebar text-white rounded-lg flex items-center justify-center shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

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
                onClick={() => { onMenuChange(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-semibold tracking-wide ${
                  isActive
                    ? "bg-white/10 text-accent"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-accent" : "text-white/70"}`} />
                <span>{item.label}</span>
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
    </>
  );
}
