"use client";

import { useState, useEffect } from "react";
import { ClipboardList, ArrowLeft, ArrowRight, CheckCircle, ChevronDown } from "lucide-react";

// ─── options ──────────────────────────────────────────────────────────────────
const trayekOptions = ["Banda Aceh", "Meulaboh", "Tapaktuan", "Subulussalam", "Blangpidie"];

// Mapping jenis kendaraan → kapasitas (akan di-fetch dari API)
let kapasitasMap: Record<string, string> = {};
let jenisOptions: string[] = [];

type Mode = null | "kedatangan" | "keberangkatan";

// ─── shared form shape ────────────────────────────────────────────────────────
interface VehicleForm {
  timestamp: string;
  status: string;
  tnkb: string;
  jenis: string;
  kapasitas: string;
  penumpangDatang: string;
  penumpangBerangkat: string;
  trayekAsal: string;
  trayekTujuan: string;
  perusahaan: string;
}

const emptyForm: VehicleForm = {
  timestamp: "", status: "", tnkb: "", jenis: "",
  kapasitas: "", penumpangDatang: "", penumpangBerangkat: "",
  trayekAsal: "", trayekTujuan: "", perusahaan: "",
};

// ─── single input style ───────────────────────────────────────────────────────
const inputCls = (hasError: boolean) =>
  `w-full bg-white rounded-xl px-5 py-3 text-sm text-text-primary outline-none border transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 hover:border-gray-300"
  } shadow-sm`;

// ─── field wrapper ────────────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-text-primary">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs pl-1 mt-1">{error}</p>}
    </div>
  );
}

// ─── Custom Select Dropdown ───────────────────────────────────────────────────
function SelectField({
  label,
  error,
  value,
  onChange,
  options,
  placeholder = "Pilih...",
}: {
  label: string;
  error?: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Field label={label} error={error}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center justify-between bg-white rounded-xl px-5 py-3 text-sm text-left outline-none border transition-all shadow-sm ${
            error
              ? "border-red-400"
              : open
                ? "border-sidebar ring-2 ring-sidebar/10"
                : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className={value ? "text-text-primary" : "text-gray-400"}>
            {value || placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-52 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-5 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                  value === opt
                    ? "bg-sidebar text-white font-medium"
                    : "text-text-primary hover:bg-gray-50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}

// ─── generic form view ────────────────────────────────────────────────────────
function FormView({
  title,
  mode,
  onBack,
  userName,
}: {
  title: string;
  mode: "kedatangan" | "keberangkatan";
  onBack: () => void;
  userName?: string;
}) {
  // Timestamp otomatis saat form dibuka
  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const [form, setForm] = useState<VehicleForm>({
    ...emptyForm,
    status: mode === "kedatangan" ? "Kedatangan" : "Keberangkatan",
    timestamp: localNow,
  });
  const [errors, setErrors] = useState<Partial<VehicleForm>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showVerifikasi, setShowVerifikasi] = useState(false);

  const set = (k: keyof VehicleForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Max penumpang = kapasitas kendaraan yang dipilih, default 16
  const maxPenumpang = form.kapasitas ? parseInt(form.kapasitas) : 16;

  const validate = () => {
    const e: Partial<VehicleForm> = {};
    if (!form.timestamp)              e.timestamp          = "Wajib diisi";
    if (!form.tnkb.trim())            e.tnkb               = "Wajib diisi";
    if (!form.jenis)                  e.jenis              = "Wajib dipilih";
    if (mode === "kedatangan") {
      if (!form.penumpangDatang.trim()) e.penumpangDatang  = "Wajib diisi";
      else if (parseInt(form.penumpangDatang) > maxPenumpang) e.penumpangDatang = `Maksimal ${maxPenumpang} penumpang`;
    }
    if (mode === "keberangkatan") {
      if (!form.penumpangBerangkat.trim()) e.penumpangBerangkat = "Wajib diisi";
      else if (parseInt(form.penumpangBerangkat) > maxPenumpang) e.penumpangBerangkat = `Maksimal ${maxPenumpang} penumpang`;
    }
    if (!form.trayekAsal)             e.trayekAsal         = "Wajib dipilih";
    if (!form.trayekTujuan)           e.trayekTujuan       = "Wajib dipilih";
    if (form.trayekAsal && form.trayekTujuan && form.trayekAsal === form.trayekTujuan)
                                      e.trayekTujuan       = "Trayek tujuan tidak boleh sama dengan trayek asal";
    return e;
  };

  // Klik Kirim → validasi → tampilkan popup verifikasi
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setShowVerifikasi(true);
  };

  // Konfirmasi dari popup → kirim data ke API
  const handleKonfirmasi = async () => {
    setShowVerifikasi(false);
    try {
      const payload = {
        tnkb: form.tnkb,
        jenis_kendaraan: form.jenis,
        kapasitas_mobil: form.kapasitas ? parseInt(form.kapasitas) : null,
        nama_perusahaan: form.perusahaan.trim() || "-",
        status_pergerakan: mode === "kedatangan" ? "kedatangan" : "keberangkatan",
        jumlah_penumpang: mode === "kedatangan"
          ? parseInt(form.penumpangDatang || "0")
          : parseInt(form.penumpangBerangkat || "0"),
        trayek_asal: form.trayekAsal,
        trayek_tujuan: form.trayekTujuan,
        timestamp: form.timestamp ? form.timestamp.replace("T", " ") : "",
        created_by: userName || (typeof window !== "undefined" ? sessionStorage.getItem("app_username") : null) || null,
      };

      const res = await fetch("http://localhost:5000/api/pergerakan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setForm({ ...emptyForm, status: mode === "kedatangan" ? "Kedatangan" : "Keberangkatan" });
      }, 2500);
    } catch (err) {
      alert("Gagal menyimpan data. Pastikan server backend berjalan.");
      console.error(err);
    }
  };

  // Handler penumpang dengan max limit
  const handlePenumpangChange = (field: "penumpangDatang" | "penumpangBerangkat", val: string) => {
    const num = parseInt(val);
    if (val === "" || (num >= 0 && num <= maxPenumpang)) {
      set(field, val);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center">
      {/* Popup Verifikasi */}
      {showVerifikasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Header popup */}
            <div className="px-7 py-5 bg-sidebar">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Verifikasi Data {form.status}</h3>
                  <p className="text-white/80 text-xs mt-0.5">Pastikan data sudah benar sebelum disimpan</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-7 py-5">
              <div className="space-y-3">
                {/* Timestamp */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-text-secondary">Timestamp</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">
                    {form.timestamp
                      ? (() => {
                          const d = new Date(form.timestamp);
                          const pad = (n: number) => String(n).padStart(2, "0");
                          return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
                        })()
                      : "-"}
                  </p>
                </div>

                {/* Grid 2 kolom */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-text-secondary">TNKB</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{form.tnkb}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-text-secondary">Jenis Kendaraan</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{form.jenis}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-text-secondary">Kapasitas</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{form.kapasitas ? `${form.kapasitas} penumpang` : "-"}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-text-secondary">Perusahaan</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{form.perusahaan}</p>
                  </div>
                </div>

                {/* Penumpang */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl ${mode === "kedatangan" ? "bg-blue-50 border border-blue-100" : "bg-gray-50"}`}>
                    <p className="text-xs text-text-secondary">Penumpang Kedatangan</p>
                    <p className={`text-lg font-bold mt-0.5 ${mode === "kedatangan" ? "text-blue-600" : "text-text-secondary"}`}>
                      {mode === "kedatangan" ? (form.penumpangDatang || "0") : "0"}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${mode === "keberangkatan" ? "bg-green-50 border border-green-100" : "bg-gray-50"}`}>
                    <p className="text-xs text-text-secondary">Penumpang Keberangkatan</p>
                    <p className={`text-lg font-bold mt-0.5 ${mode === "keberangkatan" ? "text-green-600" : "text-text-secondary"}`}>
                      {mode === "keberangkatan" ? (form.penumpangBerangkat || "0") : "0"}
                    </p>
                  </div>
                </div>

                {/* Trayek */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-text-secondary">Trayek Asal</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{form.trayekAsal}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-text-secondary" />
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-text-secondary">Trayek Tujuan</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{form.trayekTujuan}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-7 pb-6 flex gap-3">
              <button
                onClick={handleKonfirmasi}
                className="flex-1 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors"
              >
                Simpan
              </button>
              <button
                onClick={() => setShowVerifikasi(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Back button */}
      <div className="w-full mb-6">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full border-2 border-text-primary flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
      </div>

      {/* Title */}
      <h1 className="text-center text-3xl font-bold text-text-primary mb-8 leading-snug">
        Isi Data Kendaraan<br />{mode === "kedatangan" ? "Kedatangan" : "Keberangkatan"}
      </h1>

      {/* Success banner */}
      {submitted && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-5 py-3 mb-6 text-sm font-medium w-full max-w-3xl">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Data {title.toLowerCase()} berhasil disimpan!
        </div>
      )}

      {/* Form grid */}
      <form onSubmit={handleSubmit} className="w-full max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

          {/* Timestamp */}
          <Field label="Timestamp" error={errors.timestamp}>
            <input
              type="datetime-local"
              value={form.timestamp}
              onChange={(e) => set("timestamp", e.target.value)}
              className={inputCls(!!errors.timestamp)}
            />
          </Field>

          {/* Jumlah Penumpang utama (sesuai mode) */}
          <Field
            label={mode === "kedatangan" ? "Jumlah Penumpang Kedatangan" : "Jumlah Penumpang Keberangkatan"}
            error={mode === "kedatangan" ? errors.penumpangDatang : errors.penumpangBerangkat}
          >
            <div className="relative">
              <input
                type="number"
                min="0"
                max={maxPenumpang}
                value={mode === "kedatangan" ? form.penumpangDatang : form.penumpangBerangkat}
                onChange={(e) =>
                  handlePenumpangChange(
                    mode === "kedatangan" ? "penumpangDatang" : "penumpangBerangkat",
                    e.target.value
                  )
                }
                placeholder="0"
                className={inputCls(!!(mode === "kedatangan" ? errors.penumpangDatang : errors.penumpangBerangkat))}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-secondary">
                max {maxPenumpang}
              </span>
            </div>
          </Field>

          {/* Status (read-only) */}
          <Field label="Status" error={errors.status}>
            <input
              type="text"
              value={form.status}
              readOnly
              className={`${inputCls(false)} bg-gray-50 cursor-not-allowed font-semibold`}
            />
          </Field>

          {/* Jumlah Penumpang sekunder (otomatis 0) */}
          <Field
            label={mode === "kedatangan" ? "Jumlah Penumpang Keberangkatan" : "Jumlah Penumpang Kedatangan"}
          >
            <input
              type="text"
              value="0"
              readOnly
              className={`${inputCls(false)} bg-gray-50 cursor-not-allowed font-semibold`}
            />
          </Field>

          {/* TNKB */}
          <Field label="TNKB" error={errors.tnkb}>
            <input
              type="text"
              value={form.tnkb}
              onChange={(e) => set("tnkb", e.target.value.toUpperCase())}
              placeholder="Contoh: BL 1234 AB"
              className={inputCls(!!errors.tnkb)}
            />
          </Field>

          {/* Trayek Asal */}
          <Field label="Trayek Asal" error={errors.trayekAsal}>
            <input
              type="text"
              value={form.trayekAsal}
              onChange={(e) => set("trayekAsal", e.target.value)}
              placeholder="Contoh: Banda Aceh"
              className={inputCls(!!errors.trayekAsal)}
            />
          </Field>

          {/* Jenis Kendaraan */}
          <SelectField
            label="Jenis Kendaraan"
            error={errors.jenis}
            value={form.jenis}
            onChange={(val) => {
              set("jenis", val);
              if (val && kapasitasMap[val]) {
                set("kapasitas", kapasitasMap[val]);
              } else {
                set("kapasitas", "");
              }
            }}
            options={jenisOptions}
            placeholder="Pilih jenis kendaraan"
          />

          {/* Trayek Tujuan */}
          <Field label="Trayek Tujuan" error={errors.trayekTujuan}>
            <input
              type="text"
              value={form.trayekTujuan}
              onChange={(e) => set("trayekTujuan", e.target.value)}
              placeholder="Contoh: Blangpidie"
              className={inputCls(!!errors.trayekTujuan)}
            />
          </Field>

          {/* Kapasitas Mobil (read-only) */}
          <Field label="Kapasitas Mobil" error={errors.kapasitas}>
            <input
              type="text"
              value={form.kapasitas ? `${form.kapasitas} penumpang` : ""}
              readOnly
              placeholder="Otomatis dari jenis kendaraan"
              className={`${inputCls(false)} bg-gray-50 cursor-not-allowed font-semibold`}
            />
          </Field>

          {/* Nama Perusahaan */}
          <Field label="Nama Perusahaan" error={errors.perusahaan}>
            <input
              type="text"
              value={form.perusahaan}
              onChange={(e) => set("perusahaan", e.target.value)}
              placeholder="Kosongkan jika tidak ada"
              className={inputCls(!!errors.perusahaan)}
            />
          </Field>
        </div>

        {/* Submit button */}
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            className="flex items-center gap-3 bg-sidebar hover:bg-sidebar-hover text-white font-bold px-8 py-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            Kirim
            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main: pilihan dua kartu ──────────────────────────────────────────────────
export default function IsiDataKendaraanPage({ userName }: { userName?: string }) {
  const [mode, setMode] = useState<Mode>(null);

  // Fetch jenis kendaraan dari API
  useEffect(() => {
    fetch("http://localhost:5000/api/jenis-kendaraan")
      .then((res) => res.json())
      .then((json) => {
        const items = json.data || [];
        jenisOptions = items.map((i: any) => i.nama);
        kapasitasMap = {};
        items.forEach((i: any) => { kapasitasMap[i.nama] = String(i.kapasitas); });
      })
      .catch(() => {});
  }, []);

  if (mode === "kedatangan")
    return <FormView title="Kedatangan" mode="kedatangan" onBack={() => setMode(null)} userName={userName} />;
  if (mode === "keberangkatan")
    return <FormView title="Keberangkatan" mode="keberangkatan" onBack={() => setMode(null)} userName={userName} />;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-160px)]">
      <div className="flex flex-col sm:flex-row gap-8">
        <button
          onClick={() => setMode("kedatangan")}
          className="w-64 py-16 bg-sidebar rounded-2xl flex flex-col items-center justify-center gap-4 shadow-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-xl"
        >
          <ClipboardList className="w-14 h-14 text-white" strokeWidth={1.5} />
          <span className="text-white font-bold text-base tracking-wide text-center leading-tight">
            ISI DATA KENDARAAN<br />KEDATANGAN
          </span>
        </button>

        <button
          onClick={() => setMode("keberangkatan")}
          className="w-64 py-16 bg-sidebar rounded-2xl flex flex-col items-center justify-center gap-4 shadow-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-xl"
        >
          <ClipboardList className="w-14 h-14 text-white" strokeWidth={1.5} />
          <span className="text-white font-bold text-base tracking-wide text-center leading-tight">
            ISI DATA KENDARAAN<br />KEBERANGKATAN
          </span>
        </button>
      </div>
    </div>
  );
}
