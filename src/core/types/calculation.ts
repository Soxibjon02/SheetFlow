import { DetectedType } from './sheet';

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'between';

export interface FilterRule {
  id?: string;
  column: string;
  operator: FilterOperator;
  value?: any;
  valueTo?: any; // For 'between'
}

export interface FilterGroup {
  id?: string;
  logic: 'AND' | 'OR' | 'NOT';
  conditions: (FilterRule | FilterGroup)[];
}

export type FunctionCategory =
  | 'Basic'
  | 'Conditional'
  | 'Data'
  | 'Date'
  | 'Text'
  | 'Percentage'
  | 'Accounting'
  | 'Economy';

export type VisualizationType =
  | 'kpi'
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'table';

export interface FunctionParameter {
  name: string;
  label: string;
  type: 'column' | 'value' | 'number' | 'string' | 'boolean' | 'condition';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface CalculationHandlerContext {
  rows: Record<string, any>[];
  column?: string;
  groupBy?: string | null;
  filters?: FilterGroup | FilterRule[];
  parameters?: Record<string, any>;
}

export interface CalculationGroupResult {
  group: string;
  value: number | string | boolean | null;
  formattedValue?: string;
  count?: number;
}

export type CalculationOutput =
  | number
  | string
  | boolean
  | null
  | CalculationGroupResult[]
  | Record<string, any>[]
  | (string | number | boolean | null)[];


export interface FunctionDefinition {
  id: string;
  name: string;
  description: string;
  category: FunctionCategory;
  requiredInputType: DetectedType[];
  parameters?: FunctionParameter[];
  outputType: DetectedType;
  visualizationCompatibility: VisualizationType[];
  handler: (context: CalculationHandlerContext) => CalculationOutput;
}

export interface CalculationRequest {
  id?: string;
  function: string;
  column?: string;
  groupBy?: string | null;
  filters?: FilterGroup | FilterRule[];
  parameters?: Record<string, any>;
  connectedSheetId?: string;
}

export interface CalculationResult {
  function: string;
  column?: string;
  groupBy?: string | null;
  value: CalculationOutput;
  formattedValue?: string;
  timestamp: string;
  executionTimeMs?: number;
  rowCountEvaluated: number;
}
