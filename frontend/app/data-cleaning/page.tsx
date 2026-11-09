"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Undo2,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Eye,
  Activity,
  Layers,
  Database,
  Filter,
  Type,
} from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { api } from "@/lib/api";
import {
  CleaningSessionState,
  CleaningPreviewResponse,
  OutlierDetectionResult,
  MissingValueDetectionSummary,
} from "@/types/cleaning";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export default function DataCleaningPage() {
  const { activeDataset, refreshDatasets, setActiveDatasetId } = useDataset();

  // Cleaning Session State
  const [session, setSession] = useState<CleaningSessionState | null>(null);
  const [_loadingSession, setLoadingSession] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active Tool Tab
  const [activeTool, setActiveTool] = useState<"missing" | "duplicates" | "outliers" | "columns" | "text">("missing");

  // Detection Reports
  const [missingSummary, setMissingSummary] = useState<MissingValueDetectionSummary | null>(null);
  const [outlierResults, setOutlierResults] = useState<OutlierDetectionResult[]>([]);
  const [outlierMethod, setOutlierMethod] = useState<"IQR" | "Z-score">("IQR");
  const [outlierThreshold, setOutlierThreshold] = useState<number>(1.5);

  // Preview State
  const [previewData, setPreviewData] = useState<CleaningPreviewResponse | null>(null);
  const [pendingAction, setPendingAction] = useState<{ operation: string; params: Record<string, any> } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  // Save Version Dialog
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [versionName, setVersionName] = useState<string>("");

  // Tool Form States
  // 1. Missing Values Form
  const [missingHow, setMissingHow] = useState<"any" | "all">("any");
  const [missingSubsetCol, setMissingSubsetCol] = useState<string>("");
  const [fillCol, setFillCol] = useState<string>("");
  const [fillStrategy, setFillStrategy] = useState<string>("mean");
  const [fillConstantVal, setFillConstantVal] = useState<string>("");

  // 2. Duplicates Form
  const [dupKeep, setDupKeep] = useState<"first" | "last">("first");
  const [dupSubset, setDupSubset] = useState<string[]>([]);

  // 3. Outlier Handling Form
  const [outlierCol, setOutlierCol] = useState<string>("");
  const [outlierAction, setOutlierAction] = useState<"cap" | "remove_rows" | "set_null" | "impute_median">("cap");

  // 4. Column Transformation Form
  const [renameOld, setRenameOld] = useState<string>("");
  const [renameNew, setRenameNew] = useState<string>("");
  const [dtypeCol, setDtypeCol] = useState<string>("");
  const [targetDtype, setTargetDtype] = useState<string>("float");

  // 5. Text Standardization Form
  const [textCol, setTextCol] = useState<string>("");
  const [textCase, setTextCase] = useState<"lower" | "upper" | "title">("lower");
  const [stripSpecial, setStripSpecial] = useState<boolean>(false);
  const [replaceCol, setReplaceCol] = useState<string>("");
  const [findVal, setFindVal] = useState<string>("");
  const [replaceVal, setReplaceVal] = useState<string>("");

  // Load Session and Detections
  const loadSessionData = useCallback(async () => {
    if (!activeDataset) return;
    setLoadingSession(true);
    try {
      const [sess, missing, outliers] = await Promise.all([
        api.getCleaningSession(activeDataset.id),
        api.detectMissingValues(activeDataset.id),
        api.detectOutliers(activeDataset.id, { method: outlierMethod, threshold: outlierThreshold }),
      ]);
      setSession(sess);
      setMissingSummary(missing);
      setOutlierResults(outliers);

      // Set default selected columns for forms if available
      if (activeDataset.columns.length > 0) {
        setMissingSubsetCol("");
        setFillCol(activeDataset.columns[0].name);
        setRenameOld(activeDataset.columns[0].name);
        setDtypeCol(activeDataset.columns[0].name);
        setTextCol(activeDataset.columns[0].name);
        setReplaceCol(activeDataset.columns[0].name);
        const firstNum = activeDataset.columns.find((c) =>
          c.data_type.includes("int") || c.data_type.includes("float")
        );
        if (firstNum) setOutlierCol(firstNum.name);
      }
    } catch (err: any) {
      console.error("Failed to load cleaning session:", err);
    } finally {
      setLoadingSession(false);
    }
  }, [activeDataset, outlierMethod, outlierThreshold]);

  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  // Request Preview of a Cleaning Action
  const handlePreview = async (operation: string, params: Record<string, any>) => {
    if (!activeDataset) return;
    setActionLoading(true);
    setNotification(null);
    try {
      const prev = await api.previewCleaningAction({
        dataset_id: activeDataset.id,
        operation,
        params,
      });
      setPreviewData(prev);
      setPendingAction({ operation, params });
      setIsPreviewModalOpen(true);
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to generate preview" });
    } finally {
      setActionLoading(false);
    }
  };

  // Commit and Apply Action
  const handleApply = async () => {
    if (!activeDataset || !pendingAction) return;
    setActionLoading(true);
    try {
      const res = await api.applyCleaningAction({
        dataset_id: activeDataset.id,
        operation: pendingAction.operation,
        params: pendingAction.params,
      });
      setSession(res.session_state);
      setIsPreviewModalOpen(false);
      setPreviewData(null);
      setPendingAction(null);
      setNotification({ type: "success", text: res.message });
      // Reload detections
      await loadSessionData();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to apply transformation" });
    } finally {
      setActionLoading(false);
    }
  };

  // 1-Click Undo
  const handleUndo = async () => {
    if (!activeDataset) return;
    setActionLoading(true);
    try {
      const updated = await api.undoCleaningAction(activeDataset.id);
      setSession(updated);
      setNotification({ type: "success", text: "Successfully undid last cleaning action." });
      await loadSessionData();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to undo action" });
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Session
  const handleReset = async () => {
    if (!activeDataset) return;
    if (confirm("Reset working dataset back to original state? All uncommitted cleaning history will be lost.")) {
      setActionLoading(true);
      try {
        const reset = await api.resetCleaningSession(activeDataset.id);
        setSession(reset);
        setNotification({ type: "success", text: "Dataset reset to original state." });
        await loadSessionData();
      } catch (err: any) {
        setNotification({ type: "error", text: err.message });
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Save as New Version
  const handleSaveVersion = async () => {
    if (!activeDataset) return;
    setActionLoading(true);
    try {
      const newMeta = await api.saveCleanedVersion(activeDataset.id, versionName.trim() || undefined);
      setIsSaveModalOpen(false);
      setVersionName("");
      setNotification({
        type: "success",
        text: `Cleaned dataset saved as new version: "${newMeta.original_name}"!`,
      });
      await refreshDatasets();
      await setActiveDatasetId(newMeta.id);
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to save cleaned dataset" });
    } finally {
      setActionLoading(false);
    }
  };

  if (!activeDataset) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span>Data Cleaning Studio</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Detect and fix missing values, duplicate records, outliers, and type inconsistencies.
          </p>
        </div>

        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-500">
              <Database className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No Active Dataset
            </p>
            <p className="text-xs text-slate-500 max-w-sm">
              Please select or upload a dataset to begin interactive data cleaning.
            </p>
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="mt-2">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Studio Header & Versioning Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Data Cleaning Studio</span>
            </h1>
            <Badge variant="success" size="sm">
              Phase 3 Active
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Active Dataset: <span className="font-semibold text-slate-800 dark:text-slate-200">{activeDataset.original_name}</span>{" "}
            {session && (
              <span>
                • {session.total_rows.toLocaleString()} rows • {session.missing_count} missing cells ({session.missing_percentage}%)
              </span>
            )}
          </p>
        </div>

        {/* Action Controls: Undo, Reset, Save as Version */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={!session?.can_undo || actionLoading}
            className="text-xs"
            title="Undo last transformation"
          >
            <Undo2 className="w-3.5 h-3.5 mr-1" />
            Undo
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!session?.is_dirty || actionLoading}
            className="text-xs text-slate-600 dark:text-slate-300"
            title="Reset to original uploaded version"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSaveModalOpen(true)}
            disabled={actionLoading}
            className="text-xs shadow-sm bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            Save as New Version
          </Button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* Tool Categories Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto pb-1">
        {[
          { id: "missing", label: "Missing Values", icon: AlertTriangle, count: session?.missing_count },
          { id: "duplicates", label: "Duplicate Records", icon: Layers },
          { id: "outliers", label: "Outlier Detection & Capping", icon: Activity, count: outlierResults.length },
          { id: "columns", label: "Column Transformations", icon: Filter },
          { id: "text", label: "Text Sanitization & Replacement", icon: Type },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTool === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTool(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================= TOOL CONTENT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Tool Form Area (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 1: MISSING VALUES */}
          {activeTool === "missing" && (
            <Card>
              <CardHeader>
                <CardTitle>Missing Value Imputation & Removal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Missing Summary Box */}
                {missingSummary && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Missing Values Audit
                      </span>
                      <Badge variant={missingSummary.total_missing_cells > 0 ? "warning" : "success"} size="sm">
                        {missingSummary.total_missing_cells} cells ({missingSummary.missing_percentage}%)
                      </Badge>
                    </div>

                    {missingSummary.columns_with_missing.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                        {missingSummary.columns_with_missing.map((c) => (
                          <div
                            key={c.column}
                            onClick={() => setFillCol(c.column)}
                            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex justify-between items-center text-xs cursor-pointer hover:border-indigo-400"
                          >
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{c.column}</span>
                            <span className="text-amber-600 font-mono text-[11px] font-bold">
                              {c.missing_count} ({c.missing_percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        No missing values detected in any column!
                      </p>
                    )}
                  </div>
                )}

                {/* Sub-tool 1: Drop Missing Rows */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Strategy A: Drop Rows with Missing Values
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">Drop Condition</label>
                      <select
                        value={missingHow}
                        onChange={(e) => setMissingHow(e.target.value as any)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      >
                        <option value="any">Any cell in row is null</option>
                        <option value="all">All cells in row are null</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Target Subset Column (Optional)</label>
                      <select
                        value={missingSubsetCol}
                        onChange={(e) => setMissingSubsetCol(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      >
                        <option value="">(All Columns)</option>
                        {activeDataset.columns.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePreview("drop_missing", {
                        how: missingHow,
                        subset: missingSubsetCol ? [missingSubsetCol] : null,
                      })
                    }
                    className="text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview Drop Missing Rows
                  </Button>
                </div>

                {/* Sub-tool 2: Fill Missing Values */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Strategy B: Impute / Fill Missing Values
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">Target Column</label>
                      <select
                        value={fillCol}
                        onChange={(e) => setFillCol(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      >
                        <option value="">(All Columns)</option>
                        {activeDataset.columns.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.data_type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Fill Strategy</label>
                      <select
                        value={fillStrategy}
                        onChange={(e) => setFillStrategy(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      >
                        <option value="mean">Mean (Numeric)</option>
                        <option value="median">Median (Numeric)</option>
                        <option value="mode">Mode (Most Frequent)</option>
                        <option value="ffill">Forward Fill (ffill)</option>
                        <option value="bfill">Backward Fill (bfill)</option>
                        <option value="constant">Custom Constant Value</option>
                      </select>
                    </div>
                    {fillStrategy === "constant" && (
                      <div>
                        <label className="block text-slate-500 mb-1">Constant Value</label>
                        <input
                          type="text"
                          value={fillConstantVal}
                          onChange={(e) => setFillConstantVal(e.target.value)}
                          placeholder="e.g. 0, N/A, None"
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      handlePreview("fill_missing", {
                        column: fillCol || null,
                        strategy: fillStrategy,
                        value: fillConstantVal,
                      })
                    }
                    className="text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview Fill Transformation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: DUPLICATES */}
          {activeTool === "duplicates" && (
            <Card>
              <CardHeader>
                <CardTitle>Deduplication & Record Removal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <p className="text-slate-500">
                  Detect and remove duplicate rows based on all columns or a specific key subset.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">Keep Strategy</label>
                    <select
                      value={dupKeep}
                      onChange={(e) => setDupKeep(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                    >
                      <option value="first">Keep First Occurrence</option>
                      <option value="last">Keep Last Occurrence</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Subset Key Columns (Optional)</label>
                    <div className="max-h-32 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                      {activeDataset.columns.map((c) => (
                        <label key={c.name} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dupSubset.includes(c.name)}
                            onChange={(e) => {
                              if (e.target.checked) setDupSubset([...dupSubset, c.name]);
                              else setDupSubset(dupSubset.filter((x) => x !== c.name));
                            }}
                            className="w-3.5 h-3.5 text-indigo-600 rounded"
                          />
                          <span>{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      handlePreview("remove_duplicates", {
                        keep: dupKeep,
                        subset: dupSubset.length > 0 ? dupSubset : null,
                      })
                    }
                    className="text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview Deduplication
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: OUTLIERS */}
          {activeTool === "outliers" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Statistical Outlier Detection & Capping</CardTitle>
                  <div className="flex items-center gap-2">
                    <select
                      value={outlierMethod}
                      onChange={(e) => setOutlierMethod(e.target.value as any)}
                      className="text-xs p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                    >
                      <option value="IQR">IQR (Interquartile Range)</option>
                      <option value="Z-score">Z-score</option>
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      value={outlierThreshold}
                      onChange={(e) => setOutlierThreshold(Number(e.target.value))}
                      className="w-16 text-xs p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      title="Threshold Multiplier"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Outlier Report Cards */}
                {outlierResults.length > 0 ? (
                  <div className="space-y-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Detected Outliers by Column:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {outlierResults.map((out) => (
                        <div
                          key={out.column}
                          onClick={() => setOutlierCol(out.column)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            outlierCol === out.column
                              ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 ring-1 ring-indigo-500"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-indigo-300"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-900 dark:text-white">{out.column}</span>
                            <Badge variant="danger" size="sm">
                              {out.outlier_count} outliers ({out.outlier_percentage}%)
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Bounds: [{out.lower_bound.toLocaleString()}, {out.upper_bound.toLocaleString()}]
                          </p>
                          {out.sample_outliers && out.sample_outliers.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {out.sample_outliers.map((s, i) => (
                                <span key={i} className="px-1 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-mono">
                                  {Number(s).toLocaleString()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-emerald-600 dark:text-emerald-400">
                    No statistical outliers detected under current {outlierMethod} threshold ({outlierThreshold}).
                  </p>
                )}

                {/* Handle Outliers Controls */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 pt-3">
                  <h4 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Outlier Treatment Action
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Target Numeric Column</label>
                      <select
                        value={outlierCol}
                        onChange={(e) => setOutlierCol(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      >
                        {activeDataset.columns
                          .filter((c) => c.data_type.includes("int") || c.data_type.includes("float"))
                          .map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">Treatment Action</label>
                      <select
                        value={outlierAction}
                        onChange={(e) => setOutlierAction(e.target.value as any)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      >
                        <option value="cap">Cap to Bounds (Winsorize)</option>
                        <option value="remove_rows">Remove Outlier Rows</option>
                        <option value="impute_median">Impute with Column Median</option>
                        <option value="set_null">Set to Null (NaN)</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      handlePreview("handle_outliers", {
                        column: outlierCol,
                        method: outlierMethod,
                        threshold: outlierThreshold,
                        action: outlierAction,
                      })
                    }
                    className="text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview Outlier Treatment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: COLUMN TRANSFORMATIONS */}
          {activeTool === "columns" && (
            <Card>
              <CardHeader>
                <CardTitle>Column Renaming & Data Type Casting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-xs">
                {/* 1. Rename Column */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Rename Column
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Select Column</label>
                      <select
                        value={renameOld}
                        onChange={(e) => setRenameOld(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      >
                        {activeDataset.columns.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">New Column Name</label>
                      <input
                        type="text"
                        value={renameNew}
                        onChange={(e) => setRenameNew(e.target.value)}
                        placeholder="Enter new column name..."
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePreview("rename_column", {
                        old_name: renameOld,
                        new_name: renameNew,
                      })
                    }
                    className="text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview Rename
                  </Button>
                </div>

                {/* 2. Change Dtype */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Cast Column Data Type
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Target Column</label>
                      <select
                        value={dtypeCol}
                        onChange={(e) => setDtypeCol(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      >
                        {activeDataset.columns.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.data_type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Target Type</label>
                      <select
                        value={targetDtype}
                        onChange={(e) => setTargetDtype(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      >
                        <option value="int">Integer (int64)</option>
                        <option value="float">Floating-Point (float64)</option>
                        <option value="string">String / Text</option>
                        <option value="datetime">Datetime</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePreview("change_dtype", {
                        column: dtypeCol,
                        target_dtype: targetDtype,
                      })
                    }
                    className="text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview Type Conversion
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: TEXT SANITIZATION */}
          {activeTool === "text" && (
            <Card>
              <CardHeader>
                <CardTitle>Text Standardization, Trim, & Value Replacement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-xs">
                {/* 1. Trim Whitespace */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Remove Leading / Trailing Whitespace
                  </h4>
                  <p className="text-slate-500">
                    Trims invisible space padding across text columns.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview("remove_whitespace", { column: null })}
                    className="text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview Whitespace Trim (All Columns)
                  </Button>
                </div>

                {/* 2. Standardize Case */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Standardize Letter Case & Punctuation
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Target Column</label>
                      <select
                        value={textCol}
                        onChange={(e) => setTextCol(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      >
                        {activeDataset.columns.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Case Mode</label>
                      <select
                        value={textCase}
                        onChange={(e) => setTextCase(e.target.value as any)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      >
                        <option value="lower">lowercase</option>
                        <option value="upper">UPPERCASE</option>
                        <option value="title">Title Case</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id="strip"
                        checked={stripSpecial}
                        onChange={(e) => setStripSpecial(e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded"
                      />
                      <label htmlFor="strip" className="cursor-pointer text-slate-700 dark:text-slate-300">
                        Strip Special Characters
                      </label>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePreview("standardize_text", {
                        column: textCol,
                        case: textCase,
                        strip_special: stripSpecial,
                      })
                    }
                    className="text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview Standardization
                  </Button>
                </div>

                {/* 3. Value Replacement */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Find and Replace Values
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Target Column</label>
                      <select
                        value={replaceCol}
                        onChange={(e) => setReplaceCol(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      >
                        {activeDataset.columns.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Find Value</label>
                      <input
                        type="text"
                        value={findVal}
                        onChange={(e) => setFindVal(e.target.value)}
                        placeholder="Search for..."
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Replace With</label>
                      <input
                        type="text"
                        value={replaceVal}
                        onChange={(e) => setReplaceVal(e.target.value)}
                        placeholder="Replace with..."
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      handlePreview("replace_values", {
                        column: replaceCol,
                        find_value: findVal,
                        replace_value: replaceVal,
                      })
                    }
                    className="text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview Replacement
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar: Cleaning History & Version Audit (4 cols) */}
        <Card className="lg:col-span-4 h-[700px] flex flex-col">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Transformation History ({session?.history.length || 0})</span>
              </CardTitle>
              {session?.is_dirty && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                  Unsaved Changes
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-3 flex-1 overflow-y-auto space-y-2">
            {session && session.history.length > 0 ? (
              session.history.map((step, idx) => (
                <div
                  key={step.step_id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" size="sm">
                      Step #{idx + 1}: {step.operation}
                    </Badge>
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">
                    {step.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Rows: {step.rows_count.toLocaleString()}</span>
                    <span>Missing: {step.missing_count}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                <p className="text-xs">No cleaning transformations applied yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Preview any action on the left, then apply it to record history with instant undo.
                </p>
              </div>
            )}
          </CardContent>

          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Original file preserved</span>
            <span className="text-emerald-600 font-semibold">100% Non-destructive</span>
          </div>
        </Card>
      </div>

      {/* ================= PREVIEW MODAL BEFORE APPLYING ================= */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Preview Transformation Changes"
        description="Verify how this cleaning operation impacts your rows and columns before committing."
        maxWidth="4xl"
      >
        {previewData && (
          <div className="space-y-4">
            {/* Impact Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[10px] uppercase">Operation</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{previewData.operation}</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[10px] uppercase">Rows Before → After</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {previewData.rows_before.toLocaleString()} → {previewData.rows_after.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[10px] uppercase">Rows Affected</span>
                <p className="font-bold text-indigo-600 dark:text-indigo-400">
                  {previewData.rows_affected.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[10px] uppercase">Missing Cells</span>
                <p className="font-bold text-emerald-600">
                  {previewData.metrics_before.missing_cells} → {previewData.metrics_after.missing_cells}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200">
              <p className="font-semibold">Result Summary:</p>
              <p className="mt-0.5">{previewData.description}</p>
            </div>

            {/* Sample Transformed Rows Preview Table */}
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Sample Output Preview (First {previewData.preview_rows.length} rows):
              </span>
              <div className="overflow-x-auto max-h-60 border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 sticky top-0">
                      {previewData.columns.map((c) => (
                        <th key={c} className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewData.preview_rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {previewData.columns.map((c) => (
                          <td key={c} className="py-1.5 px-3 max-w-[200px] truncate">
                            {row[c] === null || row[c] === undefined ? (
                              <span className="text-amber-500 font-mono text-[10px]">null</span>
                            ) : (
                              String(row[c])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsPreviewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={actionLoading}
                onClick={handleApply}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Apply Transformation
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= SAVE AS NEW VERSION MODAL ================= */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Save Cleaned Dataset as New Version"
        description="Save your cleaned dataset into the workspace catalog. The original dataset remains untouched."
        maxWidth="md"
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Version Filename
            </label>
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder={`e.g. ${activeDataset.original_name.replace(/\.[^/.]+$/, "")}_cleaned_v1.csv`}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              If left blank, DataPilot AI will automatically name it with an incremented version tag.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={actionLoading} onClick={handleSaveVersion}>
              <Save className="w-3.5 h-3.5 mr-1" />
              Save Cleaned Dataset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
