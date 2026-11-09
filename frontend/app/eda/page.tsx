"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useDataset } from "@/context/dataset-context";
import { api } from "@/lib/api";
import { EDAOverview } from "@/types/analytics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EDAOverviewPanel } from "@/components/eda/eda-overview-panel";
import { UnivariateExplorer } from "@/components/eda/univariate-explorer";
import { BivariateExplorer } from "@/components/eda/bivariate-explorer";
import { CorrelationMatrixView } from "@/components/eda/correlation-matrix-view";
import { GroupByStudio } from "@/components/eda/groupby-studio";
import { PivotStudio } from "@/components/eda/pivot-studio";
import {
  BarChart3,
  Layers,
  Table as TableIcon,
  Grid,
  GitCompare,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Upload,
} from "lucide-react";

type EDATab =
  | "overview"
  | "univariate"
  | "bivariate"
  | "correlation"
  | "groupby"
  | "pivot";

export default function EDAPage() {
  const { activeDataset, isLoading: datasetLoading } = useDataset();

  const [activeTab, setActiveTab] = useState<EDATab>("overview");
  const [overview, setOverview] = useState<EDAOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Selected column for univariate tab
  const [selectedUnivariateCol, setSelectedUnivariateCol] = useState<string>("");

  const loadOverview = useCallback((datasetId: string) => {
    setLoadingOverview(true);
    setOverviewError(null);

    api
      .getEDAOverview(datasetId)
      .then((data) => {
        setOverview(data);
        if (data.columns_summary.length > 0 && !selectedUnivariateCol) {
          setSelectedUnivariateCol(data.columns_summary[0].name);
        }
      })
      .catch((err) => {
        setOverviewError(err.message || "Failed to load exploratory data overview");
      })
      .finally(() => {
        setLoadingOverview(false);
      });
  }, [selectedUnivariateCol]);

  useEffect(() => {
    if (activeDataset?.id) {
      loadOverview(activeDataset.id);
    } else {
      setOverview(null);
    }
  }, [activeDataset?.id, loadOverview]);

  const handleSelectColForUnivariate = (colName: string) => {
    setSelectedUnivariateCol(colName);
    setActiveTab("univariate");
  };

  // If loading dataset context
  if (datasetLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-xs">Initializing Exploratory Data Analysis Workspace...</span>
      </div>
    );
  }

  // If no dataset is active
  if (!activeDataset) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <span>Exploratory Data Analysis</span>
            <Badge variant="info" size="sm">
              Phase 4
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Univariate, bivariate, multivariate, correlation matrix, and GroupBy pivot tables.
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
            Upload a CSV, Excel, or JSON file, or select an existing dataset from your dashboard to begin interactive statistical profiling and exploratory analysis.
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

  const columnList =
    overview?.columns_summary.map((c) => ({
      name: c.name,
      is_numeric: c.is_numeric,
      dtype: c.dtype,
    })) ||
    activeDataset.columns.map((c) => ({
      name: c.name,
      is_numeric:
        c.data_type.toLowerCase().includes("int") ||
        c.data_type.toLowerCase().includes("float"),
      dtype: c.data_type,
    }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Dataset Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <span>Exploratory Data Analysis</span>
            <Badge variant="info" size="sm">
              Phase 4
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Interactive statistical profiling, correlation heatmaps, bivariate modeling, and pivot tables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" size="sm" className="font-mono">
            {activeDataset.original_name || activeDataset.filename} (
            {activeDataset.row_count.toLocaleString()} rows ×{" "}
            {activeDataset.column_count} cols)
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => loadOverview(activeDataset.id)}
            isLoading={loadingOverview}
            title="Refresh EDA statistics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Overview Error Alert */}
      {overviewError && (
        <Card className="p-4 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>Failed to load EDA profile</span>
          </div>
          <p className="text-xs mt-1">{overviewError}</p>
        </Card>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "overview"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Dataset Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("univariate")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "univariate"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Univariate Distributions</span>
        </button>

        <button
          onClick={() => setActiveTab("bivariate")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "bivariate"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Bivariate & Scatter</span>
        </button>

        <button
          onClick={() => setActiveTab("correlation")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "correlation"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Correlation Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab("groupby")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "groupby"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>GroupBy Studio</span>
        </button>

        <button
          onClick={() => setActiveTab("pivot")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "pivot"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Pivot Table Studio</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && overview && (
        <EDAOverviewPanel
          overview={overview}
          onSelectColumnForUnivariate={handleSelectColForUnivariate}
        />
      )}

      {activeTab === "univariate" && (
        <UnivariateExplorer
          datasetId={activeDataset.id}
          columns={columnList}
          selectedColumn={selectedUnivariateCol || columnList[0]?.name || ""}
          onSelectColumn={(col) => setSelectedUnivariateCol(col)}
        />
      )}

      {activeTab === "bivariate" && (
        <BivariateExplorer
          datasetId={activeDataset.id}
          columns={columnList}
        />
      )}

      {activeTab === "correlation" && (
        <CorrelationMatrixView datasetId={activeDataset.id} />
      )}

      {activeTab === "groupby" && (
        <GroupByStudio
          datasetId={activeDataset.id}
          columns={columnList}
        />
      )}

      {activeTab === "pivot" && (
        <PivotStudio
          datasetId={activeDataset.id}
          columns={columnList}
        />
      )}
    </div>
  );
}
