import { describe, it, expect } from 'vitest';
import { checkDataQuality, getProposedCleaningActions, applyDataCleaning } from './dataCleaner';
import { ColumnDefinition } from '../types/sheet';

describe('Data Quality Check & Cleaning (Sections 10 & 11)', () => {
  const columns: ColumnDefinition[] = [
    { id: 'c0', name: 'Product', index: 0, detectedType: 'text', nullCount: 0, uniqueCount: 2, nullable: false, sampleValues: [] },
    { id: 'c1', name: 'Price', index: 1, detectedType: 'number', nullCount: 0, uniqueCount: 3, nullable: false, sampleValues: [] },
    { id: 'c2', name: 'Date', index: 2, detectedType: 'date', nullCount: 0, uniqueCount: 3, nullable: false, sampleValues: [] },
  ];

  const messyRows = [
    { Product: '  Phone  ', Price: '12000', Date: '2026-08-01' },
    { Product: 'Laptop', Price: 25000, Date: '2026-08-02' },
    { Product: 'Laptop', Price: 25000, Date: '2026-08-02' }, // duplicate
    { Product: '', Price: null, Date: null }, // empty row
    { Product: 'Tablet', Price: ' 15000 ', Date: 'invalid-date' }, // invalid date, number as text, space
  ];

  it('detects empty cells, duplicate rows, invalid dates, extra spaces, numbers as text', () => {
    const report = checkDataQuality(messyRows, columns);
    expect(report.isClean).toBe(false);
    expect(report.duplicateRowsCount).toBe(1);
    expect(report.emptyRowsCount).toBe(1);
    expect(report.extraSpacesCount).toBeGreaterThan(0);
    expect(report.numbersAsTextCount).toBeGreaterThan(0);
    expect(report.invalidDatesCount).toBe(1);
  });

  it('generates clear proposed actions preview', () => {
    const report = checkDataQuality(messyRows, columns);
    const proposed = getProposedCleaningActions(report);
    expect(proposed.duplicateRowsCount).toBe(1);
    expect(proposed.removeEmptyRowsCount).toBe(1);
    expect(proposed.summary.length).toBeGreaterThan(0);
  });

  it('applies data cleaning locally and removes duplicates, empty rows, trims whitespace', () => {
    const result = applyDataCleaning(messyRows, columns, {
      trimSpaces: true,
      removeDuplicateRows: true,
      convertNumbersAsText: true,
      normalizeDates: true,
      removeEmptyRows: true,
    });

    expect(result.appliedChanges.duplicatesRemoved).toBe(1);
    expect(result.appliedChanges.emptyRowsRemoved).toBe(1);
    expect(result.cleanedRows.length).toBe(3); // 5 - 1 duplicate - 1 empty = 3

    // Check trimmed and converted
    const phoneRow = result.cleanedRows.find((r) => r.Product === 'Phone');
    expect(phoneRow).toBeDefined();
    expect(phoneRow?.Price).toBe(12000); // converted from string '12000' to number
  });
});
