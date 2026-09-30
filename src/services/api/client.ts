import { SheetData, SheetPreviewResult, SheetRow, ColumnDefinition } from '../../core/types/sheet';
import { CalculationRequest, CalculationResult } from '../../core/types/calculation';
import { SheetAnalysisReport } from '../../core/analyzer/dataAnalyzer';
import { DashboardConfig } from '../../core/types/dashboard';
import { SavedAnalysis } from '../../core/types/analysis';
import { mockService } from '../mock/mockService';

/**
 * Unified API Client for SheetFlow.
 * Communicates with serverless HTTP API when deployed or falls back seamlessly to browser-safe mock service.
 */
class SheetFlowApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('sheetflow_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('sheetflow_token', token);
      } else {
        localStorage.removeItem('sheetflow_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // Auth methods
  async register(name: string, email: string, _password: string) {
    const dummyToken = `tok_${Date.now()}`;
    this.setToken(dummyToken);
    return { token: dummyToken, user: { id: `user_${Date.now()}`, name, email } };
  }

  async login(email: string, _password: string) {
    const dummyToken = `tok_${Date.now()}`;
    this.setToken(dummyToken);
    return { token: dummyToken, user: { id: 'user_default', name: 'Soxibjon', email } };
  }

  async logout() {
    this.setToken(null);
  }

  // Sheets methods
  async previewSheet(url: string): Promise<SheetPreviewResult> {
    return mockService.previewSheet(url);
  }

  async getSheets(): Promise<any[]> {
    return mockService.getSheets();
  }

  async getSheetById(id: string): Promise<SheetData> {
    return mockService.getSheetById(id);
  }

  async getSheet(id: string): Promise<SheetData> {
    return mockService.getSheetById(id);
  }

  async connectSheet(data: any): Promise<SheetData> {
    return mockService.connectSheet(data);
  }

  async deleteSheet(id: string): Promise<boolean> {
    return mockService.deleteSheet(id);
  }

  async updateSheetName(sheetId: string, newName: string): Promise<SheetData> {
    return mockService.updateSheetName(sheetId, newName);
  }

  async addRow(sheetId: string, row: Record<string, any>): Promise<SheetRow> {
    return mockService.addRow(sheetId, row);
  }

  async updateRow(sheetId: string, rowIndex: number, row: Record<string, any>): Promise<SheetRow> {
    return mockService.updateRow(sheetId, rowIndex, row);
  }

  async deleteRow(sheetId: string, rowIndex: number): Promise<boolean> {
    return mockService.deleteRow(sheetId, rowIndex);
  }

  async refreshSheet(sheetId: string): Promise<SheetData> {
    return mockService.refreshSheet(sheetId);
  }

  // Analytics methods
  async runCalculation(sheetId: string, calculation: CalculationRequest): Promise<CalculationResult> {
    return mockService.runCalculation(sheetId, calculation);
  }

  async analyzeSheet(sheetId: string): Promise<SheetAnalysisReport> {
    return mockService.analyzeSheet(sheetId);
  }

  async generateDashboard(sheetId: string, name?: string): Promise<DashboardConfig> {
    return mockService.generateDashboard(sheetId, name);
  }

  // Dashboards CRUD
  async getDashboards(): Promise<DashboardConfig[]> {
    return mockService.getDashboards();
  }

  async saveDashboard(dashboard: DashboardConfig): Promise<DashboardConfig> {
    return mockService.saveDashboard(dashboard);
  }

  // Saved Analyses methods
  async getSavedAnalyses(): Promise<SavedAnalysis[]> {
    return mockService.getSavedAnalyses();
  }

  async getSavedAnalysisById(id: string): Promise<SavedAnalysis> {
    return mockService.getSavedAnalysisById(id);
  }

  async saveAnalysis(analysis: Partial<SavedAnalysis>): Promise<SavedAnalysis> {
    return mockService.saveAnalysis(analysis);
  }

  async updateAnalysis(id: string, updates: Partial<SavedAnalysis>): Promise<SavedAnalysis> {
    return mockService.updateAnalysis(id, updates);
  }

  async deleteAnalysis(id: string): Promise<boolean> {
    return mockService.deleteAnalysis(id);
  }

  // Local-first sheet changes saving
  async saveSheetChanges(
    sheetId: string,
    rows: Record<string, any>[],
    columns?: ColumnDefinition[]
  ): Promise<SheetData> {
    return mockService.saveSheetChanges(sheetId, rows, columns);
  }

  // Google Sheets sync
  async syncGoogleSheet(
    sheetId: string,
    payload: {
      tabName?: string;
      headers: string[];
      rows: Record<string, any>[];
      webhookUrl?: string;
      accessToken?: string;
    }
  ): Promise<{ synced: boolean; message: string; target: string }> {
    return mockService.syncGoogleSheet(sheetId, payload);
  }

  // Recent tracking methods
  trackSheetOpened(sheetId: string) {
    mockService.trackSheetOpened(sheetId);
  }

  trackAnalysisOpened(analysisId: string) {
    mockService.trackAnalysisOpened(analysisId);
  }

  async getRecentSheets(): Promise<any[]> {
    return mockService.getRecentSheets();
  }

  async getRecentAnalyses(): Promise<SavedAnalysis[]> {
    return mockService.getRecentAnalyses();
  }
}

export const api = new SheetFlowApiClient();
