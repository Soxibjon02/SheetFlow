export type DetectedType = 
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'currency'
  | 'percentage'
  | 'category'
  | 'unknown';

export interface ColumnDefinition {
  id: string;
  name: string;
  index: number;
  detectedType: DetectedType;
  manualTypeOverride?: DetectedType;
  nullable: boolean;
  sampleValues: (string | number | boolean | null)[];
  uniqueCount?: number;
  nullCount?: number;
}

export type SheetRow = Record<string, any>;

export interface SheetMetadata {
  id: string;
  name: string;
  url?: string;
  sheetTabs: string[];
  selectedTab: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnDefinition[];
  lastSyncedAt?: string;
  userRole?: 'owner' | 'editor' | 'viewer';
}

export interface SheetData {
  metadata: SheetMetadata;
  rows: SheetRow[];
  headers: string[];
}

export interface SheetPreviewResult {
  spreadsheetId: string;
  spreadsheetName: string;
  spreadsheetUrl: string;
  availableTabs: string[];
  selectedTab: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnDefinition[];
  sampleRows: SheetRow[];
  allRows?: SheetRow[];
  isPublic: boolean;
  canEdit: boolean;
}
