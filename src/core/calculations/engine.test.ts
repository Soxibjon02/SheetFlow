import { describe, it, expect } from 'vitest';
import { calculate } from './engine';
import { detectValueType, detectColumnDefinition } from '../detector/typeDetector';
import { applyFilters } from '../filter/filterEngine';

describe('Calculation Engine (Section 45 & 46 Requirements)', () => {
  const sampleScores = [
    { Student: 'Ali', City: 'Samarkand', Score: 10, Passed: 'No' },
    { Student: 'Vali', City: 'Tashkent', Score: 20, Passed: 'No' },
    { Student: 'Gani', City: 'Samarkand', Score: 30, Passed: 'Yes' },
    { Student: 'Zarina', City: 'Tashkent', Score: 40, Passed: 'Yes' },
  ];

  it('calculates AVERAGE correctly (Section 46: expected 25)', () => {
    const result = calculate(sampleScores, {
      function: 'AVERAGE',
      column: 'Score',
    });
    expect(result.value).toBe(25);
  });

  it('calculates SUM correctly (Section 46: expected 100)', () => {
    const result = calculate(sampleScores, {
      function: 'SUM',
      column: 'Score',
    });
    expect(result.value).toBe(100);
  });

  it('calculates MAX correctly (Section 46: expected 40)', () => {
    const result = calculate(sampleScores, {
      function: 'MAX',
      column: 'Score',
    });
    expect(result.value).toBe(40);
  });

  it('calculates MIN correctly (Section 46: expected 10)', () => {
    const result = calculate(sampleScores, {
      function: 'MIN',
      column: 'Score',
    });
    expect(result.value).toBe(10);
  });

  it('calculates COUNT correctly (Section 46: expected 4)', () => {
    const result = calculate(sampleScores, {
      function: 'COUNT',
      column: 'Score',
    });
    expect(result.value).toBe(4);
  });

  it('calculates GroupBy correctly (Section 10: Score by City)', () => {
    const result = calculate(sampleScores, {
      function: 'AVERAGE',
      column: 'Score',
      groupBy: 'City',
    });
    expect(Array.isArray(result.value)).toBe(true);
    const groups = result.value as { group: string; value: number }[];
    const samarkand = groups.find((g) => g.group === 'Samarkand');
    const tashkent = groups.find((g) => g.group === 'Tashkent');
    expect(samarkand?.value).toBe(20); // (10 + 30) / 2 = 20
    expect(tashkent?.value).toBe(30); // (20 + 40) / 2 = 30
  });

  it('calculates PERCENTAGE correctly', () => {
    const result = calculate(sampleScores, {
      function: 'PERCENTAGE',
      column: 'Passed',
      parameters: { targetValue: 'Yes', operator: 'equals' },
    });
    expect(result.value).toBe(50); // 2 out of 4 = 50%
  });

  it('calculates PERCENTAGE_CHANGE correctly', () => {
    const result = calculate(sampleScores, {
      function: 'PERCENTAGE_CHANGE',
      column: 'Score',
    });
    // First 10, last 40 -> ((40 - 10) / 10) * 100 = 300%
    expect(result.value).toBe(300);
  });

  const salesRecords = [
    { Date: '2026-01-15', Category: 'Electronics', Product: 'Laptop', Revenue: 1000 },
    { Date: '2026-01-20', Category: 'Electronics', Product: 'Phone', Revenue: 500 },
    { Date: '2026-02-10', Category: 'Furniture', Product: 'Desk', Revenue: 300 },
    { Date: '2026-02-25', Category: 'Electronics', Product: 'Laptop', Revenue: 1200 },
    { Date: '2026-03-05', Category: 'Furniture', Product: 'Chair', Revenue: 200 },
  ];

  it('calculates COUNT_UNIQUE correctly (Section 22: count unique categories and products)', () => {
    const result = calculate(salesRecords, {
      function: 'COUNT_UNIQUE',
      column: 'Category',
    });
    expect(result.value).toBe(2); // Electronics, Furniture

    const productUniques = calculate(salesRecords, {
      function: 'COUNT_UNIQUE',
      column: 'Product',
    });
    expect(productUniques.value).toBe(4); // Laptop, Phone, Desk, Chair
  });

  it('calculates COMPARE_CATEGORIES correctly', () => {
    const result = calculate(salesRecords, {
      function: 'COMPARE_CATEGORIES',
      column: 'Category',
      parameters: { valueColumn: 'Revenue' },
    });
    expect(Array.isArray(result.value)).toBe(true);
    const groups = result.value as { group: string; value: number }[];
    const electronics = groups.find((g) => g.group === 'Electronics');
    const furniture = groups.find((g) => g.group === 'Furniture');
    expect(electronics?.value).toBe(2700); // 1000 + 500 + 1200
    expect(furniture?.value).toBe(500); // 300 + 200
  });

  it('calculates COMPARE_PERIODS correctly', () => {
    const result = calculate(salesRecords, {
      function: 'COMPARE_PERIODS',
      column: 'Date',
      parameters: { valueColumn: 'Revenue', dateColumn: 'Date' },
    });
    expect(Array.isArray(result.value)).toBe(true);
    const periods = result.value as { group: string; value: number }[];
    expect(periods.length).toBe(2);
    expect(periods[0].group).toBe('Previous Period');
    expect(periods[1].group).toBe('Current Period');
  });

  it('calculates MONTHLY_TOTAL correctly', () => {
    const result = calculate(salesRecords, {
      function: 'MONTHLY_TOTAL',
      column: 'Date',
      parameters: { valueColumn: 'Revenue', dateColumn: 'Date' },
    });
    expect(Array.isArray(result.value)).toBe(true);
    const months = result.value as { group: string; value: number }[];
    expect(months.find((m) => m.group === '2026-01')?.value).toBe(1500);
    expect(months.find((m) => m.group === '2026-02')?.value).toBe(1500);
    expect(months.find((m) => m.group === '2026-03')?.value).toBe(200);
  });

  it('calculates DAILY_TOTAL correctly', () => {
    const result = calculate(salesRecords, {
      function: 'DAILY_TOTAL',
      column: 'Date',
      parameters: { valueColumn: 'Revenue', dateColumn: 'Date' },
    });
    expect(Array.isArray(result.value)).toBe(true);
    const days = result.value as { group: string; value: number }[];
    expect(days.find((d) => d.group === '2026-01-15')?.value).toBe(1000);
  });

  it('calculates YEARLY_TOTAL correctly', () => {
    const result = calculate(salesRecords, {
      function: 'YEARLY_TOTAL',
      column: 'Date',
      parameters: { valueColumn: 'Revenue', dateColumn: 'Date' },
    });
    expect(Array.isArray(result.value)).toBe(true);
    const years = result.value as { group: string; value: number }[];
    expect(years[0].group).toBe('2026');
    expect(years[0].value).toBe(3200);
  });

  it('calculates GROWTH correctly', () => {
    const result = calculate(salesRecords, {
      function: 'GROWTH',
      column: 'Revenue',
      parameters: { dateColumn: 'Date' },
    });
    // First revenue 1000, last revenue 200 -> ((200 - 1000)/1000)*100 = -80%
    expect(result.value).toBe(-80);
  });

  it('calculates SORT correctly', () => {
    const result = calculate(salesRecords, {
      function: 'SORT',
      column: 'Revenue',
      parameters: { direction: 'desc' },
    });
    const sorted = result.value as typeof salesRecords;
    expect(sorted[0].Revenue).toBe(1200);
    expect(sorted[sorted.length - 1].Revenue).toBe(200);
  });
});

describe('Data Type Detection (Section 9)', () => {
  it('detects number, currency, percentage, date, category correctly', () => {
    expect(detectValueType('Ali')).toBe('text');
    expect(detectValueType('19')).toBe('number');
    expect(detectValueType('87.5')).toBe('number');
    expect(detectValueType('2026-09-27')).toBe('date');
    expect(detectValueType('87%')).toBe('percentage');
    expect(detectValueType('$1500')).toBe('currency');
    expect(detectValueType('Yes')).toBe('boolean');
  });

  it('detects categorical column on low cardinality text values', () => {
    const cities = ['Samarkand', 'Tashkent', 'Bukhara', 'Samarkand', 'Tashkent', 'Samarkand'];
    const colDef = detectColumnDefinition('City', 0, cities);
    expect(colDef.detectedType).toBe('category');
  });
});

describe('Filter Engine (Section 14)', () => {
  const records = [
    { Name: 'Ali', Score: 85, City: 'Samarkand' },
    { Name: 'Vali', Score: 60, City: 'Tashkent' },
    { Name: 'Gani', Score: 92, City: 'Samarkand' },
  ];

  it('filters by Score > 80', () => {
    const filtered = applyFilters(records, [
      { column: 'Score', operator: 'greater_than', value: 80 },
    ]);
    expect(filtered.length).toBe(2);
  });

  it('filters by City = Samarkand AND Score > 90', () => {
    const filtered = applyFilters(records, {
      logic: 'AND',
      conditions: [
        { column: 'City', operator: 'equals', value: 'Samarkand' },
        { column: 'Score', operator: 'greater_than', value: 90 },
      ],
    });
    expect(filtered.length).toBe(1);
    expect(filtered[0].Name).toBe('Gani');
  });
});
