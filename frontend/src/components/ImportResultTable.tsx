"use client";

import React, { useState } from "react";
import { ImportResponse, CrmRecord, SkippedRecord } from "../lib/types";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Info, Eye, Sparkles } from "lucide-react";

interface ImportResultTableProps {
  result: ImportResponse;
  resetFlow: () => void;
}

export default function ImportResultTable({ result, resetFlow }: ImportResultTableProps) {
  const { imported, skipped, totalImported, totalSkipped } = result;
  const [activeTab, setActiveTab] = useState<"imported" | "skipped">(
    totalImported > 0 ? "imported" : "skipped"
  );
  
  // Track expanded skipped rows
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (rowIndex: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowIndex]: !prev[rowIndex]
    }));
  };

  // Helper to format dates cleanly
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-500">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="flex items-center gap-4 p-5 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl shadow-inner">
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Successfully Mapped</p>
            <h4 className="text-2xl font-bold text-slate-100 mt-1">{totalImported} <span className="text-sm font-normal text-slate-400">leads</span></h4>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 bg-rose-950/15 border border-rose-500/20 rounded-2xl shadow-inner">
          <div className="p-3 bg-rose-950/50 border border-rose-500/30 rounded-xl text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Skipped / Failed</p>
            <h4 className="text-2xl font-bold text-slate-100 mt-1">{totalSkipped} <span className="text-sm font-normal text-slate-400">leads</span></h4>
          </div>
        </div>
      </div>

      {/* AI Column Mapping Insights */}
      {result.columnMapping && Object.keys(result.columnMapping).length > 0 && (
        <div className="mb-8 p-5 bg-slate-900/40 border border-slate-800/60 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-violet-400">
            <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-200">AI Schema Mapping Matrix</h5>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            The importer dynamically detected and aligned the CSV columns to the CRM fields:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(result.columnMapping).map(([rawHeader, crmField]) => (
              <div 
                key={rawHeader} 
                className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-900 rounded-xl text-xs font-mono hover:border-violet-500/30 transition-all duration-300"
              >
                <span className="text-slate-400 font-medium max-w-[45%] truncate" title={rawHeader}>
                  {rawHeader}
                </span>
                <span className="text-slate-600 px-1 text-[10px]">➔</span>
                <span className="text-violet-400 bg-violet-950/30 border border-violet-500/10 px-2 py-1 rounded-md max-w-[45%] truncate" title={crmField}>
                  {crmField}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("imported")}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === "imported"
                ? "bg-violet-950/40 border border-violet-500/30 text-violet-300 shadow-md shadow-violet-950/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            Imported ({totalImported})
          </button>
          <button
            onClick={() => setActiveTab("skipped")}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === "skipped"
                ? "bg-rose-950/20 border border-rose-500/30 text-rose-300 shadow-md shadow-rose-950/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            Skipped ({totalSkipped})
          </button>
        </div>

        <button
          onClick={resetFlow}
          className="self-start sm:self-center px-5 py-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300 rounded-xl text-xs font-semibold active:scale-[0.98] transition-all duration-200"
        >
          Import Another File
        </button>
      </div>

      {/* Content View */}
      {activeTab === "imported" ? (
        imported.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-sm text-slate-500">No records were imported successfully.</p>
          </div>
        ) : (
          /* Imported Table */
          <div className="w-full overflow-auto max-h-[420px] border border-slate-800/80 rounded-xl scrollbar-thin">
            <table className="w-full border-collapse text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800">
                  <th className="sticky top-0 px-4 py-3.5 font-semibold text-slate-200 bg-slate-900/90 whitespace-nowrap">Name</th>
                  <th className="sticky top-0 px-4 py-3.5 font-semibold text-slate-200 bg-slate-900/90 whitespace-nowrap">Email</th>
                  <th className="sticky top-0 px-4 py-3.5 font-semibold text-slate-200 bg-slate-900/90 whitespace-nowrap">Phone</th>
                  <th className="sticky top-0 px-4 py-3.5 font-semibold text-slate-200 bg-slate-900/90 whitespace-nowrap">Status</th>
                  <th className="sticky top-0 px-4 py-3.5 font-semibold text-slate-200 bg-slate-900/90 whitespace-nowrap">Source</th>
                  <th className="sticky top-0 px-4 py-3.5 font-semibold text-slate-200 bg-slate-900/90 whitespace-nowrap">Created At</th>
                  <th className="sticky top-0 px-4 py-3.5 font-semibold text-slate-200 bg-slate-900/90 whitespace-nowrap">Possession</th>
                  <th className="sticky top-0 px-4 py-3.5 font-semibold text-slate-200 bg-slate-900/90 whitespace-nowrap">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {imported.map((record, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-900/20 transition-colors duration-150 odd:bg-slate-950/20"
                  >
                    <td className="px-4 py-3.5 font-medium text-slate-200 whitespace-nowrap">{record.name || "-"}</td>
                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">{record.email || "-"}</td>
                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                      {record.country_code ? `${record.country_code} ` : ""}
                      {record.mobile_without_country_code || "-"}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {record.crm_status ? (
                        <span className="px-2.5 py-1 bg-violet-950/40 border border-violet-800/30 text-violet-300 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                          {record.crm_status.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {record.data_source ? (
                        <span className="px-2.5 py-1 bg-indigo-950/40 border border-indigo-800/30 text-indigo-300 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                          {record.data_source.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">{formatDate(record.created_at)}</td>
                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap capitalize">{record.possession_time || "-"}</td>
                    <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate" title={record.crm_note}>
                      {record.crm_note || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : skipped.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
          <p className="text-sm text-slate-500">No skipped records. All rows were imported!</p>
        </div>
      ) : (
        /* Skipped Table */
        <div className="space-y-4">
          <div className="w-full overflow-auto max-h-[420px] border border-slate-800/80 rounded-xl scrollbar-thin">
            <table className="w-full border-collapse text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800">
                  <th className="sticky top-0 px-4 py-3.5 font-semibold text-slate-200 bg-slate-900/90 whitespace-nowrap w-20">Row #</th>
                  <th className="sticky top-0 px-4 py-3.5 font-semibold text-slate-200 bg-slate-900/90 whitespace-nowrap w-1/3">Reason</th>
                  <th className="sticky top-0 px-4 py-3.5 font-semibold text-slate-200 bg-slate-900/90 whitespace-nowrap">Input Snapshot</th>
                  <th className="sticky top-0 px-4 py-3.5 font-semibold text-slate-200 bg-slate-900/90 whitespace-nowrap w-24 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {skipped.map((record, idx) => {
                  const isExpanded = !!expandedRows[record.rowIndex];
                  const emailVal = record.rawRow ? Object.entries(record.rawRow).find(([k]) => k.toLowerCase().includes("email"))?.[1] : "";
                  const phoneVal = record.rawRow ? Object.entries(record.rawRow).find(([k]) => k.toLowerCase().includes("phone") || k.toLowerCase().includes("mobile") || k.toLowerCase().includes("contact"))?.[1] : "";
                  
                  return (
                    <React.Fragment key={idx}>
                      <tr
                        className={`hover:bg-rose-950/10 transition-colors duration-150 ${
                          isExpanded ? "bg-rose-950/5" : "odd:bg-slate-950/10"
                        }`}
                      >
                        <td className="px-4 py-4 font-bold text-rose-400">
                          {record.rowIndex}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
                            <span className="text-slate-300 font-medium">{record.reason}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          <span className="text-slate-400">
                            {emailVal || phoneVal ? (
                              <>
                                {emailVal && <span className="mr-2">Email: {String(emailVal)}</span>}
                                {phoneVal && <span>Phone: {String(phoneVal)}</span>}
                              </>
                            ) : (
                              "No primary contact fields found"
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => toggleRow(record.rowIndex)}
                            className="inline-flex items-center gap-1 py-1 px-2.5 border border-slate-850 hover:border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg transition-all duration-150"
                          >
                            <span className="text-[10px] font-semibold">Inspect</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Collapsible Row Detail */}
                      {isExpanded && (
                        <tr className="bg-slate-950/30 border-t-0">
                          <td colSpan={4} className="px-6 py-4 border-r border-l border-slate-900">
                            <div className="p-4 bg-slate-900/50 border border-slate-850 rounded-xl animate-in slide-in-from-top-1 duration-200">
                              <h5 className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                                <Info className="w-3.5 h-3.5 text-rose-400" />
                                Raw CSV Row Columns
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                                {record.rawRow && Object.entries(record.rawRow).length > 0 ? (
                                  Object.entries(record.rawRow).map(([key, val]) => (
                                    <div
                                      key={key}
                                      className="p-2.5 bg-slate-950/20 border border-slate-900/80 rounded-lg flex flex-col gap-1"
                                    >
                                      <span className="text-[10px] text-slate-500 font-medium truncate" title={key}>
                                        {key}
                                      </span>
                                      <span className="text-slate-300 font-mono break-all">
                                        {val !== undefined && val !== null && val !== "" ? String(val) : <span className="text-slate-700 italic">empty</span>}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-slate-600 italic">No row context available</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
