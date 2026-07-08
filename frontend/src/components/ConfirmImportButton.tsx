"use client";

import React from "react";
import { ArrowRight, Play } from "lucide-react";

interface ConfirmImportButtonProps {
  onConfirm: () => void;
  isLoading: boolean;
  totalRows: number;
}

export default function ConfirmImportButton({
  onConfirm,
  isLoading,
  totalRows
}: ConfirmImportButtonProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
      <button
        onClick={onConfirm}
        disabled={isLoading}
        className="relative group flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl text-base shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
      >
        <span>Launch AI CSV Importer</span>
        <Play className="w-4 h-4 fill-white" />
      </button>
      <span className="text-xs text-slate-500">
        Will map {totalRows} records in batches of 15 to prevent AI model truncation.
      </span>
    </div>
  );
}
