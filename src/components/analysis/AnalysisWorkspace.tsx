import React, { useState, useMemo, useEffect } from 'react';
import { SheetData, ColumnDefinition } from '../../core/types/sheet';
import { CalculationRequest, CalculationResult, VisualizationType } from '../../core/types/calculation';
import { FUNCTION_REGISTRY } from '../../core/calculations/registry';
import { getLocalizedFunction } from '../../core/calculations/localizedFunctions';
import { calculate } from '../../core/calculations/engine';
import { SavedAnalysis, AnalysisConfig } from '../../core/types/analysis';
import { generateSmartInsights, SmartInsight } from '../../core/insights/smartInsights';
import { checkDataQuality } from '../../core/cleaner/dataCleaner';
import { useI18n } from '../../lib/i18n';
import {
  Calculator,
  Save,
  RefreshCw,
  Download,
  BarChart3,
  LineChart as LineIcon,
  PieChart as PieIcon,
  Hash,
  Table as TableIcon,
  ScatterChart as ScatterIcon,
  Sparkles,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Clock,
  Printer,
  Copy,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface AnalysisWorkspaceProps {
  sheetData: SheetData;
  initialAnalysis?: SavedAnalysis | null;
  onSaveAnalysis?: (analysis: Partial<SavedAnalysis>) => Promise<SavedAnalysis>;
  onRefreshSheet?: () => Promise<void>;
}

const PALETTE = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#3b82f6', // blue
  '#14b8a6', // teal
];

export const AnalysisWorkspace: React.FC<AnalysisWorkspaceProps> = ({
  sheetData,
  initialAnalysis,
  onSaveAnalysis,
  onRefreshSheet,
}) => {
  const { lang, currency } = useI18n();
  const isUz = lang === 'uz';

  const columns = sheetData.metadata.columns;

  // Filter columns by type
  const numericColumns = useMemo(
    () =>
      columns.filter((c) =>
        ['number', 'currency', 'percentage'].includes(c.manualTypeOverride || c.detectedType)
      ),
    [columns]
  );

  const categoryColumns = useMemo(
    () =>
      columns.filter((c) =>
        ['category', 'text'].includes(c.manualTypeOverride || c.detectedType)
      ),
    [columns]
  );

  const dateColumns = useMemo(
    () =>
      columns.filter((c) =>
        ['date', 'datetime'].includes(c.manualTypeOverride || c.detectedType)
      ),
    [columns]
  );

  // Analysis State
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>(
    initialAnalysis?.config.functionId || 'SUM'
  );
  const [selectedColumn, setSelectedColumn] = useState<string>(
    initialAnalysis?.config.column || numericColumns[0]?.name || columns[0]?.name || ''
  );
  const [categoryColumn, setCategoryColumn] = useState<string>(
    initialAnalysis?.config.categoryColumn ||
      initialAnalysis?.config.groupBy ||
      categoryColumns[0]?.name ||
      ''
  );
  const [dateColumn, setDateColumn] = useState<string>(
    initialAnalysis?.config.dateColumn || dateColumns[0]?.name || ''
  );
  const [secondaryMetricColumn, setSecondaryMetricColumn] = useState<string>(
    initialAnalysis?.config.parameters?.valueColumn || numericColumns[0]?.name || ''
  );
  const [overrideVisualization, setOverrideVisualization] = useState<VisualizationType | null>(
    initialAnalysis?.visualizationType || null
  );

  // Active saved analysis tracking
  const [currentSavedAnalysis, setCurrentSavedAnalysis] = useState<SavedAnalysis | null>(
    initialAnalysis || null
  );

  // Result and Insights
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [lastCalculatedTime, setLastCalculatedTime] = useState<string>(
    initialAnalysis?.lastCalculatedAt || new Date().toISOString()
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaveAsNew, setIsSaveAsNew] = useState(false);
  const [analysisName, setAnalysisName] = useState(initialAnalysis?.name || '');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Automatically determine best visualization (Section 27)
  const autoVisualizationType = useMemo<VisualizationType>(() => {
    if (overrideVisualization) return overrideVisualization;

    const fn = selectedFunctionId;

    if (fn === 'MONTHLY_TOTAL' || fn === 'DAILY_TOTAL' || fn === 'YEARLY_TOTAL') {
      return 'line';
    }
    if (fn === 'COMPARE_CATEGORIES') {
      return 'bar';
    }
    if (fn === 'PERCENTAGE') {
      return 'pie';
    }
    if (fn === 'GROWTH' || fn === 'PERCENTAGE_CHANGE' || fn === 'SUM' || fn === 'AVERAGE' || fn === 'MIN' || fn === 'MAX') {
      if (categoryColumn && fn !== 'GROWTH') {
        return 'bar';
      }
      return 'kpi';
    }
    if (fn === 'SORT' || fn === 'FILTER') {
      return 'table';
    }

    return 'bar';
  }, [selectedFunctionId, categoryColumn, overrideVisualization]);

  // Execute Calculation
  const runCalculation = () => {
    setCalcError(null);
    try {
      const calcReq: CalculationRequest = {
        function: selectedFunctionId,
        column:
          selectedFunctionId === 'COMPARE_CATEGORIES'
            ? categoryColumn || columns[0]?.name
            : selectedFunctionId === 'MONTHLY_TOTAL' || selectedFunctionId === 'DAILY_TOTAL' || selectedFunctionId === 'YEARLY_TOTAL'
            ? dateColumn || columns[0]?.name
            : selectedColumn || columns[0]?.name,
        groupBy: categoryColumn || undefined,
        parameters: {
          valueColumn: secondaryMetricColumn || selectedColumn,
          dateColumn: dateColumn || undefined,
        },
      };

      const res = calculate(sheetData.rows, calcReq);
      setCalculationResult(res);
      setLastCalculatedTime(new Date().toISOString());
    } catch (err: any) {
      setCalcError(err?.message || 'Error executing calculation');
    }
  };

  // Run calculation whenever parameters change or initialAnalysis loads
  useEffect(() => {
    runCalculation();
  }, [
    selectedFunctionId,
    selectedColumn,
    categoryColumn,
    dateColumn,
    secondaryMetricColumn,
    sheetData.rows,
  ]);

  // Smart suggestions (Section 24)
  const smartSuggestions = useMemo(() => {
    const list: {
      id: string;
      label: string;
      functionId: string;
      column?: string;
      categoryCol?: string;
      dateCol?: string;
      valueCol?: string;
    }[] = [];

    const numCol = numericColumns[0]?.name;
    const catCol = categoryColumns[0]?.name;
    const dtCol = dateColumns[0]?.name;

    if (numCol) {
      list.push({
        id: 'sugg_total',
        label: isUz ? `Jami ${numCol}` : `Total ${numCol}`,
        functionId: 'SUM',
        column: numCol,
      });
      list.push({
        id: 'sugg_avg',
        label: isUz ? `O‘rtacha ${numCol}` : `Average ${numCol}`,
        functionId: 'AVERAGE',
        column: numCol,
      });
    }

    if (catCol && numCol) {
      list.push({
        id: 'sugg_by_cat',
        label: isUz ? `${numCol} bo‘yicha ${catCol}` : `${numCol} by ${catCol}`,
        functionId: 'COMPARE_CATEGORIES',
        categoryCol: catCol,
        valueCol: numCol,
      });
    }

    if (dtCol && numCol) {
      list.push({
        id: 'sugg_monthly',
        label: isUz ? `Oylik ${numCol}` : `Monthly ${numCol}`,
        functionId: 'MONTHLY_TOTAL',
        dateCol: dtCol,
        valueCol: numCol,
      });
      list.push({
        id: 'sugg_growth',
        label: isUz ? `${numCol} o‘sishi` : `${numCol} Growth`,
        functionId: 'GROWTH',
        column: numCol,
        dateCol: dtCol,
      });
    }

    if (catCol) {
      list.push({
        id: 'sugg_unique',
        label: isUz ? `Noyob ${catCol} soni` : `Unique ${catCol}`,
        functionId: 'COUNT_UNIQUE',
        column: catCol,
      });
    }

    return list;
  }, [numericColumns, categoryColumns, dateColumns, isUz]);

  const applySuggestion = (sugg: any) => {
    setSelectedFunctionId(sugg.functionId);
    if (sugg.column) setSelectedColumn(sugg.column);
    if (sugg.categoryCol) setCategoryColumn(sugg.categoryCol);
    if (sugg.dateCol) setDateColumn(sugg.dateCol);
    if (sugg.valueCol) setSecondaryMetricColumn(sugg.valueCol);
    setOverrideVisualization(null);
  };

  // Generate Smart Insights (Section 39 & 40)
  const insights = useMemo<SmartInsight[]>(() => {
    if (!calculationResult) return [];
    const report = checkDataQuality(sheetData.rows, sheetData.metadata.columns);
    return generateSmartInsights({
      functionId: selectedFunctionId,
      column: selectedColumn || secondaryMetricColumn,
      groupBy: categoryColumn || dateColumn,
      result: calculationResult.value,
      qualityReport: report,
      language: isUz ? 'uz' : 'en',
      currency,
    });
  }, [calculationResult, selectedFunctionId, selectedColumn, secondaryMetricColumn, categoryColumn, dateColumn, isUz, currency, sheetData]);

  // Chart Data preparation
  const chartData = useMemo(() => {
    if (!calculationResult || !Array.isArray(calculationResult.value)) return [];
    return calculationResult.value.map((item: any) => ({
      name: item.group || 'Item',
      value: typeof item.value === 'number' ? item.value : 0,
      count: item.count || 0,
    }));
  }, [calculationResult]);

  // Refresh analysis with latest sheet data (Section 34)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshSheet) {
        await onRefreshSheet();
      }
      runCalculation();
      setSaveSuccessMessage(isUz ? '✓ Ma’lumotlar yangilandi' : '✓ Analysis refreshed with latest sheet data');
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Save Analysis (Section 30 & 35)
  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveAnalysis) return;

    const analysisToSave: Partial<SavedAnalysis> = {
      id: isSaveAsNew ? undefined : currentSavedAnalysis?.id,
      name: analysisName.trim() || 'Untitled Analysis',
      connectedSheetId: sheetData.metadata.id,
      sheetName: sheetData.metadata.name,
      sheetTab: sheetData.metadata.selectedTab,
      spreadsheetUrl: sheetData.metadata.url,
      functionId: selectedFunctionId,
      visualizationType: autoVisualizationType,
      config: {
        functionId: selectedFunctionId,
        column: selectedColumn,
        categoryColumn,
        dateColumn,
        secondaryColumn: secondaryMetricColumn,
        visualizationType: autoVisualizationType,
      },
      lastResult: calculationResult || undefined,
      insights: insights.map((i) => i.description),
      lastCalculatedAt: new Date().toISOString(),
    };

    const saved = await onSaveAnalysis(analysisToSave);
    setCurrentSavedAnalysis(saved);
    setIsSaveModalOpen(false);
    setSaveSuccessMessage(isUz ? '✓ Tahlil muvaffaqiyatli saqlandi' : '✓ Analysis saved successfully');
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Download Analysis Result as CSV
  const handleDownloadCsv = () => {
    if (!calculationResult) return;
    let csvContent = '';

    if (Array.isArray(calculationResult.value)) {
      csvContent = ['"Category/Group","Value","Count"']
        .concat(
          calculationResult.value.map(
            (item: any) => `"${String(item.group).replace(/"/g, '""')}",${item.value},${item.count || 0}`
          )
        )
        .join('\n');
    } else {
      csvContent = `"Metric","Result"\n"${selectedFunctionId} (${selectedColumn || 'Sheet'})",${calculationResult.value}`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(analysisName || 'analysis').replace(/\s+/g, '_')}_result.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{label}</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold">
            {new Intl.NumberFormat('en-US').format(payload[0].value)} {currency}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* SUCCESS TOAST */}
      {saveSuccessMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* WORKSPACE TOP HEADER (Section 31 & 34) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>{currentSavedAnalysis?.name || analysisName || (isUz ? 'Yangi tahlil' : 'Interactive Analysis')}</span>
              {currentSavedAnalysis && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {isUz ? 'Saqlangan' : 'Saved'}
                </span>
              )}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2 mt-0.5">
              <span>{sheetData.metadata.name}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>
                  {isUz ? 'Oxirgi hisoblash:' : 'Last calculated:'}{' '}
                  {new Date(lastCalculatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Analysis Button (Section 34) */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isUz ? 'Yangilash' : 'Refresh Analysis'}</span>
          </button>

          {/* Export Report / CSV (Section 43) */}
          <button
            onClick={handleDownloadCsv}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isUz ? 'CSV yuklash' : 'Export CSV'}</span>
          </button>

          {/* Save Analysis / Save Changes (Section 30 & 35) */}
          {currentSavedAnalysis ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsSaveAsNew(false);
                  setIsSaveModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isUz ? 'O‘zgarishlarni saqlash' : 'Save Changes'}</span>
              </button>
              <button
                onClick={() => {
                  setIsSaveAsNew(true);
                  setAnalysisName(`${currentSavedAnalysis.name} (Copy)`);
                  setIsSaveModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isUz ? 'Nusxa sifatida' : 'Save as New'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsSaveAsNew(false);
                setIsSaveModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isUz ? 'Tahlilni saqlash' : 'Save Analysis'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SMART RECOMMENDATIONS CHIPS (Section 24) */}
      {smartSuggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>{isUz ? 'Tavsiya etilgan tahlillar (1 bosishda hisoblash):' : 'Recommended analyses (1-click calculate):'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {smartSuggestions.map((sugg) => (
              <button
                key={sugg.id}
                onClick={() => applySuggestion(sugg)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-emerald-500/10 dark:bg-slate-800 dark:hover:bg-emerald-500/10 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/40 transition cursor-pointer flex items-center space-x-1.5"
              >
                <span>{sugg.label}</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* WORKSPACE MAIN GRID: CONFIG (LEFT) & RESULTS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= CONFIGURATION PANEL (LEFT 4 COLS) ================= */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isUz ? '1. Funksiyani tanlang' : '1. Choose Function'}
            </h3>

            {/* Function Select Dropdown */}
            <select
              value={selectedFunctionId}
              onChange={(e) => {
                setSelectedFunctionId(e.target.value);
                setOverrideVisualization(null);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
            >
              <optgroup label={isUz ? 'Asosiy hisob-kitoblar' : 'Basic Calculations'}>
                <option value="SUM">Sum (Yig‘indi)</option>
                <option value="AVERAGE">Average (O‘rtacha)</option>
                <option value="MIN">Minimum (Eng kichik)</option>
                <option value="MAX">Maximum (Eng katta)</option>
                <option value="COUNT">Count (Qatorlar soni)</option>
                <option value="COUNT_UNIQUE">Count Unique (Noyob qiymatlar)</option>
              </optgroup>
              <optgroup label={isUz ? 'Taqqoslash' : 'Comparison'}>
                <option value="COMPARE_CATEGORIES">Compare Categories (Kategoriyalarni solishtirish)</option>
                <option value="COMPARE_PERIODS">Compare Periods (Davrlarni solishtirish)</option>
              </optgroup>
              <optgroup label={isUz ? 'Foiz hisob-kitoblari' : 'Percentage'}>
                <option value="PERCENTAGE">Percentage (Foiz ulushi)</option>
                <option value="PERCENTAGE_CHANGE">Percentage Change (Foiz o‘zgarishi)</option>
              </optgroup>
              <optgroup label={isUz ? 'Vaqt bo‘yicha tahlil' : 'Time Analysis'}>
                <option value="DAILY_TOTAL">Daily Total (Kunlik yig‘indi)</option>
                <option value="MONTHLY_TOTAL">Monthly Total (Oylik yig‘indi)</option>
                <option value="YEARLY_TOTAL">Yearly Total (Yillik yig‘indi)</option>
                <option value="GROWTH">Growth (O‘sish sur’ati)</option>
              </optgroup>
              <optgroup label={isUz ? 'Ma’lumotlar amallari' : 'Data Operations'}>
                <option value="SORT">Sort (Tartiblash)</option>
                <option value="FILTER">Filter (Filtr)</option>
              </optgroup>
            </select>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {getLocalizedFunction(selectedFunctionId, isUz ? 'uz' : 'en').description}
            </p>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isUz ? '2. Ustun(lar)ni tanlang' : '2. Choose Column(s)'}
              </h3>

              {/* Context-aware column inputs (Section 25) */}
              {selectedFunctionId === 'COMPARE_CATEGORIES' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isUz ? 'Kategoriya ustuni:' : 'Category column:'}
                    </label>
                    <select
                      value={categoryColumn}
                      onChange={(e) => setCategoryColumn(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      {columns.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.detectedType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isUz ? 'Hisoblanadigan qiymat ustuni:' : 'Metric / Value column:'}
                    </label>
                    <select
                      value={secondaryMetricColumn}
                      onChange={(e) => setSecondaryMetricColumn(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      {numericColumns.length > 0
                        ? numericColumns.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))
                        : columns.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                    </select>
                  </div>
                </>
              ) : selectedFunctionId === 'MONTHLY_TOTAL' ||
                selectedFunctionId === 'DAILY_TOTAL' ||
                selectedFunctionId === 'YEARLY_TOTAL' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isUz ? 'Sana ustuni:' : 'Date column:'}
                    </label>
                    <select
                      value={dateColumn}
                      onChange={(e) => setDateColumn(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      {dateColumns.length > 0
                        ? dateColumns.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))
                        : columns.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isUz ? 'Qiymat ustuni:' : 'Value column:'}
                    </label>
                    <select
                      value={secondaryMetricColumn}
                      onChange={(e) => setSecondaryMetricColumn(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      {numericColumns.length > 0
                        ? numericColumns.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))
                        : columns.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isUz ? 'Ustun:' : 'Column:'}
                    </label>
                    <select
                      value={selectedColumn}
                      onChange={(e) => setSelectedColumn(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      {columns.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.detectedType})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Optional grouping */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isUz ? 'Guruhlash (ixtiyoriy):' : 'Group by (optional):'}
                    </label>
                    <select
                      value={categoryColumn}
                      onChange={(e) => setCategoryColumn(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="">{isUz ? 'Guruhlanmasin' : 'None'}</option>
                      {columns.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Visualization Switcher (Section 28) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isUz ? 'Vizualizatsiya turi' : 'Visualization Type'}
              </h3>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'kpi', label: 'KPI', icon: Hash },
                  { id: 'bar', label: 'Bar', icon: BarChart3 },
                  { id: 'line', label: 'Line', icon: LineIcon },
                  { id: 'pie', label: 'Pie', icon: PieIcon },
                  { id: 'donut', label: 'Donut', icon: PieIcon },
                  { id: 'table', label: 'Table', icon: TableIcon },
                ].map((vis) => {
                  const Icon = vis.icon;
                  const isSelected = autoVisualizationType === vis.id;
                  return (
                    <button
                      key={vis.id}
                      onClick={() => setOverrideVisualization(vis.id as VisualizationType)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span>{vis.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RESULTS & VISUALIZATION (RIGHT 8 COLS) ================= */}
        <div className="lg:col-span-8 space-y-6">
          {calcError ? (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
              <p className="font-bold">{isUz ? 'Hisoblash xatosi:' : 'Calculation error:'}</p>
              <p className="mt-1">{calcError}</p>
            </div>
          ) : !calculationResult ? (
            <div className="p-12 text-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
              {isUz ? 'Hisob-kitob bajarilmoqda...' : 'Calculating...'}
            </div>
          ) : (
            <>
              {/* PRIMARY VISUALIZATION CARD (Section 27 & 28) */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isUz ? 'Natija va vizualizatsiya' : 'Calculation Result & Chart'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {sheetData.rows.length} {isUz ? 'ta qator bo‘yicha hisoblandi' : 'rows evaluated'}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {autoVisualizationType.toUpperCase()}
                  </span>
                </div>

                {/* Render Based on Visualization Type */}
                <div className="min-h-[260px] flex items-center justify-center">
                  {autoVisualizationType === 'kpi' && (
                    <div className="text-center py-8 space-y-2">
                      <div className="text-5xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                        {typeof calculationResult.value === 'number'
                          ? calculationResult.value.toLocaleString()
                          : String(calculationResult.value)}{' '}
                        {currency}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {selectedFunctionId} • {selectedColumn || 'Active Sheet'}
                      </div>
                    </div>
                  )}

                  {autoVisualizationType === 'bar' && (
                    <div className="h-72 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {autoVisualizationType === 'line' && (
                    <div className="h-72 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#10b981' }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {(autoVisualizationType === 'pie' || autoVisualizationType === 'donut') && (
                    <div className="h-72 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={autoVisualizationType === 'donut' ? 60 : 0}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {chartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(val) => <span className="text-xs text-slate-700 dark:text-slate-300">{val}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {autoVisualizationType === 'table' && (
                    <div className="w-full overflow-x-auto max-h-72 scrollbar-thin">
                      <table className="w-full text-left text-xs font-mono border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-950 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-4 font-semibold border-b border-slate-200 dark:border-slate-800">
                              {categoryColumn || 'Group'}
                            </th>
                            <th className="py-2.5 px-4 font-semibold border-b border-slate-200 dark:border-slate-800 text-right">
                              {secondaryMetricColumn || selectedColumn || 'Value'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                          {chartData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-2 px-4 font-medium">{item.name}</td>
                              <td className="py-2 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                {item.value.toLocaleString()} {currency}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* SMART INSIGHTS PANEL (Section 39, 40, 41) */}
              {insights.length > 0 && (
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {isUz ? 'Avtomatik xulosalar va tushunchalar (Smart Insights)' : 'Smart Insights'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {insights.map((ins) => (
                      <div
                        key={ins.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1"
                      >
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {ins.type === 'trend_up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                          {ins.type === 'trend_down' && <TrendingDown className="w-4 h-4 text-rose-500" />}
                          {ins.type === 'highest' && <Sparkles className="w-4 h-4 text-amber-500" />}
                          {ins.type === 'lowest' && <Info className="w-4 h-4 text-blue-500" />}
                          <span>{ins.title}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{ins.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ================= MODAL: SAVE ANALYSIS (Section 30 & 35) ================= */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Save className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>
                  {isSaveAsNew
                    ? isUz
                      ? 'Yangi tahlil sifatida saqlash'
                      : 'Save as New Analysis'
                    : isUz
                    ? 'Tahlilni saqlash'
                    : 'Save Analysis'}
                </span>
              </h3>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isUz ? 'Tahlil nomi:' : 'Analysis name:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isUz ? 'Masalan: Oylik Daromad' : 'e.g., Monthly Revenue, Score by City'}
                  value={analysisName}
                  onChange={(e) => setAnalysisName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p>
                  <strong>{isUz ? 'Bog‘langan Sheet:' : 'Connected Sheet:'}</strong> {sheetData.metadata.name}
                </p>
                <p>
                  <strong>{isUz ? 'Funksiya:' : 'Function:'}</strong> {selectedFunctionId}
                </p>
                <p>
                  <strong>{isUz ? 'Vizualizatsiya:' : 'Visualization:'}</strong> {autoVisualizationType}
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {isUz ? 'Bekor qilish' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  {isUz ? 'Saqlash' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
