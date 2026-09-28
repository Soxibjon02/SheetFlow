import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api/client';
import { SheetData } from '../../core/types/sheet';
import { CalculationRequest, CalculationResult } from '../../core/types/calculation';
import { calculate } from '../../core/calculations/engine';
import {
  getLocalizedFunctions,
  getLocalizedCategories,
  getFunctionName,
} from '../../core/calculations/localizedFunctions';
import { useI18n } from '../../lib/i18n';
import {
  Calculator,
  Play,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const CalculationsPage: React.FC = () => {
  const { t, lang } = useI18n();
  const functions = useMemo(() => getLocalizedFunctions(lang), [lang]);
  const categories = useMemo(() => getLocalizedCategories(lang), [lang]);

  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [sheetData, setSheetData] = useState<SheetData | null>(null);

  // Form states
  const [selectedFunction, setSelectedFunction] = useState<string>('AVERAGE');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedGroupBy, setSelectedGroupBy] = useState<string>('');
  const [conditionTarget, setConditionTarget] = useState<string>('');
  const [conditionOperator, setConditionOperator] = useState<string>('equals');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('All');

  const [activeResult, setActiveResult] = useState<CalculationResult | null>(null);
  const [history, setHistory] = useState<CalculationResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load sheets
  useEffect(() => {
    const init = async () => {
      const list = await api.getSheets();
      setSheets(list);
      if (list[0]?.id) setSelectedSheetId(list[0].id);
    };
    init();
  }, []);

  // Load sheet data
  useEffect(() => {
    if (!selectedSheetId) return;
    const fetch = async () => {
      const data = await api.getSheetById(selectedSheetId);
      setSheetData(data);
      // Auto-pick column
      const numCol = data.metadata.columns.find((c) =>
        ['number', 'currency', 'percentage'].includes(c.detectedType)
      );
      setSelectedColumn(numCol?.name || data.metadata.columns[0]?.name || '');
    };
    fetch();
  }, [selectedSheetId]);

  const selectedFnDef = functions.find((f) => f.id === selectedFunction);

  const filteredFunctions = useMemo(() => {
    if (activeCategoryId === 'All') return functions;
    return functions.filter((f) => f.category === activeCategoryId);
  }, [functions, activeCategoryId]);

  const handleRunCalculation = () => {
    if (!sheetData) return;
    setErrorMsg(null);
    try {
      const req: CalculationRequest = {
        function: selectedFunction,
        column: selectedColumn || undefined,
        groupBy: selectedGroupBy || null,
        parameters: selectedFnDef?.parameters
          ? { targetValue: conditionTarget, operator: conditionOperator }
          : undefined,
        connectedSheetId: sheetData.metadata.id,
      };

      const result = calculate(sheetData.rows, req);
      setActiveResult(result);
      setHistory((prev) => [result, ...prev.slice(0, 9)]);
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'uz' ? 'Hisoblashda xatolik yuz berdi' : 'Calculation failed'));
      setActiveResult(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
            <Calculator className="w-3.5 h-3.5" />
            <span>
              {lang === 'uz'
                ? 'Formulasiz va Kodsiz Hisoblash Dvigateli'
                : 'Extensible Formula-Free Calculation Engine'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('calculations')} Studio
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'uz'
              ? 'Google Sheets maʼlumotlari boʻyicha tayyor matematik funksiyalar, guruhlash va shartli filtrlarni qoʻllash'
              : 'Execute predefined functions, group aggregations, and conditional rules on Google Sheets data'}
          </p>
        </div>

        {/* Sheet Picker */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'uz' ? 'Tanlangan jadval:' : 'Target Sheet:'}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: No-Code Function Builder (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-md p-6 space-y-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'uz' ? 'Hisoblash parametrlarini sozlash' : 'Configure Calculation'}</span>
            </h2>

            {/* Category filter tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    activeCategoryId === cat.id
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Function Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('selectFunction')}
                </label>
                <select
                  value={selectedFunction}
                  onChange={(e) => {
                    setSelectedFunction(e.target.value);
                    setActiveResult(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {filteredFunctions.map((fn) => (
                    <option key={fn.id} value={fn.id}>
                      {fn.name}
                    </option>
                  ))}
                </select>
                {selectedFnDef && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1">
                    {selectedFnDef.description}
                  </p>
                )}
              </div>

              {/* Column Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('selectColumn')}
                </label>
                <select
                  value={selectedColumn}
                  onChange={(e) => {
                    setSelectedColumn(e.target.value);
                    setActiveResult(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="">{lang === 'uz' ? '(Barcha yozuvlar / Standart)' : '(All Records / Default)'}</option>
                  {sheetData?.metadata.columns.map((col) => (
                    <option key={col.id} value={col.name}>
                      {col.name} [{col.manualTypeOverride || col.detectedType}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Group By Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{t('groupBy')}</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                  {lang === 'uz' ? 'Kategoriyalar boʻyicha hisoblash' : 'Calculate across sub-categories'}
                </span>
              </label>
              <select
                value={selectedGroupBy}
                onChange={(e) => {
                  setSelectedGroupBy(e.target.value);
                  setActiveResult(null);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="">{lang === 'uz' ? 'Yoʻq (Bitta umumiy yakuniy qiymat)' : 'None (Total single aggregate)'}</option>
                {sheetData?.metadata.columns.map((col) => (
                  <option key={col.id} value={col.name}>
                    {col.name} [{col.manualTypeOverride || col.detectedType}]
                  </option>
                ))}
              </select>
            </div>

            {/* Condition parameter if applicable */}
            {selectedFnDef?.parameters && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {lang === 'uz' ? 'Shart parametri' : 'Condition Configuration'}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lang === 'uz' ? 'Operator' : 'Operator'}
                    </label>
                    <select
                      value={conditionOperator}
                      onChange={(e) => setConditionOperator(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 mt-1"
                    >
                      <option value="equals">{lang === 'uz' ? 'Teng (=)' : 'Equals (=)'}</option>
                      <option value="greater_than">{lang === 'uz' ? 'Katta (>)' : 'Greater than (>)'}</option>
                      <option value="less_than">{lang === 'uz' ? 'Kichik (<)' : 'Less than (<)'}</option>
                      <option value="contains">{lang === 'uz' ? 'Oʻz ichiga oladi' : 'Contains'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lang === 'uz' ? 'Qidirilayotgan qiymat' : 'Target Value'}
                    </label>
                    <input
                      type="text"
                      value={conditionTarget}
                      onChange={(e) => setConditionTarget(e.target.value)}
                      placeholder={lang === 'uz' ? 'Masalan: Ha, 80' : 'e.g. Yes, 80'}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Execute Button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleRunCalculation}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{t('calculate')}</span>
              </button>

              {activeResult && (
                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {lang === 'uz'
                      ? `${activeResult.executionTimeMs} ms da hisoblandi`
                      : `Computed in ${activeResult.executionTimeMs}ms`}
                  </span>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Result Display & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Result Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-md p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>{t('result')}</span>
              {activeResult && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {getFunctionName(activeResult.function, lang)}
                </span>
              )}
            </h2>

            {activeResult ? (
              <div className="space-y-4">
                {Array.isArray(activeResult.value) ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between font-semibold pb-1 border-b border-slate-200 dark:border-slate-800">
                      <span>{lang === 'uz' ? `Guruh (${activeResult.groupBy})` : `Group (${activeResult.groupBy})`}</span>
                      <span>{lang === 'uz' ? 'Hisoblangan qiymat' : 'Computed Value'}</span>
                    </div>
                    {activeResult.value.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.group}</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {typeof item.value === 'number'
                            ? new Intl.NumberFormat(lang === 'uz' ? 'uz-UZ' : 'en-US').format(item.value)
                            : String(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-emerald-500/30 text-center space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      {lang === 'uz' ? 'Hisoblangan natija' : 'Calculated Output'}
                    </span>
                    <div className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {activeResult.formattedValue}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                  <span>
                    {lang === 'uz'
                      ? `${activeResult.rowCountEvaluated} ta yozuv tahlil qilindi`
                      : `Evaluated ${activeResult.rowCountEvaluated} records`}
                  </span>
                  <span>{new Date(activeResult.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Calculator className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs">
                  {lang === 'uz'
                    ? 'Jadval maʼlumotlari boʻyicha hisoblash uchun "Hisoblash" tugmasini bosing'
                    : 'Click Calculate to evaluate against live spreadsheet data'}
                </p>
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-md p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('recentCalculations')}
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {getFunctionName(h.function, lang)}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono ml-2">
                        {h.column || (lang === 'uz' ? 'Toʻliq jadval' : 'Dataset')}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {h.formattedValue}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
