"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-sidebar mb-4">404</h1>
        <p className="text-text-secondary text-lg mb-6">Halaman tidak ditemukan</p>
        <Link href="/" className="bg-sidebar hover:bg-sidebar-hover text-white font-bold px-6 py-3 rounded-xl transition-colors">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
