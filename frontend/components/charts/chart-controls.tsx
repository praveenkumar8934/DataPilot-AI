"use client";

import React from "react";
import { ChartRequest, ChartTypeInfo } from "@/types/visualization";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Palette,
  Settings,
  ChevronDown,
  Play,
} from "lucide-react";

interface ChartControlsProps {
  chartTypes: ChartTypeInfo[];
  columns: Array<{ name: string; is_numeric: boolean; dtype: string }>;
  config: ChartRequest;
  onChangeConfig: (newConfig: Partial<ChartRequest>) => void;
  onRender: () => void;
  loading: boolean;
}

const THEMES = [
  { id: "indigo", name: "Indigo", bg: "bg-indigo-500" },
  { id: "emerald", name: "Emerald", bg: "bg-emerald-500" },
  { id: "amber", name: "Amber", bg: "bg-amber-500" },
  { id: "rose", name: "Rose", bg: "bg-rose-500" },
  { id: "violet", name: "Violet", bg: "bg-violet-500" },
  { id: "cyan", name: "Cyan", bg: "bg-cyan-500" },
];

export function ChartControls({
  chartTypes,
  columns,
  config,
  onChangeConfig,
  onRender,
  loading,
}: ChartControlsProps) {
  const activeTypeInfo = chartTypes.find((t) => t.id === config.chart_type);
  const requiresX = activeTypeInfo ? activeTypeInfo.requires_x : true;
  const requiresY = activeTypeInfo ? activeTypeInfo.requires_y : true;
  const supportsAgg = activeTypeInfo ? activeTypeInfo.supports_aggregation : true;

  return (
    <Card className="p-5 space-y-5">
      {/* 1. Chart Variety Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            <span>1. Chart Type</span>
          </label>
          <Badge variant="outline" size="sm">
            {activeTypeInfo?.category || "Standard"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {chartTypes.map((ct) => {
            const isSelected = config.chart_type === ct.id;
            return (
              <button
                key={ct.id}
                type="button"
                onClick={() => onChangeConfig({ chart_type: ct.id })}
                className={`p-2.5 rounded-lg border text-left transition-all text-xs flex flex-col justify-between ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <span className="font-semibold">{ct.name}</span>
                <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                  {ct.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Axis & Aggregation Mapping */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-indigo-500" />
          <span>2. Axis Dimensions & Metric Mapping</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* X Axis */}
          {requiresX && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                X-Axis Dimension:
              </label>
              <div className="relative">
                <select
                  value={config.x_column || ""}
                  onChange={(e) => onChangeConfig({ x_column: e.target.value })}
                  className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                >
                  <option value="">Select Column...</option>
                  {columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.is_numeric ? "num" : "cat"})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Y Axis */}
          {requiresY && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Y-Axis Metric:
              </label>
              <div className="relative">
                <select
                  value={config.y_column || ""}
                  onChange={(e) => onChangeConfig({ y_column: e.target.value })}
                  className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                >
                  <option value="">Select Metric Column...</option>
                  {columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.is_numeric ? "numeric" : "text"})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Aggregation Function */}
          {supportsAgg && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Aggregation:
              </label>
              <div className="relative">
                <select
                  value={config.agg_func || "sum"}
                  onChange={(e) => onChangeConfig({ agg_func: e.target.value })}
                  className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                >
                  <option value="sum">Sum</option>
                  <option value="mean">Mean (Average)</option>
                  <option value="count">Count Records</option>
                  <option value="min">Min</option>
                  <option value="max">Max</option>
                  <option value="none">Raw (No Aggregation)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Histogram Bins */}
          {config.chart_type === "histogram" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Histogram Bins: {config.bins || 10}
              </label>
              <input
                type="range"
                min={5}
                max={30}
                value={config.bins || 10}
                onChange={(e) => onChangeConfig({ bins: parseInt(e.target.value) })}
                className="w-full accent-indigo-600 mt-2"
              />
            </div>
          )}

          {/* Limit / Max Points */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Record Limit:
            </label>
            <div className="relative">
              <select
                value={config.limit || 50}
                onChange={(e) => onChangeConfig({ limit: parseInt(e.target.value) })}
                className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
                <option value={100}>Top 100</option>
                <option value={500}>Up to 500</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Titles & Appearance Customization */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-indigo-500" />
          <span>3. Appearance & Customization</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Custom Title */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Chart Title:
            </label>
            <input
              type="text"
              placeholder="Auto-generated if empty..."
              value={config.title || ""}
              onChange={(e) => onChangeConfig({ title: e.target.value })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* X Label */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              X-Axis Label:
            </label>
            <input
              type="text"
              placeholder="Default column name..."
              value={config.x_label || ""}
              onChange={(e) => onChangeConfig({ x_label: e.target.value })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Y Label */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Y-Axis Label:
            </label>
            <input
              type="text"
              placeholder="Default metric name..."
              value={config.y_label || ""}
              onChange={(e) => onChangeConfig({ y_label: e.target.value })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Color Theme */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Color Palette:
            </label>
            <div className="flex items-center gap-1.5 pt-0.5">
              {THEMES.map((theme) => {
                const isSelected = (config.color_theme || "indigo") === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    title={theme.name}
                    onClick={() => onChangeConfig({ color_theme: theme.id })}
                    className={`w-6 h-6 rounded-full ${theme.bg} transition-all ${
                      isSelected ? "ring-2 ring-offset-2 ring-slate-800 scale-110" : "opacity-70 hover:opacity-100"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Render Action Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Click below to re-render with updated parameters & filters
        </span>
        <Button onClick={onRender} isLoading={loading}>
          <Play className="w-3.5 h-3.5 mr-1" />
          <span>Render Chart</span>
        </Button>
      </div>
    </Card>
  );
}
