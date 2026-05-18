"use client";

import { useState } from "react";
import LandingPage from "../components/LandingPage";
import LoginPage from "../components/LoginPage";
import type { UserRole } from "../components/LoginPage";
import PetugasLayout from "../components/PetugasLayout";
import PimpinanLayout from "../components/PimpinanLayout";
import SuperAdminLayout from "../components/SuperAdminLayout";

export default function Home() {
  const [view, setView] = useState<"landing" | "login" | "dashboard">("landing");
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

  // Super Admin gets its own dedicated layout
  if (userRole === "super_admin") {
    return <SuperAdminLayout onLogout={handleLogout} />;
  }

  // Fallback — should not reach here
  return <PetugasLayout onLogout={handleLogout} />;
}
