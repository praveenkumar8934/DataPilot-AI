"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Search,
  Table as TableIcon,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  ArrowDownToLine,
  Loader2,
} from "lucide-react";

interface QueryResultsTableProps {
  columns: string[];
  rows: Record<string, any>[];
  rowCount?: number;
  executionTimeMs?: number;
  isTruncated?: boolean;
  title?: string;
  onImportAsDataset?: () => void;
  importing?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

export function QueryResultsTable({
  columns,
  rows,
  rowCount,
  executionTimeMs,
  isTruncated = false,
  title = "Query Results",
  onImportAsDataset,
  importing = false,
  loading = false,
  emptyMessage = "Run a query or click Preview on any table to view records.",
}: QueryResultsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  // Filtered and sorted rows
  const filteredRows = useMemo(() => {
    let result = [...rows];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(term)
        )
      );
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }
        return sortDirection === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [rows, searchTerm, sortColumn, sortDirection]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Export handlers
  const exportCSV = () => {
    if (!columns.length || !rows.length) return;
    const header = columns.join(",");
    const body = rows
      .map((r) =>
        columns
          .map((col) => {
            const val = r[col];
            if (val === null || val === undefined) return "";
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(",")
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `query_result_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!rows.length) return;
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `query_result_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-2" />
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Loading Data...
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">
          {emptyMessage}
        </p>
      </div>
    );
  }

  if (!columns || columns.length === 0 || rows.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
        <TableIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-60" />
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
          No Results to Display
        </h3>
        <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col space-y-3">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {title}
          </h2>
          <Badge variant="info" size="sm">
            {rowCount !== undefined ? `${filteredRows.length} of ${rowCount} rows` : `${filteredRows.length} rows`}
          </Badge>
          {executionTimeMs !== undefined && (
            <Badge variant="default" size="sm" className="gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{executionTimeMs} ms</span>
            </Badge>
          )}
          {isTruncated && (
            <Badge variant="warning" size="sm" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Truncated at limit</span>
            </Badge>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search in results..."
              className="pl-7 pr-3 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36 sm:w-44"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={exportCSV}
            className="h-7 text-xs px-2.5"
            title="Download results as CSV"
          >
            <Download className="w-3 h-3 mr-1" />
            CSV
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={exportJSON}
            className="h-7 text-xs px-2.5"
            title="Download results as JSON"
          >
            <Download className="w-3 h-3 mr-1" />
            JSON
          </Button>

          {onImportAsDataset && (
            <Button
              size="sm"
              variant="primary"
              onClick={onImportAsDataset}
              disabled={importing}
              className="h-7 text-xs px-2.5 shadow-xs"
              title="Import this table into DataPilot active workspace"
            >
              {importing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Importing...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-3 h-3 mr-1" />
                  Import to Workspace
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Grid View */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl custom-scrollbar max-h-[460px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-950/70 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2 px-3 text-[11px] font-bold text-slate-400 w-12 text-center">
                #
              </th>
              {columns.map((col) => {
                const isSorted = sortColumn === col;
                return (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300 select-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col}</span>
                      {isSorted ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="w-3 h-3 text-indigo-500" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-indigo-500" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
            {paginatedRows.map((row, idx) => {
              const rowNumber = (currentPage - 1) * pageSize + idx + 1;
              return (
                <tr
                  key={idx}
                  className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors"
                >
                  <td className="py-2 px-3 text-center text-[10px] text-slate-400 font-mono">
                    {rowNumber}
                  </td>
                  {columns.map((col) => {
                    const val = row[col];
                    const isNull = val === null || val === undefined;
                    return (
                      <td
                        key={col}
                        className="py-2 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-[260px] truncate"
                        title={isNull ? "NULL" : String(val)}
                      >
                        {isNull ? (
                          <span className="text-slate-400 italic">NULL</span>
                        ) : typeof val === "boolean" ? (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {String(val)}
                          </span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="text-[11px]">
          Showing {Math.min((currentPage - 1) * pageSize + 1, filteredRows.length)} to{" "}
          {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} records
        </span>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="h-7 px-2.5 text-xs"
          >
            Previous
          </Button>
          <span className="text-[11px] font-mono px-2">
            {currentPage} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="h-7 px-2.5 text-xs"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
