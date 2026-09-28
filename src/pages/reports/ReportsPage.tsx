import React, { useState, useEffect } from 'react';
import { api } from '../../services/api/client';
import { SheetData } from '../../core/types/sheet';
import { calculate } from '../../core/calculations/engine';
import { useI18n } from '../../lib/i18n';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { t, lang } = useI18n();
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const list = await api.getSheets();
        setSheets(list);
        if (list[0]?.id) setSelectedSheetId(list[0].id);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedSheetId) return;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const data = await api.getSheetById(selectedSheetId);
        setSheetData(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [selectedSheetId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    if (!sheetData) return;
    const headers = sheetData.metadata.columns.map((c) => c.name);
    const rows = sheetData.rows.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${sheetData.metadata.name}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute key executive metrics
  const numericCol = sheetData?.metadata.columns.find((c) =>
    ['number', 'currency'].includes(c.detectedType)
  )?.name;
  const categoryCol = sheetData?.metadata.columns.find((c) =>
    c.detectedType === 'category'
  )?.name;

  const totalCount = sheetData ? sheetData.rows.length : 0;
  const avgMetric = sheetData && numericCol
    ? calculate(sheetData.rows, { function: 'AVERAGE', column: numericCol }).formattedValue
    : '-';
  const peakMetric = sheetData && numericCol
    ? calculate(sheetData.rows, { function: 'MAX', column: numericCol }).formattedValue
    : '-';

  const groupBreakdown = sheetData && numericCol && categoryCol
    ? (calculate(sheetData.rows, {
        function: 'AVERAGE',
        column: numericCol,
        groupBy: categoryCol,
      }).value as any[])
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('reports')} {lang === 'uz' ? 'Generatori' : 'Generator'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'uz'
              ? 'Jadval maʼlumotlari asosida chop etish va eksport qilish uchun qisqacha hisobot yaratish'
              : 'Generate printable, exportable executive summary reports from spreadsheet analytics'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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

          <button
            onClick={handleDownloadCsv}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'uz' ? 'CSV yuklab olish' : 'Export CSV'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'uz' ? 'Chop etish / PDF saqlash' : 'Print / Save PDF'}</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      {sheetData && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 backdrop-blur-md p-8 md:p-12 space-y-8 shadow-sm print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
          {/* Document Header */}
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-6 print:border-gray-300">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white print:text-black">
                  SheetFlow
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 print:border-gray-400 print:text-black">
                  {lang === 'uz' ? 'RAHBARIYAT XULOSASI' : 'EXECUTIVE SUMMARY'}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white print:text-black">
                {sheetData.metadata.name.toUpperCase()} {lang === 'uz' ? 'HISOBOTI' : 'REPORT'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 print:text-gray-600">
                {lang === 'uz' ? 'Maʼlumot manbasi: ' : 'Data Source: '}
                {sheetData.metadata.url || (lang === 'uz' ? 'Ichki Maʼlumotlar Toʻplami' : 'Internal Dataset')} •{' '}
                {lang === 'uz' ? 'Varaq: ' : 'Tab: '} {sheetData.metadata.selectedTab}
              </p>
            </div>

            <div className="text-right text-xs text-slate-500 dark:text-slate-400 print:text-gray-600 space-y-0.5">
              <div className="flex items-center space-x-1 justify-end">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date().toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'en-US')}</span>
              </div>
              <p>{lang === 'uz' ? 'SheetFlow dvigateli orqali shakllantirildi' : 'Generated via SheetFlow Engine'}</p>
            </div>
          </div>

          {/* Key Executive KPI Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 print:border-gray-300 print:bg-gray-50 space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider print:text-gray-600">
                {lang === 'uz' ? 'Tahlil Qilingan Yozuvlar' : 'Total Evaluated Records'}
              </span>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono print:text-black">
                {totalCount}
              </p>
            </div>

            {numericCol && (
              <>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 print:border-gray-300 print:bg-gray-50 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider print:text-gray-600 truncate">
                    {lang === 'uz' ? `Oʻrtacha (${numericCol})` : `Average ${numericCol}`}
                  </span>
                  <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono print:text-black">
                    {avgMetric}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 print:border-gray-300 print:bg-gray-50 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider print:text-gray-600 truncate">
                    {lang === 'uz' ? `Eng Yuqori (${numericCol})` : `Peak ${numericCol}`}
                  </span>
                  <p className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 font-mono print:text-black">
                    {peakMetric}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Group Performance Breakdown */}
          {groupBreakdown.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black uppercase tracking-wider">
                {lang === 'uz'
                  ? `${categoryCol} boʻyicha taqsimot koʻrsatkichlari`
                  : `Performance Breakdown by ${categoryCol}`}
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 print:border-gray-300 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 print:bg-gray-100 text-slate-600 dark:text-slate-400 print:text-gray-700 font-semibold border-b border-slate-200 dark:border-slate-800 print:border-gray-300">
                    <tr>
                      <th className="py-2.5 px-4">{categoryCol}</th>
                      <th className="py-2.5 px-4">
                        {lang === 'uz' ? `Oʻrtacha ${numericCol}` : `Average ${numericCol}`}
                      </th>
                      <th className="py-2.5 px-4">{lang === 'uz' ? 'Yozuvlar soni' : 'Records Count'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-gray-200 font-mono text-slate-700 dark:text-slate-300 print:text-black">
                    {groupBreakdown.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 print:hover:bg-transparent">
                        <td className="py-2.5 px-4 font-semibold font-sans">{item.group}</td>
                        <td className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 print:text-black">
                          {new Intl.NumberFormat(lang === 'uz' ? 'uz-UZ' : 'en-US', {
                            maximumFractionDigits: 2,
                          }).format(item.value)}
                        </td>
                        <td className="py-2.5 px-4">{item.count || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sample Raw Snapshot Table */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800 print:border-gray-300">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black uppercase tracking-wider">
              {lang === 'uz' ? 'Maʼlumotlar Jadvali Namunasi (Birinchi 8 qator)' : 'Sample Records Snapshot (First 8 Rows)'}
            </h3>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 print:border-gray-300 rounded-xl">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="bg-slate-50 dark:bg-slate-950 print:bg-gray-100 text-slate-600 dark:text-slate-400 print:text-gray-700 font-semibold border-b border-slate-200 dark:border-slate-800 print:border-gray-300">
                  <tr>
                    {sheetData.metadata.columns.map((c) => (
                      <th key={c.id} className="py-2 px-3">
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-gray-200 text-slate-700 dark:text-slate-300 print:text-black">
                  {sheetData.rows.slice(0, 8).map((row, i) => (
                    <tr key={i}>
                      {sheetData.metadata.columns.map((c) => (
                        <td key={c.id} className="py-2 px-3 truncate max-w-[160px]">
                          {String(row[c.name] ?? '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
