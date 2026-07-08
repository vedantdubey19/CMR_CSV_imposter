"use client";

import React from "react";
import { useCsvImport } from "../hooks/useCsvImport";
import UploadZone from "../components/UploadZone";
import CsvPreviewTable from "../components/CsvPreviewTable";
import ConfirmImportButton from "../components/ConfirmImportButton";
import ProgressIndicator from "../components/ProgressIndicator";
import ImportResultTable from "../components/ImportResultTable";
import { AlertOctagon, RefreshCw, Layers, Sparkles } from "lucide-react";

export default function Home() {
  const {
    state,
    previewData,
    importResult,
    errorMessage,
    progress,
    totalRows,
    handleFileSelect,
    handleConfirm,
    reset
  } = useCsvImport();

  const isIdle = state === "idle" || state === "parsing";
  const isPreview = state === "preview";
  const isProcessing = state === "uploading" || state === "processing";
  const isDone = state === "done" && importResult;
  const isError = state === "error";

  return (
    <main className="relative min-h-screen flex flex-col justify-between bg-[#030712] text-slate-100 overflow-x-hidden">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-1/4 -z-10 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 -z-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center py-16 px-4 max-w-5xl w-full mx-auto">
        
        {/* Header Section */}
        <header className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-full mb-6 text-xs text-slate-300 font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>LLM-Powered Mapping Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 mb-4">
            AI-Powered CSV Importer
          </h1>
          <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Upload arbitrary CSV structures from Facebook Lead Ads, Google Ads, or CRMs. The AI maps columns to the GrowEasy schema in real time.
          </p>
        </header>

        {/* Content Dynamic Layout */}
        <section className="w-full flex-1 flex flex-col items-center justify-center gap-8">
          {isIdle && (
            <UploadZone
              onFileSelect={handleFileSelect}
              isLoading={state === "parsing"}
            />
          )}

          {isPreview && previewData && (
            <div className="w-full space-y-6">
              <CsvPreviewTable data={previewData} totalRows={totalRows} />
              <ConfirmImportButton
                onConfirm={handleConfirm}
                isLoading={isProcessing}
                totalRows={totalRows}
              />
            </div>
          )}

          {isProcessing && (
            <ProgressIndicator
              state={state}
              progress={progress}
              totalRows={totalRows}
            />
          )}

          {isDone && importResult && (
            <ImportResultTable result={importResult} resetFlow={reset} />
          )}

          {isError && (
            <div className="w-full max-w-md bg-slate-950/40 border border-rose-500/20 rounded-2xl p-8 text-center shadow-xl backdrop-blur-md animate-in zoom-in-95 duration-200">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-full text-rose-400 animate-bounce">
                  <AlertOctagon className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Import Blocked</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                {errorMessage || "An unexpected error occurred while parsing or importing files."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={reset}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium shadow-md shadow-rose-600/10 active:scale-[0.98] transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer Section */}
      <footer className="py-8 px-4 border-t border-slate-900 bg-slate-950/20 text-center">
        <div className="max-w-5xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-semibold text-slate-400">
            <Layers className="w-4 h-4 text-violet-500" />
            <span>GrowEasy CRM Importer Pipeline</span>
          </div>
          <p>© 2026 GrowEasy. Dedicated stateless pipeline.</p>
        </div>
      </footer>
    </main>
  );
}
