import { VisualizationType, CalculationRequest } from './calculation';

export interface DashboardWidget {
  id: string;
  title: string;
  subtitle?: string;
  type: VisualizationType;
  calculation: CalculationRequest;
  size?: 'sm' | 'md' | 'lg' | 'full';
  colorScheme?: string;
  customOptions?: {
    showLegend?: boolean;
    showGrid?: boolean;
    stacked?: boolean;
    unit?: string;
    precision?: number;
    color?: string;
  };
}

export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  connectedSheetId: string;
  sheetName?: string;
  widgets: DashboardWidget[];
  layout?: 'grid' | 'column';
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  category: 'Education' | 'Business' | 'Personal' | 'Project Management';
  description: string;
  iconName: string;
  expectedColumns: {
    name: string;
    type: string;
    description: string;
  }[];
  sampleDataUrl?: string;
  sampleDataRows?: Record<string, any>[];
  suggestedWidgets: DashboardWidget[];
}

export interface ReportDefinition {
  id: string;
  name: string;
  connectedSheetId: string;
  sheetName: string;
  generatedAt: string;
  summaryMetrics: {
    label: string;
    value: string | number;
    change?: string;
  }[];
  widgets: DashboardWidget[];
  tables: {
    title: string;
    headers: string[];
    rows: (string | number)[][];
  }[];
}
