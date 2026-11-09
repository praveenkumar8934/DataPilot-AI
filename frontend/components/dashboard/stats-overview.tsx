"use client";

import React from "react";
import {
  Layers,
  FileSpreadsheet,
  Columns,
  HardDrive,
  AlertTriangle,
} from "lucide-react";
import { useDataset } from "@/context/dataset-context";
import { Card, CardContent } from "@/components/ui/card";

export function StatsOverview() {
  const { allDatasets, activeDataset } = useDataset();

  const totalDatasets = allDatasets.length;
  const activeRows = activeDataset ? activeDataset.row_count : 0;
  const activeCols = activeDataset ? activeDataset.column_count : 0;
  const activeSize = activeDataset ? activeDataset.file_size_formatted : "0 B";
  const missingCount = activeDataset ? activeDataset.missing_values_count : 0;
  const missingPct = activeDataset ? activeDataset.missing_percentage : 0;

  const stats = [
    {
      label: "Total Datasets",
      value: totalDatasets.toString(),
      subtext: totalDatasets === 1 ? "1 file loaded" : `${totalDatasets} files loaded`,
      icon: Layers,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/50",
    },
    {
      label: "Active Rows",
      value: activeRows.toLocaleString(),
      subtext: activeDataset ? activeDataset.original_name : "No active dataset",
      icon: FileSpreadsheet,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      label: "Active Columns",
      value: activeCols.toString(),
      subtext: activeDataset ? `${activeCols} features detected` : "0 features",
      icon: Columns,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/50",
    },
    {
      label: "Dataset Size",
      value: activeSize,
      subtext: activeDataset ? `Mem: ${activeDataset.memory_usage_formatted}` : "0 B",
      icon: HardDrive,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/50",
    },
    {
      label: "Missing Values",
      value: missingCount.toLocaleString(),
      subtext: `${missingPct}% of total cells`,
      icon: AlertTriangle,
      color: missingCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400",
      bg: missingCount > 0 ? "bg-amber-50 dark:bg-amber-950/50" : "bg-emerald-50 dark:bg-emerald-950/50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {stat.value}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {stat.subtext}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

