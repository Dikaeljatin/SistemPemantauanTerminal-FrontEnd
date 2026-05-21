"use client";

import { UserCircle, LogOut } from "lucide-react";
import { useState } from "react";
import LogoutConfirmModal from "./LogoutConfirmModal";

interface HeaderProps {
  onLogout?: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      {showConfirm && (
        <LogoutConfirmModal
          onConfirm={() => { setShowConfirm(false); onLogout?.(); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <header className="flex items-center justify-end px-8 py-4 bg-bg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-text-primary text-sm tracking-wide">ADMIN</span>
            <div className="w-10 h-10 rounded-full border-2 border-text-primary flex items-center justify-center">
              <UserCircle className="w-7 h-7 text-text-primary" />
            </div>
          </div>
          {onLogout && (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 text-text-secondary hover:text-red-600 text-sm font-medium transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>
    </>
  );
}
