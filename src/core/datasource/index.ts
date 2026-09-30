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

export interface HeaderDetectionResult {
  headerRowIndex: number;
  headers: string[];
  dataRows: any[][];
  titleBanner?: string;
}

/**
 * Intelligently detects the true header row in a spreadsheet grid.
 * Skips empty rows, merged title banners (e.g. single cell title banners),
 * and finds the row with the best header density of text labels.
 */
export function detectHeaderRow(rawGrid: any[][]): HeaderDetectionResult {
  if (!rawGrid || rawGrid.length === 0) {
    return { headerRowIndex: 0, headers: [], dataRows: [] };
  }

  // Calculate the maximum number of columns found in the top 15 rows
  const scanLimit = Math.min(15, rawGrid.length);
  let maxCols = 1;
  for (let i = 0; i < scanLimit; i++) {
    if (rawGrid[i] && rawGrid[i].length > maxCols) {
      maxCols = rawGrid[i].length;
    }
  }

  let bestIndex = 0;
  let bestScore = -Infinity;
  let detectedTitle: string | undefined = undefined;

  // We scan candidate rows from row 0 to row min(6, rawGrid.length - 1)
  const candidateLimit = Math.min(6, rawGrid.length);

  for (let r = 0; r < candidateLimit; r++) {
    const row = rawGrid[r] || [];
    const nonEmptyCells = row
      .map((c, i) => ({ val: c !== null && c !== undefined ? String(c).trim() : '', colIdx: i }))
      .filter((item) => item.val.length > 0);

    const nonEmptyCount = nonEmptyCells.length;

    // Completely empty row -> skip
    if (nonEmptyCount === 0) {
      continue;
    }

    // Single non-empty cell in a table with 3 or more columns is a title/banner row
    if (nonEmptyCount === 1 && maxCols >= 3) {
      if (!detectedTitle) {
        detectedTitle = nonEmptyCells[0].val;
      }
      continue;
    }

    // Count cells that are non-numeric text strings (typical column headers)
    const textCells = nonEmptyCells.filter((item) => {
      const val = item.val;
      const cleanNum = val.replace(/[\$,€,UZS,\s,%]/g, '');
      const isNum = cleanNum.length > 0 && !isNaN(Number(cleanNum));
      const isDate =
        /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(val) ||
        /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(val);
      return !isNum && !isDate;
    });

    let score = nonEmptyCount * 12;
    score += textCells.length * 8;

    // Bonus for covering majority of columns
    if (nonEmptyCount >= Math.floor(maxCols * 0.5)) {
      score += 50;
    }
    // High bonus if most non-empty cells are text
    if (nonEmptyCount > 0 && textCells.length / nonEmptyCount >= 0.7) {
      score += 40;
    }

    // Small penalty for later rows
    score -= r * 3;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = r;
    }
  }

  // If the best row is after row 0 and title wasn't found, check earlier rows
  if (bestIndex > 0 && !detectedTitle) {
    for (let r = 0; r < bestIndex; r++) {
      const row = rawGrid[r] || [];
      const cells = row.filter((c) => c !== null && c !== undefined && String(c).trim().length > 0);
      if (cells.length > 0 && cells.length <= 3) {
        detectedTitle = cells.map((c) => String(c).trim()).join(' — ');
        break;
      }
    }
  }

  // Extract raw header row
  const headerRow = rawGrid[bestIndex] || [];
  const rawHeaders: string[] = [];
  const usedNames = new Set<string>();

  // Determine actual column count (at least headerRow.length or maxCols)
  const effectiveColCount = Math.max(headerRow.length, maxCols);

  for (let c = 0; c < effectiveColCount; c++) {
    let name = headerRow[c] !== null && headerRow[c] !== undefined ? String(headerRow[c]).trim() : '';
    if (!name) {
      name = `Ustun_${c + 1}`;
    }
    let uniqueName = name;
    let counter = 2;
    while (usedNames.has(uniqueName.toLowerCase())) {
      uniqueName = `${name}_${counter}`;
      counter++;
    }
    usedNames.add(uniqueName.toLowerCase());
    rawHeaders.push(uniqueName);
  }

  const dataRows = rawGrid.slice(bestIndex + 1);

  return {
    headerRowIndex: bestIndex,
    headers: rawHeaders,
    dataRows,
    titleBanner: detectedTitle,
  };
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

  const { headerRowIndex, headers: rawHeaders, dataRows: rawRows, titleBanner } = detectHeaderRow(rawGrid);

  // If detectedTitle is present and given name is generic, adopt the detected title
  let finalName = name;
  const isGenericName =
    !name ||
    name.startsWith('Google Sheet (') ||
    name.startsWith('Spreadsheet ') ||
    name === 'New Connected Sheet' ||
    name === 'Imported Custom Dataset';
  if (titleBanner && isGenericName) {
    finalName = titleBanner;
  }

  // Detect column definitions
  const columns: ColumnDefinition[] = rawHeaders.map((header, colIndex) => {
    const colValues = rawRows.map((r) => (r ? r[colIndex] : null));
    return detectColumnDefinition(header, colIndex, colValues);
  });

  // Construct normalized objects
  const rows: SheetRow[] = rawRows.map((rawRow, rowIdx) => {
    const rowObj: SheetRow = { _rowIndex: rowIdx + headerRowIndex + 2 }; // Spreadsheet row (1-indexed)
    columns.forEach((col, cIdx) => {
      const rawCell = rawRow ? rawRow[cIdx] : null;
      rowObj[col.name] = parseCellValue(rawCell, col.detectedType);
    });
    return rowObj;
  });

  return {
    metadata: {
      id: sheetId,
      name: finalName,
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
