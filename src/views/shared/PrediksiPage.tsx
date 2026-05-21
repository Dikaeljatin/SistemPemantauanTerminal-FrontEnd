"use client";

import { useState } from "react";
import {
  Brain, CarFront, ArrowDownLeft, ArrowUpRight, Clock, Users, CalendarDays, Search, TrendingUp, Info,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";

interface PredictionRow {
  jam: string;
  masuk: number;
  keluar: number;
  penumpang: number;
}

interface PerDayRow {
  tanggal: string;
  tanggal_full: string;
  masuk: number;
  keluar: number;
  penumpang: number;
}

interface PredictionSummary {
  total_masuk: number;
  total_keluar: number;
  total_penumpang: number;
  jam_tersibuk_masuk: string;
  jam_tersibuk_keluar: string;
  num_days: number;
}

interface AccuracyInfo {
  masuk_mape: number | null;
  keluar_mape: number | null;
  penumpang_mape: number | null;
  avg_mape: number | null;
  overall_accuracy: number | null;
  cv_mape: number | null;
  evaluation_method: string;
}

interface MetaInfo {
  training_data_points: number;
  used_holidays: boolean;
  method: string;
  best_params?: Record<string, number>;
}

export default function PrediksiPage() {
  const today = new Date().toISOString().split("T")[0];
  const [tanggalMulai, setTanggalMulai] = useState(today);
  const [tanggalAkhir, setTanggalAkhir] = useState(today);
  const [isLoading, setIsLoading] = useState(false);
  const [errorRange, setErrorRange] = useState("");
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [perDay, setPerDay] = useState<PerDayRow[]>([]);
  const [summary, setSummary] = useState<PredictionSummary | null>(null);
  const [accuracy, setAccuracy] = useState<AccuracyInfo | null>(null);
  const [meta, setMeta] = useState<MetaInfo | null>(null);
  const [hasPredict, setHasPredict] = useState(false);

  const handlePrediksi = async () => {
    if (!tanggalMulai || !tanggalAkhir) {
      setErrorRange("Pilih tanggal mulai dan tanggal akhir terlebih dahulu.");
      return;
    }
    if (tanggalAkhir < tanggalMulai) {
      setErrorRange("Tanggal akhir tidak boleh sebelum tanggal mulai.");
      return;
    }
    setErrorRange("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/prediksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal_mulai: tanggalMulai, tanggal_akhir: tanggalAkhir }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorRange(json.error || "Gagal melakukan prediksi");
        setIsLoading(false);
        return;
      }
      setPredictions(json.predictions || []);
      setPerDay(json.per_day || []);
      setSummary(json.summary || null);
      setAccuracy(json.accuracy || null);
      setMeta(json.meta || null);
      setHasPredict(true);
    } catch (err) {
      setErrorRange("Gagal terhubung ke server. Pastikan backend berjalan.");
    }
    setIsLoading(false);
  };

  const bulanList = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const formatTgl = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${parseInt(d, 10)} ${bulanList[parseInt(m, 10) - 1]} ${y}`;
  };

  const totalKendaraan = (summary?.total_masuk || 0) + (summary?.total_keluar || 0);

  const stats = [
    { label: "TOTAL SELURUH KENDARAAN", value: hasPredict ? String(totalKendaraan) : "0", icon: CarFront, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "TOTAL KENDARAAN KEDATANGAN", value: hasPredict ? String(summary?.total_masuk || 0) : "0", icon: ArrowDownLeft, color: "text-green-600", bg: "bg-green-50" },
    { label: "TOTAL KENDARAAN KEBERANGKATAN", value: hasPredict ? String(summary?.total_keluar || 0) : "0", icon: ArrowUpRight, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "JAM TERSIBUK KEDATANGAN", value: hasPredict ? (summary?.jam_tersibuk_masuk || "-") : "-", icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "JAM TERSIBUK KEBERANGKATAN", value: hasPredict ? (summary?.jam_tersibuk_keluar || "-") : "-", icon: Clock, color: "text-red-600", bg: "bg-red-50" },
    { label: "JUMLAH PENUMPANG", value: hasPredict ? String(summary?.total_penumpang || 0) : "0", icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center gap-4 shadow-lg">
        <Brain className="w-8 h-8 text-white" />
        <div>
          <h2 className="text-white font-bold text-xl tracking-wide">PREDIKSI</h2>
          <p className="text-white/60 text-sm mt-0.5">Prediksi pergerakan kendaraan menggunakan metode Prophet</p>
        </div>
      </div>

      {/* Filter Bar - Range Tanggal + Tombol Prediksi */}
      <div className="bg-white rounded-2xl p-5 shadow-md space-y-3">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Tanggal Mulai</label>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2.5">
              <CalendarDays className="w-4 h-4 text-text-secondary flex-shrink-0" />
              <input
                type="date"
                value={tanggalMulai}
                max={tanggalAkhir || undefined}
                onChange={(e) => {
                  setTanggalMulai(e.target.value);
                  setErrorRange("");
                  if (tanggalAkhir && e.target.value > tanggalAkhir) setTanggalAkhir(e.target.value);
                }}
                className="bg-transparent outline-none text-sm text-text-primary w-36 cursor-pointer"
              />
            </div>
          </div>

          <div className="pb-2.5"><span className="text-text-secondary font-semibold text-sm px-1">—</span></div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Tanggal Akhir</label>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2.5">
              <CalendarDays className="w-4 h-4 text-text-secondary flex-shrink-0" />
              <input
                type="date"
                value={tanggalAkhir}
                min={tanggalMulai || undefined}
                onChange={(e) => { setTanggalAkhir(e.target.value); setErrorRange(""); }}
                className="bg-transparent outline-none text-sm text-text-primary w-36 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handlePrediksi}
            disabled={isLoading}
            className="flex items-center gap-2 bg-sidebar hover:bg-sidebar-hover text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-all disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memuat...
              </>
            ) : (
              <><Search className="w-4 h-4" /> Prediksi</>
            )}
          </button>
        </div>

        {errorRange && <p className="text-red-500 text-xs font-medium">{errorRange}</p>}

        {tanggalMulai && tanggalAkhir && !errorRange && (
          <p className="text-sm text-text-secondary">
            Menampilkan prediksi dari{" "}
            <span className="font-semibold text-text-primary">{formatTgl(tanggalMulai)}</span>
            {" "}hingga{" "}
            <span className="font-semibold text-text-primary">{formatTgl(tanggalAkhir)}</span>
            {hasPredict && summary && (
              <span className="ml-2 text-text-secondary">({summary.num_days} hari)</span>
            )}
          </p>
        )}
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-5 shadow-md">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Accuracy & Meta Info */}
      {hasPredict && accuracy && meta && (
        <div className="bg-gradient-to-r from-sidebar/5 to-sidebar/10 border border-sidebar/20 rounded-2xl p-5 shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-sidebar/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-sidebar" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-text-primary text-sm">Informasi Akurasi Prediksi</h3>
                <Info className="w-4 h-4 text-text-secondary" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-text-secondary">Akurasi Keseluruhan</p>
                  <p className="text-xl font-bold text-sidebar">{accuracy.overall_accuracy !== null ? `${accuracy.overall_accuracy}%` : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">MAPE Kendaraan Kedatangan</p>
                  <p className="text-xl font-bold text-blue-600">{accuracy.masuk_mape !== null ? `${accuracy.masuk_mape}%` : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">MAPE Kendaraan Keberangkatan</p>
                  <p className="text-xl font-bold text-green-600">{accuracy.keluar_mape !== null ? `${accuracy.keluar_mape}%` : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">MAPE Penumpang</p>
                  <p className="text-xl font-bold text-amber-600">{accuracy.penumpang_mape !== null ? `${accuracy.penumpang_mape}%` : "-"}</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary mt-3">
                <span className="font-semibold text-text-primary">Metode:</span> {meta.method}
                {" • "}
                <span className="font-semibold text-text-primary">Data training:</span> {meta.training_data_points} hari
                {" • "}
                <span className="font-semibold text-text-primary">Hari libur:</span> {meta.used_holidays ? "Ya (Indonesia)" : "Tidak"}
                {accuracy.cv_mape !== null && (
                  <> {" • "}<span className="font-semibold text-text-primary">CV MAPE:</span> {accuracy.cv_mape}%</>
                )}
              </p>
              <p className="text-xs text-text-secondary mt-1 italic">
                MAPE dihitung dari <span className="font-semibold">honest hold-out</span> (data 14 hari terakhir tidak pernah dilihat saat tuning).
                MAPE rendah → akurasi tinggi. Akurasi = 100% - MAPE.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grafik Prediksi Kendaraan */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text-primary text-sm">Grafik Prediksi Kendaraan Kedatangan & Keberangkatan per Jam</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /><span className="text-xs text-text-secondary">Kedatangan</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /><span className="text-xs text-text-secondary">Keberangkatan</span></div>
          </div>
        </div>

        {!hasPredict ? (
          <div className="h-[320px] flex flex-col items-center justify-center text-text-secondary text-sm gap-2">
            <Brain className="w-10 h-10 text-text-secondary/50" />
            <p>Klik tombol "Prediksi" untuk menampilkan hasil prediksi</p>
          </div>
        ) : predictions.length === 0 ? (
          <div className="h-[320px] flex items-center justify-center text-text-secondary text-sm">Tidak ada data prediksi</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={predictions} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="jam" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", fontSize: "12px", padding: "10px 14px" }}
                  formatter={(value, name) => [`${value} kendaraan`, name === "masuk" ? "Kedatangan" : "Keberangkatan"]}
                />
                <Bar dataKey="masuk" fill="#60a5fa" radius={[4, 4, 0, 0]} name="masuk" />
                <Bar dataKey="keluar" fill="#f87171" radius={[4, 4, 0, 0]} name="keluar" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">Keterangan:</span>{" "}
                Grafik menampilkan prediksi rata-rata kendaraan kedatangan dan keberangkatan per jam berdasarkan data historis menggunakan metode Prophet (Meta).
                Puncak kedatangan: <span className="font-semibold text-text-primary">{summary?.jam_tersibuk_masuk}</span>,
                puncak keberangkatan: <span className="font-semibold text-text-primary">{summary?.jam_tersibuk_keluar}</span>.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Grafik Prediksi Jumlah Penumpang */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text-primary text-sm">Grafik Prediksi Jumlah Penumpang per Jam</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            <span className="text-xs text-text-secondary">Penumpang</span>
          </div>
        </div>

        {!hasPredict ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-text-secondary text-sm gap-2">
            <Users className="w-10 h-10 text-text-secondary/50" />
            <p>Klik tombol "Prediksi" untuk menampilkan hasil prediksi penumpang</p>
          </div>
        ) : predictions.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-text-secondary text-sm">Tidak ada data prediksi</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={predictions} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="jam" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", fontSize: "12px", padding: "10px 14px" }}
                  formatter={(value) => [`${value} penumpang`, "Jumlah"]}
                />
                <Bar dataKey="penumpang" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">Keterangan:</span>{" "}
                Grafik menampilkan prediksi rata-rata jumlah penumpang per jam menggunakan metode Prophet.
                Total penumpang yang diprediksi: <span className="font-semibold text-text-primary">{summary?.total_penumpang}</span> orang.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Grafik Prediksi per Hari (Line Chart) */}
      {hasPredict && perDay.length > 1 && (
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-primary text-sm">Tren Prediksi per Hari</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /><span className="text-xs text-text-secondary">Kedatangan</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /><span className="text-xs text-text-secondary">Keberangkatan</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /><span className="text-xs text-text-secondary">Penumpang</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={perDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px", padding: "10px 14px" }} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
              <Line type="monotone" dataKey="masuk" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} name="Kedatangan" />
              <Line type="monotone" dataKey="keluar" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} name="Keberangkatan" />
              <Line type="monotone" dataKey="penumpang" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} name="Penumpang" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Keterangan:</span>{" "}
              Tren prediksi total kendaraan kedatangan, keberangkatan, dan penumpang per hari pada periode yang dipilih.
              Prediksi mempertimbangkan hari libur Indonesia dan pola weekly seasonality dari data 12 bulan terakhir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
