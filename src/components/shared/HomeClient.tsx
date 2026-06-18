"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "../LandingPage";

export default function HomeClient() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const role = sessionStorage.getItem("app_role");
    if (role) {
      switch (role) {
        case "petugas": router.replace("/petugas/dashboard"); return;
        case "pimpinan": router.replace("/pimpinan/dashboard"); return;
        case "super_admin": router.replace("/super-admin/dashboard"); return;
      }
    }
    setChecked(true);
  }, [router]);

  if (!checked) return null;

  return <LandingPage onGoToLogin={() => router.push("/login")} />;
}
