import { VisualizationType, FilterRule, CalculationResult } from './calculation';

export interface AnalysisConfig {
  functionId: string;
  column?: string;
  categoryColumn?: string;
  dateColumn?: string;
  secondaryColumn?: string;
  groupBy?: string | null;
  filters?: FilterRule[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  parameters?: Record<string, any>;
  visualizationType?: VisualizationType;
  customOptions?: Record<string, any>;
}

export interface SavedAnalysis {
  id: string;
  userId?: string;
  name: string;
  connectedSheetId: string;
  sheetName: string;
  sheetTab: string;
  spreadsheetUrl?: string;
  functionId: string;
  config: AnalysisConfig;
  visualizationType: VisualizationType;
  lastResult?: CalculationResult;
  insights?: string[];
  lastCalculatedAt: string;
  createdAt: string;
  updatedAt: string;
  history?: {
    timestamp: string;
    action: string;
    description: string;
  }[];
}
