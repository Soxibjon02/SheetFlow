import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Hash,
  Type,
  Calendar,
  DollarSign,
  Percent,
  Tag,
  ToggleLeft,
  HelpCircle,
  Undo2,
  Redo2,
  Sparkles,
  CloudUpload,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Database,
  Table,
  Copy,
} from 'lucide-react';
import { api } from '../../services/api/client';
import { useI18n } from '../../lib/i18n';
import {
  checkDataQuality,
  getProposedCleaningActions,
  applyDataCleaning,
  CleaningOptions,
} from '../../core/cleaner/dataCleaner';

interface SpreadsheetGridProps {
  sheetData: SheetData;
  onSaveToGoogleSheet?: (rows: Record<string, any>[], columns: ColumnDefinition[]) => Promise<void>;
  onRefresh?: () => Promise<void>;
  onAddRow?: (row: Record<string, any>) => Promise<void>;
  onUpdateRow?: (rowIndex: number, row: Record<string, any>) => Promise<void>;
  onDeleteRow?: (rowIndex: number) => Promise<void>;
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

interface HistorySnapshot {
  rows: Record<string, any>[];
  columns: ColumnDefinition[];
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  sheetData,
  onSaveToGoogleSheet,
  onRefresh,
  onUpdateColumnType,
}) => {
  const { t, lang } = useI18n();
  const isUz = lang === 'uz';

  // Local-First State (Section 15)
  const [localRows, setLocalRows] = useState<Record<string, any>[]>(() =>
    sheetData.rows.map((r) => ({ ...r }))
  );
  const [localColumns, setLocalColumns] = useState<ColumnDefinition[]>(() => [
    ...sheetData.metadata.columns,
  ]);

  // Initial snapshot to track unsaved changes
  const [savedSnapshot, setSavedSnapshot] = useState<HistorySnapshot>({
    rows: sheetData.rows.map((r) => ({ ...r })),
    columns: [...sheetData.metadata.columns],
  });

  // Undo / Redo history stack (Section 42)
  const [history, setHistory] = useState<HistorySnapshot[]>([
    {
      rows: sheetData.rows.map((r) => ({ ...r })),
      columns: [...sheetData.metadata.columns],
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Sync if sheetData prop changes externally
  useEffect(() => {
    const copyRows = sheetData.rows.map((r) => ({ ...r }));
    const copyCols = [...sheetData.metadata.columns];
    setLocalRows(copyRows);
    setLocalColumns(copyCols);
    setSavedSnapshot({ rows: copyRows, columns: copyCols });
    setHistory([{ rows: copyRows, columns: copyCols }]);
    setHistoryIndex(0);
  }, [sheetData.metadata.id, sheetData.metadata.lastSyncedAt]);

  const pushState = (newRows: Record<string, any>[], newCols: ColumnDefinition[]) => {
    const newSnapshot = {
      rows: newRows.map((r) => ({ ...r })),
      columns: [...newCols],
    };
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newSnapshot);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setLocalRows(newRows);
    setLocalColumns(newCols);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setLocalRows(prev.rows.map((r) => ({ ...r })));
      setLocalColumns([...prev.columns]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setLocalRows(next.rows.map((r) => ({ ...r })));
      setLocalColumns([...next.columns]);
    }
  };

  // Keyboard shortcut for Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Compute Unsaved Changes (Section 15 - including deleted rows, renamed columns)
  const unsavedDiff = useMemo(() => {
    let cellsChanged = 0;
    const newRowsCount = Math.max(0, localRows.length - savedSnapshot.rows.length);
    const deletedRowsCount = Math.max(0, savedSnapshot.rows.length - localRows.length);
    const newColsCount = Math.max(0, localColumns.length - savedSnapshot.columns.length);
    const deletedColsCount = Math.max(0, savedSnapshot.columns.length - localColumns.length);

    const minRows = Math.min(localRows.length, savedSnapshot.rows.length);
    for (let i = 0; i < minRows; i++) {
      const cur = localRows[i];
      const orig = savedSnapshot.rows[i];
      if (orig && cur) {
        for (const col of savedSnapshot.columns) {
          if (cur[col.name] !== orig[col.name]) {
            cellsChanged++;
          }
        }
      }
    }

    const colsRenamed = localColumns.some((col, idx) => {
      const origCol = savedSnapshot.columns[idx];
      return origCol && origCol.name !== col.name;
    });

    const hasUnsaved =
      cellsChanged > 0 ||
      newRowsCount > 0 ||
      deletedRowsCount > 0 ||
      newColsCount > 0 ||
      deletedColsCount > 0 ||
      colsRenamed ||
      localRows.length !== savedSnapshot.rows.length ||
      localColumns.length !== savedSnapshot.columns.length;

    return {
      hasUnsaved,
      cellsChanged,
      newRowsCount,
      deletedRowsCount,
      newColsCount,
      deletedColsCount,
      colsRenamed,
    };
  }, [localRows, localColumns, savedSnapshot]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [filterOperator, setFilterOperator] = useState<string>('contains');
  const [filterValue, setFilterValue] = useState<string>('');

  // Modals
  const [isAddRowModalOpen, setIsAddRowModalOpen] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<DetectedType>('text');
  const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
  const [deletingRow, setDeletingRow] = useState<Record<string, any> | null>(null);
  const [deletingRowIndex, setDeletingRowIndex] = useState<number | null>(null);
  const [renamingCol, setRenamingCol] = useState<{ oldName: string; newName: string } | null>(null);

  // Save to Google Sheet Modal state (Section 16)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSavingGoogleSheet, setIsSavingGoogleSheet] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem(`sheetflow_webhook_${sheetData.metadata.id}`) ||
        localStorage.getItem('sheetflow_global_webhook') ||
        ''
      );
    }
    return '';
  });
  const [isAppsScriptGuideOpen, setIsAppsScriptGuideOpen] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Clean Data Modal state (Section 11)
  const [isCleanModalOpen, setIsCleanModalOpen] = useState(false);
  const [cleanOptions, setCleanOptions] = useState<CleaningOptions>({
    trimSpaces: true,
    removeDuplicateRows: true,
    convertNumbersAsText: true,
    normalizeDates: true,
    removeEmptyRows: true,
  });

  // Type dropdown
  const [activeTypeDropdown, setActiveTypeDropdown] = useState<string | null>(null);

  // Filtered & Sorted rows
  const processedRows = useMemo(() => {
    let rows = [...localRows];

    // Search filter across all columns
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter((row) =>
        localColumns.some((col) => {
          const val = row[col.name];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        })
      );
    }

    // Explicit Column Filter (Section 18)
    if (activeFilterCol && filterValue.trim()) {
      const qVal = filterValue.toLowerCase().trim();
      const numQ = parseFloat(qVal);

      rows = rows.filter((r) => {
        const raw = r[activeFilterCol];
        if (raw === null || raw === undefined) return false;
        const sVal = String(raw).toLowerCase().trim();
        const numVal = parseFloat(String(raw).replace(/[\$,€,UZS,%,]/g, ''));

        switch (filterOperator) {
          case 'equals':
            return sVal === qVal;
          case 'not_equals':
            return sVal !== qVal;
          case 'contains':
            return sVal.includes(qVal);
          case 'not_contains':
            return !sVal.includes(qVal);
          case 'greater_than':
            return !isNaN(numVal) && !isNaN(numQ) && numVal > numQ;
          case 'less_than':
            return !isNaN(numVal) && !isNaN(numQ) && numVal < numQ;
          case 'greater_than_or_equal':
            return !isNaN(numVal) && !isNaN(numQ) && numVal >= numQ;
          case 'less_than_or_equal':
            return !isNaN(numVal) && !isNaN(numQ) && numVal <= numQ;
          default:
            return true;
        }
      });
    }

    // Sort (Section 19)
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
  }, [localRows, localColumns, searchTerm, activeFilterCol, filterOperator, filterValue, sortColumn, sortDirection]);

  // Data Quality Report for Clean Data
  const qualityReport = useMemo(() => {
    return checkDataQuality(localRows, localColumns);
  }, [localRows, localColumns]);

  const proposedCleaning = useMemo(() => {
    return getProposedCleaningActions(qualityReport);
  }, [qualityReport]);

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

  // 1. Add Row Handler (Local-First)
  const handleConfirmAddRow = (e: React.FormEvent) => {
    e.preventDefault();
    const maxIndex = localRows.reduce((max, r) => Math.max(max, Number(r._rowIndex) || 0), 1);
    const rowToAdd = {
      ...newRowData,
      _rowIndex: maxIndex + 1,
      id: `row_local_${Date.now()}`,
    };
    pushState([...localRows, rowToAdd], localColumns);
    setNewRowData({});
    setIsAddRowModalOpen(false);
  };

  // 2. Add Column Handler (Local-First)
  const handleConfirmAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const colName = newColName.trim();
    if (!colName) return;

    if (localColumns.some((c) => c.name.toLowerCase() === colName.toLowerCase())) {
      alert(isUz ? 'Bunday ustun nomi mavjud!' : 'A column with this name already exists.');
      return;
    }

    const newCol: ColumnDefinition = {
      id: `col_${Date.now()}`,
      name: colName,
      index: localColumns.length,
      detectedType: newColType,
      nullable: true,
      nullCount: localRows.length,
      uniqueCount: 0,
      sampleValues: [],
    };

    const updatedRows = localRows.map((r) => ({
      ...r,
      [colName]: null,
    }));

    pushState(updatedRows, [...localColumns, newCol]);
    setNewColName('');
    setIsAddColModalOpen(false);
  };

  // 3. Edit Row Handler (Local-First)
  const handleConfirmEditRow = () => {
    if (!editingRow) return;
    const idx = localRows.findIndex((r) => r._rowIndex === editingRow._rowIndex || r.id === editingRow.id);
    if (idx >= 0) {
      const updated = [...localRows];
      updated[idx] = { ...editingRow };
      pushState(updated, localColumns);
    }
    setEditingRow(null);
  };

  // 4. Delete Row Handler (Local-First)
  const handleConfirmDeleteRow = () => {
    if (!deletingRow && deletingRowIndex === null) return;
    const targetIdx = deletingRow?._rowIndex || deletingRowIndex;
    const updated = localRows.filter((r) => {
      if (deletingRow && r === deletingRow) return false;
      if (targetIdx !== null && (r._rowIndex === targetIdx || r.id === targetIdx)) return false;
      return true;
    });
    pushState(updated, localColumns);
    setDeletingRow(null);
    setDeletingRowIndex(null);
  };

  // Promote Row 1 to Headers
  const handlePromoteRowToHeaders = () => {
    if (localRows.length === 0) return;
    const firstRow = localRows[0];
    const newCols: ColumnDefinition[] = localColumns.map((col) => {
      const rawVal = firstRow[col.name];
      const name =
        rawVal !== null && rawVal !== undefined && String(rawVal).trim().length > 0
          ? String(rawVal).trim()
          : col.name;
      return {
        ...col,
        name,
        displayName: name,
      };
    });

    const remainingRows = localRows.slice(1);
    const updatedRows = remainingRows.map((row, rIdx) => {
      const newRow: SheetRow = { _rowIndex: rIdx + 2 };
      localColumns.forEach((col, idx) => {
        newRow[newCols[idx].name] = row[col.name];
      });
      return newRow;
    });

    pushState(updatedRows, newCols);
    setSaveSuccessMessage(
      isUz
        ? '✓ 1-qator ustun nomlari sifatida o‘rnatildi!'
        : '✓ Row 1 promoted to column headers!'
    );
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // Rename Column Handler
  const handleConfirmRenameCol = () => {
    if (!renamingCol || !renamingCol.newName.trim()) return;
    const { oldName, newName } = renamingCol;
    const trimmedNew = newName.trim();
    if (oldName === trimmedNew) {
      setRenamingCol(null);
      return;
    }

    const updatedCols = localColumns.map((c) =>
      c.name === oldName ? { ...c, name: trimmedNew, displayName: trimmedNew } : c
    );

    const updatedRows = localRows.map((r) => {
      const copy = { ...r };
      copy[trimmedNew] = copy[oldName];
      delete copy[oldName];
      return copy;
    });

    pushState(updatedRows, updatedCols);
    setRenamingCol(null);
  };

  // 5. Column Type Override (Local-First)
  const handleColumnTypeChange = (colName: string, type: DetectedType) => {
    const updatedCols = localColumns.map((c) => {
      if (c.name === colName) {
        return { ...c, manualTypeOverride: type, detectedType: type };
      }
      return c;
    });
    pushState(localRows, updatedCols);
    if (onUpdateColumnType) {
      onUpdateColumnType(colName, type);
    }
    setActiveTypeDropdown(null);
  };

  // 6. Clean Data Execution (Section 11)
  const handleExecuteCleanData = () => {
    const result = applyDataCleaning(localRows, localColumns, cleanOptions);
    pushState(result.cleanedRows, localColumns);
    setIsCleanModalOpen(false);
    setSaveSuccessMessage(
      isUz
        ? `Tozalash muvaffaqiyatli bajarildi: ${result.summary.join(', ')}`
        : `Cleaning applied locally: ${result.summary.join(', ')}`
    );
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // 7. Save to Google Sheet (Section 16)
  const handleSaveToGoogleSheet = async () => {
    setIsSavingGoogleSheet(true);
    setSaveErrorMessage(null);
    try {
      if (onSaveToGoogleSheet) {
        await onSaveToGoogleSheet(localRows, localColumns);
      }

      // Live sync to Google Sheets (via Webhook or API)
      const syncResult = await api.syncGoogleSheet(sheetData.metadata.id, {
        tabName: sheetData.metadata.selectedTab,
        headers: localColumns.map((c) => c.name),
        rows: localRows,
        webhookUrl: webhookUrl || undefined,
      });

      setSavedSnapshot({
        rows: localRows.map((r) => ({ ...r })),
        columns: [...localColumns],
      });
      setIsSaveModalOpen(false);

      if (syncResult.synced) {
        setSaveSuccessMessage(
          isUz
            ? '✓ Barcha o‘zgarishlar Google Sheets va Neon bazasiga yuklandi!'
            : '✓ All changes successfully synced to Google Sheets and Neon DB!'
        );
      } else {
        setSaveSuccessMessage(
          isUz
            ? '✓ O‘zgarishlar Neon Postgres bazasiga to‘liq saqlandi!'
            : '✓ Changes saved to Neon Postgres database!'
        );
      }
      setTimeout(() => setSaveSuccessMessage(null), 5000);
    } catch (err: any) {
      setSaveErrorMessage(
        isUz
          ? `Saqlashda xatolik: ${err.message || 'Xatolik yuz berdi'}`
          : `Save failed: ${err.message || 'An error occurred'}`
      );
    } finally {
      setIsSavingGoogleSheet(false);
    }
  };

  // 8. Export CSV (Section 43)
  const handleDownloadCsv = () => {
    const headers = localColumns.map((c) => `"${c.name.replace(/"/g, '""')}"`).join(',');
    const rowsText = processedRows.map((row) =>
      localColumns
        .map((col) => {
          const val = row[col.name];
          if (val === null || val === undefined) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = [headers, ...rowsText].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${sheetData.metadata.name.replace(/\s+/g, '_')}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 9. Copy to Clipboard for Google Sheets (Ctrl+C TSV)
  const handleCopyTsv = async () => {
    try {
      const headers = localColumns.map((c) => c.name).join('\t');
      const rowsText = processedRows.map((row) =>
        localColumns.map((col) => row[col.name] !== undefined && row[col.name] !== null ? String(row[col.name]) : '').join('\t')
      );
      const tsvContent = [headers, ...rowsText].join('\n');
      await navigator.clipboard.writeText(tsvContent);
      setSaveSuccessMessage(
        isUz
          ? '✓ Katakchalar nusxalandi! Google Sheets-ga to‘g‘ridan-to‘g‘ri (Ctrl+V) qo‘yishingiz mumkin.'
          : '✓ Copied to clipboard! You can paste directly (Ctrl+V) into Google Sheets.'
      );
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch {
      handleDownloadCsv();
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-md shadow-xl overflow-hidden flex flex-col transition-colors duration-200">
      {/* UNSAVED CHANGES BANNER (Section 15) */}
      {unsavedDiff.hasUnsaved && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>
              {isUz ? 'Saqlanmagan o‘zgarishlar:' : 'Unsaved local changes:'}{' '}
              {[
                unsavedDiff.cellsChanged > 0 &&
                  (isUz ? `${unsavedDiff.cellsChanged} ta katak o‘zgardi` : `${unsavedDiff.cellsChanged} cells changed`),
                unsavedDiff.newRowsCount > 0 &&
                  (isUz ? `${unsavedDiff.newRowsCount} yangi qator` : `${unsavedDiff.newRowsCount} new rows`),
                unsavedDiff.deletedRowsCount > 0 &&
                  (isUz ? `${unsavedDiff.deletedRowsCount} ta qator o‘chirildi` : `${unsavedDiff.deletedRowsCount} rows deleted`),
                unsavedDiff.newColsCount > 0 &&
                  (isUz ? `${unsavedDiff.newColsCount} yangi ustun` : `${unsavedDiff.newColsCount} new columns`),
                unsavedDiff.deletedColsCount > 0 &&
                  (isUz ? `${unsavedDiff.deletedColsCount} ustun o‘chirildi` : `${unsavedDiff.deletedColsCount} columns deleted`),
                unsavedDiff.colsRenamed &&
                  (isUz ? `Ustun nomlari o‘zgartirildi` : `Column headers renamed`),
              ]
                .filter(Boolean)
                .join(' • ')}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSaveModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg shadow-sm transition cursor-pointer"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{isUz ? 'Google Sheets-ga saqlash' : 'Save to Google Sheet'}</span>
            </button>
          </div>
        </div>
      )}

      {/* GENERIC HEADERS DETECTED SMART BANNER */}
      {localColumns.some((c) => /^Column_\d+$/i.test(c.name)) && localRows.length > 0 && (
        <div className="bg-sky-500/10 border-b border-sky-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-sky-800 dark:text-sky-300">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
            <span>
              {isUz
                ? 'Jadval ustunlari Column_1, Column_2 deb ko‘rinmoqda. 1-qatorni haqiqiy ustun nomlari sifatida o‘rnatishni xohlaysizmi?'
                : 'Generic Column_X headers detected. Would you like to promote Row 1 as the true column headers?'}
            </span>
          </div>
          <button
            onClick={handlePromoteRowToHeaders}
            className="flex items-center space-x-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-sm transition cursor-pointer shrink-0 ml-3"
          >
            <Table className="w-3.5 h-3.5" />
            <span>{isUz ? '1-qatorni ustun nomlari qilish' : 'Promote Row 1 to Headers'}</span>
          </button>
        </div>
      )}

      {/* SUCCESS BANNER */}
      {saveSuccessMessage && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* TOP ACTION TOOLBAR */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/40">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isUz ? 'Qidiruv...' : 'Search rows...'}
              className="w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Undo / Redo (Section 42) */}
          <div className="flex items-center space-x-1 border-r border-slate-200 dark:border-slate-800 pr-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 transition ${
                historyIndex > 0
                  ? 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed text-slate-400'
              }`}
              title={isUz ? 'Bekor qilish (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 transition ${
                historyIndex < history.length - 1
                  ? 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed text-slate-400'
              }`}
              title={isUz ? 'Qaytarish (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Clean Data Button (Section 11) */}
          <button
            onClick={() => setIsCleanModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-medium text-xs transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isUz ? 'Tozalash' : 'Clean Data'}</span>
            {!qualityReport.isClean && (
              <span className="w-2 h-2 rounded-full bg-purple-500 ml-1"></span>
            )}
          </button>

          {/* Add Row Button (Section 13) */}
          <button
            onClick={() => {
              setNewRowData({});
              setIsAddRowModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isUz ? '+ Qator' : '+ Add Row'}</span>
          </button>

          {/* Add Column Button (Section 14) */}
          <button
            onClick={() => {
              setNewColName('');
              setIsAddColModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isUz ? '+ Ustun' : '+ Add Column'}</span>
          </button>

          {/* Promote Row 1 to Headers Toolbar Button */}
          {localRows.length > 0 && (
            <button
              onClick={handlePromoteRowToHeaders}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title={isUz ? '1-qatorni ustun nomlari sifatida o‘rnatish' : 'Promote Row 1 as Column Headers'}
            >
              <Table className="w-3.5 h-3.5 text-sky-500" />
              <span>{isUz ? 'Sarlavha qilish' : 'Promote Header'}</span>
            </button>
          )}

          {/* Download CSV / Excel (Section 43) */}
          <button
            onClick={handleDownloadCsv}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isUz ? 'CSV yuklab olish' : 'Download CSV'}</span>
          </button>

          {/* Copy cells for Google Sheets */}
          <button
            onClick={handleCopyTsv}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title={isUz ? 'Google Sheets-ga qo‘yish uchun katakchalarni nusxalash' : 'Copy cells formatted for Google Sheets'}
          >
            <Copy className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isUz ? 'Nusxalash' : 'Copy'}</span>
          </button>

          {/* Save to Google Sheet CTA */}
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{isUz ? 'Google Sheets-ga saqlash' : 'Save to Google Sheet'}</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR (Section 18) */}
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-900/20 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5" />
          <span>{isUz ? 'Filtr:' : 'Filter:'}</span>
        </span>

        <select
          value={activeFilterCol || ''}
          onChange={(e) => setActiveFilterCol(e.target.value || null)}
          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
        >
          <option value="">{isUz ? 'Ustun tanlang...' : 'Select column...'}</option>
          {localColumns.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {activeFilterCol && (
          <>
            <select
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="contains">{isUz ? 'O‘z ichiga oladi' : 'Contains'}</option>
              <option value="equals">{isUz ? 'Teng' : 'Equals'}</option>
              <option value="not_equals">{isUz ? 'Teng emas' : 'Not equals'}</option>
              <option value="greater_than">{isUz ? 'Katta' : 'Greater than (>)'}</option>
              <option value="less_than">{isUz ? 'Kichik' : 'Less than (<)'}</option>
              <option value="greater_than_or_equal">{isUz ? 'Katta yoki teng (>=)' : '>= '}</option>
              <option value="less_than_or_equal">{isUz ? 'Kichik yoki teng (<=)' : '<= '}</option>
            </select>

            <input
              type="text"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder={isUz ? 'Qiymat kiriting...' : 'Enter filter value...'}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 max-w-[160px]"
            />

            {(filterValue || activeFilterCol) && (
              <button
                onClick={() => {
                  setActiveFilterCol(null);
                  setFilterValue('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* SPREADSHEET TABLE WITH CONTINUOUS SCROLL */}
      <div className="overflow-auto max-h-[68vh] relative scrollbar-thin rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-inner">
        <table className="w-full text-left border-collapse text-xs min-w-max">
          <thead className="bg-slate-100 dark:bg-slate-950 sticky top-0 z-20 shadow-sm border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="sticky left-0 top-0 z-30 py-3 px-3 w-14 text-center text-slate-500 dark:text-slate-400 font-mono font-bold border-r border-b border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-950 shadow-sm">
                #
              </th>
              {localColumns.map((col) => {
                const currentType = col.manualTypeOverride || col.detectedType;
                const Icon = TYPE_ICONS[currentType] || HelpCircle;

                return (
                  <th
                    key={col.id}
                    className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800/60 min-w-[160px] select-none hover:bg-slate-200/50 dark:hover:bg-slate-900/60 transition"
                  >
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center space-x-1.5">
                        <div
                          className="flex items-center space-x-1.5 cursor-pointer"
                          onClick={() => handleSort(col.name)}
                        >
                          <span className="font-medium text-slate-900 dark:text-slate-100">{col.name}</span>
                          <ArrowUpDown
                            className={`w-3.5 h-3.5 transition-colors ${
                              sortColumn === col.name
                                ? 'text-emerald-500 dark:text-emerald-400'
                                : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                            }`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingCol({ oldName: col.name, newName: col.name });
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                          title={isUz ? 'Ustun nomini o‘zgartirish' : 'Rename column'}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Type Badge & Override dropdown */}
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

                        {activeTypeDropdown === col.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl py-1 z-30">
                            <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {isUz ? 'Turni oʻzgartirish' : 'Change Type'}
                            </div>
                            {ALL_TYPES.map((type) => {
                              const TypeI = TYPE_ICONS[type];
                              return (
                                <button
                                  key={type}
                                  onClick={() => handleColumnTypeChange(col.name, type)}
                                  className={`w-full text-left px-2 py-1 text-xs flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                                    currentType === type
                                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                      : 'text-slate-700 dark:text-slate-300'
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
              <th className="sticky right-0 top-0 z-30 py-3 px-3 w-20 text-center font-medium text-slate-500 dark:text-slate-400 border-l border-b border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-950 shadow-sm">
                {isUz ? 'Amallar' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {processedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={localColumns.length + 2}
                  className="py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  {isUz ? 'Qidiruv boʻyicha maʼlumot topilmadi.' : 'No records match your filter criteria.'}
                </td>
              </tr>
            ) : (
              processedRows.map((row, rIdx) => (
                <tr
                  key={row._rowIndex || row.id || rIdx}
                  className="hover:bg-slate-100/70 dark:hover:bg-slate-800/40 transition group font-mono text-slate-800 dark:text-slate-300"
                >
                  <td className="sticky left-0 z-10 py-2.5 px-3 text-center text-slate-500 dark:text-slate-400 select-none border-r border-slate-200 dark:border-slate-800/60 bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-sm font-semibold">
                    {row._rowIndex || rIdx + 1}
                  </td>
                  {localColumns.map((col) => {
                    const rawVal = row[col.name];
                    const displayVal =
                      rawVal === null || rawVal === undefined || rawVal === ''
                        ? '-'
                        : String(rawVal);

                    return (
                      <td
                        key={col.id}
                        className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800/40 truncate max-w-[240px]"
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
                  <td className="sticky right-0 z-10 py-2.5 px-3 text-center border-l border-slate-200 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
                    <div className="flex items-center justify-center space-x-1.5 opacity-60 group-hover:opacity-100 transition">
                      <button
                        onClick={() => setEditingRow({ ...row })}
                        className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                        title={isUz ? 'Tahrirlash' : 'Edit Row'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingRow(row);
                          setDeletingRowIndex(row._rowIndex || rIdx + 1);
                        }}
                        className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                        title={isUz ? 'Oʻchirish' : 'Delete Row'}
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

      {/* FOOTER STATUS BAR */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 rounded-b-2xl">
        <div className="flex items-center space-x-3">
          <span className="font-medium">
            {isUz ? 'Jami:' : 'Total:'}{' '}
            <strong className="text-slate-900 dark:text-slate-100 font-mono font-bold">
              {processedRows.length}
            </strong>{' '}
            {isUz ? 'ta qator' : 'rows'}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="font-medium">
            <strong className="text-slate-900 dark:text-slate-100 font-mono font-bold">
              {localColumns.length}
            </strong>{' '}
            {isUz ? 'ta ustun' : 'columns'}
          </span>
          {unsavedDiff.hasUnsaved && (
            <>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                ● {isUz ? 'Mahalliy tahrirlangan (Google Sheets saqlanmagan)' : 'Local changes pending'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ================= MODAL: ADD ROW (Section 13) ================= */}
      {isAddRowModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>{isUz ? 'Yangi qator qo‘shish' : 'Add New Row'}</span>
              </h3>
              <button
                onClick={() => setIsAddRowModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAddRow} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isUz
                  ? 'Qator dastlab SheetFlow ichida lokal paydo bo‘ladi. Google Sheets faqatgina saqlash tugmasi bosilganda o‘zgaradi.'
                  : 'New row initially appears locally inside SheetFlow. It will not modify Google Sheets until you explicitly save.'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {localColumns.map((col) => (
                  <div key={col.id} className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {col.name}
                    </label>
                    <input
                      type={col.detectedType === 'number' ? 'number' : col.detectedType === 'date' ? 'date' : 'text'}
                      value={newRowData[col.name] ?? ''}
                      onChange={(e) =>
                        setNewRowData({
                          ...newRowData,
                          [col.name]:
                            col.detectedType === 'number'
                              ? e.target.value === ''
                                ? null
                                : Number(e.target.value)
                              : e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRowModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {isUz ? 'Bekor qilish' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  {isUz ? 'Qatorni qo‘shish' : 'Add Row'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD COLUMN (Section 14) ================= */}
      {isAddColModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>{isUz ? 'Yangi ustun qo‘shish' : 'Add New Column'}</span>
              </h3>
              <button
                onClick={() => setIsAddColModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAddColumn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isUz ? 'Ustun nomi:' : 'Column name:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isUz ? 'Masalan: Daromad yoki Status' : 'e.g., Revenue, Status, Category'}
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isUz ? 'Ma’lumot turi (ixtiyoriy):' : 'Data type (optional):'}
                </label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as DetectedType)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="text">Text (Matn)</option>
                  <option value="number">Number (Raqam)</option>
                  <option value="currency">Currency (Valyuta)</option>
                  <option value="percentage">Percentage (Foiz)</option>
                  <option value="date">Date (Sana)</option>
                  <option value="category">Category (Kategoriya)</option>
                  <option value="boolean">Boolean (Ha/Yo‘q)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddColModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {isUz ? 'Bekor qilish' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  {isUz ? 'Ustun qo‘shish' : 'Add Column'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT ROW ================= */}
      {editingRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>
                  {isUz
                    ? `Qator #${editingRow._rowIndex} ni tahrirlash`
                    : `Edit Row #${editingRow._rowIndex}`}
                </span>
              </h3>
              <button
                onClick={() => setEditingRow(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {localColumns.map((col) => (
                  <div key={col.id} className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {col.name}
                    </label>
                    <input
                      type={col.detectedType === 'number' ? 'number' : 'text'}
                      value={editingRow[col.name] ?? ''}
                      onChange={(e) =>
                        setEditingRow({
                          ...editingRow,
                          [col.name]:
                            col.detectedType === 'number'
                              ? e.target.value === ''
                                ? null
                                : Number(e.target.value)
                              : e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isUz ? 'Bekor qilish' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmEditRow}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                {isUz ? 'O‘zgarishlarni saqlash' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {(deletingRowIndex !== null || deletingRow !== null) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isUz ? 'Qatorni o‘chirishni tasdiqlaysizmi?' : 'Delete this row?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isUz
                ? `Qator #${deletingRow?._rowIndex || deletingRowIndex} jadvaldan o‘chiriladi. Bu o‘zgarish Google Sheets va Neon bazasiga yuklanadi.`
                : `Row #${deletingRow?._rowIndex || deletingRowIndex} will be removed from spreadsheet.`}
            </p>
            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingRow(null);
                  setDeletingRowIndex(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isUz ? 'Bekor qilish' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRow}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/20 transition cursor-pointer"
              >
                {isUz ? 'O‘chirish' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: RENAME COLUMN ================= */}
      {renamingCol !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isUz ? 'Ustun nomini o‘zgartirish' : 'Rename Column'}
            </h3>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 dark:text-slate-400">
                {isUz ? 'Yangi ustun nomi:' : 'New column name:'}
              </label>
              <input
                type="text"
                autoFocus
                value={renamingCol.newName}
                onChange={(e) => setRenamingCol({ ...renamingCol, newName: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRenameCol();
                  if (e.key === 'Escape') setRenamingCol(null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRenamingCol(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isUz ? 'Bekor qilish' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmRenameCol}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                {isUz ? 'Saqlash' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SAVE TO GOOGLE SHEET (Section 16) ================= */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <CloudUpload className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>{isUz ? 'Google Sheets-ga saqlash' : 'Save to Google Sheet'}</span>
              </h3>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isUz ? 'Saqlanadigan barcha o‘zgarishlar:' : 'Changes to be saved:'}
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3.5 space-y-2 text-xs">
                {unsavedDiff.cellsChanged > 0 && (
                  <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>
                      {isUz
                        ? `${unsavedDiff.cellsChanged} ta katakcha o‘zgartirildi`
                        : `${unsavedDiff.cellsChanged} cell${unsavedDiff.cellsChanged > 1 ? 's' : ''} changed`}
                    </span>
                  </div>
                )}
                {unsavedDiff.newRowsCount > 0 && (
                  <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>
                      {isUz
                        ? `${unsavedDiff.newRowsCount} ta yangi qator qo‘shildi`
                        : `${unsavedDiff.newRowsCount} new row${unsavedDiff.newRowsCount > 1 ? 's' : ''}`}
                    </span>
                  </div>
                )}
                {unsavedDiff.deletedRowsCount > 0 && (
                  <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>
                      {isUz
                        ? `${unsavedDiff.deletedRowsCount} ta qator o‘chirildi`
                        : `${unsavedDiff.deletedRowsCount} row${unsavedDiff.deletedRowsCount > 1 ? 's' : ''} deleted`}
                    </span>
                  </div>
                )}
                {unsavedDiff.newColsCount > 0 && (
                  <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>
                      {isUz
                        ? `${unsavedDiff.newColsCount} ta yangi ustun yaratildi`
                        : `${unsavedDiff.newColsCount} new column${unsavedDiff.newColsCount > 1 ? 's' : ''}`}
                    </span>
                  </div>
                )}
                {unsavedDiff.deletedColsCount > 0 && (
                  <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>
                      {isUz
                        ? `${unsavedDiff.deletedColsCount} ta ustun o‘chirildi`
                        : `${unsavedDiff.deletedColsCount} column${unsavedDiff.deletedColsCount > 1 ? 's' : ''} deleted`}
                    </span>
                  </div>
                )}
                {unsavedDiff.colsRenamed && (
                  <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                    <span>{isUz ? 'Ustun nomlari yangilandi' : 'Column headers renamed'}</span>
                  </div>
                )}
                {!unsavedDiff.hasUnsaved && (
                  <p className="text-slate-500 dark:text-slate-400">
                    {isUz ? 'Hech qanday o‘zgarish kiritilmadi.' : 'No pending changes detected.'}
                  </p>
                )}
              </div>

              {/* Destination & Sync Configuration */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold">Neon PostgreSQL:</span>
                  </div>
                  <span className="text-[11px] font-bold">✓ Faol (Doim saqlanadi)</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Google Sheets Live Sync:
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAppsScriptGuideOpen(!isAppsScriptGuideOpen)}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {isAppsScriptGuideOpen
                        ? isUz ? 'Yopish' : 'Close'
                        : isUz ? '1-daqiqada avtomatik sozlash' : '1-minute auto-sync setup'}
                    </button>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] text-slate-600 dark:text-slate-400">
                      {isUz
                        ? 'Google Apps Script Webhook havolasi (Google Sheets-ga to‘g‘ridan-to‘g‘ri yozish uchun):'
                        : 'Google Apps Script Webhook URL (For direct write to Google Sheet):'}
                    </label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => {
                        setWebhookUrl(e.target.value);
                        localStorage.setItem(`sheetflow_webhook_${sheetData.metadata.id}`, e.target.value);
                        localStorage.setItem('sheetflow_global_webhook', e.target.value);
                      }}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  {isAppsScriptGuideOpen && (
                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {isUz ? 'Google Sheets-ga to‘g‘ridan-to‘g‘ri yozish kodi:' : 'Google Sheets direct write script:'}
                      </p>
                      <p className="text-[11px]">
                        {isUz
                          ? '1. Google Sheets -> Extensions -> Apps Script bo‘limiga kiring va quyidagi kodni qo‘ying:'
                          : '1. In Google Sheets, go to Extensions -> Apps Script and paste:'}
                      </p>
                      <div className="relative">
                        <pre className="p-2.5 rounded bg-slate-950 text-emerald-400 font-mono text-[10px] overflow-x-auto">
{`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = data.tabName ? ss.getSheetByName(data.tabName) : ss.getActiveSheet();
  sheet.clearContents();
  if (data.values && data.values.length > 0) {
    sheet.getRange(1, 1, data.values.length, data.values[0].length).setValues(data.values);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}`}
                        </pre>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`function doPost(e) {\n  var data = JSON.parse(e.postData.contents);\n  var ss = SpreadsheetApp.getActiveSpreadsheet();\n  var sheet = data.tabName ? ss.getSheetByName(data.tabName) : ss.getActiveSheet();\n  sheet.clearContents();\n  if (data.values && data.values.length > 0) {\n    sheet.getRange(1, 1, data.values.length, data.values[0].length).setValues(data.values);\n  }\n  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);\n}`);
                            setCopiedScript(true);
                            setTimeout(() => setCopiedScript(false), 3000);
                          }}
                          className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold"
                        >
                          {copiedScript ? (isUz ? 'Nusxalandi!' : 'Copied!') : (isUz ? 'Nusxalash' : 'Copy')}
                        </button>
                      </div>
                      <p className="text-[11px]">
                        {isUz
                          ? '2. Deploy -> New Deployment -> Web App (Execute as: Me, Who has access: Anyone) tanlang va berilgan havolani yuqoriga kiriting.'
                          : '2. Deploy -> New Deployment -> Web App (Access: Anyone) and paste the URL above.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {saveErrorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                  {saveErrorMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isUz ? 'Bekor qilish' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isSavingGoogleSheet}
                onClick={handleSaveToGoogleSheet}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                {isSavingGoogleSheet ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isUz ? 'Yuklanmoqda...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isUz ? 'Saqlash va Yuklash' : 'Save & Sync'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CLEAN DATA (Section 11) ================= */}
      {isCleanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                <span>{isUz ? 'Ma’lumotlarni tozalash' : 'Clean Data'}</span>
              </h3>
              <button
                onClick={() => setIsCleanModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Detected Quality Issues Overview */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {isUz ? 'Aniqlangan sifat muammolari' : 'Detected Quality Issues'}
                </h4>
                {qualityReport.isClean ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ {isUz ? 'Ma’lumotlar toza! Hech qanday sifat muammolari aniqlanmadi.' : 'Data looks clean! No formatting or duplicate issues found.'}
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3.5 space-y-1.5 text-xs">
                    {qualityReport.issues.map((iss, i) => (
                      <div key={i} className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{iss.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Proposed Operations Checkboxes */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {isUz ? 'Tavsiya etilgan amallar' : 'Proposed Cleaning Actions'}
                </h4>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanOptions.trimSpaces}
                      onChange={(e) => setCleanOptions({ ...cleanOptions, trimSpaces: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {isUz ? 'Ortiqcha bo‘sh joylarni olib tashlash (Trim spaces)' : 'Trim unnecessary leading & trailing spaces'}
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanOptions.removeDuplicateRows}
                      onChange={(e) => setCleanOptions({ ...cleanOptions, removeDuplicateRows: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {isUz ? 'Takroriy qatorlarni olib tashlash (Remove duplicate rows)' : 'Remove identical duplicate rows'}
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanOptions.convertNumbersAsText}
                      onChange={(e) => setCleanOptions({ ...cleanOptions, convertNumbersAsText: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {isUz ? 'Matn sifatida saqlangan raqamlarni sonlarga aylantirish' : 'Convert numbers stored as text into numbers'}
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanOptions.normalizeDates}
                      onChange={(e) => setCleanOptions({ ...cleanOptions, normalizeDates: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {isUz ? 'Sana formatlarini standartlashtirish (YYYY-MM-DD)' : 'Normalize dates into standard YYYY-MM-DD format'}
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanOptions.removeEmptyRows}
                      onChange={(e) => setCleanOptions({ ...cleanOptions, removeEmptyRows: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {isUz ? 'Bo‘sh qatorlarni olib tashlash' : 'Remove completely empty rows'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCleanModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isUz ? 'Bekor qilish' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteCleanData}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-600/20 transition cursor-pointer"
              >
                {isUz ? 'O‘zgarishlarni qo‘llash' : 'Apply Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
