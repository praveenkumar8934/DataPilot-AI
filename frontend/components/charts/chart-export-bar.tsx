"use client";

import React, { useState } from "react";
import { ChartDataResponse } from "@/types/visualization";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet, Image as ImageIcon } from "lucide-react";

interface ChartExportBarProps {
  chartData: ChartDataResponse;
}

export function ChartExportBar({ chartData }: ChartExportBarProps) {
  const [downloading, setDownloading] = useState<boolean>(false);

  const downloadJSON = () => {
    const jsonStr = JSON.stringify(chartData.data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chartData.chart_type}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (!chartData.data || chartData.data.length === 0) return;
    const headers = Object.keys(chartData.data[0]);
    const csvRows = [headers.join(",")];
    for (const row of chartData.data) {
      const values = headers.map((h) => {
        const val = row[h];
        if (typeof val === "string") {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? "";
      });
      csvRows.push(values.join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chartData.chart_type}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSVG = () => {
    setDownloading(true);
    try {
      // Find SVG inside recharts or custom container
      const svgEl = document.querySelector(".recharts-surface") || document.querySelector("svg");
      if (!svgEl) {
        alert("Chart SVG element not found to download.");
        return;
      }
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgEl);

      // Add xml declaration and namespace
      if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${chartData.chart_type}_chart.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Failed to download chart SVG:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
      <div className="flex items-center gap-1.5 text-slate-500">
        <Download className="w-3.5 h-3.5" />
        <span>Export Chart & Aggregated Series:</span>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={downloadSVG} isLoading={downloading}>
          <ImageIcon className="w-3.5 h-3.5 mr-1" />
          <span>Save SVG</span>
        </Button>

        <Button size="sm" variant="outline" onClick={downloadCSV}>
          <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
          <span>Export CSV</span>
        </Button>

        <Button size="sm" variant="outline" onClick={downloadJSON}>
          <FileJson className="w-3.5 h-3.5 mr-1" />
          <span>Export JSON</span>
        </Button>
      </div>
    </div>
  );
}
