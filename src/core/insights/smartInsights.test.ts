import { describe, it, expect } from 'vitest';
import { generateSmartInsights } from './smartInsights';

describe('Smart Insights (Sections 39 & 40)', () => {
  it('generates highest, lowest, and distribution insights for grouped results', () => {
    const groupedResult = [
      { group: 'Laptop', value: 400 },
      { group: 'Phone', value: 350 },
      { group: 'Tablet', value: 250 },
    ];

    const insights = generateSmartInsights({
      functionId: 'COMPARE_CATEGORIES',
      column: 'Revenue',
      groupBy: 'Product',
      result: groupedResult,
      language: 'en',
      currency: 'USD',
    });

    expect(insights.length).toBeGreaterThanOrEqual(3);
    const highest = insights.find((i) => i.type === 'highest');
    const lowest = insights.find((i) => i.type === 'lowest');
    const share = insights.find((i) => i.type === 'distribution');

    expect(highest?.description).toContain('Laptop');
    expect(highest?.description).toContain('400');
    expect(lowest?.description).toContain('Tablet');
    expect(share?.description).toContain('Laptop');
  });

  it('generates growth rate insights for GROWTH function', () => {
    const insights = generateSmartInsights({
      functionId: 'GROWTH',
      column: 'Sales',
      result: 18.5,
      language: 'en',
    });

    const growthInsight = insights.find((i) => i.type === 'trend_up');
    expect(growthInsight).toBeDefined();
    expect(growthInsight?.metric).toBe('+18.5%');
    expect(growthInsight?.description).toContain('18.5%');
  });

  it('generates Uzbek insights when language is uz', () => {
    const insights = generateSmartInsights({
      functionId: 'GROWTH',
      column: 'Daromad',
      result: 22,
      language: 'uz',
    });

    const growthInsight = insights.find((i) => i.type === 'trend_up');
    expect(growthInsight?.title).toBe('O‘sish sur’ati');
    expect(growthInsight?.description).toContain('Daromad 22% ga ijobiy o‘sdi');
  });
});
