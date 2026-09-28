import { SheetData } from '../types/sheet';
import { DashboardConfig, DashboardWidget } from '../types/dashboard';
import { analyzeSheet } from '../analyzer/dataAnalyzer';

/**
 * Automatically creates a tailored, multi-widget dashboard for any given sheet based on its detected data structure.
 */
export function generateDashboard(
  sheetData: SheetData,
  dashboardName?: string
): DashboardConfig {
  const analysis = analyzeSheet(sheetData);
  const widgets: DashboardWidget[] = [];
  const sheetId = sheetData.metadata.id;
  const sheetTitle = sheetData.metadata.name;

  // 1. Primary KPI: Total Records / Volume
  widgets.push({
    id: `widget_kpi_total_${Date.now()}`,
    title: 'Total Records',
    subtitle: 'Active entries in dataset',
    type: 'kpi',
    size: 'sm',
    calculation: {
      function: 'COUNT',
      connectedSheetId: sheetId,
    },
    customOptions: {
      color: '#10b981', // emerald
    },
  });

  // 2. Primary KPI: Average of main numeric column
  if (analysis.primaryNumericColumn) {
    widgets.push({
      id: `widget_kpi_avg_${Date.now()}`,
      title: `Average ${analysis.primaryNumericColumn}`,
      subtitle: `Overall mean across entries`,
      type: 'kpi',
      size: 'sm',
      calculation: {
        function: 'AVERAGE',
        column: analysis.primaryNumericColumn,
        connectedSheetId: sheetId,
      },
      customOptions: {
        color: '#6366f1', // indigo
      },
    });

    widgets.push({
      id: `widget_kpi_peak_${Date.now()}`,
      title: `Peak ${analysis.primaryNumericColumn}`,
      subtitle: 'Highest value recorded',
      type: 'kpi',
      size: 'sm',
      calculation: {
        function: 'MAX',
        column: analysis.primaryNumericColumn,
        connectedSheetId: sheetId,
      },
      customOptions: {
        color: '#06b6d4', // cyan
      },
    });
  }

  // 3. Secondary KPI: Check for percentage, pass rate, or distinct categories
  const percentageCol = sheetData.metadata.columns.find((c) => c.detectedType === 'percentage');
  const booleanCol = sheetData.metadata.columns.find((c) => c.detectedType === 'boolean');

  if (booleanCol) {
    widgets.push({
      id: `widget_kpi_rate_${Date.now()}`,
      title: `${booleanCol.name} Rate`,
      subtitle: 'Positive completion percentage',
      type: 'kpi',
      size: 'sm',
      calculation: {
        function: 'PERCENTAGE',
        column: booleanCol.name,
        parameters: { targetValue: 'Yes', operator: 'equals' },
        connectedSheetId: sheetId,
      },
      customOptions: {
        color: '#f59e0b', // amber
      },
    });
  } else if (percentageCol) {
    widgets.push({
      id: `widget_kpi_pct_${Date.now()}`,
      title: `Average ${percentageCol.name}`,
      subtitle: 'Aggregated percentage',
      type: 'kpi',
      size: 'sm',
      calculation: {
        function: 'AVERAGE',
        column: percentageCol.name,
        connectedSheetId: sheetId,
      },
      customOptions: {
        color: '#f59e0b',
      },
    });
  } else if (analysis.primaryCategoryColumn) {
    widgets.push({
      id: `widget_kpi_uniques_${Date.now()}`,
      title: `Total ${analysis.primaryCategoryColumn} Groups`,
      subtitle: 'Distinct category segments',
      type: 'kpi',
      size: 'sm',
      calculation: {
        function: 'UNIQUE',
        column: analysis.primaryCategoryColumn,
        connectedSheetId: sheetId,
      },
      customOptions: {
        color: '#ec4899', // pink
      },
    });
  }

  // 4. Bar Chart: Breakdown by category
  if (analysis.primaryCategoryColumn) {
    if (analysis.primaryNumericColumn) {
      widgets.push({
        id: `widget_bar_num_cat_${Date.now()}`,
        title: `${analysis.primaryNumericColumn} by ${analysis.primaryCategoryColumn}`,
        subtitle: `Comparison of average performance across groups`,
        type: 'bar',
        size: 'md',
        calculation: {
          function: 'AVERAGE',
          column: analysis.primaryNumericColumn,
          groupBy: analysis.primaryCategoryColumn,
          connectedSheetId: sheetId,
        },
        customOptions: {
          showGrid: true,
          color: '#6366f1',
        },
      });
    }

    // 5. Donut Chart: Categorical Volume Distribution
    widgets.push({
      id: `widget_donut_cat_${Date.now()}`,
      title: `Volume by ${analysis.primaryCategoryColumn}`,
      subtitle: `Distribution share`,
      type: 'donut',
      size: 'md',
      calculation: {
        function: 'COUNT',
        groupBy: analysis.primaryCategoryColumn,
        connectedSheetId: sheetId,
      },
      customOptions: {
        showLegend: true,
      },
    });
  }

  // 6. Line Chart: Trend over time if Date column exists
  if (analysis.primaryDateColumn && analysis.primaryNumericColumn) {
    widgets.push({
      id: `widget_line_trend_${Date.now()}`,
      title: `${analysis.primaryNumericColumn} Monthly Timeline`,
      subtitle: 'Historical performance trend',
      type: 'line',
      size: 'lg',
      calculation: {
        function: 'GROUP_BY_MONTH',
        column: analysis.primaryDateColumn,
        parameters: { metricColumn: analysis.primaryNumericColumn },
        connectedSheetId: sheetId,
      },
      customOptions: {
        showGrid: true,
        color: '#10b981',
      },
    });
  }

  // 7. Table: Top 10 Records
  widgets.push({
    id: `widget_table_top_${Date.now()}`,
    title: analysis.primaryNumericColumn ? `Top Entries by ${analysis.primaryNumericColumn}` : 'Top Records',
    subtitle: 'High priority spreadsheet rows',
    type: 'table',
    size: 'full',
    calculation: {
      function: 'SORT',
      column: analysis.primaryNumericColumn || sheetData.metadata.columns[0]?.name,
      parameters: { direction: 'desc' },
      connectedSheetId: sheetId,
    },
  });

  return {
    id: `dash_${Date.now()}`,
    name: dashboardName || `${sheetTitle} Analytics`,
    description: `Auto-generated executive dashboard for ${sheetTitle}`,
    connectedSheetId: sheetId,
    sheetName: sheetTitle,
    widgets,
    layout: 'grid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
