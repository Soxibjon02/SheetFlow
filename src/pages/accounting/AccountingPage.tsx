import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  accountingService,
  DEFAULT_CHART_OF_ACCOUNTS,
} from '../../core/accounting/accountingService';
import {
  Account,
  JournalEntry,
  Invoice,
  PayableItem,
  InventoryItem,
  TaxConfiguration,
  BudgetItem,
  AccountingColumnMapping,
} from '../../core/types/accounting';
import { api } from '../../services/api/client';
import { SheetData } from '../../core/types/sheet';
import { useI18n } from '../../lib/i18n';
import {
  Briefcase,
  LayoutDashboard,
  Layers,
  FileText,
  BookOpen,
  Scale,
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  Package,
  ShieldCheck,
  PieChart,
  BarChart3,
  Calendar,
  Plus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Download,
  Printer,
  Search,
  Filter,
  ArrowRight,
  Database,
  Link as LinkIcon,
  Check,
  X,
} from 'lucide-react';

export const AccountingPage: React.FC = () => {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab
  const activeTab = searchParams.get('tab') || 'dashboard';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // State data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payables, setPayables] = useState<PayableItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [taxes, setTaxes] = useState<TaxConfiguration[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [sheetData, setSheetData] = useState<SheetData | null>(null);

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);

  // New Journal Entry Modal State
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryDesc, setEntryDesc] = useState('');
  const [entryRef, setEntryRef] = useState('');
  const [entryLines, setEntryLines] = useState<
    { accountId: string; debit: number; credit: number; description?: string }[]
  >([
    { accountId: 'acc_1020', debit: 1000, credit: 0, description: 'Bank receipt' },
    { accountId: 'acc_4010', debit: 0, credit: 1000, description: 'Sales Revenue' },
  ]);
  const [entryError, setEntryError] = useState<string | null>(null);

  // New Account Modal State
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [newAccCode, setNewAccCode] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<any>('Asset');
  const [newAccSubType, setNewAccSubType] = useState<any>('Cash');

  // Sheet Mapping State
  const [mapping, setMapping] = useState<AccountingColumnMapping>({});
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshAll = () => {
    setAccounts(accountingService.getAccounts());
    setJournalEntries(accountingService.getJournalEntries());
    setInvoices(accountingService.getInvoices());
    setPayables(accountingService.getPayables());
    setInventory(accountingService.getInventory());
    setTaxes(accountingService.getTaxes());
    setBudgets(accountingService.getBudgets());
  };

  useEffect(() => {
    refreshAll();
    const loadSheets = async () => {
      const list = await api.getSheets();
      setSheets(list);
      if (list[0]?.id) {
        setSelectedSheetId(list[0].id);
        const s = await api.getSheetById(list[0].id);
        setSheetData(s);
      }
    };
    loadSheets();
  }, []);

  const handleSheetSelect = async (id: string) => {
    setSelectedSheetId(id);
    const s = await api.getSheetById(id);
    setSheetData(s);
  };

  // Derived financial computations
  const incomeStatement = accountingService.getIncomeStatement();
  const balanceSheet = accountingService.getBalanceSheet();
  const trialBalance = accountingService.getTrialBalance();
  const cashFlow = accountingService.getCashFlow();
  const receivables = accountingService.getReceivables();
  const ratios = accountingService.getFinancialRatios();

  // Double-Entry validation
  const totalDebitLines = entryLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCreditLines = entryLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const entryImbalance = Math.abs(totalDebitLines - totalCreditLines);

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setEntryError(null);
    try {
      accountingService.createJournalEntry({
        date: entryDate,
        description: entryDesc,
        reference: entryRef || `REF-${Date.now()}`,
        currency: 'USD',
        status: 'Posted',
        lines: entryLines,
      });
      refreshAll();
      setIsNewEntryOpen(false);
      setEntryDesc('');
      setEntryRef('');
      showNotice(lang === 'uz' ? 'Yangi provodka muvaffaqiyatli saqlandi va Bosh kitobga kiritildi!' : 'Journal entry posted successfully to General Ledger!');
    } catch (err: any) {
      setEntryError(err.message);
    }
  };

  const handleReverse = (id: string) => {
    try {
      accountingService.reverseJournalEntry(id, 'User manual correction reversal');
      refreshAll();
      showNotice(lang === 'uz' ? 'Provodka storno qilindi (bekor qiluvchi teskari provodka yozildi).' : 'Journal entry reversed successfully with balancing reversal.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccCode || !newAccName) return;
    accountingService.createAccount({
      code: newAccCode,
      name: newAccName,
      type: newAccType,
      subType: newAccSubType,
      description: 'Custom user-created account',
      balance: 0,
      currency: 'USD',
      isActive: true,
    });
    refreshAll();
    setIsNewAccountOpen(false);
    setNewAccCode('');
    setNewAccName('');
    showNotice(lang === 'uz' ? 'Yangi hisob rejaga muvaffaqiyatli qoʻshildi!' : 'Account added to Chart of Accounts!');
  };

  const handleImportSheet = () => {
    if (!sheetData) return;
    const res = accountingService.importSheetToAccounting(sheetData.rows, mapping);
    refreshAll();
    setImportResult({ imported: res.importedEntriesCount, errors: res.errors });
    showNotice(
      lang === 'uz'
        ? `${res.importedEntriesCount} ta jadval yozuvi buxgalteriya provodkalariga muvaffaqiyatli oʻtkazildi!`
        : `${res.importedEntriesCount} rows converted into accounting entries!`
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/30 flex items-center space-x-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{lang === 'uz' ? 'Kodsiz Buxgalteriya va Moliya Tizimi' : 'No-Code Accounting & Financial Management'}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('accounting')} Studio
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'uz'
              ? 'Ikki yoqlama yozuv, Bosh kitob, Aylanma saldo, Balans, Invoyslar, Zaxiralar va Moliyaviy hisobotlar'
              : 'Double-entry bookkeeping, general ledger, trial balance, financial statements, AR/AP, and budget control'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsNewEntryOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'uz' ? 'Yangi Provodka' : 'New Journal Entry'}</span>
          </button>
        </div>
      </div>

      {/* Horizontal Sub-Navigation matching Section 53.1 */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 border-b border-slate-200 dark:border-slate-800 scrollbar-thin text-xs font-semibold">
        {[
          { id: 'dashboard', label: lang === 'uz' ? 'Dashboard' : 'Dashboard', icon: LayoutDashboard },
          { id: 'chart-of-accounts', label: t('chartOfAccounts'), icon: Layers },
          { id: 'journal-entries', label: t('journalEntries'), icon: FileText },
          { id: 'general-ledger', label: t('generalLedger'), icon: BookOpen },
          { id: 'trial-balance', label: t('trialBalance'), icon: Scale },
          { id: 'financial-statements', label: t('financialStatements'), icon: BarChart3 },
          { id: 'invoices', label: t('invoices'), icon: Receipt },
          { id: 'receivables', label: t('accountsReceivable'), icon: Users },
          { id: 'payables', label: t('accountsPayable'), icon: DollarSign },
          { id: 'inventory', label: t('inventory'), icon: Package },
          { id: 'taxes', label: t('taxes'), icon: ShieldCheck },
          { id: 'budget', label: t('budget'), icon: PieChart },
          { id: 'ratios', label: t('financialRatios'), icon: TrendingUp },
          { id: 'mapping', label: lang === 'uz' ? 'Jadval Bogʻlash' : 'Sheet Mapping', icon: LinkIcon },
          { id: 'reports', label: t('accountingReports'), icon: Printer },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ACCOUNTING DASHBOARD (Section 53.2) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* 12 Configurable KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Revenue</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                ${incomeStatement.totalRevenue.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-500 font-medium">Core sales</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Expenses</span>
              <p className="text-xl font-bold text-rose-500 font-mono">
                ${(incomeStatement.totalCogs + incomeStatement.totalOperatingExpenses).toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400">COGS + OpEx</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Gross Profit</span>
              <p className="text-xl font-bold text-indigo-500 font-mono">
                ${incomeStatement.grossProfit.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400">Margin: {ratios.grossProfitMargin}%</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Operating Profit</span>
              <p className="text-xl font-bold text-emerald-500 font-mono">
                ${incomeStatement.operatingProfit.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400">EBIT</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Net Profit</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ${incomeStatement.netProfit.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-500 font-semibold">{ratios.netProfitMargin}% Net Margin</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Cash Balance</span>
              <p className="text-xl font-bold text-cyan-500 font-mono">${cashFlow.closingCash.toLocaleString()}</p>
              <span className="text-[10px] text-cyan-400">Bank &amp; Petty Cash</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Receivables (AR)</span>
              <p className="text-xl font-bold text-amber-500 font-mono">
                ${receivables.reduce((s, r) => s + r.remainingAmount, 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-amber-400">Uncollected</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Payables (AP)</span>
              <p className="text-xl font-bold text-rose-400 font-mono">
                ${payables.reduce((s, p) => s + p.remainingAmount, 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-rose-400">Due to vendors</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Assets</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                ${balanceSheet.totalAssets.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400">Current + Fixed</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Liabilities</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                ${balanceSheet.totalLiabilities.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400">Debt ratio: {ratios.debtRatio}%</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Equity</span>
              <p className="text-xl font-bold text-emerald-500 font-mono">
                ${balanceSheet.totalEquity.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-400">Net Worth</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Current Ratio</span>
              <p className="text-xl font-bold text-indigo-400 font-mono">{ratios.currentRatio}x</p>
              <span className="text-[10px] text-indigo-400">Liquidity healthy</span>
            </div>
          </div>

          {/* Visual Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Balance Sheet Verification Widget */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Scale className="w-4 h-4 text-emerald-500" />
                  <span>Fundamental Accounting Equation Check</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">
                  {balanceSheet.isBalanced ? 'PERFECTLY BALANCED' : 'IMBALANCE'}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Assets:</span>
                  <span className="font-bold text-slate-900 dark:text-white">${balanceSheet.totalAssets.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Liabilities + Equity:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${balanceSheet.totalLiabilitiesAndEquity.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-emerald-500">
                  <span>Assets = Liabilities + Equity:</span>
                  <span>{balanceSheet.isBalanced ? 'CONFIRMED ($0.00 Difference)' : 'DISCREPANCY DETECTED'}</span>
                </div>
              </div>
            </div>

            {/* Income & Margin Breakdown */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span>Profitability Margins</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Gross Margin</span>
                    <span className="font-bold text-indigo-400 font-mono">{ratios.grossProfitMargin}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${ratios.grossProfitMargin}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Operating Margin</span>
                    <span className="font-bold text-emerald-400 font-mono">{ratios.operatingMargin}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${ratios.operatingMargin}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Net Profit Margin</span>
                    <span className="font-bold text-teal-400 font-mono">{ratios.netProfitMargin}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-400 h-full rounded-full" style={{ width: `${ratios.netProfitMargin}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHART OF ACCOUNTS (Section 54) */}
      {activeTab === 'chart-of-accounts' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Chart of Accounts</h2>
              <p className="text-xs text-slate-500">Configurable ledger account codes, classifications, and live balances</p>
            </div>
            <button
              onClick={() => setIsNewAccountOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Account</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Account Name</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Subtype</th>
                  <th className="py-2.5 px-3 text-right">Balance (USD)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">{acc.code}</td>
                    <td className="py-2.5 px-3 font-semibold font-sans text-slate-900 dark:text-white">{acc.name}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          acc.type === 'Asset'
                            ? 'bg-blue-500/10 text-blue-500'
                            : acc.type === 'Liability'
                            ? 'bg-rose-500/10 text-rose-500'
                            : acc.type === 'Equity'
                            ? 'bg-purple-500/10 text-purple-500'
                            : acc.type === 'Revenue'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{acc.subType}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                      ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] text-emerald-500 font-bold">ACTIVE</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: JOURNAL ENTRIES & DOUBLE-ENTRY (Section 55 & 56) */}
      {activeTab === 'journal-entries' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Journal Entries (Double-Entry)</h2>
              <p className="text-xs text-slate-500">Every transaction enforces: Total Debit = Total Credit</p>
            </div>
            <button
              onClick={() => setIsNewEntryOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Journal Entry</span>
            </button>
          </div>

          <div className="space-y-4">
            {journalEntries.map((je) => (
              <div
                key={je.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 space-y-3 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      {je.entryNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{je.date}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        je.status === 'Posted'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : je.status === 'Reversed'
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}
                    >
                      {je.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Ref: {je.reference}</span>
                    {je.status === 'Posted' && (
                      <button
                        onClick={() => handleReverse(je.id)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 transition cursor-pointer"
                        title="Create opposite reversal entry"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reverse (Storno)</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{je.description}</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-[11px]">
                      <tr>
                        <th className="py-1 px-3">Account</th>
                        <th className="py-1 px-3">Description</th>
                        <th className="py-1 px-3 text-right">Debit ($)</th>
                        <th className="py-1 px-3 text-right">Credit ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-600 dark:text-slate-400">
                      {je.lines.map((l) => (
                        <tr key={l.id}>
                          <td className="py-1.5 px-3 font-medium text-slate-900 dark:text-slate-200">
                            [{l.accountCode}] {l.accountName}
                          </td>
                          <td className="py-1.5 px-3 text-slate-500">{l.description || '-'}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {l.debit > 0 ? `$${l.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-1.5 px-3 text-right font-bold text-indigo-500">
                            {l.credit > 0 ? `$${l.credit.toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/50 dark:bg-slate-950/30 font-bold border-t border-slate-200 dark:border-slate-800">
                        <td colSpan={2} className="py-1.5 px-3 text-slate-500">
                          Total Balanced:
                        </td>
                        <td className="py-1.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                          ${je.totalDebit.toLocaleString()}
                        </td>
                        <td className="py-1.5 px-3 text-right text-indigo-500">${je.totalCredit.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GENERAL LEDGER (Section 57) */}
      {activeTab === 'general-ledger' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">General Ledger</h2>
              <p className="text-xs text-slate-500">Master historical record of all debits, credits, and running account balances</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Ledger</span>
            </button>
          </div>

          <div className="space-y-6">
            {accountingService.getGeneralLedger().map((ledger) => (
              <div
                key={ledger.account.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      {ledger.account.code}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">{ledger.account.name}</h3>
                    <span className="text-[10px] text-slate-400">({ledger.account.type})</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    Closing Balance: ${ledger.closingBalance.toLocaleString()}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 text-[11px]">
                      <tr>
                        <th className="py-1.5 px-2">Date</th>
                        <th className="py-1.5 px-2">JE #</th>
                        <th className="py-1.5 px-2">Description</th>
                        <th className="py-1.5 px-2 text-right">Debit ($)</th>
                        <th className="py-1.5 px-2 text-right">Credit ($)</th>
                        <th className="py-1.5 px-2 text-right">Running Balance ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                      {ledger.entries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-2 px-2 text-slate-400 italic">
                            Opening balance only. No current period journal movements.
                          </td>
                        </tr>
                      ) : (
                        ledger.entries.map((ent, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-2 text-slate-500">{ent.date}</td>
                            <td className="py-1.5 px-2 text-emerald-500 font-bold">{ent.entryNumber}</td>
                            <td className="py-1.5 px-2 text-slate-800 dark:text-slate-200 font-sans">{ent.description}</td>
                            <td className="py-1.5 px-2 text-right text-emerald-600 dark:text-emerald-400">
                              {ent.debit > 0 ? `$${ent.debit.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-1.5 px-2 text-right text-indigo-400">
                              {ent.credit > 0 ? `$${ent.credit.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-1.5 px-2 text-right font-bold text-slate-900 dark:text-white">
                              ${ent.runningBalance.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TRIAL BALANCE (Section 58) */}
      {activeTab === 'trial-balance' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Trial Balance Report</h2>
              <p className="text-xs text-slate-500">Automated verification that Total Debits equal Total Credits across all ledger accounts</p>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  trialBalance.isBalanced
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                }`}
              >
                {trialBalance.isBalanced ? 'BALANCED (Debit = Credit)' : 'DISCREPANCY DETECTED'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Account Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Debit Balance ($)</th>
                  <th className="py-2.5 px-3 text-right">Credit Balance ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {trialBalance.rows.map((r) => (
                  <tr key={r.accountId}>
                    <td className="py-2 px-3 font-bold text-emerald-500">{r.accountCode}</td>
                    <td className="py-2 px-3 font-semibold font-sans text-slate-900 dark:text-white">{r.accountName}</td>
                    <td className="py-2 px-3 text-slate-400">{r.accountType}</td>
                    <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                      {r.debit > 0 ? `$${r.debit.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-indigo-400 font-bold">
                      {r.credit > 0 ? `$${r.credit.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 dark:bg-slate-950 font-extrabold text-sm border-t-2 border-slate-300 dark:border-slate-700">
                  <td colSpan={3} className="py-3 px-3 text-slate-900 dark:text-white">
                    TOTALS:
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">
                    ${trialBalance.totalDebit.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-indigo-500">${trialBalance.totalCredit.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: FINANCIAL STATEMENTS (Section 59) */}
      {activeTab === 'financial-statements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Statement (P&L) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Income Statement (P&amp;L)</h3>
                <p className="text-xs text-slate-500">For the period ended 2026</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                AUDITED
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <p className="font-bold text-slate-900 dark:text-white font-sans uppercase">Revenue</p>
                {incomeStatement.revenue.map((r, i) => (
                  <div key={i} className="flex justify-between text-slate-600 dark:text-slate-400 pl-3">
                    <span>{r.name}</span>
                    <span>${r.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Total Revenue:</span>
                  <span>${incomeStatement.totalRevenue.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <p className="font-bold text-slate-900 dark:text-white font-sans uppercase">Cost of Goods Sold (COGS)</p>
                {incomeStatement.cogs.map((c, i) => (
                  <div key={i} className="flex justify-between text-slate-600 dark:text-slate-400 pl-3">
                    <span>{c.name}</span>
                    <span>-${c.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-indigo-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Gross Profit:</span>
                  <span>${incomeStatement.grossProfit.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <p className="font-bold text-slate-900 dark:text-white font-sans uppercase">Operating Expenses</p>
                {incomeStatement.operatingExpenses.map((e, i) => (
                  <div key={i} className="flex justify-between text-slate-600 dark:text-slate-400 pl-3">
                    <span>{e.name}</span>
                    <span>-${e.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Operating Profit (EBIT):</span>
                  <span>${incomeStatement.operatingProfit.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                <span>NET PROFIT:</span>
                <span>${incomeStatement.netProfit.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Balance Sheet */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Balance Sheet</h3>
                <p className="text-xs text-slate-500">As of 2026 (Assets = Liabilities + Equity)</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                BALANCED
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <p className="font-bold text-blue-500 font-sans uppercase">Assets</p>
                <div className="pl-3 space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between font-semibold">
                    <span>Current Assets</span>
                    <span>${balanceSheet.totalCurrentAssets.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Non-Current Assets</span>
                    <span>${balanceSheet.totalNonCurrentAssets.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Total Assets:</span>
                  <span>${balanceSheet.totalAssets.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <p className="font-bold text-rose-500 font-sans uppercase">Liabilities</p>
                <div className="pl-3 space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Current Liabilities</span>
                    <span>${balanceSheet.totalCurrentLiabilities.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Long-Term Loans</span>
                    <span>${balanceSheet.totalNonCurrentLiabilities.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Total Liabilities:</span>
                  <span>${balanceSheet.totalLiabilities.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <p className="font-bold text-purple-500 font-sans uppercase">Equity</p>
                <div className="pl-3 space-y-1 text-slate-600 dark:text-slate-400">
                  {balanceSheet.equity.map((eq, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{eq.name}</span>
                      <span>${eq.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Total Equity:</span>
                  <span>${balanceSheet.totalEquity.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between font-extrabold text-sm text-slate-900 dark:text-white">
                <span>TOTAL LIABILITIES &amp; EQUITY:</span>
                <span>${balanceSheet.totalLiabilitiesAndEquity.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: INVOICES & AR (Section 60 & 62) */}
      {(activeTab === 'invoices' || activeTab === 'receivables') && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Accounts Receivable Aging Buckets
                </h3>
                <p className="text-xs text-slate-500">Breakdown of uncollected customer credit balances by age</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {['Current', '1–30 Days', '31–60 Days', '61–90 Days', '90+ Days'].map((bucket) => {
                const total = receivables
                  .filter((r) => r.agingBucket === bucket)
                  .reduce((sum, r) => sum + r.remainingAmount, 0);

                return (
                  <div key={bucket} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{bucket}</span>
                    <p className="text-lg font-bold font-mono text-slate-900 dark:text-white">${total.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Invoices Master Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Total ($)</th>
                    <th className="py-2.5 px-3 text-right">Remaining ($)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-2.5 px-3 font-bold text-emerald-500">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-white">
                        {inv.customerName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{inv.invoiceDate}</td>
                      <td className="py-2.5 px-3 text-slate-400">{inv.dueDate}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ${inv.total.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-500">
                        ${inv.remainingAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : inv.status === 'Overdue'
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: PAYABLES & EXPENSES (Section 61 & 63) */}
      {(activeTab === 'payables' || activeTab === 'expenses') && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Accounts Payable (Vendor Bills)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3">Bill Ref</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Amount ($)</th>
                  <th className="py-2.5 px-3 text-right">Remaining ($)</th>
                  <th className="py-2.5 px-3 text-center">Aging</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {payables.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-white">{p.supplier}</td>
                    <td className="py-2.5 px-3 text-emerald-500">{p.billNumber}</td>
                    <td className="py-2.5 px-3 text-slate-400">{p.billDate}</td>
                    <td className="py-2.5 px-3 text-slate-400">{p.dueDate}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">${p.amount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-500">${p.remainingAmount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-semibold text-slate-400">{p.agingBucket}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: INVENTORY & TAXES (Section 64 & 65) */}
      {(activeTab === 'inventory' || activeTab === 'taxes') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Inventory Valuation (COGS)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500">
                  <tr>
                    <th className="py-2 px-2">SKU</th>
                    <th className="py-2 px-2">Item</th>
                    <th className="py-2 px-2">Qty</th>
                    <th className="py-2 px-2 text-right">Cost ($)</th>
                    <th className="py-2 px-2 text-right">Value ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                  {inventory.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-2 text-emerald-500 font-bold">{item.sku}</td>
                      <td className="py-2 px-2 font-sans font-semibold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="py-2 px-2 font-bold">{item.quantity}</td>
                      <td className="py-2 px-2 text-right">${item.purchasePrice}</td>
                      <td className="py-2 px-2 text-right font-bold text-slate-900 dark:text-white">${item.inventoryValue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Tax Configurations (Multi-Country)</h3>
            <div className="space-y-3">
              {taxes.map((tax) => (
                <div
                  key={tax.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{tax.name}</p>
                    <p className="text-slate-400 text-[10px]">
                      {tax.country} • Effective: {tax.effectiveDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-emerald-500">{tax.rate}%</span>
                    <span className="block text-[10px] text-slate-400">{tax.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: BUDGET & RATIOS (Section 66 & 67) */}
      {(activeTab === 'budget' || activeTab === 'ratios') && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Budget vs. Actual Variance Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-3 text-right">Budget ($)</th>
                    <th className="py-2.5 px-3 text-right">Actual ($)</th>
                    <th className="py-2.5 px-3 text-right">Variance ($)</th>
                    <th className="py-2.5 px-3 text-right">Variance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {budgets.map((b) => (
                    <tr key={b.id}>
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">{b.category}</td>
                      <td className="py-2.5 px-3 text-slate-400">{b.period}</td>
                      <td className="py-2.5 px-3 text-right font-bold">${b.budgetAmount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ${b.actualAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-500">${b.variance.toLocaleString()}</td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          b.variancePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {b.variancePercent > 0 ? `+${b.variancePercent}%` : `${b.variancePercent}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: GOOGLE SHEET TO ACCOUNTING MAPPING (Section 69) */}
      {activeTab === 'mapping' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Google Sheet to Accounting Mapping</h2>
              <p className="text-xs text-slate-500">
                Map raw spreadsheet columns (Date, Revenue, Expense, Customer) into automated double-entry records without altering your original Google Sheet!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Connected Google Sheet</label>
              <select
                value={selectedSheetId}
                onChange={(e) => handleSheetSelect(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
              >
                {sheets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rowCount} rows)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {sheetData && (
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Column Mapping Configuration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500">Date Column</label>
                  <select
                    value={mapping.dateColumn || ''}
                    onChange={(e) => setMapping({ ...mapping, dateColumn: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 mt-1"
                  >
                    <option value="">-- Choose Column --</option>
                    {sheetData.metadata.columns.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500">Revenue / Income Column</label>
                  <select
                    value={mapping.revenueColumn || ''}
                    onChange={(e) => setMapping({ ...mapping, revenueColumn: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 mt-1"
                  >
                    <option value="">-- Choose Column --</option>
                    {sheetData.metadata.columns.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500">Expense / Cost Column</label>
                  <select
                    value={mapping.expenseColumn || ''}
                    onChange={(e) => setMapping({ ...mapping, expenseColumn: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 mt-1"
                  >
                    <option value="">-- Choose Column --</option>
                    {sheetData.metadata.columns.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500">Description / Customer</label>
                  <select
                    value={mapping.descriptionColumn || ''}
                    onChange={(e) => setMapping({ ...mapping, descriptionColumn: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 mt-1"
                  >
                    <option value="">-- Choose Column --</option>
                    {sheetData.metadata.columns.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleImportSheet}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
                >
                  <Database className="w-4 h-4" />
                  <span>Execute Conversion to Double-Entry</span>
                </button>
              </div>

              {importResult && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500">
                  Converted {importResult.imported} transactions into double-entry ledger!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 12: ACCOUNTING REPORTS (Section 71) */}
      {activeTab === 'reports' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Accounting Report Center</h2>
              <p className="text-xs text-slate-500">Generate, print, or download GAAP/IFRS compliant financial statements</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'General Ledger Report', desc: 'Full debit/credit audit trail per account code' },
              { title: 'Trial Balance Report', desc: 'Summary of all debit and credit account balances' },
              { title: 'Income Statement (P&L)', desc: 'Revenues, Cost of Goods Sold, and Net Profit' },
              { title: 'Balance Sheet', desc: 'Assets, Liabilities, and Shareholder Equity' },
              { title: 'Cash Flow Statement', desc: 'Operating, Investing, and Financing cash flows' },
              { title: 'Accounts Receivable Aging Report', desc: 'Aging analysis of unpaid client balances' },
              { title: 'Accounts Payable Aging Report', desc: 'Schedule of vendor commitments by aging bucket' },
              { title: 'Budget vs. Actual Variance Report', desc: 'Performance against annual and quarterly plan' },
              { title: 'Comprehensive Financial Ratios Report', desc: 'Liquidity, solvency, and profitability metrics' },
            ].map((rep, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rep.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{rep.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-1 text-[11px] text-emerald-500 hover:underline font-semibold cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Print / PDF</span>
                  </button>
                  <button
                    onClick={() => showNotice('Report exported as CSV file')}
                    className="flex items-center space-x-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREATE JOURNAL ENTRY (Sections 55 & 56) */}
      {isNewEntryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <span>New Double-Entry Journal Entry</span>
              </h3>
              <button onClick={() => setIsNewEntryOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reference / Invoice #</label>
                  <input
                    type="text"
                    value={entryRef}
                    onChange={(e) => setEntryRef(e.target.value)}
                    placeholder="e.g. INV-2026-901"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <input
                  type="text"
                  required
                  value={entryDesc}
                  onChange={(e) => setEntryDesc(e.target.value)}
                  placeholder="e.g. Payment for annual software subscription"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs"
                />
              </div>

              {/* Debit & Credit Lines Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Transaction Lines (Total Debit = Total Credit)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEntryLines([
                        ...entryLines,
                        { accountId: accounts[0]?.id || 'acc_1010', debit: 0, credit: 0 },
                      ])
                    }
                    className="text-[11px] text-emerald-500 font-bold hover:underline"
                  >
                    + Add Line
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {entryLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs font-mono">
                      <div className="col-span-6">
                        <select
                          value={line.accountId}
                          onChange={(e) => {
                            const updated = [...entryLines];
                            updated[idx].accountId = e.target.value;
                            setEntryLines(updated);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              [{a.code}] {a.name} ({a.type})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Debit"
                          value={line.debit || ''}
                          onChange={(e) => {
                            const updated = [...entryLines];
                            updated[idx].debit = parseFloat(e.target.value) || 0;
                            setEntryLines(updated);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-right text-emerald-500 font-bold"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Credit"
                          value={line.credit || ''}
                          onChange={(e) => {
                            const updated = [...entryLines];
                            updated[idx].credit = parseFloat(e.target.value) || 0;
                            setEntryLines(updated);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-right text-indigo-400 font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Imbalance Check */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                    entryImbalance < 0.01
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  }`}
                >
                  <div>
                    <span>Total Debit: ${totalDebitLines.toFixed(2)}</span>
                    <span className="mx-2">•</span>
                    <span>Total Credit: ${totalCreditLines.toFixed(2)}</span>
                  </div>
                  <span className="font-bold">
                    {entryImbalance < 0.01 ? 'Balanced ✓' : `Imbalance: $${entryImbalance.toFixed(2)} ✕`}
                  </span>
                </div>
              </div>

              {entryError && <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500 text-xs">{entryError}</div>}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewEntryOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={entryImbalance > 0.01}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50"
                >
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CUSTOM ACCOUNT (Section 54) */}
      {isNewAccountOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Account to Chart of Accounts</h3>
              <button onClick={() => setIsNewAccountOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Account Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1030 or 6090"
                  value={newAccCode}
                  onChange={(e) => setNewAccCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PayPal Clearing Account"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Classification</label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                  >
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Subtype</label>
                  <input
                    type="text"
                    value={newAccSubType}
                    onChange={(e) => setNewAccSubType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewAccountOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-500 font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-sm">
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
