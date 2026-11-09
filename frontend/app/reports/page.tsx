"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Printer,
  Sparkles,
  Database,
  History,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { DatasetMetadata } from "@/types/dataset";
import { ReportSummaryResponse } from "@/types/exports";
import { HealthScoreGauge } from "@/components/reports/health-score-gauge";
import { ExportOptionsCard } from "@/components/reports/export-options-card";
import { ColumnAuditTable } from "@/components/reports/column-audit-table";
import { ReportPreviewModal } from "@/components/reports/report-preview-modal";

export default function ReportsPage() {
  const [activeDataset, setActiveDataset] = useState<DatasetMetadata | null>(null);
  const [summary, setSummary] = useState<ReportSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "columns" | "exports">("overview");

  // Report Preview Modal state
  const [htmlReport, setHtmlReport] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const active = await api.getActiveDataset();
      setActiveDataset(active);
      if (active) {
        const repSummary = await api.getReportSummary(active.id);
        setSummary(repSummary);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load active dataset report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenPrintableReport = async () => {
    if (!activeDataset) return;
    setGeneratingReport(true);
    try {
      const html = await api.getReportHTML(activeDataset.id, {
        title: `DataPilot AI Executive Audit: ${activeDataset.original_name}`,
        author: "Data Analyst",
        include_summary_stats: true,
        include_quality_audit: true,
        include_cleaning_history: true,
      });
      setHtmlReport(html);
      setIsModalOpen(true);
    } catch (err: any) {
      alert("Failed to generate HTML report: " + (err.message || String(err)));
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Synthesizing data quality metrics and audit report...
        </p>
      </div>
    );
  }

  if (!activeDataset || !summary) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            <span>Reports & Exports Studio</span>
            <Badge variant="info" size="sm">
              Phase 7
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Export cleaned datasets, transformation logs, summary sheets, and executive audit reports.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs max-w-lg mx-auto">
          <Database className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3 opacity-60" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No Active Dataset Found
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Please upload a dataset or connect to a database table to generate reports and export files.
          </p>
          <div className="flex items-center justify-center gap-2 mt-5">
            <Link href="/data-sources">
              <Button size="sm" variant="primary" className="text-xs">
                Upload Dataset
              </Button>
            </Link>
            <Link href="/sql-workspace">
              <Button size="sm" variant="outline" className="text-xs">
                Open SQL Workspace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            <span>Reports & Exports Studio</span>
            <Badge variant="info" size="sm">
              Phase 7
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Executive data audit, multi-sheet styled Excel workbooks, RFC 4180 CSV, JSON, and print-ready PDF reports.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenPrintableReport}
            disabled={generatingReport}
            className="text-xs shadow-xs"
          >
            {generatingReport ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Preview & Print PDF Report
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setActiveTab("exports")}
            className="text-xs gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Export Dataset</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Health Score Gauge */}
      <HealthScoreGauge summary={summary} />

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
            activeTab === "overview"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Executive Briefing & Audit
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("columns")}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
            activeTab === "columns"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Column Profile Dictionary ({summary.columns_audit.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("exports")}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
            activeTab === "exports"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Export Studio (Excel / CSV / JSON)
        </button>
      </div>

      {/* Tab 1: Executive Briefing & Audit */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Recommendations Card (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Actionable Hygiene & Quality Recommendations
              </h2>
            </div>

            <div className="space-y-2.5">
              {summary.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Link href="/data-cleaning">
                <Button size="sm" variant="outline" className="text-xs h-7">
                  Fix in Data Cleaning Studio
                </Button>
              </Link>
              <Link href="/eda">
                <Button size="sm" variant="ghost" className="text-xs h-7 text-indigo-600">
                  Inspect in EDA Studio
                </Button>
              </Link>
            </div>
          </div>

          {/* Cleaning History Timeline (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <History className="w-4 h-4 text-indigo-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Data Transformation Log
              </h2>
              <Badge variant="default" size="sm" className="ml-auto">
                {summary.cleaning_history.length} operations
              </Badge>
            </div>

            {summary.cleaning_history.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                <p>No cleaning or transformation steps applied yet.</p>
                <p className="text-[11px] mt-1">
                  Actions applied in the Cleaning Studio or Pandas Engine will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {summary.cleaning_history.map((hist, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {hist.action_type}
                      </span>
                      <span>{hist.timestamp}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      {hist.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Column Profile Dictionary */}
      {activeTab === "columns" && (
        <ColumnAuditTable columns={summary.columns_audit} />
      )}

      {/* Tab 3: Export Studio */}
      {activeTab === "exports" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <ExportOptionsCard
              datasetId={activeDataset.id}
              datasetName={activeDataset.original_name}
            />
          </div>

          {/* Quick PDF Card */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Printer className="w-4 h-4 text-indigo-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Executive PDF Document
              </h2>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Generate a styled, printable HTML and vector PDF report including key performance indicators, data health score, quality audit table, and distribution summaries.
            </p>

            <div className="pt-2">
              <Button
                size="md"
                variant="primary"
                onClick={handleOpenPrintableReport}
                disabled={generatingReport}
                className="w-full text-xs shadow-xs"
              >
                {generatingReport ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    Open PDF Report Preview
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Preview Modal */}
      {htmlReport && (
        <ReportPreviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          htmlContent={htmlReport}
          datasetName={activeDataset.original_name}
        />
      )}
    </div>
  );
}
