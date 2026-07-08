import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import { ImportState, PreviewData, ImportResponse } from "../lib/types";
import { uploadCsvFile } from "../lib/api";

export function useCsvImport() {
  const [state, setState] = useState<ImportState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [totalRows, setTotalRows] = useState<number>(0);
  
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Clear progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    setState("parsing");
    setErrorMessage(null);
    setProgress(0);

    // Limit file size to 200MB
    if (selectedFile.size > 200 * 1024 * 1024) {
      setErrorMessage("File exceeds 200MB limit. Please upload a smaller file.");
      setState("error");
      return;
    }

    // Limit file type to CSV
    if (!selectedFile.name.endsWith(".csv") && selectedFile.type !== "text/csv") {
      setErrorMessage("Only CSV files (.csv) are supported.");
      setState("error");
      return;
    }

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string>[];
        
        if (rows.length === 0) {
          setErrorMessage("The uploaded CSV file contains no data rows.");
          setState("error");
          return;
        }

        setPreviewData({
          headers,
          // Only store first 50 rows for preview to prevent DOM rendering bottlenecks
          rows: rows.slice(0, 50)
        });
        
        setFile(selectedFile);
        setTotalRows(rows.length);
        setState("preview");
      },
      error: (error) => {
        setErrorMessage(`CSV parsing error: ${error.message}`);
        setState("error");
      }
    });
  };

  const handleConfirm = async () => {
    if (!file) return;

    setState("uploading");
    setProgress(5); // 5% for upload start
    setErrorMessage(null);

    // Estimate processing duration based on batch size of 15 (approx. 1.5s per batch)
    const batchCount = Math.ceil(totalRows / 15);
    const estimatedSeconds = batchCount * 1.5;
    const tickTime = (estimatedSeconds * 1000) / 90; // Tick 90 times to reach ~95%
    
    let currentProgress = 5;

    // Start progress simulation
    progressInterval.current = setInterval(() => {
      setState("processing");
      currentProgress += 1;
      
      if (currentProgress >= 95) {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      } else {
        setProgress(currentProgress);
      }
    }, tickTime);

    try {
      const response = await uploadCsvFile(file);
      
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      
      setProgress(100);
      setImportResult(response);
      setState("done");
    } catch (error: any) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      setErrorMessage(error.message || "An unexpected error occurred during import.");
      setState("error");
    }
  };

  const reset = () => {
    setState("idle");
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    setErrorMessage(null);
    setProgress(0);
    setTotalRows(0);
  };

  return {
    state,
    file,
    previewData,
    importResult,
    errorMessage,
    progress,
    totalRows,
    handleFileSelect,
    handleConfirm,
    reset
  };
}
