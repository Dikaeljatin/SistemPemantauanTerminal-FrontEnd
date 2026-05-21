"use client";
import IsiDataKendaraanPage from "../../../../views/petugas/IsiDataKendaraanPage";
export default function IsiDataRoute() {
  const userName = typeof window !== "undefined" ? sessionStorage.getItem("app_username") || "" : "";
  return <IsiDataKendaraanPage userName={userName} />;
}
