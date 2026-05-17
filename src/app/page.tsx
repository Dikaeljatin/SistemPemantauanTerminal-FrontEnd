"use client";

import { useState } from "react";
import LandingPage from "../components/LandingPage";
import LoginPage from "../components/LoginPage";
import type { UserRole } from "../components/LoginPage";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import PetugasLayout from "../components/PetugasLayout";
import PimpinanLayout from "../components/PimpinanLayout";
import DashboardPage from "../views/DashboardPage";
import DataKendaraanPage from "../views/DataKendaraanPage";
import AnalisisPage from "../views/AnalisisPage";
import PrediksiPage from "../views/PrediksiPage";
import KelolaUserPage from "../views/KelolaUserPage";

export default function Home() {
  const [view, setView] = useState<"landing" | "login" | "dashboard">("landing");
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [userRole, setUserRole] = useState<UserRole>("petugas");

  const handleGoToLogin = () => setView("login");

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setView("dashboard");
  };

  const handleLogout = () => {
    setView("landing");
    setActiveMenu("dashboard");
  };

  if (view === "landing") {
    return <LandingPage onGoToLogin={handleGoToLogin} />;
  }

  if (view === "login") {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Petugas gets its own dedicated layout
  if (userRole === "petugas") {
    return <PetugasLayout onLogout={handleLogout} />;
  }

  // Pimpinan gets its own dedicated layout
  if (userRole === "pimpinan") {
    return <PimpinanLayout onLogout={handleLogout} />;
  }

  // Admin / Pimpinan — full dashboard
  const renderPage = () => {
    switch (activeMenu) {
      case "dashboard":      return <DashboardPage />;
      case "data-kendaraan": return <DataKendaraanPage />;
      case "analisis":       return <AnalisisPage />;
      case "prediksi":       return <PrediksiPage />;
      case "kelola-user":    return <KelolaUserPage />;
      default:               return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} onLogout={handleLogout} />
      <div className="flex-1 ml-0 md:ml-64">
        <Header onLogout={handleLogout} />
        <main className="px-4 md:px-8 pb-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
