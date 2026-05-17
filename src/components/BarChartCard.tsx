"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

export default function BarChartCard() {
  const [data, setData] = useState<{ name: string; value: number; fill: string }[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/pergerakan")
      .then((res) => res.json())
      .then((json) => {
        const counts: Record<string, number> = {};
        (json.data || []).forEach((item: any) => {
          const jenis = item.jenis_kendaraan || "Lainnya";
          counts[jenis] = (counts[jenis] || 0) + 1;
        });
        const colors = ["#60a5fa", "#4ade80", "#fbbf24", "#f87171", "#a78bfa", "#34d399"];
        const chartData = Object.entries(counts).map(([name, value], i) => ({
          name, value, fill: colors[i % colors.length],
        }));
        setData(chartData);
      })
      .catch(() => setData([]));
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md flex-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-text-primary text-sm">
          Jenis Kendaraan Yang Paling Banyak Digunakan
        </h3>
      </div>

      {data.length === 0 ? (
        <div className="h-[240px] flex items-center justify-center text-text-secondary text-sm">
          Tidak ada data
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.fill }} />
                <span className="text-xs text-text-secondary">{item.name}</span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px", padding: "10px 14px" }}
                formatter={(value) => [`${value}`, "Jumlah"]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
