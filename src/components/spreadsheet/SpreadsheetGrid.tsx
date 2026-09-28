import React, { useState, useMemo } from 'react';
import { SheetData, SheetRow, DetectedType, ColumnDefinition } from '../../core/types/sheet';
import {
  ArrowUpDown,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Hash,
  Type,
  Calendar,
  DollarSign,
  Percent,
  Tag,
  ToggleLeft,
  HelpCircle,
} from 'lucide-react';
import { useI18n } from '../../lib/i18n';

interface SpreadsheetGridProps {
  sheetData: SheetData;
  onAddRow: (row: Record<string, any>) => Promise<void>;
  onUpdateRow: (rowIndex: number, row: Record<string, any>) => Promise<void>;
  onDeleteRow: (rowIndex: number) => Promise<void>;
  onUpdateColumnType?: (columnName: string, newType: DetectedType) => void;
}

const TYPE_ICONS: Record<DetectedType, React.ElementType> = {
  text: Type,
  number: Hash,
  currency: DollarSign,
  percentage: Percent,
  date: Calendar,
  datetime: Calendar,
  boolean: ToggleLeft,
  category: Tag,
  unknown: HelpCircle,
};

const ALL_TYPES: DetectedType[] = [
  'text',
  'number',
  'currency',
  'percentage',
  'date',
  'datetime',
  'boolean',
  'category',
];

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  sheetData,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
  onUpdateColumnType,
}) => {
  const { t, lang } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  // Row edit modal / inline state
  const [editingRow, setEditingRow] = useState<SheetRow | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [deletingRowIndex, setDeletingRowIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Type change dropdown state
  const [activeTypeDropdown, setActiveTypeDropdown] = useState<string | null>(null);

  const columns = sheetData.metadata.columns;

  // Filtered & Sorted rows
  const processedRows = useMemo(() => {
    let rows = [...sheetData.rows];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter((row) =>
        columns.some((col) => {
          const val = row[col.name];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        })
      );
    }

    // Sort
    if (sortColumn) {
      rows.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return rows;
  }, [sheetData.rows, searchTerm, sortColumn, sortDirection, columns]);

  // Pagination
  const totalPages = Math.ceil(processedRows.length / rowsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return processedRows.slice(start, start + rowsPerPage);
  }, [processedRows, currentPage]);

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  const handleSaveNewRow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onAddRow(newRowData);
      setNewRowData({});
      setIsAddModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRow) return;
    setIsSaving(true);
    try {
      await onUpdateRow(editingRow._rowIndex, editingRow);
      setEditingRow(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingRowIndex === null) return;
    setIsSaving(true);
    try {
      await onDeleteRow(deletingRowIndex);
      setDeletingRowIndex(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-md shadow-xl overflow-hidden flex flex-col transition-colors duration-200">
      {/* Top action toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/40">
        <div className="flex items-center space-x-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('searchRows')}
              className="w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {lang === 'uz' ? `Jami ${processedRows.length} ta qator` : `Showing ${processedRows.length} rows`}
          </div>
          <button
            onClick={() => {
              setNewRowData({});
              setIsAddModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addRow')}</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Table with Sticky Header */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 dark:bg-slate-950 sticky top-0 z-20 shadow-sm border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-3 w-12 text-center text-slate-500 dark:text-slate-400 font-mono font-medium border-r border-slate-200 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-950/90">
                #
              </th>
              {columns.map((col) => {
                const currentType = col.manualTypeOverride || col.detectedType;
                const Icon = TYPE_ICONS[currentType] || HelpCircle;

                return (
                  <th
                    key={col.id}
                    className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800/60 min-w-[160px] select-none hover:bg-slate-200/50 dark:hover:bg-slate-900/60 transition"
                  >
                    <div className="flex items-center justify-between group">
                      <div
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => handleSort(col.name)}
                      >
                        <span className="font-medium text-slate-900 dark:text-slate-100">{col.name}</span>
                        <ArrowUpDown
                          className={`w-3.5 h-3.5 transition-colors ${
                            sortColumn === col.name ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                          }`}
                        />
                      </div>

                      {/* Type Badge with dropdown for Manual Correction (Section 9) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveTypeDropdown(activeTypeDropdown === col.id ? null : col.id)
                          }
                          className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-slate-300 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700/60 transition cursor-pointer"
                          title="Click to override detected column type"
                        >
                          <Icon className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="capitalize">{currentType}</span>
                        </button>

                        {/* Dropdown for type override */}
                        {activeTypeDropdown === col.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl py-1 z-30">
                            <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {lang === 'uz' ? 'Turni oʻzgartirish' : 'Change Type'}
                            </div>
                            {ALL_TYPES.map((type) => {
                              const TypeI = TYPE_ICONS[type];
                              return (
                                <button
                                  key={type}
                                  onClick={() => {
                                    if (onUpdateColumnType) onUpdateColumnType(col.name, type);
                                    setActiveTypeDropdown(null);
                                  }}
                                  className={`w-full text-left px-2 py-1 text-xs flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                                    currentType === type ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <TypeI className="w-3 h-3" />
                                  <span className="capitalize">{type}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
              <th className="py-3 px-3 w-20 text-center font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/90">
                {lang === 'uz' ? 'Amallar' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="py-12 text-center text-slate-500 dark:text-slate-400">
                  {lang === 'uz' ? 'Qidiruv boʻyicha maʼlumot topilmadi.' : 'No records match your search query.'}
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row._rowIndex}
                  className="hover:bg-slate-100/70 dark:hover:bg-slate-800/40 transition group font-mono text-slate-800 dark:text-slate-300"
                >
                  <td className="py-2.5 px-3 text-center text-slate-400 dark:text-slate-500 select-none border-r border-slate-200 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-950/30">
                    {row._rowIndex}
                  </td>
                  {columns.map((col) => {
                    const rawVal = row[col.name];
                    const displayVal =
                      rawVal === null || rawVal === undefined || rawVal === ''
                        ? '-'
                        : String(rawVal);

                    return (
                      <td
                        key={col.id}
                        className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800/40 truncate max-w-[220px]"
                      >
                        {col.detectedType === 'boolean' ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                              String(rawVal).toLowerCase() === 'yes' || rawVal === true
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {displayVal}
                          </span>
                        ) : col.detectedType === 'category' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-slate-700/60">
                            {displayVal}
                          </span>
                        ) : (
                          displayVal
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5 opacity-60 group-hover:opacity-100 transition">
                      <button
                        onClick={() => setEditingRow({ ...row })}
                        className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                        title={lang === 'uz' ? 'Tahrirlash' : 'Edit Row'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingRowIndex(row._rowIndex)}
                        className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                        title={lang === 'uz' ? 'Oʻchirish' : 'Delete Row'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div>
          {lang === 'uz' ? (
            <span><strong className="text-slate-900 dark:text-slate-200">{currentPage}</strong> / {totalPages} sahifa</span>
          ) : (
            <span>Page <strong className="text-slate-900 dark:text-slate-200">{currentPage}</strong> of {totalPages}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>


      {/* Modal: Add New Row */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>{t('addRow')}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRow} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {columns.map((col) => (
                <div key={col.id} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>{col.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{col.detectedType}</span>
                  </label>
                  <input
                    type="text"
                    required={!col.nullable}
                    value={newRowData[col.name] || ''}
                    onChange={(e) =>
                      setNewRowData({ ...newRowData, [col.name]: e.target.value })
                    }
                    placeholder={`Enter ${col.name}...`}
                    className="w-full bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ))}

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-90 disabled:opacity-50 transition"
                >
                  {isSaving ? (lang === 'uz' ? 'Jadvalga saqlanmoqda...' : 'Saving to Sheets...') : t('addRow')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Row */}
      {editingRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>{lang === 'uz' ? `#${editingRow._rowIndex}-qatorni tahrirlash` : `Edit Row #${editingRow._rowIndex}`}</span>
              </h3>
              <button
                onClick={() => setEditingRow(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {columns.map((col) => (
                <div key={col.id} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>{col.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{col.detectedType}</span>
                  </label>
                  <input
                    type="text"
                    value={editingRow[col.name] !== undefined ? String(editingRow[col.name]) : ''}
                    onChange={(e) =>
                      setEditingRow({ ...editingRow, [col.name]: e.target.value })
                    }
                    className="w-full bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ))}

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-90 disabled:opacity-50 transition"
                >
                  {isSaving ? (lang === 'uz' ? 'Yangilanmoqda...' : 'Updating...') : t('saveChanges')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {deletingRowIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2 text-rose-500">
              <Trash2 className="w-5 h-5" />
              <span>{t('deleteRow')}</span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {lang === 'uz'
                ? `#${deletingRowIndex}-qatorni oʻchirishni tasdiqlaysizmi? Ushbu amal Google Sheets jadvalida ham aks etadi.`
                : `Confirm delete (Row #${deletingRowIndex}). This will update the connected Google Sheet.`}
            </p>
            <div className="pt-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeletingRowIndex(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/20 disabled:opacity-50 transition"
              >
                {isSaving ? (lang === 'uz' ? 'Oʻchirilmoqda...' : 'Deleting...') : t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

