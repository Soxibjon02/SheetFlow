import React, { useState, useEffect } from 'react';
import { api } from '../../services/api/client';
import { useI18n } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { ConnectSheetModal } from '../../components/sheets/ConnectSheetModal';
import {
  FileSpreadsheet,
  Plus,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Database,
  Calculator,
  LayoutGrid,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sheets, setSheets] = useState<any[]>([]);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSheets = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSheets();
      setSheets(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  const totalRows = sheets.reduce((acc, s) => acc + (s.rowCount || 0), 0);
  const totalCols = sheets.reduce((acc, s) => acc + (s.columnCount || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-r from-white via-slate-50 to-emerald-50/60 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/40 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {lang === 'uz'
                  ? 'Kodsiz Google Sheets Tahlili va Boshqaruvi'
                  : 'No-Code Calculation & Analytics Platform'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {lang === 'uz' ? `Xush kelibsiz, ${user?.name || 'Foydalanuvchi'}!` : `Welcome back, ${user?.name || 'Explorer'}!`}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'uz'
                ? 'Istalgan Google Sheets jadvalini ulang, formulalarsiz hisoblang, interaktiv boshqaruv panellarini yarating va maʼlumotlarni sinxronlang.'
                : 'Connect any Google Sheet, perform formula-free calculations, generate dynamic executive dashboards, and sync modifications live.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('connectSheet')}</span>
            </button>
            <Link
              to="/templates"
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm transition shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'uz' ? 'Shablonlarni koʻrish' : 'Explore Templates'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* High-level Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-md space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{t('connectedSheets')}</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{sheets.length}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>{lang === 'uz' ? 'Faol va Sinxronlashgan' : 'Active & In Sync'}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-md space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{t('indexedRows')}</span>
            <Database className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{totalRows}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === 'uz' ? 'Jonli hisoblash uchun tayyor' : 'Available for live queries'}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-md space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{t('schemaColumns')}</span>
            <Layers className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{totalCols}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === 'uz' ? 'Avtomatik aniqlangan turlar' : 'Auto-detected data types'}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-md space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{t('calculationEngine')}</span>
            <Calculator className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">25+</div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            {lang === 'uz' ? 'Tayyor kodsiz funksiyalar' : 'Pre-built no-code functions'}
          </div>
        </div>
      </div>

      {/* Main Section: Connected Spreadsheets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {t('connectedSheets')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'uz'
                ? 'Google Sheets jadvallaringizni boshqaring, tahlil qiling va hisob-kitob qiling'
                : 'Manage, preview, and compute calculations across your Google Sheets'}
            </p>
          </div>
          <Link
            to="/sheets"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center space-x-1"
          >
            <span>{lang === 'uz' ? 'Barchasini koʻrish' : 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 backdrop-blur-md p-5 flex flex-col justify-between hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition shadow-sm group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {sheet.selectedTab || 'Sheet1'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition truncate">
                    {sheet.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                    {sheet.url || 'Connected Sheet'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                      {lang === 'uz' ? 'Qatorlar' : 'Rows'}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{sheet.rowCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                      {lang === 'uz' ? 'Ustunlar' : 'Columns'}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{sheet.columnCount}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <Link
                  to={`/sheets/${sheet.id}`}
                  className="flex-1 text-center py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
                >
                  {t('viewSpreadsheet')}
                </Link>
                <Link
                  to={`/analytics?sheetId=${sheet.id}`}
                  className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-300 transition"
                >
                  {t('analyzeData')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Launchpad Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/20 space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'uz' ? 'Kodsiz Funksiyalar Konstruktori' : 'No-Code Function Builder'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {lang === 'uz'
                ? 'Oʻrtacha qiymatlar, shartli yigʻindilar, foizlar va koʻp bosqichli guruhlashni bitta formula yozmasdan hisoblang.'
                : 'Compute averages, conditional sums, percentiles, and multi-level groupings without writing a single formula.'}
            </p>
          </div>
          <Link
            to="/calculations"
            className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            <span>{lang === 'uz' ? 'Hisoblash studiyasiga oʻtish' : 'Launch Calculation Studio'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-emerald-200 dark:border-emerald-500/20 space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'uz' ? 'Avtomatik Dashboard Generatori' : 'Automatic Dashboard Generator'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {lang === 'uz'
                ? 'Jadvallarni 1-bosqichda KPI koʻrsatkichlari, ustunli diagrammalar, trend chiziqlari va maʼlumotlar panellariga aylantiring.'
                : '1-click converts raw spreadsheets into KPI metric cards, bar charts, trend lines, and data tables.'}
            </p>
          </div>
          <Link
            to="/dashboards"
            className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500"
          >
            <span>{lang === 'uz' ? 'Boshqaruv panelini yaratish' : 'Generate Executive Dashboard'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Connect Sheet Modal */}
      <ConnectSheetModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={(sheetId) => {
          fetchSheets();
          navigate(`/sheets/${sheetId}`);
        }}
      />
    </div>
  );
};
