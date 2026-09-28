import React, { useState, useMemo } from 'react';
import { SheetData } from '../../core/types/sheet';
import { CalculationRequest, CalculationResult } from '../../core/types/calculation';
import { calculate } from '../../core/calculations/engine';
import {
  getLocalizedFunctions,
  getLocalizedCategories,
  getFunctionName,
} from '../../core/calculations/localizedFunctions';
import { useI18n } from '../../lib/i18n';
import { Calculator, Play, Check, X, Sparkles, Clock, AlertCircle } from 'lucide-react';

interface FunctionBuilderModalProps {
  sheetData: SheetData;
  isOpen: boolean;
  onClose: () => void;
  onSaveCalculation?: (calc: CalculationRequest, result: CalculationResult) => void;
}

export const FunctionBuilderModal: React.FC<FunctionBuilderModalProps> = ({
  sheetData,
  isOpen,
  onClose,
  onSaveCalculation,
}) => {
  const { t, lang } = useI18n();
  const functions = useMemo(() => getLocalizedFunctions(lang), [lang]);
  const categories = useMemo(() => getLocalizedCategories(lang), [lang]);
  const columns = sheetData.metadata.columns;

  const [selectedFunction, setSelectedFunction] = useState<string>('AVERAGE');
  const [selectedColumn, setSelectedColumn] = useState<string>(
    columns.find((c) => ['number', 'currency'].includes(c.detectedType))?.name || columns[0]?.name || ''
  );
  const [selectedGroupBy, setSelectedGroupBy] = useState<string>('');
  const [conditionTarget, setConditionTarget] = useState<string>('');
  const [conditionOperator, setConditionOperator] = useState<string>('equals');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('All');

  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedFnDef = functions.find((f) => f.id === selectedFunction);

  const filteredFunctions = useMemo(() => {
    if (activeCategoryId === 'All') return functions;
    return functions.filter((f) => f.category === activeCategoryId);
  }, [functions, activeCategoryId]);

  const handleRunCalculation = () => {
    setIsCalculating(true);
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
      setCalcResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'uz' ? 'Hisoblashda xatolik yuz berdi' : 'Calculation failed'));
      setCalcResult(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = () => {
    if (calcResult && onSaveCalculation) {
      onSaveCalculation(
        {
          function: selectedFunction,
          column: selectedColumn || undefined,
          groupBy: selectedGroupBy || null,
          parameters: selectedFnDef?.parameters
            ? { targetValue: conditionTarget, operator: conditionOperator }
            : undefined,
          connectedSheetId: sheetData.metadata.id,
        },
        calcResult
      );
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'uz' ? 'Kodsiz Funksiyalar Konstruktori' : 'No-Code Function Builder'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'uz'
                  ? `"${sheetData.metadata.name}" jadvali boʻyicha formulalarsiz hisoblash`
                  : `Compute metrics for "${sheetData.metadata.name}" without writing formulas`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Category tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Function Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('selectFunction')}
              </label>
              <select
                value={selectedFunction}
                onChange={(e) => {
                  setSelectedFunction(e.target.value);
                  setCalcResult(null);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              >
                {filteredFunctions.map((fn) => (
                  <option key={fn.id} value={fn.id}>
                    {fn.name}
                  </option>
                ))}
              </select>
              {selectedFnDef && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">{selectedFnDef.description}</p>
              )}
            </div>

            {/* Column Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('selectColumn')}
              </label>
              <select
                value={selectedColumn}
                onChange={(e) => {
                  setSelectedColumn(e.target.value);
                  setCalcResult(null);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="">{lang === 'uz' ? '(Barcha yozuvlar / Ustunsiz)' : '(All Rows / No Column)'}</option>
                {columns.map((col) => (
                  <option key={col.id} value={col.name}>
                    {col.name} [{col.manualTypeOverride || col.detectedType}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Group By selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{t('groupBy')}</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                {lang === 'uz' ? 'Masalan: Shahar, Fan yoki Kategoriya boʻyicha ajratish' : 'e.g. Break down by City, Subject, or Category'}
              </span>
            </label>
            <select
              value={selectedGroupBy}
              onChange={(e) => {
                setSelectedGroupBy(e.target.value);
                setCalcResult(null);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="">{lang === 'uz' ? 'Yoʻq (Bitta umumiy yakuniy qiymat)' : 'None (Single aggregate total)'}</option>
              {columns.map((col) => (
                <option key={col.id} value={col.name}>
                  {col.name} [{col.manualTypeOverride || col.detectedType}]
                </option>
              ))}
            </select>
          </div>

          {/* Conditional parameters if COUNTIF / SUMIF / PERCENTAGE */}
          {selectedFnDef?.parameters && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'uz' ? 'Shart parametri' : 'Condition Rule'}</span>
              </div>
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
                    placeholder={lang === 'uz' ? 'Masalan: Ha, 80, Toshkent' : 'e.g. Yes, 80, Tashkent'}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action: Run Calculation */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleRunCalculation}
              disabled={isCalculating}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{isCalculating ? (lang === 'uz' ? 'Hisoblanmoqda...' : 'Computing...') : t('calculate')}</span>
            </button>

            {calcResult && (
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>
                  {lang === 'uz'
                    ? `${calcResult.executionTimeMs} ms da hisoblandi`
                    : `Computed in ${calcResult.executionTimeMs}ms`}
                </span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Result Display */}
          {calcResult && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-emerald-500/30 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('result')} ({getFunctionName(calcResult.function, lang)})
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                  {lang === 'uz'
                    ? `${calcResult.rowCountEvaluated} ta qator tahlil qilindi`
                    : `${calcResult.rowCountEvaluated} rows evaluated`}
                </span>
              </div>

              {Array.isArray(calcResult.value) ? (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {calcResult.value.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">{item.group}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {calcResult.formattedValue}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 text-sm font-medium transition cursor-pointer"
          >
            {t('cancel')}
          </button>
          {calcResult && onSaveCalculation && (
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{t('saveCalculation')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
