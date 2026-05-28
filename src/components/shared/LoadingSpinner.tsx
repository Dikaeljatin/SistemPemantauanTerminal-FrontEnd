"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
  fullPage?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({
  text = "Memuat data...",
  fullPage = false,
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }[size];

  if (fullPage) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className={`${sizeClass} text-sidebar animate-spin`} />
        <p className="text-text-secondary text-sm">{text}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <Loader2 className={`${sizeClass} text-sidebar animate-spin`} />
      <span className="text-text-secondary text-sm">{text}</span>
    </div>
  );
}

// Skeleton untuk card statistik
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-md flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

// Skeleton untuk chart
export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-md">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
      <div className="bg-gray-100 rounded-lg animate-pulse" style={{ height }} />
    </div>
  );
}

// Skeleton untuk row tabel
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-100 animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}
