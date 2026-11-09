"use client";

import React, { useState } from "react";
import { GroupByResponse } from "@/types/analytics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  Layers,
  Play,
  AlertCircle,
  ChevronDown,
  Check,
} from "lucide-react";

interface GroupByStudioProps {
  datasetId: string;
  columns: Array<{ name: string; is_numeric: boolean; dtype: string }>;
}

export function GroupByStudio({ datasetId, columns }: GroupByStudioProps) {
  const [selectedGroupCols, setSelectedGroupCols] = useState<string[]>([
    columns.find((c) => !c.is_numeric)?.name || columns[0]?.name || "",
  ]);
  const [aggCol, setAggCol] = useState<string>(
    columns.find((c) => c.is_numeric)?.name || columns[0]?.name || ""
  );
  const [selectedFuncs, setSelectedFuncs] = useState<string[]>([
    "mean",
    "sum",
    "count",
  ]);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<GroupByResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableFuncs = [
    "mean",
    "sum",
    "count",
    "std",
    "min",
    "max",
    "median",
  ];

  const toggleGroupCol = (colName: string) => {
    if (selectedGroupCols.includes(colName)) {
      if (selectedGroupCols.length > 1) {
        setSelectedGroupCols(selectedGroupCols.filter((c) => c !== colName));
      }
    } else {
      setSelectedGroupCols([...selectedGroupCols, colName]);
    }
  };

  const toggleFunc = (func: string) => {
    if (selectedFuncs.includes(func)) {
      if (selectedFuncs.length > 1) {
        setSelectedFuncs(selectedFuncs.filter((f) => f !== func));
      }
    } else {
      setSelectedFuncs([...selectedFuncs, func]);
    }
  };

  const handleExecute = () => {
    if (!datasetId || selectedGroupCols.length === 0 || !aggCol) return;
    setLoading(true);
    setError(null);

    api
      .getGroupByAnalysis({
        dataset_id: datasetId,
        group_by_columns: selectedGroupCols,
        agg_column: aggCol,
        agg_functions: selectedFuncs,
      })
      .then((res) => {
        setResult(res);
      })
      .catch((err) => {
        setError(err.message || "Failed to execute GroupBy query");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      {/* Control Configuration Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              GroupBy Query Builder
            </h3>
          </div>
          <Badge variant="outline" size="sm">
            Pandas Dynamic Aggregation
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Group Columns (Multi-select) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              1. Group By Columns:
            </label>
            <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              {columns.map((c) => {
                const isSelected = selectedGroupCols.includes(c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => toggleGroupCol(c.name)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="font-mono truncate">{c.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] text-slate-400">
              Selected: {selectedGroupCols.join(", ")}
            </span>
          </div>

          {/* Aggregation Target Column */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              2. Target Metric Column:
            </label>
            <div className="relative">
              <select
                value={aggCol}
                onChange={(e) => setAggCol(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              >
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.is_numeric ? "numeric" : "categorical"})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400">
              Select the numeric attribute to compute mathematical metrics on.
            </p>
          </div>

          {/* Aggregation Functions */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              3. Aggregation Metrics:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableFuncs.map((fn) => {
                const active = selectedFuncs.includes(fn);
                return (
                  <button
                    key={fn}
                    type="button"
                    onClick={() => toggleFunc(fn)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors uppercase ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {fn}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button onClick={handleExecute} isLoading={loading}>
            <Play className="w-3.5 h-3.5 mr-1" />
            <span>Execute GroupBy</span>
          </Button>
        </div>
      </Card>

      {/* Error State */}
      {error && !loading && (
        <Card className="p-6 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>Execution Error</span>
          </div>
          <p className="text-xs mt-1">{error}</p>
        </Card>
      )}

      {/* Results Table */}
      {!loading && result && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                GroupBy Results
              </h3>
              <p className="text-xs text-slate-500">
                Aggregated by [{result.group_by_columns.join(", ")}] on &apos;{result.agg_column}&apos;
              </p>
            </div>
            <Badge variant="success" size="sm">
              {result.total_groups} Groups Created
            </Badge>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800 sticky top-0">
                <tr>
                  {result.columns.map((c) => (
                    <th key={c} className="px-4 py-2.5 font-mono">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {result.rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {result.columns.map((c) => (
                      <td
                        key={c}
                        className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-mono"
                      >
                        {typeof row[c] === "number"
                          ? (row[c] as number).toLocaleString(undefined, {
                              maximumFractionDigits: 4,
                            })
                          : (row[c] as string) ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
