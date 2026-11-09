"use client";

import React, { useState, useEffect } from "react";
import { UnivariateResult } from "@/types/analytics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import {
  AlertCircle,
  ChevronDown,
} from "lucide-react";

interface UnivariateExplorerProps {
  datasetId: string;
  columns: Array<{ name: string; is_numeric: boolean; dtype: string }>;
  selectedColumn: string;
  onSelectColumn: (col: string) => void;
}

export function UnivariateExplorer({
  datasetId,
  columns,
  selectedColumn,
  onSelectColumn,
}: UnivariateExplorerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<UnivariateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedColumn || !datasetId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getUnivariateAnalysis(datasetId, selectedColumn)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load univariate analysis");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [datasetId, selectedColumn]);

  const activeColInfo = columns.find((c) => c.name === selectedColumn);

  return (
    <div className="space-y-6">
      {/* Selector Header */}
      <Card className="p-4 bg-slate-50/60 dark:bg-slate-900/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Column:
            </span>
            <div className="relative">
              <select
                value={selectedColumn}
                onChange={(e) => onSelectColumn(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.is_numeric ? "numeric" : "categorical"})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {activeColInfo && (
              <Badge
                variant={activeColInfo.is_numeric ? "success" : "info"}
                size="sm"
              >
                {activeColInfo.is_numeric ? "Numeric Variable" : "Categorical Variable"}
              </Badge>
            )}
          </div>

          <span className="text-xs text-slate-400">
            Phase 4 Automated Univariate Profiler
          </span>
        </div>
      </Card>

      {/* Loading & Error States */}
      {loading && (
        <Card className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Computing descriptive metrics & distribution...</p>
        </Card>
      )}

      {error && !loading && (
        <Card className="p-6 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>Analysis Error</span>
          </div>
          <p className="text-xs mt-1">{error}</p>
        </Card>
      )}

      {/* Data Presentation */}
      {!loading && data && (
        <>
          {data.is_numeric && data.numeric_analysis && (
            <div className="space-y-6">
              {/* Statistical Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Card className="p-3 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    Mean
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {data.numeric_analysis.mean.toLocaleString()}
                  </span>
                </Card>

                <Card className="p-3 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    Median
                  </span>
                  <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                    {data.numeric_analysis.median.toLocaleString()}
                  </span>
                </Card>

                <Card className="p-3 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    Std Dev
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {data.numeric_analysis.std.toLocaleString()}
                  </span>
                </Card>

                <Card className="p-3 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    Min / Max
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                    {data.numeric_analysis.min} / {data.numeric_analysis.max}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Range: {data.numeric_analysis.range}
                  </span>
                </Card>

                <Card className="p-3 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    IQR (Q3 - Q1)
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {data.numeric_analysis.iqr}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Q1: {data.numeric_analysis.q25} | Q3: {data.numeric_analysis.q75}
                  </span>
                </Card>

                <Card className="p-3 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    Skewness / Kurtosis
                  </span>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Skew: {data.numeric_analysis.skewness}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Kurt: {data.numeric_analysis.kurtosis}
                  </div>
                </Card>
              </div>

              {/* Distribution Histogram */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Frequency Distribution Histogram
                    </h3>
                    <p className="text-xs text-slate-500">
                      Binned density of {data.numeric_analysis.count} values across{" "}
                      {data.numeric_analysis.histogram.length} intervals.
                    </p>
                  </div>
                  <Badge variant="outline" size="sm">
                    {data.numeric_analysis.histogram.length} Bins
                  </Badge>
                </div>

                {data.numeric_analysis.histogram.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No data points available to generate histogram.
                  </p>
                ) : (
                  <div className="space-y-3 pt-2">
                    {/* Render Histogram Bars */}
                    <div className="h-48 flex items-end gap-1.5 pt-6 pb-2 px-2 border-b border-slate-200 dark:border-slate-800">
                      {(() => {
                        const maxCount = Math.max(
                          ...data.numeric_analysis.histogram.map((b) => b.count),
                          1
                        );
                        return data.numeric_analysis.histogram.map((bin, i) => {
                          const heightPct = Math.round((bin.count / maxCount) * 100);
                          return (
                            <div
                              key={i}
                              className="flex-1 flex flex-col items-center h-full justify-end group relative"
                            >
                              {/* Hover Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] rounded px-2 py-1 shadow pointer-events-none whitespace-nowrap z-10">
                                <div>Count: {bin.count} ({bin.percentage}%)</div>
                                <div className="text-slate-400">{bin.bin_label}</div>
                              </div>

                              <div
                                className="w-full bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-t transition-all cursor-pointer"
                                style={{ height: `${Math.max(heightPct, 4)}%` }}
                              />
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Bin Labels */}
                    <div className="flex justify-between text-[10px] text-slate-400 px-1 font-mono">
                      <span>{data.numeric_analysis.histogram[0]?.bin_start}</span>
                      <span>
                        {
                          data.numeric_analysis.histogram[
                            data.numeric_analysis.histogram.length - 1
                          ]?.bin_end
                        }
                      </span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Boxplot & Outlier Breakdown */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Boxplot Whisker & Outlier Analysis
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tukey 1.5×IQR boundaries for anomaly identification.
                    </p>
                  </div>
                  {data.numeric_analysis.boxplot.outlier_count > 0 ? (
                    <Badge variant="warning" size="sm">
                      {data.numeric_analysis.boxplot.outlier_count} Outliers Detected
                    </Badge>
                  ) : (
                    <Badge variant="success" size="sm">
                      No Outliers Detected
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Min</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {data.numeric_analysis.boxplot.min}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      Lower Whisker
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {data.numeric_analysis.boxplot.lower_whisker}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Q1 (25%)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {data.numeric_analysis.boxplot.q1}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
                    <span className="text-[10px] text-indigo-500 block mb-0.5">
                      Median (Q2)
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {data.numeric_analysis.boxplot.median}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Q3 (75%)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {data.numeric_analysis.boxplot.q3}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      Upper Whisker
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {data.numeric_analysis.boxplot.upper_whisker}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Max</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {data.numeric_analysis.boxplot.max}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {!data.is_numeric && data.categorical_analysis && (
            <div className="space-y-6">
              {/* Categorical Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="p-3 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    Valid Records
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {data.categorical_analysis.count.toLocaleString()}
                  </span>
                </Card>

                <Card className="p-3 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    Unique Categories
                  </span>
                  <span className="text-base font-bold text-violet-600 dark:text-violet-400">
                    {data.categorical_analysis.unique_count.toLocaleString()}
                  </span>
                </Card>

                <Card className="p-3 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    Cardinality Ratio
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {data.categorical_analysis.cardinality_ratio}
                  </span>
                </Card>

                <Card className="p-3 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    Top Mode Category
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {data.categorical_analysis.top_value ?? "N/A"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {data.categorical_analysis.top_frequency} occurrences
                  </span>
                </Card>
              </div>

              {/* Categorical Frequencies List */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Category Frequency Ranking
                    </h3>
                    <p className="text-xs text-slate-500">
                      Top {data.categorical_analysis.frequencies.length} distinct categories
                      by occurrence rate.
                    </p>
                  </div>
                  <Badge variant="outline" size="sm">
                    {data.categorical_analysis.frequencies.length} Classes
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  {data.categorical_analysis.frequencies.map((f, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          {f.value || "<Empty / Null>"}
                        </span>
                        <span className="text-slate-500">
                          {f.count.toLocaleString()} ({f.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all"
                          style={{ width: `${Math.min(f.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
