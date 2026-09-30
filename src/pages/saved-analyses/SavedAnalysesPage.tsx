import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api/client';
import { SavedAnalysis } from '../../core/types/analysis';
import { SheetData } from '../../core/types/sheet';
import { AnalysisWorkspace } from '../../components/analysis/AnalysisWorkspace';
import { useI18n } from '../../lib/i18n';
import {
  BookmarkCheck,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Search,
  Clock,
  Trash2,
  ExternalLink,
  RefreshCw,
  BarChart3,
  LineChart as LineIcon,
  PieChart as PieIcon,
  Hash,
  Table as TableIcon,
  X,
  CheckCircle2,
} from 'lucide-react';

export const SavedAnalysesPage: React.FC = () => {
  const { lang, t, currency } = useI18n();
  const isUz = lang === 'uz';
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAnalysis, setActiveAnalysis] = useState<SavedAnalysis | null>(null);
  const [activeSheetData, setActiveSheetData] = useState<SheetData | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadSavedAnalyses = async () => {
    setIsLoading(true);
    try {
      const list = await api.getSavedAnalyses();
      setAnalyses(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedAnalyses();
  }, []);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(isUz ? `"${name}" tahlilini o‘chirishni xohlaysizmi?` : `Delete saved analysis "${name}"?`)) {
      await api.deleteAnalysis(id);
      if (activeAnalysis?.id === id) {
        setActiveAnalysis(null);
        setActiveSheetData(null);
      }
      showNotice(isUz ? `✓ "${name}" o‘chirildi` : `✓ Deleted analysis "${name}"`);
      await loadSavedAnalyses();
    }
  };

  const handleOpenWorkspace = async (analysis: SavedAnalysis) => {
    setLoadingWorkspace(true);
    try {
      api.trackAnalysisOpened(analysis.id);
      const sheet = await api.getSheetById(analysis.connectedSheetId);
      setActiveSheetData(sheet);
      setActiveAnalysis(analysis);
    } catch (err: any) {
      // Fallback: if sheet not found by id, fetch all sheets
      const allSheets = await api.getSheets();
      if (allSheets.length > 0) {
        const fallback = await api.getSheetById(allSheets[0].id);
        setActiveSheetData(fallback);
        setActiveAnalysis(analysis);
      } else {
        alert(isUz ? 'Bog‘langan jadval topilmadi.' : 'Connected sheet not found.');
      }
    } finally {
      setLoadingWorkspace(false);
    }
  };

  const handleSaveAnalysisWorkspace = async (updated: Partial<SavedAnalysis>) => {
    const res = await api.saveAnalysis(updated);
    setActiveAnalysis(res);
    showNotice(isUz ? '✓ Tahlil saqlandi' : '✓ Analysis saved successfully');
    await loadSavedAnalyses();
    return res;
  };

  const filteredAnalyses = analyses.filter((a) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.sheetName.toLowerCase().includes(q) ||
      a.functionId.toLowerCase().includes(q)
    );
  });

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);

      if (mins < 1) return isUz ? 'Hozirgina' : 'Just now';
      if (mins < 60) return isUz ? `${mins} daqiqa oldin` : `${mins} min ago`;
      if (hours < 24) return isUz ? `${hours} soat oldin` : `${hours} hours ago`;
      if (days === 1) return isUz ? 'Kecha' : 'Yesterday';
      return isUz ? `${days} kun oldin` : `${days} days ago`;
    } catch {
      return '';
    }
  };

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return BarChart3;
      case 'line':
        return LineIcon;
      case 'pie':
      case 'donut':
        return PieIcon;
      case 'table':
        return TableIcon;
      default:
        return Hash;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/30 flex items-center space-x-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>{isUz ? 'Saqlangan tahlillar' : 'Saved Analyses'}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('savedAnalyses')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isUz
              ? 'Tahlillarni qayta oching, yangi ma’lumotlar bilan hisoblang va davom ettiring.'
              : 'Reopen, refresh with new sheet rows, modify calculations, and continue working.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isUz ? 'Tahlillarni qidirish...' : 'Search analyses...'}
            className="w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* ACTIVE WORKSPACE MODAL / DRAWER (Section 33: Continue Analysis) */}
      {activeAnalysis && activeSheetData && (
        <div className="p-6 rounded-3xl border-2 border-emerald-500/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isUz ? 'Faol tahlil ish maydoni:' : 'Active Reusable Workspace:'}{' '}
                <span className="text-emerald-600 dark:text-emerald-400">{activeAnalysis.name}</span>
              </h2>
            </div>
            <button
              onClick={() => {
                setActiveAnalysis(null);
                setActiveSheetData(null);
              }}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              title="Close Workspace"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <AnalysisWorkspace
            sheetData={activeSheetData}
            initialAnalysis={activeAnalysis}
            onSaveAnalysis={handleSaveAnalysisWorkspace}
            onRefreshSheet={async () => {
              const fresh = await api.refreshSheet(activeSheetData.metadata.id);
              setActiveSheetData(fresh);
            }}
          />
        </div>
      )}

      {/* SAVED ANALYSES CARD GRID (Section 32) */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm font-medium">
            {isUz ? 'Saqlangan tahlillar yuklanmoqda...' : 'Loading saved analyses...'}
          </p>
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
            <BookmarkCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isUz ? 'Saqlangan tahlillar yo‘q' : 'No saved analyses yet'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isUz
                ? 'Jadvalingizni oching, Tahlil bo‘limida hisob-kitob qiling va uni saqlang.'
                : 'Open any sheet, perform a calculation in the Analysis tab, and click Save Analysis.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/sheets"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{t('mySheets')}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAnalyses.map((analysis) => {
            const Icon = getVisualizationIcon(analysis.visualizationType);
            const isCurrentlyActive = activeAnalysis?.id === analysis.id;

            return (
              <div
                key={analysis.id}
                className={`p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col justify-between hover:shadow-md ${
                  isCurrentlyActive
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                          {analysis.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                          {analysis.sheetName}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(analysis.id, analysis.name)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title={isUz ? 'O‘chirish' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Function & Metric details */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {analysis.functionId}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {analysis.visualizationType.toUpperCase()}
                    </span>
                    {analysis.config.column && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {analysis.config.column}
                      </span>
                    )}
                  </div>

                  {/* Insights preview */}
                  {analysis.insights && analysis.insights.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <div className="flex items-center space-x-1 font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span>{isUz ? 'Xulosa:' : 'Insight:'}</span>
                      </div>
                      <p className="line-clamp-2">{analysis.insights[0]}</p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(analysis.updatedAt)}</span>
                  </span>

                  <button
                    onClick={() => handleOpenWorkspace(analysis)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-500/10 dark:bg-slate-800 dark:hover:bg-emerald-500/10 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold text-xs border border-slate-200 dark:border-slate-700 hover:border-emerald-500/30 transition cursor-pointer"
                  >
                    <span>{isUz ? 'Ochish va davom etish' : 'Open & Continue'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
