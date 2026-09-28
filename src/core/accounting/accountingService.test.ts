import { describe, it, expect } from 'vitest';
import { accountingService } from './accountingService';
import { economyService } from '../economy/economyService';

describe('Accounting & Economy Modules (Sections 53–97)', () => {
  describe('Double-Entry Accounting Engine (Section 55 & 56)', () => {
    it('rejects posting an unbalanced journal entry where Total Debit != Total Credit', () => {
      expect(() => {
        accountingService.createJournalEntry({
          date: '2026-03-01',
          description: 'Unbalanced Transaction Test',
          reference: 'REF-ERR',
          lines: [
            {
              accountId: '1010', // Cash
              debit: 1000,
              credit: 0,
            },
            {
              accountId: '4010', // Sales Revenue
              debit: 0,
              credit: 900, // $100 discrepancy
            },
          ],
        });
      }).toThrow(/imbalance/i);
    });

    it('posts a balanced journal entry and updates balances (Section 55)', () => {
      const initialCash = accountingService.getAccountById('acc_1010')?.balance || 0;
      const initialRev = accountingService.getAccountById('acc_4010')?.balance || 0;

      const entry = accountingService.createJournalEntry({
        date: '2026-03-01',
        description: 'Product Sale for Cash',
        reference: 'INV-TEST-001',
        status: 'Posted',
        lines: [
          {
            accountId: 'acc_1010',
            debit: 1500,
            credit: 0,
          },
          {
            accountId: 'acc_4010',
            debit: 0,
            credit: 1500,
          },
        ],
      });

      expect(entry.status).toBe('Posted');
      expect(entry.totalDebit).toBe(1500);
      expect(entry.totalCredit).toBe(1500);

      const updatedCash = accountingService.getAccountById('acc_1010')?.balance || 0;
      const updatedRev = accountingService.getAccountById('acc_4010')?.balance || 0;

      // Asset debit increases balance
      expect(updatedCash).toBe(initialCash + 1500);
      // Revenue credit increases balance
      expect(updatedRev).toBe(initialRev + 1500);
    });

    it('generates a balanced Trial Balance where Total Debit = Total Credit (Section 58)', () => {
      const tb = accountingService.getTrialBalance();
      expect(tb.totalDebit).toBe(tb.totalCredit);
      expect(tb.isBalanced).toBe(true);
      expect(tb.difference).toBe(0);
    });

    it('reverses a posted journal entry with storno/contra lines (Section 56)', () => {
      const entry = accountingService.createJournalEntry({
        date: '2026-03-02',
        description: 'Temporary Entry to Reverse',
        reference: 'REV-001',
        status: 'Posted',
        lines: [
          {
            accountId: 'acc_1010',
            debit: 500,
            credit: 0,
          },
          {
            accountId: 'acc_4010',
            debit: 0,
            credit: 500,
          },
        ],
      });

      const cashBefore = accountingService.getAccountById('acc_1010')?.balance || 0;
      const reversal = accountingService.reverseJournalEntry(entry.id, 'Customer cancellation');

      expect(reversal.status).toBe('Posted');
      expect(reversal.description).toContain('Reversal');

      const cashAfter = accountingService.getAccountById('acc_1010')?.balance || 0;
      expect(cashAfter).toBe(cashBefore - 500);
    });
  });

  describe('Economy Engine & Models (Sections 75–84)', () => {
    it('calculates CAGR accurately (Section 75)', () => {
      // 100 to 200 over 5 years => ~14.87%
      const cagr = economyService.calculateCAGR(100, 200, 5);
      expect(cagr).toBeCloseTo(14.87, 1);
    });

    it('calculates Real vs Nominal deflator and loss (Section 78)', () => {
      const impact = economyService.calculateInflationImpact(1000, 10); // 10% inflation
      expect(impact.realValue).toBeCloseTo(909.09, 1);
      expect(impact.purchasingPowerLossPercent).toBeCloseTo(9.09, 1);
    });

    it('calculates Break-Even Analysis (Section 82)', () => {
      // Fixed: 10,000, Variable: 20, Selling: 40 => Margin: 20 => Break-Even: 500 units, Revenue: 20,000
      const be = economyService.calculateBreakEven(10000, 20, 40);
      expect(be.breakEvenUnits).toBe(500);
      expect(be.breakEvenRevenue).toBe(20000);
      expect(be.contributionMargin).toBe(20);
      expect(be.contributionMarginRatio).toBe(50);
    });

    it('calculates Price Elasticity of Demand (Section 83)', () => {
      // Price increases from 10 to 12 (+20%), Quantity decreases from 100 to 70 (-30%) => |Ed| = 1.5 (Elastic)
      const el = economyService.calculatePriceElasticity(10, 12, 100, 70);
      expect(el.elasticityCoefficient).toBe(1.5);
      expect(el.elasticityType).toBe('Elastic');
    });

    it('calculates Correlation and outputs mandatory disclaimer (Section 80)', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const res = economyService.calculateCorrelation(x, y, 'X', 'Y');
      expect(res.correlationCoefficient).toBe(1);
      expect(res.strength).toBe('Strong Positive');
      expect(res.disclaimer).toBe('Correlation indicates statistical association and does not by itself establish causation.');
    });
  });
});
