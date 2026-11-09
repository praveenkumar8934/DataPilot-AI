"use client";

import React, { useState, useEffect } from "react";
import { CorrelationMatrixResponse } from "@/types/analytics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface CorrelationMatrixViewProps {
  datasetId: string;
}

export function CorrelationMatrixView({ datasetId }: CorrelationMatrixViewProps) {
  const [method, setMethod] = useState<string>("pearson");
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<CorrelationMatrixResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getCorrelationMatrix(datasetId, method)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load correlation matrix");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [datasetId, method]);

  // Color interpolation for correlation cells
  const getCellBg = (val: number | null) => {
    if (val === null || val === undefined) return "bg-slate-100 dark:bg-slate-800";
    if (val === 1.0) return "bg-indigo-100 dark:bg-indigo-950/60 font-bold text-indigo-700 dark:text-indigo-300";

    if (val > 0) {
      if (val >= 0.8) return "bg-indigo-500 text-white font-semibold";
      if (val >= 0.6) return "bg-indigo-400 text-white";
      if (val >= 0.4) return "bg-indigo-200 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200";
      if (val >= 0.2) return "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300";
      return "bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400";
    } else {
      const abs = Math.abs(val);
      if (abs >= 0.8) return "bg-rose-500 text-white font-semibold";
      if (abs >= 0.6) return "bg-rose-400 text-white";
      if (abs >= 0.4) return "bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200";
      if (abs >= 0.2) return "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300";
      return "bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Method Controls */}
      <Card className="p-4 bg-slate-50/60 dark:bg-slate-900/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Correlation Metric:
            </span>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {(["pearson", "spearman", "kendall"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                    method === m
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded bg-indigo-500" />
            <span>Positive (r &gt; 0)</span>
            <span className="inline-block w-2.5 h-2.5 rounded bg-rose-500 ml-2" />
            <span>Negative (r &lt; 0)</span>
          </div>
        </div>
      </Card>

      {/* Loading & Error */}
      {loading && (
        <Card className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Computing correlation coefficients matrix...</p>
        </Card>
      )}

      {error && !loading && (
        <Card className="p-6 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>Correlation Error</span>
          </div>
          <p className="text-xs mt-1">{error}</p>
        </Card>
      )}

      {/* Presentation */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Heatmap Grid (2 Columns) */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Pairwise Correlation Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  {data.columns.length} numeric features evaluated using {data.method}{" "}
                  coefficient.
                </p>
              </div>
              <Badge variant="outline" size="sm">
                {data.columns.length}×{data.columns.length} Matrix
              </Badge>
            </div>

            {data.columns.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No numeric columns found in this dataset to compute correlations.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="text-xs text-center border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 bg-slate-50 dark:bg-slate-900 text-left font-mono text-[10px] text-slate-400 border border-slate-200 dark:border-slate-800">
                        Feature
                      </th>
                      {data.columns.map((c) => (
                        <th
                          key={c}
                          className="p-2 bg-slate-50 dark:bg-slate-900 font-mono text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 max-w-[90px] truncate"
                          title={c}
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.columns.map((rowCol) => (
                      <tr key={rowCol}>
                        <td
                          className="p-2 font-mono text-[10px] text-left font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 max-w-[100px] truncate bg-slate-50/50 dark:bg-slate-900/40"
                          title={rowCol}
                        >
                          {rowCol}
                        </td>
                        {data.columns.map((colCol) => {
                          const val = data.matrix[rowCol]?.[colCol] ?? null;
                          return (
                            <td
                              key={colCol}
                              className={`p-2 border border-slate-200/60 dark:border-slate-800 font-mono text-[11px] transition-all cursor-pointer hover:ring-2 hover:ring-indigo-400 z-0 ${getCellBg(
                                val
                              )}`}
                              title={`${rowCol} vs ${colCol}: ${val ?? "N/A"}`}
                            >
                              {val !== null ? val.toFixed(2) : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Strong Correlations Ranking (1 Column) */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Ranked Associations
                </h3>
                <p className="text-xs text-slate-500">
                  Feature pairs with significant correlation (|r| &ge; 0.4).
                </p>
              </div>
              <Badge variant="outline" size="sm">
                {data.strong_correlations.length} Pairs
              </Badge>
            </div>

            {data.strong_correlations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No strong correlation pairs detected in this dataset.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {data.strong_correlations.map((pair, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                        {pair.feature_a}
                      </div>
                      <div className="text-[10px] text-slate-400">vs</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                        {pair.feature_b}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end gap-1 font-mono font-bold">
                        {pair.correlation > 0 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span
                          className={
                            pair.correlation > 0
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {pair.correlation > 0 ? "+" : ""}
                          {pair.correlation}
                        </span>
                      </div>
                      <Badge
                        variant={
                          pair.strength === "Very Strong"
                            ? "success"
                            : pair.strength === "Strong"
                            ? "info"
                            : "outline"
                        }
                        size="sm"
                      >
                        {pair.strength}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
