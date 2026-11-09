"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DatasetMetadata, DatasetSummary } from "@/types/dataset";
import { api } from "@/lib/api";

interface DatasetContextType {
  activeDataset: DatasetMetadata | null;
  allDatasets: DatasetSummary[];
  isLoading: boolean;
  backendOnline: boolean;
  error: string | null;
  refreshDatasets: () => Promise<void>;
  setActiveDatasetId: (id: string) => Promise<void>;
  uploadDatasetFile: (file: File) => Promise<DatasetMetadata>;
  deleteDatasetById: (id: string) => Promise<void>;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const [activeDataset, setActiveDataset] = useState<DatasetMetadata | null>(null);
  const [allDatasets, setAllDatasets] = useState<DatasetSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkConnectivityAndLoad = useCallback(async () => {
    try {
      await api.checkHealth();
      setBackendOnline(true);
      setError(null);

      const [datasetsList, active] = await Promise.all([
        api.listDatasets(),
        api.getActiveDataset(),
      ]);

      setAllDatasets(datasetsList);
      setActiveDataset(active);
    } catch (err: any) {
      setBackendOnline(false);
      setError(err.message || "Failed to connect to backend");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnectivityAndLoad();
    // Poll backend health every 15 seconds
    const interval = setInterval(async () => {
      try {
        await api.checkHealth();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [checkConnectivityAndLoad]);

  const refreshDatasets = async () => {
    setIsLoading(true);
    try {
      const [datasetsList, active] = await Promise.all([
        api.listDatasets(),
        api.getActiveDataset(),
      ]);
      setAllDatasets(datasetsList);
      setActiveDataset(active);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveDatasetId = async (id: string) => {
    try {
      const updated = await api.activateDataset(id);
      setActiveDataset(updated);
      await refreshDatasets();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const uploadDatasetFile = async (file: File): Promise<DatasetMetadata> => {
    setIsLoading(true);
    try {
      const res = await api.uploadDataset(file);
      await refreshDatasets();
      setActiveDataset(res.dataset);
      return res.dataset;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDatasetById = async (id: string) => {
    try {
      await api.deleteDataset(id);
      if (activeDataset?.id === id) {
        setActiveDataset(null);
      }
      await refreshDatasets();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <DatasetContext.Provider
      value={{
        activeDataset,
        allDatasets,
        isLoading,
        backendOnline,
        error,
        refreshDatasets,
        setActiveDatasetId,
        uploadDatasetFile,
        deleteDatasetById,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error("useDataset must be used within a DatasetProvider");
  }
  return context;
}

