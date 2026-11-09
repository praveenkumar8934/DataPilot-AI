"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  TableProperties,
  Sparkles,
  BarChart3,
  PieChart,
  Terminal,
  FileSpreadsheet,
  Settings,
  ChevronRight,
  DatabaseZap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataset } from "@/context/dataset-context";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  phase: number;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, phase: 1 },
  { name: "Data Sources", href: "/data-sources", icon: Database, phase: 1 },
  { name: "Data Explorer", href: "/data-explorer", icon: TableProperties, phase: 2, badge: "Phase 2" },
  { name: "Data Cleaning", href: "/data-cleaning", icon: Sparkles, phase: 3, badge: "Phase 3" },
  { name: "Exploratory EDA", href: "/eda", icon: BarChart3, phase: 4, badge: "Phase 4" },
  { name: "Visualization", href: "/visualization", icon: PieChart, phase: 5, badge: "Phase 5" },
  { name: "SQL Workspace", href: "/sql-workspace", icon: Terminal, phase: 6, badge: "Phase 6" },
  { name: "Reports & Exports", href: "/reports", icon: FileSpreadsheet, phase: 7, badge: "Phase 7" },
  { name: "Settings", href: "/settings", icon: Settings, phase: 1 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { activeDataset } = useDataset();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-screen border-r border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl select-none z-30">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <DatabaseZap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              DataPilot <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">AI</span>
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Workspace v1.0</p>
          </div>
        </Link>
      </div>

      {/* Active Dataset Pill */}
      <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-850">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Dataset</span>
            {activeDataset ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-400" />
            )}
          </div>
          {activeDataset ? (
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate" title={activeDataset.original_name}>
                {activeDataset.original_name}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span>{activeDataset.row_count.toLocaleString()} rows</span>
                <span>•</span>
                <span>{activeDataset.column_count} cols</span>
                <span>•</span>
                <span>{activeDataset.file_format}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">No dataset active</p>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-900/60"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  )}
                />
                <span>{item.name}</span>
              </div>

              {item.badge ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 text-center">
        <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-400 dark:text-slate-500">
          <span>Phase 1: Foundation</span>
          <span className="font-semibold text-emerald-500">Active</span>
        </div>
      </div>
    </aside>
  );
}
