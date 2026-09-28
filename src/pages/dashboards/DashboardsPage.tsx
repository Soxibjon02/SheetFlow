import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api/client';
import { SheetData } from '../../core/types/sheet';
import { DashboardConfig, DashboardWidget } from '../../core/types/dashboard';
import { generateDashboard } from '../../core/dashboard-generator/dashboardGenerator';
import { WidgetRenderer } from '../../components/charts/WidgetRenderer';
import { getLocalizedFunctions } from '../../core/calculations/localizedFunctions';
import { useI18n } from '../../lib/i18n';
import {
  LayoutGrid,
  Sparkles,
  Plus,
  RefreshCw,
  Save,
  CheckCircle2,
  Share2,
  Trash2,
  BarChart3,
  TrendingUp,
  X,
} from 'lucide-react';

export const DashboardsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t, lang } = useI18n();
  const availableFunctions = useMemo(() => getLocalizedFunctions(lang), [lang]);

  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [dashboard, setDashboard] = useState<DashboardConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Manual Add Widget Modal state
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [newWidgetType, setNewWidgetType] = useState<any>('bar');
  const [newWidgetFunction, setNewWidgetFunction] = useState('SUM');
  const [newWidgetColumn, setNewWidgetColumn] = useState('');
  const [newWidgetGroupBy, setNewWidgetGroupBy] = useState('');

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. Initial Load of sheets
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const list = await api.getSheets();
        setSheets(list);
        const querySheetId = searchParams.get('sheetId');
        const activeId = querySheetId || list[0]?.id;
        if (activeId) setSelectedSheetId(activeId);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [searchParams]);

  // 2. Load active sheet data & auto-generate dashboard if none
  useEffect(() => {
    if (!selectedSheetId) return;
    const fetchAndGenerate = async () => {
      setIsLoading(true);
      try {
        const data = await api.getSheetById(selectedSheetId);
        setSheetData(data);
        const autoDash = generateDashboard(data);
        setDashboard(autoDash);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndGenerate();
  }, [selectedSheetId]);

  const handleRegenerate = () => {
    if (!sheetData) return;
    const autoDash = generateDashboard(sheetData);
    setDashboard(autoDash);
    showNotice(lang === 'uz' ? 'Dashboard qaytadan avtomatik shakllantirildi!' : 'Dashboard automatically regenerated from spreadsheet schema!');
  };

  const handleRemoveWidget = (widgetId: string) => {
    if (!dashboard) return;
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.filter((w) => w.id !== widgetId),
    });
  };

  const handleCreateManualWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboard || !sheetData) return;

    const widget: DashboardWidget = {
      id: `w_custom_${Date.now()}`,
      title: newWidgetTitle || `${newWidgetFunction} ${newWidgetColumn}`,
      type: newWidgetType,
      size: newWidgetType === 'kpi' ? 'sm' : 'md',
      calculation: {
        function: newWidgetFunction,
        column: newWidgetColumn || undefined,
        groupBy: newWidgetGroupBy || null,
        connectedSheetId: sheetData.metadata.id,
      },
    };

    setDashboard({
      ...dashboard,
      widgets: [...dashboard.widgets, widget],
    });
    setIsAddWidgetModalOpen(false);
    setNewWidgetTitle('');
    showNotice(lang === 'uz' ? 'Yangi vidjet dashboardga muvaffaqiyatli qoʻshildi.' : 'New widget added to dashboard.');
  };

  const handleSaveDashboard = async () => {
    if (!dashboard) return;
    await api.saveDashboard(dashboard);
    showNotice(lang === 'uz' ? 'Dashboard sozlamalari saqlandi!' : 'Dashboard configuration saved successfully!');
  };

  if (isLoading || !sheetData || !dashboard) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-medium">
          {lang === 'uz' ? 'Boshqaruv paneli yigʻilmoqda...' : 'Assembling executive dashboard...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/30 flex items-center space-x-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'uz' ? 'Interaktiv Dinamik Vizualizatsiya' : 'Interactive Dynamic Visualizer'}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {dashboard.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'uz' ? 'Manba: ' : 'Source: '}{' '}
            <strong className="text-slate-800 dark:text-slate-200">{sheetData.metadata.name}</strong> •{' '}
            {sheetData.metadata.rowCount} {lang === 'uz' ? 'ta qator' : 'rows'} •{' '}
            {dashboard.widgets.length} {lang === 'uz' ? 'ta faol vidjet' : 'active widgets'}
          </p>
        </div>

        {/* Toolbar */}
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
            onClick={handleRegenerate}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'uz' ? 'Avtomatik Yaratish' : 'Auto-Generate'}</span>
          </button>

          <button
            onClick={() => {
              setNewWidgetColumn(sheetData.metadata.columns[0]?.name || '');
              setIsAddWidgetModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'uz' ? 'Vidjet Qoʻshish' : 'Add Widget'}</span>
          </button>

          <button
            onClick={handleSaveDashboard}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{lang === 'uz' ? 'Saqlash' : 'Save Dashboard'}</span>
          </button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-12 gap-5">
        {dashboard.widgets.map((widget) => (
          <WidgetRenderer
            key={widget.id}
            widget={widget}
            sheetData={sheetData}
            onRemove={handleRemoveWidget}
          />
        ))}
      </div>

      {/* Modal: Add Custom Widget */}
      {isAddWidgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>{lang === 'uz' ? 'Maxsus Vidjet Qoʻshish' : 'Add Custom Dashboard Widget'}</span>
              </h3>
              <button
                onClick={() => setIsAddWidgetModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualWidget} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'uz' ? 'Vidjet Sarlavhasi' : 'Widget Title'}
                </label>
                <input
                  type="text"
                  required
                  value={newWidgetTitle}
                  onChange={(e) => setNewWidgetTitle(e.target.value)}
                  placeholder={lang === 'uz' ? 'Masalan: Hududlar boʻyicha savdo' : 'e.g. Sales by Region'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'uz' ? 'Vizualizatsiya Turi' : 'Visualization Type'}
                  </label>
                  <select
                    value={newWidgetType}
                    onChange={(e) => setNewWidgetType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="kpi">{lang === 'uz' ? 'KPI Koʻrsatkich Kartochkasi' : 'KPI Card'}</option>
                    <option value="bar">{lang === 'uz' ? 'Ustunli Diagramma (Bar)' : 'Bar Chart'}</option>
                    <option value="line">{lang === 'uz' ? 'Chiziqli Trend (Line)' : 'Line Chart'}</option>
                    <option value="area">{lang === 'uz' ? 'Soha Diagrammasi (Area)' : 'Area Chart'}</option>
                    <option value="donut">{lang === 'uz' ? 'Halqa Diagrammasi (Donut)' : 'Donut Chart'}</option>
                    <option value="pie">{lang === 'uz' ? 'Doiraviy Diagramma (Pie)' : 'Pie Chart'}</option>
                    <option value="table">{lang === 'uz' ? 'Jadval (Table)' : 'Table'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'uz' ? 'Hisoblash Funksiyasi' : 'Calculation Function'}
                  </label>
                  <select
                    value={newWidgetFunction}
                    onChange={(e) => setNewWidgetFunction(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {availableFunctions.map((fn) => (
                      <option key={fn.id} value={fn.id}>
                        {fn.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'uz' ? 'Hisoblanadigan Ustun' : 'Metric Column'}
                  </label>
                  <select
                    value={newWidgetColumn}
                    onChange={(e) => setNewWidgetColumn(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">{lang === 'uz' ? '(Barcha yozuvlar)' : '(All Rows)'}</option>
                    {sheetData.metadata.columns.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} [{c.manualTypeOverride || c.detectedType}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('groupBy')}
                  </label>
                  <select
                    value={newWidgetGroupBy}
                    onChange={(e) => setNewWidgetGroupBy(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">{lang === 'uz' ? '(Guruhsiz)' : '(None)'}</option>
                    {sheetData.metadata.columns.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddWidgetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
                >
                  {lang === 'uz' ? 'Qoʻshish' : 'Add Widget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
