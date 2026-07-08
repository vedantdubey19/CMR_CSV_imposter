"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, AlertCircle } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export default function UploadZone({ onFileSelect, isLoading }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndSelectFile = (file: File) => {
    setError(null);

    // Limit to 200MB
    if (file.size > 200 * 1024 * 1024) {
      setError("File exceeds 200MB limit. Please upload a smaller file.");
      return;
    }

    // Limit to CSV
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setError("Only CSV files (.csv) are supported.");
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative group cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${
          isDragActive
            ? "border-violet-500 bg-violet-950/20 shadow-lg shadow-violet-500/10 scale-[1.01]"
            : "border-slate-800 bg-slate-950/30 hover:border-slate-700 hover:bg-slate-900/10"
        } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
      >
        {/* Glow decoration */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleChange}
          disabled={isLoading}
        />

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-full text-slate-400 group-hover:text-violet-400 group-hover:border-violet-500/30 group-hover:bg-violet-950/30 transition-all duration-300 mb-6">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-semibold text-slate-200 mb-2 text-center group-hover:text-violet-300 transition-colors duration-300">
          Drag & drop your CSV file
        </h2>
        <p className="text-sm text-slate-400 mb-6 text-center max-w-md leading-relaxed">
          Select files under <span className="text-slate-300 font-medium">200MB</span>. The AI engine will dynamically map fields into the CRM database schema.
        </p>

        <button
          type="button"
          disabled={isLoading}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium shadow-md shadow-violet-600/20 active:scale-[0.98] transition-all duration-200"
        >
          Browse Files
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 mt-4 p-4 border border-rose-500/20 bg-rose-950/10 rounded-xl text-rose-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
