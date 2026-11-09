"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileJson,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UploadDropzoneProps {
  onSuccess?: () => void;
  className?: string;
}

const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls", ".json"];

export function UploadDropzone({ onSuccess, className }: UploadDropzoneProps) {
  const { uploadDatasetFile } = useDataset();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      setErrorMessage(
        `Invalid file type. Supported formats are: ${ALLOWED_EXTENSIONS.join(", ")}`
      );
      return false;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage("File exceeds 100 MB limit.");
      return false;
    }

    if (file.size === 0) {
      setErrorMessage("File is empty (0 bytes).");
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const metadata = await uploadDatasetFile(selectedFile);
      setSuccessMessage(
        `Successfully loaded "${metadata.original_name}" (${metadata.row_count.toLocaleString()} rows, ${metadata.column_count} columns)`
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload and parse dataset");
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".csv")) return <FileText className="w-6 h-6 text-emerald-500" />;
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls"))
      return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
    if (lower.endsWith(".json")) return <FileJson className="w-6 h-6 text-amber-500" />;
    return <FileText className="w-6 h-6 text-indigo-500" />;
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.xlsx,.xls,.json"
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]"
            : "border-slate-300 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white/50 dark:bg-slate-900/40"
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Drag & drop your dataset here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports CSV, Excel (.xlsx, .xls), and JSON files up to 100 MB
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Badge variant="outline" size="sm">.CSV</Badge>
            <Badge variant="outline" size="sm">.XLSX</Badge>
            <Badge variant="outline" size="sm">.XLS</Badge>
            <Badge variant="outline" size="sm">.JSON</Badge>
          </div>
        </div>
      </div>

      {/* Selected File State */}
      {selectedFile && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {getFileIcon(selectedFile.name)}
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isUploading}
              onClick={handleUpload}
            >
              Parse & Load Dataset
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
}

