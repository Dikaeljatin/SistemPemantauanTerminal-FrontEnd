"use client";

import { useRouter } from "next/navigation";
import LoginPage from "../../../components/LoginPage";
import type { UserRole } from "../../../components/LoginPage";

export default function LoginRoute() {
  const router = useRouter();

  const handleLogin = (role: UserRole, username: string) => {
    sessionStorage.setItem("app_view", "dashboard");
    sessionStorage.setItem("app_role", role);
    sessionStorage.setItem("app_username", username);

    switch (role) {
      case "petugas":
        router.push("/petugas/dashboard");
        break;
      case "pimpinan":
        router.push("/pimpinan/dashboard");
        break;
      case "super_admin":
        router.push("/super-admin/dashboard");
        break;
    }
  };

  return <LoginPage onLogin={handleLogin} onBack={() => router.push("/")} />;
}
