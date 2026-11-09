"use client";

import React, { useState } from "react";
import { PivotTableResponse } from "@/types/analytics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  Table as TableIcon,
  Play,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

interface PivotStudioProps {
  datasetId: string;
  columns: Array<{ name: string; is_numeric: boolean; dtype: string }>;
}

export function PivotStudio({ datasetId, columns }: PivotStudioProps) {
  const catCols = columns.filter((c) => !c.is_numeric);
  const numCols = columns.filter((c) => c.is_numeric);

  const [indexCol, setIndexCol] = useState<string>(
    catCols[0]?.name || columns[0]?.name || ""
  );
  const [colsCol, setColsCol] = useState<string>(
    catCols[1]?.name || columns[1]?.name || columns[0]?.name || ""
  );
  const [valuesCol, setValuesCol] = useState<string>(
    numCols[0]?.name || columns[0]?.name || ""
  );
  const [aggFunc, setAggFunc] = useState<string>("mean");
  const [fillValue, setFillValue] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PivotTableResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = () => {
    if (!datasetId || !indexCol || !colsCol || !valuesCol) return;
    setLoading(true);
    setError(null);

    api
      .getPivotAnalysis({
        dataset_id: datasetId,
        index_column: indexCol,
        columns_column: colsCol,
        values_column: valuesCol,
        agg_func: aggFunc,
        fill_value: fillValue,
      })
      .then((res) => {
        setResult(res);
      })
      .catch((err) => {
        setError(err.message || "Failed to generate pivot table");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Multi-Dimensional Pivot Table Builder
            </h3>
          </div>
          <Badge variant="outline" size="sm">
            Pandas pivot_table
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Index (Rows) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              1. Row Index:
            </label>
            <div className="relative">
              <select
                value={indexCol}
                onChange={(e) => setIndexCol(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              >
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Columns (Headers) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              2. Column Headers:
            </label>
            <div className="relative">
              <select
                value={colsCol}
                onChange={(e) => setColsCol(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              >
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Values Column */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              3. Values Metric:
            </label>
            <div className="relative">
              <select
                value={valuesCol}
                onChange={(e) => setValuesCol(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              >
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Aggregation Function */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              4. Aggregation:
            </label>
            <div className="relative">
              <select
                value={aggFunc}
                onChange={(e) => setAggFunc(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              >
                <option value="mean">Mean (Average)</option>
                <option value="sum">Sum</option>
                <option value="count">Count</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Fill Value */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              5. Missing Fill:
            </label>
            <input
              type="number"
              value={fillValue}
              onChange={(e) => setFillValue(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button onClick={handleExecute} isLoading={loading}>
            <Play className="w-3.5 h-3.5 mr-1" />
            <span>Generate Pivot Matrix</span>
          </Button>
        </div>
      </Card>

      {/* Error State */}
      {error && !loading && (
        <Card className="p-6 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>Pivot Error</span>
          </div>
          <p className="text-xs mt-1">{error}</p>
        </Card>
      )}

      {/* Results Matrix */}
      {!loading && result && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Pivot Matrix: {result.values_column} ({result.agg_func.toUpperCase()})
              </h3>
              <p className="text-xs text-slate-500">
                Indexed by {result.index_column} across {result.columns_column}
              </p>
            </div>
            <Badge variant="success" size="sm">
              Dimensions: {result.shape[0]}×{result.shape[1]}
            </Badge>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800 sticky top-0">
                <tr>
                  {result.columns.map((c, i) => (
                    <th
                      key={c}
                      className={`px-4 py-2.5 font-mono ${
                        i === 0
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          : ""
                      }`}
                    >
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
                    {result.columns.map((c, colIdx) => (
                      <td
                        key={c}
                        className={`px-4 py-2.5 font-mono ${
                          colIdx === 0
                            ? "font-semibold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-900/40"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {typeof row[c] === "number"
                          ? (row[c] as number).toLocaleString(undefined, {
                              maximumFractionDigits: 3,
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

