import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api/client';
import { SheetData, DetectedType, ColumnDefinition } from '../../core/types/sheet';
import { SpreadsheetGrid } from '../../components/spreadsheet/SpreadsheetGrid';
import { AnalysisWorkspace } from '../../components/analysis/AnalysisWorkspace';
import { checkDataQuality } from '../../core/cleaner/dataCleaner';
import { calculate } from '../../core/calculations/engine';
import { SavedAnalysis } from '../../core/types/analysis';
import { useI18n } from '../../lib/i18n';
import {
  FileSpreadsheet,
  Calculator,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Table as TableIcon,
  LayoutDashboard,
  BarChart2,
  Hash,
  Type,
  Calendar,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const SheetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'overview' | 'data' | 'analysis') || 'overview';

  const { t, lang, currency } = useI18n();
  const isUz = lang === 'uz';

  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'analysis'>(initialTab);
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadSheet = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await api.getSheetById(id);
      setSheetData({
        ...data,
        metadata: { ...data.metadata },
        rows: [...data.rows],
      });
      api.trackSheetOpened(id);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSheet();
  }, [id]);

  const handleTabChange = (tab: 'overview' | 'data' | 'analysis') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveToGoogleSheet = async (
    rows: Record<string, any>[],
    columns: ColumnDefinition[]
  ) => {
    if (!id) return;
    const updated = await api.saveSheetChanges(id, rows, columns);
    setSheetData(updated);
    showNotice(
      isUz
        ? '✓ Google Sheets bilan muvaffaqiyatli saqlandi!'
        : '✓ Successfully saved changes to Google Sheet!'
    );
  };

  const handleManualRefresh = async () => {
    if (!id) return;
    setIsRefreshing(true);
    try {
      await api.refreshSheet(id);
      await loadSheet();
      showNotice(
        isUz ? 'Jadval Google Sheets orqali yangilandi.' : 'Spreadsheet refreshed from Google Sheets.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveAnalysis = async (analysis: Partial<SavedAnalysis>) => {
    const saved = await api.saveAnalysis(analysis);
    showNotice(
      isUz ? `✓ "${saved.name}" tahlili saqlandi` : `✓ Saved analysis "${saved.name}"`
    );
    return saved;
  };

  // Overview Data Quality Check & Statistics (Section 7 & 10)
  const qualityReport = useMemo(() => {
    if (!sheetData) return null;
    return checkDataQuality(sheetData.rows, sheetData.metadata.columns);
  }, [sheetData]);

  const columnTypeCounts = useMemo(() => {
    if (!sheetData) return { numeric: 0, text: 0, date: 0, boolean: 0, other: 0 };
    let numeric = 0;
    let text = 0;
    let date = 0;
    let boolean = 0;
    let other = 0;

    sheetData.metadata.columns.forEach((c) => {
      const type = c.manualTypeOverride || c.detectedType;
      if (['number', 'currency', 'percentage'].includes(type)) numeric++;
      else if (['text', 'category'].includes(type)) text++;
      else if (['date', 'datetime'].includes(type)) date++;
      else if (type === 'boolean') boolean++;
      else other++;
    });

    return { numeric, text, date, boolean, other };
  }, [sheetData]);

  // Column deep stats
  const columnStats = useMemo(() => {
    if (!sheetData) return [];
    const stats: {
      name: string;
      type: string;
      total?: number;
      avg?: number;
      min?: number | string;
      max?: number | string;
      uniques?: number;
      topValue?: string;
      topCount?: number;
      dateRange?: string;
    }[] = [];

    sheetData.metadata.columns.forEach((col) => {
      const type = col.manualTypeOverride || col.detectedType;
      const colName = col.name;

      if (['number', 'currency', 'percentage'].includes(type)) {
        try {
          const sumRes = calculate(sheetData.rows, { function: 'SUM', column: colName });
          const avgRes = calculate(sheetData.rows, { function: 'AVERAGE', column: colName });
          const minRes = calculate(sheetData.rows, { function: 'MIN', column: colName });
          const maxRes = calculate(sheetData.rows, { function: 'MAX', column: colName });

          stats.push({
            name: colName,
            type,
            total: typeof sumRes.value === 'number' ? sumRes.value : undefined,
            avg: typeof avgRes.value === 'number' ? Math.round(avgRes.value * 10) / 10 : undefined,
            min: typeof minRes.value === 'number' ? minRes.value : undefined,
            max: typeof maxRes.value === 'number' ? maxRes.value : undefined,
          });
        } catch {}
      } else if (['category', 'text'].includes(type)) {
        const counts: Record<string, number> = {};
        sheetData.rows.forEach((r) => {
          const val = r[colName];
          if (val !== null && val !== undefined && String(val).trim() !== '') {
            const s = String(val).trim();
            counts[s] = (counts[s] || 0) + 1;
          }
        });
        const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        stats.push({
          name: colName,
          type,
          uniques: entries.length,
          topValue: entries[0]?.[0],
          topCount: entries[0]?.[1],
        });
      } else if (['date', 'datetime'].includes(type)) {
        const dates = sheetData.rows
          .map((r) => r[colName])
          .filter((v) => v && !isNaN(Date.parse(String(v))))
          .map((v) => new Date(v).toISOString().substring(0, 10))
          .sort();

        stats.push({
          name: colName,
          type,
          dateRange: dates.length > 0 ? `${dates[0]} → ${dates[dates.length - 1]}` : undefined,
        });
      }
    });

    return stats;
  }, [sheetData]);

  if (isLoading || !sheetData) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-medium">
          {isUz ? 'Jadval maʼlumotlari yuklanmoqda...' : 'Loading spreadsheet workspace...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/30 flex items-center space-x-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/sheets"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isUz ? 'Jadvallarimga qaytish' : 'Back to My Sheets'}</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {sheetData.metadata.name}
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {sheetData.metadata.selectedTab}
            </span>
          </div>
          {sheetData.metadata.url && (
            <a
              href={sheetData.metadata.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-mono"
            >
              <span>{isUz ? 'Google Sheetsda ochish' : 'Open in Google Sheets'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Global Sheet Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title={isUz ? 'Google Sheetsdan yangilash' : 'Refresh from Google Sheets'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
            <span>{isUz ? 'Sinxronlash' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* 3 MAIN TABS NAVIGATION (Section 6: Overview, Data, Analysis) */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => handleTabChange('overview')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>{isUz ? 'Umumiy ma’lumot' : 'Overview'}</span>
        </button>

        <button
          onClick={() => handleTabChange('data')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
            activeTab === 'data'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>{isUz ? 'Ma’lumotlar' : 'Data'}</span>
        </button>

        <button
          onClick={() => handleTabChange('analysis')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
            activeTab === 'analysis'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>{isUz ? 'Tahlil' : 'Analysis'}</span>
        </button>
      </div>

      {/* ================= TAB 1: OVERVIEW (Section 7) ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isUz ? 'Qatorlar soni' : 'Total Rows'}
              </span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {sheetData.rows.length.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isUz ? 'Ustunlar soni' : 'Total Columns'}
              </span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {sheetData.metadata.columns.length}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isUz ? 'Raqamli ustunlar' : 'Numeric Columns'}
              </span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {columnTypeCounts.numeric}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isUz ? 'Sana ustunlari' : 'Date Columns'}
              </span>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                {columnTypeCounts.date}
              </p>
            </div>
          </div>

          {/* Quality Check Card (Section 10) */}
          {qualityReport && (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {qualityReport.isClean ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {qualityReport.isClean
                      ? isUz
                        ? 'Ma’lumotlar sifati: Toza'
                        : 'Data Quality: Clean'
                      : isUz
                      ? 'Ma’lumotlar sifati: Muammolar topildi'
                      : 'Data Quality Check: Issues Found'}
                  </h3>
                </div>

                <button
                  onClick={() => handleTabChange('data')}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>{isUz ? 'Ma’lumotlarda ko‘rish' : 'Inspect in Data Tab'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {!qualityReport.isClean ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {isUz ? 'Bo‘sh kataklar:' : 'Empty Values:'}
                    </span>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {qualityReport.emptyCellsCount}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {isUz ? 'Takroriy qatorlar:' : 'Duplicate Rows:'}
                    </span>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {qualityReport.duplicateRowsCount}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {isUz ? 'Matnli sonlar:' : 'Numbers as Text:'}
                    </span>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {qualityReport.numbersAsTextCount}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {isUz ? 'Yaroqsiz sanalar:' : 'Invalid Dates:'}
                    </span>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {qualityReport.invalidDatesCount}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isUz
                    ? 'Barcha qatorlar va ustunlar to‘liq to‘ldirilgan, formati to‘g‘ri va takrorlanishlar yo‘q.'
                    : 'All cells and formats are verified. No missing values or duplicates detected.'}
                </p>
              )}
            </div>
          )}

          {/* Automatic Column Statistics (Section 7) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isUz ? 'Avtomatik ustun statistikasi' : 'Automatic Column Statistics'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {columnStats.map((col) => (
                <div
                  key={col.name}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {col.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                      {col.type}
                    </span>
                  </div>

                  {col.total !== undefined ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">{isUz ? 'Jami:' : 'Sum:'}</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {col.total.toLocaleString()} {currency}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">{isUz ? 'O‘rtacha:' : 'Average:'}</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {col.avg?.toLocaleString()} {currency}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">{isUz ? 'Min:' : 'Min:'}</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {col.min?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">{isUz ? 'Maks:' : 'Max:'}</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {col.max?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : col.uniques !== undefined ? (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">
                          {isUz ? 'Noyob qiymatlar:' : 'Unique values:'}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{col.uniques}</span>
                      </div>
                      {col.topValue && (
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            {isUz ? 'Eng ko‘p uchragan:' : 'Most common:'}
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[120px]">
                            {col.topValue} ({col.topCount})
                          </span>
                        </div>
                      )}
                    </div>
                  ) : col.dateRange ? (
                    <div className="text-xs">
                      <span className="text-slate-500 dark:text-slate-400">{isUz ? 'Sana oralig‘i:' : 'Date range:'}</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-1 font-mono">
                        {col.dateRange}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">-</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: DATA (Sections 12 - 20) ================= */}
      {activeTab === 'data' && (
        <SpreadsheetGrid
          sheetData={sheetData}
          onSaveToGoogleSheet={handleSaveToGoogleSheet}
          onRefresh={loadSheet}
        />
      )}

      {/* ================= TAB 3: ANALYSIS (Sections 21 - 36) ================= */}
      {activeTab === 'analysis' && (
        <AnalysisWorkspace
          sheetData={sheetData}
          onSaveAnalysis={handleSaveAnalysis}
          onRefreshSheet={loadSheet}
        />
      )}
    </div>
  );
};
