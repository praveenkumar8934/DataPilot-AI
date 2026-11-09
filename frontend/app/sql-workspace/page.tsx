"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Terminal,
  ArrowRight,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  DatabaseConnectionSummary,
  DatabaseSchemaResponse,
  TablePreviewResponse,
  SQLQueryResponse,
} from "@/types/database";
import { ConnectionDialog } from "@/components/database/connection-dialog";
import { ConnectionList } from "@/components/database/connection-list";
import { SchemaBrowser } from "@/components/database/schema-browser";
import { SQLEditor } from "@/components/database/sql-editor";
import { QueryResultsTable } from "@/components/database/query-results-table";

export default function SQLWorkspacePage() {
  // State
  const [connections, setConnections] = useState<DatabaseConnectionSummary[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<DatabaseConnectionSummary | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Schema state
  const [schema, setSchema] = useState<DatabaseSchemaResponse | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);

  // SQL Query state
  const [query, setQuery] = useState("SELECT * FROM customers LIMIT 50;");
  const [limit, setLimit] = useState(50);
  const [executing, setExecuting] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<SQLQueryResponse | null>(null);

  // Table Preview state
  const [previewData, setPreviewData] = useState<TablePreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<"query" | "preview">("query");

  // Import to dataset workspace state
  const [importingTable, setImportingTable] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch connections
  const loadConnections = useCallback(async () => {
    setLoadingConnections(true);
    try {
      const list = await api.listDatabaseConnections();
      setConnections(list);
      // Auto select first connection if none selected
      if (list.length > 0 && !selectedConnection) {
        setSelectedConnection(list[0]);
      }
    } catch (err: any) {
      console.error("Failed to load connections:", err);
    } finally {
      setLoadingConnections(false);
    }
  }, [selectedConnection]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Fetch schema when selected connection changes
  const loadSchema = useCallback(async (connId: string) => {
    setLoadingSchema(true);
    try {
      const data = await api.getDatabaseSchema(connId);
      setSchema(data);
      // If there are tables and query mentions another table, set default query to first table
      if (data.tables.length > 0) {
        const firstT = data.tables[0].table_name;
        setQuery(`SELECT * FROM ${firstT} LIMIT 50;`);
      }
    } catch (err: any) {
      console.error("Failed to load schema:", err);
      setSchema(null);
    } finally {
      setLoadingSchema(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      loadSchema(selectedConnection.id);
    } else {
      setSchema(null);
    }
  }, [selectedConnection, loadSchema]);

  // Handle connection selection
  const handleSelectConnection = (conn: DatabaseConnectionSummary) => {
    setSelectedConnection(conn);
    setQueryResult(null);
    setPreviewData(null);
    setQueryError(null);
    setImportSuccess(null);
  };

  // Handle connection delete
  const handleDeleteConnection = async (id: string) => {
    try {
      await api.deleteDatabaseConnection(id);
      if (selectedConnection?.id === id) {
        setSelectedConnection(null);
        setSchema(null);
      }
      await loadConnections();
    } catch (err: any) {
      alert("Failed to delete connection: " + (err.message || String(err)));
    }
  };

  // Run SQL Query
  const handleExecuteQuery = async () => {
    if (!selectedConnection) {
      setQueryError("Please select or add a database connection first.");
      return;
    }
    if (!query.trim()) return;

    setExecuting(true);
    setQueryError(null);
    setActiveTab("query");

    try {
      const res = await api.executeSQLQuery({
        connection_id: selectedConnection.id,
        query: query.trim(),
        limit,
      });
      setQueryResult(res);
    } catch (err: any) {
      setQueryError(err.message || "Failed to execute SQL query");
      setQueryResult(null);
    } finally {
      setExecuting(false);
    }
  };

  // Preview Table
  const handlePreviewTable = async (tableName: string) => {
    if (!selectedConnection) return;
    setLoadingPreview(true);
    setActiveTab("preview");
    setQueryError(null);

    try {
      const res = await api.previewDatabaseTable({
        connection_id: selectedConnection.id,
        table_name: tableName,
        limit: 50,
      });
      setPreviewData(res);
    } catch (err: any) {
      setQueryError(`Failed to preview table ${tableName}: ${err.message || String(err)}`);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Generate Query from Schema Browser
  const handleGenerateQuery = (tableName: string) => {
    setQuery(`SELECT * FROM ${tableName} LIMIT ${limit};`);
    setActiveTab("query");
  };

  // Import Table into Workspace
  const handleImportTable = async (tableName: string) => {
    if (!selectedConnection) return;
    setImportingTable(tableName);
    setImportSuccess(null);

    try {
      const meta = await api.importTableAsDataset({
        connection_id: selectedConnection.id,
        table_name: tableName,
      });
      setImportSuccess({
        id: meta.id,
        name: meta.original_name,
      });
    } catch (err: any) {
      alert(`Failed to import table: ${err.message || String(err)}`);
    } finally {
      setImportingTable(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-500" />
            <span>SQL Workspace & Database Connector</span>
            <Badge variant="info" size="sm">
              Phase 6
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Connect directly to SQLite, PostgreSQL, or MySQL with schema introspection, table imports, and secure read-only SQL queries.
          </p>
        </div>

        {/* Status Pill & Connect Button */}
        <div className="flex items-center gap-2">
          {selectedConnection ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Connected: {selectedConnection.name}
              </span>
              <Badge variant="default" size="sm">
                {selectedConnection.db_type.toUpperCase()}
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>No database active</span>
            </div>
          )}

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsDialogOpen(true)}
            className="text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Connection</span>
          </Button>
        </div>
      </div>

      {/* Import Success Banner */}
      {importSuccess && (
        <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Table imported successfully!</span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                &ldquo;{importSuccess.name}&rdquo; is now the active dataset in DataPilot AI.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/data-explorer">
              <Button size="sm" variant="outline" className="h-7 text-xs bg-white dark:bg-slate-900 border-emerald-300">
                Data Explorer <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
            <Link href="/eda">
              <Button size="sm" variant="outline" className="h-7 text-xs bg-white dark:bg-slate-900 border-emerald-300">
                Run EDA
              </Button>
            </Link>
            <Link href="/visualization">
              <Button size="sm" variant="primary" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                Visualizations
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Connections & Schema (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="h-[280px]">
            <ConnectionList
              connections={connections}
              selectedId={selectedConnection?.id || null}
              onSelect={handleSelectConnection}
              onDelete={handleDeleteConnection}
              onOpenNewDialog={() => setIsDialogOpen(true)}
              onRefresh={loadConnections}
              loading={loadingConnections}
            />
          </div>

          <div className="h-[460px]">
            <SchemaBrowser
              schema={schema}
              loading={loadingSchema}
              onRefresh={() => {
                if (selectedConnection) loadSchema(selectedConnection.id);
              }}
              onPreviewTable={handlePreviewTable}
              onGenerateQuery={handleGenerateQuery}
              onImportTable={handleImportTable}
              importingTable={importingTable}
            />
          </div>
        </div>

        {/* Right Column: SQL Editor & Results Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* SQL Editor */}
          <SQLEditor
            query={query}
            setQuery={setQuery}
            limit={limit}
            setLimit={setLimit}
            onExecute={handleExecuteQuery}
            loading={executing}
            error={queryError}
            activeTable={schema?.tables?.[0]?.table_name}
          />

          {/* Results Area with Tab Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("query")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    activeTab === "query"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Query Results
                  {queryResult && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-white/20">
                      {queryResult.row_count}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    activeTab === "preview"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Table Preview
                  {previewData && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-white/20">
                      {previewData.table_name}
                    </span>
                  )}
                </button>
              </div>

              {activeTab === "query" && queryResult && (
                <span className="text-[11px] text-slate-400 font-mono">
                  {queryResult.execution_time_ms} ms
                </span>
              )}
            </div>

            {/* Display Query Results or Table Preview */}
            {activeTab === "query" ? (
              <QueryResultsTable
                columns={queryResult?.columns || []}
                rows={queryResult?.rows || []}
                rowCount={queryResult?.row_count || 0}
                executionTimeMs={queryResult?.execution_time_ms}
                isTruncated={queryResult?.is_truncated}
                title="Query Results"
                emptyMessage="Write a query in the console above and press 'Run Query' or Ctrl+Enter to display results."
              />
            ) : (
              <QueryResultsTable
                columns={previewData?.columns || []}
                rows={previewData?.rows || []}
                rowCount={previewData?.total_rows || 0}
                title={previewData ? `Table Preview: ${previewData.table_name}` : "Table Preview"}
                onImportAsDataset={
                  previewData
                    ? () => handleImportTable(previewData.table_name)
                    : undefined
                }
                importing={importingTable === previewData?.table_name}
                loading={loadingPreview}
                emptyMessage="Click 'Preview' on any table in the schema browser to view its contents."
              />
            )}
          </div>
        </div>
      </div>

      {/* Connection Modal */}
      <ConnectionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConnectionSaved={(newConn) => {
          loadConnections();
          setSelectedConnection(newConn);
        }}
      />
    </div>
  );
}
