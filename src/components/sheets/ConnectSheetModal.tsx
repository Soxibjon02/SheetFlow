import React, { useState } from 'react';
import { api } from '../../services/api/client';
import { SheetPreviewResult } from '../../core/types/sheet';
import { useI18n } from '../../lib/i18n';
import {
  FileSpreadsheet,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  X,
  Layers,
  Database,
  Search,
  Clipboard,
  Info,
} from 'lucide-react';

interface ConnectSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (sheetId: string) => void;
}

export const ConnectSheetModal: React.FC<ConnectSheetModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const { t, lang } = useI18n();
  const [connectTab, setConnectTab] = useState<'url' | 'paste'>('url');
  const [sheetUrl, setSheetUrl] = useState('');
  const [pastedData, setPastedData] = useState('');
  const [customSheetName, setCustomSheetName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<SheetPreviewResult | null>(null);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputContent = connectTab === 'url' ? sheetUrl.trim() : pastedData.trim();
    if (!inputContent) return;

    setIsLoading(true);
    setErrorMsg(null);
    setPreviewData(null);

    try {
      const res = await api.previewSheet(inputContent);
      if (connectTab === 'paste' && customSheetName.trim()) {
        res.spreadsheetName = customSheetName.trim();
      }
      setPreviewData(res);
    } catch (err: any) {
      const defaultErr = lang === 'uz'
        ? 'Jadval maʼlumotlarini oʻqib boʻlmadi. Havola ochiqligini ("Anyone with the link can view") tekshiring yoki jadval katakchalarini toʻgʻridan-toʻgʻri nusxalab qoʻying.'
        : 'Unable to access sheet. Please verify URL is public ("Anyone with the link can view") or paste spreadsheet cells directly.';
      setErrorMsg(err.message || defaultErr);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!previewData) return;
    setIsLoading(true);
    try {
      const rowsToSave = (previewData.allRows && previewData.allRows.length > 0)
        ? previewData.allRows
        : previewData.sampleRows;

      const created = await api.connectSheet({
        id: previewData.spreadsheetId,
        name: previewData.spreadsheetName,
        url: previewData.spreadsheetUrl,
        selectedTab: previewData.selectedTab,
        rowCount: rowsToSave.length || previewData.rowCount,
        columnCount: previewData.columnCount,
        columns: previewData.columns,
        rows: rowsToSave,
      });
      onConnected(created.metadata.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'uz' ? 'Jadvalni ulashda xatolik yuz berdi.' : 'Failed to connect sheet.'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleSheet = (sampleKey: 'students' | 'saas' | 'expenses') => {
    const urls = {
      students: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      saas: 'https://docs.google.com/spreadsheets/d/1XyZ9874aBCdEFGhijkLMnoPQRstuvWXyz1234567890',
      expenses: 'https://docs.google.com/spreadsheets/d/1E_Expenses_Sheet_Sample_Demo_Key_9876543210',
    };
    setConnectTab('url');
    setSheetUrl(urls[sampleKey]);
    setErrorMsg(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('connectSheet')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'uz'
                  ? 'Google Sheets havolasini kiriting yoki jadval katakchalarini nusxalab qoʻying'
                  : 'Paste any Google Sheets URL or copy-paste spreadsheet table cells directly'}
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Method Selector Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 max-w-md">
            <button
              type="button"
              onClick={() => {
                setConnectTab('url');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                connectTab === 'url'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{lang === 'uz' ? 'Google Sheets Havolasi' : 'Google Sheets URL'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setConnectTab('paste');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                connectTab === 'paste'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>{lang === 'uz' ? 'Jadvalni qoʻyish (Paste)' : 'Paste Table Cells / CSV'}</span>
            </button>
          </div>

          {/* Quick Sample Selector */}
          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>{lang === 'uz' ? 'Yoki tayyor namuna jadvallar bilan sinab koʻring:' : 'Or test with sample spreadsheets:'}</span>
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => loadSampleSheet('students')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-sm"
              >
                🎓 {lang === 'uz' ? 'Talabalar Baholari' : 'Student Performance'}
              </button>
              <button
                type="button"
                onClick={() => loadSampleSheet('saas')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-sm"
              >
                📈 {lang === 'uz' ? 'SaaS Daromadlari' : 'SaaS Revenue Q3'}
              </button>
              <button
                type="button"
                onClick={() => loadSampleSheet('expenses')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-sm"
              >
                💼 {lang === 'uz' ? 'Kompaniya Xarajatlari' : 'Operational Expenses'}
              </button>
            </div>
          </div>

          {/* Form based on selected tab */}
          {connectTab === 'url' ? (
            <form onSubmit={handlePreview} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('pasteSheetUrl')}
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                  <Info className="w-3 h-3 text-emerald-500" />
                  <span>
                    {lang === 'uz'
                      ? 'Jadval sozlamalarida "Anyone with the link can view" qilingan boʻlishi kerak'
                      : 'Ensure "Anyone with the link can view" is enabled'}
                  </span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMd..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition cursor-pointer flex items-center space-x-1.5 shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span>{isLoading ? (lang === 'uz' ? 'Tekshirilmoqda...' : 'Inspecting...') : t('previewSheet')}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePreview} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'uz' ? 'Jadval Nomi' : 'Spreadsheet Name'}
                </label>
                <input
                  type="text"
                  value={customSheetName}
                  onChange={(e) => setCustomSheetName(e.target.value)}
                  placeholder={lang === 'uz' ? 'Masalan: Savdo hisoboti 2026' : 'e.g. Sales Report 2026'}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'uz'
                      ? 'Google Sheets yoki Exceldan nusxalangan katakchalarni bu yerga qoʻying (Ctrl+V):'
                      : 'Paste copied Google Sheets or Excel cells / CSV here (Ctrl+V):'}
                  </label>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {lang === 'uz' ? 'Tab yoki vergul bilan ajratilgan' : 'Supports Tab or Comma separated'}
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  placeholder={
                    lang === 'uz'
                      ? "Ism\tYosh\tShahar\tBall\nAli\t21\nToshkent\t92\nVali\t22\nSamarqand\t88"
                      : "Name\tAge\tCity\tScore\nJohn\t21\nNew York\t92\nAlice\t22\nLondon\t88"
                  }
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !pastedData.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span>{isLoading ? (lang === 'uz' ? 'Tahlil qilinmoqda...' : 'Analyzing...') : t('previewSheet')}</span>
                </button>
              </div>
            </form>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{lang === 'uz' ? 'Ulanish xatosi' : 'Access Error'}</p>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Preview Results (MODE A per Section 6) */}
          {previewData && (
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-emerald-500/30 space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {previewData.spreadsheetName}
                  </h4>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  {lang === 'uz' ? 'Ulashga tayyor' : 'Ready to Connect'}
                </span>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    {lang === 'uz' ? 'Qatorlar' : 'Rows'}
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                    {previewData.allRows ? previewData.allRows.length : previewData.rowCount}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    {lang === 'uz' ? 'Ustunlar' : 'Columns'}
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{previewData.columnCount}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    {lang === 'uz' ? 'Faol Varaq' : 'Active Tab'}
                  </p>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate mt-1">
                    {previewData.selectedTab}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    {lang === 'uz' ? 'Ruxsat darajasi' : 'Access'}
                  </p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {previewData.canEdit ? (lang === 'uz' ? 'Tahrirlovchi' : 'Editor') : (lang === 'uz' ? 'Koʻruvchi' : 'Viewer')}
                  </p>
                </div>
              </div>

              {/* Detected Columns Badges */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'uz' ? 'Aniqlangan ustunlar va turlar:' : 'Detected Columns & Types:'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {previewData.columns.map((col) => (
                    <span
                      key={col.id}
                      className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 flex items-center space-x-1.5"
                    >
                      <span className="font-medium">{col.name}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                        ({col.detectedType})
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Data Table */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'uz' ? 'Namuna yozuvlar:' : 'Sample Records:'}
                </p>
                <div className="overflow-x-auto max-h-40 border border-slate-200 dark:border-slate-800 rounded-lg scrollbar-thin">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 sticky top-0">
                      <tr>
                        {previewData.columns.map((col) => (
                          <th key={col.id} className="py-2 px-3 border-b border-slate-200 dark:border-slate-800">
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-slate-600 dark:text-slate-400">
                      {(previewData.allRows || previewData.sampleRows).slice(0, 4).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/50">
                          {previewData.columns.map((col) => (
                            <td key={col.id} className="py-1.5 px-3 truncate max-w-[140px]">
                              {String(r[col.name] ?? '-')}
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition cursor-pointer"
          >
            {t('cancel')}
          </button>
          {previewData && (
            <button
              type="button"
              onClick={handleConnect}
              disabled={isLoading}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <span>{t('connectSheet')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
