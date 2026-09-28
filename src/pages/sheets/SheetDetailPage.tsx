import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api/client';
import { SheetData, DetectedType } from '../../core/types/sheet';
import { SpreadsheetGrid } from '../../components/spreadsheet/SpreadsheetGrid';
import { FunctionBuilderModal } from '../../components/builder/FunctionBuilderModal';
import { useI18n } from '../../lib/i18n';
import {
  FileSpreadsheet,
  LineChart,
  LayoutGrid,
  Calculator,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const SheetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadSheet = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await api.getSheetById(id);
      setSheetData(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSheet();
  }, [id]);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddRow = async (newRow: Record<string, any>) => {
    if (!id) return;
    await api.addRow(id, newRow);
    showNotice(
      lang === 'uz'
        ? 'Qator muvaffaqiyatli qoʻshildi va jadvalga sinxronlandi.'
        : 'Row added successfully and synced to sheet.'
    );
    await loadSheet();
  };

  const handleUpdateRow = async (rowIndex: number, updatedRow: Record<string, any>) => {
    if (!id) return;
    await api.updateRow(id, rowIndex, updatedRow);
    showNotice(
      lang === 'uz'
        ? `#${rowIndex}-qator muvaffaqiyatli yangilandi.`
        : `Row #${rowIndex} updated successfully.`
    );
    await loadSheet();
  };

  const handleDeleteRow = async (rowIndex: number) => {
    if (!id) return;
    await api.deleteRow(id, rowIndex);
    showNotice(
      lang === 'uz'
        ? `#${rowIndex}-qator muvaffaqiyatli oʻchirildi.`
        : `Row #${rowIndex} deleted successfully.`
    );
    await loadSheet();
  };

  const handleUpdateColumnType = (columnName: string, newType: DetectedType) => {
    if (!sheetData) return;
    const updatedCols = sheetData.metadata.columns.map((c) =>
      c.name === columnName ? { ...c, manualTypeOverride: newType } : c
    );
    setSheetData({
      ...sheetData,
      metadata: { ...sheetData.metadata, columns: updatedCols },
    });
    showNotice(
      lang === 'uz'
        ? `"${columnName}" ustun turi "${newType}" ga oʻzgartirildi.`
        : `Column "${columnName}" overridden to "${newType}".`
    );
  };

  const handleManualRefresh = async () => {
    if (!id) return;
    setIsRefreshing(true);
    try {
      await api.refreshSheet(id);
      await loadSheet();
      showNotice(
        lang === 'uz'
          ? 'Jadval Google Sheets orqali yangilandi.'
          : 'Spreadsheet refreshed.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading || !sheetData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-medium">
          {lang === 'uz' ? 'Jadval maʼlumotlari yuklanmoqda...' : 'Loading spreadsheet data...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Notification Toast */}
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
            <span>{lang === 'uz' ? 'Jadvallarimga qaytish' : 'Back to My Sheets'}</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {sheetData.metadata.name}
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
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
              <span>{lang === 'uz' ? 'Google Sheetsda ochish' : 'Open in Google Sheets'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCalcModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>{lang === 'uz' ? 'Hisoblash qoʻshish' : 'Add Calculation'}</span>
          </button>
          <Link
            to={`/analytics?sheetId=${sheetData.metadata.id}`}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition"
          >
            <LineChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('analyzeData')}</span>
          </Link>
          <Link
            to={`/dashboards?sheetId=${sheetData.metadata.id}`}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition"
          >
            <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{lang === 'uz' ? 'Dashboard yaratish' : 'Generate Dashboard'}</span>
          </Link>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition disabled:opacity-40 cursor-pointer"
            title={lang === 'uz' ? 'Google Sheetsdan yangilash' : 'Refresh from Google Sheets'}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Spreadsheet Grid - Preserves exact row data and user column names untouched! */}
      <SpreadsheetGrid
        sheetData={sheetData}
        onAddRow={handleAddRow}
        onUpdateRow={handleUpdateRow}
        onDeleteRow={handleDeleteRow}
        onUpdateColumnType={handleUpdateColumnType}
      />

      {/* Function Builder Modal */}
      <FunctionBuilderModal
        sheetData={sheetData}
        isOpen={isCalcModalOpen}
        onClose={() => setIsCalcModalOpen(false)}
        onSaveCalculation={() => {
          showNotice(lang === 'uz' ? 'Hisoblash muvaffaqiyatli saqlandi!' : 'Calculation saved successfully!');
        }}
      />
    </div>
  );
};
