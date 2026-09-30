import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api/client';
import { useI18n } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { ConnectSheetModal } from '../../components/sheets/ConnectSheetModal';
import { SavedAnalysis } from '../../core/types/analysis';
import {
  FileSpreadsheet,
  Plus,
  Sparkles,
  ArrowRight,
  Database,
  Calculator,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  BarChart3,
  LineChart as LineIcon,
  PieChart as PieIcon,
  Hash,
  ExternalLink,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isUz = lang === 'uz';

  const [recentSheets, setRecentSheets] = useState<any[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<SavedAnalysis[]>([]);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sheets, analyses] = await Promise.all([
        api.getRecentSheets(),
        api.getRecentAnalyses(),
      ]);
      setRecentSheets(sheets);
      setRecentAnalyses(analyses);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return isUz ? 'Yaqinda' : 'Recently';
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
      return isUz ? 'Yaqinda' : 'Recently';
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
      default:
        return Hash;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ================= HERO CTA BANNER (Section 4) ================= */}
      <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-r from-white via-slate-50 to-emerald-50/60 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/40 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isUz
                  ? 'Google Sheets, lekin tahlil qilish va vizualizatsiya ancha osonroq'
                  : 'Google Sheets, but much easier to analyze, calculate, and visualize'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isUz
                ? `Xush kelibsiz, ${user?.name || 'Foydalanuvchi'}!`
                : `Welcome to SheetFlow, ${user?.name || 'Explorer'}!`}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {isUz
                ? 'Google Sheets jadvalingizni ulang. SheetFlow ma’lumotlarni avtomatik tushunadi, formulalarsiz hisoblaydi va vizualizatsiya yaratadi.'
                : 'Connect your Google Sheet. SheetFlow automatically understands columns, calculates metrics without formulas, and creates beautiful charts.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Primary CTA (Section 4) */}
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isUz ? 'Google Sheet ulash' : 'Connect Google Sheet'}</span>
            </button>
            <Link
              to="/sheets"
              className="flex items-center space-x-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-100 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm transition shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('mySheets')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ================= 2 MAIN SECTIONS: RECENT SHEETS & RECENT ANALYSES (Section 4) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. RECENT SHEETS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {isUz ? 'Oxirgi ochilgan jadvallar' : 'Recent Sheets'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isUz ? 'Yaqinda ishlatilgan Google Sheets jadvallari' : 'Recently accessed spreadsheets'}
                </p>
              </div>
            </div>

            <Link
              to="/sheets"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <span>{isUz ? 'Barchasi' : 'View all'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentSheets.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                {isUz ? 'Jadvallar mavjud emas' : 'No sheets opened yet'}
              </div>
            ) : (
              recentSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  onClick={() => navigate(`/sheets/${sheet.id}`)}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-500/10 transition shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate">
                        {sheet.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-mono text-[11px]">{sheet.rowCount} {isUz ? 'qator' : 'rows'}</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {isUz ? 'Ochilgan:' : 'Last opened:'} {formatRelativeTime(sheet.lastOpenedAt)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hidden sm:inline-block">
                      {isUz ? 'Faol' : 'In Sync'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. RECENT ANALYSES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <BookmarkCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {isUz ? 'Oxirgi tahlillar' : 'Recent Analyses'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isUz ? 'Yaqinda saqlangan va ishlatilgan tahlillar' : 'Recently updated calculations'}
                </p>
              </div>
            </div>

            <Link
              to="/saved-analyses"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <span>{isUz ? 'Barchasi' : 'View all'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentAnalyses.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                {isUz ? 'Hozircha tahlillar saqlanmagan' : 'No analyses created yet'}
              </div>
            ) : (
              recentAnalyses.map((analysis) => {
                const Icon = getVisualizationIcon(analysis.visualizationType);

                return (
                  <div
                    key={analysis.id}
                    onClick={() => navigate('/saved-analyses')}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-500/10 transition shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate">
                          {analysis.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="truncate max-w-[120px]">{analysis.sheetName}</span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {isUz ? 'Yangilangan:' : 'Updated'} {formatRelativeTime(analysis.updatedAt)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hidden sm:inline-block">
                        {analysis.functionId}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Connect Sheet Modal */}
      <ConnectSheetModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={async () => {
          setIsConnectModalOpen(false);
          await fetchData();
        }}
      />
    </div>
  );
};
