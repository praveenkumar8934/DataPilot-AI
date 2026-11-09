"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { ReportSummaryResponse } from "@/types/exports";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Database,
  Layers,
  Copy,
  FileQuestion,
} from "lucide-react";

interface HealthScoreGaugeProps {
  summary: ReportSummaryResponse;
}

export function HealthScoreGauge({ summary }: HealthScoreGaugeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 88) return "text-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40";
    if (score >= 72) return "text-indigo-500 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40";
    if (score >= 50) return "text-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-950/40";
    return "text-rose-500 border-rose-500 bg-rose-50 dark:bg-rose-950/40";
  };

  const getRatingBadgeVariant = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "excellent":
        return "success";
      case "good":
        return "info";
      case "fair":
        return "warning";
      default:
        return "danger";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        {/* Left: Big Score & Rating */}
        <div className="flex items-center gap-5">
          <div
            className={`w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 shadow-inner ${getScoreColor(
              summary.health_score
            )}`}
          >
            <span className="text-3xl font-extrabold tracking-tight">
              {summary.health_score}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              / 100
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Data Quality Health Score
              </h2>
              <Badge variant={getRatingBadgeVariant(summary.quality_rating)} size="sm">
                {summary.quality_rating}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Synthesized composite audit of data completeness, row uniqueness, and column schema validity.
            </p>
          </div>
        </div>

        {/* Right: Quick Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-400">
              <Database className="w-3 h-3 text-indigo-500" />
              <span>Rows</span>
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {summary.total_rows.toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-400">
              <Layers className="w-3 h-3 text-indigo-500" />
              <span>Columns</span>
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {summary.total_columns}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-400">
              <FileQuestion className="w-3 h-3 text-amber-500" />
              <span>Missing</span>
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {summary.missing_cells_percentage}%
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-400">
              <Copy className="w-3 h-3 text-rose-500" />
              <span>Duplicates</span>
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {summary.duplicate_percentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Health Component Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
        {/* Completeness */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Completeness
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {summary.completeness_score}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, summary.completeness_score))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {summary.missing_cells.toLocaleString()} missing cells across entire dataset
          </p>
        </div>

        {/* Uniqueness */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              Uniqueness
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {summary.uniqueness_score}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, summary.uniqueness_score))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {summary.duplicate_rows.toLocaleString()} identical duplicate records detected
          </p>
        </div>

        {/* Consistency */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Schema Validity
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {summary.consistency_score}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, summary.consistency_score))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Proportion of columns without empty or constant zero-variance values
          </p>
        </div>
      </div>
    </div>
  );
}
