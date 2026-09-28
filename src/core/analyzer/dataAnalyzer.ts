import { SheetData, ColumnDefinition } from '../types/sheet';
import { calculate } from '../calculations/engine';
import { isNullOrEmpty } from '../detector/typeDetector';

export interface ColumnStats {
  column: string;
  type: string;
  nullCount: number;
  uniqueCount: number;
  min?: number | string;
  max?: number | string;
  avg?: number;
  sum?: number;
  topValues?: { value: string; count: number }[];
}

export interface SuggestedAnalytic {
  id: string;
  title: string;
  description: string;
  chartType: 'kpi' | 'bar' | 'line' | 'pie' | 'donut' | 'table';
  calculation: {
    function: string;
    column?: string;
    groupBy?: string;
    parameters?: Record<string, any>;
  };
  sampleResult?: any;
}

export interface SheetAnalysisReport {
  sheetName: string;
  totalRecords: number;
  totalColumns: number;
  totalMissingValues: number;
  totalDuplicateRecords: number;
  columnsStats: ColumnStats[];
  primaryNumericColumn?: string;
  primaryCategoryColumn?: string;
  primaryDateColumn?: string;
  suggestedAnalytics: SuggestedAnalytic[];
}

/**
 * Analyzes a full dataset, extracts deep statistics and automatically generates actionable analytics recommendations.
 */
export function analyzeSheet(sheetData: SheetData): SheetAnalysisReport {
  const rows = sheetData.rows;
  const cols = sheetData.metadata.columns;
  const totalRecords = rows.length;
  const totalColumns = cols.length;

  let totalMissing = 0;
  const columnsStats: ColumnStats[] = [];

  let primaryNumericColumn: string | undefined;
  let primaryCategoryColumn: string | undefined;
  let primaryDateColumn: string | undefined;

  cols.forEach((col) => {
    const colName = col.name;
    const type = col.manualTypeOverride || col.detectedType;
    let nullCount = 0;
    const valueMap: Record<string, number> = {};

    rows.forEach((r) => {
      const val = r[colName];
      if (isNullOrEmpty(val)) {
        nullCount++;
      } else {
        const str = String(val).trim();
        valueMap[str] = (valueMap[str] || 0) + 1;
      }
    });

    totalMissing += nullCount;
    const uniqueCount = Object.keys(valueMap).length;

    // Top values by frequency
    const topValues = Object.entries(valueMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));

    const stats: ColumnStats = {
      column: colName,
      type,
      nullCount,
      uniqueCount,
      topValues,
    };

    if (['number', 'currency', 'percentage'].includes(type)) {
      if (!primaryNumericColumn) primaryNumericColumn = colName;
      try {
        stats.min = calculate(rows, { function: 'MIN', column: colName }).value as number;
        stats.max = calculate(rows, { function: 'MAX', column: colName }).value as number;
        stats.avg = calculate(rows, { function: 'AVERAGE', column: colName }).value as number;
        stats.sum = calculate(rows, { function: 'SUM', column: colName }).value as number;
      } catch (err) {
        // Safe fallback
      }
    } else if (type === 'category' || (type === 'text' && uniqueCount <= 20)) {
      if (!primaryCategoryColumn) primaryCategoryColumn = colName;
    } else if (type === 'date' || type === 'datetime') {
      if (!primaryDateColumn) primaryDateColumn = colName;
    }

    columnsStats.push(stats);
  });

  // Calculate duplicate records across all columns
  const rowSignatures = new Set<string>();
  let duplicateCount = 0;
  rows.forEach((r) => {
    const sig = JSON.stringify(r);
    if (rowSignatures.has(sig)) {
      duplicateCount++;
    } else {
      rowSignatures.add(sig);
    }
  });

  // Generate Suggested Analytics
  const suggestedAnalytics: SuggestedAnalytic[] = [];

  // 1. Total records KPI
  suggestedAnalytics.push({
    id: 'sugg_total_records',
    title: 'Total Records',
    description: `Total count of active rows in ${sheetData.metadata.name}`,
    chartType: 'kpi',
    calculation: {
      function: 'COUNT',
    },
  });

  // 2. Primary numeric metric KPI
  if (primaryNumericColumn) {
    suggestedAnalytics.push({
      id: `sugg_avg_${primaryNumericColumn}`,
      title: `Average ${primaryNumericColumn}`,
      description: `Mean value calculated across all ${totalRecords} entries`,
      chartType: 'kpi',
      calculation: {
        function: 'AVERAGE',
        column: primaryNumericColumn,
      },
    });

    suggestedAnalytics.push({
      id: `sugg_max_${primaryNumericColumn}`,
      title: `Peak ${primaryNumericColumn}`,
      description: `Highest recorded ${primaryNumericColumn}`,
      chartType: 'kpi',
      calculation: {
        function: 'MAX',
        column: primaryNumericColumn,
      },
    });
  }

  // 3. Category distribution (Bar or Donut chart)
  if (primaryCategoryColumn) {
    suggestedAnalytics.push({
      id: `sugg_dist_${primaryCategoryColumn}`,
      title: `Distribution by ${primaryCategoryColumn}`,
      description: `Count of entries categorized by ${primaryCategoryColumn}`,
      chartType: 'donut',
      calculation: {
        function: 'COUNT',
        groupBy: primaryCategoryColumn,
      },
    });

    // 4. Numeric metric by Category (Bar chart)
    if (primaryNumericColumn) {
      suggestedAnalytics.push({
        id: `sugg_${primaryNumericColumn}_by_${primaryCategoryColumn}`,
        title: `Average ${primaryNumericColumn} by ${primaryCategoryColumn}`,
        description: `Comparative breakdown of ${primaryNumericColumn} across ${primaryCategoryColumn} groups`,
        chartType: 'bar',
        calculation: {
          function: 'AVERAGE',
          column: primaryNumericColumn,
          groupBy: primaryCategoryColumn,
        },
      });
    }
  }

  // 5. Date trend (Line chart)
  if (primaryDateColumn && primaryNumericColumn) {
    suggestedAnalytics.push({
      id: `sugg_trend_${primaryNumericColumn}`,
      title: `${primaryNumericColumn} Over Time`,
      description: `Timeline progression grouped by date`,
      chartType: 'line',
      calculation: {
        function: 'GROUP_BY_MONTH',
        column: primaryDateColumn,
        parameters: { metricColumn: primaryNumericColumn },
      },
    });
  }

  // 6. Top ranking items table
  if (primaryNumericColumn) {
    suggestedAnalytics.push({
      id: `sugg_top_${primaryNumericColumn}`,
      title: `Top Records by ${primaryNumericColumn}`,
      description: `Records sorted from highest to lowest ${primaryNumericColumn}`,
      chartType: 'table',
      calculation: {
        function: 'SORT',
        column: primaryNumericColumn,
        parameters: { direction: 'desc' },
      },
    });
  }

  return {
    sheetName: sheetData.metadata.name,
    totalRecords,
    totalColumns,
    totalMissingValues: totalMissing,
    totalDuplicateRecords: duplicateCount,
    columnsStats,
    primaryNumericColumn,
    primaryCategoryColumn,
    primaryDateColumn,
    suggestedAnalytics,
  };
}
