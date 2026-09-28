import { google } from 'googleapis';
import { SheetPreviewResult, SheetData, SheetRow } from '../../core/types/sheet';
import { normalizeRawGrid } from '../../core/datasource';

export function extractSpreadsheetId(inputUrlOrId: string): string | null {
  if (!inputUrlOrId) return null;
  const trimmed = inputUrlOrId.trim();

  // If already an ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex to extract from standard Google Sheets URL
  // e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.APP_URL 
    ? `${process.env.APP_URL}/api/google/callback` 
    : 'http://localhost:3000/api/google/callback';

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function generateGoogleAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
}

/**
 * Reads public sheet data via export CSV or API without user login.
 */
export async function fetchPublicSpreadsheetPreview(
  spreadsheetId: string,
  tabName?: string
): Promise<SheetPreviewResult> {
  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${
    tabName ? `&gid=${tabName}` : ''
  }`;

  try {
    const response = await fetch(exportUrl);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Spreadsheet not found. Please check the URL.');
      }
      throw new Error(
        'This Google Sheet appears to be private or requires authorization. Please connect your Google account to access it.'
      );
    }

    const csvText = await response.text();
    const rows = parseSimpleCsv(csvText);

    if (rows.length === 0) {
      throw new Error('Spreadsheet is empty.');
    }

    const sheetData = normalizeRawGrid(
      `Spreadsheet ${spreadsheetId.substring(0, 8)}`,
      rows,
      spreadsheetId,
      tabName || 'Sheet1',
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    );

    return {
      spreadsheetId,
      spreadsheetName: sheetData.metadata.name,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      availableTabs: sheetData.metadata.sheetTabs,
      selectedTab: sheetData.metadata.selectedTab,
      rowCount: sheetData.metadata.rowCount,
      columnCount: sheetData.metadata.columnCount,
      columns: sheetData.metadata.columns,
      sampleRows: sheetData.rows.slice(0, 10),
      isPublic: true,
      canEdit: false,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Unable to access Google Sheet preview.');
  }
}

/**
 * Accesses Google Sheets via authorized OAuth credentials.
 */
export async function getAuthorizedSheetsClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.sheets({ version: 'v4', auth });
}

/**
 * Appends a new row to an authorized Google Sheet.
 */
export async function appendRowToSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  rowValues: any[]
) {
  const sheets = await getAuthorizedSheetsClient(accessToken);
  const range = `${tabName}!A:Z`;

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [rowValues],
    },
  });

  return response.data;
}

/**
 * Updates a specific row in an authorized Google Sheet.
 */
export async function updateRowInSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  rowIndex: number, // 1-indexed row in spreadsheet
  rowValues: any[]
) {
  const sheets = await getAuthorizedSheetsClient(accessToken);
  const range = `${tabName}!A${rowIndex}:Z${rowIndex}`;

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [rowValues],
    },
  });

  return response.data;
}

/**
 * Parses CSV text into a 2D array.
 */
function parseSimpleCsv(text: string): any[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return lines.map((line) => {
    const row: string[] = [];
    let insideQuotes = false;
    let currentCell = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    return row;
  });
}
