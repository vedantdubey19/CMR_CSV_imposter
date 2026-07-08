"use client";

import React from "react";
import { ImportState } from "../lib/types";
import { Brain, Cpu, Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  state: ImportState;
  progress: number;
  totalRows: number;
}

export default function ProgressIndicator({
  state,
  progress,
  totalRows
}: ProgressIndicatorProps) {
  const isUploading = state === "uploading";
  const isProcessing = state === "processing";

  // Compute number of batches based on row count
  const batchSize = 15;
  const totalBatches = Math.ceil(totalRows / batchSize);
  const currentBatch = Math.min(
    totalBatches,
    Math.max(1, Math.floor((progress / 100) * totalBatches))
  );

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-950/40 border border-slate-800/80 rounded-2xl p-8 shadow-xl backdrop-blur-md text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative p-5 bg-violet-950/20 border border-violet-800/40 rounded-full text-violet-400">
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Brain className="w-8 h-8 animate-pulse text-indigo-400" />
            )}
          </div>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-slate-200 mb-2">
        {isUploading ? "Uploading CSV File..." : "AI Pipeline Running..."}
      </h3>
      <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
        {isUploading
          ? "Sending CSV buffer to secure, stateless API gateway."
          : `Mapping columns with LLM engine. Processing batch ${currentBatch} of ${totalBatches}.`}
      </p>

      {/* Progress Bar Container */}
      <div className="w-full bg-slate-900 border border-slate-800/80 rounded-full h-3 mb-3 p-0.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out shadow-lg shadow-violet-500/25 relative"
          style={{ width: `${progress}%` }}
        >
          {/* Animated shine highlight */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.25)_50%,transparent_100%)] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>

      {/* Text percentage & stats */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>{isUploading ? "Uploading payload..." : "LLM inference logic..."}</span>
        <span className="font-semibold text-slate-300">{progress}%</span>
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 mt-6 py-2 px-4 bg-slate-900/60 border border-slate-800/60 rounded-xl max-w-fit mx-auto text-xs text-slate-400">
          <Cpu className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
          <span>Status: Batch {currentBatch}/{totalBatches} ({totalRows} rows total)</span>
        </div>
      )}
    </div>
  );
}
