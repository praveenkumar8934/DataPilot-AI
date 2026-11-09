"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { api } from "@/lib/api";
import { PaginatedRowsResponse } from "@/types/dataset";
import { Pagination } from "@/components/data-table/pagination";
import { Button } from "@/components/ui/button";

interface DataTableProps {
  datasetId: string;
}

export function DataTable({ datasetId }: DataTableProps) {
  const [data, setData] = useState<PaginatedRowsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Table query states
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.getDatasetPreview(datasetId, {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
        search: debouncedSearch,
      });
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load dataset rows");
    } finally {
      setLoading(false);
    }
  }, [datasetId, page, pageSize, sortBy, sortOrder, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleHeaderClick = (colName: string) => {
    if (sortBy === colName) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        // Clear sort
        setSortBy(undefined);
        setSortOrder("asc");
      }
    } else {
      setSortBy(colName);
      setSortOrder("asc");
    }
    setPage(1);
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
          className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-medium ${
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
      {/* Table Toolbar */}
      <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search rows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {sortBy && (
            <button
              onClick={() => {
                setSortBy(undefined);
                setSortOrder("asc");
              }}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline px-1"
            >
              Clear sort ({sortBy})
            </button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            isLoading={loading}
            className="text-xs h-8"
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 m-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[300px] max-h-[600px] relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Loading dataset records...</span>
            </div>
          </div>
        )}

        {data && data.rows.length > 0 ? (
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0 z-10 backdrop-blur-sm">
                <th className="py-2.5 px-3 w-12 text-center text-[10px] text-slate-400 uppercase tracking-wider border-r border-slate-200/60 dark:border-slate-800/60">
                  #
                </th>
                {data.columns.map((col) => {
                  const isSorted = sortBy === col;
                  return (
                    <th
                      key={col}
                      onClick={() => handleHeaderClick(col)}
                      className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap select-none group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate max-w-[200px]" title={col}>
                          {col}
                        </span>
                        <span className="text-slate-400 group-hover:text-slate-600">
                          {isSorted ? (
                            sortOrder === "asc" ? (
                              <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                          )}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {data.rows.map((row, idx) => {
                const rowIndex = (data.page - 1) * data.page_size + idx + 1;
                return (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2 px-3 text-center text-[10px] text-slate-400 font-mono border-r border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/30">
                      {rowIndex}
                    </td>
                    {data.columns.map((col) => (
                      <td
                        key={col}
                        className="py-2 px-3.5 text-slate-700 dark:text-slate-300 max-w-[260px] truncate"
                      >
                        {renderCellValue(row[col])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <FileSpreadsheet className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm font-medium">No rows found</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {searchTerm ? "Try adjusting your search query." : "Dataset is empty."}
            </p>
          </div>
        ) : null}
      </div>

      {/* Pagination Bar */}
      {data && (
        <Pagination
          currentPage={data.page}
          totalPages={data.total_pages}
          pageSize={data.page_size}
          totalRows={data.total_rows}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(ps) => {
            setPageSize(ps);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}

