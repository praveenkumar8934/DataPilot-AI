"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BivariateAnalysisResponse } from "@/types/analytics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  ArrowRight,
  AlertCircle,
  ChevronDown,
  Info,
} from "lucide-react";

interface BivariateExplorerProps {
  datasetId: string;
  columns: Array<{ name: string; is_numeric: boolean; dtype: string }>;
}

export function BivariateExplorer({
  datasetId,
  columns,
}: BivariateExplorerProps) {
  const [colX, setColX] = useState<string>(columns[0]?.name || "");
  const [colY, setColY] = useState<string>(
    columns[1]?.name || columns[0]?.name || ""
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BivariateAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBivariate = useCallback((x: string, y: string) => {
    if (!x || !y || !datasetId) return;
    setLoading(true);
    setError(null);

    api
      .getBivariateAnalysis({
        dataset_id: datasetId,
        x_column: x,
        y_column: y,
      })
      .then((res) => {
        setResult(res);
      })
      .catch((err) => {
        setError(err.message || "Failed to compute bivariate relationship");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [datasetId]);

  useEffect(() => {
    if (colX && colY && datasetId) {
      runBivariate(colX, colY);
    }
  }, [datasetId, colX, colY, runBivariate]);

  return (
    <div className="space-y-6">
      {/* Column Selectors */}
      <Card className="p-4 bg-slate-50/60 dark:bg-slate-900/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                X-Axis:
              </span>
              <div className="relative">
                <select
                  value={colX}
                  onChange={(e) => setColX(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.is_numeric ? "num" : "cat"})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Y-Axis:
              </span>
              <div className="relative">
                <select
                  value={colY}
                  onChange={(e) => setColY(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.is_numeric ? "num" : "cat"})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => runBivariate(colX, colY)}
              isLoading={loading}
            >
              Analyze Pair
            </Button>
          </div>

          {result && (
            <Badge
              variant={
                result.relationship_type === "numeric_vs_numeric"
                  ? "success"
                  : result.relationship_type === "categorical_vs_numeric"
                  ? "info"
                  : "default"
              }
              size="sm"
            >
              {result.relationship_type.replace(/_/g, " ").toUpperCase()}
            </Badge>
          )}
        </div>
      </Card>

      {/* Loading & Error */}
      {loading && (
        <Card className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Computing bivariate statistical association...</p>
        </Card>
      )}

      {error && !loading && (
        <Card className="p-6 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>Calculation Error</span>
          </div>
          <p className="text-xs mt-1">{error}</p>
        </Card>
      )}

      {/* Bivariate Results */}
      {!loading && result && (
        <div className="space-y-6">
          {/* Summary Alert */}
          <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="font-medium">{result.summary}</span>
          </div>

          {/* Case 1: Numeric vs Numeric */}
          {result.relationship_type === "numeric_vs_numeric" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    Pearson Correlation (r)
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {result.correlation}
                    </span>
                    <Badge
                      variant={
                        Math.abs(result.correlation || 0) >= 0.7
                          ? "success"
                          : Math.abs(result.correlation || 0) >= 0.4
                          ? "info"
                          : "outline"
                      }
                      size="sm"
                    >
                      {Math.abs(result.correlation || 0) >= 0.7
                        ? "Strong"
                        : Math.abs(result.correlation || 0) >= 0.4
                        ? "Moderate"
                        : "Weak"}
                    </Badge>
                  </div>
                </Card>

                <Card className="p-4 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    Sample Covariance
                  </span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {result.covariance?.toLocaleString()}
                  </span>
                </Card>
              </div>

              {/* Scatter Dot Preview */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Bivariate Scatter Plot Preview
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sample of {result.sample_points.length} observed (X, Y) points.
                    </p>
                  </div>
                  <Badge variant="outline" size="sm">
                    {colX} vs {colY}
                  </Badge>
                </div>

                {result.sample_points.length > 0 ? (
                  <div className="relative w-full h-64 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 p-4 overflow-hidden">
                    {(() => {
                      const minX = Math.min(...result.sample_points.map((p) => p.x));
                      const maxX = Math.max(...result.sample_points.map((p) => p.x));
                      const minY = Math.min(...result.sample_points.map((p) => p.y));
                      const maxY = Math.max(...result.sample_points.map((p) => p.y));
                      const rangeX = maxX - minX || 1;
                      const rangeY = maxY - minY || 1;

                      return (
                        <div className="w-full h-full relative">
                          {result.sample_points.map((pt, idx) => {
                            const left = ((pt.x - minX) / rangeX) * 92 + 4;
                            const bottom = ((pt.y - minY) / rangeY) * 88 + 6;
                            return (
                              <div
                                key={idx}
                                className="absolute w-2.5 h-2.5 rounded-full bg-indigo-500/80 hover:bg-indigo-600 dark:bg-indigo-400 hover:scale-150 transition-all cursor-pointer group shadow-sm"
                                style={{ left: `${left}%`, bottom: `${bottom}%` }}
                              >
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-20 pointer-events-none">
                                  ({pt.x}, {pt.y})
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">
                    No sample points available to render scatter plot.
                  </p>
                )}
              </Card>
            </div>
          )}

          {/* Case 2: Categorical vs Numeric */}
          {result.relationship_type === "categorical_vs_numeric" && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Grouped Category Distributions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mean, median, and dispersion of numeric metric across distinct categories.
                  </p>
                </div>
                <Badge variant="outline" size="sm">
                  {result.group_stats.length} Groups
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Sample Size</th>
                      <th className="px-4 py-2.5">Mean</th>
                      <th className="px-4 py-2.5">Median</th>
                      <th className="px-4 py-2.5">Std Dev</th>
                      <th className="px-4 py-2.5">Min / Max</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {result.group_stats.map((g, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white font-mono">
                          {g.category}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                          {g.count.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                          {g.mean?.toLocaleString() ?? "N/A"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                          {g.median?.toLocaleString() ?? "N/A"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                          {g.std?.toLocaleString() ?? "N/A"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">
                          {g.min ?? "N/A"} / {g.max ?? "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Case 3: Categorical vs Categorical */}
          {result.relationship_type === "categorical_vs_categorical" &&
            result.contingency_matrix && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Contingency Cross-Tabulation
                    </h3>
                    <p className="text-xs text-slate-500">
                      Joint frequencies between categories of {colX} and {colY}.
                    </p>
                  </div>
                  <Badge variant="outline" size="sm">
                    Cross-Tab
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5 font-mono bg-slate-100 dark:bg-slate-800">
                          {colX} \ {colY}
                        </th>
                        {Object.keys(
                          Object.values(result.contingency_matrix)[0] || {}
                        ).map((cName) => (
                          <th key={cName} className="px-4 py-2.5 font-mono">
                            {cName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {Object.entries(result.contingency_matrix).map(
                        ([rName, colsObj]) => (
                          <tr
                            key={rName}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white font-mono bg-slate-50/50 dark:bg-slate-900/40">
                              {rName}
                            </td>
                            {Object.entries(colsObj).map(([cName, countVal]) => (
                              <td
                                key={cName}
                                className="px-4 py-2.5 text-slate-700 dark:text-slate-300"
                              >
                                {countVal > 0 ? (
                                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                    {countVal}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-700">0</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
        </div>
      )}
    </div>
  );
}
