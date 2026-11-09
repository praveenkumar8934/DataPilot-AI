"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Database,
  TableProperties,
  ListFilter,
  Calendar,
  UploadCloud,
  FileSpreadsheet,
} from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { api } from "@/lib/api";
import { DatasetMetadata } from "@/types/dataset";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { UploadDropzone } from "@/components/dashboard/upload-dropzone";

function DataSourcesContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");
  const defaultTab = searchParams.get("tab") === "schema" ? "schema" : "preview";

  const { activeDataset, allDatasets, setActiveDatasetId } = useDataset();

  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [currentDataset, setCurrentDataset] = useState<DatasetMetadata | null>(null);
  const [_loadingDataset, setLoadingDataset] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"preview" | "schema">(defaultTab);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Sync selected dataset ID from query param or active dataset
  useEffect(() => {
    if (queryId) {
      setSelectedDatasetId(queryId);
    } else if (activeDataset) {
      setSelectedDatasetId(activeDataset.id);
    } else if (allDatasets.length > 0) {
      setSelectedDatasetId(allDatasets[0].id);
    }
  }, [queryId, activeDataset, allDatasets]);

  // Load detailed metadata for selected dataset
  useEffect(() => {
    if (!selectedDatasetId) {
      setCurrentDataset(null);
      return;
    }

    let isMounted = true;
    setLoadingDataset(true);

    api
      .getDataset(selectedDatasetId)
      .then((data) => {
        if (isMounted) setCurrentDataset(data);
      })
      .catch((err) => {
        console.error("Failed to load dataset details:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingDataset(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDatasetId]);

  if (allDatasets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Data Sources & Preview
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Inspect imported datasets, schema types, and record samples.
            </p>
          </div>
        </div>

        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-500">
              <Database className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No datasets available
            </p>
            <p className="text-xs text-slate-500 max-w-sm">
              Upload a CSV, Excel (.xlsx, .xls) or JSON dataset to preview records and inspect its structure.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              className="mt-2"
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
              Upload Dataset
            </Button>
          </div>
        </Card>

        <Modal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          title="Upload Dataset"
          maxWidth="xl"
        >
          <UploadDropzone onSuccess={() => setIsUploadOpen(false)} />
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Dataset Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Data Sources & Preview</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full metadata inspection, schema typing, and interactive records explorer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Dataset:</span>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[280px] truncate"
            >
              {allDatasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.original_name} ({ds.row_count.toLocaleString()} rows)
                </option>
              ))}
            </select>
          </div>

          {currentDataset && !currentDataset.is_active && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await setActiveDatasetId(currentDataset.id);
                const updated = await api.getDataset(currentDataset.id);
                setCurrentDataset(updated);
              }}
              className="text-xs"
            >
              Set as Active
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="text-xs"
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Dataset Metadata Summary Card */}
      {currentDataset && (
        <Card className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-900 border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {currentDataset.original_name}
                    </h2>
                    <Badge variant="outline" size="sm">
                      {currentDataset.file_format}
                    </Badge>
                    {currentDataset.is_active && (
                      <Badge variant="success" size="sm">
                        Active Workspace Dataset
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Uploaded on {formatDateTime(currentDataset.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Storage File</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[200px] block">
                    {currentDataset.filename}
                  </span>
                </div>
              </div>
            </div>

            {/* Core Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 text-center">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Rows</span>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {currentDataset.row_count.toLocaleString()}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Columns</span>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {currentDataset.column_count}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">File Size</span>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {currentDataset.file_size_formatted}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Memory Usage</span>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {currentDataset.memory_usage_formatted}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Missing Values</span>
                <p className={`text-sm sm:text-base font-bold mt-0.5 ${
                  currentDataset.missing_values_count > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {currentDataset.missing_values_count.toLocaleString()} ({currentDataset.missing_percentage}%)
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Duplicate Rows</span>
                <p className={`text-sm sm:text-base font-bold mt-0.5 ${
                  currentDataset.duplicate_rows_count > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-slate-200"
                }`}>
                  {currentDataset.duplicate_rows_count.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "preview"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <TableProperties className="w-4 h-4" />
          <span>Interactive Data Table</span>
        </button>

        <button
          onClick={() => setActiveTab("schema")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "schema"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Schema & Data Types ({currentDataset?.column_count || 0})</span>
        </button>
      </div>

      {/* Tab Content */}
      {selectedDatasetId && (
        <div>
          {activeTab === "preview" ? (
            <DataTable datasetId={selectedDatasetId} />
          ) : (
            currentDataset && (
              <Card>
                <CardHeader>
                  <CardTitle>Column Inventory & Data Types</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                        <th className="py-2.5 px-4 font-semibold">Column Name</th>
                        <th className="py-2.5 px-4 font-semibold">Inferred Data Type</th>
                        <th className="py-2.5 px-4 font-semibold">Missing Count</th>
                        <th className="py-2.5 px-4 font-semibold">Missing %</th>
                        <th className="py-2.5 px-4 font-semibold">Unique Values</th>
                        <th className="py-2.5 px-4 font-semibold">Sample Values</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {currentDataset.columns.map((col, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {col.name}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {col.data_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={col.missing_count > 0 ? "text-amber-600 font-semibold" : "text-slate-600 dark:text-slate-400"}>
                              {col.missing_count.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={col.missing_percentage > 0 ? "text-amber-600 font-semibold" : "text-slate-600 dark:text-slate-400"}>
                              {col.missing_percentage}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                            {col.unique_count.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                            {col.sample_values && col.sample_values.length > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {col.sample_values.map((s, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200/60 dark:border-slate-700/60 truncate max-w-[120px]"
                                    title={String(s)}
                                  >
                                    {String(s)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="italic text-slate-400">None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Dataset"
        maxWidth="xl"
      >
        <UploadDropzone
          onSuccess={() => {
            setIsUploadOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

export default function DataSourcesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Loading Data Sources...
        </div>
      }
    >
      <DataSourcesContent />
    </Suspense>
  );
}
