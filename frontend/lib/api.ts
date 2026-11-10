import {
  DatasetMetadata,
  DatasetSummary,
  PaginatedRowsResponse,
  DatasetUploadResponse,
} from "@/types/dataset";
import {
  OperationCategory,
  OperationRequest,
  OperationResult,
} from "@/types/operations";
import {
  CleaningActionRequest,
  CleaningPreviewResponse,
  CleaningApplyResponse,
  CleaningSessionState,
  OutlierDetectionResult,
  MissingValueDetectionSummary,
} from "@/types/cleaning";
import {
  EDAOverview,
  UnivariateResult,
  CorrelationMatrixResponse,
  BivariateAnalysisRequest,
  BivariateAnalysisResponse,
  GroupByRequest,
  GroupByResponse,
  PivotTableRequest,
  PivotTableResponse,
} from "@/types/analytics";
import {
  ChartTypeInfo,
  ChartRequest,
  ChartDataResponse,
} from "@/types/visualization";
import {
  DatabaseConnectionConfig,
  DatabaseConnectionSummary,
  ConnectionTestResponse,
  DatabaseSchemaResponse,
  TablePreviewRequest,
  TablePreviewResponse,
  SQLQueryRequest,
  SQLQueryResponse,
  ImportTableAsDatasetRequest,
} from "@/types/database";
import {
  CSVExportOptions,
  ExcelExportOptions,
  JSONExportOptions,
  ReportConfig,
  ReportSummaryResponse,
} from "@/types/exports";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errorMessage =
              typeof errData.detail === "string"
                ? errData.detail
                : JSON.stringify(errData.detail);
          }
        } catch {
          // ignore parsing error
        }
        throw new Error(errorMessage);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error(
          "Cannot reach backend server. Please verify FastAPI is running at http://127.0.0.1:8000"
        );
      }
      throw err;
    }
  }

  async checkHealth(): Promise<{ status: string; app: string; version: string }> {
    return this.request<{ status: string; app: string; version: string }>(
      "/health"
    );
  }

  async uploadDataset(file: File): Promise<DatasetUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    return this.request<DatasetUploadResponse>("/datasets/upload", {
      method: "POST",
      body: formData,
    });
  }

  async listDatasets(): Promise<DatasetSummary[]> {
    return this.request<DatasetSummary[]>("/datasets");
  }

  async getActiveDataset(): Promise<DatasetMetadata | null> {
    return this.request<DatasetMetadata | null>("/datasets/active");
  }

  async activateDataset(datasetId: string): Promise<DatasetMetadata> {
    return this.request<DatasetMetadata>(`/datasets/${datasetId}/activate`, {
      method: "POST",
    });
  }

  async getDataset(datasetId: string): Promise<DatasetMetadata> {
    return this.request<DatasetMetadata>(`/datasets/${datasetId}`);
  }

  async getDatasetPreview(
    datasetId: string,
    params: {
      page?: number;
      page_size?: number;
      sort_by?: string;
      sort_order?: "asc" | "desc";
      search?: string;
    } = {}
  ): Promise<PaginatedRowsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.page_size)
      query.append("page_size", params.page_size.toString());
    if (params.sort_by) query.append("sort_by", params.sort_by);
    if (params.sort_order) query.append("sort_order", params.sort_order);
    if (params.search) query.append("search", params.search);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<PaginatedRowsResponse>(
      `/datasets/${datasetId}/preview${queryString}`
    );
  }

  async deleteDataset(
    datasetId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/datasets/${datasetId}`,
      {
        method: "DELETE",
      }
    );
  }

  async getOperationsCatalog(): Promise<OperationCategory[]> {
    return this.request<OperationCategory[]>("/operations/catalog");
  }

  async executeOperation(request: OperationRequest): Promise<OperationResult> {
    return this.request<OperationResult>("/operations/execute", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Phase 3: Data Cleaning API methods
  async getCleaningSession(datasetId: string): Promise<CleaningSessionState> {
    return this.request<CleaningSessionState>(`/cleaning/${datasetId}/session`);
  }

  async detectMissingValues(datasetId: string): Promise<MissingValueDetectionSummary> {
    return this.request<MissingValueDetectionSummary>(`/cleaning/${datasetId}/detect-missing`);
  }

  async detectOutliers(
    datasetId: string,
    params: { method?: string; threshold?: number; column?: string } = {}
  ): Promise<OutlierDetectionResult[]> {
    const query = new URLSearchParams();
    if (params.method) query.append("method", params.method);
    if (params.threshold) query.append("threshold", params.threshold.toString());
    if (params.column) query.append("column", params.column);
    const qStr = query.toString() ? `?${query.toString()}` : "";
    return this.request<OutlierDetectionResult[]>(`/cleaning/${datasetId}/detect-outliers${qStr}`);
  }

  async previewCleaningAction(request: CleaningActionRequest): Promise<CleaningPreviewResponse> {
    return this.request<CleaningPreviewResponse>("/cleaning/preview", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async applyCleaningAction(request: CleaningActionRequest): Promise<CleaningApplyResponse> {
    return this.request<CleaningApplyResponse>("/cleaning/apply", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async undoCleaningAction(datasetId: string): Promise<CleaningSessionState> {
    return this.request<CleaningSessionState>(`/cleaning/${datasetId}/undo`, {
      method: "POST",
    });
  }

  async resetCleaningSession(datasetId: string): Promise<CleaningSessionState> {
    return this.request<CleaningSessionState>(`/cleaning/${datasetId}/reset`, {
      method: "POST",
    });
  }

  async saveCleanedVersion(datasetId: string, versionName?: string): Promise<DatasetMetadata> {
    return this.request<DatasetMetadata>("/cleaning/save-version", {
      method: "POST",
      body: JSON.stringify({ dataset_id: datasetId, version_name: versionName }),
    });
  }

  // Phase 4: Exploratory Data Analysis (EDA) API methods
  async getEDAOverview(datasetId: string): Promise<EDAOverview> {
    return this.request<EDAOverview>(`/analytics/${datasetId}/overview`);
  }

  async getUnivariateAnalysis(datasetId: string, column: string): Promise<UnivariateResult> {
    const q = new URLSearchParams({ column });
    return this.request<UnivariateResult>(`/analytics/${datasetId}/univariate?${q.toString()}`);
  }

  async getCorrelationMatrix(datasetId: string, method: string = "pearson"): Promise<CorrelationMatrixResponse> {
    const q = new URLSearchParams({ method });
    return this.request<CorrelationMatrixResponse>(`/analytics/${datasetId}/correlation?${q.toString()}`);
  }

  async getBivariateAnalysis(request: BivariateAnalysisRequest): Promise<BivariateAnalysisResponse> {
    return this.request<BivariateAnalysisResponse>("/analytics/bivariate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getGroupByAnalysis(request: GroupByRequest): Promise<GroupByResponse> {
    return this.request<GroupByResponse>("/analytics/groupby", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getPivotAnalysis(request: PivotTableRequest): Promise<PivotTableResponse> {
    return this.request<PivotTableResponse>("/analytics/pivot", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Phase 5: Visualization Studio API methods
  async getChartTypes(): Promise<ChartTypeInfo[]> {
    return this.request<ChartTypeInfo[]>("/visualization/types");
  }

  async renderChart(request: ChartRequest): Promise<ChartDataResponse> {
    return this.request<ChartDataResponse>("/visualization/render", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Phase 6: Database Connectivity & SQL Workspace API methods
  async testDatabaseConnection(config: DatabaseConnectionConfig): Promise<ConnectionTestResponse> {
    return this.request<ConnectionTestResponse>("/database/test", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  async saveDatabaseConnection(config: DatabaseConnectionConfig): Promise<DatabaseConnectionSummary> {
    return this.request<DatabaseConnectionSummary>("/database/connections", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  async listDatabaseConnections(): Promise<DatabaseConnectionSummary[]> {
    return this.request<DatabaseConnectionSummary[]>("/database/connections");
  }

  async deleteDatabaseConnection(connectionId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/database/connections/${connectionId}`, {
      method: "DELETE",
    });
  }

  async getDatabaseSchema(connectionId: string): Promise<DatabaseSchemaResponse> {
    return this.request<DatabaseSchemaResponse>(`/database/connections/${connectionId}/schema`);
  }

  async previewDatabaseTable(request: TablePreviewRequest): Promise<TablePreviewResponse> {
    return this.request<TablePreviewResponse>("/database/preview", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async executeSQLQuery(request: SQLQueryRequest): Promise<SQLQueryResponse> {
    return this.request<SQLQueryResponse>("/database/query", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async importTableAsDataset(request: ImportTableAsDatasetRequest): Promise<DatasetMetadata> {
    return this.request<DatasetMetadata>("/database/import-table", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Phase 7: Reports and Export API methods
  async downloadFile(endpoint: string, options: RequestInit = {}): Promise<{ blob: Blob; filename: string }> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    if (!(options.body instanceof FormData) && options.body) {
      headers["Content-Type"] = "application/json";
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      let msg = `HTTP error ${response.status}`;
      try {
        const err = await response.json();
        if (err.detail) msg = err.detail;
      } catch {}
      throw new Error(msg);
    }
    let filename = "export";
    const disposition = response.headers.get("content-disposition");
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    const blob = await response.blob();
    return { blob, filename };
  }

  async getReportSummary(datasetId: string): Promise<ReportSummaryResponse> {
    return this.request<ReportSummaryResponse>(`/exports/${datasetId}/report-summary`);
  }

  async exportDatasetCSV(datasetId: string, options: CSVExportOptions): Promise<{ blob: Blob; filename: string }> {
    return this.downloadFile(`/exports/${datasetId}/csv`, {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  async exportDatasetExcel(datasetId: string, options: ExcelExportOptions): Promise<{ blob: Blob; filename: string }> {
    return this.downloadFile(`/exports/${datasetId}/excel`, {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  async exportDatasetJSON(datasetId: string, options: JSONExportOptions): Promise<{ blob: Blob; filename: string }> {
    return this.downloadFile(`/exports/${datasetId}/json`, {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  async exportDatasetParquet(datasetId: string): Promise<{ blob: Blob; filename: string }> {
    return this.downloadFile(`/exports/${datasetId}/parquet`, {
      method: "POST",
    });
  }

  async getReportHTML(datasetId: string, config: ReportConfig = {}): Promise<string> {
    const url = `${API_BASE_URL}/exports/${datasetId}/report-html`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      throw new Error("Failed to generate HTML report");
    }
    return response.text();
  }
}

export const api = new ApiClient();

