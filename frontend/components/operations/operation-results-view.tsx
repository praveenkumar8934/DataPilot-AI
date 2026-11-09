"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  AlertCircle,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { OperationResult } from "@/types/operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OperationResultsViewProps {
  result: OperationResult;
}

export function OperationResultsView({ result }: OperationResultsViewProps) {
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const copyToClipboard = () => {
    let textToCopy = "";
    if (result.rows) {
      textToCopy = JSON.stringify(result.rows, null, 2);
    } else if (result.data) {
      textToCopy = typeof result.data === "object" ? JSON.stringify(result.data, null, 2) : String(result.data);
    } else {
      textToCopy = result.summary;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderCellValue = (val: any) => {
    if (val === null || val === undefined) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
          null
        </span>
      );
    }
    if (typeof val === "boolean") {
      return (
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
            val
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          {val ? "TRUE" : "FALSE"}
        </span>
      );
    }
    if (typeof val === "number") {
      return <span className="font-mono text-slate-800 dark:text-slate-200">{val.toLocaleString()}</span>;
    }
    return <span className="truncate">{String(val)}</span>;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Result Header */}
      <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60 dark:bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Badge variant={result.success ? "success" : "danger"} size="sm">
            {result.operation}()
          </Badge>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {result.summary}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            {result.execution_time_ms} ms
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="h-7 text-xs px-2"
            title="Copy output"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500 mr-1" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" /> Copy
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRawJson(!showRawJson)}
            className="h-7 text-xs px-2 text-slate-500"
            title="Toggle Raw JSON"
          >
            {showRawJson ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            JSON
          </Button>
        </div>
      </div>

      {/* Error state */}
      {!result.success && result.error && (
        <div className="p-4 m-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Operation Error</p>
            <p className="mt-0.5 font-mono text-[11px]">{result.error}</p>
          </div>
        </div>
      )}

      {/* Raw JSON View */}
      {showRawJson && (
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {/* Main Content View based on result_type */}
      {result.success && (
        <div className="p-4">
          {/* 1. Table Result */}
          {result.result_type === "table" && result.rows && result.columns && (
            <div className="overflow-x-auto max-h-[500px] border border-slate-200/60 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                    <th className="py-2 px-2.5 w-10 text-center text-[10px] text-slate-400 border-r border-slate-200/60 dark:border-slate-800/60">
                      #
                    </th>
                    {result.columns.map((col) => (
                      <th
                        key={col}
                        className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {result.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-1.5 px-2.5 text-center text-[10px] text-slate-400 font-mono bg-slate-50/30 dark:bg-slate-900/30 border-r border-slate-100 dark:border-slate-800/60">
                        {rIdx + 1}
                      </td>
                      {result.columns!.map((col) => (
                        <td
                          key={col}
                          className="py-1.5 px-3 text-slate-800 dark:text-slate-200 max-w-[240px] truncate"
                        >
                          {renderCellValue(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Scalar Result */}
          {result.result_type === "scalar" && (
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Calculated Value
              </span>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
                {typeof result.data === "number" ? result.data.toLocaleString() : String(result.data)}
              </p>
            </div>
          )}

          {/* 3. Series Result */}
          {result.result_type === "series" && Array.isArray(result.data) && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Output Items ({result.data.length})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                {result.data.map((item: any, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    {String(item)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 4. Dictionary Result */}
          {result.result_type === "dict" && result.data && typeof result.data === "object" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[450px] overflow-y-auto">
              {Object.entries(result.data).map(([key, val]) => (
                <div
                  key={key}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between"
                >
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate" title={key}>
                    {key}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                    {val === null || val === undefined
                      ? "null"
                      : Array.isArray(val)
                      ? val.join(", ")
                      : typeof val === "number"
                      ? val.toLocaleString()
                      : String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 5. Info Result */}
          {result.result_type === "info" && result.data && (
            <div className="space-y-4">
              {result.data.columns_info && (
                <div className="overflow-x-auto max-h-80 border border-slate-200/60 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                        <th className="py-2 px-3 font-semibold">Column</th>
                        <th className="py-2 px-3 font-semibold">Non-Null Count</th>
                        <th className="py-2 px-3 font-semibold">Null Count</th>
                        <th className="py-2 px-3 font-semibold">Dtype</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {result.data.columns_info.map((ci: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-1.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                            {ci.column}
                          </td>
                          <td className="py-1.5 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                            {ci.non_null_count.toLocaleString()}
                          </td>
                          <td className="py-1.5 px-3 font-mono text-amber-600 dark:text-amber-400">
                            {ci.null_count.toLocaleString()}
                          </td>
                          <td className="py-1.5 px-3 font-mono text-slate-500">
                            {ci.dtype}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {result.data.raw_text && (
                <div className="p-3 bg-slate-950 text-slate-300 font-mono text-[11px] rounded-lg overflow-x-auto max-h-60">
                  <pre>{result.data.raw_text}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
