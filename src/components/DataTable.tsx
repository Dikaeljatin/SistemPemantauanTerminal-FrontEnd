"use client";

import { ArrowUpDown } from "lucide-react";

const columns = [
  "Column heading",
  "Column heading",
  "Column heading",
  "Column heading",
];

const rows = Array.from({ length: 8 }, (_, i) => i + 1);

export default function DataTable() {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="text-left px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider"
              >
                <div className="flex items-center gap-1 cursor-pointer hover:text-text-primary transition-colors">
                  <span>{col}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {columns.map((_, colIdx) => (
                <td
                  key={colIdx}
                  className="px-6 py-3.5 text-sm text-text-secondary"
                >
                  Regular text column
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
