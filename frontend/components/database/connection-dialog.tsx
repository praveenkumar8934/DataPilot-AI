"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  DatabaseConnectionConfig,
  DatabaseConnectionSummary,
  ConnectionTestResponse,
} from "@/types/database";
import {
  Database,
  Server,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

interface ConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSaved: (connection: DatabaseConnectionSummary) => void;
}

export function ConnectionDialog({
  isOpen,
  onClose,
  onConnectionSaved,
}: ConnectionDialogProps) {
  const [dbType, setDbType] = useState<"sqlite" | "postgresql" | "mysql">("sqlite");
  const [name, setName] = useState("");
  const [database, setDatabase] = useState("");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState<number | undefined>(undefined);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = (type: "sqlite" | "postgresql" | "mysql") => {
    setDbType(type);
    setTestResult(null);
    setError(null);
    if (type === "sqlite") {
      setPort(undefined);
      if (!database || database.includes(":")) {
        setDatabase("backend/storage/sample_sales.db");
      }
      if (!name) setName("Local SQLite DB");
    } else if (type === "postgresql") {
      setPort(5432);
      if (!name) setName("Production PostgreSQL");
    } else if (type === "mysql") {
      setPort(3306);
      if (!name) setName("Analytics MySQL");
    }
  };

  const buildConfig = (): DatabaseConnectionConfig => {
    return {
      name: name.trim() || `${dbType.toUpperCase()} Connection`,
      db_type: dbType,
      database: database.trim(),
      host: dbType === "sqlite" ? undefined : host.trim(),
      port: dbType === "sqlite" ? undefined : port || (dbType === "postgresql" ? 5432 : 3306),
      username: dbType === "sqlite" ? undefined : username.trim(),
      password: dbType === "sqlite" ? undefined : password,
      is_readonly: true,
    };
  };

  const handleTest = async () => {
    if (!database.trim()) {
      setError("Please provide a database name or path.");
      return;
    }
    setError(null);
    setTesting(true);
    setTestResult(null);
    try {
      const cfg = buildConfig();
      const res = await api.testDatabaseConnection(cfg);
      setTestResult(res);
      if (!res.success) {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to test connection");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!database.trim()) {
      setError("Please specify a database name or file path.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const cfg = buildConfig();
      const saved = await api.saveDatabaseConnection(cfg);
      onConnectionSaved(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save connection");
    } finally {
      setSaving(false);
    }
  };

  const fillSampleSqlite = () => {
    setDbType("sqlite");
    setName("Sample Sales & E-Commerce DB");
    setDatabase("backend/storage/sample_sales.db");
    setTestResult(null);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Database Connection"
      description="Connect to SQLite, PostgreSQL, or MySQL with strict read-only execution."
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4 pt-1">
        {/* Engine Tabs */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Database Engine
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange("sqlite")}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                dbType === "sqlite"
                  ? "border-indigo-600 bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>SQLite</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange("postgresql")}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                dbType === "postgresql"
                  ? "border-indigo-600 bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <Server className="w-4 h-4" />
              <span>PostgreSQL</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange("mysql")}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                dbType === "mysql"
                  ? "border-indigo-600 bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>MySQL</span>
            </button>
          </div>
        </div>

        {/* Quick Demo Pre-fill for SQLite */}
        {dbType === "sqlite" && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs">
            <span className="text-amber-800 dark:text-amber-300 font-medium">
              Want to test immediately?
            </span>
            <button
              type="button"
              onClick={fillSampleSqlite}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Use Sample Sales DB
            </button>
          </div>
        )}

        {/* Connection Name */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Connection Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sales Production Replica"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* SQLite Specific Fields */}
        {dbType === "sqlite" ? (
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Database Path / File
            </label>
            <input
              type="text"
              required
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              placeholder="e.g. backend/storage/sample_sales.db or C:\path\to\file.db"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Relative to server root or an absolute local file path.
            </p>
          </div>
        ) : (
          /* Client/Server Engine Fields */
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Host / Server
                </label>
                <input
                  type="text"
                  required
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="localhost or db.example.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={port || ""}
                  onChange={(e) => setPort(Number(e.target.value))}
                  placeholder={dbType === "postgresql" ? "5432" : "3306"}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Database Name
              </label>
              <input
                type="text"
                required
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                placeholder="e.g. analytics_warehouse"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. postgres or reader"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </>
        )}

        {/* Read-Only Safety Banner */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Strict read-only execution is automatically enforced. Password credentials are encrypted on disk and never sent back to the browser.
          </span>
        </div>

        {/* Test Result / Error Feedback */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              testResult.success
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{testResult.message}</p>
              {testResult.server_version && (
                <p className="text-[11px] opacity-80 mt-0.5">
                  Server version: {testResult.server_version} (Latency: {testResult.latency_ms} ms)
                </p>
              )}
            </div>
          </div>
        )}

        {error && !testResult && (
          <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testing || saving}
          >
            {testing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving || testing}
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Connect"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
