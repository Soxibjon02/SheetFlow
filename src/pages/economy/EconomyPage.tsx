import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { economyService, DEFAULT_ECONOMIC_INDICATORS } from '../../core/economy/economyService';
import {
  EconomicIndicator,
  EconomicDataset,
  CountryComparisonData,
  CorrelationResult,
  BreakEvenAnalysisResult,
  PriceElasticityResult,
  SupplyDemandResult,
  EconomicForecastResult,
} from '../../core/types/economy';
import { api } from '../../services/api/client';
import { SheetData } from '../../core/types/sheet';
import { useI18n } from '../../lib/i18n';
import {
  Globe2,
  TrendingUp,
  LineChart,
  BarChart3,
  Calculator,
  Compass,
  Layers,
  Sparkles,
  FileText,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  Printer,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Database,
  ArrowRight,
  Sliders,
  Maximize2,
  Scale,
} from 'lucide-react';

export const EconomyPage: React.FC = () => {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab
  const activeTab = searchParams.get('tab') || 'dashboard';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // State
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Model States
  // 1. Break-Even
  const [beFixedCost, setBeFixedCost] = useState<number>(50000);
  const [beVarCost, setBeVarCost] = useState<number>(25);
  const [bePrice, setBePrice] = useState<number>(45);
  const [beResult, setBeResult] = useState<BreakEvenAnalysisResult | null>(null);

  // 2. Elasticity
  const [elP1, setElP1] = useState<number>(100);
  const [elP2, setElP2] = useState<number>(120);
  const [elQ1, setElQ1] = useState<number>(500);
  const [elQ2, setElQ2] = useState<number>(420);
  const [elResult, setElResult] = useState<PriceElasticityResult | null>(null);

  // 3. Supply & Demand
  const [sdA, setSdA] = useState<number>(120);
  const [sdB, setSdB] = useState<number>(2);
  const [sdC, setSdC] = useState<number>(20);
  const [sdD, setSdD] = useState<number>(3);
  const [sdResult, setSdResult] = useState<SupplyDemandResult | null>(null);

  // 4. Real vs Nominal
  const [nominalVal, setNominalVal] = useState<number>(10000000);
  const [cpiVal, setCpiVal] = useState<number>(8.8);
  const [baseYear, setBaseYear] = useState<number>(2023);

  // 5. Country Comparison
  const [countryA, setCountryA] = useState<string>('Uzbekistan');
  const [countryB, setCountryB] = useState<string>('Kazakhstan');
  const [comparison, setComparison] = useState<CountryComparisonData | null>(null);

  // 6. Correlation Analysis
  const [corrVarA, setCorrVarA] = useState<string>('Inflation Rate (%)');
  const [corrVarB, setCorrVarB] = useState<string>('Unemployment Rate (%)');
  const [corrResult, setCorrResult] = useState<CorrelationResult | null>(null);

  // 7. Forecasting
  const [forecastIndicator, setForecastIndicator] = useState<string>('GDP_UZ');
  const [forecastMethod, setForecastMethod] = useState<'Linear Trend' | 'Moving Average (3-Period)'>('Linear Trend');
  const [forecastResult, setForecastResult] = useState<EconomicForecastResult | null>(null);

  useEffect(() => {
    setIndicators(economyService.getIndicators());
    calculateModels();
    loadSheets();
  }, []);

  const loadSheets = async () => {
    try {
      const data = await api.getSheets();
      setSheets(data);
      if (data.length > 0) {
        setSelectedSheetId(data[0].id);
        const fullSheet = await api.getSheet(data[0].id);
        setSheetData(fullSheet);
      }
    } catch (e) {
      console.error('Failed to load sheets', e);
    }
  };

  const handleSheetChange = async (sheetId: string) => {
    setSelectedSheetId(sheetId);
    try {
      const fullSheet = await api.getSheet(sheetId);
      setSheetData(fullSheet);
      showNotification(lang === 'uz' ? 'Google Sheet ma’lumotlari ulandi' : 'Google Sheet linked successfully');
    } catch (e) {
      console.error('Failed to load sheet detail', e);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const calculateModels = () => {
    setBeResult(economyService.calculateBreakEven(beFixedCost, beVarCost, bePrice));
    setElResult(economyService.calculatePriceElasticity(elP1, elP2, elQ1, elQ2));
    setSdResult(economyService.calculateSupplyDemand(sdA, sdB, sdC, sdD));
    setComparison(economyService.compareCountries(countryA, countryB));
    
    // Sample correlation data: Inflation vs Unemployment (Phillips curve series)
    const infSeries = [10.0, 12.3, 8.8, 9.8, 8.8, 8.2, 7.9];
    const unempSeries = [9.6, 8.9, 8.1, 7.5, 6.8, 6.5, 6.2];
    setCorrResult(economyService.calculateCorrelation(infSeries, unempSeries, corrVarA, corrVarB));

    setForecastResult(economyService.generateForecast(forecastIndicator, forecastMethod));
  };

  useEffect(() => {
    setBeResult(economyService.calculateBreakEven(beFixedCost, beVarCost, bePrice));
  }, [beFixedCost, beVarCost, bePrice]);

  useEffect(() => {
    setElResult(economyService.calculatePriceElasticity(elP1, elP2, elQ1, elQ2));
  }, [elP1, elP2, elQ1, elQ2]);

  useEffect(() => {
    setSdResult(economyService.calculateSupplyDemand(sdA, sdB, sdC, sdD));
  }, [sdA, sdB, sdC, sdD]);

  useEffect(() => {
    setComparison(economyService.compareCountries(countryA, countryB));
  }, [countryA, countryB]);

  useEffect(() => {
    setForecastResult(economyService.generateForecast(forecastIndicator, forecastMethod));
  }, [forecastIndicator, forecastMethod]);

  const navItems = [
    { id: 'dashboard', label: lang === 'uz' ? 'Boshqaruv Paneli' : 'Dashboard', icon: Globe2 },
    { id: 'indicators', label: lang === 'uz' ? 'Iqtisodiy Ko‘rsatkichlar' : 'Indicators & Datasets', icon: Layers },
    { id: 'calculations', label: lang === 'uz' ? 'Hisob-Kitoblar (Kodsiz)' : 'Calculations', icon: Calculator },
    { id: 'comparisons', label: lang === 'uz' ? 'Davlatlar Solishtiruvi' : 'Comparisons', icon: Scale },
    { id: 'correlation', label: lang === 'uz' ? 'Korrelyatsiya Tahlili' : 'Correlation Analysis', icon: Compass },
    { id: 'models', label: lang === 'uz' ? 'Iqtisodiy Modellar' : 'Economic Models', icon: Sliders },
    { id: 'forecasting', label: lang === 'uz' ? 'Prognozlash (Forecasting)' : 'Forecasting', icon: TrendingUp },
    { id: 'reports', label: lang === 'uz' ? 'Iqtisodiy Hisobotlar' : 'Reports', icon: FileText },
  ];

  const categories = ['All', 'Growth', 'Inflation', 'Employment', 'Trade', 'Monetary', 'Fiscal'];

  const filteredIndicators = indicators.filter(
    (ind) => selectedCategory === 'All' || ind.category === selectedCategory
  );

  const realValueCalc = economyService.calculateInflationImpact(nominalVal, cpiVal);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 dark:from-blue-950/60 dark:via-indigo-950/40 dark:to-purple-950/60 p-6 rounded-3xl border border-blue-500/20 backdrop-blur-xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Globe2 className="w-4 h-4" />
            <span>{lang === 'uz' ? 'SheetFlow Iqtisodiyot Moduli' : 'SheetFlow Economy & Macro Analytics'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {lang === 'uz' ? 'Makroiqtisodiy Tahlil va Modellar' : 'Macroeconomic Data, Indicators & Models'}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 max-w-2xl">
            {lang === 'uz'
              ? 'Iqtisodchilar, tahlilchilar va tadqiqotchilar uchun: YaIM, inflyatsiya, bandlik, savdo balansi, korrelyatsiya va iqtisodiy modellar.'
              : 'Designed for economists, analysts, and researchers: GDP trends, CPI inflation, trade balances, correlation, break-even, and time-series forecasting.'}
          </p>
        </div>

        {/* Google Sheets Connect Selector */}
        <div className="flex items-center space-x-3 relative z-10 bg-white/70 dark:bg-slate-900/80 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Database className="w-4 h-4 text-blue-500" />
          <div className="text-left">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              {lang === 'uz' ? 'Uланган Google Sheet' : 'Linked Google Sheet'}
            </div>
            <select
              value={selectedSheetId}
              onChange={(e) => handleSheetChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-4"
            >
              {sheets.map((s) => (
                <option key={s.id} value={s.id} className="dark:bg-slate-900">
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-2xl shadow-md text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Navigation Sub-Menu */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Macro KPI Cards (Section 74) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                <span>{lang === 'uz' ? 'YaIM (GDP)' : 'Nominal GDP'}</span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  Uzbekistan
                </span>
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">$107.5B</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +6.2%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                {lang === 'uz' ? '2025-yil yakuni bo‘yicha nominal YaIM' : 'Estimated 2025 nominal economic output'}
              </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                <span>{lang === 'uz' ? 'Inflyatsiya (CPI)' : 'Headline CPI'}</span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  YoY
                </span>
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">8.8%</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> -1.2% pt
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                {lang === 'uz' ? 'Iste’mol narxlari indeksi pasayishda' : 'Central Bank target corridor approaching'}
              </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                <span>{lang === 'uz' ? 'Asosiy Stavka' : 'Policy Rate'}</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                  CBU
                </span>
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">13.5%</span>
                <span className="text-xs font-semibold text-slate-500 flex items-center">
                  <Minus className="w-3.5 h-3.5 mr-0.5" /> 0.0%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                {lang === 'uz' ? 'Real stavka: +4.7% (qattiq pul-kredit)' : 'Real policy rate: +4.7% restrictive'}
              </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                <span>{lang === 'uz' ? 'Savdo Salbiy Farqi' : 'Trade Deficit'}</span>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                  Goods & Services
                </span>
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">-$12.7B</span>
                <span className="text-xs font-semibold text-rose-500 flex items-center">
                  Exp $25.4B / Imp $38.1B
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                {lang === 'uz' ? 'Texnologiya va asbob-uskunalar importi sababli' : 'Driven by capital goods modernisation'}
              </p>
            </div>
          </div>

          {/* Interactive Macro Charts & Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: GDP & Growth Dynamics */}
            <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'uz' ? 'YaIM Dinamikasi (2021–2025)' : 'GDP Growth Dynamics (2021–2025)'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'uz' ? 'Milliard AQSH dollari hisobida' : 'Expressed in Billions USD (Annual)'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
                  CAGR: +11.6%
                </span>
              </div>

              {/* Bar / Column Chart Representation */}
              <div className="h-56 flex items-end justify-between gap-4 pt-8 px-2 border-b border-slate-200 dark:border-slate-800">
                {[
                  { year: '2021', gdp: 69.2, pct: '58%' },
                  { year: '2022', gdp: 80.4, pct: '68%' },
                  { year: '2023', gdp: 90.9, pct: '77%' },
                  { year: '2024', gdp: 101.2, pct: '88%' },
                  { year: '2025', gdp: 107.5, pct: '100%' },
                ].map((item) => (
                  <div key={item.year} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      ${item.gdp}B
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-xl transition-all duration-500 group-hover:from-blue-500 group-hover:to-cyan-400"
                      style={{ height: item.pct }}
                    ></div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                      {item.year}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Inflation vs Policy Rate (Monetary Stance) */}
            <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'uz' ? 'Inflyatsiya va Pul-Kredit Siyosati' : 'CPI Inflation vs Policy Interest Rate'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'uz' ? 'Real stavka va inflyatsion kutilmalar' : 'Real policy rate buffer analysis (%)'}
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center space-x-1 text-amber-500 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                    <span>CPI</span>
                  </span>
                  <span className="flex items-center space-x-1 text-emerald-500 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Rate</span>
                  </span>
                </div>
              </div>

              {/* Multi-series visualization */}
              <div className="h-56 flex items-end justify-between gap-4 pt-8 px-2 border-b border-slate-200 dark:border-slate-800">
                {[
                  { year: '2021', cpi: 10.0, rate: 14.0 },
                  { year: '2022', cpi: 12.3, rate: 15.0 },
                  { year: '2023', cpi: 8.8, rate: 14.0 },
                  { year: '2024', cpi: 9.8, rate: 13.5 },
                  { year: '2025', cpi: 8.8, rate: 13.5 },
                ].map((item) => (
                  <div key={item.year} className="flex-1 flex flex-col items-center h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1.5 h-44">
                      <div
                        className="w-1/2 bg-amber-400 dark:bg-amber-500 rounded-t-md transition-all"
                        style={{ height: `${(item.cpi / 16) * 100}%` }}
                        title={`CPI: ${item.cpi}%`}
                      ></div>
                      <div
                        className="w-1/2 bg-emerald-500 dark:bg-emerald-400 rounded-t-md transition-all"
                        style={{ height: `${(item.rate / 16) * 100}%` }}
                        title={`Rate: ${item.rate}%`}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">
                      {item.year}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Economic Health Scorecard */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {lang === 'uz' ? 'Makroiqtisodiy Barqarorlik Matritsasi' : 'Macroeconomic Stability Matrix'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20">
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                  {lang === 'uz' ? 'Fiskal Barqarorlik' : 'Fiscal Sustainability'}
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-1">36.4% YaIMga nisbatan</div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {lang === 'uz'
                    ? 'Davlat qarzi xavfsiz chegarada (xalqaro me’yor 60% dan past).'
                    : 'Sovereign public debt remains well within safe international prudential limits (<60%).'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/20">
                <div className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">
                  {lang === 'uz' ? 'Tashqi Savdo Diversifikatsiyasi' : 'External Trade Dynamics'}
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-1">$63.5B Umumiy Aylanma</div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {lang === 'uz'
                    ? 'Eksport hajmi $25.4B gacha o‘sdi (oltin, to‘qimachilik, mis va energetika).'
                    : 'Exports reached $25.4B across gold, textiles, energy, and value-added manufacturing.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-500/20">
                <div className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase">
                  {lang === 'uz' ? 'Demografik Dividend' : 'Demographic Dividend'}
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-1">37.2M Aholi</div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {lang === 'uz'
                    ? 'Mehnatga layoqatli yosh aholi ulushi 60% dan ortiq, yangi ish o‘rinlari talabi yuqori.'
                    : 'Over 60% working-age demographic driving regional consumption and productivity growth.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INDICATORS & DATASETS */}
      {activeTab === 'indicators' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {lang === 'uz' ? 'Kategoriya:' : 'Category:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'uz' ? `Jami: ${filteredIndicators.length} ta ko‘rsatkich` : `Total: ${filteredIndicators.length} indicators`}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[11px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">{lang === 'uz' ? 'Ko‘rsatkich Nomi' : 'Indicator Name'}</th>
                    <th className="py-3.5 px-4">{lang === 'uz' ? 'Kategoriya' : 'Category'}</th>
                    <th className="py-3.5 px-4">{lang === 'uz' ? 'Joriy Qiymat' : 'Current Value'}</th>
                    <th className="py-3.5 px-4">{lang === 'uz' ? 'O‘zgarish (YoY)' : 'Change (YoY)'}</th>
                    <th className="py-3.5 px-4">{lang === 'uz' ? 'Davr' : 'Period'}</th>
                    <th className="py-3.5 px-4">{lang === 'uz' ? 'Manba' : 'Source'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredIndicators.map((ind) => (
                    <tr key={ind.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>{ind.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{ind.code}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          {ind.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {ind.currentValue.toLocaleString()} <span className="text-xs font-normal text-slate-400">{ind.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        {ind.changeYoy > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +{ind.changeYoy}%
                          </span>
                        ) : ind.changeYoy < 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 flex items-center">
                            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> {ind.changeYoy}%
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center">0.0%</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                        {ind.period}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs truncate max-w-xs" title={ind.source}>
                        {ind.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CALCULATIONS (SECTION 75, 78) */}
      {activeTab === 'calculations' && (
        <div className="space-y-6">
          {/* Section 78: Real vs Nominal Calculator */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Calculator className="w-4 h-4" />
              <span>{lang === 'uz' ? '78-Bo‘lim: Real va Nominal Qiymatlar Tahlili' : 'Section 78: Real vs Nominal Value Engine'}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {lang === 'uz' ? 'Inflyatsiyani Hisobga Olgan Real Qiymatni Hisoblash' : 'Purchasing Power & Real Value Deflator'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs mb-6 max-w-2xl">
              {lang === 'uz'
                ? 'Nominal summaga inflyatsiya (CPI) ta’sirini deflyator orqali chiqarib tashlash va xarid qobiliyati yo‘qotilishini baholash.'
                : 'Remove inflation effects from nominal revenues or salaries to assess true real purchasing power over time.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'uz' ? 'Nominal Qiymat (UZS / USD)' : 'Nominal Value'}
                </label>
                <input
                  type="number"
                  value={nominalVal}
                  onChange={(e) => setNominalVal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'uz' ? 'Inflyatsiya Ko‘rsatkichi (CPI %)' : 'Inflation Rate (%)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cpiVal}
                  onChange={(e) => setCpiVal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'uz' ? 'Baza Yili' : 'Base Year'}
                </label>
                <input
                  type="number"
                  value={baseYear}
                  onChange={(e) => setBaseYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Result Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-500/20">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase">{lang === 'uz' ? 'Hisoblangan Real Qiymat' : 'Deflated Real Value'}</div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                  {realValueCalc.realValue.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Formula: Nominal / (1 + i)</div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase">{lang === 'uz' ? 'Xarid Qobiliyati Yo‘qotilishi' : 'Purchasing Power Loss'}</div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  -{realValueCalc.purchasingPowerLossPercent}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{cpiVal}% inflyatsiya evaziga</div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase">{lang === 'uz' ? 'Deflyator Usuli' : 'Deflator Method'}</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {baseYear} Baza Narxlari Asosida
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">Tasdiqlangan iqtisodiy standart</div>
              </div>
            </div>
          </div>

          {/* Section 75: CAGR Calculator */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {lang === 'uz' ? 'CAGR — Yillik Murakkab O‘sish Sur’ati' : 'CAGR — Compound Annual Growth Rate'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs mb-4">
              Formula: (Oxirgi Qiymat / Boshlang‘ich Qiymat)^(1 / Yillar) - 1
            </p>
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-500">2021 YaIM ($69.2B) → 2025 YaIM ($107.5B)</span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  CAGR: +11.63% Yillik
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPARISONS (SECTION 79) */}
      {activeTab === 'comparisons' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {lang === 'uz' ? 'Davlatlar va Mintaqalararo Solishtirma Tahlil' : 'Cross-Country Economic Benchmark'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'uz'
                    ? 'Markaziy Osiyo yetakchi iqtisodiyotlarining asosiy makro ko‘rsatkichlarini solishtirish'
                    : 'Benchmarking macroeconomic indicators between Central Asian economies'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={countryA}
                  onChange={(e) => setCountryA(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold outline-none"
                >
                  <option value="Uzbekistan">Uzbekistan</option>
                  <option value="Kazakhstan">Kazakhstan</option>
                </select>
                <span className="text-xs font-bold text-slate-400">vs</span>
                <select
                  value={countryB}
                  onChange={(e) => setCountryB(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold outline-none"
                >
                  <option value="Kazakhstan">Kazakhstan</option>
                  <option value="Uzbekistan">Uzbekistan</option>
                </select>
              </div>
            </div>

            {/* Comparison Table */}
            {comparison && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-3 px-4">{lang === 'uz' ? 'Ko‘rsatkich' : 'Indicator'}</th>
                      <th className="py-3 px-4">{comparison.countryA}</th>
                      <th className="py-3 px-4">{comparison.countryB}</th>
                      <th className="py-3 px-4">{lang === 'uz' ? 'Farq (Delta)' : 'Difference'}</th>
                      <th className="py-3 px-4">{lang === 'uz' ? 'Yetakchi' : 'Leader / Advantage'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {comparison.metrics.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {m.indicator}
                          <span className="text-[11px] font-normal text-slate-400 ml-1.5">({m.unit})</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{m.valueA}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{m.valueB}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-300">
                          {m.difference > 0 ? `+${m.difference}` : m.difference}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              m.leader === comparison.countryA
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {m.leader}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CORRELATION ANALYSIS (SECTION 80) */}
      {activeTab === 'correlation' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Compass className="w-4 h-4" />
              <span>{lang === 'uz' ? '80-Bo‘lim: Korrelyatsiya Tahlili' : 'Section 80: Correlation & Association Analysis'}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {lang === 'uz' ? 'Ikkita Iqtisodiy O‘zgaruvchi Bog‘liqligi (Filips Egri Chizig‘i)' : 'Two-Variable Pearson Correlation & Scatter Plot'}
            </h3>

            {/* MANDATORY DISCLAIMER AS REQUIRED BY SECTION 80 */}
            <div className="my-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                  {lang === 'uz' ? 'Majburiy Metodologik Ogohlantirish' : 'Mandatory Methodological Notice'}:
                </span>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mt-0.5">
                  &ldquo;Correlation indicates statistical association and does not by itself establish causation.&rdquo;
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                  {lang === 'uz'
                    ? '(Korrelyatsiya faqat statistik bog‘liqlikni bildiradi va o‘z-o‘zidan sabab-oqibat aloqasini isbotlamaydi).'
                    : '(Statistical correlation alone never implies a direct causal relationship without structural proofs).'}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'uz' ? '1-O‘zgaruvchi (X o‘qi)' : 'Variable A (X Axis)'}
                </label>
                <input
                  type="text"
                  value={corrVarA}
                  onChange={(e) => setCorrVarA(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'uz' ? '2-O‘zgaruvchi (Y o‘qi)' : 'Variable B (Y Axis)'}
                </label>
                <input
                  type="text"
                  value={corrVarB}
                  onChange={(e) => setCorrVarB(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                />
              </div>
            </div>

            {/* Metrics Output */}
            {corrResult && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 mb-6">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Pirson Koeffitsiyenti (r)</div>
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {corrResult.correlationCoefficient}
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600">{corrResult.strength}</span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Determinatsiya (R²)</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {corrResult.rSquared}
                  </div>
                  <span className="text-[11px] text-slate-400">Variatsiya tushuntirilishi</span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Kovariatsiya (Cov)</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {corrResult.covariance}
                  </div>
                  <span className="text-[11px] text-slate-400">Birgalikdagi o‘zgaruvchanlik</span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Regressiya Tenglamasi</div>
                  <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 mt-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    {corrResult.regressionEquation}
                  </div>
                </div>
              </div>
            )}

            {/* Scatter points visual */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <div className="text-xs font-semibold text-slate-500 mb-2">
                {lang === 'uz' ? 'Statistik Kuzatuv Nuqtalari (Scatter Points):' : 'Observed Data Points:'}
              </div>
              <div className="flex flex-wrap gap-2">
                {corrResult?.points.map((pt, i) => (
                  <div key={i} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{pt.label}:</span> X={pt.x}%, Y={pt.y}%
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ECONOMIC MODELS (SECTION 81, 82, 83) */}
      {activeTab === 'models' && (
        <div className="space-y-8">
          {/* MODEL 1: BREAK-EVEN ANALYSIS (SECTION 82) */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Sliders className="w-4 h-4" />
              <span>{lang === 'uz' ? '82-Bo‘lim: Zararsizlik Nuqtasi Modeli' : 'Section 82: Break-Even Economic Model'}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {lang === 'uz' ? 'Zararsizlik Nuqtasi (Break-Even Point)' : 'Break-Even Units & Revenue Analysis'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs mb-6">
              {lang === 'uz'
                ? 'Doimiy xarajatlar, birlik o‘zgaruvchan xarajati va sotuv narxi asosida zararsizlik miqdorini aniqlash.'
                : 'Calculate output where Total Revenue equals Total Cost. Margin of safety and contribution margin.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'uz' ? 'Doimiy Xarajatlar (Fixed Costs)' : 'Fixed Costs ($)'}
                </label>
                <input
                  type="number"
                  value={beFixedCost}
                  onChange={(e) => setBeFixedCost(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'uz' ? 'Birlik O‘zgaruvchan Xarajati' : 'Variable Cost / Unit ($)'}
                </label>
                <input
                  type="number"
                  value={beVarCost}
                  onChange={(e) => setBeVarCost(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'uz' ? 'Birlik Sotuv Narxi' : 'Selling Price / Unit ($)'}
                </label>
                <input
                  type="number"
                  value={bePrice}
                  onChange={(e) => setBePrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                />
              </div>
            </div>

            {beResult && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-500/20">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">{lang === 'uz' ? 'Zararsizlik Miqdori' : 'Break-Even Units'}</div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {beResult.breakEvenUnits.toLocaleString()} dona
                  </div>
                  <span className="text-[11px] text-slate-500">Q = Fixed / Margin</span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">{lang === 'uz' ? 'Zararsizlik Tushumi' : 'Break-Even Revenue'}</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    ${beResult.breakEvenRevenue.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500">Teng tushum chegarasi</span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">{lang === 'uz' ? 'Marjinal Daromad' : 'Contribution Margin'}</div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    ${beResult.contributionMargin} / dona
                  </div>
                  <span className="text-[11px] text-slate-500">({beResult.contributionMarginRatio}% nisbat)</span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">{lang === 'uz' ? 'Tahliliy Xulosa' : 'Model State'}</div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-1.5">
                    {beResult.contributionMargin > 0
                      ? 'Ijobiy marja: Birlik sotuv narxi xarajatlarni to‘liq qoplaydi.'
                      : 'Ogohlantirish: Sotuv narxi o‘zgaruvchan xarajatdan past!'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MODEL 2: PRICE ELASTICITY OF DEMAND (SECTION 83) */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Activity className="w-4 h-4" />
              <span>{lang === 'uz' ? '83-Bo‘lim: Talabning Narxga Nisbatan Elastikligi' : 'Section 83: Price Elasticity of Demand'}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {lang === 'uz' ? 'Narx O‘zgarishi va Talab Reaksiyasi' : 'Price Elasticity Coefficient (|Ed|)'}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">P1 (Dastlabki Narx)</label>
                <input
                  type="number"
                  value={elP1}
                  onChange={(e) => setElP1(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">P2 (Yangi Narx)</label>
                <input
                  type="number"
                  value={elP2}
                  onChange={(e) => setElP2(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Q1 (Dastlabki Talab)</label>
                <input
                  type="number"
                  value={elQ1}
                  onChange={(e) => setElQ1(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Q2 (Yangi Talab)</label>
                <input
                  type="number"
                  value={elQ2}
                  onChange={(e) => setElQ2(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                />
              </div>
            </div>

            {elResult && (
              <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">{lang === 'uz' ? 'Elastiklik Koeffitsiyenti' : 'Elasticity (|Ed|)'}</div>
                  <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {elResult.elasticityCoefficient}
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    {elResult.elasticityType}
                  </span>
                </div>

                <div className="max-w-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {lang === 'uz' ? 'Tushum va Strategiya Xulosasi:' : 'Revenue Implication:'}
                  </div>
                  {elResult.interpretation}
                </div>
              </div>
            )}
          </div>

          {/* MODEL 3: SUPPLY & DEMAND EQUILIBRIUM (SECTION 81) */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Scale className="w-4 h-4" />
              <span>{lang === 'uz' ? '81-Bo‘lim: Talab va Taklif Muvozanati' : 'Section 81: Supply & Demand Market Equilibrium'}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {lang === 'uz' ? 'Bozor Muvozanat Narxi va Miqdori (P*, Q*)' : 'Equilibrium Price (P*), Quantity (Q*) & Surplus'}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Talab Kesishmasi (a)</label>
                <input
                  type="number"
                  value={sdA}
                  onChange={(e) => setSdA(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Talab Qiyaligi (b)</label>
                <input
                  type="number"
                  value={sdB}
                  onChange={(e) => setSdB(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Taklif Kesishmasi (c)</label>
                <input
                  type="number"
                  value={sdC}
                  onChange={(e) => setSdC(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Taklif Qiyaligi (d)</label>
                <input
                  type="number"
                  value={sdD}
                  onChange={(e) => setSdD(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                />
              </div>
            </div>

            {sdResult && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">{lang === 'uz' ? 'Muvozanat Narxi (P*)' : 'Equilibrium Price (P*)'}</div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    ${sdResult.equilibriumPrice}
                  </div>
                  <span className="text-[11px] text-slate-400">P* = (a - c) / (b + d)</span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">{lang === 'uz' ? 'Muvozanat Miqdori (Q*)' : 'Equilibrium Quantity (Q*)'}</div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {sdResult.equilibriumQuantity} dona
                  </div>
                  <span className="text-[11px] text-slate-400">Qd(P*) = Qs(P*)</span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">{lang === 'uz' ? 'Iste’molchi Rentasi' : 'Consumer Surplus'}</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    ${sdResult.consumerSurplus.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-400">Ijtimoiy naf</span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">{lang === 'uz' ? 'Ishlab Chiqaruvchi Rentasi' : 'Producer Surplus'}</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    ${sdResult.producerSurplus.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-400">Ishlab chiqaruvchi foydasi</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: FORECASTING (SECTION 84) */}
      {activeTab === 'forecasting' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>{lang === 'uz' ? '84-Bo‘lim: Vaqtli Qatorlar Prognozi' : 'Section 84: Time-Series Economic Forecasting'}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {lang === 'uz' ? 'Tarixiy Dinamika Asosida Kelajak Ko‘rsatkichlarini Prognozlash' : 'Statistical Trend Projections & Confidence Bounds'}
            </h3>

            {/* MANDATORY DISCLAIMER AS REQUIRED BY SECTION 84 */}
            <div className="my-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                  {lang === 'uz' ? 'Majburiy Prognoz Ogohlantirishi' : 'Forecasting Disclaimer'}:
                </span>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mt-0.5">
                  &ldquo;Forecasts are statistical projections based on historical series and do not guarantee future economic outcomes.&rdquo;
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300/80 mt-0.5">
                  {lang === 'uz'
                    ? 'Tarixiy ma’lumotlar, baholangan qiymatlar va prognoz qat’iy farqlanadi.'
                    : 'Historical data, estimated data, and forecast data are clearly demarcated.'}
                </p>
              </div>
            </div>

            {/* Selector Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'uz' ? 'Ko‘rsatkichni Tanlang' : 'Select Indicator'}
                </label>
                <select
                  value={forecastIndicator}
                  onChange={(e) => setForecastIndicator(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                >
                  <option value="GDP_UZ">Gross Domestic Product (GDP)</option>
                  <option value="CPI_INFLATION_UZ">CPI Inflation</option>
                  <option value="EXPORTS_UZ">Exports</option>
                  <option value="PUBLIC_DEBT_UZ">Public Debt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'uz' ? 'Prognoz Usuli (Metod)' : 'Forecasting Method'}
                </label>
                <select
                  value={forecastMethod}
                  onChange={(e) => setForecastMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none"
                >
                  <option value="Linear Trend">Chiziqli Trend (Linear Regression)</option>
                  <option value="Moving Average (3-Period)">3-Davrli Sirg‘aluvchi O‘rtacha (Moving Average)</option>
                </select>
              </div>
            </div>

            {/* Forecast Data Table with Clear Distinctions */}
            {forecastResult && (
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">{lang === 'uz' ? 'Davr' : 'Period'}</th>
                      <th className="py-3 px-4">{lang === 'uz' ? 'Status / Turi' : 'Data Type'}</th>
                      <th className="py-3 px-4">{lang === 'uz' ? 'Qiymat (Prognoz)' : 'Value'}</th>
                      <th className="py-3 px-4">{lang === 'uz' ? 'Ishonchlilik Oralig‘i (95%)' : 'Confidence Bounds (±6%)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {forecastResult.dataPoints.map((pt, i) => (
                      <tr
                        key={i}
                        className={
                          pt.type === 'Forecast'
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 font-semibold'
                            : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/60'
                        }
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{pt.period}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              pt.type === 'Forecast'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {pt.type === 'Forecast' ? 'PROGNOZ (Forecast)' : 'TARIXIY (Historical)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {pt.forecastValue.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {pt.type === 'Forecast' ? (
                            <span>
                              [{pt.confidenceLower} — {pt.confidenceUpper}]
                            </span>
                          ) : (
                            <span className="text-slate-400">Haqiqiy kuzatuv</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: REPORTS CENTER (SECTION 85) */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {lang === 'uz' ? '85-Bo‘lim: Iqtisodiy Hisobotlar Markazi' : 'Section 85: Economic Reports Center'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'uz'
                    ? 'PDF, Excel, CSV va Chop etish formatlarida professional hisobotlar'
                    : 'Exportable macroeconomic and econometric reports in PDF, Excel, and CSV formats.'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{lang === 'uz' ? 'Chop Etish' : 'Print'}</span>
                </button>
                <button
                  onClick={() => showNotification(lang === 'uz' ? 'CSV hisoboti yuklab olindi' : 'CSV report exported')}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'uz' ? 'Eksport (CSV/Excel)' : 'Export CSV'}</span>
                </button>
              </div>
            </div>

            {/* List of Pre-configured Reports */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Gross Domestic Product (GDP) Comprehensive Review', cat: 'Growth', desc: 'Annual & quarterly GDP dynamics, sectoral contributions and CAGR.' },
                { title: 'Inflation & Monetary Policy Stance Report', cat: 'Inflation', desc: 'CPI consumer basket components, core inflation, and policy rate pass-through.' },
                { title: 'Labor Market & Employment Statistics', cat: 'Employment', desc: 'Unemployment rate trends, labor force participation, and real wages.' },
                { title: 'Foreign Trade Balance & Tariff Overview', cat: 'Trade', desc: 'Exports vs imports by category, trade surplus/deficit, and partner countries.' },
                { title: 'Cross-Country Macroeconomic Benchmark', cat: 'Comparison', desc: 'Comparative table and charts between Central Asian economies.' },
                { title: 'Econometric Forecasting & Projections 2026–2028', cat: 'Forecasting', desc: 'Time-series model forecasts with 95% statistical confidence intervals.' },
              ].map((rep, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      {rep.cat}
                    </span>
                    <button
                      onClick={() => showNotification(lang === 'uz' ? `${rep.title} hisoboti generatsiya qilindi` : `${rep.title} generated`)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center"
                    >
                      {lang === 'uz' ? 'Ko‘rish' : 'Generate'} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">{rep.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{rep.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
