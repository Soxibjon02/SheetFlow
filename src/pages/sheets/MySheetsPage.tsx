import React, { useState, useEffect } from 'react';
import { api } from '../../services/api/client';
import { useI18n } from '../../lib/i18n';
import { ConnectSheetModal } from '../../components/sheets/ConnectSheetModal';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const MySheetsPage: React.FC = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [sheets, setSheets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

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

  const handleRefresh = async (sheetId: string) => {
    setRefreshingId(sheetId);
    try {
      await api.refreshSheet(sheetId);
      await fetchSheets();
    } finally {
      setRefreshingId(null);
    }
  };

  const [notification, setNotification] = useState<string | null>(null);
  const [deletingSheet, setDeletingSheet] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSheet) return;
    setIsDeleting(true);
    try {
      await api.deleteSheet(deletingSheet.id);
      setSheets((prev) => prev.filter((s) => s.id !== deletingSheet.id));
      showNotice(
        lang === 'uz'
          ? `✓ "${deletingSheet.name}" jadvali butunlay o‘chirildi.`
          : `✓ Sheet "${deletingSheet.name}" deleted.`
      );
      setDeletingSheet(null);
    } catch (err: any) {
      alert(err.message || 'Error deleting sheet');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSheets = sheets.filter((s) =>
    s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (s.url && s.url.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/30 flex items-center space-x-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('mySheets')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'uz'
              ? 'Hisob-kitoblar va tahlillar uchun ulangan Google jadvallari'
              : 'Connected Google Spreadsheets available for calculations and analyses'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('connectSheet')}</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center space-x-3 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={lang === 'uz' ? 'Ulangan jadvallarni qidirish...' : 'Filter connected sheets...'}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && sheets.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm font-medium">
            {lang === 'uz' ? 'Jadvallar yuklanmoqda...' : 'Loading connected sheets...'}
          </p>
        </div>
      ) : filteredSheets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {searchFilter
                ? (lang === 'uz' ? 'Qidiruv bo‘yicha jadval topilmadi' : 'No matching sheets found')
                : (lang === 'uz' ? 'Hech qanday jadval ulanmagan' : 'No spreadsheets connected')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {searchFilter
                ? (lang === 'uz' ? 'Boshqa so‘z bilan qidirib ko‘ring yoki filtrni tozalang.' : 'Try a different search term or clear the filter.')
                : (lang === 'uz' ? 'Google Sheets jadvalingiz havolasini ulab, hisob-kitoblarni boshlang.' : 'Connect your first Google Spreadsheet to begin analyzing.')}
            </p>
          </div>
          {!searchFilter && (
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('connectSheet')}</span>
            </button>
          )}
        </div>
      ) : (
        /* Sheets Table / Card Grid */
        <div className="grid grid-cols-1 gap-4">
          {filteredSheets.map((sheet) => (
            <div
              key={sheet.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 backdrop-blur-md p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm"
            >
              {/* Sheet Info */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3
                      className="text-base font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                      onClick={() => navigate(`/sheets/${sheet.id}`)}
                    >
                      {sheet.name}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {lang === 'uz' ? 'Faol' : 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-md">
                    {sheet.url || (lang === 'uz' ? 'Ichki Maʼlumotlar Toʻplami' : 'Internal Dataset')}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {lang === 'uz' ? 'Varaq: ' : 'Tab: '}
                        <strong className="text-slate-900 dark:text-white">{sheet.selectedTab || 'Sheet1'}</strong>
                      </span>
                    </div>
                    <div>
                      <span>
                        {lang === 'uz' ? 'Qatorlar: ' : 'Rows: '}
                        <strong className="text-slate-900 dark:text-white font-mono">{sheet.rowCount}</strong>
                      </span>
                    </div>
                    <div>
                      <span>
                        {lang === 'uz' ? 'Ustunlar: ' : 'Columns: '}
                        <strong className="text-slate-900 dark:text-white font-mono">{sheet.columnCount}</strong>
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {lang === 'uz' ? 'Sinxronlangan: ' : 'Synced: '}
                        {sheet.lastSyncedAt
                          ? new Date(sheet.lastSyncedAt).toLocaleTimeString()
                          : (lang === 'uz' ? 'Yaqinda' : 'Recently')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
                <Link
                  to={`/sheets/${sheet.id}`}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
                >
                  {t('viewSpreadsheet')}
                </Link>
                <button
                  onClick={() => handleRefresh(sheet.id)}
                  disabled={refreshingId === sheet.id}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition disabled:opacity-40 cursor-pointer"
                  title={lang === 'uz' ? 'Google Sheetsdan yangilash' : 'Refresh from Google Sheets'}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${refreshingId === sheet.id ? 'animate-spin text-emerald-500' : ''}`}
                  />
                </button>
                <button
                  onClick={() => setDeletingSheet({ id: sheet.id, name: sheet.name })}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition cursor-pointer"
                  title={lang === 'uz' ? 'Jadvalni oʻchirish' : 'Delete Sheet'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={() => !isDeleting && setDeletingSheet(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {lang === 'uz' ? 'Jadvalni o‘chirishni tasdiqlaysizmi?' : 'Confirm Sheet Deletion'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {lang === 'uz' ? (
                  <>
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">"{deletingSheet.name}"</strong> nomli jadval va unga tegishli maʼlumotlar tizimdan butunlay o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.
                  </>
                ) : (
                  <>
                    Spreadsheet <strong className="text-slate-800 dark:text-slate-200 font-semibold">"{deletingSheet.name}"</strong> and its associated data will be permanently removed. This cannot be undone.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingSheet(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {lang === 'uz' ? 'Bekor qilish' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'uz' ? 'Ha, o‘chirilsin' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Modal */}
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
