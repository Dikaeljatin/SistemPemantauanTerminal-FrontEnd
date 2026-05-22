"use client";

import { Settings, Upload, Download, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

export default function KonfigurasiPage() {
  const [importEnabled, setImportEnabled] = useState(false);
  const [exportEnabled, setExportEnabled] = useState(false);
  const [prediksiEnabled, setPrediksiEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/konfigurasi")
      .then((res) => res.json())
      .then((json) => {
        const config = json.data || {};
        setImportEnabled(config.import_enabled === "true");
        setExportEnabled(config.export_enabled === "true");
        setPrediksiEnabled(config.prediksi_enabled !== "false"); // default aktif
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleConfig = async (key: string, value: boolean) => {
    try {
      await fetch("http://localhost:5000/api/konfigurasi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: value ? "true" : "false" }),
      });
    } catch (err) {
      console.error("Gagal update konfigurasi:", err);
    }
  };

  const handleImportToggle = () => {
    const newVal = !importEnabled;
    setImportEnabled(newVal);
    toggleConfig("import_enabled", newVal);
  };

  const handleExportToggle = () => {
    const newVal = !exportEnabled;
    setExportEnabled(newVal);
    toggleConfig("export_enabled", newVal);
  };

  const handlePrediksiToggle = () => {
    const newVal = !prediksiEnabled;
    setPrediksiEnabled(newVal);
    toggleConfig("prediksi_enabled", newVal);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-text-secondary">Memuat...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center gap-4 shadow-lg">
        <Settings className="w-8 h-8 text-white" />
        <div>
          <h2 className="text-white font-bold text-xl tracking-wide">KONFIGURASI</h2>
          <p className="text-white/60 text-sm mt-0.5">Atur fitur yang tersedia untuk petugas</p>
        </div>
      </div>

      {/* Konfigurasi Cards */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="font-bold text-text-primary text-base mb-5">Fitur Data Kendaraan Petugas</h3>

        <div className="space-y-4">
          {/* Import Toggle */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">Import Data</p>
                <p className="text-xs text-text-secondary mt-0.5">Petugas dapat mengimport data kendaraan dari file Excel/CSV</p>
              </div>
            </div>
            <button
              onClick={handleImportToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${importEnabled ? "bg-sidebar" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${importEnabled ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Export Toggle */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Download className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">Export Data</p>
                <p className="text-xs text-text-secondary mt-0.5">Petugas dapat mengexport data kendaraan ke file Excel/CSV</p>
              </div>
            </div>
            <button
              onClick={handleExportToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${exportEnabled ? "bg-sidebar" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${exportEnabled ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Prediksi Toggle */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">Fitur Prediksi</p>
                <p className="text-xs text-text-secondary mt-0.5">Petugas dapat mengakses fitur prediksi kendaraan & penumpang</p>
              </div>
            </div>
            <button
              onClick={handlePrediksiToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${prediksiEnabled ? "bg-sidebar" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${prediksiEnabled ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {/* Status Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">Status saat ini:</span>{" "}
            Import {importEnabled ? <span className="text-green-600 font-semibold">Aktif</span> : <span className="text-red-500 font-semibold">Nonaktif</span>}
            {" • "}
            Export {exportEnabled ? <span className="text-green-600 font-semibold">Aktif</span> : <span className="text-red-500 font-semibold">Nonaktif</span>}
            {" • "}
            Prediksi {prediksiEnabled ? <span className="text-green-600 font-semibold">Aktif</span> : <span className="text-red-500 font-semibold">Nonaktif</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
