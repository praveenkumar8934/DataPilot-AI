"use client";

import React, { useState } from "react";
import { DatabaseSchemaResponse } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import {
  Table2,
  ChevronRight,
  ChevronDown,
  Search,
  Eye,
  Terminal,
  ArrowDownToLine,
  Key,
  Layers,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface SchemaBrowserProps {
  schema: DatabaseSchemaResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onPreviewTable: (tableName: string) => void;
  onGenerateQuery: (tableName: string) => void;
  onImportTable: (tableName: string) => void;
  importingTable: string | null;
}

export function SchemaBrowser({
  schema,
  loading,
  onRefresh,
  onPreviewTable,
  onGenerateQuery,
  onImportTable,
  importingTable,
}: SchemaBrowserProps) {
  const [search, setSearch] = useState("");
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  const filteredTables = (schema?.tables || []).filter((t) =>
    t.table_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Schema & Tables
          </h2>
          {schema && (
            <Badge variant="default" size="sm">
              {schema.tables.length}
            </Badge>
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={loading || !schema}
          title="Refresh schema"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Search Input */}
      {schema && schema.tables.length > 0 && (
        <div className="relative mt-3 mb-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter tables..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pt-2 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-xs">Introspecting database schema...</span>
          </div>
        ) : !schema ? (
          <div className="text-center py-10 px-3">
            <Table2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              No database selected
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Select or connect to a database to inspect its tables and columns.
            </p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            {search ? "No tables match your filter." : "This database has no user tables."}
          </div>
        ) : (
          filteredTables.map((table) => {
            const isExpanded = !!expandedTables[table.table_name];
            const isImporting = importingTable === table.table_name;

            return (
              <div
                key={table.table_name}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden transition"
              >
                {/* Table Header Row */}
                <div
                  onClick={() => toggleTable(table.table_name)}
                  className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <Table2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {table.table_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {table.columns.length} cols
                    </span>
                  </div>
                </div>

                {/* Expanded Action Toolbar & Columns */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewTable(table.table_name);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition"
                      >
                        <Eye className="w-3 h-3 text-indigo-500" />
                        Preview
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateQuery(table.table_name);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition"
                      >
                        <Terminal className="w-3 h-3 text-indigo-500" />
                        Query
                      </button>

                      <button
                        type="button"
                        disabled={isImporting}
                        onClick={(e) => {
                          e.stopPropagation();
                          onImportTable(table.table_name);
                        }}
                        title="Import directly into DataPilot Active Workspace"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition disabled:opacity-50"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <ArrowDownToLine className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            Import to Workspace
                          </>
                        )}
                      </button>
                    </div>

                    {/* Columns List */}
                    <div className="space-y-1">
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between text-[11px] py-0.5 px-1 rounded hover:bg-white/60 dark:hover:bg-slate-800/60"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {col.primary_key && (
                              <span title="Primary Key">
                                <Key className="w-3 h-3 text-amber-500 shrink-0" />
                              </span>
                            )}
                            <span className="text-slate-700 dark:text-slate-300 font-mono truncate">
                              {col.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                            {col.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
