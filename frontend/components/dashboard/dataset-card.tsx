"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  FileText,
  FileJson,
  Check,
  Eye,
  Trash2,
  Calendar,
} from "lucide-react";
import { DatasetSummary } from "@/types/dataset";
import { useDataset } from "@/context/dataset-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

interface DatasetCardProps {
  dataset: DatasetSummary;
}

export function DatasetCard({ dataset }: DatasetCardProps) {
  const { setActiveDatasetId, deleteDatasetById } = useDataset();
  const [isDeleting, setIsDeleting] = useState(false);

  const getFormatIcon = (format: string) => {
    switch (format.toUpperCase()) {
      case "CSV":
        return <FileText className="w-5 h-5 text-emerald-500" />;
      case "XLSX":
      case "XLS":
        return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      case "JSON":
        return <FileJson className="w-5 h-5 text-amber-500" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-500" />;
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${dataset.original_name}"?`)) {
      setIsDeleting(true);
      try {
        await deleteDatasetById(dataset.id);
      } catch (err: any) {
        alert(`Failed to delete dataset: ${err.message}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
        dataset.is_active
          ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/80 shadow-xs ring-1 ring-indigo-500/30"
          : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0">
              {getFormatIcon(dataset.file_format)}
            </div>
            <div className="min-w-0">
              <h4
                className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate"
                title={dataset.original_name}
              >
                {dataset.original_name}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>{formatDateTime(dataset.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="outline" size="sm">
              {dataset.file_format}
            </Badge>
            {dataset.is_active && (
              <Badge variant="success" size="sm">
                Active
              </Badge>
            )}
          </div>
        </div>

        {/* Dataset metrics row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 text-center">
          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span className="block text-[10px] text-slate-400">Rows</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {dataset.row_count.toLocaleString()}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span className="block text-[10px] text-slate-400">Cols</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {dataset.column_count}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span className="block text-[10px] text-slate-400">Size</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {dataset.file_size_formatted}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70">
        {!dataset.is_active ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveDatasetId(dataset.id)}
            className="text-xs flex-1"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Set Active
          </Button>
        ) : (
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 px-2">
            <Check className="w-3.5 h-3.5" /> Active Dataset
          </span>
        )}

        <div className="flex items-center gap-1">
          <Link href={`/data-sources?id=${dataset.id}`}>
            <Button variant="ghost" size="sm" className="text-xs">
              <Eye className="w-3.5 h-3.5 mr-1" />
              Preview
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            isLoading={isDeleting}
            onClick={handleDelete}
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5"
            title="Delete dataset"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

