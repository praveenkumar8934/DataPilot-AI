"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TableProperties,
  Search,
  Play,
  Sparkles,
  Database,
  Columns,
} from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { api } from "@/lib/api";
import { OperationCategory, OperationDefinition, OperationResult } from "@/types/operations";
import { DataTable } from "@/components/data-table/data-table";
import { OperationResultsView } from "@/components/operations/operation-results-view";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DataExplorerPage() {
  const { activeDataset } = useDataset();

  // Operation state
  const [catalog, setCatalog] = useState<OperationCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("basic");
  const [selectedOperationId, setSelectedOperationId] = useState<string>("head");
  const [params, setParams] = useState<Record<string, any>>({ n: 5 });
  const [executing, setExecuting] = useState<boolean>(false);
  const [result, setResult] = useState<OperationResult | null>(null);

  // Search & view states
  const [columnSearch, setColumnSearch] = useState<string>("");
  const [centerView, setCenterView] = useState<"table" | "result">("table");

  // Fetch operations catalog
  useEffect(() => {
    api
      .getOperationsCatalog()
      .then((cats) => {
        setCatalog(cats);
      })
      .catch((err) => {
        console.error("Failed to load operations catalog:", err);
      });
  }, []);

  // Current category & operation definitions
  const currentCategory = catalog.find((c) => c.id === selectedCategory) || catalog[0];
  const currentOperation =
    currentCategory?.operations.find((op) => op.id === selectedOperationId) ||
    currentCategory?.operations[0];

  // When operation changes, populate default params
  const handleSelectOperation = (op: OperationDefinition) => {
    setSelectedOperationId(op.id);
    const newParams: Record<string, any> = {};
    op.params.forEach((p) => {
      if (p.default !== undefined) {
        newParams[p.name] = p.default;
      } else if (p.type === "column" && activeDataset && activeDataset.columns.length > 0) {
        newParams[p.name] = activeDataset.columns[0].name;
      } else if (p.type === "columns") {
        newParams[p.name] = [];
      } else if (p.type === "select" && p.options && p.options.length > 0) {
        newParams[p.name] = p.options[0];
      }
    });
    setParams(newParams);
  };

  // Run the operation against active dataset
  const handleRunOperation = async (overrideOp?: string, overrideCategory?: string, overrideParams?: Record<string, any>) => {
    if (!activeDataset) return;

    const opToRun = overrideOp || selectedOperationId;
    const catToRun = overrideCategory || selectedCategory;
    const paramsToRun = overrideParams !== undefined ? overrideParams : params;

    setExecuting(true);
    try {
      const res = await api.executeOperation({
        dataset_id: activeDataset.id,
        category: catToRun,
        operation: opToRun,
        params: paramsToRun,
      });
      setResult(res);
      setCenterView("result");
    } catch (err: any) {
      setResult({
        success: false,
        operation: opToRun,
        category: catToRun,
        result_type: "text",
        summary: `Error running ${opToRun}()`,
        error: err.message || "Failed to execute operation",
        execution_time_ms: 0,
      });
      setCenterView("result");
    } finally {
      setExecuting(false);
    }
  };

  // Quick 1-click execution shortcuts
  const runQuickOp = (opId: string, category: string, quickParams: Record<string, any> = {}) => {
    setSelectedCategory(category);
    setSelectedOperationId(opId);
    setParams(quickParams);
    handleRunOperation(opId, category, quickParams);
  };

  // Filter columns in left panel
  const filteredColumns = activeDataset
    ? activeDataset.columns.filter((c) =>
        c.name.toLowerCase().includes(columnSearch.toLowerCase())
      )
    : [];

  if (!activeDataset) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <TableProperties className="w-5 h-5 text-indigo-500" />
            <span>Data Explorer Studio</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Execute Pandas operations dynamically against your data without writing code.
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
              Please upload or select a dataset to start executing Pandas operations.
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
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Explorer Top Header & Quick Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <TableProperties className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Data Explorer Studio</span>
            </h1>
            <Badge variant="success" size="sm">
              Active: {activeDataset.original_name}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeDataset.row_count.toLocaleString()} rows • {activeDataset.column_count} columns • {activeDataset.file_format}
          </p>
        </div>

        {/* 1-Click Operations Shortcuts */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Shortcuts:
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runQuickOp("head", "basic", { n: 5 })}
            className="text-xs font-mono h-7 px-2.5"
          >
            head(5)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runQuickOp("tail", "basic", { n: 5 })}
            className="text-xs font-mono h-7 px-2.5"
          >
            tail(5)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runQuickOp("describe", "basic", { include: "all" })}
            className="text-xs font-mono h-7 px-2.5"
          >
            describe()
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runQuickOp("info", "basic")}
            className="text-xs font-mono h-7 px-2.5"
          >
            info()
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runQuickOp("shape", "basic")}
            className="text-xs font-mono h-7 px-2.5"
          >
            shape
          </Button>
        </div>
      </div>

      {/* 3-Panel Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ================= LEFT PANEL: Dataset Schema & Columns (3 cols) ================= */}
        <Card className="lg:col-span-3 flex flex-col h-[750px]">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Columns className="w-3.5 h-3.5 text-indigo-500" />
                <span>Columns ({activeDataset.columns.length})</span>
              </CardTitle>
              <span className="text-[10px] text-slate-400">Click to use</span>
            </div>

            <div className="relative mt-2.5">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search columns..."
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </CardHeader>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredColumns.map((col) => (
              <div
                key={col.name}
                onClick={() => {
                  // Click column to automatically set as target column in params if applicable
                  setParams((prev) => ({
                    ...prev,
                    column: col.name,
                    columns: prev.columns
                      ? prev.columns.includes(col.name)
                        ? prev.columns
                        : [...prev.columns, col.name]
                      : [col.name],
                  }));
                }}
                className="p-2.5 rounded-lg hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 hover:border-indigo-200 dark:hover:border-indigo-800/60 border border-transparent transition-all cursor-pointer group flex flex-col gap-1 text-xs"
                title={`Click to set "${col.name}" as parameter`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {col.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {col.data_type}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{col.unique_count.toLocaleString()} unique</span>
                  <span className={col.missing_count > 0 ? "text-amber-600" : ""}>
                    {col.missing_count} missing
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] text-slate-500">
            <span>Memory: </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {activeDataset.memory_usage_formatted}
            </span>
          </div>
        </Card>

        {/* ================= CENTER PANEL: View Switcher (6 cols) ================= */}
        <div className="lg:col-span-6 space-y-3">
          {/* View Toggle Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
              <button
                onClick={() => setCenterView("table")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  centerView === "table"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Active Dataset Table
              </button>

              <button
                onClick={() => setCenterView("result")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  centerView === "result"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span>Operation Result</span>
                {result && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>

            {centerView === "result" && result && (
              <span className="text-xs text-slate-500 font-mono">
                Last run: {result.operation}() in {result.execution_time_ms}ms
              </span>
            )}
          </div>

          {/* View Content */}
          {centerView === "table" ? (
            <DataTable datasetId={activeDataset.id} />
          ) : result ? (
            <OperationResultsView result={result} />
          ) : (
            <Card className="p-12 text-center text-slate-400">
              <Sparkles className="w-10 h-10 mb-2 mx-auto text-indigo-400 opacity-60" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Operation Executed Yet
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Select an operation from the right panel and click &ldquo;Run Operation&rdquo; to see live results.
              </p>
            </Card>
          )}
        </div>

        {/* ================= RIGHT PANEL: Operation Selector & Parameters (3 cols) ================= */}
        <Card className="lg:col-span-3 flex flex-col h-[750px]">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Pandas Studio</span>
              </CardTitle>
              <Badge variant="info" size="sm">
                Engine Active
              </Badge>
            </div>

            {/* Category Selector Pills */}
            <div className="flex items-center gap-1 flex-wrap mt-3">
              {catalog.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (cat.operations.length > 0) {
                      handleSelectOperation(cat.operations[0]);
                    }
                  }}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4 flex-1 overflow-y-auto">
            {/* Operation Selector Dropdown */}
            {currentCategory && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1.5">
                  Select Operation
                </label>
                <select
                  value={selectedOperationId}
                  onChange={(e) => {
                    const op = currentCategory.operations.find((o) => o.id === e.target.value);
                    if (op) handleSelectOperation(op);
                  }}
                  className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {currentCategory.operations.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.name} — {op.description}
                    </option>
                  ))}
                </select>

                {currentOperation && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 italic">
                    {currentOperation.description}
                  </p>
                )}
              </div>
            )}

            {/* Dynamic Parameter Form Inputs */}
            {currentOperation && currentOperation.params.length > 0 ? (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Configurable Parameters
                </span>

                {currentOperation.params.map((param) => (
                  <div key={param.name} className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      {param.label}
                      {param.required && <span className="text-rose-500 ml-0.5">*</span>}
                    </label>

                    {/* int / float input */}
                    {(param.type === "int" || param.type === "float") && (
                      <input
                        type="number"
                        step={param.type === "float" ? "0.05" : "1"}
                        value={params[param.name] ?? param.default ?? ""}
                        onChange={(e) =>
                          setParams((prev) => ({
                            ...prev,
                            [param.name]: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    )}

                    {/* string input */}
                    {param.type === "str" && (
                      <input
                        type="text"
                        value={params[param.name] ?? ""}
                        placeholder="Enter value..."
                        onChange={(e) =>
                          setParams((prev) => ({
                            ...prev,
                            [param.name]: e.target.value,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    )}

                    {/* column selector dropdown */}
                    {param.type === "column" && (
                      <select
                        value={params[param.name] ?? ""}
                        onChange={(e) =>
                          setParams((prev) => ({
                            ...prev,
                            [param.name]: e.target.value,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {!param.required && <option value="">(All Columns / Default)</option>}
                        {activeDataset.columns.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.data_type})
                          </option>
                        ))}
                      </select>
                    )}

                    {/* select dropdown */}
                    {param.type === "select" && param.options && (
                      <select
                        value={params[param.name] ?? param.default ?? param.options[0]}
                        onChange={(e) =>
                          setParams((prev) => ({
                            ...prev,
                            [param.name]: e.target.value,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {param.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* boolean toggle */}
                    {param.type === "boolean" && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id={param.name}
                          checked={Boolean(params[param.name] ?? param.default)}
                          onChange={(e) =>
                            setParams((prev) => ({
                              ...prev,
                              [param.name]: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor={param.name} className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          Enable
                        </label>
                      </div>
                    )}

                    {/* multi columns checkbox selector */}
                    {param.type === "columns" && (
                      <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1 text-xs">
                        {activeDataset.columns.map((c) => {
                          const currentSelected: string[] = params[param.name] || [];
                          const isChecked = currentSelected.includes(c.name);
                          return (
                            <label
                              key={c.name}
                              className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setParams((prev) => ({
                                      ...prev,
                                      [param.name]: [...(prev[param.name] || []), c.name],
                                    }));
                                  } else {
                                    setParams((prev) => ({
                                      ...prev,
                                      [param.name]: (prev[param.name] || []).filter(
                                        (x: string) => x !== c.name
                                      ),
                                    }));
                                  }
                                }}
                                className="w-3.5 h-3.5 text-indigo-600 rounded"
                              />
                              <span className="truncate">{c.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 italic">
                This operation does not require additional parameters.
              </div>
            )}

            {/* Run Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                isLoading={executing}
                onClick={() => handleRunOperation()}
                className="w-full text-xs font-semibold py-2.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                Run {currentOperation?.name || "Operation"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
