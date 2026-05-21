"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, Database, Settings, LogOut, Globe, CarFront, UserCircle, ShieldCheck, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import LogoutConfirmModal from "../../../components/layout/LogoutConfirmModal";

const menuItems = [
  { id: "dashboard",    label: "DASHBOARD",    icon: LayoutDashboard, href: "/super-admin/dashboard" },
  { id: "kelola-data",  label: "KELOLA DATA",  icon: Database,        href: "/super-admin/kelola-data" },
  { id: "kelola-user",  label: "KELOLA USER",  icon: Users,           href: "/super-admin/kelola-user" },
  { id: "konfigurasi",  label: "KONFIGURASI",  icon: Settings,        href: "/super-admin/konfigurasi" },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { sessionStorage.clear(); router.push("/"); };

  return (
    <div className="flex min-h-screen bg-bg">
      {showConfirm && <LogoutConfirmModal onConfirm={() => { setShowConfirm(false); handleLogout(); }} onCancel={() => setShowConfirm(false)} />}
      {sidebarOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />}

      <aside className={`${collapsed ? "w-20" : "w-64"} bg-sidebar min-h-screen flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-4 right-4 w-8 h-8 text-white/80 hover:text-white flex items-center justify-center"><X className="w-5 h-5" /></button>

        <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-sidebar border-2 border-bg rounded-full items-center justify-center text-white/80 hover:text-white hover:bg-sidebar-hover z-50 shadow-lg">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={`flex items-center justify-center ${collapsed ? "py-5" : "py-8"}`}>
          <div className="relative">
            <Globe className={`${collapsed ? "w-10 h-10" : "w-20 h-20"} text-accent transition-all`} strokeWidth={1.5} />
            {!collapsed && <div className="absolute bottom-1 right-1 bg-sidebar rounded-full p-0.5"><CarFront className="w-6 h-6 text-accent" /></div>}
          </div>
        </div>

        {!collapsed && (
          <div className="mx-4 mb-4 flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
            <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" />
            <span className="text-accent text-xs font-bold tracking-widest uppercase">Super Admin</span>
          </div>
        )}

        <nav className={`flex-1 ${collapsed ? "px-2" : "px-4"} space-y-2`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <button key={item.id} onClick={() => { router.push(item.href); setSidebarOpen(false); }} title={collapsed ? item.label : undefined} className={`w-full flex items-center ${collapsed ? "justify-center px-2" : "gap-4 px-4"} py-3 rounded-lg transition-all duration-200 text-sm font-semibold tracking-wide text-left ${isActive ? "bg-white/10 text-accent" : "text-white/80 hover:bg-white/5 hover:text-white"}`}>
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-accent" : "text-white/70"}`} />
                {!collapsed && <span className="leading-tight">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className={`${collapsed ? "px-2" : "px-4"} pb-8 mt-4`}>
          <button onClick={() => setShowConfirm(true)} className={`w-full flex items-center justify-center gap-2 bg-white text-sidebar font-bold py-3 ${collapsed ? "px-2" : "px-6"} rounded-full hover:bg-gray-100 transition-colors`}>
            {collapsed ? <LogOut className="w-4 h-4" /> : <><span>KELUAR</span><LogOut className="w-4 h-4" /></>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 ${collapsed ? "ml-0 md:ml-20" : "ml-0 md:ml-64"} flex flex-col transition-all duration-300`}>
        <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-bg">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden w-10 h-10 bg-sidebar text-white rounded-lg flex items-center justify-center shadow-lg"><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-3 ml-auto"><div className="text-right"><p className="font-bold text-text-primary text-sm tracking-wide">SUPER ADMIN</p><p className="text-xs text-text-secondary">Terminal ABDYA</p></div><div className="w-10 h-10 rounded-full border-2 border-text-primary flex items-center justify-center"><UserCircle className="w-7 h-7 text-text-primary" /></div></div>
        </header>
        <main className="px-4 md:px-8 pb-8">{children}</main>
      </div>
    </div>
  );
}
