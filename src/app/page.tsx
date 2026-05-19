"use client";

import { useState, useEffect, useCallback } from "react";
import LandingPage from "../components/LandingPage";
import LoginPage from "../components/LoginPage";
import type { UserRole } from "../components/LoginPage";
import PetugasLayout from "../components/PetugasLayout";
import PimpinanLayout from "../components/PimpinanLayout";
import SuperAdminLayout from "../components/SuperAdminLayout";

function getHashRoute(): { view: string; role: string; menu: string } {
  if (typeof window === "undefined") return { view: "", role: "", menu: "" };
  const hash = window.location.hash.replace("#", "");
  const parts = hash.split("/");
  return { view: parts[0] || "", role: parts[1] || "", menu: parts[2] || "" };
}

export default function Home() {
  const [view, setView] = useState<"landing" | "login" | "dashboard">("landing");
  const [userRole, setUserRole] = useState<UserRole>("petugas");
  const [userName, setUserName] = useState("");
  const [isReady, setIsReady] = useState(false);

  // Restore from URL hash or sessionStorage on mount
  useEffect(() => {
    const hash = getHashRoute();

    // Try URL hash first
    if (hash.view === "dashboard" && (hash.role === "petugas" || hash.role === "pimpinan" || hash.role === "super_admin")) {
      setView("dashboard");
      setUserRole(hash.role as UserRole);
      if (hash.menu) {
        sessionStorage.setItem(`${hash.role === "super_admin" ? "superadmin" : hash.role}_menu`, hash.menu);
      }
    } else if (hash.view === "login") {
      setView("login");
    } else {
      // Fallback to sessionStorage
      const savedView = sessionStorage.getItem("app_view");
      const savedRole = sessionStorage.getItem("app_role");
      if (savedView === "dashboard" || savedView === "login") {
        setView(savedView);
      }
      if (savedRole === "petugas" || savedRole === "pimpinan" || savedRole === "super_admin") {
        setUserRole(savedRole);
      }
      const savedName = sessionStorage.getItem("app_username");
      if (savedName) setUserName(savedName);
    }
    setIsReady(true);
  }, []);

  // Update URL hash when view/role changes
  const updateHash = useCallback((v: string, r: string, menu?: string) => {
    if (v === "landing") {
      window.history.replaceState(null, "", window.location.pathname);
    } else if (v === "login") {
      window.history.replaceState(null, "", "#login");
    } else if (v === "dashboard") {
      const menuPart = menu || sessionStorage.getItem(`${r === "super_admin" ? "superadmin" : r}_menu`) || "dashboard";
      window.history.replaceState(null, "", `#dashboard/${r}/${menuPart}`);
    }
  }, []);

  // Persist state to sessionStorage + update URL
  useEffect(() => {
    if (isReady) {
      sessionStorage.setItem("app_view", view);
      updateHash(view, userRole);
    }
  }, [view, isReady, userRole, updateHash]);

  useEffect(() => {
    if (isReady) {
      sessionStorage.setItem("app_role", userRole);
    }
  }, [userRole, isReady]);

  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = getHashRoute();
      if (hash.view === "dashboard" && (hash.role === "petugas" || hash.role === "pimpinan" || hash.role === "super_admin")) {
        setView("dashboard");
        setUserRole(hash.role as UserRole);
        if (hash.menu) {
          sessionStorage.setItem(`${hash.role === "super_admin" ? "superadmin" : hash.role}_menu`, hash.menu);
        }
      } else if (hash.view === "login") {
        setView("login");
      } else {
        setView("landing");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleGoToLogin = () => setView("login");

  const handleLogin = (role: UserRole, username: string) => {
    setUserRole(role);
    setUserName(username);
    sessionStorage.setItem("app_username", username);
    setView("dashboard");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("app_view");
    sessionStorage.removeItem("app_role");
    sessionStorage.removeItem("app_username");
    sessionStorage.removeItem("petugas_menu");
    sessionStorage.removeItem("pimpinan_menu");
    sessionStorage.removeItem("superadmin_menu");
    setView("landing");
  };

  // Callback for layouts to update URL when menu changes
  const handleMenuChange = useCallback((menu: string) => {
    updateHash("dashboard", userRole, menu);
  }, [updateHash, userRole]);

  // Show nothing until client-side session is restored (prevents hydration mismatch)
  if (!isReady) {
    return null;
  }

  if (view === "landing") {
    return <LandingPage onGoToLogin={handleGoToLogin} />;
  }

  if (view === "login") {
    return <LoginPage onLogin={handleLogin} onBack={() => setView("landing")} />;
  }

  if (userRole === "petugas") {
    return <PetugasLayout onLogout={handleLogout} onMenuChange={handleMenuChange} userName={userName} />;
  }

  if (userRole === "pimpinan") {
    return <PimpinanLayout onLogout={handleLogout} onMenuChange={handleMenuChange} />;
  }

  if (userRole === "super_admin") {
    return <SuperAdminLayout onLogout={handleLogout} onMenuChange={handleMenuChange} />;
  }

  return <PetugasLayout onLogout={handleLogout} onMenuChange={handleMenuChange} userName={userName} />;
}
