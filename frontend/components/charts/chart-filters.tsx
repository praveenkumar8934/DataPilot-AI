"use client";

import React from "react";
import { ChartFilter } from "@/types/visualization";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, Plus, Trash2, ChevronDown } from "lucide-react";

interface ChartFiltersProps {
  columns: Array<{ name: string; is_numeric: boolean; dtype: string }>;
  filters: ChartFilter[];
  onAddFilter: () => void;
  onUpdateFilter: (index: number, updated: Partial<ChartFilter>) => void;
  onRemoveFilter: (index: number) => void;
  onClearFilters: () => void;
}

const OPERATORS = [
  { id: "equals", label: "Equals (=)" },
  { id: "not_equals", label: "Not Equals (!=)" },
  { id: "greater_than", label: "Greater Than (>)" },
  { id: "greater_than_or_equal", label: "Greater Than or Equal (>=)" },
  { id: "less_than", label: "Less Than (<)" },
  { id: "less_than_or_equal", label: "Less Than or Equal (<=)" },
  { id: "contains", label: "Contains Text" },
  { id: "is_null", label: "Is Null / Missing" },
  { id: "not_null", label: "Is Not Null" },
];

export function ChartFilters({
  columns,
  filters,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onClearFilters,
}: ChartFiltersProps) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Dataset Pre-Filters
          </h3>
          <Badge variant={filters.length > 0 ? "info" : "outline"} size="sm">
            {filters.length} active
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {filters.length > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-[11px] text-slate-400 hover:text-rose-500 transition-colors"
            >
              Clear All
            </button>
          )}
          <Button size="sm" variant="outline" onClick={onAddFilter}>
            <Plus className="w-3 h-3 mr-1" />
            <span>Add Filter</span>
          </Button>
        </div>
      </div>

      {filters.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">
          No filters applied. The chart will render across all dataset records.
        </p>
      ) : (
        <div className="space-y-2">
          {filters.map((f, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
            >
              {/* Column */}
              <div className="relative w-full sm:w-44">
                <select
                  value={f.column}
                  onChange={(e) => onUpdateFilter(idx, { column: e.target.value })}
                  className="w-full appearance-none pl-2.5 pr-7 py-1.5 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>

              {/* Operator */}
              <div className="relative w-full sm:w-48">
                <select
                  value={f.operator}
                  onChange={(e) =>
                    onUpdateFilter(idx, {
                      operator: e.target.value as ChartFilter["operator"],
                    })
                  }
                  className="w-full appearance-none pl-2.5 pr-7 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>

              {/* Value Input */}
              {f.operator !== "is_null" && f.operator !== "not_null" && (
                <input
                  type="text"
                  placeholder="Comparison value..."
                  value={f.value ?? ""}
                  onChange={(e) => onUpdateFilter(idx, { value: e.target.value })}
                  className="w-full sm:flex-1 px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              )}

              {/* Delete */}
              <button
                type="button"
                onClick={() => onRemoveFilter(idx)}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Remove filter"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

