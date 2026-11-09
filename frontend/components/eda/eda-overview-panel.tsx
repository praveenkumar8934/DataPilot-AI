"use client";

import React from "react";
import { EDAOverview } from "@/types/analytics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Columns,
  Hash,
  Type,
  AlertTriangle,
  Copy,
  ArrowRight,
} from "lucide-react";

interface EDAOverviewPanelProps {
  overview: EDAOverview;
  onSelectColumnForUnivariate: (col: string) => void;
}

export function EDAOverviewPanel({
  overview,
  onSelectColumnForUnivariate,
}: EDAOverviewPanelProps) {
  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
            <span>Total Rows</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {overview.total_rows.toLocaleString()}
          </div>
        </Card>

        <Card className="p-4 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Columns className="w-3.5 h-3.5 text-blue-500" />
            <span>Columns</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {overview.total_columns}
          </div>
        </Card>

        <Card className="p-4 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Hash className="w-3.5 h-3.5 text-emerald-500" />
            <span>Numeric</span>
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {overview.numeric_columns.length}
          </div>
        </Card>

        <Card className="p-4 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Type className="w-3.5 h-3.5 text-violet-500" />
            <span>Categorical</span>
          </div>
          <div className="text-xl font-bold text-violet-600 dark:text-violet-400">
            {overview.categorical_columns.length}
          </div>
        </Card>

        <Card className="p-4 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Missing Cells</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {overview.total_missing_cells}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              ({overview.missing_percentage}%)
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Copy className="w-3.5 h-3.5 text-rose-500" />
            <span>Duplicate Rows</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {overview.duplicate_rows}
          </div>
        </Card>
      </div>

      {/* Column Profile Table */}
      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Column Statistical Profiles
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive schema breakdown with missingness rates and cardinality.
            </p>
          </div>
          <Badge variant="outline" size="sm">
            {overview.columns_summary.length} Attributes
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Column</th>
                <th className="px-4 py-3">Data Type</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Unique Values</th>
                <th className="px-4 py-3">Missing Count</th>
                <th className="px-4 py-3">Missing Rate</th>
                <th className="px-4 py-3 text-right">Quick Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {overview.columns_summary.map((col) => (
                <tr
                  key={col.name}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white font-mono">
                    {col.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">
                    {col.dtype}
                  </td>
                  <td className="px-4 py-3">
                    {col.is_numeric ? (
                      <Badge variant="success" size="sm">
                        Numeric
                      </Badge>
                    ) : (
                      <Badge variant="info" size="sm">
                        Categorical
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {col.unique_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {col.missing_count > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {col.missing_count}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {col.missing_percentage > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${Math.min(col.missing_percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-amber-600 dark:text-amber-400">
                          {col.missing_percentage}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">0.0%</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onSelectColumnForUnivariate(col.name)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium transition-colors"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
