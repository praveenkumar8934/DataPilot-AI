"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartDataResponse } from "@/types/visualization";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChartRendererProps {
  chartData: ChartDataResponse;
}

const PALETTES: Record<string, string[]> = {
  indigo: ["#6366f1", "#818cf8", "#4f46e5", "#a5b4fc", "#3730a3", "#c7d2fe", "#4338ca", "#2e1065"],
  emerald: ["#10b981", "#34d399", "#059669", "#6ee7b7", "#047857", "#a7f3d0", "#065f46", "#022c22"],
  amber: ["#f59e0b", "#fbbf24", "#d97706", "#fcd34d", "#b45309", "#fde68a", "#92400e", "#451a03"],
  rose: ["#f43f5e", "#fb7185", "#e11d48", "#fda4af", "#be123c", "#fecdd3", "#9f1239", "#4c0519"],
  violet: ["#8b5cf6", "#a78bfa", "#7c3aed", "#c4b5fd", "#6d28d9", "#ddd6fe", "#5b21b6", "#2e1065"],
  cyan: ["#06b6d4", "#22d3ee", "#0891b2", "#67e8f9", "#0e7490", "#a5f3fc", "#155e75", "#083344"],
};

export function ChartRenderer({ chartData }: ChartRendererProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-80 flex items-center justify-center text-slate-400">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
        <span className="text-xs">Preparing canvas...</span>
      </div>
    );
  }

  const palette = PALETTES[chartData.color_theme] || PALETTES.indigo;
  const primaryColor = palette[0];
  const chartType = chartData.chart_type.toLowerCase();

  return (
    <div ref={containerRef} className="w-full space-y-4">
      {/* Chart Title & Meta Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {chartData.title}
          </h2>
          {chartData.summary && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {chartData.summary}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" size="sm">
            {chartData.total_records_plotted} points plotted
          </Badge>
          <Badge variant="info" size="sm" className="capitalize">
            {chartData.chart_type.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="w-full min-h-[380px] pt-2">
        {/* 1. Bar Chart */}
        {chartType === "bar" && (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              data={chartData.data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey={chartData.category_key}
                tick={{ fontSize: 11 }}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar
                dataKey={chartData.series_keys[0] || "value"}
                fill={primaryColor}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* 2. Line Chart */}
        {chartType === "line" && (
          <ResponsiveContainer width="100%" height={380}>
            <LineChart
              data={chartData.data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey={chartData.category_key}
                tick={{ fontSize: 11 }}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey={chartData.series_keys[0] || "value"}
                stroke={primaryColor}
                strokeWidth={2.5}
                dot={{ r: 4, fill: primaryColor }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* 3. Area Chart */}
        {chartType === "area" && (
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart
              data={chartData.data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey={chartData.category_key}
                tick={{ fontSize: 11 }}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area
                type="monotone"
                dataKey={chartData.series_keys[0] || "value"}
                stroke={primaryColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#areaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* 4. Pie Chart */}
        {chartType === "pie" && (
          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <Tooltip
                formatter={(val: any, name: any, item: any) => [
                  `${val} (${item.payload?.percentage ?? 0}%)`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
              <Pie
                data={chartData.data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                outerRadius={130}
                label={({ name, percent }: any) =>
                  `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                }
              >
                {chartData.data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={palette[index % palette.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* 5. Donut Chart */}
        {chartType === "donut" && (
          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <Tooltip
                formatter={(val: any, name: any, item: any) => [
                  `${val} (${item.payload?.percentage ?? 0}%)`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
              <Pie
                data={chartData.data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                innerRadius={70}
                outerRadius={130}
                paddingAngle={3}
                label={({ name, percent }: any) =>
                  `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                }
              >
                {chartData.data.map((_, index) => (
                  <Cell
                    key={`cell-donut-${index}`}
                    fill={palette[index % palette.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* 6. Histogram */}
        {chartType === "histogram" && (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              data={chartData.data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="bin"
                tick={{ fontSize: 10 }}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="count" fill={primaryColor} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* 7. Scatter Plot */}
        {chartType === "scatter" && (
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                type="number"
                dataKey="x"
                name={chartData.x_label}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={chartData.y_label}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Scatter name="Observations" data={chartData.data} fill={primaryColor} />
            </ScatterChart>
          </ResponsiveContainer>
        )}

        {/* 8. Box Plot */}
        {chartType === "box" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chartData.data.map((cohort, idx) => (
                <Card
                  key={idx}
                  className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 font-mono">
                      {cohort.category}
                    </span>
                    <Badge variant="outline" size="sm">
                      {cohort.count} observations
                    </Badge>
                  </div>

                  {/* Visual Box Graphic */}
                  <div className="relative h-12 bg-slate-100 dark:bg-slate-800/80 rounded-lg p-2 flex items-center">
                    {/* Whiskers line */}
                    <div className="w-full h-0.5 bg-slate-400 dark:bg-slate-500 absolute left-0" />
                    {/* IQR Box */}
                    <div
                      className="h-8 rounded bg-indigo-500/80 dark:bg-indigo-600/80 border border-indigo-400 absolute"
                      style={{
                        left: "25%",
                        width: "50%",
                      }}
                    >
                      {/* Median bar */}
                      <div className="w-1 h-full bg-white dark:bg-slate-200 mx-auto" />
                    </div>
                  </div>

                  <div className="grid grid-cols-5 text-center text-[10px]">
                    <div>
                      <span className="text-slate-400 block">Min</span>
                      <span className="font-semibold">{cohort.min}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Q1</span>
                      <span className="font-semibold">{cohort.q1}</span>
                    </div>
                    <div>
                      <span className="text-indigo-600 dark:text-indigo-400 block font-bold">
                        Median
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {cohort.median}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Q3</span>
                      <span className="font-semibold">{cohort.q3}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Max</span>
                      <span className="font-semibold">{cohort.max}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 9. Heatmap */}
        {chartType === "heatmap" && (
          <div className="overflow-x-auto p-2">
            <table className="text-xs text-center border-collapse w-full">
              <thead>
                <tr>
                  <th className="p-2.5 bg-slate-100 dark:bg-slate-800 text-left font-mono text-[11px] text-slate-500 border border-slate-200 dark:border-slate-800">
                    {chartData.y_label} \ {chartData.x_label}
                  </th>
                  {chartData.series_keys.map((cName) => (
                    <th
                      key={cName}
                      className="p-2.5 bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                    >
                      {cName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.data.map((row) => (
                  <tr key={row.y}>
                    <td className="p-2.5 font-mono text-left font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                      {row.y}
                    </td>
                    {chartData.series_keys.map((cName) => {
                      const val = row[cName] ?? 0;
                      const maxVal = chartData.stats?.max || 1;
                      const intensity = Math.min(val / maxVal, 1);
                      return (
                        <td
                          key={cName}
                          className="p-2.5 border border-slate-200/80 dark:border-slate-800 font-mono font-bold transition-all"
                          style={{
                            backgroundColor:
                              intensity > 0
                                ? `rgba(99, 102, 241, ${Math.max(intensity, 0.12)})`
                                : undefined,
                            color: intensity > 0.5 ? "#ffffff" : undefined,
                          }}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 10. Correlation Matrix */}
        {chartType === "correlation_matrix" && (
          <div className="overflow-x-auto p-2">
            <table className="text-xs text-center border-collapse w-full">
              <thead>
                <tr>
                  <th className="p-2.5 bg-slate-100 dark:bg-slate-800 text-left font-mono text-[11px] text-slate-500 border border-slate-200 dark:border-slate-800">
                    Feature
                  </th>
                  {chartData.series_keys.map((cName) => (
                    <th
                      key={cName}
                      className="p-2.5 bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                    >
                      {cName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.data.map((row) => (
                  <tr key={row.feature}>
                    <td className="p-2.5 font-mono text-left font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                      {row.feature}
                    </td>
                    {chartData.series_keys.map((cName) => {
                      const val = row[cName];
                      if (val === null || val === undefined) {
                        return (
                          <td
                            key={cName}
                            className="p-2.5 border border-slate-200/80 dark:border-slate-800 text-slate-400"
                          >
                            —
                          </td>
                        );
                      }
                      const isDiag = row.feature === cName;
                      const isPos = val >= 0;
                      const absVal = Math.abs(val);

                      return (
                        <td
                          key={cName}
                          className="p-2.5 border border-slate-200/80 dark:border-slate-800 font-mono font-bold transition-all"
                          style={{
                            backgroundColor: isDiag
                              ? "rgba(99, 102, 241, 0.2)"
                              : isPos
                              ? `rgba(99, 102, 241, ${absVal * 0.85})`
                              : `rgba(244, 63, 94, ${absVal * 0.85})`,
                            color: absVal > 0.5 ? "#ffffff" : undefined,
                          }}
                        >
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
