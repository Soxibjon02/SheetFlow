import { SheetData, SheetMetadata, SheetRow, SheetPreviewResult, ColumnDefinition } from '../types/sheet';
import { detectColumnDefinition, parseCellValue } from '../detector/typeDetector';

export interface SpreadsheetInfo {
  id: string;
  isPublished: boolean;
  exportUrl: string;
  gvizUrl: string;
}

export function extractSpreadsheetInfo(inputUrlOrId: string): SpreadsheetInfo {
  if (!inputUrlOrId) {
    return { id: '', isPublished: false, exportUrl: '', gvizUrl: '' };
  }
  const trimmed = inputUrlOrId.trim();

  // 1. Published Google Sheet: /spreadsheets/d/e/(2PACX-[a-zA-Z0-9-_]+)
  const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch && pubMatch[1]) {
    const pubId = pubMatch[1];
    return {
      id: pubId,
      isPublished: true,
      exportUrl: `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv`,
      gvizUrl: `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv`,
    };
  }

  // 2. Standard Google Sheets URL: /spreadsheets/d/([a-zA-Z0-9-_]+)
  const stdMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (stdMatch && stdMatch[1] && stdMatch[1] !== 'e') {
    const sheetId = stdMatch[1];
    return {
      id: sheetId,
      isPublished: false,
      exportUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
      gvizUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`,
    };
  }

  // 3. Raw sheet ID directly passed or other URL
  const cleanId = trimmed.split('/')[0].split('?')[0].split('#')[0];
  return {
    id: cleanId,
    isPublished: false,
    exportUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv`,
    gvizUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv`,
  };
}

export function extractSpreadsheetId(inputUrlOrId: string): string | null {
  if (!inputUrlOrId) return null;
  const info = extractSpreadsheetInfo(inputUrlOrId);
  return info.id || inputUrlOrId.trim();
}

/**
 * Parses raw text (CSV or Tab-Separated copied from Google Sheets/Excel) into a 2D string grid.
 */
export function parseCsvOrTsvToGrid(rawText: string): string[][] {
  if (!rawText || !rawText.trim()) return [];
  const text = rawText.trim();

  // If tab-separated (copied directly from Google Sheets / Excel table)
  if (text.includes('\t') && (!text.includes(',') || text.split('\t').length > text.split(',').length)) {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    return lines.map((line) => line.split('\t').map((c) => c.replace(/^"|"$/g, '').trim()));
  }

  // Standard RFC-4180 CSV Parser
  const grid: string[][] = [];
  let row: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(currentField.trim());
      if (row.length > 0 && row.some((cell) => cell.length > 0)) {
        grid.push(row);
      }
      row = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || row.length > 0) {
    row.push(currentField.trim());
    if (row.some((cell) => cell.length > 0)) {
      grid.push(row);
    }
  }

  return grid;
}

export interface IDataSource {

  id: string;
  type: 'google_sheets' | 'csv' | 'sample' | 'excel' | 'postgres';
  name: string;
  preview(options?: any): Promise<SheetPreviewResult>;
  fetchData(sheetTab?: string): Promise<SheetData>;
  addRow(row: SheetRow, sheetTab?: string): Promise<SheetRow>;
  updateRow(rowIndex: number, row: SheetRow, sheetTab?: string): Promise<SheetRow>;
  deleteRow(rowIndex: number, sheetTab?: string): Promise<boolean>;
}

/**
 * Normalizes 2D array of rows (first row is header) into SheetData with detected types.
 */
export function normalizeRawGrid(
  name: string,
  rawGrid: any[][],
  sheetId: string = `sheet_${Date.now()}`,
  tabName: string = 'Sheet1',
  url?: string
): SheetData {
  if (!rawGrid || rawGrid.length === 0) {
    return {
      metadata: {
        id: sheetId,
        name,
        url,
        sheetTabs: [tabName],
        selectedTab: tabName,
        rowCount: 0,
        columnCount: 0,
        columns: [],
        lastSyncedAt: new Date().toISOString(),
      },
      rows: [],
      headers: [],
    };
  }

  const rawHeaders = rawGrid[0].map((h, i) => (h ? String(h).trim() : `Column_${i + 1}`));
  const rawRows = rawGrid.slice(1);

  // Detect column definitions
  const columns: ColumnDefinition[] = rawHeaders.map((header, colIndex) => {
    const colValues = rawRows.map((r) => (r ? r[colIndex] : null));
    return detectColumnDefinition(header, colIndex, colValues);
  });

  // Construct normalized objects
  const rows: SheetRow[] = rawRows.map((rawRow, rowIdx) => {
    const rowObj: SheetRow = { _rowIndex: rowIdx + 2 }; // Spreadsheet row (1-indexed + header)
    columns.forEach((col, cIdx) => {
      const rawCell = rawRow ? rawRow[cIdx] : null;
      rowObj[col.name] = parseCellValue(rawCell, col.detectedType);
    });
    return rowObj;
  });

  return {
    metadata: {
      id: sheetId,
      name,
      url,
      sheetTabs: [tabName],
      selectedTab: tabName,
      rowCount: rows.length,
      columnCount: columns.length,
      columns,
      lastSyncedAt: new Date().toISOString(),
      userRole: 'editor',
    },
    rows,
    headers: rawHeaders,
  };
}
