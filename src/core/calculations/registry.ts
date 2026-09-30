import { FunctionDefinition, CalculationHandlerContext, CalculationOutput, CalculationGroupResult } from '../types/calculation';
import { isNullOrEmpty } from '../detector/typeDetector';

/**
 * Helper to extract numeric values from rows for a given column.
 */
function getNumericValues(rows: Record<string, any>[], column?: string): number[] {
  if (!column) return [];
  const numbers: number[] = [];
  for (const row of rows) {
    const val = row[column];
    if (!isNullOrEmpty(val)) {
      const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[\$,€,UZS,so'm,%\s,]/g, ''));
      if (!isNaN(num)) {
        numbers.push(num);
      }
    }
  }
  return numbers;
}

/**
 * Helper to group rows by a column key.
 */
function groupRows(rows: Record<string, any>[], groupKey: string): Map<string, Record<string, any>[]> {
  const groups = new Map<string, Record<string, any>[]>();
  for (const row of rows) {
    const rawVal = row[groupKey];
    const key = isNullOrEmpty(rawVal) ? 'Unknown / Empty' : String(rawVal).trim();
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  }
  return groups;
}

/**
 * Helper to parse a date into standard YYYY-MM-DD or return null.
 */
function parseDateString(val: any): string | null {
  if (isNullOrEmpty(val)) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

/**
 * Helper to parse a date into YYYY-MM or return null.
 */
function parseYearMonthString(val: any): string | null {
  const dateStr = parseDateString(val);
  if (!dateStr) return null;
  return dateStr.substring(0, 7);
}

export const FUNCTION_REGISTRY: Record<string, FunctionDefinition> = {
  // ================= 1. BASIC CALCULATIONS =================
  SUM: {
    id: 'SUM',
    name: 'Sum',
    description: 'Calculates the total sum of numeric values in a column.',
    category: 'Basic',
    requiredInputType: ['number', 'currency', 'percentage'],
    outputType: 'number',
    visualizationCompatibility: ['kpi', 'bar', 'line', 'pie'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      if (ctx.groupBy) {
        const groups = groupRows(ctx.rows, ctx.groupBy);
        const results: CalculationGroupResult[] = [];
        groups.forEach((groupRowsList, groupName) => {
          const nums = getNumericValues(groupRowsList, ctx.column);
          const total = nums.reduce((acc, curr) => acc + curr, 0);
          results.push({
            group: groupName,
            value: Math.round(total * 100) / 100,
            count: nums.length,
          });
        });
        return results.sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
      }
      const nums = getNumericValues(ctx.rows, ctx.column);
      const total = nums.reduce((acc, curr) => acc + curr, 0);
      return Math.round(total * 100) / 100;
    },
  },

  AVERAGE: {
    id: 'AVERAGE',
    name: 'Average',
    description: 'Calculates the arithmetic mean of numeric values in a column.',
    category: 'Basic',
    requiredInputType: ['number', 'currency', 'percentage'],
    outputType: 'number',
    visualizationCompatibility: ['kpi', 'bar', 'line', 'pie'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      if (ctx.groupBy) {
        const groups = groupRows(ctx.rows, ctx.groupBy);
        const results: CalculationGroupResult[] = [];
        groups.forEach((groupRowsList, groupName) => {
          const nums = getNumericValues(groupRowsList, ctx.column);
          const avg = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
          results.push({
            group: groupName,
            value: Math.round(avg * 100) / 100,
            count: nums.length,
          });
        });
        return results.sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
      }
      const nums = getNumericValues(ctx.rows, ctx.column);
      if (nums.length === 0) return 0;
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      return Math.round(avg * 100) / 100;
    },
  },

  MIN: {
    id: 'MIN',
    name: 'Minimum',
    description: 'Finds the smallest value in a numeric or date column.',
    category: 'Basic',
    requiredInputType: ['number', 'currency', 'percentage', 'date'],
    outputType: 'number',
    visualizationCompatibility: ['kpi', 'bar'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      if (ctx.groupBy) {
        const groups = groupRows(ctx.rows, ctx.groupBy);
        const results: CalculationGroupResult[] = [];
        groups.forEach((groupRowsList, groupName) => {
          const nums = getNumericValues(groupRowsList, ctx.column);
          results.push({
            group: groupName,
            value: nums.length > 0 ? Math.min(...nums) : null,
            count: nums.length,
          });
        });
        return results;
      }
      const nums = getNumericValues(ctx.rows, ctx.column);
      return nums.length > 0 ? Math.min(...nums) : 0;
    },
  },

  MAX: {
    id: 'MAX',
    name: 'Maximum',
    description: 'Finds the largest value in a numeric or date column.',
    category: 'Basic',
    requiredInputType: ['number', 'currency', 'percentage', 'date'],
    outputType: 'number',
    visualizationCompatibility: ['kpi', 'bar'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      if (ctx.groupBy) {
        const groups = groupRows(ctx.rows, ctx.groupBy);
        const results: CalculationGroupResult[] = [];
        groups.forEach((groupRowsList, groupName) => {
          const nums = getNumericValues(groupRowsList, ctx.column);
          results.push({
            group: groupName,
            value: nums.length > 0 ? Math.max(...nums) : null,
            count: nums.length,
          });
        });
        return results;
      }
      const nums = getNumericValues(ctx.rows, ctx.column);
      return nums.length > 0 ? Math.max(...nums) : 0;
    },
  },

  COUNT: {
    id: 'COUNT',
    name: 'Count',
    description: 'Counts the total number of records/entries.',
    category: 'Basic',
    requiredInputType: ['text', 'number', 'category', 'date', 'currency'],
    outputType: 'number',
    visualizationCompatibility: ['kpi', 'bar', 'pie'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      if (ctx.groupBy) {
        const groups = groupRows(ctx.rows, ctx.groupBy);
        const results: CalculationGroupResult[] = [];
        groups.forEach((groupRowsList, groupName) => {
          results.push({
            group: groupName,
            value: groupRowsList.length,
            count: groupRowsList.length,
          });
        });
        return results.sort((a, b) => Number(b.value) - Number(a.value));
      }
      if (ctx.column) {
        return ctx.rows.filter((r) => !isNullOrEmpty(r[ctx.column!])).length;
      }
      return ctx.rows.length;
    },
  },

  COUNT_UNIQUE: {
    id: 'COUNT_UNIQUE',
    name: 'Count Unique',
    description: 'Counts the number of distinct unique values in a column.',
    category: 'Basic',
    requiredInputType: ['text', 'category', 'number', 'date'],
    outputType: 'number',
    visualizationCompatibility: ['kpi', 'bar'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      if (!ctx.column) return 0;
      if (ctx.groupBy) {
        const groups = groupRows(ctx.rows, ctx.groupBy);
        const results: CalculationGroupResult[] = [];
        groups.forEach((groupRowsList, groupName) => {
          const set = new Set<string>();
          groupRowsList.forEach((r) => {
            const v = r[ctx.column!];
            if (!isNullOrEmpty(v)) set.add(String(v).trim());
          });
          results.push({
            group: groupName,
            value: set.size,
            count: set.size,
          });
        });
        return results.sort((a, b) => Number(b.value) - Number(a.value));
      }
      const uniques = new Set<string>();
      ctx.rows.forEach((r) => {
        const val = r[ctx.column!];
        if (!isNullOrEmpty(val)) uniques.add(String(val).trim());
      });
      return uniques.size;
    },
  },

  // ================= 2. COMPARISON =================
  COMPARE_CATEGORIES: {
    id: 'COMPARE_CATEGORIES',
    name: 'Compare Categories',
    description: 'Compares total or average values between different categories.',
    category: 'Comparison',
    requiredInputType: ['category', 'text'],
    parameters: [
      { name: 'valueColumn', label: 'Metric / Value Column', type: 'column', required: true },
      { name: 'aggregation', label: 'Calculation Type (Sum or Average)', type: 'string', required: false, defaultValue: 'SUM' },
    ],
    outputType: 'number',
    visualizationCompatibility: ['bar', 'pie', 'donut', 'table'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      const categoryCol = ctx.groupBy || ctx.column;
      const valueCol = ctx.parameters?.valueColumn || ctx.column;
      if (!categoryCol) return [];

      const groups = groupRows(ctx.rows, categoryCol);
      const isAverage = String(ctx.parameters?.aggregation || 'SUM').toUpperCase() === 'AVERAGE';
      const results: CalculationGroupResult[] = [];

      groups.forEach((groupRowsList, groupName) => {
        const nums = getNumericValues(groupRowsList, valueCol);
        let calcVal = 0;
        if (nums.length > 0) {
          const total = nums.reduce((a, b) => a + b, 0);
          calcVal = isAverage ? total / nums.length : total;
        }
        results.push({
          group: groupName,
          value: Math.round(calcVal * 100) / 100,
          count: nums.length,
        });
      });

      return results.sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
    },
  },

  COMPARE_PERIODS: {
    id: 'COMPARE_PERIODS',
    name: 'Compare Periods',
    description: 'Compares metrics between two chronological time periods with percentage variance.',
    category: 'Comparison',
    requiredInputType: ['date', 'datetime'],
    parameters: [
      { name: 'valueColumn', label: 'Value Column', type: 'column', required: true },
      { name: 'dateColumn', label: 'Date Column', type: 'column', required: false },
    ],
    outputType: 'percentage',
    visualizationCompatibility: ['kpi', 'bar'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      const dateCol = ctx.parameters?.dateColumn || ctx.column;
      const valueCol = ctx.parameters?.valueColumn;
      if (!dateCol || !valueCol) return 0;

      // Sort rows by date
      const validRows = ctx.rows
        .filter((r) => !isNullOrEmpty(r[dateCol]))
        .sort((a, b) => new Date(a[dateCol]).getTime() - new Date(b[dateCol]).getTime());

      if (validRows.length < 2) return 0;

      const midIndex = Math.floor(validRows.length / 2);
      const prevHalf = validRows.slice(0, midIndex);
      const currHalf = validRows.slice(midIndex);

      const prevNums = getNumericValues(prevHalf, valueCol);
      const currNums = getNumericValues(currHalf, valueCol);

      const prevTotal = prevNums.reduce((a, b) => a + b, 0);
      const currTotal = currNums.reduce((a, b) => a + b, 0);

      const pctChange = prevTotal > 0 ? Math.round(((currTotal - prevTotal) / prevTotal) * 1000) / 10 : 0;

      const results: CalculationGroupResult[] = [
        {
          group: 'Previous Period',
          value: Math.round(prevTotal * 100) / 100,
          count: prevNums.length,
        },
        {
          group: 'Current Period',
          value: Math.round(currTotal * 100) / 100,
          count: currNums.length,
          formattedValue: `${pctChange >= 0 ? '+' : ''}${pctChange}%`,
        },
      ];

      return results;
    },
  },

  // ================= 3. PERCENTAGE =================
  PERCENTAGE: {
    id: 'PERCENTAGE',
    name: 'Percentage',
    description: 'Calculates the percentage proportion of a category or matching condition.',
    category: 'Percentage',
    requiredInputType: ['number', 'boolean', 'category', 'text'],
    parameters: [
      { name: 'targetValue', label: 'Matching Value / Condition', type: 'value', required: false },
      { name: 'operator', label: 'Comparison Operator', type: 'string', required: false, defaultValue: 'equals' },
    ],
    outputType: 'percentage',
    visualizationCompatibility: ['kpi', 'pie', 'donut', 'bar'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      if (!ctx.column || ctx.rows.length === 0) return 0;
      const target = ctx.parameters?.targetValue;

      if (!target && ctx.groupBy) {
        const groups = groupRows(ctx.rows, ctx.groupBy);
        const totalRows = ctx.rows.length;
        const results: CalculationGroupResult[] = [];
        groups.forEach((groupRowsList, groupName) => {
          const pct = Math.round((groupRowsList.length / totalRows) * 1000) / 10;
          results.push({
            group: groupName,
            value: pct,
            count: groupRowsList.length,
          });
        });
        return results.sort((a, b) => Number(b.value) - Number(a.value));
      }

      const match = (val: any) => {
        if (!target) return !isNullOrEmpty(val);
        return String(val).toLowerCase().trim() === String(target).toLowerCase().trim();
      };

      if (ctx.groupBy) {
        const groups = groupRows(ctx.rows, ctx.groupBy);
        const results: CalculationGroupResult[] = [];
        groups.forEach((groupRowsList, groupName) => {
          const passed = groupRowsList.filter((r) => match(r[ctx.column!])).length;
          const rate = groupRowsList.length > 0 ? (passed / groupRowsList.length) * 100 : 0;
          results.push({
            group: groupName,
            value: Math.round(rate * 10) / 10,
            count: groupRowsList.length,
          });
        });
        return results;
      }

      const passed = ctx.rows.filter((r) => match(r[ctx.column!])).length;
      return Math.round((passed / ctx.rows.length) * 1000) / 10;
    },
  },

  PERCENTAGE_CHANGE: {
    id: 'PERCENTAGE_CHANGE',
    name: 'Percentage Change',
    description: 'Calculates the percentage change over time or between data points: ((Latest - Previous) / Previous) * 100.',
    category: 'Percentage',
    requiredInputType: ['number', 'currency'],
    outputType: 'percentage',
    visualizationCompatibility: ['kpi', 'line'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      const nums = getNumericValues(ctx.rows, ctx.column);
      if (nums.length < 2) return 0;
      const first = nums[0];
      const last = nums[nums.length - 1];
      if (first === 0) return 0;
      return Math.round(((last - first) / Math.abs(first)) * 1000) / 10;
    },
  },

  // ================= 4. TIME ANALYSIS =================
  DAILY_TOTAL: {
    id: 'DAILY_TOTAL',
    name: 'Daily Total',
    description: 'Calculates daily aggregates sorted chronologically.',
    category: 'Time Analysis',
    requiredInputType: ['date', 'datetime'],
    parameters: [
      { name: 'valueColumn', label: 'Metric Column', type: 'column', required: true },
      { name: 'dateColumn', label: 'Date Column', type: 'column', required: false },
    ],
    outputType: 'number',
    visualizationCompatibility: ['line', 'area', 'bar', 'table'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      const dateCol = ctx.parameters?.dateColumn || ctx.column;
      const valCol = ctx.parameters?.valueColumn;
      if (!dateCol) return [];

      const dayGroups = new Map<string, number[]>();

      for (const row of ctx.rows) {
        const rawDate = row[dateCol];
        const dayStr = parseDateString(rawDate);
        if (dayStr) {
          if (!dayGroups.has(dayStr)) dayGroups.set(dayStr, []);
          if (valCol) {
            const num = parseFloat(String(row[valCol]).replace(/[\$,€,UZS,%,\s]/g, ''));
            if (!isNaN(num)) dayGroups.get(dayStr)!.push(num);
          } else {
            dayGroups.get(dayStr)!.push(1);
          }
        }
      }

      const results: CalculationGroupResult[] = [];
      dayGroups.forEach((nums, day) => {
        const total = nums.reduce((a, b) => a + b, 0);
        results.push({
          group: day,
          value: Math.round(total * 100) / 100,
          count: nums.length,
        });
      });

      return results.sort((a, b) => a.group.localeCompare(b.group));
    },
  },

  MONTHLY_TOTAL: {
    id: 'MONTHLY_TOTAL',
    name: 'Monthly Total',
    description: 'Calculates total metrics grouped by month.',
    category: 'Time Analysis',
    requiredInputType: ['date', 'datetime'],
    parameters: [
      { name: 'valueColumn', label: 'Metric Column', type: 'column', required: true },
      { name: 'dateColumn', label: 'Date Column', type: 'column', required: false },
    ],
    outputType: 'number',
    visualizationCompatibility: ['line', 'bar', 'area', 'table'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      const dateCol = ctx.parameters?.dateColumn || ctx.column;
      const valCol = ctx.parameters?.valueColumn;
      if (!dateCol) return [];

      const monthGroups = new Map<string, number[]>();

      for (const row of ctx.rows) {
        const rawDate = row[dateCol];
        const monthStr = parseYearMonthString(rawDate);
        if (monthStr) {
          if (!monthGroups.has(monthStr)) monthGroups.set(monthStr, []);
          if (valCol) {
            const num = parseFloat(String(row[valCol]).replace(/[\$,€,UZS,%,\s]/g, ''));
            if (!isNaN(num)) monthGroups.get(monthStr)!.push(num);
          } else {
            monthGroups.get(monthStr)!.push(1);
          }
        }
      }

      const results: CalculationGroupResult[] = [];
      monthGroups.forEach((nums, month) => {
        const total = nums.reduce((a, b) => a + b, 0);
        results.push({
          group: month,
          value: Math.round(total * 100) / 100,
          count: nums.length,
        });
      });

      return results.sort((a, b) => a.group.localeCompare(b.group));
    },
  },

  YEARLY_TOTAL: {
    id: 'YEARLY_TOTAL',
    name: 'Yearly Total',
    description: 'Calculates total metrics grouped by year.',
    category: 'Time Analysis',
    requiredInputType: ['date', 'datetime'],
    parameters: [
      { name: 'valueColumn', label: 'Metric Column', type: 'column', required: true },
      { name: 'dateColumn', label: 'Date Column', type: 'column', required: false },
    ],
    outputType: 'number',
    visualizationCompatibility: ['bar', 'line', 'table'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      const dateCol = ctx.parameters?.dateColumn || ctx.column;
      const valCol = ctx.parameters?.valueColumn;
      if (!dateCol) return [];

      const yearGroups = new Map<string, number[]>();

      for (const row of ctx.rows) {
        const rawDate = row[dateCol];
        const dateStr = parseDateString(rawDate);
        if (dateStr) {
          const yr = dateStr.substring(0, 4);
          if (!yearGroups.has(yr)) yearGroups.set(yr, []);
          if (valCol) {
            const num = parseFloat(String(row[valCol]).replace(/[\$,€,UZS,%,\s]/g, ''));
            if (!isNaN(num)) yearGroups.get(yr)!.push(num);
          } else {
            yearGroups.get(yr)!.push(1);
          }
        }
      }

      const results: CalculationGroupResult[] = [];
      yearGroups.forEach((nums, yr) => {
        const total = nums.reduce((a, b) => a + b, 0);
        results.push({
          group: yr,
          value: Math.round(total * 100) / 100,
          count: nums.length,
        });
      });

      return results.sort((a, b) => a.group.localeCompare(b.group));
    },
  },

  GROWTH: {
    id: 'GROWTH',
    name: 'Growth',
    description: 'Measures overall percentage growth across chronological time series.',
    category: 'Time Analysis',
    requiredInputType: ['number', 'currency'],
    parameters: [
      { name: 'dateColumn', label: 'Date Column', type: 'column', required: false },
    ],
    outputType: 'percentage',
    visualizationCompatibility: ['kpi', 'line'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      const dateCol = ctx.parameters?.dateColumn;
      let sortedRows = ctx.rows;

      if (dateCol) {
        sortedRows = [...ctx.rows].sort((a, b) => new Date(a[dateCol]).getTime() - new Date(b[dateCol]).getTime());
      }

      const nums = getNumericValues(sortedRows, ctx.column);
      if (nums.length < 2) return 0;
      const first = nums[0];
      const last = nums[nums.length - 1];
      if (first === 0) return 0;
      return Math.round(((last - first) / Math.abs(first)) * 1000) / 10;
    },
  },

  // ================= 5. DATA OPERATIONS =================
  SORT: {
    id: 'SORT',
    name: 'Sort',
    description: 'Sorts rows by the specified column ascending or descending.',
    category: 'Data Operations',
    requiredInputType: ['number', 'text', 'date', 'currency'],
    outputType: 'text',
    visualizationCompatibility: ['table'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      if (!ctx.column) return ctx.rows;
      const direction = ctx.parameters?.direction === 'desc' ? -1 : 1;
      return [...ctx.rows].sort((a, b) => {
        const valA = a[ctx.column!];
        const valB = b[ctx.column!];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        return valA > valB ? direction : -direction;
      });
    },
  },

  FILTER: {
    id: 'FILTER',
    name: 'Filter',
    description: 'Filters records matching specific criteria.',
    category: 'Data Operations',
    requiredInputType: ['text', 'number', 'category', 'date'],
    outputType: 'text',
    visualizationCompatibility: ['table'],
    handler: (ctx: CalculationHandlerContext): CalculationOutput => {
      return ctx.rows;
    },
  },
};
