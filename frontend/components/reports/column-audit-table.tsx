"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ColumnAudit } from "@/types/exports";
import { Search, Layers, ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react";

interface ColumnAuditTableProps {
  columns: ColumnAudit[];
}

export function ColumnAuditTable({ columns }: ColumnAuditTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return columns.filter((col) => {
      const matchSearch = col.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || col.quality_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [columns, search, statusFilter]);

  const getStatusBadge = (status: "good" | "warning" | "critical") => {
    switch (status) {
      case "good":
        return (
          <Badge variant="success" size="sm" className="gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Good</span>
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="warning" size="sm" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Warning</span>
          </Badge>
        );
      case "critical":
        return (
          <Badge variant="danger" size="sm" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Critical</span>
          </Badge>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
      {/* Table Header and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Column Quality & Health Audit
          </h2>
          <Badge variant="default" size="sm">
            {filtered.length} of {columns.length}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search column..."
              className="pl-8 pr-3 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36 sm:w-44"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 text-xs">
            {["all", "critical", "warning", "good"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition ${
                  statusFilter === st
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Grid */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-[460px] custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-950/70 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                Column
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                Type
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                Missing Values
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                Distinct
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                Quality Status
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                Sample Values
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
            {filtered.map((col) => (
              <tr
                key={col.name}
                className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-colors"
              >
                <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                  {col.name}
                </td>
                <td className="py-2.5 px-3">
                  <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                    {col.data_type}
                  </Badge>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {col.null_count.toLocaleString()} ({col.null_percentage}%)
                    </span>
                    {col.null_percentage > 0 && (
                      <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            col.null_percentage > 40 ? "bg-rose-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(100, col.null_percentage)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  {col.unique_count.toLocaleString()} ({col.unique_percentage}%)
                </td>
                <td className="py-2.5 px-3">{getStatusBadge(col.quality_status)}</td>
                <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500 max-w-[200px] truncate">
                  {col.sample_values.length > 0
                    ? col.sample_values.map((v) => String(v)).join(", ")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

