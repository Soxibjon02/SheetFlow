import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api/client';
import { SheetData } from '../../core/types/sheet';
import { SheetAnalysisReport, analyzeSheet } from '../../core/analyzer/dataAnalyzer';
import { getFunctionName } from '../../core/calculations/localizedFunctions';
import { useI18n } from '../../lib/i18n';
import {
  LineChart,
  Sparkles,
  Database,
  Layers,
  AlertTriangle,
  Copy,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Table as TableIcon,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t, lang } = useI18n();

  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [analysis, setAnalysis] = useState<SheetAnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load sheets list
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const list = await api.getSheets();
        setSheets(list);
        const querySheetId = searchParams.get('sheetId');
        const activeId = querySheetId || list[0]?.id;
        if (activeId) {
          setSelectedSheetId(activeId);
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [searchParams]);

  // Load sheet data and run analysis
  useEffect(() => {
    if (!selectedSheetId) return;
    const runAnalysis = async () => {
      setIsLoading(true);
      try {
        const data = await api.getSheetById(selectedSheetId);
        setSheetData(data);
        const rep = analyzeSheet(data);
        setAnalysis(rep);
      } finally {
        setIsLoading(false);
      }
    };
    runAnalysis();
  }, [selectedSheetId]);

  if (isLoading || !analysis) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-medium">
          {lang === 'uz' ? 'Maʼlumotlar chuqur tahlil qilinmoqda...' : 'Running deep data analysis...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {lang === 'uz'
                ? 'Avtomatlashtirilgan Maʼlumotlar Tahlili Dvigateli'
                : 'Automated Data Detection & Analysis Engine'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('analytics')} &amp; {lang === 'uz' ? 'Tahliliy Xulosalar' : 'Insights'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'uz'
              ? 'Ustunlar profili, anomaliyalarni aniqlash, statistik qonuniyatlar va aqlli takliflar'
              : 'Automated column profiling, anomaly detection, statistical discovery, and smart suggestions'}
          </p>
        </div>

        {/* Sheet Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'uz' ? 'Jadval:' : 'Sheet:'}
          </span>
          <select
            value={selectedSheetId}
            onChange={(e) => setSelectedSheetId(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          >
            {sheets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Basic Statistics Summary (Section 15) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md space-y-1 shadow-sm">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            {t('totalRecords')}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{analysis.totalRecords}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>{lang === 'uz' ? '100% yuklandi' : '100% Ingested'}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md space-y-1 shadow-sm">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            {t('totalColumns')}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{analysis.totalColumns}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === 'uz' ? 'Aniqlangan va indekslangan' : 'Typed & Indexed'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md space-y-1 shadow-sm">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            {t('missingValues')}
          </p>
          <p
            className={`text-2xl font-bold font-mono ${
              analysis.totalMissingValues > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {analysis.totalMissingValues}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === 'uz' ? 'Boʻsh kataklar soni' : 'Empty cells found'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md space-y-1 shadow-sm">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            {t('duplicateRecords')}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{analysis.totalDuplicateRecords}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === 'uz' ? 'Aynan bir xil qatorlar' : 'Exact duplicate rows'}
          </p>
        </div>

        {analysis.primaryNumericColumn && (
          <>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md space-y-1 shadow-sm">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider truncate">
                {lang === 'uz' ? `Oʻrtacha (${analysis.primaryNumericColumn})` : `Avg ${analysis.primaryNumericColumn}`}
              </p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {analysis.columnsStats.find((c) => c.column === analysis.primaryNumericColumn)?.avg || '-'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'uz' ? 'Oʻrtacha arifmetik' : 'Mean metric'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md space-y-1 shadow-sm">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider truncate">
                {lang === 'uz' ? `Eng yuqori (${analysis.primaryNumericColumn})` : `Peak ${analysis.primaryNumericColumn}`}
              </p>
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                {analysis.columnsStats.find((c) => c.column === analysis.primaryNumericColumn)?.max || '-'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'uz' ? 'Eng katta qiymat' : 'Highest value'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Suggested Analytics Section (Section 15) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('suggestedAnalytics')}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'uz'
                ? 'Jadval maʼlumotlari asosida tizim tomonidan avtomatik kashf qilingan tahliliy parametrlar'
                : 'Discovered patterns and high-value metrics automatically compiled for this spreadsheet'}
            </p>
          </div>
          <Link
            to={`/dashboards?sheetId=${selectedSheetId}`}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:opacity-90 transition cursor-pointer"
          >
            <span>{lang === 'uz' ? 'Toʻliq Dashboard yaratish' : 'Generate Full Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis.suggestedAnalytics.map((sugg) => (
            <div
              key={sugg.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-md space-y-3 hover:border-emerald-500/40 transition group flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {sugg.chartType}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    {getFunctionName(sugg.calculation.function, lang)}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition">
                  {sugg.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{sugg.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {sugg.calculation.column ? `col: ${sugg.calculation.column}` : (lang === 'uz' ? 'barcha maʼlumot' : 'all data')}
                  {sugg.calculation.groupBy ? ` • by ${sugg.calculation.groupBy}` : ''}
                </span>
                <Link
                  to={`/dashboards?sheetId=${selectedSheetId}`}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center space-x-1"
                >
                  <span>{lang === 'uz' ? 'Grafikda koʻrish' : 'Visualize'}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Column Schema & Data Distribution Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-md p-6 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          {lang === 'uz' ? 'Aniqlangan Ustunlar Taqsimoti va Xususiyatlari' : 'Detected Column Breakdown & Cardinality'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">{lang === 'uz' ? 'Ustun Nomi' : 'Column Name'}</th>
                <th className="py-2.5 px-3">{lang === 'uz' ? 'Aniqlangan Tur' : 'Detected Type'}</th>
                <th className="py-2.5 px-3">{lang === 'uz' ? 'Noyob Qiymatlar' : 'Unique Values'}</th>
                <th className="py-2.5 px-3">{lang === 'uz' ? 'Boʻsh Kataklar' : 'Missing Values'}</th>
                <th className="py-2.5 px-3">{lang === 'uz' ? 'Asosiy Qiymatlar / Diapazon' : 'Top Values / Range'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
              {analysis.columnsStats.map((col) => (
                <tr key={col.column} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white font-sans">{col.column}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-700">
                      {col.type}
                    </span>
                  </td>
                  <td className="py-3 px-3">{col.uniqueCount}</td>
                  <td className="py-3 px-3">
                    <span className={col.nullCount > 0 ? 'text-amber-500 font-bold' : 'text-slate-400'}>
                      {col.nullCount}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                    {col.min !== undefined && col.max !== undefined
                      ? `[${col.min} ... ${col.max}]`
                      : col.topValues
                      ? col.topValues.map((tv: any) => (typeof tv === 'object' ? tv.value : tv)).join(', ')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
