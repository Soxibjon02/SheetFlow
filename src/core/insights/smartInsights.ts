import { CalculationOutput, CalculationGroupResult } from '../types/calculation';
import { DataQualityReport } from '../types/cleaner';

export interface SmartInsight {
  id: string;
  type: 'trend_up' | 'trend_down' | 'highest' | 'lowest' | 'quality' | 'summary' | 'distribution';
  title: string;
  description: string;
  metric?: string | number;
}

export interface InsightContext {
  functionId: string;
  column?: string;
  groupBy?: string;
  result: CalculationOutput;
  qualityReport?: DataQualityReport;
  language?: 'en' | 'uz';
  currency?: string;
}

export function generateSmartInsights(ctx: InsightContext): SmartInsight[] {
  const { functionId, column, groupBy, result, qualityReport, language = 'en', currency = '' } = ctx;
  const isUz = language === 'uz';
  const insights: SmartInsight[] = [];

  const formatNum = (n: number | null | undefined): string => {
    if (n === null || n === undefined || isNaN(Number(n))) return '0';
    return Number(n).toLocaleString();
  };

  // 1. Grouped Results Insights (Highest category, Lowest category, Distribution, Trends)
  if (Array.isArray(result) && result.length > 0) {
    const validGroups = result.filter((g) => typeof g === 'object' && g !== null && 'group' in g && 'value' in g) as CalculationGroupResult[];

    if (validGroups.length > 0) {
      // Sort numeric values
      const numericGroups = validGroups
        .filter((g) => g.value !== null && !isNaN(Number(g.value)))
        .map((g) => ({ group: String(g.group), value: Number(g.value) }));

      if (numericGroups.length > 0) {
        // Highest Category / Period
        const highest = numericGroups.reduce((max, curr) => (curr.value > max.value ? curr : max), numericGroups[0]);
        // Lowest Category / Period
        const lowest = numericGroups.reduce((min, curr) => (curr.value < min.value ? curr : min), numericGroups[0]);
        // Total
        const total = numericGroups.reduce((sum, curr) => sum + curr.value, 0);

        // Highest
        insights.push({
          id: 'insight_highest',
          type: 'highest',
          title: isUz ? 'Eng yuqori ko‘rsatkich' : 'Highest Performer',
          description: isUz
            ? `Eng katta natijani "${highest.group}" ko‘rsatdi: ${formatNum(highest.value)} ${currency}`.trim()
            : `"${highest.group}" recorded the highest ${column || 'value'} with ${formatNum(highest.value)} ${currency}`.trim(),
          metric: highest.value,
        });

        // Lowest (if more than 1 group and not equal to highest)
        if (numericGroups.length > 1 && lowest.group !== highest.group) {
          insights.push({
            id: 'insight_lowest',
            type: 'lowest',
            title: isUz ? 'Eng past ko‘rsatkich' : 'Lowest Performer',
            description: isUz
              ? `Eng past natija "${lowest.group}" hisobiga to‘g‘ri keldi: ${formatNum(lowest.value)} ${currency}`.trim()
              : `"${lowest.group}" recorded the lowest ${column || 'value'} with ${formatNum(lowest.value)} ${currency}`.trim(),
            metric: lowest.value,
          });
        }

        // Top category share / distribution
        if (total > 0 && numericGroups.length > 1) {
          const topShare = Math.round((highest.value / total) * 100);
          insights.push({
            id: 'insight_share',
            type: 'distribution',
            title: isUz ? 'Ulush taqsimoti' : 'Distribution Share',
            description: isUz
              ? `"${highest.group}" umumiy ${column || 'qiymat'}ning ${topShare}% qismini tashkil etadi.`
              : `"${highest.group}" accounts for ${topShare}% of the total ${column || 'sum'}.`,
            metric: `${topShare}%`,
          });
        }

        // Chronological trend (if Time Analysis function or Compare Periods)
        if (
          functionId === 'MONTHLY_TOTAL' ||
          functionId === 'DAILY_TOTAL' ||
          functionId === 'YEARLY_TOTAL' ||
          functionId === 'COMPARE_PERIODS'
        ) {
          if (numericGroups.length >= 2) {
            const first = numericGroups[0].value;
            const last = numericGroups[numericGroups.length - 1].value;
            if (first > 0) {
              const changePct = Math.round(((last - first) / first) * 1000) / 10;
              const isUp = changePct >= 0;
              insights.push({
                id: 'insight_period_trend',
                type: isUp ? 'trend_up' : 'trend_down',
                title: isUz ? 'Davriy o‘zgarish trendi' : 'Period Trend',
                description: isUz
                  ? isUp
                    ? `${column || 'Qiymat'} davr davomida +${changePct}% ga oshdi.`
                    : `${column || 'Qiymat'} davr davomida ${changePct}% ga kamaydi.`
                  : isUp
                    ? `${column || 'Metric'} increased by +${changePct}% over the tracked period.`
                    : `${column || 'Metric'} decreased by ${changePct}% over the tracked period.`,
                metric: `${isUp ? '+' : ''}${changePct}%`,
              });
            }
          }
        }
      }
    }
  }

  // 2. Single Numeric / Percentage Results (GROWTH, PERCENTAGE_CHANGE, SUM, AVERAGE, COUNT)
  if (typeof result === 'number') {
    if (functionId === 'GROWTH' || functionId === 'PERCENTAGE_CHANGE') {
      const isUp = result >= 0;
      insights.push({
        id: 'insight_growth',
        type: isUp ? 'trend_up' : 'trend_down',
        title: isUz ? 'O‘sish sur’ati' : 'Growth Rate',
        description: isUz
          ? isUp
            ? `${column || 'Ko‘rsatkich'} ${result}% ga ijobiy o‘sdi.`
            : `${column || 'Ko‘rsatkich'} ${result}% ga pasaydi.`
          : isUp
            ? `${column || 'Metric'} grew by +${result}%.`
            : `${column || 'Metric'} declined by ${result}%.`,
        metric: `${result >= 0 ? '+' : ''}${result}%`,
      });
    } else if (functionId === 'SUM') {
      insights.push({
        id: 'insight_sum',
        type: 'summary',
        title: isUz ? 'Umumiy summa' : 'Aggregate Total',
        description: isUz
          ? `Barcha qatorlar bo‘yicha jami: ${formatNum(result)} ${currency}`.trim()
          : `Total across all records is ${formatNum(result)} ${currency}`.trim(),
        metric: result,
      });
    } else if (functionId === 'AVERAGE') {
      insights.push({
        id: 'insight_avg',
        type: 'summary',
        title: isUz ? 'O‘rtacha ko‘rsatkich' : 'Average Value',
        description: isUz
          ? `O‘rtacha ko‘rsatkich ${formatNum(result)} ${currency} ni tashkil etadi.`
          : `The average value is ${formatNum(result)} ${currency}`.trim(),
        metric: result,
      });
    }
  }

  // 3. Data Quality Insights (Missing values, Duplicates)
  if (qualityReport) {
    if (qualityReport.duplicateRowsCount > 0) {
      insights.push({
        id: 'insight_duplicates',
        type: 'quality',
        title: isUz ? 'Takroriy qatorlar' : 'Duplicate Data',
        description: isUz
          ? `${qualityReport.duplicateRowsCount} ta takroriy qator aniqlandi.`
          : `${qualityReport.duplicateRowsCount} duplicate rows were detected in this sheet.`,
        metric: qualityReport.duplicateRowsCount,
      });
    }

    if (qualityReport.emptyCellsCount > 0) {
      insights.push({
        id: 'insight_empty_cells',
        type: 'quality',
        title: isUz ? 'Yetishmayotgan qiymatlar' : 'Missing Data',
        description: isUz
          ? `Jami ${qualityReport.emptyCellsCount} ta katakchada ma’lumot to‘ldirilmagan.`
          : `${qualityReport.emptyCellsCount} empty values were found across columns.`,
        metric: qualityReport.emptyCellsCount,
      });
    }
  }

  return insights;
}
