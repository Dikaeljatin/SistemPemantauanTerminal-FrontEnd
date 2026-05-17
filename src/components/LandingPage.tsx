"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  Globe, CarFront, LogIn, Bus, Users, MapPin, Clock, ArrowRight, ShieldCheck,
} from "lucide-react";

interface LandingPageProps {
  onGoToLogin: () => void;
}

interface DataRow {
  id: number; timestamp: string; status: string; tnkb: string; jenis: string;
  penumpang: number; trayekAsal: string; trayekTujuan: string; perusahaan: string;
  hour: number;
}

const barColors = ["#60a5fa", "#4ade80", "#fbbf24", "#f87171", "#a78bfa", "#34d399"];

export default function LandingPage({ onGoToLogin }: LandingPageProps) {
  const [allData, setAllData] = useState<DataRow[]>([]);
  const [activeTab, setActiveTab] = useState<"kedatangan" | "keberangkatan">("kedatangan");

  useEffect(() => {
    const fetchData = () => {
      fetch("http://localhost:5000/api/pergerakan")
        .then((res) => res.json())
        .then((json) => {
          const rows: DataRow[] = (json.data || []).map((item: any, idx: number) => {
            let ts = "";
            let hour = 0;
            if (item.timestamp) {
              const raw = item.timestamp.replace("T", " ").replace("Z", "").split(".")[0];
              const [datePart, timePart] = raw.split(" ");
              const [yyyy, mm, dd] = datePart.split("-");
              const time = timePart ? timePart.slice(0, 5) : "00:00";
              ts = `${dd}/${mm}/${yyyy} ${time}`;
              hour = parseInt(time.split(":")[0]);
            }
            return {
              id: item.pergerakan_id ?? idx,
              timestamp: ts,
              status: item.status_pergerakan === "kedatangan" ? "Kedatangan" : "Keberangkatan",
              tnkb: item.tnkb || "",
              jenis: item.jenis_kendaraan || "",
              penumpang: item.jumlah_penumpang || 0,
              trayekAsal: item.trayek_asal || "",
              trayekTujuan: item.trayek_tujuan || "",
              perusahaan: item.nama_perusahaan || "",
              hour,
            };
          });
          setAllData(rows);
        })
        .catch(() => setAllData([]));
    };

    fetchData(); // Fetch pertama kali
    const interval = setInterval(fetchData, 5000); // Auto-refresh setiap 5 detik
    return () => clearInterval(interval);
  }, []);

  // Filter data hari ini saja
  const pad = (n: number) => String(n).padStart(2, "0");
  const now = new Date();
  const todayPrefix = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const todayData = allData.filter((d) => d.timestamp.startsWith(todayPrefix));

  // Stats
  const totalKendaraan = todayData.length;
  const totalPenumpang = todayData.reduce((s, d) => s + d.penumpang, 0);

  // Jam tersibuk
  const hourCount: Record<number, number> = {};
  todayData.forEach((d) => { hourCount[d.hour] = (hourCount[d.hour] || 0) + 1; });
  const busiestHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];
  const jamTersibuk = busiestHour ? `${pad(parseInt(busiestHour[0]))}:00` : "-";

  // Tujuan favorit
  const tujuanCount: Record<string, number> = {};
  todayData.forEach((d) => { if (d.trayekTujuan) tujuanCount[d.trayekTujuan] = (tujuanCount[d.trayekTujuan] || 0) + 1; });
  const favTujuan = Object.entries(tujuanCount).sort((a, b) => b[1] - a[1])[0];
  const tujuanFavorit = favTujuan ? favTujuan[0] : "-";

  // Grafik kedatangan vs keberangkatan per jam
  const hourlyData: { jam: string; kedatangan: number; keberangkatan: number }[] = [];
  for (let h = 6; h <= 20; h++) {
    const kedatangan = todayData.filter((d) => d.hour === h && d.status === "Kedatangan").length;
    const keberangkatan = todayData.filter((d) => d.hour === h && d.status === "Keberangkatan").length;
    if (kedatangan > 0 || keberangkatan > 0) {
      hourlyData.push({ jam: `${pad(h)}:00`, kedatangan, keberangkatan });
    }
  }

  // Tabel data
  const tableData = todayData.filter((d) =>
    activeTab === "kedatangan" ? d.status === "Kedatangan" : d.status === "Keberangkatan"
  );

  const stats = [
    { label: "Total Kendaraan Hari Ini", value: String(totalKendaraan), icon: Bus, color: "bg-blue-500" },
    { label: "Total Penumpang", value: String(totalPenumpang), icon: Users, color: "bg-green-500" },
    { label: "Jam Tersibuk", value: jamTersibuk, icon: Clock, color: "bg-purple-500" },
    { label: "Tujuan Favorit", value: tujuanFavorit, icon: MapPin, color: "bg-amber-500" },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Navbar */}
      <nav className="bg-sidebar sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Globe className="w-10 h-10 text-accent" strokeWidth={1.5} />
              <div className="absolute bottom-0 right-0 bg-sidebar rounded-full p-0.5">
                <CarFront className="w-3.5 h-3.5 text-accent" />
              </div>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-wide">SISTEM MONITORING TERMINAL</h1>
              <p className="text-white/50 text-xs">Terminal Abdya</p>
            </div>
          </div>
          <button onClick={onGoToLogin} className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-sidebar font-bold px-5 py-2.5 rounded-full transition-all duration-200 text-sm">
            <LogIn className="w-4 h-4" /> Login
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-sidebar relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-16 relative z-10 text-center">
          <h2 className="text-white text-4xl md:text-5xl font-bold mb-4">
            Informasi Kendaraan <span className="text-accent">Terminal Abdya</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
            Pantau kedatangan dan keberangkatan kendaraan transportasi umum secara langsung.
          </p>
          <button onClick={() => document.getElementById("info")?.scrollIntoView({ behavior: "smooth" })} className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-sidebar font-bold px-6 py-3 rounded-full transition-all text-sm mx-auto">
            Lihat Informasi <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Stats Cards — selalu tampil */}
      <section id="info" className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl p-5 shadow-md flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Grafik Kendaraan Masuk & Keluar — selalu tampil */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 bg-sidebar rounded-full"></div>
          <div>
            <h3 className="text-text-primary text-xl font-bold">Grafik Kendaraan</h3>
            <p className="text-text-secondary text-sm">Kedatangan dan keberangkatan per jam</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md">
          {hourlyData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-text-secondary text-sm">Belum ada data kendaraan</div>
          ) : (
            <>
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /><span className="text-xs text-text-secondary">Kedatangan</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /><span className="text-xs text-text-secondary">Keberangkatan</span></div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hourlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="jam" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px", padding: "10px 14px" }} />
                  <Bar dataKey="kedatangan" name="Kedatangan" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="keberangkatan" name="Keberangkatan" fill="#4ade80" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </section>

      {/* Jadwal Terkini — selalu tampil */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 bg-sidebar rounded-full"></div>
          <div>
            <h3 className="text-text-primary text-xl font-bold">Jadwal Kendaraan</h3>
            <p className="text-text-secondary text-sm">Data kedatangan dan keberangkatan</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab("kedatangan")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === "kedatangan" ? "bg-sidebar text-white" : "bg-white text-text-secondary hover:bg-gray-100"}`}>Kedatangan</button>
          <button onClick={() => setActiveTab("keberangkatan")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === "keberangkatan" ? "bg-sidebar text-white" : "bg-white text-text-secondary hover:bg-gray-100"}`}>Keberangkatan</button>
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["No","Waktu","TNKB","Jenis","Penumpang","Trayek Asal","Trayek Tujuan","Perusahaan"].map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-text-secondary">Belum ada data</td></tr>
                ) : (
                  tableData.map((k, idx) => (
                    <tr key={k.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 text-sm text-text-secondary">{idx + 1}</td>
                      <td className="px-4 py-3.5 text-sm text-text-secondary">{k.timestamp}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-text-primary">{k.tnkb}</td>
                      <td className="px-4 py-3.5 text-sm text-text-secondary">{k.jenis}</td>
                      <td className="px-4 py-3.5 text-sm text-text-secondary text-center">{k.penumpang}</td>
                      <td className="px-4 py-3.5 text-sm text-text-secondary">{k.trayekAsal}</td>
                      <td className="px-4 py-3.5 text-sm text-text-secondary">{k.trayekTujuan}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-text-primary">{k.perusahaan}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-sidebar py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><ShieldCheck className="w-7 h-7 text-accent" /></div>
            <h4 className="text-white font-bold text-lg mb-2">Data Akurat</h4>
            <p className="text-white/50 text-sm">Data kendaraan diperbarui secara real-time dari petugas terminal.</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><Clock className="w-7 h-7 text-accent" /></div>
            <h4 className="text-white font-bold text-lg mb-2">Update Real-Time</h4>
            <p className="text-white/50 text-sm">Informasi kedatangan dan keberangkatan selalu terkini.</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><MapPin className="w-7 h-7 text-accent" /></div>
            <h4 className="text-white font-bold text-lg mb-2">Cakupan Luas</h4>
            <p className="text-white/50 text-sm">Mencakup berbagai trayek antar kota di Aceh.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-accent" />
            <span className="text-white/70 text-sm font-medium">Sistem Monitoring Terminal Abdya</span>
          </div>
          <p className="text-white/40 text-xs">&copy; 2026 Sistem Informasi Transportasi. All rights reserved.</p>
          <button onClick={onGoToLogin} className="text-accent text-sm hover:text-accent-hover transition-colors font-medium">Masuk sebagai Admin &rarr;</button>
        </div>
      </footer>
    </div>
  );
}
