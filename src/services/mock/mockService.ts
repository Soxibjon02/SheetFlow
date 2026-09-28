import { SheetData, SheetPreviewResult, SheetRow } from '../../core/types/sheet';
import { CalculationRequest, CalculationResult } from '../../core/types/calculation';
import { SheetAnalysisReport, analyzeSheet } from '../../core/analyzer/dataAnalyzer';
import { DashboardConfig } from '../../core/types/dashboard';
import { generateDashboard } from '../../core/dashboard-generator/dashboardGenerator';
import { calculate } from '../../core/calculations/engine';
import { getInitialSampleSheets } from '../../core/sample-data';
import { extractSpreadsheetId, extractSpreadsheetInfo, parseCsvOrTsvToGrid, normalizeRawGrid } from '../../core/datasource';

// Local storage keys
const STORAGE_SHEETS_KEY = 'sheetflow_mock_sheets';
const STORAGE_DASHBOARDS_KEY = 'sheetflow_mock_dashboards';

function loadStoredSheets(): SheetData[] {
  try {
    const raw = localStorage.getItem(STORAGE_SHEETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const initial = getInitialSampleSheets();
  saveStoredSheets(initial);
  return initial;
}

function saveStoredSheets(sheets: SheetData[]) {
  try {
    localStorage.setItem(STORAGE_SHEETS_KEY, JSON.stringify(sheets));
  } catch {}
}

async function fetchGoogleSheetCsv(urlOrId: string): Promise<string[][] | null> {
  const trimmed = urlOrId.trim();

  // If raw pasted CSV or TSV data directly passed
  if (trimmed.startsWith('raw_data:')) {
    const rawContent = trimmed.substring(9);
    return parseCsvOrTsvToGrid(rawContent);
  }

  // If user pasted multi-line text directly
  if (trimmed.includes('\n') && (trimmed.includes(',') || trimmed.includes('\t'))) {
    return parseCsvOrTsvToGrid(trimmed);
  }

  const info = extractSpreadsheetInfo(trimmed);
  if (!info.id) return null;

  // Candidate URLs to fetch CSV from
  const candidateUrls: string[] = [
    info.gvizUrl,
    info.exportUrl,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(info.exportUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(info.gvizUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(info.exportUrl)}`,
  ];

  for (const fetchUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(fetchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        const trimmedText = text.trim();
        if (
          trimmedText.length > 0 &&
          !trimmedText.startsWith('<!DOCTYPE') &&
          !trimmedText.startsWith('<html') &&
          !trimmedText.includes('ServiceLogin')
        ) {
          const grid = parseCsvOrTsvToGrid(trimmedText);
          if (grid.length >= 2 && grid[0].length >= 1) {
            return grid;
          }
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  return null;
}

export class BrowserMockService {
  private sheets: SheetData[] = loadStoredSheets();
  private dashboards: DashboardConfig[] = [];

  async previewSheet(url: string): Promise<SheetPreviewResult> {
    const trimmed = url.trim();

    // 1. Raw pasted data
    if (trimmed.startsWith('raw_data:') || (trimmed.includes('\n') && (trimmed.includes(',') || trimmed.includes('\t')))) {
      const grid = await fetchGoogleSheetCsv(trimmed);
      if (!grid || grid.length < 2) {
        throw new Error('Pasted data must contain at least a header row and one data row.');
      }
      const rawName = 'Imported Custom Dataset';
      const normalized = normalizeRawGrid(rawName, grid, `sheet_${Date.now()}`, 'Sheet1', 'Pasted Data');
      return {
        spreadsheetId: normalized.metadata.id,
        spreadsheetName: rawName,
        spreadsheetUrl: 'Pasted Custom Data',
        availableTabs: ['Sheet1'],
        selectedTab: 'Sheet1',
        rowCount: normalized.rows.length,
        columnCount: normalized.metadata.columnCount || normalized.metadata.columns.length,
        columns: normalized.metadata.columns,
        sampleRows: normalized.rows.slice(0, 10),
        allRows: normalized.rows,
        isPublic: true,
        canEdit: true,
      };
    }

    const info = extractSpreadsheetInfo(trimmed);
    const id = info.id || trimmed;

    // 2. Check existing sheets first
    const existing = this.sheets.find((s) => s.metadata.id === id || s.metadata.url?.includes(id));
    if (existing) {
      return {
        spreadsheetId: existing.metadata.id,
        spreadsheetName: existing.metadata.name,
        spreadsheetUrl: existing.metadata.url || trimmed,
        availableTabs: existing.metadata.sheetTabs,
        selectedTab: existing.metadata.selectedTab,
        rowCount: existing.metadata.rowCount,
        columnCount: existing.metadata.columnCount,
        columns: existing.metadata.columns,
        sampleRows: existing.rows.slice(0, 10),
        allRows: existing.rows,
        isPublic: true,
        canEdit: true,
      };
    }

    // 3. Attempt live fetch from Google Sheets
    const grid = await fetchGoogleSheetCsv(trimmed);
    if (grid && grid.length >= 2) {
      const sheetName = `Google Sheet (${id.substring(0, 10)})`;
      const normalized = normalizeRawGrid(sheetName, grid, id, 'Sheet1', trimmed);
      return {
        spreadsheetId: id,
        spreadsheetName: sheetName,
        spreadsheetUrl: trimmed,
        availableTabs: ['Sheet1'],
        selectedTab: 'Sheet1',
        rowCount: normalized.rows.length,
        columnCount: normalized.metadata.columnCount || normalized.metadata.columns.length,
        columns: normalized.metadata.columns,
        sampleRows: normalized.rows.slice(0, 10),
        allRows: normalized.rows,
        isPublic: true,
        canEdit: true,
      };
    }

    // 4. Sample fallback with full rows
    const sample = this.sheets.find((s) => s.metadata.url === trimmed) || this.sheets[0];
    return {
      spreadsheetId: id,
      spreadsheetName: `Google Sheet (${id.substring(0, 12)})`,
      spreadsheetUrl: trimmed,
      availableTabs: sample.metadata.sheetTabs,
      selectedTab: sample.metadata.selectedTab,
      rowCount: sample.rows.length,
      columnCount: sample.metadata.columns.length,
      columns: sample.metadata.columns,
      sampleRows: sample.rows.slice(0, 10),
      allRows: sample.rows,
      isPublic: true,
      canEdit: true,
    };
  }

  async getSheets(): Promise<any[]> {
    return this.sheets.map((s) => ({
      id: s.metadata.id,
      name: s.metadata.name,
      url: s.metadata.url,
      selectedTab: s.metadata.selectedTab,
      rowCount: s.metadata.rowCount,
      columnCount: s.metadata.columnCount,
      lastSyncedAt: s.metadata.lastSyncedAt,
      columns: s.metadata.columns,
      userRole: s.metadata.userRole || 'editor',
    }));
  }

  async getSheetById(id: string): Promise<SheetData> {
    const s = this.sheets.find((sheet) => sheet.metadata.id === id);
    if (!s) throw new Error('Sheet not found.');
    return s;
  }

  async connectSheet(data: any): Promise<SheetData> {
    const newSheet: SheetData = {
      metadata: {
        id: data.id || `sheet_${Date.now()}`,
        name: data.name || 'New Connected Sheet',
        url: data.url || '',
        sheetTabs: data.sheetTabs || ['Sheet1'],
        selectedTab: data.selectedTab || 'Sheet1',
        rowCount: data.rows?.length || data.rowCount || 0,
        columnCount: data.columns?.length || data.columnCount || 0,
        columns: data.columns || [],
        lastSyncedAt: new Date().toISOString(),
        userRole: 'editor',
      },
      rows: data.rows || [],
      headers: data.columns?.map((c: any) => c.name) || [],
    };
    this.sheets.unshift(newSheet);
    saveStoredSheets(this.sheets);
    return newSheet;
  }

  async addRow(sheetId: string, row: Record<string, any>): Promise<SheetRow> {
    const sheet = await this.getSheetById(sheetId);
    const newRow = { _rowIndex: sheet.rows.length + 2, ...row };
    sheet.rows.push(newRow);
    sheet.metadata.rowCount = sheet.rows.length;
    sheet.metadata.lastSyncedAt = new Date().toISOString();
    saveStoredSheets(this.sheets);
    return newRow;
  }

  async updateRow(sheetId: string, rowIndex: number, row: Record<string, any>): Promise<SheetRow> {
    const sheet = await this.getSheetById(sheetId);
    const idx = sheet.rows.findIndex((r) => r._rowIndex === rowIndex || r.id === rowIndex);
    if (idx >= 0) {
      sheet.rows[idx] = { ...sheet.rows[idx], ...row };
      sheet.metadata.lastSyncedAt = new Date().toISOString();
      saveStoredSheets(this.sheets);
      return sheet.rows[idx];
    }
    throw new Error('Row not found.');
  }

  async deleteRow(sheetId: string, rowIndex: number): Promise<boolean> {
    const sheet = await this.getSheetById(sheetId);
    sheet.rows = sheet.rows.filter((r) => r._rowIndex !== rowIndex && r.id !== rowIndex);
    sheet.metadata.rowCount = sheet.rows.length;
    sheet.metadata.lastSyncedAt = new Date().toISOString();
    saveStoredSheets(this.sheets);
    return true;
  }

  async refreshSheet(sheetId: string): Promise<SheetData> {
    const sheet = await this.getSheetById(sheetId);
    if (sheet.metadata.url && (sheet.metadata.url.includes('docs.google.com') || sheet.metadata.url.includes('google'))) {
      try {
        const grid = await fetchGoogleSheetCsv(sheet.metadata.url);
        if (grid && grid.length >= 2) {
          const fresh = normalizeRawGrid(sheet.metadata.name, grid, sheet.metadata.id, sheet.metadata.selectedTab, sheet.metadata.url);
          sheet.rows = fresh.rows;
          sheet.metadata.rowCount = fresh.metadata.rowCount;
          sheet.metadata.columns = fresh.metadata.columns;
        }
      } catch {}
    }
    sheet.metadata.lastSyncedAt = new Date().toISOString();
    saveStoredSheets(this.sheets);
    return sheet;
  }

  async runCalculation(sheetId: string, calculation: CalculationRequest): Promise<CalculationResult> {
    const sheet = await this.getSheetById(sheetId);
    return calculate(sheet.rows, calculation);
  }

  async analyzeSheet(sheetId: string): Promise<SheetAnalysisReport> {
    const sheet = await this.getSheetById(sheetId);
    return analyzeSheet(sheet);
  }

  async generateDashboard(sheetId: string, name?: string): Promise<DashboardConfig> {
    const sheet = await this.getSheetById(sheetId);
    return generateDashboard(sheet, name);
  }

  async getDashboards(): Promise<DashboardConfig[]> {
    return this.dashboards;
  }

  async saveDashboard(dashboard: DashboardConfig): Promise<DashboardConfig> {
    const idx = this.dashboards.findIndex((d) => d.id === dashboard.id);
    if (idx >= 0) {
      this.dashboards[idx] = dashboard;
    } else {
      this.dashboards.push(dashboard);
    }
    return dashboard;
  }
}

export const mockService = new BrowserMockService();
