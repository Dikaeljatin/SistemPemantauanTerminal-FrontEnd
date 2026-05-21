"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function PieChartCard() {
  const [data, setData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/pergerakan")
      .then((res) => res.json())
      .then((json) => {
        let kedatangan = 0;
        let keberangkatan = 0;
        (json.data || []).forEach((item: any) => {
          if (item.status_pergerakan === "kedatangan") kedatangan++;
          else keberangkatan++;
        });
        const chartData = [
          { name: "Kedatangan", value: kedatangan, color: "#60a5fa" },
          { name: "Keberangkatan", value: keberangkatan, color: "#4ade80" },
        ];
        setData(chartData);
      })
      .catch(() => setData([]));
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md w-[380px]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 bg-sidebar rounded-full"></div>
        <h3 className="font-bold text-text-primary text-sm">
          Perbandingan Kedatangan vs Keberangkatan
        </h3>
      </div>

      {total === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-text-secondary text-sm">
          Tidak ada data
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-text-secondary">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px", padding: "10px 14px" }}
                formatter={(value, name) => [`${value}`, `${name}`]}
              />
            </PieChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
