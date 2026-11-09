"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Terminal,
} from "lucide-react";

interface SQLEditorProps {
  query: string;
  setQuery: (query: string) => void;
  limit: number;
  setLimit: (limit: number) => void;
  onExecute: () => void;
  loading: boolean;
  error: string | null;
  activeTable?: string;
}

export function SQLEditor({
  query,
  setQuery,
  limit,
  setLimit,
  onExecute,
  loading,
  error,
  activeTable,
}: SQLEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle Ctrl+Enter / Cmd+Enter to execute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!loading && query.trim()) {
          onExecute();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, query, onExecute]);

  const applyTemplate = (templateType: string) => {
    const table = activeTable || "customers";
    let q = "";
    switch (templateType) {
      case "select_all":
        q = `SELECT * FROM ${table} LIMIT ${limit};`;
        break;
      case "count":
        q = `SELECT count(*) AS total_records FROM ${table};`;
        break;
      case "order_desc":
        q = `SELECT * FROM ${table} ORDER BY 1 DESC LIMIT ${limit};`;
        break;
      case "group_summary":
        q = `SELECT * FROM ${table} LIMIT 25;`;
        break;
      default:
        q = `SELECT * FROM ${table} LIMIT ${limit};`;
    }
    setQuery(q);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col">
      {/* Editor Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            SQL Console
          </h2>
          <Badge variant="default" size="sm" className="hidden sm:inline-flex">
            Ctrl + Enter to run
          </Badge>
        </div>

        {/* Quick Query Templates */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">
            Templates:
          </span>
          <button
            type="button"
            onClick={() => applyTemplate("select_all")}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] font-mono transition"
          >
            SELECT *
          </button>
          <button
            type="button"
            onClick={() => applyTemplate("count")}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] font-mono transition"
          >
            COUNT(*)
          </button>
          <button
            type="button"
            onClick={() => applyTemplate("order_desc")}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] font-mono transition"
          >
            ORDER DESC
          </button>
        </div>
      </div>

      {/* SQL Editor Input */}
      <div className="relative mt-3">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`-- Write your read-only SQL query here (SELECT, WITH, SHOW, EXPLAIN)...
SELECT * FROM customers LIMIT 50;`}
          rows={6}
          spellCheck={false}
          className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed custom-scrollbar resize-y min-h-[120px]"
        />
      </div>

      {/* Safety Notice & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Strict read-only engine active (mutations blocked).</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Row Limit Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] text-slate-400">Max rows:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="text-xs py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setQuery("")}
            disabled={!query || loading}
            className="h-8 text-xs px-2.5 text-slate-500"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={onExecute}
            disabled={!query.trim() || loading}
            className="h-8 text-xs px-3 shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                Run Query
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Query Error Message */}
      {error && (
        <div className="mt-3 p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold">Query execution error</p>
            <p className="text-[11px] font-mono mt-0.5 break-words">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
