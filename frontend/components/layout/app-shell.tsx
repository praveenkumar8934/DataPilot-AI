"use client";

import React from "react";
import { DatasetProvider } from "@/context/dataset-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DatasetProvider>
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </DatasetProvider>
  );
}

