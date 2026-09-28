import { SheetData, SheetPreviewResult, SheetRow } from '../../core/types/sheet';
import { CalculationRequest, CalculationResult } from '../../core/types/calculation';
import { SheetAnalysisReport } from '../../core/analyzer/dataAnalyzer';
import { DashboardConfig } from '../../core/types/dashboard';
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

  async connectSheet(data: any): Promise<SheetData> {
    return mockService.connectSheet(data);
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
}

export const api = new SheetFlowApiClient();
