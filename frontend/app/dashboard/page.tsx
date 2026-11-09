"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Database,
  ArrowRight,
  Layers,
  Sparkles,
  TableProperties,
  ShieldAlert,
  Clock,
  ListFilter,
} from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { UploadDropzone } from "@/components/dashboard/upload-dropzone";
import { DatasetCard } from "@/components/dashboard/dataset-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";

export default function DashboardPage() {
  const { allDatasets, activeDataset, backendOnline } = useDataset();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-8 sm:p-10 text-white shadow-xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Intelligent Data Analysis Workspace • Phase 1 Active</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            DataPilot AI
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Your high-performance graphical workspace for data analysis. Upload Excel, CSV, or JSON datasets, inspect structures, execute Pandas-level workflows, and gain instant visibility into your records without writing boilerplate code.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload Dataset
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => setIsDbModalOpen(true)}
              className="border-slate-700 text-slate-200 hover:bg-slate-800/80"
            >
              <Database className="w-4 h-4 mr-2" />
              Connect Database
            </Button>

            {activeDataset && (
              <Link href={`/data-sources?id=${activeDataset.id}`}>
                <Button
                  variant="subtle"
                  size="md"
                  className="bg-white/10 text-white hover:bg-white/20 border border-white/10"
                >
                  <TableProperties className="w-4 h-4 mr-2" />
                  View Active Dataset
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Backend Offline Warning if applicable */}
      {!backendOnline && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-semibold">FastAPI Backend is currently not reachable.</p>
              <p className="text-rose-600 dark:text-rose-400 mt-0.5">
                Ensure you have started the backend server with: <code className="bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded font-mono text-[11px]">.\venv\Scripts\uvicorn backend.app.main:app --reload</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Stats Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Workspace Overview</span>
          </h2>
        </div>
        <StatsOverview />
      </div>

      {/* Main 2-Column Section: Drag-and-Drop & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: In-Page Drag & Drop Upload */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Import Dataset</CardTitle>
            <CardDescription>
              Drag and drop any spreadsheet or tabular data to immediately parse schema, datatypes, and calculate missing values.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadDropzone />
          </CardContent>
        </Card>

        {/* Right 1 Col: Quick Operation Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Operation Shortcuts</CardTitle>
            <CardDescription>
              Instant shortcuts to active dataset analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {activeDataset ? (
              <>
                <Link href={`/data-sources?id=${activeDataset.id}&tab=preview`}>
                  <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        <TableProperties className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          Data Table Preview
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Browse all {activeDataset.row_count.toLocaleString()} rows
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </Link>

                <Link href={`/data-sources?id=${activeDataset.id}&tab=schema`}>
                  <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                        <ListFilter className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          Column Schema & Dtypes
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Inspect {activeDataset.column_count} columns & types
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </Link>

                <Link href="/data-explorer">
                  <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          Pandas Operation Studio
                        </p>
                        <p className="text-[11px] text-slate-500">
                          head, tail, describe, sort, filter
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </Link>
              </>
            ) : (
              <div className="p-6 text-center text-slate-400 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs font-medium">No active dataset selected</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Upload a file above to unlock one-click operations.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Datasets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Uploaded Datasets</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your local datasets or switch active workspaces.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            className="text-xs"
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
            Upload New File
          </Button>
        </div>

        {allDatasets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allDatasets.map((ds) => (
              <DatasetCard key={ds.id} dataset={ds} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-500">
                <Layers className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No datasets in workspace yet
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                Get started by uploading your first CSV, Excel workbook, or JSON file.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-2"
              >
                <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                Upload Dataset
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Dataset"
        description="Select or drag a file to load into DataPilot AI."
        maxWidth="xl"
      >
        <UploadDropzone onSuccess={() => setIsUploadModalOpen(false)} />
      </Modal>

      {/* Database Modal */}
      <Modal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        title="Database Connector"
        description="Direct relational database connectivity."
        maxWidth="md"
      >
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200">
            <p className="font-semibold mb-1">Scheduled for Phase 6</p>
            <p>
              Phase 6 will include the full connection manager for SQLite, PostgreSQL, and MySQL, with table schema explorers and read-only parameterized SQL editors.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsDbModalOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
