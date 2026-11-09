"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  Binary,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings2,
} from "lucide-react";

interface ExportOptionsCardProps {
  datasetId: string;
  datasetName: string;
}

export function ExportOptionsCard({ datasetId, datasetName }: ExportOptionsCardProps) {
  const [format, setFormat] = useState<"excel" | "csv" | "json" | "parquet">("excel");

  // Excel options
  const [sheetName, setSheetName] = useState("Data");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [includeDictionary, setIncludeDictionary] = useState(true);

  // CSV options
  const [delimiter, setDelimiter] = useState(",");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeIndex, setIncludeIndex] = useState(false);
  const [encoding, setEncoding] = useState("utf-8");

  // JSON options
  const [orient, setOrient] = useState<"records" | "split" | "index" | "columns">("records");
  const [indent, setIndent] = useState(2);

  // Download state
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const triggerBrowserDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setDownloading(true);
    setDownloadSuccess(null);
    setDownloadError(null);

    try {
      if (format === "excel") {
        const { blob, filename } = await api.exportDatasetExcel(datasetId, {
          sheet_name: sheetName,
          include_metadata: includeMetadata,
          include_stats: includeStats,
          include_dictionary: includeDictionary,
        });
        triggerBrowserDownload(blob, filename);
        setDownloadSuccess(`Exported "${filename}" successfully.`);
      } else if (format === "csv") {
        const { blob, filename } = await api.exportDatasetCSV(datasetId, {
          delimiter,
          include_header: includeHeader,
          include_index: includeIndex,
          encoding,
        });
        triggerBrowserDownload(blob, filename);
        setDownloadSuccess(`Exported "${filename}" successfully.`);
      } else if (format === "json") {
        const { blob, filename } = await api.exportDatasetJSON(datasetId, {
          orient,
          indent,
        });
        triggerBrowserDownload(blob, filename);
        setDownloadSuccess(`Exported "${filename}" successfully.`);
      } else if (format === "parquet") {
        const { blob, filename } = await api.exportDatasetParquet(datasetId);
        triggerBrowserDownload(blob, filename);
        setDownloadSuccess(`Exported "${filename}" successfully.`);
      }
    } catch (err: any) {
      setDownloadError(err.message || "Export failed.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Export Studio
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Target: <strong className="text-slate-700 dark:text-slate-300">{datasetName}</strong>
          </span>
        </div>

        {/* Format Switcher Tabs */}
        <div className="grid grid-cols-4 gap-2 pt-4">
          <button
            type="button"
            onClick={() => {
              setFormat("excel");
              setDownloadSuccess(null);
            }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
              format === "excel"
                ? "border-emerald-500 bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500 shadow-xs"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFormat("csv");
              setDownloadSuccess(null);
            }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
              format === "csv"
                ? "border-indigo-500 bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500 shadow-xs"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <FileText className="w-5 h-5 text-indigo-500" />
            <span>CSV (.csv)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFormat("json");
              setDownloadSuccess(null);
            }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
              format === "json"
                ? "border-amber-500 bg-amber-50/80 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500 shadow-xs"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <FileCode className="w-5 h-5 text-amber-500" />
            <span>JSON (.json)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFormat("parquet");
              setDownloadSuccess(null);
            }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
              format === "parquet"
                ? "border-sky-500 bg-sky-50/80 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-500 shadow-xs"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Binary className="w-5 h-5 text-sky-500" />
            <span>Parquet</span>
          </button>
        </div>

        {/* Tab Specific Options Form */}
        <div className="pt-5 pb-4 space-y-4">
          {format === "excel" && (
            <div className="space-y-3 animate-in fade-in">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Primary Data Tab Name
                </label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Include Metadata & Dataset Properties Sheet
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDictionary}
                    onChange={(e) => setIncludeDictionary(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Include Column Dictionary & Types Sheet
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeStats}
                    onChange={(e) => setIncludeStats(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Include Numerical Summary Statistics Sheet
                  </span>
                </label>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed">
                OpenPyXL styled workbook with frozen header rows, automatic column widths, and alternating zebra stripes.
              </div>
            </div>
          )}

          {format === "csv" && (
            <div className="space-y-3 animate-in fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Delimiter / Separator
                  </label>
                  <select
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value=",">Comma (,)</option>
                    <option value=";">Semicolon (;)</option>
                    <option value="\t">Tab (\t)</option>
                    <option value="|">Pipe (|)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Encoding
                  </label>
                  <select
                    value={encoding}
                    onChange={(e) => setEncoding(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="utf-8">UTF-8 (Standard)</option>
                    <option value="utf-8-sig">UTF-8 with BOM (Excel-compatible)</option>
                    <option value="latin1">Latin-1 / ISO-8859-1</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHeader}
                    onChange={(e) => setIncludeHeader(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Include Column Header Row
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeIndex}
                    onChange={(e) => setIncludeIndex(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Include Row Index Numbers
                  </span>
                </label>
              </div>
            </div>
          )}

          {format === "json" && (
            <div className="space-y-3 animate-in fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    JSON Structure Orient
                  </label>
                  <select
                    value={orient}
                    onChange={(e) => setOrient(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="records">Records Array ([&#123;&#125;, &#123;&#125;])</option>
                    <option value="split">Split (&#123;columns, data&#125;)</option>
                    <option value="index">Keyed by Row Index</option>
                    <option value="columns">Keyed by Columns</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Indentation
                  </label>
                  <select
                    value={indent}
                    onChange={(e) => setIndent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={0}>Compact (Single line)</option>
                    <option value={2}>2 spaces (Standard)</option>
                    <option value={4}>4 spaces (Pretty)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {format === "parquet" && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed animate-in fade-in">
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Apache Parquet Columnar Storage
              </p>
              Direct binary columnar format optimized for analytical queries, Pandas, Polars, DuckDB, Spark, and cloud data warehouses.
            </div>
          )}
        </div>

        {/* Feedback Alerts */}
        {downloadSuccess && (
          <div className="mb-4 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {downloadError && (
          <div className="mb-4 p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{downloadError}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button
          size="md"
          variant="primary"
          onClick={handleExport}
          disabled={downloading}
          className="w-full text-xs font-semibold shadow-xs"
        >
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating {format.toUpperCase()}...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download {format.toUpperCase()} File
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
