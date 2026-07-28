"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../../lib/api";
import { ClipboardList, ArrowLeft, ArrowRight, CheckCircle, ChevronDown, AlertTriangle } from "lucide-react";

// ─── options ──────────────────────────────────────────────────────────────────
const trayekOptions = ["Banda Aceh", "Meulaboh", "Tapaktuan", "Subulussalam", "Blangpidie"];

let kapasitasMap: Record<string, string> = {};
let jenisOptions: string[] = [];

type Mode = null | "kedatangan" | "keberangkatan";

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

const inputCls = (hasError: boolean) =>
  `w-full bg-white rounded-xl px-5 py-3 text-sm text-text-primary outline-none border transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-sidebar focus:ring-2 focus:ring-sidebar/10 hover:border-gray-300"
  } shadow-sm`;

const readonlyCls = `w-full bg-gray-50 rounded-xl px-5 py-3 text-sm text-text-primary outline-none border border-gray-200 shadow-sm cursor-not-allowed font-semibold`;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-text-primary">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs pl-1 mt-1">{error}</p>}
    </div>
  );
}

function SelectField({
  label, error, value, onChange, options, placeholder = "Pilih...",
}: {
  label: string; error?: string; value: string;
  onChange: (val: string) => void; options: string[]; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={label} error={error}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center justify-between bg-white rounded-xl px-5 py-3 text-sm text-left outline-none border transition-all shadow-sm ${
            error ? "border-red-400" : open ? "border-sidebar ring-2 ring-sidebar/10" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className={value ? "text-text-primary" : "text-gray-400"}>{value || placeholder}</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-52 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt} type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-5 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                  value === opt ? "bg-sidebar text-white font-medium" : "text-text-primary hover:bg-gray-50"
                }`}
              >{opt}</button>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}

// ─── Form Kedatangan ──────────────────────────────────────────────────────────
function FormKedatangan({ onBack, userName }: { onBack: () => void; userName?: string }) {
  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const [form, setForm] = useState<VehicleForm>({ ...emptyForm, status: "Kedatangan", timestamp: localNow });
  const [errors, setErrors] = useState<Partial<VehicleForm>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showVerifikasi, setShowVerifikasi] = useState(false);
  const [showTnkbDrop, setShowTnkbDrop] = useState(false);
  const [vehicleMap, setVehicleMap] = useState<Record<string, Array<{
    tnkb: string; perusahaan: string; trayekAsal: string; trayekTujuan: string;
  }>>>({});

  useEffect(() => {
    apiFetch("/api/pergerakan")
      .then((r) => r.json())
      .then((json) => {
        const rows: any[] = json.data || json || [];
        const map: Record<string, Record<string, { perusahaan: string; trayekAsal: string; trayekTujuan: string }>> = {};
        rows.forEach((item: any) => {
          const jenis = (item.jenis_kendaraan || "").trim().toLowerCase();
          const tnkb = (item.tnkb || "").trim();
          if (!jenis || !tnkb) return;
          if (!map[jenis]) map[jenis] = {};
          if (!map[jenis][tnkb]) {
            map[jenis][tnkb] = {
              perusahaan: item.nama_perusahaan || "",
              trayekAsal: item.trayek_asal || "",
              trayekTujuan: item.trayek_tujuan || "",
            };
          }
        });
        const result: Record<string, Array<{ tnkb: string; perusahaan: string; trayekAsal: string; trayekTujuan: string }>> = {};
        Object.entries(map).forEach(([jenis, tnkbMap]) => {
          result[jenis] = Object.entries(tnkbMap)
            .map(([tnkb, info]) => ({ tnkb, ...info }))
            .sort((a, b) => a.tnkb.localeCompare(b.tnkb));
        });
        setVehicleMap(result);
      })
      .catch((err) => console.error("[TNKB] fetch error:", err));
  }, []);

  const set = (k: keyof VehicleForm, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const maxPenumpang = form.kapasitas ? parseInt(form.kapasitas) : 16;

  const validate = () => {
    const e: Partial<VehicleForm> = {};
    if (!form.timestamp)            e.timestamp       = "Wajib diisi";
    if (!form.tnkb.trim())          e.tnkb            = "Wajib diisi";
    if (!form.jenis)                e.jenis           = "Wajib dipilih";
    if (!form.penumpangDatang.trim()) e.penumpangDatang = "Wajib diisi";
    else if (parseInt(form.penumpangDatang) > maxPenumpang) e.penumpangDatang = `Maksimal ${maxPenumpang} penumpang`;
    if (!form.trayekAsal)           e.trayekAsal      = "Wajib dipilih";
    if (!form.trayekTujuan)         e.trayekTujuan    = "Wajib dipilih";
    if (form.trayekAsal && form.trayekTujuan && form.trayekAsal === form.trayekTujuan)
                                    e.trayekTujuan    = "Trayek tujuan tidak boleh sama dengan trayek asal";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setShowVerifikasi(true);
  };

  const handleKonfirmasi = async () => {
    setShowVerifikasi(false);
    try {
      const payload = {
        tnkb: form.tnkb,
        jenis_kendaraan: form.jenis,
        kapasitas_mobil: form.kapasitas ? parseInt(form.kapasitas) : null,
        nama_perusahaan: form.perusahaan.trim() || "-",
        status_pergerakan: "kedatangan",
        jumlah_penumpang: parseInt(form.penumpangDatang || "0"),
        trayek_asal: form.trayekAsal,
        trayek_tujuan: form.trayekTujuan,
        timestamp: form.timestamp ? form.timestamp.replace("T", " ") : "",
        created_by: userName || sessionStorage.getItem("app_username") || null,
      };
      const res = await apiFetch("/api/pergerakan", { method: "POST", body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Gagal menyimpan");
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setForm({ ...emptyForm, status: "Kedatangan" });
      }, 2500);
    } catch (err) {
      alert("Gagal menyimpan data. Pastikan server backend berjalan.");
    }
  };

  const handlePenumpangChange = (val: string) => {
    const num = parseInt(val);
    if (val === "" || (num >= 0 && num <= maxPenumpang)) set("penumpangDatang", val);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center">
      {/* Popup Verifikasi */}
      {showVerifikasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-7 py-5 bg-sidebar">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Verifikasi Data Kedatangan</h3>
                  <p className="text-white/80 text-xs mt-0.5">Pastikan data sudah benar sebelum disimpan</p>
                </div>
              </div>
            </div>
            <div className="px-7 py-5 space-y-3">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-text-secondary">Timestamp</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">
                  {form.timestamp ? (() => {
                    const d = new Date(form.timestamp);
                    const pad = (n: number) => String(n).padStart(2, "0");
                    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
                  })() : "-"}
                </p>
              </div>
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
                  <p className="text-sm font-semibold text-text-primary mt-0.5">{form.perusahaan || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs text-text-secondary">Penumpang Kedatangan</p>
                  <p className="text-lg font-bold mt-0.5 text-blue-600">{form.penumpangDatang || "0"}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-text-secondary">Penumpang Keberangkatan</p>
                  <p className="text-lg font-bold mt-0.5 text-text-secondary">0</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1 text-center">
                  <p className="text-xs text-text-secondary">Trayek Asal</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">{form.trayekAsal}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-text-secondary shrink-0" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-text-secondary">Trayek Tujuan</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">{form.trayekTujuan}</p>
                </div>
              </div>
            </div>
            <div className="px-7 pb-6 flex gap-3">
              <button onClick={handleKonfirmasi} className="flex-1 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors">Simpan</button>
              <button onClick={() => setShowVerifikasi(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors">Kembali</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full border-2 border-text-primary flex items-center justify-center hover:bg-white transition-colors" aria-label="Kembali">
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
      </div>

      <h1 className="text-center text-3xl font-bold text-text-primary mb-8 leading-snug">
        Isi Data Kendaraan<br />Kedatangan
      </h1>

      {submitted && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-5 py-3 mb-6 text-sm font-medium w-full max-w-3xl">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Data kedatangan berhasil disimpan!
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

          <Field label="Timestamp" error={errors.timestamp}>
            <input type="datetime-local" value={form.timestamp}
              onChange={(e) => set("timestamp", e.target.value)}
              className={inputCls(!!errors.timestamp)} />
          </Field>

          <Field label="Jumlah Penumpang Kedatangan" error={errors.penumpangDatang}>
            <div className="relative">
              <input type="number" min="0" max={maxPenumpang}
                value={form.penumpangDatang}
                onChange={(e) => handlePenumpangChange(e.target.value)}
                placeholder="0"
                className={inputCls(!!errors.penumpangDatang)} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-secondary">max {maxPenumpang}</span>
            </div>
          </Field>

          <Field label="Status" error={errors.status}>
            <input type="text" value={form.status} readOnly className={readonlyCls} />
          </Field>

          <Field label="Jumlah Penumpang Keberangkatan">
            <input type="text" value="0" readOnly className={readonlyCls} />
          </Field>

          <SelectField label="Jenis Kendaraan" error={errors.jenis}
            value={form.jenis}
            onChange={(val) => { set("jenis", val); set("tnkb", ""); set("perusahaan", ""); set("kapasitas", kapasitasMap[val] ?? ""); }}
            options={jenisOptions}
            placeholder="Pilih jenis kendaraan" />

          <Field label="Trayek Asal" error={errors.trayekAsal}>
            <input type="text" value={form.trayekAsal}
              onChange={(e) => set("trayekAsal", e.target.value)}
              placeholder="Contoh: Banda Aceh"
              className={inputCls(!!errors.trayekAsal)} />
          </Field>

          <Field label="Kapasitas Mobil">
            <input type="text" value={form.kapasitas ? `${form.kapasitas} penumpang` : ""} readOnly
              placeholder="Otomatis dari jenis kendaraan"
              className={readonlyCls} />
          </Field>

          <Field label="Trayek Tujuan" error={errors.trayekTujuan}>
            <input type="text" value={form.trayekTujuan}
              onChange={(e) => set("trayekTujuan", e.target.value)}
              placeholder="Contoh: Blangpidie"
              className={inputCls(!!errors.trayekTujuan)} />
          </Field>

          <Field label="TNKB" error={errors.tnkb}>
            <div className="relative">
              <input type="text" value={form.tnkb}
                onChange={(e) => { set("tnkb", e.target.value.toUpperCase()); setShowTnkbDrop(true); }}
                onFocus={() => setShowTnkbDrop(true)}
                onBlur={() => setTimeout(() => setShowTnkbDrop(false), 150)}
                placeholder={form.jenis ? "Ketik atau pilih TNKB..." : "Pilih jenis kendaraan dulu"}
                disabled={!form.jenis}
                className={`${inputCls(!!errors.tnkb)} ${!form.jenis ? "bg-gray-50 cursor-not-allowed" : ""}`} />
              {showTnkbDrop && form.jenis && (() => {
                const allOptions = vehicleMap[form.jenis.toLowerCase()] || [];
                const filtered = allOptions.filter((v) => v.tnkb.toUpperCase().includes(form.tnkb.toUpperCase()));
                if (filtered.length === 0) return null;
                return (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-52 overflow-y-auto">
                    {filtered.map((v) => (
                      <button key={v.tnkb} type="button"
                        onMouseDown={() => {
                          set("tnkb", v.tnkb);
                          if (v.perusahaan) set("perusahaan", v.perusahaan);
                          if (v.trayekAsal) set("trayekAsal", v.trayekAsal);
                          if (v.trayekTujuan) set("trayekTujuan", v.trayekTujuan);
                          setShowTnkbDrop(false);
                        }}
                        className={`w-full text-left px-5 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${form.tnkb === v.tnkb ? "bg-sidebar text-white font-medium" : "text-text-primary hover:bg-gray-50"}`}>
                        <span className="font-semibold">{v.tnkb}</span>
                        {v.perusahaan && <span className={`ml-2 text-xs ${form.tnkb === v.tnkb ? "text-white/70" : "text-text-secondary"}`}>{v.perusahaan}</span>}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </Field>

          <Field label="Nama Perusahaan" error={errors.perusahaan}>
            <input type="text" value={form.perusahaan}
              onChange={(e) => set("perusahaan", e.target.value)}
              placeholder="Kosongkan jika tidak ada"
              className={inputCls(!!errors.perusahaan)} />
          </Field>
        </div>

        <div className="flex justify-end mt-8">
          <button type="submit"
            className="flex items-center gap-3 bg-sidebar hover:bg-sidebar-hover text-white font-bold px-8 py-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl">
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

// ─── Form Keberangkatan ───────────────────────────────────────────────────────
function FormKeberangkatan({ onBack, userName }: { onBack: () => void; userName?: string }) {
  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const timestamp = localNow;

  const [tnkbInput, setTnkbInput] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [tnkbList, setTnkbList] = useState<string[]>([]);
  const [autoData, setAutoData] = useState<{
    tnkb: string; jenis_kendaraan: string; kapasitas: number | null;
    perusahaan: string; trayek_asal: string; trayek_tujuan: string;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadingAuto, setLoadingAuto] = useState(false);
  const [penumpang, setPenumpang] = useState("");
  const [penumpangError, setPenumpangError] = useState("");
  const [showVerifikasi, setShowVerifikasi] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // State untuk field yang bisa diedit pada mode auto
  const [editTrayekAsal, setEditTrayekAsal] = useState("");
  const [editTrayekTujuan, setEditTrayekTujuan] = useState("");
  const [editPerusahaan, setEditPerusahaan] = useState("");

  // State untuk mode manual (ketika TNKB tidak ditemukan di riwayat kedatangan)
  const [manualJenis, setManualJenis] = useState("");
  const [manualTrayekAsal, setManualTrayekAsal] = useState("");
  const [manualTrayekTujuan, setManualTrayekTujuan] = useState("");
  const [manualPerusahaan, setManualPerusahaan] = useState("");
  const [manualErrors, setManualErrors] = useState<Record<string, string>>({});

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch("/api/pergerakan/kedatangan-tnkb")
      .then((r) => r.json())
      .then((json) => setTnkbList(json.data || []))
      .catch(() => {});
  }, []);

  const filteredTnkb = tnkbList.filter((t) =>
    t.toUpperCase().includes(tnkbInput.toUpperCase())
  );

  const handleSelectTnkb = async (selectedTnkb: string) => {
    setTnkbInput(selectedTnkb);
    setShowDrop(false);
    setNotFound(false);
    setAutoData(null);
    setLoadingAuto(true);
    try {
      const res = await apiFetch(`/api/pergerakan/kedatangan-by-tnkb/${encodeURIComponent(selectedTnkb)}`);
      if (!res.ok) { setNotFound(true); return; }
      const json = await res.json();
      setAutoData(json.data);
      setEditTrayekAsal(json.data.trayek_asal || "");
      setEditTrayekTujuan(json.data.trayek_tujuan || "");
      setEditPerusahaan(json.data.perusahaan || "");
    } catch {
      setNotFound(true);
    } finally {
      setLoadingAuto(false);
    }
  };

  const handleTnkbBlur = () => {
    setTimeout(() => {
      setShowDrop(false);
      if (tnkbInput && !autoData && !loadingAuto) {
        const exact = tnkbList.find((t) => t.toUpperCase() === tnkbInput.toUpperCase());
        if (!exact) setNotFound(true);
      }
    }, 150);
  };

  const manualKapasitas = manualJenis ? parseInt(kapasitasMap[manualJenis] ?? "16") : 16;
  const maxPenumpang = autoData ? (autoData.kapasitas ?? 16) : manualKapasitas;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoData && !notFound) return;

    if (notFound) {
      // Validasi mode manual
      const errs: Record<string, string> = {};
      if (!tnkbInput.trim()) errs.tnkb = "Wajib diisi";
      if (!manualJenis) errs.jenis = "Wajib dipilih";
      if (!manualTrayekAsal) errs.trayekAsal = "Wajib diisi";
      if (!manualTrayekTujuan) errs.trayekTujuan = "Wajib diisi";
      if (manualTrayekAsal && manualTrayekTujuan && manualTrayekAsal === manualTrayekTujuan)
        errs.trayekTujuan = "Trayek tujuan tidak boleh sama dengan trayek asal";
      if (!penumpang.trim()) errs.penumpang = "Wajib diisi";
      else if (parseInt(penumpang) > manualKapasitas) errs.penumpang = `Maksimal ${manualKapasitas} penumpang`;
      if (Object.keys(errs).length > 0) { setManualErrors(errs); return; }
      setManualErrors({});
    } else {
      if (!penumpang.trim()) { setPenumpangError("Wajib diisi"); return; }
      if (parseInt(penumpang) > maxPenumpang) { setPenumpangError(`Maksimal ${maxPenumpang} penumpang`); return; }
      setPenumpangError("");
    }

    setShowVerifikasi(true);
  };

  const handleKonfirmasi = async () => {
    setShowVerifikasi(false);
    try {
      const payload = notFound ? {
        tnkb: tnkbInput,
        jenis_kendaraan: manualJenis,
        kapasitas_mobil: manualJenis ? parseInt(kapasitasMap[manualJenis] ?? "0") || null : null,
        nama_perusahaan: manualPerusahaan.trim() || "-",
        status_pergerakan: "keberangkatan",
        jumlah_penumpang: parseInt(penumpang || "0"),
        trayek_asal: manualTrayekAsal,
        trayek_tujuan: manualTrayekTujuan,
        timestamp: timestamp.replace("T", " "),
        created_by: userName || sessionStorage.getItem("app_username") || null,
      } : {
        tnkb: autoData!.tnkb,
        jenis_kendaraan: autoData!.jenis_kendaraan,
        kapasitas_mobil: autoData!.kapasitas ?? null,
        nama_perusahaan: editPerusahaan.trim() || "-",
        status_pergerakan: "keberangkatan",
        jumlah_penumpang: parseInt(penumpang || "0"),
        trayek_asal: editTrayekAsal,
        trayek_tujuan: editTrayekTujuan,
        timestamp: timestamp.replace("T", " "),
        created_by: userName || sessionStorage.getItem("app_username") || null,
      };

      const res = await apiFetch("/api/pergerakan", { method: "POST", body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Gagal");
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTnkbInput(""); setAutoData(null); setPenumpang("");
        setNotFound(false); setManualJenis(""); setManualTrayekAsal("");
        setManualTrayekTujuan(""); setManualPerusahaan("");
      }, 2500);
    } catch {
      alert("Gagal menyimpan data. Pastikan server backend berjalan.");
    }
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Data ringkasan untuk popup verifikasi
  const summaryData = notFound ? {
    tnkb: tnkbInput, jenis: manualJenis,
    kapasitas: kapasitasMap[manualJenis] || "-",
    perusahaan: manualPerusahaan || "-",
    trayekAsal: manualTrayekAsal, trayekTujuan: manualTrayekTujuan,
  } : {
    tnkb: autoData?.tnkb || "", jenis: autoData?.jenis_kendaraan || "",
    kapasitas: autoData?.kapasitas ? String(autoData.kapasitas) : "-",
    perusahaan: editPerusahaan || "-",
    trayekAsal: editTrayekAsal, trayekTujuan: editTrayekTujuan,
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center">

      {/* Popup Verifikasi */}
      {showVerifikasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-7 py-5 bg-sidebar">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Verifikasi Data Keberangkatan</h3>
                  <p className="text-white/80 text-xs mt-0.5">Pastikan data sudah benar sebelum disimpan</p>
                </div>
              </div>
            </div>
            <div className="px-7 py-5 space-y-3">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-text-secondary">Timestamp</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">{formatTimestamp(timestamp)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-text-secondary">TNKB</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">{summaryData.tnkb}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-text-secondary">Jenis Kendaraan</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">{summaryData.jenis}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-text-secondary">Kapasitas</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">{summaryData.kapasitas !== "-" ? `${summaryData.kapasitas} penumpang` : "-"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-text-secondary">Perusahaan</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">{summaryData.perusahaan}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-text-secondary">Penumpang Kedatangan</p>
                  <p className="text-lg font-bold mt-0.5 text-text-secondary">0</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50 border border-green-100">
                  <p className="text-xs text-text-secondary">Penumpang Keberangkatan</p>
                  <p className="text-lg font-bold mt-0.5 text-green-600">{penumpang || "0"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1 text-center">
                  <p className="text-xs text-text-secondary">Trayek Asal</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">{summaryData.trayekAsal}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-text-secondary shrink-0" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-text-secondary">Trayek Tujuan</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">{summaryData.trayekTujuan}</p>
                </div>
              </div>
            </div>
            <div className="px-7 pb-6 flex gap-3">
              <button onClick={handleKonfirmasi} className="flex-1 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors">Simpan</button>
              <button onClick={() => setShowVerifikasi(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors">Kembali</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full border-2 border-text-primary flex items-center justify-center hover:bg-white transition-colors" aria-label="Kembali">
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
      </div>

      <h1 className="text-center text-3xl font-bold text-text-primary mb-8 leading-snug">
        Isi Data Kendaraan<br />Keberangkatan
      </h1>

      {submitted && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-5 py-3 mb-6 text-sm font-medium w-full max-w-xl">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Data keberangkatan berhasil disimpan!
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-5">

        {/* TNKB — field pertama */}
        <Field label="TNKB" error={manualErrors.tnkb}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={tnkbInput}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setTnkbInput(val);
                  setShowDrop(true);
                  setNotFound(false);
                  setAutoData(null);
                  if (!val) setPenumpang("");
                }}
                onFocus={() => setShowDrop(true)}
                onBlur={handleTnkbBlur}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (tnkbInput) handleSelectTnkb(tnkbInput); } }}
                placeholder="Ketik atau pilih TNKB kendaraan..."
                className={inputCls(!!manualErrors.tnkb || notFound)}
              />
              {showDrop && tnkbInput && filteredTnkb.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-52 overflow-y-auto">
                  {filteredTnkb.map((t) => (
                    <button key={t} type="button"
                      onMouseDown={() => handleSelectTnkb(t)}
                      className={`w-full text-left px-5 py-2.5 text-sm font-semibold transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        tnkbInput === t ? "bg-sidebar text-white" : "text-text-primary hover:bg-gray-50"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tombol Cari */}
            <button
              type="button"
              onClick={() => { if (tnkbInput) handleSelectTnkb(tnkbInput); }}
              disabled={!tnkbInput || loadingAuto}
              className="flex items-center gap-2 px-5 py-3 bg-sidebar hover:bg-sidebar-hover disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold text-sm rounded-xl shadow-sm transition-all duration-200 shrink-0"
            >
              {loadingAuto ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  <span>Mencari...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <span>Cari</span>
                </>
              )}
            </button>
          </div>

          {loadingAuto && <p className="text-xs text-text-secondary mt-1 pl-1">Sedang mencari data kendaraan...</p>}

          {/* Peringatan + info isi manual */}
          {notFound && (
            <div className="mt-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>TNKB tidak ditemukan dalam riwayat kedatangan</span>
              </div>
              <p className="text-amber-600 text-xs pl-6">Silakan isi data kendaraan secara manual di bawah ini.</p>
            </div>
          )}
        </Field>

        {/* Mode Auto: field terisi otomatis dari riwayat kedatangan */}
        {autoData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Timestamp">
                <input type="text" value={formatTimestamp(timestamp)} readOnly className={readonlyCls} />
              </Field>
              <Field label="Status">
                <input type="text" value="Keberangkatan" readOnly className={readonlyCls} />
              </Field>
              <Field label="Jenis Kendaraan">
                <input type="text" value={autoData.jenis_kendaraan} readOnly className={readonlyCls} />
              </Field>
              <Field label="Kapasitas Mobil">
                <input type="text" value={autoData.kapasitas ? `${autoData.kapasitas} penumpang` : "-"} readOnly className={readonlyCls} />
              </Field>
              <Field label="Trayek Asal">
                <input type="text" value={editTrayekAsal}
                  onChange={(e) => setEditTrayekAsal(e.target.value)}
                  placeholder="Trayek asal"
                  className={inputCls(false)} />
              </Field>
              <Field label="Trayek Tujuan">
                <input type="text" value={editTrayekTujuan}
                  onChange={(e) => setEditTrayekTujuan(e.target.value)}
                  placeholder="Trayek tujuan"
                  className={inputCls(false)} />
              </Field>
              <Field label="Nama Perusahaan">
                <input type="text" value={editPerusahaan}
                  onChange={(e) => setEditPerusahaan(e.target.value)}
                  placeholder="Kosongkan jika tidak ada"
                  className={inputCls(false)} />
              </Field>
              <Field label="Jumlah Penumpang Kedatangan">
                <input type="text" value="0" readOnly className={readonlyCls} />
              </Field>
            </div>
            <Field label="Jumlah Penumpang Keberangkatan" error={penumpangError}>
              <div className="relative">
                <input type="number" min="0" max={maxPenumpang} value={penumpang}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = parseInt(val);
                    if (val === "" || (num >= 0 && num <= maxPenumpang)) { setPenumpang(val); setPenumpangError(""); }
                  }}
                  placeholder="Masukkan jumlah penumpang..."
                  className={inputCls(!!penumpangError)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-secondary">maks {maxPenumpang}</span>
              </div>
            </Field>
          </>
        )}

        {/* Mode Manual: TNKB tidak ditemukan, isi semua field secara manual */}
        {notFound && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Timestamp">
                <input type="text" value={formatTimestamp(timestamp)} readOnly className={readonlyCls} />
              </Field>
              <Field label="Status">
                <input type="text" value="Keberangkatan" readOnly className={readonlyCls} />
              </Field>
              <SelectField label="Jenis Kendaraan" error={manualErrors.jenis}
                value={manualJenis}
                onChange={(val) => { setManualJenis(val); setManualErrors((e) => ({ ...e, jenis: "" })); }}
                options={jenisOptions}
                placeholder="Pilih jenis kendaraan" />
              <Field label="Kapasitas Mobil">
                <input type="text" value={manualJenis ? `${kapasitasMap[manualJenis]} penumpang` : ""} readOnly
                  placeholder="Otomatis dari jenis kendaraan" className={readonlyCls} />
              </Field>
              <Field label="Trayek Asal" error={manualErrors.trayekAsal}>
                <input type="text" value={manualTrayekAsal}
                  onChange={(e) => { setManualTrayekAsal(e.target.value); setManualErrors((e2) => ({ ...e2, trayekAsal: "" })); }}
                  placeholder="Contoh: Banda Aceh" className={inputCls(!!manualErrors.trayekAsal)} />
              </Field>
              <Field label="Trayek Tujuan" error={manualErrors.trayekTujuan}>
                <input type="text" value={manualTrayekTujuan}
                  onChange={(e) => { setManualTrayekTujuan(e.target.value); setManualErrors((e2) => ({ ...e2, trayekTujuan: "" })); }}
                  placeholder="Contoh: Blangpidie" className={inputCls(!!manualErrors.trayekTujuan)} />
              </Field>
              <Field label="Nama Perusahaan">
                <input type="text" value={manualPerusahaan}
                  onChange={(e) => setManualPerusahaan(e.target.value)}
                  placeholder="Kosongkan jika tidak ada" className={inputCls(false)} />
              </Field>
              <Field label="Jumlah Penumpang Kedatangan">
                <input type="text" value="0" readOnly className={readonlyCls} />
              </Field>
            </div>
            <Field label="Jumlah Penumpang Keberangkatan" error={manualErrors.penumpang}>
              <div className="relative">
                <input type="number" min="0" max={manualKapasitas} value={penumpang}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = parseInt(val);
                    if (val === "" || (num >= 0 && num <= manualKapasitas)) {
                      setPenumpang(val);
                      setManualErrors((e2) => ({ ...e2, penumpang: "" }));
                    }
                  }}
                  placeholder="Masukkan jumlah penumpang..."
                  className={inputCls(!!manualErrors.penumpang)} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-secondary">maks {manualKapasitas}</span>
              </div>
            </Field>
          </>
        )}

        {(autoData || notFound) && (
          <div className="flex justify-end pt-2">
            <button type="submit"
              className="flex items-center gap-3 bg-sidebar hover:bg-sidebar-hover text-white font-bold px-8 py-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl">
              Kirim
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function IsiDataKendaraanPage({ userName }: { userName?: string }) {
  const [mode, setMode] = useState<Mode>(null);

  useEffect(() => {
    apiFetch("/api/jenis-kendaraan")
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
    return <FormKedatangan onBack={() => setMode(null)} userName={userName} />;
  if (mode === "keberangkatan")
    return <FormKeberangkatan onBack={() => setMode(null)} userName={userName} />;

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
