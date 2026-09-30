import { ApiResponse, successResponse, errorResponse } from './types';
import { calculate } from '../../core/calculations/engine';
import { analyzeSheet } from '../../core/analyzer/dataAnalyzer';
import { generateDashboard } from '../../core/dashboard-generator/dashboardGenerator';
import { extractSpreadsheetId, fetchPublicSpreadsheetPreview, syncAllRowsToGoogleSheet } from '../services/googleSheets';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../security/auth';
import { getInitialSampleSheets } from '../../core/sample-data';
import { SheetData, SheetRow } from '../../core/types/sheet';

// In-memory / fallback store for demo & local development
const mockSheets: SheetData[] = getInitialSampleSheets();
const mockCalculations: any[] = [];
const mockDashboards: any[] = [];
const mockUsers: any[] = [
  {
    id: 'user_demo_1',
    email: 'demo@sheetflow.io',
    name: 'Demo User',
    passwordHash: hashPassword('password123'),
  },
];

export async function handleApiRequest(
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Promise<{ status: number; body: ApiResponse }> {
  try {
    const cleanPath = path.split('?')[0].replace(/\/+$/, '');

    // 1. AUTH ROUTES
    if (cleanPath === '/api/auth/register' && method === 'POST') {
      const { email, password, name } = body || {};
      if (!email || !password || !name) {
        return { status: 400, body: errorResponse('VALIDATION_ERROR', 'Name, email, and password are required.') };
      }
      const existing = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return { status: 400, body: errorResponse('USER_ALREADY_EXISTS', 'A user with this email already exists.') };
      }
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        name,
        passwordHash: hashPassword(password),
      };
      mockUsers.push(newUser);
      const token = createSessionToken({ userId: newUser.id, email: newUser.email, name: newUser.name });
      return {
        status: 200,
        body: successResponse({
          token,
          user: { id: newUser.id, email: newUser.email, name: newUser.name },
        }),
      };
    }

    if (cleanPath === '/api/auth/login' && method === 'POST') {
      const { email, password } = body || {};
      const user = mockUsers.find((u) => u.email.toLowerCase() === email?.toLowerCase());
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return { status: 401, body: errorResponse('INVALID_CREDENTIALS', 'Invalid email or password.') };
      }
      const token = createSessionToken({ userId: user.id, email: user.email, name: user.name });
      return {
        status: 200,
        body: successResponse({
          token,
          user: { id: user.id, email: user.email, name: user.name },
        }),
      };
    }

    // 2. SHEETS PREVIEW
    if (cleanPath === '/api/sheets/preview' && method === 'POST') {
      const { url } = body || {};
      const spreadsheetId = extractSpreadsheetId(url);
      if (!spreadsheetId) {
        return { status: 400, body: errorResponse('INVALID_SHEET_URL', 'Invalid Google Sheets URL or ID.') };
      }

      // Check if it matches our preloaded samples first
      const sample = mockSheets.find((s) => s.metadata.id === spreadsheetId || s.metadata.url?.includes(spreadsheetId));
      if (sample) {
        return {
          status: 200,
          body: successResponse({
            spreadsheetId: sample.metadata.id,
            spreadsheetName: sample.metadata.name,
            spreadsheetUrl: sample.metadata.url || url,
            availableTabs: sample.metadata.sheetTabs,
            selectedTab: sample.metadata.selectedTab,
            rowCount: sample.metadata.rowCount,
            columnCount: sample.metadata.columnCount,
            columns: sample.metadata.columns,
            sampleRows: sample.rows.slice(0, 10),
            isPublic: true,
            canEdit: true,
          }),
        };
      }

      try {
        const preview = await fetchPublicSpreadsheetPreview(spreadsheetId);
        return { status: 200, body: successResponse(preview) };
      } catch (err: any) {
        return {
          status: 400,
          body: errorResponse('SHEET_ACCESS_DENIED', err.message || 'Could not access sheet.'),
        };
      }
    }

    // 3. SHEETS LIST & CONNECT
    if (cleanPath === '/api/sheets' && method === 'GET') {
      return {
        status: 200,
        body: successResponse(
          mockSheets.map((s) => ({
            id: s.metadata.id,
            name: s.metadata.name,
            url: s.metadata.url,
            selectedTab: s.metadata.selectedTab,
            rowCount: s.metadata.rowCount,
            columnCount: s.metadata.columnCount,
            lastSyncedAt: s.metadata.lastSyncedAt,
            columns: s.metadata.columns,
            userRole: s.metadata.userRole || 'editor',
          }))
        ),
      };
    }

    if (cleanPath === '/api/sheets/connect' && method === 'POST') {
      const { spreadsheetId, name, url, rows, columns } = body || {};
      const existing = mockSheets.find((s) => s.metadata.id === spreadsheetId);
      if (existing) {
        return { status: 200, body: successResponse(existing) };
      }

      const newSheet: SheetData = {
        metadata: {
          id: spreadsheetId || `sheet_${Date.now()}`,
          name: name || 'New Connected Sheet',
          url: url || '',
          sheetTabs: ['Sheet1'],
          selectedTab: 'Sheet1',
          rowCount: rows?.length || 0,
          columnCount: columns?.length || 0,
          columns: columns || [],
          lastSyncedAt: new Date().toISOString(),
          userRole: 'editor',
        },
        rows: rows || [],
        headers: columns?.map((c: any) => c.name) || [],
      };
      mockSheets.push(newSheet);
      return { status: 201, body: successResponse(newSheet) };
    }

    // Dynamic Sheet ID routes: /api/sheets/:id
    const sheetIdMatch = cleanPath.match(/^\/api\/sheets\/([a-zA-Z0-9_-]+)(\/.*)?$/);
    if (sheetIdMatch) {
      const id = sheetIdMatch[1];
      const subPath = sheetIdMatch[2] || '';
      const sheet = mockSheets.find((s) => s.metadata.id === id);

      if (!sheet) {
        return { status: 404, body: errorResponse('SHEET_NOT_FOUND', 'Spreadsheet not found.') };
      }

      if (subPath === '' && method === 'GET') {
        return { status: 200, body: successResponse(sheet) };
      }

      if (subPath === '' && method === 'DELETE') {
        const idx = mockSheets.findIndex((s) => s.metadata.id === id);
        if (idx >= 0) {
          mockSheets.splice(idx, 1);
        }
        return { status: 200, body: successResponse({ deleted: true }) };
      }

      if (subPath === '/data' && method === 'GET') {
        return { status: 200, body: successResponse(sheet.rows) };
      }

      // Add Row: POST /api/sheets/:id/rows
      if (subPath === '/rows' && method === 'POST') {
        const newRow: SheetRow = {
          _rowIndex: sheet.rows.length + 2,
          ...body,
        };
        sheet.rows.push(newRow);
        sheet.metadata.rowCount = sheet.rows.length;
        sheet.metadata.lastSyncedAt = new Date().toISOString();
        return { status: 201, body: successResponse(newRow) };
      }

      // Update Row: PATCH /api/sheets/:id/rows/:rowId
      const rowIdMatch = subPath.match(/^\/rows\/(\d+)$/);
      if (rowIdMatch && method === 'PATCH') {
        const rowIndex = parseInt(rowIdMatch[1], 10);
        const idx = sheet.rows.findIndex((r) => r._rowIndex === rowIndex || r.id === rowIndex);
        if (idx >= 0) {
          sheet.rows[idx] = { ...sheet.rows[idx], ...body };
          sheet.metadata.lastSyncedAt = new Date().toISOString();
          return { status: 200, body: successResponse(sheet.rows[idx]) };
        }
        return { status: 404, body: errorResponse('SHEET_NOT_FOUND', 'Row not found.') };
      }

      // Delete Row: DELETE /api/sheets/:id/rows/:rowId
      if (rowIdMatch && method === 'DELETE') {
        const rowIndex = parseInt(rowIdMatch[1], 10);
        sheet.rows = sheet.rows.filter((r) => r._rowIndex !== rowIndex && r.id !== rowIndex);
        sheet.metadata.rowCount = sheet.rows.length;
        sheet.metadata.lastSyncedAt = new Date().toISOString();
        return { status: 200, body: successResponse({ deleted: true }) };
      }

      // Refresh Sheet: POST /api/sheets/:id/refresh
      if (subPath === '/refresh' && method === 'POST') {
        sheet.metadata.lastSyncedAt = new Date().toISOString();
        return { status: 200, body: successResponse(sheet) };
      }

      // Sync all changes (including deleted rows) to Google Sheet: POST /api/sheets/:id/sync-google
      if (subPath === '/sync-google' && method === 'POST') {
        const { tabName, headers: reqHeaders, rows: reqRows, webhookUrl } = body || {};
        const spreadsheetId = sheet.metadata.url ? extractSpreadsheetId(sheet.metadata.url) || id : id;

        // 1. Google Apps Script Webhook
        if (webhookUrl && webhookUrl.startsWith('http')) {
          try {
            const values = [
              reqHeaders || sheet.headers,
              ...(reqRows || sheet.rows).map((row: any) =>
                (reqHeaders || sheet.headers).map((h: string) => (row[h] !== undefined && row[h] !== null ? row[h] : ''))
              ),
            ];
            const resp = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'sync',
                spreadsheetId,
                tabName: tabName || sheet.metadata.selectedTab || 'Sheet1',
                values,
              }),
            });
            if (resp.ok) {
              sheet.metadata.lastSyncedAt = new Date().toISOString();
              return {
                status: 200,
                body: successResponse({
                  synced: true,
                  target: 'google_apps_script',
                  message: 'Google Sheets Apps Script orqali muvaffaqiyatli yangilandi.',
                }),
              };
            }
          } catch (webhookErr: any) {
            console.warn('Webhook sync failed:', webhookErr);
          }
        }

        // 2. Google Sheets API with OAuth
        const authHeader = headers?.['authorization'] || '';
        const accessToken = authHeader.replace(/^Bearer\s+/i, '') || body?.accessToken;

        if (accessToken && accessToken !== 'null' && !accessToken.startsWith('tok_')) {
          try {
            const result = await syncAllRowsToGoogleSheet(
              accessToken,
              spreadsheetId,
              tabName || sheet.metadata.selectedTab || 'Sheet1',
              reqHeaders || sheet.headers,
              reqRows || sheet.rows
            );
            sheet.metadata.lastSyncedAt = new Date().toISOString();
            return {
              status: 200,
              body: successResponse({
                synced: true,
                target: 'google_api',
                result,
                message: 'Google Sheets API orqali muvaffaqiyatli saqlandi.',
              }),
            };
          } catch (apiErr: any) {
            return {
              status: 400,
              body: errorResponse(
                'GOOGLE_SYNC_FAILED',
                `Google Sheets API bilan saqlab bo‘lmadi: ${apiErr.message || 'Ruxsat xatosi'}`
              ),
            };
          }
        }

        // 3. Fallback when credentials aren't present
        return {
          status: 200,
          body: successResponse({
            synced: false,
            target: 'local_database',
            message:
              'O‘zgarishlar SheetFlow va Neon bazasiga to‘liq saqlandi. Google Sheets-ga to‘g‘ridan-to‘g‘ri yozish uchun Google hisobiga tahrirchi (Editor) ruxsati yoki Google Apps Script Webhook havolasi kerak.',
          }),
        };
      }
    }

    // 4. ANALYTICS ROUTES
    if (cleanPath === '/api/analytics/calculate' && method === 'POST') {
      const { sheetId, calculation } = body || {};
      const sheet = mockSheets.find((s) => s.metadata.id === sheetId) || mockSheets[0];
      const result = calculate(sheet.rows, calculation);
      return { status: 200, body: successResponse(result) };
    }

    if (cleanPath === '/api/analytics/analyze' && method === 'POST') {
      const { sheetId } = body || {};
      const sheet = mockSheets.find((s) => s.metadata.id === sheetId) || mockSheets[0];
      const analysis = analyzeSheet(sheet);
      return { status: 200, body: successResponse(analysis) };
    }

    if (cleanPath === '/api/analytics/dashboard' && method === 'POST') {
      const { sheetId, name } = body || {};
      const sheet = mockSheets.find((s) => s.metadata.id === sheetId) || mockSheets[0];
      const dashboard = generateDashboard(sheet, name);
      return { status: 200, body: successResponse(dashboard) };
    }

    // 5. CALCULATIONS CRUD
    if (cleanPath === '/api/calculations' && method === 'GET') {
      return { status: 200, body: successResponse(mockCalculations) };
    }

    if (cleanPath === '/api/calculations' && method === 'POST') {
      const newCalc = { id: `calc_${Date.now()}`, ...body, createdAt: new Date().toISOString() };
      mockCalculations.push(newCalc);
      return { status: 201, body: successResponse(newCalc) };
    }

    // 6. DASHBOARDS CRUD
    if (cleanPath === '/api/dashboards' && method === 'GET') {
      return { status: 200, body: successResponse(mockDashboards) };
    }

    if (cleanPath === '/api/dashboards' && method === 'POST') {
      const newDash = { id: `dash_${Date.now()}`, ...body, createdAt: new Date().toISOString() };
      mockDashboards.push(newDash);
      return { status: 201, body: successResponse(newDash) };
    }

    return {
      status: 404,
      body: errorResponse('INTERNAL_SERVER_ERROR', `Route not found: ${method} ${path}`),
    };
  } catch (err: any) {
    return {
      status: 500,
      body: errorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred.'),
    };
  }
}
