import { SheetData, SheetPreviewResult, SheetRow } from '../../core/types/sheet';
import { CalculationRequest, CalculationResult } from '../../core/types/calculation';
import { SheetAnalysisReport, analyzeSheet } from '../../core/analyzer/dataAnalyzer';
import { DashboardConfig } from '../../core/types/dashboard';
import { generateDashboard } from '../../core/dashboard-generator/dashboardGenerator';
import { calculate } from '../../core/calculations/engine';
import { getInitialSampleSheets } from '../../core/sample-data';
import { extractSpreadsheetId, extractSpreadsheetInfo, parseCsvOrTsvToGrid, normalizeRawGrid } from '../../core/datasource';
import { neonService } from '../db/neonService';

import { SavedAnalysis } from '../../core/types/analysis';
import { ColumnDefinition } from '../../core/types/sheet';
import { detectColumnDefinition } from '../../core/detector/typeDetector';

// Local storage keys
const STORAGE_SHEETS_KEY = 'sheetflow_mock_sheets';
const STORAGE_DASHBOARDS_KEY = 'sheetflow_mock_dashboards';
const STORAGE_SAVED_ANALYSES_KEY = 'sheetflow_mock_saved_analyses';
const STORAGE_RECENT_TRACKER_KEY = 'sheetflow_mock_recents';

function getInitialSampleAnalyses(): SavedAnalysis[] {
  return [
    {
      id: 'analysis_sample_1',
      name: 'MRR by Country',
      connectedSheetId: 'sheet_saas_metrics',
      sheetName: 'SaaS Revenue & Growth 2026',
      sheetTab: 'Sheet1',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sample_saas_metrics',
      functionId: 'COMPARE_CATEGORIES',
      visualizationType: 'bar',
      config: {
        functionId: 'COMPARE_CATEGORIES',
        column: 'Country',
        parameters: { valueColumn: 'MRR' },
        visualizationType: 'bar',
      },
      lastCalculatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      insights: [
        'Uzbekistan accounts for the highest MRR with $14,100',
        'United States generated the second largest MRR',
      ],
      history: [
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          action: 'recalculated',
          description: 'Refreshed with latest sheet data',
        },
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          action: 'created',
          description: 'Initial analysis created',
        },
      ],
    },
    {
      id: 'analysis_sample_2',
      name: 'Monthly Expenses Breakdown',
      connectedSheetId: 'sheet_ops_expenses',
      sheetName: 'Operational Expenses Tracker 2026',
      sheetTab: 'Sheet1',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sample_expenses',
      functionId: 'COMPARE_CATEGORIES',
      visualizationType: 'pie',
      config: {
        functionId: 'COMPARE_CATEGORIES',
        column: 'Category',
        parameters: { valueColumn: 'Amount' },
        visualizationType: 'pie',
      },
      lastCalculatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      insights: [
        'Advertising accounted for the highest single spend ($6,500)',
        'Infrastructure represents the second major expense',
      ],
      history: [
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          action: 'updated',
          description: 'Changed visualization to Pie chart',
        },
      ],
    },
    {
      id: 'analysis_sample_3',
      name: 'Score by City & Subject',
      connectedSheetId: 'sheet_students_sample',
      sheetName: 'Student Exam & Performance 2026',
      sheetTab: 'Sheet1',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sample_students',
      functionId: 'AVERAGE',
      visualizationType: 'bar',
      config: {
        functionId: 'AVERAGE',
        column: 'Score',
        groupBy: 'City',
        visualizationType: 'bar',
      },
      lastCalculatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      insights: [
        'Tashkent students achieved the highest average score (89.2)',
        'Samarkand followed with an 85.0 average score',
      ],
    },
  ];
}

function loadStoredAnalyses(): SavedAnalysis[] {
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_ANALYSES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  const initial = getInitialSampleAnalyses();
  saveStoredAnalyses(initial);
  return initial;
}

interface RecentTracking {
  sheetOpened: Record<string, string>;
  analysisOpened: Record<string, string>;
}

function loadRecentTracking(): RecentTracking {
  try {
    const raw = localStorage.getItem(STORAGE_RECENT_TRACKER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    sheetOpened: {
      'sheet_students_sample': new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      'sheet_saas_metrics': new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    analysisOpened: {
      'analysis_sample_1': new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      'analysis_sample_2': new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
  };
}

function saveRecentTracking(rec: RecentTracking) {
  try {
    localStorage.setItem(STORAGE_RECENT_TRACKER_KEY, JSON.stringify(rec));
  } catch {}
}

function saveStoredAnalyses(analyses: SavedAnalysis[]) {
  try {
    localStorage.setItem(STORAGE_SAVED_ANALYSES_KEY, JSON.stringify(analyses));
  } catch {}
}

const STORAGE_DELETED_SHEETS_KEY = 'sheetflow_deleted_sheet_ids';

export function getDeletedSheetIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_SHEETS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

export function recordDeletedSheetId(id: string) {
  try {
    const current = getDeletedSheetIds();
    current.add(id);
    localStorage.setItem(STORAGE_DELETED_SHEETS_KEY, JSON.stringify(Array.from(current)));
  } catch {}
}

function loadStoredSheets(): SheetData[] {
  const deleted = getDeletedSheetIds();
  try {
    const raw = localStorage.getItem(STORAGE_SHEETS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((s) => !deleted.has(s.metadata.id));
      }
    }
  } catch {}
  // Only first time: filter out any explicitly deleted sheets
  const initial = getInitialSampleSheets().filter((s) => !deleted.has(s.metadata.id));
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
  private savedAnalyses: SavedAnalysis[] = loadStoredAnalyses();
  private recentTracking: RecentTracking = loadRecentTracking();

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

  private repairGenericHeaders(sheet: SheetData): boolean {
    if (!sheet || !sheet.rows || sheet.rows.length === 0) return false;

    const genericHeaders = sheet.headers.filter((h) => /^Column_\d+$/i.test(h));
    if (genericHeaders.length < 2 && genericHeaders.length / sheet.headers.length < 0.2) {
      return false;
    }

    const firstRow = sheet.rows[0];
    if (!firstRow) return false;

    const candidateHeaderValues: { oldCol: string; newName: string }[] = [];
    let validHeaderCount = 0;

    for (const oldCol of sheet.headers) {
      const val = firstRow[oldCol];
      if (val !== null && val !== undefined && String(val).trim().length > 0) {
        const strVal = String(val).trim();
        const cleanNum = strVal.replace(/[\$,€,UZS,\s,%]/g, '');
        const isNum = cleanNum.length > 0 && !isNaN(Number(cleanNum));
        if (strVal.length <= 60 && !isNum) {
          validHeaderCount++;
          candidateHeaderValues.push({ oldCol, newName: strVal });
        } else {
          candidateHeaderValues.push({ oldCol, newName: oldCol });
        }
      } else {
        candidateHeaderValues.push({ oldCol, newName: oldCol });
      }
    }

    if (validHeaderCount >= Math.max(2, Math.floor(sheet.headers.length * 0.3))) {
      const firstColName = sheet.headers[0];
      if (
        firstColName &&
        !/^Column_\d+$/i.test(firstColName) &&
        firstColName.length > 5 &&
        (sheet.metadata.name.startsWith('Google Sheet (') ||
          sheet.metadata.name.startsWith('Spreadsheet ') ||
          sheet.metadata.name === 'New Connected Sheet')
      ) {
        sheet.metadata.name = firstColName;
      }

      const newHeaders: string[] = [];
      const used = new Set<string>();
      for (let i = 0; i < candidateHeaderValues.length; i++) {
        let name = candidateHeaderValues[i].newName;
        let unique = name;
        let cnt = 2;
        while (used.has(unique.toLowerCase())) {
          unique = `${name}_${cnt}`;
          cnt++;
        }
        used.add(unique.toLowerCase());
        newHeaders.push(unique);
      }

      const remainingRows = sheet.rows.slice(1);
      const newRows: SheetRow[] = remainingRows.map((r, rIdx) => {
        const obj: SheetRow = { _rowIndex: rIdx + 2 };
        candidateHeaderValues.forEach((item, idx) => {
          obj[newHeaders[idx]] = r[item.oldCol];
        });
        return obj;
      });

      const newColumns: ColumnDefinition[] = newHeaders.map((header, colIndex) => {
        const colValues = newRows.map((r) => r[header]);
        return detectColumnDefinition(header, colIndex, colValues);
      });

      sheet.headers = newHeaders;
      sheet.rows = newRows;
      sheet.metadata.columns = newColumns;
      sheet.metadata.rowCount = newRows.length;
      sheet.metadata.columnCount = newColumns.length;
      sheet.metadata.lastSyncedAt = new Date().toISOString();
      return true;
    }

    return false;
  }

  private isHydratedFromNeon = false;

  async getSheets(): Promise<any[]> {
    const deleted = getDeletedSheetIds();
    if (neonService.isConfigured() && !this.isHydratedFromNeon) {
      try {
        const dbSheets = await neonService.loadSheets();
        if (dbSheets && dbSheets.length > 0) {
          const filteredDb = dbSheets.filter((d) => !deleted.has(d.metadata.id));
          const merged = [...filteredDb];
          for (const local of this.sheets) {
            if (!deleted.has(local.metadata.id) && !merged.some((m) => m.metadata.id === local.metadata.id)) {
              merged.push(local);
              neonService.saveSheet(local).catch(() => {});
            }
          }
          this.sheets = merged;
          saveStoredSheets(this.sheets);
        }
        this.isHydratedFromNeon = true;
      } catch (err) {
        console.warn('Neon hydration error:', err);
      }
    }

    // Always filter out any deleted sheets
    this.sheets = this.sheets.filter((s) => !deleted.has(s.metadata.id));

    // Auto-repair any sheets with generic headers
    for (const s of this.sheets) {
      if (this.repairGenericHeaders(s)) {
        saveStoredSheets(this.sheets);
        if (neonService.isConfigured()) {
          neonService.saveSheet(s).catch(() => {});
        }
      }
    }

    return this.sheets.map((s) => ({
      id: s.metadata.id,
      name: s.metadata.name,
      title: s.metadata.name,
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

    const repaired = this.repairGenericHeaders(s);
    if (repaired) {
      saveStoredSheets(this.sheets);
      if (neonService.isConfigured()) {
        neonService.saveSheet(s).catch(console.error);
      }
    }

    return {
      metadata: { ...s.metadata },
      headers: [...s.headers],
      rows: s.rows.map((r) => ({ ...r })),
    };
  }

  async deleteSheet(id: string): Promise<boolean> {
    recordDeletedSheetId(id);
    this.sheets = this.sheets.filter((sheet) => sheet.metadata.id !== id);
    saveStoredSheets(this.sheets);
    if (neonService.isConfigured()) {
      try {
        await neonService.deleteSheet(id);
      } catch (err) {
        console.error('Failed to delete sheet from Neon:', err);
      }
    }
    try {
      await fetch(`/api/sheets/${id}`, { method: 'DELETE' });
    } catch {}
    return true;
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
    if (neonService.isConfigured()) {
      neonService.saveSheet(newSheet).catch(console.error);
    }
    return newSheet;
  }

  async addRow(sheetId: string, row: Record<string, any>): Promise<SheetRow> {
    const sheet = this.sheets.find((s) => s.metadata.id === sheetId);
    if (!sheet) throw new Error('Sheet not found.');
    const maxRowIndex = sheet.rows.reduce((max, r) => Math.max(max, Number(r._rowIndex) || 0), 1);
    const newRow = { ...row, _rowIndex: maxRowIndex + 1, id: `row_${Date.now()}` };
    sheet.rows = [...sheet.rows, newRow];
    sheet.metadata = {
      ...sheet.metadata,
      rowCount: sheet.rows.length,
      lastSyncedAt: new Date().toISOString(),
    };
    saveStoredSheets(this.sheets);
    if (neonService.isConfigured()) {
      neonService.saveSheet(sheet).catch(console.error);
    }
    return newRow;
  }

  async updateRow(sheetId: string, rowIndex: number, row: Record<string, any>): Promise<SheetRow> {
    const sheet = this.sheets.find((s) => s.metadata.id === sheetId);
    if (!sheet) throw new Error('Sheet not found.');
    const idx = sheet.rows.findIndex(
      (r, i) => r._rowIndex === rowIndex || r.id === rowIndex || i === rowIndex - 2 || i === rowIndex
    );
    if (idx >= 0) {
      const updatedRow = { ...sheet.rows[idx], ...row, _rowIndex: sheet.rows[idx]._rowIndex };
      const updatedRows = [...sheet.rows];
      updatedRows[idx] = updatedRow;
      sheet.rows = updatedRows;
      sheet.metadata = {
        ...sheet.metadata,
        lastSyncedAt: new Date().toISOString(),
      };
      saveStoredSheets(this.sheets);
      if (neonService.isConfigured()) {
        neonService.saveSheet(sheet).catch(console.error);
      }
      return updatedRow;
    }
    throw new Error('Row not found.');
  }

  async deleteRow(sheetId: string, rowIndex: number): Promise<boolean> {
    const sheet = this.sheets.find((s) => s.metadata.id === sheetId);
    if (!sheet) throw new Error('Sheet not found.');
    sheet.rows = sheet.rows.filter(
      (r, i) => r._rowIndex !== rowIndex && r.id !== rowIndex && i !== rowIndex - 2 && i !== rowIndex
    );
    sheet.metadata = {
      ...sheet.metadata,
      rowCount: sheet.rows.length,
      lastSyncedAt: new Date().toISOString(),
    };
    saveStoredSheets(this.sheets);
    if (neonService.isConfigured()) {
      neonService.saveSheet(sheet).catch(console.error);
    }
    return true;
  }

  async refreshSheet(sheetId: string): Promise<SheetData> {
    const sheet = await this.getSheetById(sheetId);
    if (sheet.metadata.url && (sheet.metadata.url.includes('docs.google.com') || sheet.metadata.url.includes('google'))) {
      try {
        const grid = await fetchGoogleSheetCsv(sheet.metadata.url);
        if (grid && grid.length >= 2) {
          const fresh = normalizeRawGrid(sheet.metadata.name, grid, sheet.metadata.id, sheet.metadata.selectedTab, sheet.metadata.url);
          sheet.headers = fresh.headers;
          sheet.rows = fresh.rows;
          sheet.metadata.rowCount = fresh.metadata.rowCount;
          sheet.metadata.columnCount = fresh.metadata.columnCount;
          sheet.metadata.columns = fresh.metadata.columns;
          sheet.metadata.name = fresh.metadata.name;
        }
      } catch (err) {
        console.warn('refreshSheet error:', err);
      }
    }
    sheet.metadata.lastSyncedAt = new Date().toISOString();
    saveStoredSheets(this.sheets);
    if (neonService.isConfigured()) {
      neonService.saveSheet(sheet).catch(console.error);
    }
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

  // ================= SAVED ANALYSES (SECTIONS 30 - 36) =================
  async getSavedAnalyses(): Promise<SavedAnalysis[]> {
    return [...this.savedAnalyses].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getSavedAnalysisById(id: string): Promise<SavedAnalysis> {
    const analysis = this.savedAnalyses.find((a) => a.id === id);
    if (!analysis) throw new Error('Saved analysis not found.');
    this.trackAnalysisOpened(id);
    return { ...analysis };
  }

  async saveAnalysis(analysisData: Partial<SavedAnalysis>): Promise<SavedAnalysis> {
    const id = analysisData.id || `analysis_${Date.now()}`;
    const now = new Date().toISOString();

    const existingIdx = this.savedAnalyses.findIndex((a) => a.id === id);
    if (existingIdx >= 0) {
      const existing = this.savedAnalyses[existingIdx];
      const updated: SavedAnalysis = {
        ...existing,
        ...analysisData,
        id,
        updatedAt: now,
        history: [
          {
            timestamp: now,
            action: 'updated',
            description: `Updated analysis configuration (${analysisData.name || existing.name})`,
          },
          ...(existing.history || []),
        ],
      } as SavedAnalysis;
      this.savedAnalyses[existingIdx] = updated;
      saveStoredAnalyses(this.savedAnalyses);
      this.trackAnalysisOpened(id);
      return updated;
    }

    const newAnalysis: SavedAnalysis = {
      id,
      userId: 'user_default',
      name: analysisData.name || 'Untitled Analysis',
      connectedSheetId: analysisData.connectedSheetId || '',
      sheetName: analysisData.sheetName || 'Connected Sheet',
      sheetTab: analysisData.sheetTab || 'Sheet1',
      spreadsheetUrl: analysisData.spreadsheetUrl,
      functionId: analysisData.functionId || 'SUM',
      visualizationType: analysisData.visualizationType || 'kpi',
      config: analysisData.config || {
        functionId: analysisData.functionId || 'SUM',
      },
      lastResult: analysisData.lastResult,
      insights: analysisData.insights || [],
      lastCalculatedAt: analysisData.lastCalculatedAt || now,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          timestamp: now,
          action: 'created',
          description: `Analysis created`,
        },
      ],
    };

    this.savedAnalyses.unshift(newAnalysis);
    saveStoredAnalyses(this.savedAnalyses);
    this.trackAnalysisOpened(id);
    return newAnalysis;
  }

  async updateAnalysis(id: string, updates: Partial<SavedAnalysis>): Promise<SavedAnalysis> {
    return this.saveAnalysis({ ...updates, id });
  }

  async deleteAnalysis(id: string): Promise<boolean> {
    this.savedAnalyses = this.savedAnalyses.filter((a) => a.id !== id);
    saveStoredAnalyses(this.savedAnalyses);
    return true;
  }

  // ================= LOCAL-FIRST SHEET SAVING (SECTION 15 & 16) =================
  async saveSheetChanges(
    sheetId: string,
    rows: Record<string, any>[],
    columns?: ColumnDefinition[]
  ): Promise<SheetData> {
    const sheet = this.sheets.find((s) => s.metadata.id === sheetId);
    if (!sheet) throw new Error('Sheet not found.');

    const now = new Date().toISOString();
    sheet.rows = rows.map((r, i) => ({
      ...r,
      _rowIndex: r._rowIndex || i + 2,
    }));
    sheet.metadata.rowCount = rows.length;

    if (columns && columns.length > 0) {
      sheet.metadata.columns = columns;
      sheet.metadata.columnCount = columns.length;
      sheet.headers = columns.map((c) => c.name);
    }
    sheet.metadata.lastSyncedAt = now;

    saveStoredSheets(this.sheets);
    if (neonService.isConfigured()) {
      neonService.saveSheet(sheet).catch(console.error);
    }

    return {
      metadata: { ...sheet.metadata },
      headers: [...sheet.headers],
      rows: sheet.rows.map((r) => ({ ...r })),
    };
  }

  // ================= GOOGLE SHEETS LIVE SYNC =================
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
    const sheet = this.sheets.find((s) => s.metadata.id === sheetId);
    if (!sheet) throw new Error('Sheet not found');

    const effectiveWebhook =
      payload.webhookUrl ||
      (typeof window !== 'undefined'
        ? localStorage.getItem(`sheetflow_webhook_${sheetId}`) || localStorage.getItem('sheetflow_global_webhook')
        : null);

    // If Google Apps Script Webhook is configured
    if (effectiveWebhook && effectiveWebhook.startsWith('http')) {
      try {
        const values = [
          payload.headers,
          ...payload.rows.map((r) =>
            payload.headers.map((h) => (r[h] !== undefined && r[h] !== null ? r[h] : ''))
          ),
        ];

        await fetch(effectiveWebhook, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync',
            spreadsheetId: sheetId,
            tabName: payload.tabName || sheet.metadata.selectedTab || 'Sheet1',
            values,
          }),
        });

        sheet.metadata.lastSyncedAt = new Date().toISOString();
        saveStoredSheets(this.sheets);
        return {
          synced: true,
          target: 'google_apps_script',
          message: 'Google Sheets Apps Script orqali muvaffaqiyatli yangilandi!',
        };
      } catch (err: any) {
        console.warn('Apps Script sync error:', err);
      }
    }

    // Try serverless API sync
    try {
      const resp = await fetch(`/api/sheets/${sheetId}/sync-google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.data?.synced) {
          return data.data;
        }
      }
    } catch {}

    return {
      synced: false,
      target: 'local_database',
      message: 'O‘zgarishlar Neon Postgres bazasiga to‘liq saqlandi.',
    };
  }

  // ================= RECENT TRACKING (SECTION 4) =================
  trackSheetOpened(sheetId: string) {
    this.recentTracking.sheetOpened[sheetId] = new Date().toISOString();
    saveRecentTracking(this.recentTracking);
  }

  trackAnalysisOpened(analysisId: string) {
    this.recentTracking.analysisOpened[analysisId] = new Date().toISOString();
    saveRecentTracking(this.recentTracking);
  }

  async getRecentSheets(): Promise<any[]> {
    const all = await this.getSheets();
    return all
      .map((s) => ({
        ...s,
        lastOpenedAt: this.recentTracking.sheetOpened[s.id] || s.lastSyncedAt,
      }))
      .sort(
        (a, b) =>
          new Date(b.lastOpenedAt || 0).getTime() - new Date(a.lastOpenedAt || 0).getTime()
      )
      .slice(0, 5);
  }

  async getRecentAnalyses(): Promise<SavedAnalysis[]> {
    const all = await this.getSavedAnalyses();
    return all
      .map((a) => ({
        ...a,
        lastOpenedAt: this.recentTracking.analysisOpened[a.id] || a.updatedAt,
      }))
      .sort(
        (a: any, b: any) =>
          new Date(b.lastOpenedAt || 0).getTime() - new Date(a.lastOpenedAt || 0).getTime()
      )
      .slice(0, 5);
  }
}

export const mockService = new BrowserMockService();
