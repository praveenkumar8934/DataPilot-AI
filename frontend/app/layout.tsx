import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "DataPilot AI - Your Intelligent Data Analysis Workspace",
  description: "All-in-one data analysis platform with automated exploration, cleaning, and reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
