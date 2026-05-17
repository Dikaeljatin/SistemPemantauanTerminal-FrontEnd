"use client";

import { LogOut, X } from "lucide-react";

interface LogoutConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutConfirmModal({ onConfirm, onCancel }: LogoutConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-sidebar/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogOut className="w-8 h-8 text-sidebar" />
        </div>

        {/* Text */}
        <h3 className="text-text-primary font-bold text-lg mb-2">Keluar dari Sistem</h3>
        <p className="text-text-secondary text-sm mb-7">
          Apakah Anda yakin ingin keluar? Sesi Anda akan diakhiri.
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 bg-sidebar hover:bg-sidebar-hover text-white font-bold py-3 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-text-secondary font-semibold py-3 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
