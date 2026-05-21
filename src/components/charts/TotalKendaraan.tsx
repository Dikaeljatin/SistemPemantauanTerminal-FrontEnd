"use client";

import { CarFront } from "lucide-react";
import { useState, useEffect } from "react";

export default function TotalKendaraan() {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch("http://localhost:5000/api/pergerakan")
      .then((res) => res.json())
      .then((json) => setTotal((json.data || []).length))
      .catch(() => setTotal(0));
  }, []);

  return (
    <div className="bg-sidebar rounded-2xl px-8 py-5 flex items-center gap-4 shadow-lg">
      <div className="flex flex-col">
        <h2 className="text-white font-bold text-lg tracking-wide">TOTAL KENDARAAN</h2>
        <div className="flex items-center gap-3 mt-1">
          <CarFront className="w-8 h-8 text-white" />
          <span className="text-white text-4xl font-bold">{total}</span>
        </div>
      </div>
    </div>
  );
}
