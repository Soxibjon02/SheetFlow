import {
  CalculationRequest,
  CalculationResult,
  CalculationOutput,
} from '../types/calculation';
import { FUNCTION_REGISTRY } from './registry';
import { applyFilters } from '../filter/filterEngine';

export interface CalculationEngineOptions {
  rows: Record<string, any>[];
  request: CalculationRequest;
}

export function formatResultValue(value: CalculationOutput, functionName: string): string {
  if (value === null || value === undefined) return '-';
  if (Array.isArray(value)) {
    return `${value.length} groups calculated`;
  }
  if (typeof value === 'number') {
    if (functionName.includes('PERCENTAGE') || functionName === 'MISSING_VALUES') {
      return `${value}%`;
    }
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(value);
  }
  return String(value);
}

/**
 * Executes a calculation request against structured rows using the Function Registry.
 */
export function calculate(
  rows: Record<string, any>[],
  request: CalculationRequest
): CalculationResult {
  const startTime = performance.now();
  const fnDef = FUNCTION_REGISTRY[request.function.toUpperCase()];

  if (!fnDef) {
    throw new Error(
      `Calculation function "${request.function}" is not recognized in FUNCTION_REGISTRY.`
    );
  }

  // 1. Apply any filters
  const filteredRows = applyFilters(rows, request.filters);

  // 2. Execute calculation handler
  const rawValue = fnDef.handler({
    rows: filteredRows,
    column: request.column,
    groupBy: request.groupBy,
    filters: request.filters,
    parameters: request.parameters,
  });

  const duration = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    function: fnDef.id,
    column: request.column,
    groupBy: request.groupBy,
    value: rawValue,
    formattedValue: formatResultValue(rawValue, fnDef.id),
    timestamp: new Date().toISOString(),
    executionTimeMs: duration,
    rowCountEvaluated: filteredRows.length,
  };
}

/**
 * Returns list of all available functions metadata for UI rendering.
 */
export function getAvailableFunctions() {
  return Object.values(FUNCTION_REGISTRY).map((fn) => ({
    id: fn.id,
    name: fn.name,
    description: fn.description,
    category: fn.category,
    requiredInputType: fn.requiredInputType,
    outputType: fn.outputType,
    parameters: fn.parameters,
    visualizationCompatibility: fn.visualizationCompatibility,
  }));
}
