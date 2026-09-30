import { DataQualityReport, DataQualityIssue, ProposedCleaningActions } from '../types/cleaner';
import { ColumnDefinition } from '../types/sheet';
import { isNullOrEmpty } from '../detector/typeDetector';

export interface CleaningOptions {
  trimSpaces?: boolean;
  removeDuplicateRows?: boolean;
  convertNumbersAsText?: boolean;
  normalizeDates?: boolean;
  removeEmptyRows?: boolean;
}

export interface CleaningResult {
  cleanedRows: Record<string, any>[];
  appliedChanges: {
    spacesTrimmed: number;
    duplicatesRemoved: number;
    numbersConverted: number;
    datesNormalized: number;
    emptyRowsRemoved: number;
  };
  summary: string[];
}

/**
 * Checks data quality across all rows and columns.
 */
export function checkDataQuality(
  rows: Record<string, any>[],
  columns: ColumnDefinition[]
): DataQualityReport {
  let emptyCellsCount = 0;
  let emptyRowsCount = 0;
  let duplicateRowsCount = 0;
  let numbersAsTextCount = 0;
  let invalidDatesCount = 0;
  let extraSpacesCount = 0;

  const issues: DataQualityIssue[] = [];
  const columnEmptyCounts: Record<string, number> = {};
  const columnSpacesCounts: Record<string, number> = {};
  const columnNumAsTextCounts: Record<string, number> = {};
  const columnInvalidDateCounts: Record<string, number> = {};

  columns.forEach((c) => {
    columnEmptyCounts[c.name] = 0;
    columnSpacesCounts[c.name] = 0;
    columnNumAsTextCounts[c.name] = 0;
    columnInvalidDateCounts[c.name] = 0;
  });

  // Track duplicate rows
  const seenRowSignatures = new Map<string, number>();
  const duplicateIndices: number[] = [];

  rows.forEach((row, rowIndex) => {
    // Check if entire row is empty
    const nonBlankKeys = columns.filter((c) => !isNullOrEmpty(row[c.name]));
    if (nonBlankKeys.length === 0) {
      emptyRowsCount++;
      return;
    }

    // Check duplicates
    const sig = JSON.stringify(row);
    if (seenRowSignatures.has(sig)) {
      duplicateRowsCount++;
      duplicateIndices.push(rowIndex);
    } else {
      seenRowSignatures.set(sig, rowIndex);
    }

    // Inspect individual cells
    columns.forEach((col) => {
      const val = row[col.name];
      if (isNullOrEmpty(val)) {
        emptyCellsCount++;
        columnEmptyCounts[col.name] = (columnEmptyCounts[col.name] || 0) + 1;
        return;
      }

      if (typeof val === 'string') {
        // Extra spaces check
        if (val.trim() !== val) {
          extraSpacesCount++;
          columnSpacesCounts[col.name] = (columnSpacesCounts[col.name] || 0) + 1;
        }

        const trimmed = val.trim();

        // Check if string can be a clean number (stored as text)
        if (
          col.detectedType === 'number' ||
          col.detectedType === 'currency' ||
          col.detectedType === 'percentage'
        ) {
          const cleanedNumStr = trimmed.replace(/[\$,€,UZS,%,]/g, '').trim();
          if (!isNaN(Number(cleanedNumStr)) && cleanedNumStr !== '') {
            numbersAsTextCount++;
            columnNumAsTextCounts[col.name] = (columnNumAsTextCounts[col.name] || 0) + 1;
          }
        }

        // Check invalid dates
        if (col.detectedType === 'date') {
          const timestamp = Date.parse(trimmed);
          if (isNaN(timestamp)) {
            invalidDatesCount++;
            columnInvalidDateCounts[col.name] = (columnInvalidDateCounts[col.name] || 0) + 1;
          }
        }
      }
    });
  });

  // Build issues breakdown
  if (emptyCellsCount > 0) {
    Object.entries(columnEmptyCounts)
      .filter(([_, count]) => count > 0)
      .forEach(([col, count]) => {
        issues.push({
          type: 'empty_cell',
          column: col,
          count,
          description: `${count} missing value${count > 1 ? 's' : ''} in ${col}`,
        });
      });
  }

  if (duplicateRowsCount > 0) {
    issues.push({
      type: 'duplicate_row',
      count: duplicateRowsCount,
      sampleRows: duplicateIndices.slice(0, 5),
      description: `${duplicateRowsCount} duplicate row${duplicateRowsCount > 1 ? 's' : ''} detected`,
    });
  }

  if (emptyRowsCount > 0) {
    issues.push({
      type: 'empty_row',
      count: emptyRowsCount,
      description: `${emptyRowsCount} completely empty row${emptyRowsCount > 1 ? 's' : ''}`,
    });
  }

  if (extraSpacesCount > 0) {
    issues.push({
      type: 'extra_spaces',
      count: extraSpacesCount,
      description: `${extraSpacesCount} cell${extraSpacesCount > 1 ? 's' : ''} with leading or trailing whitespace`,
    });
  }

  if (numbersAsTextCount > 0) {
    issues.push({
      type: 'number_as_text',
      count: numbersAsTextCount,
      description: `${numbersAsTextCount} numeric value${numbersAsTextCount > 1 ? 's' : ''} stored as text`,
    });
  }

  if (invalidDatesCount > 0) {
    issues.push({
      type: 'invalid_date',
      count: invalidDatesCount,
      description: `${invalidDatesCount} unparseable date value${invalidDatesCount > 1 ? 's' : ''}`,
    });
  }

  const totalIssuesCount =
    emptyCellsCount +
    emptyRowsCount +
    duplicateRowsCount +
    extraSpacesCount +
    numbersAsTextCount +
    invalidDatesCount;

  return {
    totalIssuesCount,
    emptyCellsCount,
    emptyRowsCount,
    duplicateRowsCount,
    numbersAsTextCount,
    invalidDatesCount,
    extraSpacesCount,
    issues,
    isClean: totalIssuesCount === 0,
  };
}

/**
 * Calculates proposed cleaning actions and impact summary before applying changes.
 */
export function getProposedCleaningActions(report: DataQualityReport): ProposedCleaningActions {
  const summary: string[] = [];

  if (report.extraSpacesCount > 0) {
    summary.push(`${report.extraSpacesCount} spaces removed`);
  }
  if (report.duplicateRowsCount > 0) {
    summary.push(`${report.duplicateRowsCount} duplicate rows removed`);
  }
  if (report.numbersAsTextCount > 0) {
    summary.push(`${report.numbersAsTextCount} numeric values converted`);
  }
  if (report.emptyRowsCount > 0) {
    summary.push(`${report.emptyRowsCount} empty rows removed`);
  }
  if (report.invalidDatesCount > 0) {
    summary.push(`${report.invalidDatesCount} date formats normalized`);
  }

  return {
    trimSpacesCount: report.extraSpacesCount,
    duplicateRowsCount: report.duplicateRowsCount,
    convertNumbersCount: report.numbersAsTextCount,
    normalizeDatesCount: report.invalidDatesCount,
    removeEmptyRowsCount: report.emptyRowsCount,
    summary,
  };
}

/**
 * Cleans the rows according to confirmed options. Changes are local and return a clean dataset.
 */
export function applyDataCleaning(
  rows: Record<string, any>[],
  columns: ColumnDefinition[],
  options: CleaningOptions = {
    trimSpaces: true,
    removeDuplicateRows: true,
    convertNumbersAsText: true,
    normalizeDates: true,
    removeEmptyRows: true,
  }
): CleaningResult {
  let spacesTrimmed = 0;
  let duplicatesRemoved = 0;
  let numbersConverted = 0;
  let datesNormalized = 0;
  let emptyRowsRemoved = 0;

  const seenSignatures = new Set<string>();
  const cleanedRows: Record<string, any>[] = [];

  for (const rawRow of rows) {
    // 1. Check empty row
    if (options.removeEmptyRows) {
      const isBlank = columns.every((c) => isNullOrEmpty(rawRow[c.name]));
      if (isBlank) {
        emptyRowsRemoved++;
        continue;
      }
    }

    const rowCopy: Record<string, any> = { ...rawRow };

    // 2. Cell transformations (trim spaces, convert numbers, normalize dates)
    columns.forEach((col) => {
      const val = rowCopy[col.name];
      if (typeof val === 'string') {
        let current = val;

        // Trim spaces
        if (options.trimSpaces && current.trim() !== current) {
          spacesTrimmed++;
          current = current.trim();
        }

        // Convert numbers stored as text
        if (options.convertNumbersAsText) {
          const type = col.detectedType;
          if (type === 'number' || type === 'currency' || type === 'percentage') {
            const cleanedNumStr = current.replace(/[\$,€,UZS,%,]/g, '').trim();
            if (cleanedNumStr !== '' && !isNaN(Number(cleanedNumStr))) {
              numbersConverted++;
              rowCopy[col.name] = Number(cleanedNumStr);
              return;
            }
          }
        }

        // Normalize dates to YYYY-MM-DD
        if (options.normalizeDates && col.detectedType === 'date') {
          const ts = Date.parse(current);
          if (!isNaN(ts)) {
            const d = new Date(ts);
            const isoDate = d.toISOString().substring(0, 10);
            if (isoDate !== current) {
              datesNormalized++;
              current = isoDate;
            }
          }
        }

        rowCopy[col.name] = current;
      }
    });

    // 3. Duplicate row check
    if (options.removeDuplicateRows) {
      const sig = JSON.stringify(rowCopy);
      if (seenSignatures.has(sig)) {
        duplicatesRemoved++;
        continue;
      }
      seenSignatures.add(sig);
    }

    cleanedRows.push(rowCopy);
  }

  const summary: string[] = [];
  if (spacesTrimmed > 0) summary.push(`${spacesTrimmed} spaces removed`);
  if (duplicatesRemoved > 0) summary.push(`${duplicatesRemoved} duplicate rows removed`);
  if (numbersConverted > 0) summary.push(`${numbersConverted} numbers converted`);
  if (datesNormalized > 0) summary.push(`${datesNormalized} dates normalized`);
  if (emptyRowsRemoved > 0) summary.push(`${emptyRowsRemoved} empty rows removed`);

  return {
    cleanedRows,
    appliedChanges: {
      spacesTrimmed,
      duplicatesRemoved,
      numbersConverted,
      datesNormalized,
      emptyRowsRemoved,
    },
    summary,
  };
}
