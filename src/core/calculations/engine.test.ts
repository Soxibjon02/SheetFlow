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

  it('calculates COUNTIF correctly', () => {
    const result = calculate(sampleScores, {
      function: 'COUNTIF',
      column: 'Passed',
      parameters: { targetValue: 'Yes', operator: 'equals' },
    });
    expect(result.value).toBe(2);
  });

  it('calculates SUMIF correctly', () => {
    const result = calculate(sampleScores, {
      function: 'SUMIF',
      column: 'Score',
      parameters: { conditionColumn: 'Passed', targetValue: 'Yes', operator: 'equals' },
    });
    expect(result.value).toBe(70); // 30 + 40 = 70
  });

  it('calculates AVERAGEIF correctly', () => {
    const result = calculate(sampleScores, {
      function: 'AVERAGEIF',
      column: 'Score',
      parameters: { conditionColumn: 'City', targetValue: 'Samarkand', operator: 'equals' },
    });
    expect(result.value).toBe(20); // (10 + 30) / 2 = 20
  });

  it('calculates PERCENTAGE correctly', () => {
    const result = calculate(sampleScores, {
      function: 'PERCENTAGE',
      column: 'Passed',
      parameters: { targetValue: 'Yes', operator: 'equals' },
    });
    expect(result.value).toBe(50); // 2 out of 4 = 50%
  });

  it('calculates GROWTH_PERCENTAGE correctly', () => {
    const result = calculate(sampleScores, {
      function: 'GROWTH_PERCENTAGE',
      column: 'Score',
    });
    // First 10, last 40 -> ((40 - 10) / 10) * 100 = 300%
    expect(result.value).toBe(300);
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
