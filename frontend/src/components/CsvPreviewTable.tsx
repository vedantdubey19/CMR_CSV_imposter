"use client";

import React from "react";
import { PreviewData } from "../lib/types";
import { FileSpreadsheet } from "lucide-react";

interface CsvPreviewTableProps {
  data: PreviewData;
  totalRows: number;
}

export default function CsvPreviewTable({ data, totalRows }: CsvPreviewTableProps) {
  const { headers, rows } = data;

  return (
    <div className="w-full bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-950/40 border border-violet-800/30 rounded-xl text-violet-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200">CSV File Preview</h3>
            <p className="text-xs text-slate-400">
              Review raw columns before launching the AI-powered mapping pipeline.
            </p>
          </div>
        </div>
        <div className="self-start sm:self-center px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs font-semibold text-slate-300">
          Total Rows: <span className="text-violet-400 font-bold">{totalRows}</span>
        </div>
      </div>

      {/* Table Container - Scroll on both axes */}
      <div className="w-full overflow-auto max-h-[380px] border border-slate-800/80 rounded-xl scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <table className="w-full border-collapse text-left text-sm text-slate-300">
          <thead>
            <tr className="bg-slate-900/90 backdrop-blur border-b border-slate-800">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="sticky top-0 px-4 py-3.5 font-semibold text-slate-200 bg-slate-900/90 whitespace-nowrap border-r border-slate-800/50 last:border-r-0"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-slate-900/30 transition-colors duration-150 odd:bg-slate-950/20"
              >
                {headers.map((header, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-4 py-3 whitespace-nowrap text-slate-400 text-xs border-r border-slate-800/30 last:border-r-0"
                  >
                    {row[header] !== undefined && row[header] !== null
                      ? String(row[header])
                      : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalRows > rows.length && (
        <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed">
          Showing first <span className="font-semibold">{rows.length}</span> rows for preview performance. The entire <span className="font-semibold">{totalRows}</span> rows will be parsed on confirmation.
        </p>
      )}
    </div>
  );
}
