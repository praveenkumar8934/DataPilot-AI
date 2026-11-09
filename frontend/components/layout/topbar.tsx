"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { UploadDropzone } from "@/components/dashboard/upload-dropzone";

export function Topbar() {
  const {
    activeDataset,
    allDatasets,
    backendOnline,
    refreshDatasets,
    setActiveDatasetId,
    isLoading,
  } = useDataset();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
        {/* Left Section: Active Dataset Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-400" />
            <select
              value={activeDataset?.id || ""}
              onChange={(e) => {
                if (e.target.value) {
                  setActiveDatasetId(e.target.value);
                }
              }}
              className="text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[240px] truncate cursor-pointer"
            >
              <option value="" disabled>
                {allDatasets.length === 0
                  ? "No datasets uploaded"
                  : "Select active dataset..."}
              </option>
              {allDatasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.original_name} ({ds.row_count.toLocaleString()} rows)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => refreshDatasets()}
            title="Refresh datasets"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Right Section: Actions & Backend Indicator */}
        <div className="flex items-center gap-3">
          {/* Backend Online status pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium">
            {backendOnline ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-slate-700 dark:text-slate-300">
                  Backend Online
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-rose-600 dark:text-rose-400">
                  Backend Offline
                </span>
              </>
            )}
          </div>

          {/* Connect Database Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDbModalOpen(true)}
            className="text-xs"
          >
            <Database className="w-3.5 h-3.5 mr-1" />
            Connect DB
          </Button>

          {/* Upload Dataset Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="text-xs shadow-sm"
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
            Upload Dataset
          </Button>
        </div>
      </header>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Dataset"
        description="Upload CSV, Excel (.xlsx, .xls) or JSON files to start analyzing."
        maxWidth="xl"
      >
        <UploadDropzone
          onSuccess={() => {
            setIsUploadOpen(false);
          }}
        />
      </Modal>

      {/* Connect Database Modal */}
      <Modal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        title="Database Connector"
        description="Direct database connection and SQL querying module."
        maxWidth="lg"
      >
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200">
            <p className="font-semibold mb-1 flex items-center gap-1.5">
              <span>Scheduled for Phase 6</span>
            </p>
            <p>
              Direct connectors for <strong>SQLite</strong>, <strong>PostgreSQL</strong>, and <strong>MySQL</strong> with read-only SQL querying and table preview are scheduled for implementation in Phase 6 as per project roadmap.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsDbModalOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

