import { describe, it, expect } from 'vitest';
import { detectHeaderRow, normalizeRawGrid } from './index';

describe('Header Detection (detectHeaderRow)', () => {
  it('detects headers when row 0 is a title banner', () => {
    const rawGrid = [
      ["O'QUV MARKAZI — OYLIK TO'LOVLAR JADVALI", '', '', '', ''],
      ['T/r', "O'quvchi F.I.Sh", 'Telefon', 'Maktab', 'Sinf'],
      ['1', 'Abdullayev Aziz', '+998 90 554 77 37', '66-maktab', '8'],
      ['2', 'Karimov Sardor', '+998 93 111 22 33', '10-maktab', '9'],
    ];

    const result = detectHeaderRow(rawGrid);
    expect(result.headerRowIndex).toBe(1);
    expect(result.titleBanner).toBe("O'QUV MARKAZI — OYLIK TO'LOVLAR JADVALI");
    expect(result.headers).toEqual(['T/r', "O'quvchi F.I.Sh", 'Telefon', 'Maktab', 'Sinf']);
    expect(result.dataRows.length).toBe(2);
    expect(result.dataRows[0][1]).toBe('Abdullayev Aziz');
  });

  it('adopts title banner as sheet name in normalizeRawGrid', () => {
    const rawGrid = [
      ["O'QUV MARKAZI — OYLIK TO'LOVLAR JADVALI", '', '', '', ''],
      ['T/r', "O'quvchi F.I.Sh", 'Telefon', 'Maktab', 'Sinf'],
      ['1', 'Abdullayev Aziz', '+998 90 554 77 37', '66-maktab', '8'],
    ];

    const sheet = normalizeRawGrid('Google Sheet (1c8Bmk9ta2)', rawGrid, 'test_sheet');
    expect(sheet.metadata.name).toBe("O'QUV MARKAZI — OYLIK TO'LOVLAR JADVALI");
    expect(sheet.headers).toEqual(['T/r', "O'quvchi F.I.Sh", 'Telefon', 'Maktab', 'Sinf']);
    expect(sheet.rows.length).toBe(1);
    expect(sheet.rows[0]["O'quvchi F.I.Sh"]).toBe('Abdullayev Aziz');
  });

  it('correctly keeps standard headers when row 0 is already headers', () => {
    const rawGrid = [
      ['Name', 'Age', 'City'],
      ['Alice', '25', 'Tashkent'],
      ['Bob', '30', 'Samarkand'],
    ];

    const result = detectHeaderRow(rawGrid);
    expect(result.headerRowIndex).toBe(0);
    expect(result.headers).toEqual(['Name', 'Age', 'City']);
    expect(result.dataRows.length).toBe(2);
  });
});
