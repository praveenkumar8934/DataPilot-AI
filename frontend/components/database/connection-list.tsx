"use client";

import React from "react";
import { DatabaseConnectionSummary } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Server,
  HardDrive,
  Trash2,
  CheckCircle2,
  Plus,
  RefreshCw,
  Layers,
} from "lucide-react";

interface ConnectionListProps {
  connections: DatabaseConnectionSummary[];
  selectedId: string | null;
  onSelect: (connection: DatabaseConnectionSummary) => void;
  onDelete: (id: string) => void;
  onOpenNewDialog: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function ConnectionList({
  connections,
  selectedId,
  onSelect,
  onDelete,
  onOpenNewDialog,
  onRefresh,
  loading = false,
}: ConnectionListProps) {
  const getEngineIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "sqlite":
        return <HardDrive className="w-4 h-4 text-emerald-500" />;
      case "postgresql":
        return <Server className="w-4 h-4 text-sky-500" />;
      case "mysql":
        return <Database className="w-4 h-4 text-amber-500" />;
      default:
        return <Layers className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getEngineBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case "sqlite":
        return "success";
      case "postgresql":
        return "info";
      case "mysql":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Databases
          </h2>
          <Badge variant="default" size="sm">
            {connections.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh connections"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button
            size="sm"
            variant="primary"
            onClick={onOpenNewDialog}
            className="h-7 text-xs px-2.5 gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect</span>
          </Button>
        </div>
      </div>

      {/* Connection List Items */}
      <div className="flex-1 overflow-y-auto space-y-2 pt-3 custom-scrollbar">
        {connections.length === 0 ? (
          <div className="text-center py-8 px-3">
            <Database className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              No saved connections
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
              Add a SQLite, PostgreSQL, or MySQL connection to begin querying.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenNewDialog}
              className="mt-3 text-xs h-7"
            >
              Add Connection
            </Button>
          </div>
        ) : (
          connections.map((conn) => {
            const isSelected = conn.id === selectedId;
            return (
              <div
                key={conn.id}
                onClick={() => onSelect(conn)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getEngineIcon(conn.db_type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {conn.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate font-mono">
                        {conn.database}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove connection "${conn.name}"?`)) {
                          onDelete(conn.id);
                        }
                      }}
                      title="Delete connection"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-2">
                  <Badge variant={getEngineBadgeVariant(conn.db_type)} size="sm">
                    {conn.db_type.toUpperCase()}
                  </Badge>
                  {conn.is_readonly && (
                    <Badge variant="default" size="sm">
                      Read-Only
                    </Badge>
                  )}
                  {conn.host && (
                    <span className="text-[10px] text-slate-400 ml-auto font-mono">
                      {conn.host}:{conn.port || ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
