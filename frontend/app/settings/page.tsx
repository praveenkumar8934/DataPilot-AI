"use client";

import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Server, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useDataset } from "@/context/dataset-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { backendOnline } = useDataset();
  const [healthData, setHealthData] = useState<any>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  const checkStatus = async () => {
    setIsChecking(true);
    const start = performance.now();
    try {
      const data = await api.checkHealth();
      const end = performance.now();
      setHealthData(data);
      setPingLatency(Math.round(end - start));
    } catch {
      setHealthData(null);
      setPingLatency(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-indigo-500" />
          <span>System & Workspace Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review local backend endpoints, storage configurations, and system health.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>FastAPI Backend Status</CardTitle>
            <CardDescription>Local backend connectivity and runtime information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-indigo-500" />
                <div>
                  <span className="font-semibold block text-slate-800 dark:text-slate-200">
                    Connection Status
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {backendOnline ? "http://127.0.0.1:8000" : "Offline"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {backendOnline ? (
                  <Badge variant="success" size="sm">Online ({pingLatency} ms)</Badge>
                ) : (
                  <Badge variant="danger" size="sm">Offline</Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkStatus}
                  isLoading={isChecking}
                  className="h-7 text-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-500">Application Name:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {healthData?.app || "DataPilot AI"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-500">Backend Version:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {healthData?.version || "1.0.0"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-500">Max Upload Size:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {healthData?.storage?.max_upload_size_mb || 100} MB
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Supported File Formats:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {healthData?.storage?.allowed_extensions?.join(", ") || ".csv, .xlsx, .xls, .json"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase Roadmap Card */}
        <Card>
          <CardHeader>
            <CardTitle>Architecture & Roadmap</CardTitle>
            <CardDescription>Phased delivery checklist for DataPilot AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-2">
              {[
                { phase: "Phase 1", name: "Foundation & Data Import", status: "Active & Tested", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
                { phase: "Phase 2", name: "Pandas Operation Engine", status: "Next", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40" },
                { phase: "Phase 3", name: "Data Cleaning Studio", status: "Planned", color: "text-slate-600 bg-slate-100 dark:bg-slate-800" },
                { phase: "Phase 4", name: "Exploratory Data Analysis", status: "Planned", color: "text-slate-600 bg-slate-100 dark:bg-slate-800" },
                { phase: "Phase 5", name: "Visualization Studio", status: "Planned", color: "text-slate-600 bg-slate-100 dark:bg-slate-800" },
                { phase: "Phase 6", name: "Database Connectivity & SQL", status: "Planned", color: "text-slate-600 bg-slate-100 dark:bg-slate-800" },
                { phase: "Phase 7", name: "Reports and Exporting", status: "Planned", color: "text-slate-600 bg-slate-100 dark:bg-slate-800" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[11px] text-slate-400 w-14">
                      {item.phase}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {item.name}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${item.color}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
