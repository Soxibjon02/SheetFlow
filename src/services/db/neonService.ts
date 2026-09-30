import { neon } from '@neondatabase/serverless';
import { SheetData, SheetRow } from '../../core/types/sheet';

const NEON_STORAGE_KEY = 'sheetflow_neon_url';

export interface NeonConnectionStatus {
  isConnected: boolean;
  isConfigured: boolean;
  databaseUrl: string | null;
  error?: string | null;
  sheetCount?: number;
}

class NeonService {
  private databaseUrl: string | null = null;
  private isTableInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(NEON_STORAGE_KEY);
      this.databaseUrl = stored || (import.meta as any).env?.VITE_NEON_DATABASE_URL || null;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.databaseUrl && this.databaseUrl.trim().startsWith('postgres'));
  }

  getDatabaseUrl(): string | null {
    return this.databaseUrl;
  }

  getMaskedUrl(): string {
    if (!this.databaseUrl) return '';
    try {
      const parsed = new URL(this.databaseUrl);
      return `${parsed.protocol}//${parsed.username}:••••••@${parsed.host}${parsed.pathname}`;
    } catch {
      return this.databaseUrl.substring(0, 16) + '••••••••';
    }
  }

  async setDatabaseUrl(url: string): Promise<{ success: boolean; message: string }> {
    const trimmed = url.trim();
    if (!trimmed.startsWith('postgres://') && !trimmed.startsWith('postgresql://')) {
      return {
        success: false,
        message: 'Havola notoʻgʻri! Neon Postgres havolasi "postgresql://..." yoki "postgres://..." bilan boshlanishi kerak.',
      };
    }

    try {
      const sql = neon(trimmed);
      // Test basic connection
      const testResult = await sql`SELECT 1 as connected;`;
      if (!testResult || testResult.length === 0) {
        throw new Error('Bogʻlanishda javob olinmadi.');
      }

      this.databaseUrl = trimmed;
      if (typeof window !== 'undefined') {
        localStorage.setItem(NEON_STORAGE_KEY, trimmed);
      }

      // Initialize table structure
      await this.ensureTables();

      return {
        success: true,
        message: 'Neon Postgres maʼlumotlar bazasiga muvaffaqiyatli ulandi!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Neon bazasiga ulanishda xatolik: ${err.message || 'Tarmoq xatosi'}`,
      };
    }
  }

  disconnect(): void {
    this.databaseUrl = null;
    this.isTableInitialized = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(NEON_STORAGE_KEY);
    }
  }

  async testConnection(targetUrl?: string): Promise<{ success: boolean; message: string; sheetCount?: number }> {
    const url = targetUrl || this.databaseUrl;
    if (!url) {
      return { success: false, message: 'Neon Postgres havolasi kiritilmagan.' };
    }

    try {
      const sql = neon(url);
      await this.ensureTables(sql);
      const rows = await sql`SELECT COUNT(*) as count FROM sheetflow_sheets;`;
      const count = Number(rows[0]?.count || 0);
      return {
        success: true,
        message: `Neon Postgresga ulanish faol! Bazada ${count} ta jadval saqlangan.`,
        sheetCount: count,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Ulanib boʻlmadi: ${err.message || 'Xatolik yuz berdi'}`,
      };
    }
  }

  private async ensureTables(client?: any): Promise<void> {
    if (!this.databaseUrl && !client) return;
    try {
      const sql = client || neon(this.databaseUrl!);
      await sql`
        CREATE TABLE IF NOT EXISTS sheetflow_sheets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          url TEXT,
          selected_tab TEXT DEFAULT 'Sheet1',
          row_count INTEGER DEFAULT 0,
          column_count INTEGER DEFAULT 0,
          last_synced_at TEXT,
          columns JSONB DEFAULT '[]'::jsonb,
          headers JSONB DEFAULT '[]'::jsonb,
          rows JSONB DEFAULT '[]'::jsonb,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS sheetflow_saved_analyses (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          connected_sheet_id TEXT NOT NULL,
          sheet_name TEXT,
          sheet_tab TEXT,
          spreadsheet_url TEXT,
          function_id TEXT,
          visualization_type TEXT,
          config JSONB DEFAULT '{}'::jsonb,
          last_result JSONB DEFAULT '{}'::jsonb,
          insights JSONB DEFAULT '[]'::jsonb,
          last_calculated_at TEXT,
          author_email TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      this.isTableInitialized = true;
    } catch (e) {
      console.warn('Neon ensureTables warning:', e);
    }
  }

  async loadSheets(): Promise<SheetData[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const sql = neon(this.databaseUrl!);
      if (!this.isTableInitialized) {
        await this.ensureTables(sql);
      }

      const dbRows = await sql`
        SELECT id, name, url, selected_tab, row_count, column_count, last_synced_at, columns, headers, rows
        FROM sheetflow_sheets
        ORDER BY updated_at DESC;
      `;

      if (!dbRows || dbRows.length === 0) {
        return [];
      }

      return dbRows.map((r: any) => ({
        metadata: {
          id: r.id,
          name: r.name,
          url: r.url || '',
          sheetTabs: [r.selected_tab || 'Sheet1'],
          selectedTab: r.selected_tab || 'Sheet1',
          rowCount: Number(r.row_count || 0),
          columnCount: Number(r.column_count || 0),
          lastSyncedAt: r.last_synced_at || new Date().toISOString(),
          columns: Array.isArray(r.columns) ? r.columns : JSON.parse(r.columns || '[]'),
          userRole: 'editor',
        },
        headers: Array.isArray(r.headers) ? r.headers : JSON.parse(r.headers || '[]'),
        rows: Array.isArray(r.rows) ? r.rows : JSON.parse(r.rows || '[]'),
      }));
    } catch (err) {
      console.error('Failed to load sheets from Neon Postgres:', err);
      return null;
    }
  }

  async saveSheet(sheet: SheetData): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const sql = neon(this.databaseUrl!);
      if (!this.isTableInitialized) {
        await this.ensureTables(sql);
      }

      const columnsJson = JSON.stringify(sheet.metadata.columns || []);
      const headersJson = JSON.stringify(sheet.headers || []);
      const rowsJson = JSON.stringify(sheet.rows || []);

      await sql`
        INSERT INTO sheetflow_sheets (
          id, name, url, selected_tab, row_count, column_count, last_synced_at, columns, headers, rows, updated_at
        ) VALUES (
          ${sheet.metadata.id},
          ${sheet.metadata.name},
          ${sheet.metadata.url || ''},
          ${sheet.metadata.selectedTab || 'Sheet1'},
          ${sheet.rows ? sheet.rows.length : 0},
          ${sheet.metadata.columns ? sheet.metadata.columns.length : 0},
          ${sheet.metadata.lastSyncedAt || new Date().toISOString()},
          ${columnsJson}::jsonb,
          ${headersJson}::jsonb,
          ${rowsJson}::jsonb,
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          url = EXCLUDED.url,
          selected_tab = EXCLUDED.selected_tab,
          row_count = EXCLUDED.row_count,
          column_count = EXCLUDED.column_count,
          last_synced_at = EXCLUDED.last_synced_at,
          columns = EXCLUDED.columns,
          headers = EXCLUDED.headers,
          rows = EXCLUDED.rows,
          updated_at = NOW();
      `;

      return true;
    } catch (err) {
      console.error('Failed to save sheet to Neon Postgres:', err);
      return false;
    }
  }

  async updateSheetName(sheetId: string, newName: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const sql = neon(this.databaseUrl!);
      await sql`
        UPDATE sheetflow_sheets
        SET name = ${newName}, updated_at = NOW()
        WHERE id = ${sheetId};
      `;
      return true;
    } catch (err) {
      console.error('Failed to update sheet name in Neon:', err);
      return false;
    }
  }

  async deleteSheet(sheetId: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const sql = neon(this.databaseUrl!);
      await sql`DELETE FROM sheetflow_sheets WHERE id = ${sheetId};`;
      return true;
    } catch (err) {
      console.error('Failed to delete sheet from Neon Postgres:', err);
      return false;
    }
  }

  async loadSavedAnalyses(): Promise<any[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const sql = neon(this.databaseUrl!);
      if (!this.isTableInitialized) {
        await this.ensureTables(sql);
      }

      const rows = await sql`
        SELECT id, name, connected_sheet_id, sheet_name, sheet_tab, spreadsheet_url,
               function_id, visualization_type, config, last_result, insights,
               last_calculated_at, author_email, created_at, updated_at
        FROM sheetflow_saved_analyses
        ORDER BY updated_at DESC;
      `;

      if (!rows || rows.length === 0) return [];

      return rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        connectedSheetId: r.connected_sheet_id,
        sheetName: r.sheet_name || '',
        sheetTab: r.sheet_tab || 'Sheet1',
        spreadsheetUrl: r.spreadsheet_url || '',
        functionId: r.function_id,
        visualizationType: r.visualization_type,
        config: typeof r.config === 'string' ? JSON.parse(r.config) : r.config || {},
        lastResult: typeof r.last_result === 'string' ? JSON.parse(r.last_result) : r.last_result || null,
        insights: Array.isArray(r.insights) ? r.insights : JSON.parse(r.insights || '[]'),
        lastCalculatedAt: r.last_calculated_at || r.updated_at,
        authorEmail: r.author_email || '',
        createdAt: r.created_at || new Date().toISOString(),
        updatedAt: r.updated_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.error('Failed to load analyses from Neon:', err);
      return null;
    }
  }

  async saveAnalysis(analysis: any): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const sql = neon(this.databaseUrl!);
      if (!this.isTableInitialized) {
        await this.ensureTables(sql);
      }

      const configJson = JSON.stringify(analysis.config || {});
      const resultJson = JSON.stringify(analysis.lastResult || {});
      const insightsJson = JSON.stringify(analysis.insights || []);

      await sql`
        INSERT INTO sheetflow_saved_analyses (
          id, name, connected_sheet_id, sheet_name, sheet_tab, spreadsheet_url,
          function_id, visualization_type, config, last_result, insights,
          last_calculated_at, author_email, updated_at
        ) VALUES (
          ${analysis.id},
          ${analysis.name},
          ${analysis.connectedSheetId},
          ${analysis.sheetName || ''},
          ${analysis.sheetTab || 'Sheet1'},
          ${analysis.spreadsheetUrl || ''},
          ${analysis.functionId || 'summary'},
          ${analysis.visualizationType || 'bar'},
          ${configJson}::jsonb,
          ${resultJson}::jsonb,
          ${insightsJson}::jsonb,
          ${analysis.lastCalculatedAt || new Date().toISOString()},
          ${analysis.authorEmail || ''},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          connected_sheet_id = EXCLUDED.connected_sheet_id,
          sheet_name = EXCLUDED.sheet_name,
          sheet_tab = EXCLUDED.sheet_tab,
          spreadsheet_url = EXCLUDED.spreadsheet_url,
          function_id = EXCLUDED.function_id,
          visualization_type = EXCLUDED.visualization_type,
          config = EXCLUDED.config,
          last_result = EXCLUDED.last_result,
          insights = EXCLUDED.insights,
          last_calculated_at = EXCLUDED.last_calculated_at,
          author_email = EXCLUDED.author_email,
          updated_at = NOW();
      `;
      return true;
    } catch (err) {
      console.error('Failed to save analysis to Neon:', err);
      return false;
    }
  }

  async deleteAnalysis(analysisId: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const sql = neon(this.databaseUrl!);
      await sql`DELETE FROM sheetflow_saved_analyses WHERE id = ${analysisId};`;
      return true;
    } catch (err) {
      console.error('Failed to delete analysis from Neon:', err);
      return false;
    }
  }

  async syncAllToNeon(sheets: SheetData[]): Promise<{ count: number }> {
    if (!this.isConfigured() || sheets.length === 0) return { count: 0 };
    let saved = 0;
    for (const sheet of sheets) {
      const ok = await this.saveSheet(sheet);
      if (ok) saved++;
    }
    return { count: saved };
  }
}

export const neonService = new NeonService();
