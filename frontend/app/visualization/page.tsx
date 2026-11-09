"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useDataset } from "@/context/dataset-context";
import { api } from "@/lib/api";
import {
  ChartDataResponse,
  ChartFilter,
  ChartRequest,
  ChartTypeInfo,
} from "@/types/visualization";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartControls } from "@/components/charts/chart-controls";
import { ChartFilters } from "@/components/charts/chart-filters";
import { ChartRenderer } from "@/components/charts/chart-renderer";
import { ChartExportBar } from "@/components/charts/chart-export-bar";
import {
  PieChart as PieChartIcon,
  Upload,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

export default function VisualizationPage() {
  const { activeDataset, isLoading: datasetLoading } = useDataset();

  const [chartTypes, setChartTypes] = useState<ChartTypeInfo[]>([]);
  const [config, setConfig] = useState<ChartRequest>({
    dataset_id: "",
    chart_type: "bar",
    x_column: "",
    y_column: "",
    agg_func: "sum",
    limit: 20,
    color_theme: "indigo",
    bins: 10,
    sort_by: "y",
    sort_order: "desc",
    filters: [],
  });

  const [chartData, setChartData] = useState<ChartDataResponse | null>(null);
  const [rendering, setRendering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load chart types on mount
  useEffect(() => {
    api
      .getChartTypes()
      .then((types) => setChartTypes(types))
      .catch((err) => console.error("Failed to load chart types:", err));
  }, []);

  // Set default columns when activeDataset changes
  useEffect(() => {
    if (!activeDataset) {
      setChartData(null);
      return;
    }

    const cols = activeDataset.columns;
    const catCol = cols.find(
      (c) =>
        !c.data_type.toLowerCase().includes("int") &&
        !c.data_type.toLowerCase().includes("float")
    )?.name || cols[0]?.name || "";

    const numCol = cols.find(
      (c) =>
        c.data_type.toLowerCase().includes("int") ||
        c.data_type.toLowerCase().includes("float")
    )?.name || cols[1]?.name || cols[0]?.name || "";

    setConfig((prev) => ({
      ...prev,
      dataset_id: activeDataset.id,
      x_column: catCol,
      y_column: numCol,
      filters: [],
    }));
  }, [activeDataset]);

  // Execute chart rendering
  const handleRender = useCallback(() => {
    if (!config.dataset_id) return;
    setRendering(true);
    setError(null);

    api
      .renderChart(config)
      .then((data) => {
        setChartData(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to render chart");
      })
      .finally(() => {
        setRendering(false);
      });
  }, [config]);

  // Initial render when config.dataset_id is populated
  useEffect(() => {
    if (config.dataset_id && config.x_column) {
      handleRender();
    }
  }, [config.dataset_id, config.x_column, handleRender]);

  const updateConfig = (newConfig: Partial<ChartRequest>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // Filter methods
  const addFilter = () => {
    if (!activeDataset || activeDataset.columns.length === 0) return;
    const firstCol = activeDataset.columns[0].name;
    const newFilter: ChartFilter = {
      column: firstCol,
      operator: "equals",
      value: "",
    };
    setConfig((prev) => ({
      ...prev,
      filters: [...(prev.filters || []), newFilter],
    }));
  };

  const updateFilter = (index: number, updated: Partial<ChartFilter>) => {
    setConfig((prev) => {
      const current = [...(prev.filters || [])];
      current[index] = { ...current[index], ...updated };
      return { ...prev, filters: current };
    });
  };

  const removeFilter = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      filters: (prev.filters || []).filter((_, i) => i !== index),
    }));
  };

  const clearFilters = () => {
    setConfig((prev) => ({ ...prev, filters: [] }));
  };

  if (datasetLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-xs">Loading Visualization Workspace...</span>
      </div>
    );
  }

  if (!activeDataset) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-indigo-500" />
            <span>Visualization Studio</span>
            <Badge variant="info" size="sm">
              Phase 5
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Interactive charting suite: Bar, Line, Pie, Donut, Scatter, Box, Area, and Heatmap.
          </p>
        </div>

        <Card className="p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            No Active Dataset Selected
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Please select or upload a dataset to generate publication-grade interactive visualizations, custom color palettes, and data filters.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard">
              <Button size="sm">
                <Upload className="w-3.5 h-3.5 mr-1" />
                <span>Go to Dashboard</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const columnList = activeDataset.columns.map((c) => ({
    name: c.name,
    is_numeric:
      c.data_type.toLowerCase().includes("int") ||
      c.data_type.toLowerCase().includes("float"),
    dtype: c.data_type,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-indigo-500" />
            <span>Visualization Studio</span>
            <Badge variant="info" size="sm">
              Phase 5
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Interactive charting suite: Bar, Line, Pie, Donut, Scatter, Box, Area, Heatmap, and Correlation Matrix.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" size="sm" className="font-mono">
            {activeDataset.original_name || activeDataset.filename} (
            {activeDataset.row_count.toLocaleString()} rows)
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRender}
            isLoading={rendering}
            title="Re-render chart"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Controls and Pre-filters (5 cols on xl) */}
        <div className="xl:col-span-5 space-y-6">
          <ChartControls
            chartTypes={chartTypes}
            columns={columnList}
            config={config}
            onChangeConfig={updateConfig}
            onRender={handleRender}
            loading={rendering}
          />

          <ChartFilters
            columns={columnList}
            filters={config.filters || []}
            onAddFilter={addFilter}
            onUpdateFilter={updateFilter}
            onRemoveFilter={removeFilter}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Right Column: Visualization Canvas & Export (7 cols on xl) */}
        <div className="xl:col-span-7 space-y-4">
          {error && (
            <Card className="p-4 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>Visualization Error</span>
              </div>
              <p className="text-xs mt-1">{error}</p>
            </Card>
          )}

          <Card className="p-6">
            {chartData ? (
              <ChartRenderer chartData={chartData} />
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-slate-400">
                <PieChartIcon className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs">Configure options and click &quot;Render Chart&quot;</p>
              </div>
            )}
          </Card>

          {chartData && <ChartExportBar chartData={chartData} />}
        </div>
      </div>
    </div>
  );
}
